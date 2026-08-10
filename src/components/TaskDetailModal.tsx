'use client';
import { useMaster } from '@/context/MasterContext';
import { useState, useEffect } from 'react';

import { useRouter, usePathname } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, ExternalLink, CalendarDays, Paperclip, Eye, Edit, MessageSquare, Send, Trash2, Copy, User } from 'lucide-react';
import { format } from 'date-fns';
import { Task, FileItem, SubTask, CommentItem, LogItem, getDynamicBadgeStyle, getAdditionalPics, getHistoryLogs, getGoogleCalendarUrl, getTaskFiles, getTaskComments, handleExportICS, formatRecurrenceText, formatDescription } from '@/utils/taskUtils';
import TaskTimeline from './TaskTimeline';

const SubTaskLogViewer = ({ logs, title = "Riwayat Status:" }: { logs: any[], title?: string }) => {
  if (!logs || logs.length === 0) return null;

  return (
    <details style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
      <summary style={{ fontWeight: 600, cursor: 'pointer', outline: 'none', padding: '4px 0' }}>{title} ({logs.length})</summary>
      <div style={{ paddingLeft: '8px', borderLeft: '2px solid var(--border-color)', marginTop: '4px', marginLeft: '4px' }}>
        {logs.map((log: any, lidx: number) => (
          <div key={lidx} style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px' }}>{format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm')}</span>
            <span style={{ color: 'var(--text-primary)', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>- {log.status}</span>
          </div>
        ))}
      </div>
    </details>
  );
};

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  setPreviewFile: (file: FileItem) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

import { useSession } from 'next-auth/react';

export default function TaskDetailModal({ task, onClose, setPreviewFile, onEdit, onDelete }: TaskDetailModalProps) {
  const { data: session } = useSession();
  const userRole: string = (session?.user as any)?.role || 'PIC';
  const { masterColors } = useMaster();
  const router = useRouter();
  const pathname = usePathname();
  const { addActivityLog } = useNotifications();
  const [localComments, setLocalComments] = useState<CommentItem[]>([]);
  const [localHistoryLogs, setLocalHistoryLogs] = useState<LogItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(25);
  const [maxTaskFilesSizeMb, setMaxTaskFilesSizeMb] = useState(100);

  useEffect(() => {
    if (task) {
      setLocalComments(getTaskComments(task));
      setLocalHistoryLogs(getHistoryLogs(task));
      const savedAuthor = localStorage.getItem('commentAuthor');
      if (savedAuthor) setCommentAuthor(savedAuthor);
    }
    
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.max_file_size_mb) setMaxFileSizeMb(Number(data.max_file_size_mb));
        if (data.max_task_files_size_mb) setMaxTaskFilesSizeMb(Number(data.max_task_files_size_mb));
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, [task]);

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Hapus komentar ini?')) return;
    const updatedComments = localComments.filter(c => c.id !== commentId);
    setLocalComments(updatedComments);
    try {
      await fetch(`/api/tasks/${task!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentsJson: JSON.stringify(updatedComments) })
      });
      router.refresh();
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('tasksUpdated'));
      toast.success('Komentar dihapus');
    } catch {
      toast.error('Gagal menghapus komentar');
      setLocalComments(localComments); // revert
    }
  };


  const handleAddComment = async () => {
    const finalAuthor = session?.user?.name || commentAuthor;
    if (!newComment.trim() || !finalAuthor.trim()) {
      toast.error('Nama dan komentar tidak boleh kosong');
      return;
    }
    
    localStorage.setItem('commentAuthor', finalAuthor.trim());

    const comment: CommentItem = {
      id: Date.now().toString(),
      author: finalAuthor.trim(),
      text: newComment.trim(),
      createdAt: new Date().toISOString()
    };

    const newLog: LogItem = {
      action: `Menambahkan komentar`,
      details: `"${newComment.trim()}"`,
      timestamp: new Date().toISOString()
    };
    const updatedLogs = [...localHistoryLogs, newLog];
    const updatedComments = [...localComments, comment];

    setLocalComments(updatedComments);
    setLocalHistoryLogs(updatedLogs);
    setNewComment('');
    setIsSubmittingComment(true);

    try {
      const res = await fetch(`/api/tasks/${task!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentsJson: JSON.stringify(updatedComments),
          historyLogsJson: JSON.stringify(updatedLogs)
        })
      });
      if (!res.ok) throw new Error('Gagal menyimpan komentar');
      toast.success('Komentar berhasil ditambahkan');
      if (addActivityLog) addActivityLog('NEW_COMMENT', 'Komentar Baru', `Komentar ditambahkan oleh ${finalAuthor.trim()} pada pekerjaan "${task!.nama}"`, 'info');
      router.refresh();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('tasksUpdated'));
    } catch (e) {
      toast.error('Gagal menyimpan komentar');
      setLocalComments(localComments); // revert
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCopyTaskDetails = async () => {
    try {
      let extraPics = '';
      const pics = getAdditionalPics(task!);
      if (pics.length > 0) {
        extraPics = `, ${pics.join(', ')}`;
      }

      let location = '-';
      if (task!.lokasi) {
        try {
          const loc = JSON.parse(task!.lokasi);
          if (loc.tipe === 'online') {
            location = `Online: ${loc.linkZoom || ''}`;
          } else if (loc.tipe === 'offline') {
            location = `Offline: ${loc.lokasiFisik || ''}`;
          }
        } catch(e) { location = task!.lokasi; }
      }

      const textToCopy = `*Detail Pekerjaan:*
Judul: ${task!.nama}
PIC: ${task!.pic}${extraPics}
Kategori: ${task!.kategori || 'Umum'}
Status: ${task!.status} (${task!.progress || 0}%)
Prioritas: ${task!.prioritas || 'Medium'}
Tanggal Mulai: ${format(new Date(task!.startDate), 'dd MMM yyyy')}${!task!.isAllDay && task!.startTime ? ` Jam ${task!.startTime}` : ''}
Tenggat Waktu: ${format(new Date(task!.endDate), 'dd MMM yyyy')}${!task!.isAllDay && task!.endTime ? ` Jam ${task!.endTime}` : ''}
Lokasi: ${location}

*Deskripsi:*
${task!.deskripsi || '-'}`;

      await navigator.clipboard.writeText(textToCopy);
      toast.success('Detail pekerjaan berhasil disalin!');
      if (addActivityLog) addActivityLog('COPY_TASK', 'Salin Pekerjaan', `Menyalin detail pekerjaan "${task!.nama}"`, 'info');
    } catch (e) {
      toast.error('Gagal menyalin detail pekerjaan.');
      console.error(e);
    }
  };

  if (!task) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay">
        <motion.div
          className="modal-content"
          style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              {(() => {
                const badge = getDynamicBadgeStyle('priority', task.prioritas || 'Medium', task.prioritas === 'Urgent' ? 'badge badge-urgent' : task.prioritas === 'High' ? 'badge badge-high' : task.prioritas === 'Low' ? 'badge badge-low' : 'badge badge-medium', masterColors);
                return (
                  <span className={badge.className} style={{ ...badge.style, marginBottom: '8px' }}>
                    {task.prioritas || 'Medium'}
                  </span>
                );
              })()}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{task.nama}</h2>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={handleCopyTaskDetails}
                  title="Salin Detail Pekerjaan ke Teks"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={onClose} title="Tutup">
                <X size={18} />
              </button>
            </div>
          </div>

          <TaskTimeline 
            startDate={task.startDate} 
            endDate={task.endDate || task.startDate} 
            subTasks={task.subTasksJson ? JSON.parse(task.subTasksJson) : []} 
            masterColors={masterColors} 
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--surface-color)', padding: '16px', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>PIC:</span>
                <p style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  <span {...getDynamicBadgeStyle('pic', task.pic, '', masterColors)} style={{ ...getDynamicBadgeStyle('pic', task.pic, '', masterColors).style, display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                    {task.pic}
                  </span>
                  {getAdditionalPics(task).length > 0 && getAdditionalPics(task).map((p, i) => (
                    <span key={i} {...getDynamicBadgeStyle('pic', p, '', masterColors)} style={{ ...getDynamicBadgeStyle('pic', p, '', masterColors).style, display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                      {p}
                    </span>
                  ))}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Kategori:</span>
                <p style={{ marginTop: '4px' }}>
                  {(() => {
                    const badge = getDynamicBadgeStyle('cat', task.kategori || 'Umum', '', masterColors);
                    return (
                      <span className={badge.className} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', ...badge.style }}>
                        {task.kategori || 'Umum'}
                      </span>
                    );
                  })()}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Status:</span>
                <p style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {(() => {
                    const badge = getDynamicBadgeStyle('status', task.status, '', masterColors);
                    return (
                      <span className={badge.className} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', ...badge.style }}>
                        {task.status}
                      </span>
                    );
                  })()}
                  <span style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '12px' }}>({task.progress || 0}%)</span>
                </p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Repetisi:</span>
                <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>{formatRecurrenceText(task.repetisi)}</p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Tanggal Mulai:</span>
                <p style={{ fontWeight: '500', color: 'var(--text-primary)', marginTop: '4px' }}>{format(new Date(task.startDate), 'dd MMM yyyy')}{!task.isAllDay && task.startTime ? `, ${task.startTime}` : ''}</p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Tenggat Waktu:</span>
                <p style={{ fontWeight: '500', color: 'var(--text-primary)', marginTop: '4px' }}>{format(new Date(task.endDate), 'dd MMM yyyy')}{!task.isAllDay && task.endTime ? `, ${task.endTime}` : ''}</p>
              </div>

              {(() => {
                if (!task.lokasi) return null;
                try {
                  const loc = JSON.parse(task.lokasi);
                  if (loc.tipe === 'online') {
                    return (
                      <div style={{ gridColumn: '1 / -1', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Lokasi (Online):</span>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                          <p style={{ fontWeight: '500', color: 'var(--accent-primary)' }}>
                            <a href={loc.linkZoom} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>{loc.linkZoom || 'Tidak ada link'}</a>
                          </p>
                          <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Jam: {loc.jam ? `${loc.jam} WITA` : '-'}</p>
                        </div>
                      </div>
                    );
                  } else if (loc.tipe === 'offline') {
                    return (
                      <div style={{ gridColumn: '1 / -1', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Lokasi (Offline):</span>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                          <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{loc.lokasiFisik || '-'}</p>
                          <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Jam: {loc.jam ? `${loc.jam} WITA` : '-'}</p>
                        </div>
                      </div>
                    );
                  }
                } catch (e) {
                  return (
                    <div style={{ gridColumn: '1 / -1', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Lokasi:</span>
                      <p style={{ fontWeight: '500', color: 'var(--text-primary)', marginTop: '4px' }}>{task.lokasi}</p>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Audit Logging Information Box */}
            <div style={{ background: 'var(--input-bg)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={16} color="var(--accent-primary)" /> Log Informasi & Riwayat Perubahan
              </h4>
              <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Dibuat Pada</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {task.createdAt ? format(new Date(task.createdAt), 'dd MMM yyyy HH:mm') : '-'}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Diedit Terakhir</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {task.lastEditedAt ? format(new Date(task.lastEditedAt), 'dd MMM yyyy HH:mm') : 'Belum pernah'}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Frekuensi Edit</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                    {task.editCount || 0} kali
                  </span>
                </div>
              </div>

              {/* Activity History Timeline List */}
              {localHistoryLogs.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Timeline Aktivitas:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                    {localHistoryLogs.map((log, idx) => (
                      <div key={idx} style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 600 }}>• {log.action}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                        </div>
                        {(log as any).details && (
                          <div style={{ paddingLeft: '8px', color: 'var(--text-primary)', fontStyle: 'italic', fontSize: '10px' }}>
                            Diubah: {(log as any).details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {task.deskripsi && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Deskripsi</h4>
                <div 
                  style={{ color: 'var(--text-primary)', lineHeight: 1.5, background: 'var(--input-bg)', padding: '12px', borderRadius: '8px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{ __html: formatDescription(task.deskripsi) }}
                />
              </div>
            )}

            {task.catatan && (
              <div style={{ marginTop: '8px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Catatan Tambahan</h4>
                <div 
                  style={{ color: 'var(--text-primary)', lineHeight: 1.5, background: 'var(--surface-color)', padding: '12px', borderRadius: '8px', overflowX: 'auto', whiteSpace: 'pre-wrap', border: '1px solid var(--border-color)', borderLeft: '3px solid var(--accent-primary)' }}
                >
                  {task.catatan}
                </div>
              </div>
            )}

            {/* Sub-Tasks Display */}
            {task.subTasksJson && (() => {
              let subTasks: SubTask[] = [];
              try {
                subTasks = JSON.parse(task.subTasksJson);
              } catch (e) { }

              if (subTasks.length === 0) return null;

              return (
                <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>Sub Pekerjaan</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {subTasks.map(subTask => (
                      <div key={subTask.id} style={{ padding: '10px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontWeight: 500, fontSize: '14px', wordBreak: 'break-word', whiteSpace: 'normal' }} dangerouslySetInnerHTML={{ __html: formatDescription(subTask.text) }} />
                            {(subTask.pic || subTask.tenggatWaktu) && (
                              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {subTask.pic && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <User size={12} /> {subTask.pic}
                                  </span>
                                )}
                                {subTask.tenggatWaktu && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CalendarDays size={12} /> {format(new Date(subTask.tenggatWaktu), 'dd MMM yyyy')}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {(() => {
                            const badge = getDynamicBadgeStyle('status', subTask.status, '', masterColors);
                            return (
                              <span className={badge.className} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, flexShrink: 0, ...badge.style }}>
                                {subTask.status}
                              </span>
                            );
                          })()}
                        </div>
                        {subTask.logs && subTask.logs.length > 0 && (
                          <SubTaskLogViewer logs={subTask.logs} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Multiple Files Detail Display */}
            {getTaskFiles(task).length > 0 && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    File Lampiran ({getTaskFiles(task).length} File, Maks {maxFileSizeMb} MB/file)
                  </h4>
                  <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
                    Total terpakai: {(getTaskFiles(task).filter(f => !f.isDeleted).reduce((acc, f) => acc + (f.size || 0), 0) / (1024 * 1024)).toFixed(2)} MB dari batas maksimal {maxTaskFilesSizeMb} MB
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {getTaskFiles(task).map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--surface-color)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', opacity: f.isDeleted ? 0.6 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: f.isDeleted ? 'line-through' : 'none' }}>
                          <Paperclip size={16} color={f.isDeleted ? "var(--text-secondary)" : "var(--accent-primary)"} />
                          <span style={{ color: f.isDeleted ? 'var(--text-secondary)' : 'inherit', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.name}>
                            {f.name} {f.size ? `(${(f.size / (1024*1024)).toFixed(2)} MB)` : ''}
                          </span>
                        </div>
                        {!f.isDeleted && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px' }}
                            onClick={() => setPreviewFile(f)}
                          >
                            <Eye size={14} color="var(--text-secondary)" />
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {f.uploadedAt && <span>Diunggah pada {format(new Date(f.uploadedAt), 'dd MMM yyyy, HH:mm')}</span>}
                        {f.isDeleted && f.deletedAt && <span style={{ marginLeft: '6px', color: 'var(--danger)' }}>• Dihapus pada {format(new Date(f.deletedAt), 'dd MMM yyyy, HH:mm')}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div style={{ background: 'var(--surface-color)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={16} color="var(--accent-primary)" /> Komentar
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
                {localComments.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', padding: '12px 0' }}>Belum ada komentar.</div>
                ) : (
                  localComments.map(comment => (
                    <div key={comment.id} style={{ background: 'var(--bg-color)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>{comment.author}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{format(new Date(comment.createdAt), 'dd MMM yyyy HH:mm')}</span>
                          {userRole !== 'SPV' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}
                              title="Hapus Komentar"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{comment.text}</div>
                    </div>
                  ))
                )}
              </div>
 
              {userRole !== 'SPV' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Nama Anda"
                    value={session?.user?.name || commentAuthor}
                    readOnly
                    style={{ fontSize: '13px', padding: '8px 12px', background: 'var(--surface-color)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <textarea
                      className="input"
                      placeholder="Tulis komentar..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      rows={2}
                      style={{ flex: 1, resize: 'none', fontSize: '13px', padding: '8px 12px' }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleAddComment}
                      disabled={isSubmittingComment || !newComment.trim() || !(session?.user?.name || commentAuthor).trim()}
                      style={{ padding: '0 16px', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
 
            {/* Row 1: Manage Task Actions */}
            {(onEdit || onDelete) && userRole !== 'SPV' && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                {onEdit && (
                  <button className="btn btn-secondary" onClick={onEdit}>
                    <Edit size={16} /> Edit Pekerjaan Ini
                  </button>
                )}
                {onDelete && (
                  <button className="btn btn-danger" onClick={onDelete}>
                    <X size={16} /> Hapus Pekerjaan
                  </button>
                )}
              </div>
            )}

            {/* Row 2: Calendar Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: (onEdit || onDelete) && userRole !== 'SPV' ? '4px' : '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href={getGoogleCalendarUrl(task)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <ExternalLink size={16} /> Tambah ke Google Calendar
              </a>
              <button 
                className="btn btn-secondary" 
                onClick={() => handleExportICS(task)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <CalendarDays size={16} /> Download .ics
              </button>
              {pathname !== '/calendar' && (
                <button 
                  className="btn" 
                  style={{ 
                    background: 'transparent', 
                    color: 'var(--text-secondary)', 
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    fontWeight: 500,
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    onClose();
                    router.push(`/calendar?search=${encodeURIComponent(task.nama)}`);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.borderColor = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'var(--surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Eye size={15} /> Pergi ke Kalender
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
