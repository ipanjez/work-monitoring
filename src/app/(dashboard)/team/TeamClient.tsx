'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, CheckCircle2, Clock, Activity, ShieldCheck, Mail, Phone, ExternalLink, X, History, Paperclip, Eye, File, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export type FileItem = {
  url: string;
  name: string;
};

export type LogItem = {
  action: string;
  timestamp: string;
};

type Task = {
  id: number;
  nama: string;
  pic: string;
  status: string;
  prioritas?: string | null;
  kategori?: string | null;
  progress?: number | null;
  deskripsi?: string | null;
  catatan?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  filesJson?: string | null;
  isAllDay?: boolean | null;
  startTime?: string | null;
  endTime?: string | null;
  repetisi?: string | null;
  additionalPics?: string | null;
  editCount?: number | null;
  lastEditedAt?: string | Date | null;
  historyLogsJson?: string | null;
  createdAt?: string | Date | null;
  startDate: string | Date;
  endDate: string | Date;
};

export default function TeamClient({ tasks: initialTasks }: { tasks: Task[] }) {
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks);
  const [selectedPic, setSelectedPic] = useState<string | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  
  const [masterPics, setMasterPics] = useState<string[]>([]);
  
  useEffect(() => {
    const loadMasterPics = () => {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.master_pics) {
            setMasterPics(data.master_pics);
          }
        })
        .catch(e => console.error(e));
    };
    loadMasterPics();
    window.addEventListener('tasksUpdated', loadMasterPics);
    return () => window.removeEventListener('tasksUpdated', loadMasterPics);
  }, []);

  // Group tasks by PIC
  const picStatsMap: Record<string, { total: number; done: number; inProgress: number; toDo: number; urgent: number; tasks: Task[] }> = {};
  
  masterPics.forEach(pic => {
    picStatsMap[pic] = { total: 0, done: 0, inProgress: 0, toDo: 0, urgent: 0, tasks: [] };
  });

  localTasks.forEach(t => {
    let picNames = [t.pic || 'Unassigned'];
    if (t.additionalPics) {
      try {
        const extra = JSON.parse(t.additionalPics);
        if (Array.isArray(extra)) {
          picNames = picNames.concat(extra.filter(Boolean));
        }
      } catch(e) {}
    }
    picNames = Array.from(new Set(picNames)); // remove duplicates

    picNames.forEach(picName => {
      if (!picStatsMap[picName]) {
        picStatsMap[picName] = { total: 0, done: 0, inProgress: 0, toDo: 0, urgent: 0, tasks: [] };
      }
      const stat = picStatsMap[picName];
      stat.total += 1;
      if (t.status === 'Done') stat.done += 1;
      else if (t.status === 'In Progress') stat.inProgress += 1;
      else stat.toDo += 1;

      if (t.prioritas === 'Urgent') stat.urgent += 1;
      stat.tasks.push(t);
    });
  });

  const picList = Object.keys(picStatsMap);

  const getTaskFiles = (task: Task): FileItem[] => {
    if (task.filesJson) {
      try {
        return JSON.parse(task.filesJson);
      } catch (e) {}
    }
    if (task.fileUrl) {
      return [{ url: task.fileUrl, name: task.fileName || 'File Lampiran' }];
    }
    return [];
  };

  const getAdditionalPics = (task: Task): string[] => {
    if (task.additionalPics) {
      try {
        const parsed = JSON.parse(task.additionalPics);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  };

  const getHistoryLogs = (task: Task): LogItem[] => {
    if (task.historyLogsJson) {
      try {
        const parsed = JSON.parse(task.historyLogsJson);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  };

  const getPriorityBadgeClass = (p?: string | null) => {
    switch (p) {
      case 'Urgent': return 'badge-urgent';
      case 'High': return 'badge-high';
      case 'Low': return 'badge-low';
      default: return 'badge-medium';
    }
  };

  const getGoogleCalendarUrl = (task: Task) => {
    const title = encodeURIComponent(task.nama);
    const details = encodeURIComponent(`PIC: ${task.pic}\nStatus: ${task.status}\nDeskripsi: ${task.deskripsi || '-'}`);
    const dates = `${new Date(task.startDate).toISOString().replace(/-|:|\.\d+/g, '')}/${new Date(task.endDate).toISOString().replace(/-|:|\.\d+/g, '')}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
  };

  const handleSaveEdit = async () => {
    if (!detailTask) return;
    setLoading(true);
    try {
      const payload = {
        ...editForm,
        startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : undefined,
        endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : undefined,
      };
      
      const res = await fetch(`/api/tasks/${detailTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Gagal menyimpan pekerjaan');
      
      const savedTask = await res.json();
      
      // Update local state
      setLocalTasks(prev => prev.map(t => t.id === savedTask.id ? savedTask : t));
      setDetailTask(savedTask);
      setIsEditing(false);
      
      // Dispatch event to update other components like Sidebar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('tasksUpdated'));
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Manajemen Tim & PIC</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Direktori personil penanggung jawab (PIC) serta pemantauan produktivitas & beban kerja tim.
        </p>
      </div>

      {/* Team Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {picList.map((picName) => {
          const stat = picStatsMap[picName];
          const rate = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
          const isSelected = selectedPic === picName;

          return (
            <div 
              key={picName} 
              className="glass" 
              style={{ 
                padding: '20px', 
                border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setSelectedPic(isSelected ? null : picName)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: 'var(--accent-primary)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  {picName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{picName}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Person In Charge</span>
                </div>
              </div>

              {/* Progress & Stats */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Penyelesaian Tugas</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{rate}%</span>
                </div>
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${rate}%`, backgroundColor: rate === 100 ? 'var(--success)' : 'var(--accent-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', background: 'var(--input-bg)', padding: '10px', borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Done</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{stat.done}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Proses</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--warning)' }}>{stat.inProgress}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>To Do</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{stat.toDo}</span>
                </div>
              </div>
            </div>
          );
        })}

        {picList.length === 0 && (
          <div className="glass" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
            Belum ada PIC yang terdaftar di dalam sistem.
          </div>
        )}
      </div>

      {/* Selected PIC Detail Table */}
      {selectedPic && picStatsMap[selectedPic] && (
        <div className="glass" style={{ padding: '24px', marginTop: '12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Daftar Pekerjaan Ditangani oleh: <span style={{ color: 'var(--accent-primary)' }}>{selectedPic}</span> (Klik nama pekerjaan untuk membuka detail)
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px' }}>Nama Pekerjaan</th>
                  <th style={{ padding: '12px' }}>Kategori</th>
                  <th style={{ padding: '12px' }}>Prioritas</th>
                  <th style={{ padding: '12px' }}>Status & Progress</th>
                  <th style={{ padding: '12px' }}>Tenggat Waktu</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {picStatsMap[selectedPic].tasks.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={() => { setDetailTask(t); setEditForm(t); setIsEditing(false); }}>
                      {t.nama}
                    </td>
                    <td style={{ padding: '12px' }}>{t.kategori || 'Umum'}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${getPriorityBadgeClass(t.prioritas)}`}>
                        {t.prioritas || 'Medium'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{t.status} ({t.progress || 0}%)</td>
                    <td style={{ padding: '12px' }}>{format(new Date(t.endDate), 'dd MMM yyyy')}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => { setDetailTask(t); setEditForm(t); setIsEditing(false); }}>
                        Detail Pekerjaan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      <AnimatePresence>
        {detailTask && (
          <div className="modal-overlay" onClick={() => setDetailTask(null)}>
            <motion.div 
              className="modal-content"
              style={{ maxWidth: '650px' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <span className={`badge ${getPriorityBadgeClass(detailTask.prioritas)}`} style={{ marginBottom: '8px' }}>
                    {detailTask.prioritas || 'Medium'} Priority
                  </span>
                  {!isEditing ? (
                    <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{detailTask.nama}</h2>
                  ) : (
                    <input 
                      type="text"
                      className="input"
                      value={editForm.nama || ''}
                      onChange={(e) => setEditForm({...editForm, nama: e.target.value})}
                      style={{ fontSize: '18px', fontWeight: 'bold', width: '100%', marginTop: '8px' }}
                    />
                  )}
                </div>
                <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => { setDetailTask(null); setIsEditing(false); }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--surface-color)', padding: '16px', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>PIC Utama</span>
                    {!isEditing ? (
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{detailTask.pic}</span>
                    ) : (
                      <input className="input" value={editForm.pic || ''} onChange={e => setEditForm({...editForm, pic: e.target.value})} />
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Kategori</span>
                    {!isEditing ? (
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{detailTask.kategori || 'Umum'}</span>
                    ) : (
                      <input className="input" value={editForm.kategori || ''} onChange={e => setEditForm({...editForm, kategori: e.target.value})} />
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Status</span>
                    {!isEditing ? (
                      <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{detailTask.status} ({detailTask.progress || 0}%)</span>
                    ) : (
                      <select className="input" value={editForm.status || 'To Do'} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Tenggat Waktu</span>
                    {!isEditing ? (
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{format(new Date(detailTask.endDate), 'dd MMM yyyy')}</span>
                    ) : (
                      <input type="date" className="input" value={editForm.endDate ? new Date(editForm.endDate).toISOString().split('T')[0] : ''} onChange={e => setEditForm({...editForm, endDate: e.target.value})} />
                    )}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Deskripsi</h4>
                  {!isEditing ? (
                    detailTask.deskripsi ? (
                      <p style={{ color: 'var(--text-primary)', lineHeight: 1.5, background: 'var(--input-bg)', padding: '12px', borderRadius: '8px' }}>
                        {detailTask.deskripsi}
                      </p>
                    ) : <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Tidak ada deskripsi</span>
                  ) : (
                    <textarea 
                      className="input" 
                      rows={3} 
                      value={editForm.deskripsi || ''} 
                      onChange={e => setEditForm({...editForm, deskripsi: e.target.value})} 
                    />
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
                  {!isEditing ? (
                    <>
                      <a href={getGoogleCalendarUrl(detailTask)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                        <CalendarDays size={16} /> Google Calendar
                      </a>
                      <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                        Edit di Sini
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-secondary" onClick={() => { setIsEditing(false); setEditForm(detailTask); }}>
                        Batal
                      </button>
                      <button className="btn btn-primary" onClick={handleSaveEdit} disabled={loading}>
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
