'use client';

import { useState, useRef, useMemo } from 'react';
import { 
  X, UserPlus, Users, Plus, Paperclip, File, Eye, ArrowUp, ArrowDown, 
  Info, GripVertical, FileText, FileDown, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import { FileItem, SubTask, handleMarkdownShortcut, formatDescription } from '@/utils/taskUtils';
import toast from 'react-hot-toast';
import { EditingTaskType } from './TaskAddEditModal';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const SubTaskLogViewer = ({ logs, title = "Log Status:" }: { logs: any[], title?: string }) => {
  const [expanded, setExpanded] = useState(false);
  if (!logs || logs.length === 0) return null;
  const visibleLogs = expanded ? logs : logs.slice(Math.max(logs.length - 1, 0));

  return (
    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '4px' }}>
      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{title}</div>
      {visibleLogs.map((log: any, lidx: number) => (
        <div key={lidx} style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px' }}>{format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm')}</span>
          <span
            style={{ color: 'var(--text-primary)', wordBreak: 'break-word', whiteSpace: 'normal' }}
            dangerouslySetInnerHTML={{ __html: `- ${formatDescription(log.status)}` }}
          />
        </div>
      ))}
      {logs.length > 1 && (
        <button
          type="button"
          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '10px', cursor: 'pointer', padding: 0, marginTop: '2px', textDecoration: 'underline' }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Sembunyikan' : `Tampilkan ${logs.length - 1} log lainnya...`}
        </button>
      )}
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
  const [draggedFileIndex, setDraggedFileIndex] = useState<number | null>(null);
  const [dragOverFileIndex, setDragOverFileIndex] = useState<number | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const safePicOptions = useMemo(() => {
    const opts = Array.from(new Set([...formPicOptions]));
    if (task.pic && !opts.includes(task.pic)) opts.push(task.pic);
    task.additionalPicsList?.forEach((p: string) => {
      if (p && !opts.includes(p)) opts.push(p);
    });
    return opts;
  }, [formPicOptions, task.pic, task.additionalPicsList]);

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

  const processFiles = async (files: FileList) => {
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
            <select
              className="input"
              value={task.pic || ''}
              onChange={e => onChange({ ...task, pic: e.target.value })}
            >
              <option value="">-- Pilih PIC Utama --</option>
              {safePicOptions.map((p, idx) => (
                <option key={idx} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {task.additionalPicsList && task.additionalPicsList.map((extraPic: string, idx: number) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                className="input"
                value={extraPic}
                onChange={e => handleUpdateAdditionalPic(idx, e.target.value)}
              >
                <option value="">-- Pilih PIC Tambahan --</option>
                {safePicOptions.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
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
          <select
            className="input"
            value={task.kategori || ''}
            onChange={e => onChange({ ...task, kategori: e.target.value })}
          >
            <option value="">-- Kategori --</option>
            {safeCategoryOptions.map((c, idx) => (
              <option key={idx} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Status
            <span title="Update pilihannya pada master pengaturan" style={{ display: 'flex' }}><Info size={14} style={{ color: 'var(--accent-primary)' }} /></span>
          </label>
          <select 
            className="input" 
            value={task.status || (formStatusOptions.length > 0 ? formStatusOptions[0] : 'To Do')} 
            onChange={e => {
              const newStatus = e.target.value;
              let newProgress = task.progress;
              if (masterProgressMap[newStatus] !== undefined) {
                newProgress = masterProgressMap[newStatus];
              }
              onChange({ ...task, status: newStatus, progress: newProgress });
            }}
          >
            {(formStatusOptions.length > 0 ? formStatusOptions : ['To Do', 'In Progress', 'Review', 'Done']).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Prioritas
            <span title="Update pilihannya pada master pengaturan" style={{ display: 'flex' }}><Info size={14} style={{ color: 'var(--accent-primary)' }} /></span>
          </label>
          <select 
            className="input" 
            value={task.prioritas || 'Medium'} 
            onChange={e => onChange({ ...task, prioritas: e.target.value })}
          >
            {(formPriorityOptions.length > 0 ? formPriorityOptions : ['Low', 'Medium', 'High', 'Urgent']).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lokasi Pekerjaan */}
      <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Lokasi Pekerjaan (Opsional)</span>

        <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <input
              type="radio"
              name={`lokasiTipe-${task.id || 'new'}`}
              checked={task.lokasiData?.tipe === 'online'}
              onChange={() => onChange({
                ...task,
                lokasiData: { ...task.lokasiData, tipe: 'online' } as any
              })}
            />
            Online
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <input
              type="radio"
              name={`lokasiTipe-${task.id || 'new'}`}
              checked={task.lokasiData?.tipe === 'offline'}
              onChange={() => onChange({
                ...task,
                lokasiData: { ...task.lokasiData, tipe: 'offline' } as any
              })}
            />
            Offline
          </label>
        </div>

        {task.lokasiData?.tipe === 'online' && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Link Zoom / Meeting</label>
            <input
              type="text"
              className="input"
              placeholder="https://zoom.us/j/... atau Online Meeting"
              value={task.lokasiData?.linkZoom || ''}
              onChange={e => onChange({
                ...task,
                lokasiData: { ...task.lokasiData, linkZoom: e.target.value } as any
              })}
            />
          </div>
        )}

        {task.lokasiData?.tipe === 'offline' && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Lokasi Fisik / Tempat</label>
            <input
              type="text"
              className="input"
              placeholder="Contoh: R.R Komp TKMR / Gedung Utama"
              value={task.lokasiData?.lokasiFisik || ''}
              onChange={e => onChange({
                ...task,
                lokasiData: { ...task.lokasiData, lokasiFisik: e.target.value } as any
              })}
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
          <select
            className="input"
            value={task.repetisi || 'Tidak Berulang'}
            onChange={e => onChange({ ...task, repetisi: e.target.value })}
          >
            <option value="Tidak Berulang">Tidak Berulang (Does not repeat)</option>
            <option value="Harian">Harian (Daily)</option>
            <option value="Mingguan">Mingguan (Weekly)</option>
            <option value="Bulanan">Bulanan (Monthly)</option>
            <option value="Tahunan">Tahunan (Annually)</option>
            <option value="Hari Kerja (Senin - Jumat)">Setiap Hari Kerja (Senin - Jumat)</option>
            <option value="Custom">Custom...</option>
          </select>
        </div>
      </div>

      {/* Deskripsi Pekerjaan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Deskripsi Pekerjaan
        </label>
        <JoditEditor
          value={task.deskripsi || ''}
          config={{
            readonly: false,
            placeholder: 'Tambahkan deskripsi lengkap di sini (mendukung tebal, miring, tabel, dll)...',
            height: 220,
            toolbarSticky: false,
            theme: 'dark',
            style: {
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }
          }}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {task.subTasksList?.map((subTask, idx) => (
            <div key={subTask.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    className="input"
                    contentEditable
                    suppressContentEditableWarning
                    style={{ flex: 1, minHeight: '60px', overflowY: 'auto', whiteSpace: 'pre-wrap', cursor: 'text', padding: '10px' }}
                    onBlur={e => {
                      const updated = [...(task.subTasksList || [])];
                      updated[idx].text = e.currentTarget.innerHTML;
                      onChange({ ...task, subTasksList: updated });
                    }}
                    dangerouslySetInnerHTML={{ __html: formatDescription(subTask.text) || '' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <select
                          className="input"
                          style={{ width: '100%', fontSize: '13px' }}
                          value={subTask.pic || (safePicOptions.includes('Unassigned') ? 'Unassigned' : (safePicOptions.length > 0 ? safePicOptions[0] : ''))}
                          onChange={e => {
                            const updated = [...(task.subTasksList || [])];
                            updated[idx].pic = e.target.value;
                            onChange({ ...task, subTasksList: updated });
                          }}
                        >
                          {safePicOptions.map(opt => <option key={opt} value={opt} style={{ color: 'var(--text-primary)', background: 'var(--surface-color)' }}>{opt}</option>)}
                        </select>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0 8px' }}
                          title="Pilih Seluruh PIC"
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
                          <Users size={14} color="var(--accent-primary)" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0 8px' }}
                          title="Tambah PIC"
                          onClick={() => {
                            const updated = [...(task.subTasksList || [])];
                            if (!updated[idx].additionalPics) updated[idx].additionalPics = [];
                            updated[idx].additionalPics!.push(safePicOptions.includes('Unassigned') ? 'Unassigned' : (safePicOptions.length > 0 ? safePicOptions[0] : ''));
                            onChange({ ...task, subTasksList: updated });
                          }}
                        >
                          <UserPlus size={14} />
                        </button>
                      </div>
                      {subTask.additionalPics?.map((p, pIdx) => (
                        <div key={pIdx} style={{ display: 'flex', gap: '4px' }}>
                          <select
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={p}
                            onChange={e => {
                              const updated = [...(task.subTasksList || [])];
                              updated[idx].additionalPics![pIdx] = e.target.value;
                              onChange({ ...task, subTasksList: updated });
                            }}
                          >
                            {safePicOptions.map(opt => <option key={opt} value={opt} style={{ color: 'var(--text-primary)', background: 'var(--surface-color)' }}>{opt}</option>)}
                          </select>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0 8px', color: 'var(--error-color)' }}
                            onClick={() => {
                              const updated = [...(task.subTasksList || [])];
                              updated[idx].additionalPics!.splice(pIdx, 1);
                              onChange({ ...task, subTasksList: updated });
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <input
                        type="date"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={subTask.tenggatWaktu || ''}
                        onChange={e => {
                          const updated = [...(task.subTasksList || [])];
                          updated[idx].tenggatWaktu = e.target.value;
                          onChange({ ...task, subTasksList: updated });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    className="input"
                    style={{ width: '120px', fontSize: '12px', padding: '6px' }}
                    value={subTask.status}
                    onChange={e => {
                      const updated = [...(task.subTasksList || [])];
                      const newSubStatus = e.target.value;
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
                  >
                    {(formStatusOptions.length > 0 ? formStatusOptions : ['To Do', 'In Progress', 'Review', 'Done']).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', opacity: idx === 0 ? 0.3 : 1 }}
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

                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', opacity: idx === (task.subTasksList?.length || 0) - 1 ? 0.3 : 1 }}
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

                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                    onClick={() => {
                      const updated = task.subTasksList!.filter((_, i) => i !== idx);
                      onChange({ ...task, subTasksList: updated });
                    }}
                    title="Hapus Sub"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {subTask.logs && subTask.logs.length > 0 && (
                <SubTaskLogViewer logs={subTask.logs} title="Riwayat Status Sub:" />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <File size={16} color={f.isDeleted ? "var(--text-secondary)" : "var(--accent-primary)"} />
                  <span style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: f.isDeleted ? 'line-through' : 'none' }} title={f.name}>
                    {f.name}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {f.isDeleted ? (
                    <button type="button" className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '11px' }} onClick={() => handleRestoreFile(idx)}>
                      Pulihkan
                    </button>
                  ) : (
                    <button type="button" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }} onClick={() => handleRemoveFile(idx)} title="Hapus File">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
