'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Mail, Copy, Check, ExternalLink, Code, Eye, 
  Send, Sparkles, CalendarDays, CheckCircle2, Clock, 
  MapPin, AlertCircle, FileText, User
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, SubTask, getGoogleCalendarUrl, getAdditionalPics, formatRecurrenceText, safeParseSubTasks, safeFormatDate } from '@/utils/taskUtils';

interface TaskEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  picEmails: Record<string, string>;
  appName?: string;
  deptName?: string;
}

export default function TaskEmailModal({
  isOpen,
  onClose,
  task,
  picEmails,
  appName = 'DeptMonitor',
  deptName = 'MRK'
}: TaskEmailModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'text' | 'html'>('preview');
  const [copiedRich, setCopiedRich] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [customToEmail, setCustomToEmail] = useState('');
  const [recipientList, setRecipientList] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('');

  // Extract all PICs and their emails
  useEffect(() => {
    if (!task) return;
    const pics = new Set<string>();
    if (task.pic) pics.add(task.pic);

    const extraPics = getAdditionalPics(task);
    extraPics.forEach(p => pics.add(p));

    const subTasks = safeParseSubTasks(task.subTasksJson);
    subTasks.forEach((st: any) => {
      if (st.pic) pics.add(st.pic);
    });

    const initialEmails = Array.from(pics)
      .map(p => picEmails[p])
      .filter(Boolean);

    setRecipientList(Array.from(new Set(initialEmails)));
    setEmailSubject(`[TUGAS] [${task.kategori || 'Umum'}] ${task.nama} - ${deptName || appName}`);
  }, [task, picEmails, deptName, appName]);

  // Format Location
  const formattedLocation = useMemo(() => {
    if (!task?.lokasi) return '-';
    try {
      const loc = typeof task.lokasi === 'string' ? JSON.parse(task.lokasi) : task.lokasi;
      if (loc.tipe === 'online') return `Online (Zoom/Teams): ${loc.linkZoom || '-'}`;
      if (loc.tipe === 'offline') return `Offline: ${loc.lokasiFisik || '-'}`;
    } catch (e) {}
    return task.lokasi;
  }, [task]);

  // Parse Subtasks
  const subTasksList: SubTask[] = useMemo(() => {
    return safeParseSubTasks(task?.subTasksJson);
  }, [task]);

  // Generate Google Calendar Link
  const calUrl = task ? getGoogleCalendarUrl(task) : '';
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://internal-work-monitoring.vercel.app';
  const taskDirectUrl = task ? `${siteUrl}/tasks?search=${encodeURIComponent(task.nama)}` : siteUrl;

  // Status and Priority Badges styling for Email HTML
  const statusColor = task?.status === 'Done' || task?.status === 'Selesai' 
    ? '#10b981' 
    : task?.status === 'In Progress' || task?.status === 'Sedang Dikerjakan' 
    ? '#3b82f6' 
    : '#f59e0b';

  const priorityColor = task?.prioritas === 'Urgent' 
    ? '#ef4444' 
    : task?.prioritas === 'High' 
    ? '#f97316' 
    : '#64748b';

  // Generate Rich HTML Template
  const emailHtml = useMemo(() => {
    if (!task) return '';

    const additionalPics = getAdditionalPics(task);
    const picDisplay = additionalPics.length > 0 
      ? `${task.pic || 'Unassigned'} (+${additionalPics.join(', ')})`
      : (task.pic || 'Unassigned');

    const cleanDesc = task.deskripsi 
      ? task.deskripsi.replace(/<[^>]*>?/gm, '').trim() 
      : 'Tidak ada deskripsi rinci.';

    const startFormatted = task.startDate 
      ? safeFormatDate(task.startDate, 'dd MMMM yyyy') + (!task.isAllDay && task.startTime ? ` (${task.startTime})` : '')
      : '-';
    
    const endFormatted = task.endDate 
      ? safeFormatDate(task.endDate, 'dd MMMM yyyy') + (!task.isAllDay && task.endTime ? ` (${task.endTime})` : '')
      : '-';

    const subTasksHtml = subTasksList.length > 0 
      ? `
        <div style="margin-top: 18px; padding-top: 14px; border-top: 1px dashed #e2e8f0;">
          <strong style="color: #1e293b; font-size: 13px; display: block; margin-bottom: 8px;">📋 Sub-Pekerjaan / Checklist (${subTasksList.length}):</strong>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            ${subTasksList.map((st, idx) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 6px 4px; width: 24px; color: ${st.status === 'Done' ? '#10b981' : '#94a3b8'}; font-weight: bold;">
                  ${st.status === 'Done' ? '✔' : '○'}
                </td>
                <td style="padding: 6px 4px; color: ${st.status === 'Done' ? '#64748b' : '#1e293b'}; text-decoration: ${st.status === 'Done' ? 'line-through' : 'none'};">
                  ${st.text}
                </td>
                <td style="padding: 6px 4px; text-align: right; color: #64748b; font-size: 11px;">
                  ${st.pic ? `(PIC: ${st.pic})` : ''}
                </td>
              </tr>
            `).join('')}
          </table>
        </div>
      `
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${task.nama}</title>
</head>
<body style="margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 20px 24px; color: #ffffff;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td>
            <span style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; background: rgba(255,255,255,0.22); padding: 3px 8px; border-radius: 4px; margin-bottom: 6px;">
              ${deptName} • ${appName}
            </span>
            <h2 style="margin: 6px 0 6px 0; font-size: 18px; font-weight: 800; color: #ffffff; line-height: 1.35; word-break: break-word;">
              ${task.nama}
            </h2>
            <span style="font-size: 12px; opacity: 0.92; display: block;">Pemberitahuan Penugasan & Pembaruan Pekerjaan</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Status & Priority Bar -->
    <div style="background-color: #f1f5f9; padding: 10px 24px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #475569;">
            Kategori: <strong>${task.kategori || 'Umum'}</strong>
          </td>
          <td style="text-align: right;">
            <span style="background-color: ${priorityColor}; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; margin-right: 6px;">
              ${task.prioritas || 'Medium'}
            </span>
            <span style="background-color: ${statusColor}; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">
              ${task.status} (${task.progress || 0}%)
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Content Body -->
    <div style="padding: 24px;">
      
      <!-- Key Details Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; width: 140px; color: #64748b; font-weight: 600;">👤 Person In Charge</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${picDisplay}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📅 Tanggal Mulai</td>
          <td style="padding: 8px 0; color: #0f172a;">${startFormatted}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">⏰ Tenggat Waktu</td>
          <td style="padding: 8px 0; color: #dc2626; font-weight: 700;">${endFormatted}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📍 Lokasi / Media</td>
          <td style="padding: 8px 0; color: #0f172a;">${formattedLocation}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">🔄 Repetisi</td>
          <td style="padding: 8px 0; color: #0f172a;">${formatRecurrenceText(task.repetisi)}</td>
        </tr>
      </table>

      <!-- Progress Meter -->
      <div style="margin-bottom: 20px; background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
          <tr>
            <td style="font-size: 12px; font-weight: 600; color: #475569;">Progres Penyelesaian</td>
            <td style="font-size: 12px; font-weight: 800; text-align: right; color: #1e40af;">${task.progress || 0}%</td>
          </tr>
        </table>
        <div style="width: 100%; height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden;">
          <div style="width: ${task.progress || 0}%; height: 100%; background-color: ${statusColor};"></div>
        </div>
      </div>

      <!-- Description Box -->
      <div style="margin-bottom: 16px;">
        <strong style="color: #1e293b; font-size: 13px; display: block; margin-bottom: 6px;">📝 Deskripsi & Catatan Pekerjaan:</strong>
        <div style="background-color: #f8fafc; padding: 14px; border-radius: 8px; border-left: 4px solid #3b82f6; font-size: 13px; line-height: 1.6; color: #334155; white-space: pre-line;">
          ${cleanDesc}
        </div>
      </div>

      ${subTasksHtml}

      <!-- Action Buttons -->
      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
        <a href="${calUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 700; font-size: 13px; margin: 4px 6px;">
          📅 Tambahkan ke Google Calendar
        </a>
        <a href="${taskDirectUrl}" target="_blank" style="display: inline-block; background-color: #f1f5f9; color: #1e293b; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; font-size: 13px; margin: 4px 6px; border: 1px solid #cbd5e1;">
          🔗 Buka di Dashboard Monitoring
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 14px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
      Pemberitahuan otomatis dari <strong>${appName} (${deptName})</strong>.<br/>
      Jangan balas email ini jika dikirim dari alamat no-reply sistem.
    </div>

  </div>
</body>
</html>
    `.trim();
  }, [task, appName, deptName, formattedLocation, subTasksList, calUrl, taskDirectUrl, statusColor, priorityColor]);

  // Clean Plain Text representation
  const plainTextEmail = useMemo(() => {
    if (!task) return '';
    const additionalPics = getAdditionalPics(task);
    const picDisplay = additionalPics.length > 0 
      ? `${task.pic || 'Unassigned'} (+${additionalPics.join(', ')})`
      : (task.pic || 'Unassigned');

    const cleanDesc = task.deskripsi 
      ? task.deskripsi.replace(/<[^>]*>?/gm, '').trim() 
      : '-';

    const subTasksText = subTasksList.length > 0
      ? `\nSub-Pekerjaan:\n` + subTasksList.map(st => `• [${st.status === 'Done' ? 'SELESAI' : 'PENDING'}] ${st.text} ${st.pic ? `(PIC: ${st.pic})` : ''}`).join('\n')
      : '';

    return `*PEMBERITAHUAN PENUGASAN PEKERJAAN*
Aplikasi: ${appName} (${deptName})

*Nama Pekerjaan:* ${task.nama}
*Kategori:* ${task.kategori || 'Umum'}
*Prioritas:* ${task.prioritas || 'Medium'}
*Status:* ${task.status} (${task.progress || 0}%)

*Person In Charge (PIC):* ${picDisplay}
*Tanggal Mulai:* ${format(new Date(task.startDate), 'dd MMM yyyy')}${!task.isAllDay && task.startTime ? ` (${task.startTime})` : ''}
*Tenggat Waktu:* ${format(new Date(task.endDate), 'dd MMM yyyy')}${!task.isAllDay && task.endTime ? ` (${task.endTime})` : ''}
*Lokasi:* ${formattedLocation}
*Repetisi:* ${formatRecurrenceText(task.repetisi)}

*Deskripsi:*
${cleanDesc}
${subTasksText}

---
📅 Tambahkan ke Google Calendar:
${calUrl}

🔗 Buka di Dashboard Monitoring:
${taskDirectUrl}
    `.trim();
  }, [task, appName, deptName, formattedLocation, subTasksList, calUrl, taskDirectUrl]);

  // Copy HTML Rich Text to clipboard (Pastes as formatted HTML in Gmail/Outlook!)
  const handleCopyRichHtml = async () => {
    try {
      const htmlBlob = new Blob([emailHtml], { type: 'text/html' });
      const textBlob = new Blob([plainTextEmail], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob
      });
      await navigator.clipboard.write([item]);
      setCopiedRich(true);
      setTimeout(() => setCopiedRich(false), 2500);
      toast.success('Format Kartu Email berhasil disalin! Tinggal paste (Ctrl+V) di Gmail / Outlook.');
    } catch (err) {
      console.error(err);
      // Fallback
      await navigator.clipboard.writeText(plainTextEmail);
      toast.success('Detail teks berhasil disalin ke clipboard.');
    }
  };

  // Copy Raw Text
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(plainTextEmail);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
      toast.success('Teks terformat berhasil disalin!');
    } catch (e) {
      toast.error('Gagal menyalin teks.');
    }
  };

  // Copy Raw HTML Code
  const handleCopyHtmlCode = async () => {
    try {
      await navigator.clipboard.writeText(emailHtml);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
      toast.success('Kode sumber HTML berhasil disalin!');
    } catch (e) {
      toast.error('Gagal menyalin kode HTML.');
    }
  };

  // Recipient handling
  const handleAddRecipient = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (customToEmail.trim() && customToEmail.includes('@')) {
      const email = customToEmail.trim().toLowerCase();
      if (!recipientList.includes(email)) {
        setRecipientList(prev => [...prev, email]);
      }
      setCustomToEmail('');
    }
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    setRecipientList(prev => prev.filter(e => e !== emailToRemove));
  };

  // Gmail Web Compose Link
  const gmailComposeUrl = useMemo(() => {
    const to = recipientList.join(',');
    const su = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(plainTextEmail);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`;
  }, [recipientList, emailSubject, plainTextEmail]);

  // Mailto Link
  const defaultMailtoUrl = useMemo(() => {
    const to = recipientList.join(',');
    const su = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(plainTextEmail);
    return `mailto:${to}?subject=${su}&body=${body}`;
  }, [recipientList, emailSubject, plainTextEmail]);

  if (!isOpen || !task) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" style={{ zIndex: 10200 }}>
        <motion.div
          className="modal-content"
          style={{ maxWidth: '780px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--surface-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.12)', color: 'var(--accent-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Mail size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Kirim & Salin Email Pekerjaan
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Format pesan HTML visual estetik untuk PIC dan tim.
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', padding: '6px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Recipient & Subject Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--input-bg)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              {/* To: Recipients */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Penerima Email (PIC & Tim):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  {recipientList.map(email => (
                    <span
                      key={email}
                      style={{
                        fontSize: '11.5px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: 'var(--accent-primary)',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {email}
                      <button
                        onClick={() => handleRemoveRecipient(email)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex' }}
                        title="Hapus"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <div style={{ display: 'flex', gap: '4px', flex: 1, minWidth: '180px' }}>
                    <input
                      type="email"
                      className="input"
                      style={{ fontSize: '12px', padding: '4px 8px', flex: 1 }}
                      placeholder="Tambah email PIC lain..."
                      value={customToEmail}
                      onChange={e => setCustomToEmail(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRecipient(e);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11.5px' }}
                      onClick={handleAddRecipient}
                    >
                      + Tambah
                    </button>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Subjek Email:
                </label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%', fontSize: '12.5px', fontWeight: 600 }}
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                />
              </div>
            </div>

            {/* View Mode Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setActiveTab('preview')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeTab === 'preview' ? 'var(--accent-primary)' : 'transparent',
                    color: activeTab === 'preview' ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Eye size={14} /> Pratinjau Visual (HTML Card)
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeTab === 'text' ? 'var(--accent-primary)' : 'transparent',
                    color: activeTab === 'text' ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileText size={14} /> Teks Terformat
                </button>
                <button
                  onClick={() => setActiveTab('html')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeTab === 'html' ? 'var(--accent-primary)' : 'transparent',
                    color: activeTab === 'html' ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Code size={14} /> Kode HTML
                </button>
              </div>

              {/* Fast Copy Badge */}
              <button
                onClick={handleCopyRichHtml}
                style={{
                  background: copiedRich ? '#10b981' : 'rgba(16, 185, 129, 0.12)',
                  color: copiedRich ? '#ffffff' : '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                {copiedRich ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedRich ? 'Tersalin!' : '1-Klik Salin Kartu HTML'}</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ flex: 1, minHeight: '380px' }}>
              {activeTab === 'preview' && (
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <iframe
                    srcDoc={emailHtml}
                    title="Pratinjau Kartu Email Visual"
                    style={{
                      width: '100%',
                      height: '420px',
                      border: 'none',
                      display: 'block',
                      background: '#f8fafc'
                    }}
                  />
                </div>
              )}

              {activeTab === 'text' && (
                <div style={{ position: 'relative' }}>
                  <textarea
                    readOnly
                    value={plainTextEmail}
                    className="input"
                    style={{
                      width: '100%',
                      height: '380px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      lineHeight: '1.6',
                      padding: '14px',
                      resize: 'none',
                      background: 'var(--input-bg)'
                    }}
                  />
                  <button
                    onClick={handleCopyText}
                    className="btn btn-secondary"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      padding: '5px 10px',
                      fontSize: '11.5px',
                      fontWeight: 600
                    }}
                  >
                    {copiedText ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    {copiedText ? 'Tersalin' : 'Salin Teks'}
                  </button>
                </div>
              )}

              {activeTab === 'html' && (
                <div style={{ position: 'relative' }}>
                  <textarea
                    readOnly
                    value={emailHtml}
                    className="input"
                    style={{
                      width: '100%',
                      height: '380px',
                      fontFamily: 'monospace',
                      fontSize: '11.5px',
                      lineHeight: '1.5',
                      padding: '14px',
                      resize: 'none',
                      color: '#0284c7',
                      background: 'var(--input-bg)'
                    }}
                  />
                  <button
                    onClick={handleCopyHtmlCode}
                    className="btn btn-secondary"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      padding: '5px 10px',
                      fontSize: '11.5px',
                      fontWeight: 600
                    }}
                  >
                    {copiedHtml ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    {copiedHtml ? 'Tersalin' : 'Salin HTML'}
                  </button>
                </div>
              )}
            </div>

            {/* Helper Tip Box */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '12.5px',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              flexShrink: 0
            }}>
              <Sparkles size={18} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--accent-primary)' }}>Tips:</strong> Klik tombol hijau <strong>&quot;1-Klik Salin Kartu HTML&quot;</strong> di atas, lalu cukup tekan <kbd style={{ background: 'var(--surface-color)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '11.5px', fontWeight: 700 }}>Ctrl + V</kbd> (Paste) di dalam lembar compose email <strong>Gmail / Outlook</strong> Anda untuk menampilkan kartu visual estetik lengkap dengan warna & tombol.
              </div>
            </div>

          </div>

          {/* Modal Footer Actions */}
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--surface-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <button
              className="btn btn-secondary"
              onClick={onClose}
              style={{ fontSize: '12.5px' }}
            >
              Tutup
            </button>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a
                href={defaultMailtoUrl}
                className="btn btn-secondary"
                style={{ fontSize: '12.5px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Mail size={15} /> Buka Mail App (Outlook)
              </a>

              <a
                href={gmailComposeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ fontSize: '12.5px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={15} /> Buka di Gmail Web
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

