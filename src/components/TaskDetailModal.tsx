'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, ExternalLink, CalendarDays, Paperclip, Eye, Edit, MessageSquare, Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Task, FileItem, SubTask, CommentItem, LogItem, getDynamicBadgeStyle, getAdditionalPics, getHistoryLogs, getGoogleCalendarUrl, getTaskFiles, getTaskComments, handleExportICS } from '@/utils/taskUtils';

const SubTaskLogViewer = ({ logs, title = "Riwayat Status:" }: { logs: any[], title?: string }) => {
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
          {expanded ? 'Tampilkan Lebih Sedikit' : `Tampilkan ${logs.length - 3} Log Lainnya...`}
        </button>
      )}
    </div>
  );
};

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  setPreviewFile: (file: FileItem) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function TaskDetailModal({ task, onClose, setPreviewFile, onEdit, onDelete }: TaskDetailModalProps) {
  const router = useRouter();
  const [localComments, setLocalComments] = useState<CommentItem[]>([]);
  const [localHistoryLogs, setLocalHistoryLogs] = useState<LogItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (task) {
      setLocalComments(getTaskComments(task));
      setLocalHistoryLogs(getHistoryLogs(task));
      const savedAuthor = localStorage.getItem('commentAuthor');
      if (savedAuthor) setCommentAuthor(savedAuthor);
    }
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
      toast.success('Komentar dihapus');
    } catch {
      toast.error('Gagal menghapus komentar');
      setLocalComments(localComments); // revert
    }
  };

  const handleDeleteLog = async (logIndex: number) => {
    if (!confirm('Hapus riwayat aktivitas ini?')) return;
    const updatedLogs = [...localHistoryLogs];
    updatedLogs.splice(logIndex, 1);
    setLocalHistoryLogs(updatedLogs);
    try {
      await fetch(`/api/tasks/${task!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyLogs: JSON.stringify(updatedLogs) })
      });
      router.refresh();
      toast.success('Aktivitas dihapus');
    } catch {
      toast.error('Gagal menghapus aktivitas');
      setLocalHistoryLogs(localHistoryLogs); // revert
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !commentAuthor.trim()) {
      toast.error('Nama dan komentar tidak boleh kosong');
      return;
    }
    
    localStorage.setItem('commentAuthor', commentAuthor.trim());

    const comment: CommentItem = {
      id: Date.now().toString(),
      author: commentAuthor.trim(),
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
      router.refresh();
    } catch(e) {
      toast.error('Gagal menyimpan komentar');
      setLocalComments(localComments); // revert
    } finally {
      setIsSubmittingComment(false);
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
              <span {...getDynamicBadgeStyle('priority', task.prioritas || 'Medium', 'badge')} style={{ ...getDynamicBadgeStyle('priority', task.prioritas || 'Medium', 'badge').style, marginBottom: '8px' }}>
                {task.prioritas || 'Medium'}
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{task.nama}</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={onClose} title="Tutup">
                <X size={18} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--surface-color)', padding: '16px', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>PIC:</span>
                <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {task.pic} {getAdditionalPics(task).length > 0 && `(+, ${getAdditionalPics(task).join(', ')})`}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Kategori:</span>
                <p style={{ marginTop: '4px' }}>
                  <span {...getDynamicBadgeStyle('category', task.kategori || 'Umum', '')} style={{ ...getDynamicBadgeStyle('category', task.kategori || 'Umum', '').style, display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                    {task.kategori || 'Umum'}
                  </span>
                </p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Status:</span>
                <p style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span {...getDynamicBadgeStyle('status', task.status, '')} style={{ ...getDynamicBadgeStyle('status', task.status, '').style, display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                    {task.status}
                  </span>
                  <span style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '12px' }}>({task.progress || 0}%)</span>
                </p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Repetisi:</span>
                <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>{task.repetisi || 'Tidak Berulang'}</p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Tanggal Mulai:</span>
                <p style={{ fontWeight: '500', color: 'var(--text-primary)', marginTop: '4px' }}>{format(new Date(task.startDate), 'dd MMM yyyy')}</p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Tenggat Waktu:</span>
                <p style={{ fontWeight: '500', color: 'var(--text-primary)', marginTop: '4px' }}>{format(new Date(task.endDate), 'dd MMM yyyy')}</p>
              </div>
            </div>

            {/* Audit Logging Information Box */}
            <div style={{ background: 'var(--input-bg)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={16} color="var(--accent-primary)" /> Log Informasi & Riwayat Perubahan
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '12px' }}>
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
                            <button 
                              type="button" 
                              onClick={() => handleDeleteLog(idx)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}
                              title="Hapus Aktivitas"
                            >
                              <Trash2 size={12} />
                            </button>
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
                  style={{ color: 'var(--text-primary)', lineHeight: 1.5, background: 'var(--input-bg)', padding: '12px', borderRadius: '8px', overflowX: 'auto' }}
                  dangerouslySetInnerHTML={{ __html: task.deskripsi }}
                />
              </div>
            )}

            {/* Sub-Tasks Display */}
            {task.subTasksJson && (() => {
              let subTasks: SubTask[] = [];
              try {
                subTasks = JSON.parse(task.subTasksJson);
              } catch (e) {}
              
              if (subTasks.length === 0) return null;
              
              return (
                <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>Sub Pekerjaan</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {subTasks.map(subTask => (
                      <div key={subTask.id} style={{ padding: '10px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 500, fontSize: '14px' }}>{subTask.text}</span>
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                            backgroundColor: subTask.status === 'Done' ? 'var(--success)' : 
                                             subTask.status === 'Review' ? '#3b82f6' : 
                                             subTask.status === 'In Progress' ? 'var(--warning)' : 
                                             'transparent',
                            color: subTask.status === 'To Do' ? 'var(--text-primary)' : '#fff'
                          }}>
                            {subTask.status}
                          </span>
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
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  File Lampiran ({getTaskFiles(task).length} File)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {getTaskFiles(task).map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--surface-color)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', opacity: f.isDeleted ? 0.6 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: f.isDeleted ? 'line-through' : 'none' }}>
                          <Paperclip size={16} color={f.isDeleted ? "var(--text-secondary)" : "var(--accent-primary)"} />
                          <span style={{ color: f.isDeleted ? 'var(--text-secondary)' : 'inherit' }}>{f.name}</span>
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
                          <button 
                            type="button" 
                            onClick={() => handleDeleteComment(comment.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}
                            title="Hapus Komentar"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{comment.text}</div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Nama Anda" 
                  value={commentAuthor}
                  onChange={e => setCommentAuthor(e.target.value)}
                  style={{ fontSize: '13px', padding: '8px 12px' }}
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
                    disabled={isSubmittingComment || !newComment.trim() || !commentAuthor.trim()}
                    style={{ padding: '0 16px', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>

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
              <a 
                href={getGoogleCalendarUrl(task)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary"
              >
                <ExternalLink size={16} /> Tambah ke Google Calendar
              </a>
              <button className="btn btn-secondary" onClick={() => handleExportICS(task)}>
                <CalendarDays size={16} /> Download .ics
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
