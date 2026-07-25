'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Plus, Paperclip, File, Eye } from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import { Task, FileItem, SubTask } from '@/utils/taskUtils';
import toast from 'react-hot-toast';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

export type EditingTaskType = Partial<Task> & {
  filesList?: FileItem[];
  additionalPicsList?: string[];
  isCustomCategory?: boolean;
  isCustomPic?: boolean;
  customRecurrenceSettings?: any;
  subTasksList?: SubTask[];
};

interface TaskAddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit: EditingTaskType | null;
  onSave: (payload: any) => Promise<void>;
  formPicOptions: string[];
  formCategoryOptions: string[];
  setPreviewFile: (file: FileItem) => void;
}

export default function TaskAddEditModal({
  isOpen,
  onClose,
  taskToEdit,
  onSave,
  formPicOptions,
  formCategoryOptions,
  setPreviewFile
}: TaskAddEditModalProps) {
  const [editingTask, setEditingTask] = useState<EditingTaskType | null>(null);
  const [customAdditionalPics, setCustomAdditionalPics] = useState<number[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && taskToEdit) {
      setEditingTask(JSON.parse(JSON.stringify(taskToEdit)));
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingTask) return;
    
    setUploadingFile(true);
    toast.loading('Mengunggah file...', { id: 'upload' });
    
    try {
      const filesArr = Array.from(e.target.files);
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
        setEditingTask({
          ...editingTask,
          filesList: [...(editingTask.filesList || []), ...newFiles]
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

      const payload = {
        ...editingTask,
        filesJson,
        additionalPics: additionalPicsJson,
        subTasksJson,
        customRecurrenceSettings: customRecurrenceSettingsStr
      };
      
      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && editingTask && (
        <div className="modal-overlay">
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
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Penanggung Jawab (PIC Utama & Tambahan) *
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
                    {!editingTask.isCustomPic ? (
                      <select 
                        className="input" 
                        value={editingTask.pic || ''} 
                        onChange={e => {
                          if (e.target.value === '__custom__') {
                            setEditingTask({ ...editingTask, pic: '', isCustomPic: true });
                          } else {
                            setEditingTask({ ...editingTask, pic: e.target.value });
                          }
                        }}
                      >
                        <option value="">-- Pilih PIC Utama --</option>
                        {formPicOptions.map((p, idx) => (
                          <option key={idx} value={p}>{p}</option>
                        ))}
                        <option value="__custom__">+ Ketik Nama PIC Baru...</option>
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input 
                          className="input" 
                          placeholder="Nama PIC Utama Baru..." 
                          value={editingTask.pic || ''} 
                          onChange={e => setEditingTask({ ...editingTask, pic: e.target.value })} 
                        />
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ padding: '6px' }}
                          onClick={() => setEditingTask({ ...editingTask, isCustomPic: false })}
                          title="Kembali ke Dropdown PIC"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingTask.additionalPicsList && editingTask.additionalPicsList.map((extraPic, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {(!customAdditionalPics.includes(idx)) ? (
                        <select
                          className="input"
                          value={extraPic}
                          onChange={e => {
                            if (e.target.value === '__custom__') {
                               setCustomAdditionalPics([...customAdditionalPics, idx]);
                               handleUpdateAdditionalPic(idx, '');
                            } else {
                               handleUpdateAdditionalPic(idx, e.target.value);
                            }
                          }}
                        >
                          <option value="">-- Pilih PIC Tambahan --</option>
                          {formPicOptions.map((p, i) => (
                            <option key={i} value={p}>{p}</option>
                          ))}
                          <option value="__custom__">+ Ketik Nama PIC Baru...</option>
                        </select>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                          <input 
                            className="input" 
                            placeholder={`Nama PIC Tambahan ${idx + 1}...`} 
                            value={extraPic} 
                            onChange={e => handleUpdateAdditionalPic(idx, e.target.value)} 
                          />
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            style={{ padding: '6px' }}
                            onClick={() => {
                               setCustomAdditionalPics(customAdditionalPics.filter(i => i !== idx));
                               handleUpdateAdditionalPic(idx, '');
                            }}
                            title="Kembali ke Dropdown PIC"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      <button 
                        type="button" 
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px' }}
                        onClick={() => {
                          handleRemoveAdditionalPic(idx);
                          setCustomAdditionalPics(customAdditionalPics.filter(i => i !== idx).map(i => i > idx ? i - 1 : i));
                        }}
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Kategori *
                  </label>
                  {!editingTask.isCustomCategory ? (
                    <select 
                      className="input" 
                      value={editingTask.kategori || 'Umum'} 
                      onChange={e => {
                        if (e.target.value === '__custom__') {
                          setEditingTask({ ...editingTask, kategori: '', isCustomCategory: true });
                        } else {
                          setEditingTask({ ...editingTask, kategori: e.target.value });
                        }
                      }}
                    >
                      {formCategoryOptions.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                      <option value="__custom__">+ Ketik Kategori Baru...</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input 
                        className="input" 
                        placeholder="Nama Kategori Baru..." 
                        value={editingTask.kategori || ''} 
                        onChange={e => setEditingTask({ ...editingTask, kategori: e.target.value })} 
                      />
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '6px' }}
                        onClick={() => setEditingTask({ ...editingTask, kategori: 'Umum', isCustomCategory: false })}
                        title="Kembali ke Pilihan Dropdown"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Status
                  </label>
                  <select className="input" value={editingTask.status || 'To Do'} onChange={e => {
                    const newStatus = e.target.value;
                    if (newStatus === 'Done') {
                      setEditingTask({ ...editingTask, status: newStatus, progress: 100 });
                    } else if (newStatus === 'In Progress') {
                      setEditingTask({ ...editingTask, status: newStatus, progress: 50 });
                    } else if (newStatus === 'To Do') {
                      setEditingTask({ ...editingTask, status: newStatus, progress: 0 });
                    } else {
                      setEditingTask({ ...editingTask, status: newStatus });
                    }
                  }}>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Prioritas
                  </label>
                  <select className="input" value={editingTask.prioritas || 'Medium'} onChange={e => setEditingTask({ ...editingTask, prioritas: e.target.value })}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
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
                    Seharian (All Day)
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
                  onBlur={newContent => setEditingTask({ ...editingTask, deskripsi: newContent })}
                  onChange={() => {}}
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
                        status: 'To Do',
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
                        <input 
                          className="input" 
                          style={{ flex: 1 }}
                          placeholder="Deskripsi Sub Pekerjaan..." 
                          value={subTask.text} 
                          onChange={e => {
                            const updated = [...(editingTask.subTasksList || [])];
                            updated[idx].text = e.target.value;
                            setEditingTask({ ...editingTask, subTasksList: updated });
                          }} 
                        />
                        <select 
                          className="input" 
                          style={{ width: '130px', flexShrink: 0, 
                            backgroundColor: subTask.status === 'Done' ? 'var(--success)' : 
                                             subTask.status === 'In Progress' ? 'var(--warning)' : 
                                             'var(--surface-color)',
                            color: subTask.status === 'To Do' ? 'var(--text-primary)' : '#fff'
                          }}
                          value={subTask.status}
                          onChange={e => {
                            const newStatus = e.target.value as 'To Do' | 'In Progress' | 'Done';
                            const updated = [...(editingTask.subTasksList || [])];
                            updated[idx].status = newStatus;
                            setEditingTask({ ...editingTask, subTasksList: updated });
                          }}
                        >
                          <option value="To Do" style={{ color: 'var(--text-primary)', background: 'var(--surface-color)' }}>To Do</option>
                          <option value="In Progress" style={{ color: 'var(--text-primary)', background: 'var(--surface-color)' }}>In Progress</option>
                          <option value="Done" style={{ color: 'var(--text-primary)', background: 'var(--surface-color)' }}>Done</option>
                        </select>
                        <button 
                          type="button" 
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px', alignSelf: 'center' }}
                          onClick={() => {
                            const updated = editingTask.subTasksList!.filter((_, i) => i !== idx);
                            setEditingTask({ ...editingTask, subTasksList: updated });
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      {subTask.logs && subTask.logs.length > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '4px' }}>
                          <div style={{ fontWeight: 600, marginBottom: '2px' }}>Log Status:</div>
                          {subTask.logs.map((log, lidx) => (
                            <div key={lidx} style={{ display: 'flex', gap: '8px' }}>
                              <span style={{ minWidth: '110px' }}>{format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm')}</span>
                              <span>- {log.status}</span>
                            </div>
                          ))}
                        </div>
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
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => attachmentInputRef.current?.click()}
                    disabled={uploadingFile}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Paperclip size={16} /> {uploadingFile ? 'Mengunggah...' : '+ Unggah File Lampiran (Bisa >1)'}
                  </button>

                  {editingTask.filesList && editingTask.filesList.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--surface-color)', padding: '12px', borderRadius: '10px' }}>
                      {editingTask.filesList.map((f, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', opacity: f.isDeleted ? 0.6 : 1 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: f.isDeleted ? 'var(--text-secondary)' : 'var(--accent-primary)', cursor: 'pointer', textDecoration: f.isDeleted ? 'line-through' : 'none' }} onClick={() => !f.isDeleted && setPreviewFile(f)}>
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
                                  onClick={() => setPreviewFile(f)}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button className="btn btn-secondary" onClick={onClose}>Batal</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading || uploadingFile}>
                  {loading ? 'Menyimpan...' : 'Simpan Pekerjaan'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
