'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Plus, Paperclip, File, Eye, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Task, FileItem, SubTask } from '@/utils/taskUtils';
import toast from 'react-hot-toast';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const SubTaskLogViewer = ({ logs, title = "Log Status:" }: { logs: any[], title?: string }) => {
  const [expanded, setExpanded] = useState(false);
  if (!logs || logs.length === 0) return null;
  const visibleLogs = expanded ? logs : logs.slice(Math.max(logs.length - 3, 0));

  return (
    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '4px' }}>
      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{title}</div>
      {visibleLogs.map((log: any, lidx: number) => (
        <div key={lidx} style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px' }}>{format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm')}</span>
          <span style={{ color: 'var(--text-primary)' }}>- {log.status}</span>
        </div>
      ))}
      {logs.length > 3 && (
        <button
          type="button"
          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '10px', cursor: 'pointer', padding: 0, marginTop: '2px', textDecoration: 'underline' }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Sembunyikan' : `Tampilkan ${logs.length - 3} log lainnya...`}
        </button>
      )}
    </div>
  );
};

export type EditingTaskType = Partial<Task> & {
  filesList?: FileItem[];
  additionalPicsList?: string[];
  isCustomCategory?: boolean;
  isCustomPic?: boolean;
  customRecurrenceSettings?: any;
  subTasksList?: SubTask[];
  lokasiData?: { tipe: string, linkZoom?: string, lokasiFisik?: string, jam?: string };
};

interface TaskAddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit: EditingTaskType | null;
  onSave: (payload: any) => Promise<void>;
  formPicOptions: string[];
  formCategoryOptions: string[];
  formStatusOptions?: string[];
  formPriorityOptions?: string[];
  setPreviewFile?: (file: FileItem) => void;
}

export default function TaskAddEditModal({
  isOpen,
  onClose,
  taskToEdit,
  onSave,
  formPicOptions = [],
  formCategoryOptions = [],
  formStatusOptions = [],
  formPriorityOptions = [],
  setPreviewFile
}: TaskAddEditModalProps) {
  const router = useRouter();
  const [editingTask, setEditingTask] = useState<EditingTaskType | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [masterProgressMap, setMasterProgressMap] = useState<Record<string, number>>({});
  const [masterLocations, setMasterLocations] = useState<string[]>([]);

  const attachmentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const cached = localStorage.getItem('master_status_progress');
        if (cached) setMasterProgressMap(JSON.parse(cached));
      } catch (e) { }
      fetch('/api/settings').then(r => r.json()).then(data => {
        if (data.master_status_progress) {
          setMasterProgressMap(data.master_status_progress);
          localStorage.setItem('master_status_progress', JSON.stringify(data.master_status_progress));
        }
        if (data.master_locations) {
          setMasterLocations(data.master_locations);
        }
      }).catch(() => { });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && taskToEdit) {
      const cloned = JSON.parse(JSON.stringify(taskToEdit));
      
      if (cloned.repetisi && cloned.repetisi.startsWith('CUSTOM_RECURRENCE:')) {
        try {
          let jsonStr = cloned.repetisi.replace('CUSTOM_RECURRENCE:', '');
          let settings = JSON.parse(jsonStr);
          while (typeof settings === 'string') {
            settings = JSON.parse(settings);
          }
          cloned.customRecurrenceSettings = settings;
        } catch (e) {
          cloned.customRecurrenceSettings = { every: 1, unit: 'Minggu', days: [], endType: 'never', endDate: '', endOccurrences: 1 };
        }
        cloned.repetisi = 'Custom';
      } else if (!cloned.customRecurrenceSettings) {
        cloned.customRecurrenceSettings = { every: 1, unit: 'Minggu', days: [], endType: 'never', endDate: '', endOccurrences: 1 };
      }

      if (cloned.lokasi) {
        try {
          cloned.lokasiData = JSON.parse(cloned.lokasi);
          // If old data has lokasiData.jam but startTime is empty, sync it
          if (cloned.lokasiData?.jam && !cloned.startTime) {
            cloned.startTime = cloned.lokasiData.jam;
            cloned.isAllDay = false;
          }
        } catch (e) {
          cloned.lokasiData = { tipe: 'offline', lokasiFisik: cloned.lokasi, jam: '' };
        }
      } else {
        cloned.lokasiData = { tipe: '', linkZoom: '', lokasiFisik: '', jam: '' };
      }

      setEditingTask(cloned);
    } else {
      setEditingTask(null);
    }
  }, [isOpen, taskToEdit]);

  const handleAddAnotherPic = () => {
    if (!editingTask) return;
    setEditingTask({
      ...editingTask,
      additionalPicsList: [...(editingTask.additionalPicsList || []), '']
    });
  };

  const handleUpdateAdditionalPic = (idx: number, value: string) => {
    if (!editingTask) return;
    const updated = [...(editingTask.additionalPicsList || [])];
    updated[idx] = value;
    setEditingTask({ ...editingTask, additionalPicsList: updated });
  };

  const handleRemoveAdditionalPic = (idx: number) => {
    if (!editingTask) return;
    const updated = editingTask.additionalPicsList?.filter((_, i) => i !== idx);
    setEditingTask({ ...editingTask, additionalPicsList: updated });
  };

  const processFiles = async (files: FileList) => {
    if (!files || files.length === 0 || !editingTask) return;
    setUploadingFile(true);
    toast.loading('Mengunggah file...', { id: 'upload' });

    try {
      const filesArr = Array.from(files);
      const newFiles: FileItem[] = [];

      for (const file of filesArr) {
        if (file.size > 25 * 1024 * 1024) {
          toast.error(`File ${file.name} melebihi 25MB`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskId', 'temp');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error(`Gagal mengunggah ${file.name}`);

        const data = await res.json();
        newFiles.push({
          url: data.fileUrl,
          name: data.fileName,
          uploadedAt: new Date().toISOString()
        });
      }

      if (newFiles.length > 0) {
        setEditingTask((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            filesList: [...(prev.filesList || []), ...newFiles]
          };
        });
        toast.success(`${newFiles.length} File berhasil diunggah!`, { id: 'upload' });
      } else {
        toast.dismiss('upload');
      }

    } catch (error: any) {
      console.error('File upload error:', error);
      toast.error('Gagal mengunggah file', { id: 'upload' });
    } finally {
      setUploadingFile(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemoveFileFromEdit = (idx: number) => {
    if (!editingTask) return;
    const updatedList = [...(editingTask.filesList || [])];
    if (updatedList[idx].uploadedAt) {
      updatedList[idx].isDeleted = true;
      updatedList[idx].deletedAt = new Date().toISOString();
    } else {
      updatedList.splice(idx, 1);
    }
    setEditingTask({ ...editingTask, filesList: updatedList });
  };

  const handleSave = async () => {
    if (!editingTask) return;
    if (!editingTask.nama || !editingTask.pic) {
      toast.error('Nama Pekerjaan dan PIC Utama wajib diisi!');
      return;
    }

    setLoading(true);
    try {
      // Serialize filesList back into JSON for the backend
      const filesJson = JSON.stringify(editingTask.filesList || []);
      const additionalPicsJson = JSON.stringify((editingTask.additionalPicsList || []).filter(p => p.trim() !== ''));
      const subTasksJson = JSON.stringify(editingTask.subTasksList || []);
      const customRecurrenceSettingsStr = editingTask.customRecurrenceSettings ? JSON.stringify(editingTask.customRecurrenceSettings) : null;
      const updatedLokasiData = editingTask.lokasiData?.tipe
        ? { ...editingTask.lokasiData, jam: editingTask.isAllDay ? '' : (editingTask.startTime || '') }
        : null;
      const lokasiJson = updatedLokasiData ? JSON.stringify(updatedLokasiData) : null;

      const { historyLogsJson, commentsJson, ...restEditingTask } = editingTask;
      const payload = {
        ...restEditingTask,
        filesJson,
        additionalPics: additionalPicsJson,
        subTasksJson,
        customRecurrenceSettings: customRecurrenceSettingsStr,
        lokasi: lokasiJson
      };

      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && editingTask && (
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <motion.div
            className="modal-content"
            style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {editingTask.id ? 'Edit Pekerjaan' : 'Tambah Pekerjaan Baru'}
              </h2>
              <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Nama Pekerjaan *
                </label>
                <input
                  className="input"
                  placeholder="Contoh: Audit Keuangan Kuartal II"
                  value={editingTask.nama || ''}
                  onChange={e => setEditingTask({ ...editingTask, nama: e.target.value })}
                />
              </div>

              {/* Main PIC & Dynamic Multi-PIC Section */}
              <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Penanggung Jawab (PIC Utama & Tambahan) *
                    <span title="Update pilihannya pada master pengaturan" style={{ display: 'flex' }}><Info size={14} style={{ color: 'var(--accent-primary)' }} /></span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={handleAddAnotherPic}
                  >
                    <UserPlus size={14} /> + Tambah PIC Lain
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>PIC Utama *</span>
                    <select
                      className="input"
                      value={editingTask.pic || ''}
                      onChange={e => setEditingTask({ ...editingTask, pic: e.target.value })}
                    >
                      <option value="">-- Pilih PIC Utama --</option>
                      {formPicOptions.map((p, idx) => (
                        <option key={idx} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {editingTask.additionalPicsList && editingTask.additionalPicsList.map((extraPic, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        className="input"
                        value={extraPic}
                        onChange={e => handleUpdateAdditionalPic(idx, e.target.value)}
                      >
                        <option value="">-- Pilih PIC Tambahan --</option>
                        {formPicOptions.map((p, i) => (
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {/* Explicit Dropdown Select for Category */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Kategori *
                    <span title="Update pilihannya pada master pengaturan" style={{ display: 'flex' }}><Info size={14} style={{ color: 'var(--accent-primary)' }} /></span>
                  </label>
                  <select
                    className="input"
                    value={editingTask.kategori || 'Umum'}
                    onChange={e => setEditingTask({ ...editingTask, kategori: e.target.value })}
                  >
                    {formCategoryOptions.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Status
                    <span title="Update pilihannya pada master pengaturan" style={{ display: 'flex' }}><Info size={14} style={{ color: 'var(--accent-primary)' }} /></span>
                  </label>
                  <select className="input" value={editingTask.status || (formStatusOptions.length > 0 ? formStatusOptions[0] : 'To Do')} onChange={e => {
                    const newStatus = e.target.value;
                    let newProgress = editingTask.progress;
                    if (masterProgressMap[newStatus] !== undefined) {
                      newProgress = masterProgressMap[newStatus];
                    }
                    setEditingTask({ ...editingTask, status: newStatus, progress: newProgress });
                  }}>
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
                  <select className="input" value={editingTask.prioritas || 'Medium'} onChange={e => setEditingTask({ ...editingTask, prioritas: e.target.value })}>
                    {(formPriorityOptions.length > 0 ? formPriorityOptions : ['Low', 'Medium', 'High', 'Urgent']).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lokasi Pekerjaan */}
              <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Lokasi Pekerjaan (Opsional)</span>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <input
                      type="radio"
                      name="lokasiTipe"
                      checked={editingTask.lokasiData?.tipe === 'online'}
                      onChange={() => setEditingTask({
                        ...editingTask,
                        lokasiData: { ...editingTask.lokasiData, tipe: 'online' } as any
                      })}
                    />
                    Online
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <input
                      type="radio"
                      name="lokasiTipe"
                      checked={editingTask.lokasiData?.tipe === 'offline'}
                      onChange={() => setEditingTask({
                        ...editingTask,
                        lokasiData: { ...editingTask.lokasiData, tipe: 'offline' } as any
                      })}
                    />
                    Offline
                  </label>
                </div>

                {editingTask.lokasiData?.tipe === 'online' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Link Zoom</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="https://zoom.us/j/..."
                      list="online-locations-list"
                      value={editingTask.lokasiData?.linkZoom || ''}
                      onChange={e => setEditingTask({
                        ...editingTask,
                        lokasiData: { ...editingTask.lokasiData, linkZoom: e.target.value } as any
                      })}
                    />
                    <datalist id="online-locations-list">
                      {masterLocations
                        .filter(loc => loc.toLowerCase().startsWith('online:') || loc.toLowerCase().startsWith('http://') || loc.toLowerCase().startsWith('https://'))
                        .map(loc => loc.replace(/^online:\s*/i, '').trim())
                        .filter(Boolean)
                        .map((loc, idx) => (
                          <option key={idx} value={loc} />
                        ))}
                    </datalist>
                  </div>
                )}

                {editingTask.lokasiData?.tipe === 'offline' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Lokasi Fisik / Tempat</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Contoh: R.R Komp TKMR / KPJ"
                      list="offline-locations-list"
                      value={editingTask.lokasiData?.lokasiFisik || ''}
                      onChange={e => setEditingTask({
                        ...editingTask,
                        lokasiData: { ...editingTask.lokasiData, lokasiFisik: e.target.value } as any
                      })}
                    />
                    <datalist id="offline-locations-list">
                      {masterLocations
                        .map(loc => loc.replace(/^offline:\s*/i, '').replace(/^online:\s*/i, '').trim())
                        .filter(Boolean)
                        .map((loc, idx) => (
                          <option key={idx} value={loc} />
                        ))}
                    </datalist>
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
                      checked={editingTask.isAllDay ?? true}
                      onChange={e => setEditingTask({ ...editingTask, isAllDay: e.target.checked })}
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
                      value={editingTask.startDate as string}
                      onChange={e => setEditingTask({ ...editingTask, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tenggat Waktu</label>
                    <input
                      type="date"
                      className="input"
                      value={editingTask.endDate as string}
                      onChange={e => setEditingTask({ ...editingTask, endDate: e.target.value })}
                    />
                  </div>
                </div>

                {!editingTask.isAllDay && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Jam Mulai</label>
                      <input 
                        type="time" 
                        className="input" 
                        value={editingTask.startTime || '08:00'} 
                        onChange={e => setEditingTask({ ...editingTask, startTime: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Jam Selesai</label>
                      <input 
                        type="time" 
                        className="input" 
                        value={editingTask.endTime || '17:00'} 
                        onChange={e => setEditingTask({ ...editingTask, endTime: e.target.value })} 
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
                    value={editingTask.repetisi || 'Tidak Berulang'}
                    onChange={e => setEditingTask({ ...editingTask, repetisi: e.target.value })}
                  >
                    <option value="Tidak Berulang">Tidak Berulang (Does not repeat)</option>
                    <option value="Harian">Harian (Daily)</option>
                    <option value="Mingguan">Mingguan (Weekly)</option>
                    <option value="Bulanan">Bulanan (Monthly)</option>
                    <option value="Tahunan">Tahunan (Annually)</option>
                    <option value="Hari Kerja (Senin - Jumat)">Setiap Hari Kerja (Senin - Jumat)</option>
                    <option value="Custom">Custom...</option>
                  </select>

                  {editingTask.repetisi === 'Custom' && editingTask.customRecurrenceSettings && (
                    <div style={{ marginTop: '12px', padding: '16px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Ulangi setiap</span>
                        <input
                          type="number"
                          min="1"
                          className="input"
                          style={{ width: '70px', padding: '6px 10px' }}
                          value={editingTask.customRecurrenceSettings.every}
                          onChange={e => setEditingTask({
                            ...editingTask,
                            customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, every: Math.max(1, Number(e.target.value)) }
                          })}
                        />
                        <select
                          className="input"
                          style={{ width: '120px', padding: '6px 10px' }}
                          value={editingTask.customRecurrenceSettings.unit}
                          onChange={e => setEditingTask({
                            ...editingTask,
                            customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, unit: e.target.value }
                          })}
                        >
                          <option value="Hari">Hari</option>
                          <option value="Minggu">Minggu</option>
                          <option value="Bulan">Bulan</option>
                          <option value="Tahun">Tahun</option>
                        </select>
                      </div>

                      {editingTask.customRecurrenceSettings.unit === 'Minggu' && (
                        <div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Ulangi pada:</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                              const isSelected = editingTask.customRecurrenceSettings.days.includes(idx.toString());
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    const days = [...editingTask.customRecurrenceSettings.days];
                                    if (isSelected) {
                                      days.splice(days.indexOf(idx.toString()), 1);
                                    } else {
                                      days.push(idx.toString());
                                    }
                                    setEditingTask({ ...editingTask, customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, days } });
                                  }}
                                  style={{
                                    width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                                    background: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                                    color: isSelected ? 'white' : 'var(--text-primary)',
                                    fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Berakhir pada:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="endType"
                              checked={editingTask.customRecurrenceSettings.endType === 'never'}
                              onChange={() => setEditingTask({ ...editingTask, customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, endType: 'never' } })}
                            />
                            Tidak pernah (Never)
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="endType"
                              checked={editingTask.customRecurrenceSettings.endType === 'date'}
                              onChange={() => setEditingTask({ ...editingTask, customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, endType: 'date' } })}
                            />
                            Pada tanggal
                            <input
                              type="date"
                              className="input"
                              style={{ width: '130px', padding: '4px 8px', fontSize: '12px', marginLeft: '8px' }}
                              value={editingTask.customRecurrenceSettings.endDate}
                              disabled={editingTask.customRecurrenceSettings.endType !== 'date'}
                              onChange={e => setEditingTask({ ...editingTask, customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, endDate: e.target.value } })}
                            />
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="endType"
                              checked={editingTask.customRecurrenceSettings.endType === 'occurrences'}
                              onChange={() => setEditingTask({ ...editingTask, customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, endType: 'occurrences' } })}
                            />
                            Setelah
                            <input
                              type="number"
                              min="1"
                              className="input"
                              style={{ width: '60px', padding: '4px 8px', fontSize: '12px', marginLeft: '8px' }}
                              value={editingTask.customRecurrenceSettings.endOccurrences}
                              disabled={editingTask.customRecurrenceSettings.endType !== 'occurrences'}
                              onChange={e => setEditingTask({ ...editingTask, customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, endOccurrences: Math.max(1, Number(e.target.value)) } })}
                            />
                            kali
                          </label>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Deskripsi Pekerjaan
                </label>
                <JoditEditor
                  value={editingTask.deskripsi || ''}
                  config={{
                    readonly: false,
                    placeholder: 'Tambahkan deskripsi lengkap di sini (mendukung tebal, miring, tabel, dll)...',
                    height: 250,
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
                    setEditingTask({ ...editingTask, deskripsi: cleaned });
                  }}
                  onChange={() => { }}
                />
              </div>

              {/* Sub-Pekerjaan Section */}
              <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Sub Pekerjaan (Sub Deskripsi)
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
                        logs: []
                      };
                      setEditingTask({
                        ...editingTask,
                        subTasksList: [...(editingTask.subTasksList || []), newSubTask]
                      });
                    }}
                  >
                    <Plus size={14} /> Tambah Sub
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {editingTask.subTasksList?.map((subTask, idx) => (
                    <div key={subTask.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <textarea
                            className="input"
                            style={{ flex: 1, resize: 'vertical', minHeight: '60px' }}
                            placeholder="Deskripsi Sub Pekerjaan..."
                            value={subTask.text}
                            onChange={e => {
                              const updated = [...(editingTask.subTasksList || [])];
                              updated[idx].text = e.target.value;
                              setEditingTask({ ...editingTask, subTasksList: updated });
                            }}
                          />
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                              <select
                                className="input"
                                style={{ width: '100%', fontSize: '13px' }}
                                value={subTask.pic || ''}
                                onChange={e => {
                                  const updated = [...(editingTask.subTasksList || [])];
                                  updated[idx].pic = e.target.value;
                                  setEditingTask({ ...editingTask, subTasksList: updated });
                                }}
                              >
                                <option value="">Tanpa PIC Khusus</option>
                                {formPicOptions.map(opt => <option key={opt} value={opt} style={{ color: 'var(--text-primary)', background: 'var(--surface-color)' }}>{opt}</option>)}
                              </select>
                            </div>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                              <input
                                type="date"
                                className="input"
                                style={{ width: '100%', fontSize: '13px' }}
                                value={subTask.tenggatWaktu || ''}
                                onChange={e => {
                                  const updated = [...(editingTask.subTasksList || [])];
                                  updated[idx].tenggatWaktu = e.target.value;
                                  setEditingTask({ ...editingTask, subTasksList: updated });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <select
                            className="input"
                            style={{ width: '140px', flexShrink: 0 }}
                            value={subTask.status}
                            onChange={e => {
                              const newStatus = e.target.value;
                              const updated = [...(editingTask.subTasksList || [])];
                              updated[idx].status = newStatus;

                              const allSame = updated.every(st => st.status === newStatus);
                              if (allSame) {
                                let newProgress = editingTask.progress;
                                if (masterProgressMap[newStatus] !== undefined) {
                                  newProgress = masterProgressMap[newStatus];
                                }

                                setEditingTask({ ...editingTask, subTasksList: updated, status: newStatus, progress: newProgress });
                              } else {
                                setEditingTask({ ...editingTask, subTasksList: updated });
                              }
                            }}
                          >
                            {(formStatusOptions.length > 0 ? formStatusOptions : ['To Do', 'In Progress', 'Review', 'Done']).map(opt => (
                              <option key={opt} value={opt} style={{ color: 'var(--text-primary)', background: 'var(--surface-color)' }}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', opacity: idx === 0 ? 0.3 : 1 }}
                            disabled={idx === 0}
                            title="Geser ke Atas"
                            onClick={() => {
                              if (idx === 0) return;
                              const updated = [...(editingTask.subTasksList || [])];
                              const temp = updated[idx - 1];
                              updated[idx - 1] = updated[idx];
                              updated[idx] = temp;
                              setEditingTask({ ...editingTask, subTasksList: updated });
                            }}
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', opacity: idx === (editingTask.subTasksList?.length || 0) - 1 ? 0.3 : 1 }}
                            disabled={idx === (editingTask.subTasksList?.length || 0) - 1}
                            title="Geser ke Bawah"
                            onClick={() => {
                              if (idx === (editingTask.subTasksList?.length || 0) - 1) return;
                              const updated = [...(editingTask.subTasksList || [])];
                              const temp = updated[idx + 1];
                              updated[idx + 1] = updated[idx];
                              updated[idx] = temp;
                              setEditingTask({ ...editingTask, subTasksList: updated });
                            }}
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px' }}
                          title="Hapus"
                          onClick={() => {
                            const updated = editingTask.subTasksList!.filter((_, i) => i !== idx);
                            setEditingTask({ ...editingTask, subTasksList: updated });
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {subTask.logs && subTask.logs.length > 0 && (
                        <SubTaskLogViewer logs={subTask.logs} />
                      )}

                    </div>
                  ))}
                  {(!editingTask.subTasksList || editingTask.subTasksList.length === 0) && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '8px' }}>Belum ada sub pekerjaan.</div>
                  )}
                </div>
              </div>

              {/* Multiple File Attachments Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  File Lampiran (Bisa Unggah Lebih dari 1 File)
                </label>
                <input
                  type="file"
                  ref={attachmentInputRef}
                  style={{ display: 'none' }}
                  multiple
                  onChange={handleFileUpload}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div 
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: '8px',
                      padding: '20px',
                      textAlign: 'center',
                      background: 'var(--surface-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onClick={() => attachmentInputRef.current?.click()}
                  >
                    <Paperclip size={24} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      Klik untuk Unggah atau Tarik & Letakkan File di Sini
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Mendukung banyak file sekaligus (Maksimal 25MB per file)
                    </span>
                    {uploadingFile && <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>Mengunggah...</span>}
                  </div>

                  {editingTask.filesList && editingTask.filesList.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--surface-color)', padding: '12px', borderRadius: '10px' }}>
                      {editingTask.filesList.map((f, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', opacity: f.isDeleted ? 0.6 : 1 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: f.isDeleted ? 'var(--text-secondary)' : 'var(--accent-primary)', cursor: 'pointer', textDecoration: f.isDeleted ? 'line-through' : 'none' }} onClick={() => !f.isDeleted && setPreviewFile?.(f)}>
                              <File size={15} />
                              <span style={{ fontWeight: 500 }}>{f.name}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {f.uploadedAt && <span>Diunggah pada {format(new Date(f.uploadedAt), 'dd MMM yyyy, HH:mm')}</span>}
                              {f.isDeleted && f.deletedAt && <span style={{ marginLeft: '6px', color: 'var(--danger)' }}>• Dihapus pada {format(new Date(f.deletedAt), 'dd MMM yyyy, HH:mm')}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {!f.isDeleted && (
                              <>
                                <button
                                  type="button"
                                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 6px' }}
                                  onClick={() => setPreviewFile?.(f)}
                                  title="Pratinjau File"
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  type="button"
                                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px 6px' }}
                                  onClick={() => handleRemoveFileFromEdit(idx)}
                                  title="Hapus Lampiran Ini"
                                >
                                  <X size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <div>
                  {editingTask && editingTask.id !== undefined && (
                    <button 
                      className="btn" 
                      style={{ background: 'var(--primary-color)', color: 'var(--surface-color)', opacity: 0.85 }}
                      onClick={() => {
                        onClose();
                        router.push(`/calendar?search=${encodeURIComponent(editingTask?.nama || '')}`);
                      }}
                    >
                      <Eye size={15} style={{ marginRight: '6px' }} /> Pergi ke Kalender
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={onClose}>Batal</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={loading || uploadingFile}>
                    {loading ? 'Menyimpan...' : 'Simpan Pekerjaan'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
