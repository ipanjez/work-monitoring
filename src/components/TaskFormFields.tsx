'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { 
  X, UserPlus, Users, Plus, Paperclip, File, Eye, ArrowUp, ArrowDown, 
  Info, GripVertical, FileText, FileDown, Trash2, MapPin, ChevronDown, Check,
  User, Calendar, UploadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import { FileItem, SubTask, handleMarkdownShortcut, formatDescription } from '@/utils/taskUtils';
import toast from 'react-hot-toast';
import { EditingTaskType } from './TaskAddEditModal';
import { useTheme } from '@/context/ThemeContext';
import FilePreviewModal from './FilePreviewModal';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const SubTaskLogViewer = ({ logs, title = "Riwayat Status Sub:" }: { logs: any[], title?: string }) => {
  const [expanded, setExpanded] = useState(false);
  if (!logs || logs.length === 0) return null;
  const visibleLogs = expanded ? logs : logs.slice(Math.max(logs.length - 1, 0));

  return (
    <div style={{
      fontSize: '11px',
      color: 'var(--text-secondary)',
      background: 'var(--surface-color)',
      padding: '8px 12px',
      borderRadius: '8px',
      border: '1px dashed var(--border-color)'
    }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{title}</span>
        {logs.length > 1 && (
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '11px', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Sembunyikan' : `Lihat ${logs.length - 1} log lainnya`}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {visibleLogs.map((log: any, lidx: number) => (
          <div key={lidx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', minWidth: '100px', flexShrink: 0 }}>
              {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}
            </span>
            <span
              style={{ color: 'var(--text-primary)', wordBreak: 'break-word', whiteSpace: 'normal', fontSize: '11px', lineHeight: '1.4' }}
              dangerouslySetInnerHTML={{ __html: `- ${formatDescription(log.status)}` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled,
  style
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: string[]; 
  placeholder: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', width: '100%', ...style }} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: disabled ? 'var(--bg-color)' : 'var(--input-bg)',
          border: '1px solid',
          borderColor: isOpen ? 'var(--accent-primary)' : 'var(--border-color)',
          color: value ? 'var(--text-primary)' : 'var(--text-secondary)',
          padding: '8.5px 12px',
          borderRadius: '8px',
          fontSize: '13px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value || placeholder}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} style={{ display: 'flex', flexShrink: 0 }}>
          <ChevronDown size={14} style={{ opacity: 0.5 }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              zIndex: 9999,
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '4px'
            }}
            className="custom-scrollbar"
          >
            {options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 10px',
                  background: value === opt ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  border: 'none',
                  fontSize: '13px',
                  color: value === opt ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontWeight: value === opt ? 600 : 500,
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => {
                  if (value !== opt) e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (value !== opt) e.currentTarget.style.background = 'transparent';
                }}
              >
                {opt}
                {value === opt && <Check size={14} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface TaskFormFieldsProps {
  task: EditingTaskType;
  onChange: (updatedTask: EditingTaskType) => void;
  formPicOptions?: string[];
  formCategoryOptions?: string[];
  formStatusOptions?: string[];
  formPriorityOptions?: string[];
  masterLocations?: string[];
  masterProgressMap?: Record<string, number>;
  canUploadAttachment?: boolean;
  maxFileSizeMb?: number;
  setPreviewFile?: (file: FileItem) => void;
  isBulkMode?: boolean;
}

export default function TaskFormFields({
  task,
  onChange,
  formPicOptions = [],
  formCategoryOptions = [],
  formStatusOptions = ['To Do', 'In Progress', 'Done'],
  formPriorityOptions = ['Low', 'Medium', 'High', 'Urgent'],
  masterLocations = [],
  masterProgressMap = {},
  canUploadAttachment = true,
  maxFileSizeMb = 25,
  setPreviewFile,
  isBulkMode = false
}: TaskFormFieldsProps) {
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [localPreviewFile, setLocalPreviewFile] = useState<{ name: string; url: string } | null>(null);
  const [draggedFileIndex, setDraggedFileIndex] = useState<number | null>(null);
  const [dragOverFileIndex, setDragOverFileIndex] = useState<number | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canUploadAttachment && !uploadingFile) {
      setIsDraggingFiles(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
    if (!canUploadAttachment || uploadingFile) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safePicOptions = useMemo(() => {
    const opts = Array.from(new Set([...formPicOptions]));
    if (task.pic && !opts.includes(task.pic)) opts.push(task.pic);
    task.additionalPicsList?.forEach((p: string) => {
      if (p && !opts.includes(p)) opts.push(p);
    });
    return opts;
  }, [formPicOptions, task.pic, task.additionalPicsList]);

  const themeContext = useTheme();
  const currentTheme = themeContext?.theme || 'light';

  const joditConfig = useMemo(() => ({
    readonly: false,
    placeholder: 'Tambahkan deskripsi lengkap di sini (mendukung tebal, miring, daftar poin, tabel, tautan)...',
    height: 220,
    minHeight: 180,
    toolbarSticky: false,
    theme: currentTheme === 'dark' ? 'dark' : 'default',
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    statusbar: false,
    toolbarAdaptive: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_clear_html' as const,
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'paragraph', '|',
      'table', 'link', '|',
      'align', 'undo', 'redo', 'eraser'
    ],
    buttonsMD: [
      'bold', 'italic', 'underline', '|',
      'ul', 'ol', '|',
      'paragraph', '|',
      'table', 'link', '|',
      'undo', 'redo'
    ],
    buttonsSM: [
      'bold', 'italic', 'underline', '|',
      'ul', 'ol', '|',
      'table', 'link', '|',
      'undo', 'redo'
    ],
    buttonsXS: [
      'bold', 'italic', '|',
      'ul', 'ol', '|',
      'link'
    ],
    style: {
      background: 'var(--input-bg)',
      color: 'var(--text-primary)',
      fontFamily: 'inherit',
      fontSize: '13.5px'
    }
  }), [currentTheme]);

  const safeCategoryOptions = useMemo(() => {
    const opts = Array.from(new Set([...formCategoryOptions]));
    if (task.kategori && !opts.includes(task.kategori)) opts.push(task.kategori);
    return opts;
  }, [formCategoryOptions, task.kategori]);

  const handleSelectAllPics = () => {
    const validPics = safePicOptions.filter(p => p && p.trim() !== '' && p !== 'Unassigned');
    if (validPics.length === 0) return toast.error('Belum ada data Master PIC yang tersedia');

    const primaryPic = task.pic && validPics.includes(task.pic) ? task.pic : validPics[0];
    const otherPics = validPics.filter(p => p !== primaryPic);

    onChange({
      ...task,
      pic: primaryPic,
      additionalPicsList: otherPics
    });
    toast.success(`Berhasil memilih seluruh ${validPics.length} PIC!`);
  };

  const handleAddAnotherPic = () => {
    onChange({
      ...task,
      additionalPicsList: [...(task.additionalPicsList || []), '']
    });
  };

  const handleUpdateAdditionalPic = (idx: number, value: string) => {
    const updated = [...(task.additionalPicsList || [])];
    updated[idx] = value;
    onChange({ ...task, additionalPicsList: updated });
  };

  const handleRemoveAdditionalPic = (idx: number) => {
    const updated = task.additionalPicsList?.filter((_, i) => i !== idx) || [];
    onChange({ ...task, additionalPicsList: updated });
  };

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploadingFile(true);

    const uploadedItems: FileItem[] = [];
    const maxBytes = (maxFileSizeMb || 25) * 1024 * 1024;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxBytes) {
        toast.error(`File "${file.name}" melebihi batas ukuran maksimal (${maxFileSizeMb || 25} MB)`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Gagal mengunggah file ${file.name}`);
        }

        const data = await res.json();
        uploadedItems.push({
          url: data.url,
          name: data.name || file.name,
          uploadedAt: new Date().toISOString(),
          size: file.size
        });
      } catch (err: any) {
        toast.error(err.message || `Gagal mengunggah file ${file.name}`);
      }
    }

    if (uploadedItems.length > 0) {
      onChange({
        ...task,
        filesList: [...(task.filesList || []), ...uploadedItems]
      });
      toast.success(`${uploadedItems.length} file lampiran berhasil ditambahkan!`);
    }

    setUploadingFile(false);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  const handleRemoveFile = (idx: number) => {
    const file = task.filesList?.[idx];
    if (!file) return;

    const updated = [...(task.filesList || [])];
    if (task.id) {
      updated[idx] = {
        ...file,
        isDeleted: true,
        deletedAt: new Date().toISOString()
      };
    } else {
      updated.splice(idx, 1);
    }

    onChange({ ...task, filesList: updated });
    toast.success(`File "${file.name}" ditandai dihapus.`);
  };

  const handleRestoreFile = (idx: number) => {
    const file = task.filesList?.[idx];
    if (!file) return;

    const updated = [...(task.filesList || [])];
    updated[idx] = {
      ...file,
      isDeleted: false,
      deletedAt: undefined
    };

    onChange({ ...task, filesList: updated });
    toast.success(`File "${file.name}" dipulihkan.`);
  };

  const handleDropFileReorder = (targetIndex: number) => {
    if (draggedFileIndex === null || draggedFileIndex === targetIndex || !task.filesList) return;
    const updated = [...task.filesList];
    const [movedItem] = updated.splice(draggedFileIndex, 1);
    updated.splice(targetIndex, 0, movedItem);
    onChange({ ...task, filesList: updated });
    setDraggedFileIndex(null);
    setDragOverFileIndex(null);
  };

  const handleMoveFileOrder = (idx: number, direction: 'up' | 'down') => {
    if (!task.filesList) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= task.filesList.length) return;

    const updated = [...task.filesList];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange({ ...task, filesList: updated });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Nama Pekerjaan */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
          Nama Pekerjaan *
        </label>
        <input
          className="input"
          placeholder="Contoh: Audit Keuangan Kuartal II"
          value={task.nama || ''}
          onChange={e => onChange({ ...task, nama: e.target.value })}
        />
      </div>

      {/* Main PIC & Dynamic Multi-PIC Section */}
      <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Penanggung Jawab (PIC Utama & Tambahan) *
            <span title="Update pilihannya pada master pengaturan" style={{ display: 'flex' }}><Info size={14} style={{ color: 'var(--accent-primary)' }} /></span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={handleSelectAllPics}
              title="Pilih seluruh nama PIC personil yang terdaftar"
            >
              <Users size={14} color="var(--accent-primary)" /> Semua PIC
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={handleAddAnotherPic}
            >
              <UserPlus size={14} /> + Tambah PIC Lain
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>PIC Utama *</span>
            <CustomSelect
              value={task.pic || ''}
              onChange={val => onChange({ ...task, pic: val })}
              options={safePicOptions}
              placeholder="-- Pilih PIC Utama --"
            />
          </div>

          {task.additionalPicsList && task.additionalPicsList.map((extraPic: string, idx: number) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <CustomSelect
                value={extraPic}
                onChange={val => handleUpdateAdditionalPic(idx, val)}
                options={safePicOptions}
                placeholder="-- Pilih PIC Tambahan --"
              />
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px' }}
                onClick={() => handleRemoveAdditionalPic(idx)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3-Column Grid for Category, Status, Priority */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Kategori *
            <span title="Update pilihannya pada master pengaturan" style={{ display: 'flex' }}><Info size={14} style={{ color: 'var(--accent-primary)' }} /></span>
          </label>
          <CustomSelect
            value={task.kategori || ''}
            onChange={val => onChange({ ...task, kategori: val })}
            options={safeCategoryOptions}
            placeholder="-- Kategori --"
          />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Status
            <span title="Update pilihannya pada master pengaturan" style={{ display: 'flex' }}><Info size={14} style={{ color: 'var(--accent-primary)' }} /></span>
          </label>
          <CustomSelect
            value={task.status || (formStatusOptions.length > 0 ? formStatusOptions[0] : 'To Do')}
            onChange={val => {
              let newProgress = task.progress;
              if (masterProgressMap[val] !== undefined) {
                newProgress = masterProgressMap[val];
              }
              onChange({ ...task, status: val, progress: newProgress });
            }}
            options={formStatusOptions.length > 0 ? formStatusOptions : ['To Do', 'In Progress', 'Review', 'Done']}
            placeholder="-- Status --"
          />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Prioritas
            <span title="Update pilihannya pada master pengaturan" style={{ display: 'flex' }}><Info size={14} style={{ color: 'var(--accent-primary)' }} /></span>
          </label>
          <CustomSelect
            value={task.prioritas || 'Medium'}
            onChange={val => onChange({ ...task, prioritas: val })}
            options={formPriorityOptions.length > 0 ? formPriorityOptions : ['Low', 'Medium', 'High', 'Urgent']}
            placeholder="-- Prioritas --"
          />
        </div>
      </div>

      {/* Lokasi Pekerjaan */}
      <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Lokasi Pekerjaan (Opsional)</span>
          
          {masterLocations && masterLocations.length > 0 && (
            <div style={{ position: 'relative' }} ref={locationDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isLocationDropdownOpen ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                  borderColor: isLocationDropdownOpen ? 'var(--accent-primary)' : 'var(--border-color)',
                }}
              >
                <MapPin size={13} color="var(--accent-primary)" />
                Master Lokasi Cepat
                <motion.div animate={{ rotate: isLocationDropdownOpen ? 180 : 0 }} style={{ display: 'flex' }}>
                  <ChevronDown size={14} style={{ opacity: 0.6 }} />
                </motion.div>
              </button>

              <AnimatePresence>
                {isLocationDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      width: '280px',
                      background: 'var(--surface-color)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                      zIndex: 9999,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ padding: '10px 12px', background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Pilih Lokasi dari Master Data
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '4px' }} className="custom-scrollbar">
                      {masterLocations.map((loc, lIdx) => (
                        <button
                          key={lIdx}
                          type="button"
                          onClick={() => {
                            const val = loc;
                            const isOnline = /online|zoom|meet|teams|webex|http/i.test(val) && !/offline/i.test(val);
                            onChange({
                              ...task,
                              lokasiData: {
                                tipe: isOnline ? 'online' : 'offline',
                                linkZoom: isOnline ? val : '',
                                lokasiFisik: !isOnline ? val : '',
                                jam: task.lokasiData?.jam || ''
                              } as any
                            });
                            setIsLocationDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 10px',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '12.5px',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            transition: 'background 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ flexShrink: 0, color: 'var(--accent-primary)', opacity: 0.8 }}>
                            <MapPin size={14} />
                          </div>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={loc}>
                            {loc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <input
              type="radio"
              name={`lokasiTipe-${task.id || 'new'}`}
              checked={task.lokasiData?.tipe === 'online'}
              onChange={() => {
                const currentText = (task.lokasiData?.linkZoom || task.lokasiData?.lokasiFisik || '').trim();
                onChange({
                  ...task,
                  lokasiData: { 
                    ...task.lokasiData, 
                    tipe: 'online',
                    linkZoom: currentText,
                    lokasiFisik: ''
                  } as any
                });
              }}
            />
            Online
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <input
              type="radio"
              name={`lokasiTipe-${task.id || 'new'}`}
              checked={task.lokasiData?.tipe === 'offline'}
              onChange={() => {
                const currentText = (task.lokasiData?.lokasiFisik || task.lokasiData?.linkZoom || '').trim();
                onChange({
                  ...task,
                  lokasiData: { 
                    ...task.lokasiData, 
                    tipe: 'offline',
                    lokasiFisik: currentText,
                    linkZoom: ''
                  } as any
                });
              }}
            />
            Offline
          </label>
        </div>

        {task.lokasiData?.tipe === 'online' && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Link Zoom / Meeting / Lokasi Online
            </label>
            <input
              type="text"
              className="input"
              placeholder="https://zoom.us/j/... atau Online Meeting"
              value={task.lokasiData?.linkZoom || ''}
              onChange={e => {
                const val = e.target.value;
                const isOfflineDetected = /offline/i.test(val);
                if (isOfflineDetected) {
                  onChange({
                    ...task,
                    lokasiData: { ...task.lokasiData, tipe: 'offline', lokasiFisik: val, linkZoom: '' } as any
                  });
                } else {
                  onChange({
                    ...task,
                    lokasiData: { ...task.lokasiData, linkZoom: val } as any
                  });
                }
              }}
            />
          </div>
        )}

        {task.lokasiData?.tipe === 'offline' && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Lokasi Fisik / Tempat
            </label>
            <input
              type="text"
              className="input"
              placeholder="Contoh: R.R Komp TKMR / Gedung Utama"
              value={task.lokasiData?.lokasiFisik || ''}
              onChange={e => {
                const val = e.target.value;
                const isOnlineDetected = /online|zoom|meet|teams|webex|http/i.test(val) && !/offline/i.test(val);
                if (isOnlineDetected) {
                  onChange({
                    ...task,
                    lokasiData: { ...task.lokasiData, tipe: 'online', linkZoom: val, lokasiFisik: '' } as any
                  });
                } else {
                  onChange({
                    ...task,
                    lokasiData: { ...task.lokasiData, lokasiFisik: val } as any
                  });
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Date & Time Settings */}
      <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Waktu & Jadwal Pekerjaan</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={task.isAllDay ?? true}
              onChange={e => onChange({ ...task, isAllDay: e.target.checked })}
            />
            Seharian (All Day) <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '2px', fontWeight: 'normal' }}>(Centang jika tanpa jam spesifik)</span>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tanggal Mulai</label>
            <input
              type="date"
              className="input"
              value={task.startDate as string || ''}
              onChange={e => onChange({ ...task, startDate: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tenggat Waktu</label>
            <input
              type="date"
              className="input"
              value={task.endDate as string || ''}
              onChange={e => onChange({ ...task, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Quick Date Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '-4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Pintasan:</span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '12px' }}
            onClick={() => {
              const todayStr = format(new Date(), 'yyyy-MM-dd');
              onChange({ ...task, startDate: todayStr, endDate: todayStr });
            }}
          >
            Hari Ini
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '12px' }}
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              const s = format(d, 'yyyy-MM-dd');
              onChange({ ...task, startDate: s, endDate: s });
            }}
          >
            Besok
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '12px' }}
            onClick={() => {
              const now = new Date();
              const end = new Date(now);
              end.setDate(end.getDate() + 3);
              onChange({ ...task, startDate: format(now, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') });
            }}
          >
            +3 Hari
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '12px' }}
            onClick={() => {
              const now = new Date();
              const end = new Date(now);
              end.setDate(end.getDate() + 7);
              onChange({ ...task, startDate: format(now, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') });
            }}
          >
            +1 Minggu
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '12px' }}
            onClick={() => {
              const now = new Date();
              const end = new Date(now);
              end.setMonth(end.getMonth() + 1);
              onChange({ ...task, startDate: format(now, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') });
            }}
          >
            +1 Bulan
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '12px' }}
            onClick={() => {
              const now = new Date();
              const start = new Date(now.getFullYear(), now.getMonth(), 1);
              const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              onChange({ ...task, startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') });
            }}
          >
            Bulan Ini
          </button>
        </div>

        {!task.isAllDay && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Jam Mulai</label>
              <input
                type="time"
                className="input"
                value={task.startTime || '08:00'}
                onChange={e => onChange({ ...task, startTime: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Jam Selesai</label>
              <input
                type="time"
                className="input"
                value={task.endTime || '17:00'}
                onChange={e => onChange({ ...task, endTime: e.target.value })}
              />
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Pengulangan (Recurrence)
          </label>
          <CustomSelect
            value={task.repetisi || 'Tidak Berulang'}
            onChange={val => onChange({ ...task, repetisi: val })}
            options={['Tidak Berulang', 'Harian', 'Mingguan', 'Bulanan', 'Tahunan', 'Hari Kerja (Senin - Jumat)', 'Custom']}
            placeholder="Pengulangan"
          />

          {task.repetisi === 'Custom' && (
            <div style={{
              background: 'var(--input-bg)',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginTop: '10px'
            }}>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Pengaturan Pengulangan Kustom
              </div>

              {/* Ulangi Setiap X Unit */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ulangi setiap:</span>
                <input
                  type="number"
                  min="1"
                  max="99"
                  className="input"
                  style={{ width: '70px', padding: '6px 8px' }}
                  value={task.customRecurrenceSettings?.every ?? 1}
                  onChange={e => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    onChange({
                      ...task,
                      customRecurrenceSettings: {
                        ...(task.customRecurrenceSettings || { unit: 'Minggu', days: [], endType: 'never' }),
                        every: val
                      }
                    });
                  }}
                />
                <select
                  className="input"
                  style={{ width: '120px', padding: '6px 8px' }}
                  value={task.customRecurrenceSettings?.unit || 'Minggu'}
                  onChange={e => {
                    const unit = e.target.value;
                    onChange({
                      ...task,
                      customRecurrenceSettings: {
                        ...(task.customRecurrenceSettings || { every: 1, days: [], endType: 'never' }),
                        unit
                      }
                    });
                  }}
                >
                  <option value="Hari">Hari</option>
                  <option value="Minggu">Minggu</option>
                  <option value="Bulan">Bulan</option>
                  <option value="Tahun">Tahun</option>
                </select>
              </div>

              {/* Jika unit === 'Minggu', pilih hari */}
              {(task.customRecurrenceSettings?.unit === 'Minggu' || !task.customRecurrenceSettings?.unit) && (
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Ulangi pada hari:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => {
                      const activeDays = task.customRecurrenceSettings?.days || [];
                      const isSelected = activeDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            borderRadius: '8px',
                            minWidth: '38px',
                            textAlign: 'center'
                          }}
                          onClick={() => {
                            const updatedDays = isSelected
                              ? activeDays.filter((d: string) => d !== day)
                              : [...activeDays, day];
                            onChange({
                              ...task,
                              customRecurrenceSettings: {
                                ...(task.customRecurrenceSettings || { every: 1, unit: 'Minggu', endType: 'never' }),
                                days: updatedDays
                              }
                            });
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Berakhir pada / End Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Berakhir:</span>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={`endType-${task.id || 'new'}`}
                    checked={task.customRecurrenceSettings?.endType === 'never' || !task.customRecurrenceSettings?.endType}
                    onChange={() => {
                      onChange({
                        ...task,
                        customRecurrenceSettings: {
                          ...(task.customRecurrenceSettings || { every: 1, unit: 'Minggu', days: [] }),
                          endType: 'never'
                        }
                      });
                    }}
                  />
                  Tidak pernah
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', flexWrap: 'wrap' }}>
                  <input
                    type="radio"
                    name={`endType-${task.id || 'new'}`}
                    checked={task.customRecurrenceSettings?.endType === 'on_date'}
                    onChange={() => {
                      onChange({
                        ...task,
                        customRecurrenceSettings: {
                          ...(task.customRecurrenceSettings || { every: 1, unit: 'Minggu', days: [] }),
                          endType: 'on_date',
                          endDate: task.customRecurrenceSettings?.endDate || format(new Date(), 'yyyy-MM-dd')
                        }
                      });
                    }}
                  />
                  <span>Pada tanggal:</span>
                  {task.customRecurrenceSettings?.endType === 'on_date' && (
                    <input
                      type="date"
                      className="input"
                      style={{ width: '150px', padding: '4px 8px', fontSize: '12px' }}
                      value={task.customRecurrenceSettings?.endDate || format(new Date(), 'yyyy-MM-dd')}
                      onChange={e => {
                        onChange({
                          ...task,
                          customRecurrenceSettings: {
                            ...(task.customRecurrenceSettings || { every: 1, unit: 'Minggu', days: [] }),
                            endType: 'on_date',
                            endDate: e.target.value
                          }
                        });
                      }}
                    />
                  )}
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', flexWrap: 'wrap' }}>
                  <input
                    type="radio"
                    name={`endType-${task.id || 'new'}`}
                    checked={task.customRecurrenceSettings?.endType === 'after_occurrences'}
                    onChange={() => {
                      onChange({
                        ...task,
                        customRecurrenceSettings: {
                          ...(task.customRecurrenceSettings || { every: 1, unit: 'Minggu', days: [] }),
                          endType: 'after_occurrences',
                          endOccurrences: task.customRecurrenceSettings?.endOccurrences || 10
                        }
                      });
                    }}
                  />
                  <span>Setelah:</span>
                  {task.customRecurrenceSettings?.endType === 'after_occurrences' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        className="input"
                        style={{ width: '70px', padding: '4px 8px', fontSize: '12px' }}
                        value={task.customRecurrenceSettings?.endOccurrences ?? 10}
                        onChange={e => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          onChange({
                            ...task,
                            customRecurrenceSettings: {
                              ...(task.customRecurrenceSettings || { every: 1, unit: 'Minggu', days: [] }),
                              endType: 'after_occurrences',
                              endOccurrences: val
                            }
                          });
                        }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>kali kejadian</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deskripsi Pekerjaan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Deskripsi Pekerjaan
        </label>
        <JoditEditor
          value={task.deskripsi || ''}
          config={joditConfig}
          onBlur={newContent => {
            const cleaned = newContent === '<p><br></p>' ? '' : newContent;
            onChange({ ...task, deskripsi: cleaned });
          }}
          onChange={() => { }}
        />
      </div>

      {/* Catatan Tambahan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Catatan Tambahan (Opsional)
        </label>
        <textarea
          className="input"
          style={{ minHeight: '80px', resize: 'vertical' }}
          placeholder="Tambahkan catatan khusus, pengingat, atau instruksi singkat..."
          value={task.catatan || ''}
          onChange={e => onChange({ ...task, catatan: e.target.value })}
        />
      </div>

      {/* Sub-Pekerjaan Section */}
      <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Sub Pekerjaan (Sub Deskripsi)
            <span title="Pecah pekerjaan ini menjadi beberapa rincian sub tugas spesifik" style={{ display: 'inline-flex', color: 'var(--accent-primary)', cursor: 'help' }}>
              <Info size={14} />
            </span>
          </label>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            onClick={() => {
              const newSubTask: SubTask = {
                id: Date.now().toString(),
                text: '',
                status: formStatusOptions.length > 0 ? formStatusOptions[0] : 'To Do',
                pic: safePicOptions.includes('Unassigned') ? 'Unassigned' : (safePicOptions.length > 0 ? safePicOptions[0] : ''),
                logs: []
              };
              onChange({
                ...task,
                subTasksList: [...(task.subTasksList || []), newSubTask]
              });
            }}
          >
            <Plus size={14} /> Tambah Sub
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {task.subTasksList?.map((subTask, idx) => (
            <div
              key={subTask.id || idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '14px',
                background: 'var(--bg-color)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}
            >
              {/* Card Header: Index Badge & Action Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(59, 130, 246, 0.12)',
                    color: 'var(--accent-primary)',
                    border: '1px solid rgba(59, 130, 246, 0.25)'
                  }}>
                    Sub #{idx + 1}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {/* Status Dropdown */}
                  <div style={{ width: '130px' }}>
                    <CustomSelect
                      value={subTask.status}
                      onChange={val => {
                        const updated = [...(task.subTasksList || [])];
                        const newSubStatus = val;
                        updated[idx].status = newSubStatus;

                        let allDone = true;
                        let anyInProgress = false;
                        for (const st of updated) {
                          if (st.status !== 'Done') allDone = false;
                          if (st.status === 'In Progress' || st.status === 'Done') anyInProgress = true;
                        }

                        let newStatus = task.status;
                        let newProgress = task.progress;
                        if (allDone && updated.length > 0) {
                          newStatus = 'Done';
                          newProgress = masterProgressMap['Done'] !== undefined ? masterProgressMap['Done'] : 100;
                        } else if (anyInProgress) {
                          if (newStatus !== 'In Progress') {
                            newStatus = 'In Progress';
                            newProgress = masterProgressMap['In Progress'] !== undefined ? masterProgressMap['In Progress'] : 50;
                          }
                        }

                        onChange({
                          ...task,
                          subTasksList: updated,
                          status: newStatus,
                          progress: newProgress
                        });
                      }}
                      options={formStatusOptions.length > 0 ? formStatusOptions : ['To Do', 'In Progress', 'Review', 'Done']}
                      placeholder="Status"
                    />
                  </div>

                  {/* Reorder Up */}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0 8px', height: '34px', opacity: idx === 0 ? 0.3 : 1 }}
                    disabled={idx === 0}
                    onClick={() => {
                      if (idx === 0) return;
                      const updated = [...(task.subTasksList || [])];
                      const temp = updated[idx];
                      updated[idx] = updated[idx - 1];
                      updated[idx - 1] = temp;
                      onChange({ ...task, subTasksList: updated });
                    }}
                    title="Pindah ke Atas"
                  >
                    <ArrowUp size={14} />
                  </button>

                  {/* Reorder Down */}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0 8px', height: '34px', opacity: idx === (task.subTasksList?.length || 0) - 1 ? 0.3 : 1 }}
                    disabled={idx === (task.subTasksList?.length || 0) - 1}
                    onClick={() => {
                      if (idx === (task.subTasksList?.length || 0) - 1) return;
                      const updated = [...(task.subTasksList || [])];
                      const temp = updated[idx];
                      updated[idx] = updated[idx + 1];
                      updated[idx + 1] = temp;
                      onChange({ ...task, subTasksList: updated });
                    }}
                    title="Pindah ke Bawah"
                  >
                    <ArrowDown size={14} />
                  </button>

                  {/* Delete SubTask */}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0 8px', height: '34px', color: 'var(--danger)' }}
                    onClick={() => {
                      const updated = task.subTasksList!.filter((_, i) => i !== idx);
                      onChange({ ...task, subTasksList: updated });
                    }}
                    title="Hapus Sub Pekerjaan"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Sub-Pekerjaan Text Description Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Rincian Sub Pekerjaan:
                </label>
                <div
                  className="input"
                  contentEditable
                  suppressContentEditableWarning
                  style={{ minHeight: '65px', maxHeight: '180px', overflowY: 'auto', whiteSpace: 'pre-wrap', cursor: 'text', padding: '10px 12px', lineHeight: '1.5', fontSize: '13px' }}
                  onBlur={e => {
                    const updated = [...(task.subTasksList || [])];
                    updated[idx].text = e.currentTarget.innerHTML;
                    onChange({ ...task, subTasksList: updated });
                  }}
                  dangerouslySetInnerHTML={{ __html: formatDescription(subTask.text) || '' }}
                />
              </div>

              {/* PIC and Date Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', alignItems: 'start' }}>
                {/* PIC Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={12} color="var(--accent-primary)" /> Penanggung Jawab (PIC):
                  </label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <CustomSelect
                        value={subTask.pic || (safePicOptions.includes('Unassigned') ? 'Unassigned' : (safePicOptions.length > 0 ? safePicOptions[0] : ''))}
                        onChange={val => {
                          const updated = [...(task.subTasksList || [])];
                          updated[idx].pic = val;
                          onChange({ ...task, subTasksList: updated });
                        }}
                        options={safePicOptions}
                        placeholder="Pilih PIC"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0 8px', height: '36px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', flexShrink: 0 }}
                      title="Pilih Seluruh PIC untuk Sub Pekerjaan ini"
                      onClick={() => {
                        const validPics = safePicOptions.filter(p => p && p.trim() !== '' && p !== 'Unassigned');
                        if (validPics.length === 0) return toast.error('Belum ada data PIC');
                        const updated = [...(task.subTasksList || [])];
                        const currentPrimary = updated[idx].pic && validPics.includes(updated[idx].pic) ? updated[idx].pic : validPics[0];
                        const others = validPics.filter(p => p !== currentPrimary);
                        updated[idx].pic = currentPrimary;
                        updated[idx].additionalPics = others;
                        onChange({ ...task, subTasksList: updated });
                        toast.success('Berhasil memilih seluruh PIC untuk sub pekerjaan ini!');
                      }}
                    >
                      <Users size={13} color="var(--accent-primary)" />
                      <span>Semua</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0 8px', height: '36px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', flexShrink: 0 }}
                      title="Tambah PIC Tambahan untuk Sub Pekerjaan ini"
                      onClick={() => {
                        const updated = [...(task.subTasksList || [])];
                        if (!updated[idx].additionalPics) updated[idx].additionalPics = [];
                        updated[idx].additionalPics!.push(safePicOptions.includes('Unassigned') ? 'Unassigned' : (safePicOptions.length > 0 ? safePicOptions[0] : ''));
                        onChange({ ...task, subTasksList: updated });
                      }}
                    >
                      <UserPlus size={13} />
                      <span>+ PIC</span>
                    </button>
                  </div>

                  {/* Additional PICs */}
                  {subTask.additionalPics?.map((p, pIdx) => (
                    <div key={pIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <CustomSelect
                          value={p}
                          onChange={val => {
                            const updated = [...(task.subTasksList || [])];
                            updated[idx].additionalPics![pIdx] = val;
                            onChange({ ...task, subTasksList: updated });
                          }}
                          options={safePicOptions}
                          placeholder="PIC Tambahan"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0 8px', height: '36px', color: 'var(--danger)', flexShrink: 0 }}
                        onClick={() => {
                          const updated = [...(task.subTasksList || [])];
                          updated[idx].additionalPics!.splice(pIdx, 1);
                          onChange({ ...task, subTasksList: updated });
                        }}
                        title="Hapus PIC tambahan ini"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Tenggat Waktu Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} color="var(--accent-primary)" /> Tenggat Waktu (Opsional):
                  </label>
                  <input
                    type="date"
                    className="input"
                    style={{ width: '100%', height: '36px', fontSize: '13px' }}
                    value={subTask.tenggatWaktu || ''}
                    onChange={e => {
                      const updated = [...(task.subTasksList || [])];
                      updated[idx].tenggatWaktu = e.target.value;
                      onChange({ ...task, subTasksList: updated });
                    }}
                  />
                </div>
              </div>

              {/* SubTask Audit Logs */}
              {subTask.logs && subTask.logs.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  <SubTaskLogViewer logs={subTask.logs} title="Riwayat Status Sub:" />
                </div>
              )}
            </div>
          ))}

          {(!task.subTasksList || task.subTasksList.length === 0) && (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
              Belum ada sub-pekerjaan yang ditambahkan.
            </div>
          )}
        </div>
      </div>

      {/* Files Section (if not in basic bulk mode) */}
      {!isBulkMode && (
        <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              File Lampiran ({task.filesList?.filter(f => !f.isDeleted).length || 0} File, Maks {maxFileSizeMb || 25} MB/file)
            </label>
            {canUploadAttachment && (
              <label className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: uploadingFile ? 'not-allowed' : 'pointer' }}>
                <Paperclip size={14} /> {uploadingFile ? 'Mengunggah...' : '+ Unggah File'}
                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  disabled={uploadingFile}
                  onChange={e => e.target.files && processFiles(e.target.files)}
                />
              </label>
            )}
          </div>

          {/* Drag & Drop Dropzone */}
          {canUploadAttachment && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploadingFile && attachmentInputRef.current?.click()}
              style={{
                border: isDraggingFiles ? '2px dashed var(--accent-primary)' : '1.5px dashed var(--border-color)',
                borderRadius: '10px',
                padding: '16px 12px',
                textAlign: 'center',
                background: isDraggingFiles ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-color)',
                cursor: uploadingFile ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <UploadCloud size={24} color={isDraggingFiles ? "var(--accent-primary)" : "var(--text-secondary)"} />
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: isDraggingFiles ? "var(--accent-primary)" : "var(--text-primary)" }}>
                {uploadingFile ? 'Sedang mengunggah file...' : (isDraggingFiles ? 'Lepaskan file untuk mengunggah' : 'Tarik & lepas file ke sini, atau klik untuk memilih')}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Mendukung PDF, Word, Excel, Gambar, ZIP, dan dokumen lainnya (Maks {maxFileSizeMb || 25} MB)
              </span>
            </div>
          )}

          {/* Attached Files List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {task.filesList?.map((f, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--bg-color)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  opacity: f.isDeleted ? 0.5 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, marginRight: '10px' }}>
                  <File size={16} color={f.isDeleted ? "var(--text-secondary)" : "var(--accent-primary)"} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: f.isDeleted ? 'line-through' : 'none' }} title={f.name}>
                    {f.name}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                  {!f.isDeleted && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => {
                        if (setPreviewFile) {
                          setPreviewFile(f);
                        } else {
                          setLocalPreviewFile(f);
                        }
                      }}
                      title="Lihat Pratinjau File"
                    >
                      <Eye size={13} />
                      <span>Preview</span>
                    </button>
                  )}

                  {f.isDeleted ? (
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleRestoreFile(idx)}>
                      Pulihkan
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', color: 'var(--danger)', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => handleRemoveFile(idx)}
                      title="Hapus File"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        previewFile={localPreviewFile}
        setPreviewFile={setLocalPreviewFile}
        theme={currentTheme}
      />
    </div>
  );
}
