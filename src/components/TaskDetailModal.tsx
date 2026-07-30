'use client';

import { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { X, History, ExternalLink, CalendarDays, Paperclip, Eye, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Task, FileItem, SubTask, getPriorityBadgeClass, getAdditionalPics, getHistoryLogs, getGoogleCalendarUrl, getTaskFiles, handleExportICS } from '@/utils/taskUtils';

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
              <span className={`badge ${getPriorityBadgeClass(task.prioritas)}`} style={{ marginBottom: '8px' }}>
                {task.prioritas || 'Medium'} Priority
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
                <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>{task.kategori || 'Umum'}</p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Status:</span>
                <p style={{ fontWeight: '600', color: 'var(--accent-primary)', marginTop: '4px' }}>{task.status} ({task.progress || 0}%)</p>
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
              {getHistoryLogs(task).length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Timeline Aktivitas:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                    {getHistoryLogs(task).map((log, idx) => (
                      <div key={idx} style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>• {log.action}</span>
                          <span>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}</span>
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
                                             subTask.status === 'In Progress' ? 'var(--warning)' : 
                                             'var(--surface-color)',
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
