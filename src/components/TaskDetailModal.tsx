'use client';
import { useMaster } from '@/context/MasterContext';
import { useState, useEffect } from 'react';

import { useRouter, usePathname } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, ExternalLink, CalendarDays, Paperclip, Eye, Edit, MessageSquare, Send, Trash2, Copy, User, FileDown, Mail, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { Task, FileItem, SubTask, CommentItem, LogItem, getDynamicBadgeStyle, getAdditionalPics, getHistoryLogs, getGoogleCalendarUrl, getTaskFiles, getTaskComments, handleExportICS, formatRecurrenceText, formatDescription, formatLogDetails } from '@/utils/taskUtils';
import TaskTimeline from './TaskTimeline';
import { exportTaskPdf } from '@/utils/exportPdf';
import TaskEmailModal from './TaskEmailModal';
import { useGuestAccess } from '@/context/GuestAccessContext';

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
  onDuplicate?: () => void;
  onDelete?: () => void;
}

import { useSession } from 'next-auth/react';
import { hasPermission, RolePermissionsConfig, defaultRolePermissions } from '@/lib/permissions';

export default function TaskDetailModal({ task, onClose, setPreviewFile, onEdit, onDuplicate, onDelete }: TaskDetailModalProps) {
  const { data: session } = useSession();
  const { handleGuestAction, isGuest } = useGuestAccess();
  const userRole = (session?.user as any)?.role || 'MEMBER';
  const [roleConfig, setRoleConfig] = useState<RolePermissionsConfig | null>(null);
  useEffect(() => {
    fetch('/api/settings/permissions').then(res => res.json()).then(setRoleConfig).catch(() => { });
  }, []);
  const { masterColors, roleConfig: masterRoleConfig } = useMaster();
  const currentRoleConfig = roleConfig || masterRoleConfig;

  useEffect(() => {
    if (currentRoleConfig && !hasPermission(currentRoleConfig, 'view_detail', userRole)) {
      toast.error('Akses ditolak: Anda tidak memiliki izin untuk melihat rincian detail tugas & lampiran.');
      onClose();
    }
  }, [currentRoleConfig, userRole, onClose]);

  if (currentRoleConfig && !hasPermission(currentRoleConfig, 'view_detail', userRole)) {
    return null;
  }
  const router = useRouter();
  const pathname = usePathname();
  const { addActivityLog } = useNotifications();
  const [localComments, setLocalComments] = useState<CommentItem[]>([]);
  const [localHistoryLogs, setLocalHistoryLogs] = useState<LogItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [appName, setAppName] = useState('DeptMonitor');
  const [deptName, setDeptName] = useState('MRK');
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(25);
  const [maxTaskFilesSizeMb, setMaxTaskFilesSizeMb] = useState(100);
  const [picEmails, setPicEmails] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        if (data.dept_name) setDeptName(data.dept_name);
        if (data.app_name) setAppName(data.app_name);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };

    const loadPicEmails = async () => {
      try {
        const res = await fetch('/api/users/emails');
        if (res.ok) {
          const data = await res.json();
          setPicEmails(data);
        }
      } catch (e) { }
    };

    loadSettings();
    loadPicEmails();
  }, [task]);

  const handleDeleteComment = async (commentId: string) => {
    handleGuestAction(async () => {
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
    });
  };


  const getAllPics = () => {
    if (!task) return [];
    const pics = new Set<string>();
    if (task.pic) pics.add(task.pic);

    if (task.additionalPics) {
      try {
        const arr = JSON.parse(task.additionalPics);
        if (Array.isArray(arr)) arr.forEach((p: string) => pics.add(p));
      } catch (e) { }
    }

    if (task.subTasksJson) {
      try {
        const arr = JSON.parse(task.subTasksJson);
        if (Array.isArray(arr)) {
          arr.forEach((st: any) => {
            if (st.pic) pics.add(st.pic);
          });
        }
      } catch (e) { }
    }
    return Array.from(pics);
  };

  const allPics = getAllPics();
  const emailsTo = allPics.map(p => picEmails[p]).filter(Boolean);

  const subject = task ? `Informasi Pekerjaan: [${task.kategori || 'Umum'}] ${task.nama}` : '';
  const calUrl = task ? getGoogleCalendarUrl(task) : '';

  let subTasksStr = '';
  if (task?.subTasksJson) {
    try {
      const subTasks: SubTask[] = JSON.parse(task.subTasksJson);
      if (Array.isArray(subTasks) && subTasks.length > 0) {
        subTasksStr = `\n\nSub-Pekerjaan:\n${subTasks.map(st => `- [${st.status}] ${st.text} (PIC: ${st.pic || '-'})`).join('\n')}`;
      }
    } catch (e) { }
  }

  const emailBody = task ? `Berikut adalah detail pekerjaan yang ditugaskan:\n\n` +
    `Nama Pekerjaan: ${task.nama}\n` +
    `Kategori: ${task.kategori || 'Umum'}\n` +
    `Status: ${task.status}\n` +
    `Prioritas: ${task.prioritas || 'Medium'}\n` +
    `Repetisi: ${formatRecurrenceText(task.repetisi)}\n\n` +
    `Deskripsi:\n${task.deskripsi ? task.deskripsi.replace(/<[^>]*>?/gm, '') : '-'}` +
    `${subTasksStr}\n\n` +
    `---\n` +
    `TAMBAHKAN KE GOOGLE CALENDAR:\nKlik tautan berikut untuk menambahkan pekerjaan ini ke kalender Anda:\n${calUrl}\n` : '';

  // Use Gmail Web Compose URL explicitly since mailto: is often unreliable or blocked by OS defaults
  const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${emailsTo.join(',')}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
  const canSendMail = emailsTo.length > 0;

  const handleAddComment = async () => {
    handleGuestAction(async () => {
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
    });
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
        } catch (e) { location = task!.lokasi; }
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
${task!.deskripsi ? task!.deskripsi.replace(/<[^>]*>?/gm, '').trim() : '-'}`;

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
      <div key={task.id ? `modal-${task.id}` : 'modal-detail'} className="modal-overlay">
        <motion.div
          className="modal-content"
          style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{
            position: 'sticky',
            top: '-24px',
            background: 'var(--modal-bg, var(--surface-color))',
            zIndex: 10,
            padding: '24px 24px 16px 24px',
            margin: '-24px -24px 20px -24px',
            borderBottom: '1px solid var(--border-color)',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px'
          }}>
            {/* Close button pinned to top-right */}
            <button 
              className="btn btn-secondary" 
              style={{ 
                padding: '6px',
                position: 'absolute',
                top: '20px',
                right: '20px',
                borderRadius: '50%',
                zIndex: 15
              }} 
              onClick={onClose} 
              title="Tutup"
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', width: '100%' }}>
              {/* Priority badge + title */}
              <div style={{ width: '100%', paddingRight: '48px' }}>
                {(() => {
                  const badge = getDynamicBadgeStyle('priority', task.prioritas || 'Medium', task.prioritas === 'Urgent' ? 'badge badge-urgent' : task.prioritas === 'High' ? 'badge badge-high' : task.prioritas === 'Low' ? 'badge badge-low' : 'badge badge-medium', masterColors);
                  return (
                    <span className={badge.className} style={{ ...badge.style, display: 'inline-block' }}>
                      {task.prioritas || 'Medium'}
                    </span>
                  );
                })()}

                <h2 style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 0, lineHeight: 1.4, wordBreak: 'break-word', whiteSpace: 'normal' }}>{task.nama}</h2>
              </div>

              <div style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {/* Left group: Primary action buttons */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {onDuplicate && (hasPermission(roleConfig, 'manage_task', userRole) || userRole === 'GUEST') && (
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 500 }} onClick={() => handleGuestAction(onDuplicate)} title="Duplikasi / Salin Pekerjaan Ini Sebagai Pekerjaan Baru">
                      <Copy size={13} style={{ marginRight: '4px', color: 'var(--accent-primary)' }} /> Duplikasi
                    </button>
                  )}

                  {onEdit && (hasPermission(roleConfig, 'manage_task', userRole) || userRole === 'GUEST') && (
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 500 }} onClick={() => handleGuestAction(onEdit)} title="Edit Pekerjaan Ini">
                      <Edit size={13} style={{ marginRight: '4px' }} /> Edit
                    </button>
                  )}

                  {onDelete && (hasPermission(roleConfig, 'delete_task', userRole) || userRole === 'GUEST') && (
                    <button className="btn btn-danger" style={{ padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 500 }} onClick={() => handleGuestAction(onDelete)} title="Hapus Pekerjaan">
                      <Trash2 size={13} style={{ marginRight: '4px' }} /> Hapus
                    </button>
                  )}
                </div>

                {/* Right group: Utility icon buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '7px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => handleGuestAction(handleCopyTaskDetails)}
                    title="Salin Detail Pekerjaan ke Teks"
                  >
                    <Copy size={15} />
                  </button>

                  <a
                    href={isGuest ? undefined : getGoogleCalendarUrl(task)}
                    target={isGuest ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '7px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onClick={(e) => {
                      if (isGuest) {
                        e.preventDefault();
                        handleGuestAction(() => {});
                      }
                    }}
                    title="Tambah ke Google Calendar"
                  >
                    <ExternalLink size={15} />
                  </a>

                  <button
                    className="btn btn-secondary"
                    onClick={() => handleGuestAction(() => handleExportICS(task))}
                    style={{ padding: '7px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Download .ics"
                  >
                    <CalendarDays size={15} />
                  </button>

                  {pathname !== '/calendar' && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        onClose();
                        router.push(`/calendar?search=${encodeURIComponent(task.nama)}`);
                      }}
                      style={{ padding: '7px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Pergi ke Kalender"
                    >
                      <Eye size={15} />
                    </button>
                  )}

                  <button
                    className="btn"
                    onClick={() => {
                      handleGuestAction(() => {
                        const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://internal-work-monitoring.vercel.app';
                        const currentAppName = localStorage.getItem('app_name') || 'DeptMonitor';
                        exportTaskPdf(task, currentAppName, siteUrl);
                        toast.success('PDF berhasil di-download!');
                      });
                    }}
                    style={{ padding: '7px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dc2626', color: 'white', border: 'none' }}
                    title="Export PDF"
                  >
                    <FileDown size={15} />
                  </button>

                  <button
                    className="btn"
                    onClick={() => handleGuestAction(() => setIsEmailModalOpen(true))}
                    style={{
                      padding: '7px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                    }}
                    title="Kirim & Salin Format Email Pekerjaan (HTML & Teks)"
                  >
                    <Mail size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <TaskTimeline
            startDate={task.startDate}
            endDate={task.endDate || task.startDate}
            subTasks={task.subTasksJson ? JSON.parse(task.subTasksJson) : []}
            masterColors={masterColors}
            mainPic={task.pic}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {localHistoryLogs.map((log, idx) => (
                      <div key={idx} style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 600 }}>• {log.action}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                        </div>
                        {(log as any).details && (
                          <div style={{ paddingLeft: '8px', color: 'var(--text-primary)', fontStyle: 'italic', fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                            {formatLogDetails((log as any).details.startsWith('Diubah:') ? (log as any).details : `Diubah: ${(log as any).details}`)}
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
                  style={{ color: 'var(--text-primary)', lineHeight: 1.5, background: 'var(--input-bg)', padding: '12px', borderRadius: '8px', overflowX: 'auto', maxHeight: '150px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}
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

              const statusCounts = subTasks.reduce((acc, st) => {
                acc[st.status] = (acc[st.status] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              const statusSummary = Object.entries(statusCounts)
                .map(([status, count]) => `${count} ${status}`)
                .join(', ');

              const groupedSubTasks = subTasks.reduce((acc, st) => {
                const dateKey = st.tenggatWaktu ? format(new Date(st.tenggatWaktu), 'yyyy-MM-dd') : 'Tanpa Tenggat Waktu';
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(st);
                return acc;
              }, {} as Record<string, SubTask[]>);

              return (
                <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>Sub Pekerjaan</h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {statusSummary ? `(${statusSummary})` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                    {Object.entries(groupedSubTasks)
                      .sort(([dateA], [dateB]) => dateA === 'Tanpa Tenggat Waktu' ? 1 : dateB === 'Tanpa Tenggat Waktu' ? -1 : dateA.localeCompare(dateB))
                      .map(([dateKey, tasksGroup]) => (
                        <div key={dateKey} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                            {dateKey === 'Tanpa Tenggat Waktu' ? 'Tanpa Tenggat Waktu' : `Tenggat Waktu: ${format(new Date(dateKey), 'dd MMM yyyy')}`}
                          </div>
                          {tasksGroup.map((subTask, sidx) => (
                            <div key={subTask.id ? `${subTask.id}-${sidx}` : `subtask-${sidx}`} style={{ padding: '10px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <div style={{ fontWeight: 500, fontSize: '13px', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'normal', color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: formatDescription(subTask.text) }} />
                                  {subTask.pic && (
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <User size={12} /> {subTask.pic}
                                      </span>
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
                  {(() => {
                    const totalSize = getTaskFiles(task).filter(f => !f.isDeleted).reduce((acc, f) => acc + (f.size || 0), 0);
                    return (
                      <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
                        Total terpakai: {(totalSize / (1024 * 1024)).toFixed(2)} MB dari batas maksimal {maxTaskFilesSizeMb} MB
                      </span>
                    );
                  })()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {getTaskFiles(task).map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--surface-color)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', opacity: f.isDeleted ? 0.6 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: f.isDeleted ? 'line-through' : 'none' }}>
                          <Paperclip size={16} color={f.isDeleted ? "var(--text-secondary)" : "var(--accent-primary)"} />
                          <span style={{ color: f.isDeleted ? 'var(--text-secondary)' : 'inherit', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.name}>
                            {f.name}
                          </span>
                        </div>
                         {!f.isDeleted && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px' }}
                            onClick={() => handleGuestAction(() => setPreviewFile(f))}
                          >
                            <Eye size={14} color="var(--text-secondary)" />
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {f.uploadedAt && <span>Diunggah pada {format(new Date(f.uploadedAt), 'dd MMM yyyy, HH:mm')}{f.size ? ` (${(f.size / (1024 * 1024)).toFixed(2)} MB)` : ''}</span>}
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
                  localComments.map((comment, cidx) => (
                    <div key={comment.id ? `${comment.id}-${cidx}` : `comment-${cidx}`} style={{ background: 'var(--bg-color)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>{comment.author}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{format(new Date(comment.createdAt), 'dd MMM yyyy HH:mm')}</span>
                          {(hasPermission(roleConfig, 'upload_comment', userRole) || userRole === 'GUEST') && (
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

              {(hasPermission(roleConfig, 'upload_comment', userRole) || userRole === 'GUEST') && (
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

          </div>
        </motion.div>
      </div>

      <TaskEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        task={task}
        picEmails={picEmails}
        appName={appName}
        deptName={deptName}
      />
    </AnimatePresence>
  );
}
