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

  if (!isOpen) return null;

  const totalTasks = tasks.length;
  const todoCount = tasks.filter(t => (t.status || '').toLowerCase().replace(/\s+/g, '') === 'todo').length;
  const inProgressCount = tasks.filter(t => (t.status || '').toLowerCase().replace(/\s+/g, '') === 'inprogress').length;
  const reviewCount = tasks.filter(t => (t.status || '').toLowerCase() === 'review').length;
  const doneCount = tasks.filter(t => (t.status || '').toLowerCase() === 'done').length;

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
          zIndex: 99999,
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
            background: 'var(--bg-primary, #ffffff)',
            color: 'var(--text-primary, #1e293b)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--border-color, rgba(0,0,0,0.08))',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid var(--border-color, #e2e8f0)'
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
                <Database size={30} className="text-white" />
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
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Saatnya Backup Data Anda!
                </h3>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '24px' }}>
            {/* Interval Status Info */}
            <div style={{
              background: 'var(--bg-secondary, #f8fafc)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '18px',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 500 }}>
                <Clock size={16} style={{ color: '#0d9488', flexShrink: 0 }} />
                <span>
                  {reminderDays === -1 ? (
                    <>Jadwal pengingat sistem diatur: <strong style={{ color: '#0d9488' }}>Setiap Kali Login</strong>.</>
                  ) : (
                    <>Jadwal pengingat sistem diatur: <strong>Setiap {reminderDays} hari sekali</strong>.</>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>
                <Calendar size={16} style={{ color: lastBackupDate ? '#3b82f6' : '#f59e0b', flexShrink: 0 }} />
                <span>
                  {lastBackupDate ? (
                    <>Terakhir dicadangkan: <strong style={{ color: 'var(--text-primary, #1e293b)' }}>{formattedLastDate}</strong> ({daysAgoText})</>
                  ) : (
                    <strong style={{ color: '#d97706' }}>Anda belum pernah melakukan pencadangan database.</strong>
                  )}
                </span>
              </div>
            </div>

            {/* Detail Data yang Dicadangkan */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Rincian Data yang Akan Diunduh
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                  Total {totalTasks} Pekerjaan
                </span>
              </div>

              {/* Status Grid Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <div style={{ background: 'var(--bg-secondary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', padding: '10px 8px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>To Do</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>{todoCount}</div>
                </div>
                <div style={{ background: 'var(--bg-secondary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', padding: '10px 8px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>In Progress</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>{inProgressCount}</div>
                </div>
                <div style={{ background: 'var(--bg-secondary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', padding: '10px 8px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#ec4899', fontWeight: 600 }}>Review</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>{reviewCount}</div>
                </div>
                <div style={{ background: 'var(--bg-secondary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', padding: '10px 8px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Done</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>{doneCount}</div>
                </div>
              </div>

              {/* Package Content List */}
              <div style={{
                background: 'var(--bg-secondary, #f8fafc)',
                borderRadius: '10px',
                padding: '12px 14px',
                border: '1px solid var(--border-color, #e2e8f0)',
                fontSize: '12.5px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={14} style={{ color: '#10b981' }} />
                  <span><strong>Database Lengkap (.json):</strong> Pekerjaan, Subtask, Pengaturan, User & Log Aktivitas</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileArchive size={14} style={{ color: '#0284c7' }} />
                  <span><strong>File & Dokumen Lampiran:</strong> Seluruh berkas PDF, Excel, gambar & bukti pekerjaan</span>
                </div>
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
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'transparent',
                  color: 'var(--text-secondary, #475569)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary, #f1f5f9)')}
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
              margin: '12px 0 0',
              fontSize: '11px',
              textAlign: 'center',
              color: 'var(--text-secondary, #94a3b8)'
            }}>
              *Klik &quot;Nanti Saja&quot; akan menunda pengingat ini dan tidak akan muncul kembali hingga Anda melakukan login ulang.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
