'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  Download, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  X, 
  FileArchive, 
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Task } from '@/utils/taskUtils';

interface BackupReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadBackup: () => Promise<void>;
  reminderDays: number;
  lastBackupDate: string;
  tasks: Task[];
}

export default function BackupReminderModal({
  isOpen,
  onClose,
  onDownloadBackup,
  reminderDays,
  lastBackupDate,
  tasks
}: BackupReminderModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileStats, setFileStats] = useState<any>(null);

  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/database/stats')
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) setFileStats(data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalTasks = fileStats?.totalTasks ?? tasks.length;
  const todoCount = fileStats?.todoCount ?? tasks.filter(t => (t.status || '').toLowerCase().replace(/\s+/g, '') === 'todo').length;
  const inProgressCount = fileStats?.inProgressCount ?? tasks.filter(t => (t.status || '').toLowerCase().replace(/\s+/g, '') === 'inprogress').length;
  const reviewCount = fileStats?.reviewCount ?? tasks.filter(t => (t.status || '').toLowerCase() === 'review').length;
  const doneCount = fileStats?.doneCount ?? tasks.filter(t => (t.status || '').toLowerCase() === 'done').length;

  const totalFiles = fileStats?.totalDistinctAvailableFiles ?? fileStats?.totalReferencedFiles ?? 0;
  const totalMb = fileStats?.estimatedTotalBytes ? (fileStats.estimatedTotalBytes / (1024 * 1024)).toFixed(1) : null;
  const missingCount = fileStats?.missingFilesCount ?? 0;

  let daysAgoText = '';
  let formattedLastDate = '';
  if (lastBackupDate) {
    try {
      const lastDate = new Date(lastBackupDate);
      formattedLastDate = format(lastDate, 'dd MMMM yyyy, HH:mm', { locale: id });
      const diffTime = Math.abs(Date.now() - lastDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      daysAgoText = diffDays === 0 ? 'Hari ini' : `${diffDays} hari yang lalu`;
    } catch {
      formattedLastDate = lastBackupDate;
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownloadBackup();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10800,
          padding: '16px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            background: 'var(--modal-bg, #1e293b)',
            color: 'var(--text-primary, #f8fafc)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '580px',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: 'var(--card-shadow, 0 25px 50px -12px rgba(0, 0, 0, 0.5))',
            position: 'relative',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Gradient Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0284c7 100%)',
            padding: '24px 24px 20px',
            color: 'white',
            position: 'relative'
          }}>
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                transition: '0.2s'
              }}
              aria-label="Tutup Pengingat"
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(4px)',
                borderRadius: '14px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Database size={30} color="#ffffff" />
              </div>
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  marginBottom: '6px'
                }}>
                  <AlertTriangle size={12} /> Pengingat Pencadangan Berkala
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  Saatnya Backup Data Anda!
                </h3>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '24px' }}>
            {/* Interval Status Info */}
            <div style={{
              background: 'var(--input-bg)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '18px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 500, color: 'var(--text-primary)' }}>
                <Clock size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>
                  {reminderDays === -1 ? (
                    <>Jadwal pengingat sistem diatur: <strong style={{ color: '#10b981' }}>Setiap Kali Login</strong>.</>
                  ) : (
                    <>Jadwal pengingat sistem diatur: <strong style={{ color: 'var(--text-primary)' }}>Setiap {reminderDays} hari sekali</strong>.</>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <Calendar size={16} style={{ color: lastBackupDate ? '#3b82f6' : '#f59e0b', flexShrink: 0 }} />
                <span>
                  {lastBackupDate ? (
                    <>Terakhir dicadangkan: <strong style={{ color: 'var(--text-primary)' }}>{formattedLastDate}</strong> ({daysAgoText})</>
                  ) : (
                    <strong style={{ color: '#f59e0b' }}>Anda belum pernah melakukan pencadangan database.</strong>
                  )}
                </span>
              </div>
            </div>

            {/* Detail Data yang Dicadangkan */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Rincian Data yang Akan Diunduh
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
                    Total {totalTasks} Pekerjaan
                  </span>
                  {(fileStats?.totalReferencedFiles ?? totalFiles) > 0 && (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', background: 'rgba(2, 132, 199, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
                      📁 {fileStats?.availableReferencedCount ?? totalFiles}/{fileStats?.totalReferencedFiles ?? totalFiles} File {totalMb ? `(${totalMb} MB)` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Grid Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '10px 8px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 700 }}>To Do</div>
                  <div style={{ fontSize: '17px', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>{todoCount}</div>
                </div>
                <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '10px 8px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>In Progress</div>
                  <div style={{ fontSize: '17px', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>{inProgressCount}</div>
                </div>
                <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '10px 8px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#ec4899', fontWeight: 700 }}>Review</div>
                  <div style={{ fontSize: '17px', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>{reviewCount}</div>
                </div>
                <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '10px 8px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>Done</div>
                  <div style={{ fontSize: '17px', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>{doneCount}</div>
                </div>
              </div>

              {/* Package Content List */}
              <div style={{
                background: 'var(--input-bg)',
                borderRadius: '10px',
                padding: '12px 14px',
                border: '1px solid var(--border-color)',
                fontSize: '12.5px',
                color: 'var(--text-primary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span><strong>Database Lengkap (.json):</strong> Pekerjaan, Subtask, Pengaturan, User & Log Aktivitas</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileArchive size={16} style={{ color: '#0284c7', flexShrink: 0 }} />
                  <span><strong>File & Dokumen Lampiran:</strong> {totalFiles > 0 ? `${totalFiles} berkas fisik terdeteksi ${totalMb ? `(estimasi ~${totalMb} MB)` : ''}` : 'Seluruh berkas PDF, Excel, gambar & bukti pekerjaan'}</span>
                </div>

                {/* Missing Files Indicator */}
                {missingCount > 0 ? (
                  <div style={{
                    marginTop: '4px',
                    padding: '8px 10px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#ef4444',
                    lineHeight: 1.4
                  }}>
                    <strong>⚠️ Perhatian:</strong> Terdapat <strong>{missingCount} berkas lampiran</strong> yang tercatat di database namun belum ditemukan di server lokal / Vercel Blob ({fileStats.missingFiles.slice(0, 2).join(', ')}{missingCount > 2 ? ` dan ${missingCount - 2} lainnya` : ''}). Berkas yang tersedia tetap akan diunduh penuh.
                  </div>
                ) : totalFiles > 0 ? (
                  <div style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                    <ShieldCheck size={14} /> 100% Berkas Lampiran Lengkap & Siap Diunduh
                  </div>
                ) : null}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={onClose}
                type="button"
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Nanti Saja
              </button>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                type="button"
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                  color: 'white',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: isDownloading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
                  transition: '0.2s',
                  opacity: isDownloading ? 0.7 : 1
                }}
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Menyiapkan Backup...
                  </>
                ) : (
                  <>
                    <Download size={16} /> Download Backup Sekarang
                  </>
                )}
              </button>
            </div>
            
            <p style={{
              margin: '14px 0 0',
              fontSize: '11.5px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              lineHeight: 1.4
            }}>
              *Klik &quot;Nanti Saja&quot; akan menunda pengingat ini dan tidak akan muncul kembali hingga Anda melakukan login ulang.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
