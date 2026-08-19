'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Task } from '@/utils/taskUtils';
import BackupReminderModal from '@/components/BackupReminderModal';
import { useMaster } from '@/context/MasterContext';
import { hasPermission } from '@/lib/permissions';

export default function GlobalBackupReminder() {
  const { data: session, status } = useSession();
  const { roleConfig } = useMaster();
  const [isOpen, setIsOpen] = useState(false);
  const [reminderDays, setReminderDays] = useState<number>(0);
  const [lastBackupDate, setLastBackupDate] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);

  const userRole = (session?.user as any)?.role || '';
  const canBackup = hasPermission(roleConfig, 'database_backup', userRole);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!canBackup) {
      setIsOpen(false);
      return;
    }

    const isDismissed = typeof window !== 'undefined' && sessionStorage.getItem('dismissed_backup_reminder') === 'true';
    if (isDismissed) return;

    const checkBackupStatus = async () => {
      try {
        const [settingsRes, tasksRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/tasks').catch(() => null)
        ]);

        if (!settingsRes.ok) return;
        const settingsData = await settingsRes.json();
        
        if (tasksRes && tasksRes.ok) {
          const tasksData = await tasksRes.json();
          if (Array.isArray(tasksData)) setTasks(tasksData);
        }

        const days = Number(settingsData.backup_reminder_days) || 0;
        const lastDateStr = settingsData.last_backup_date || '';
        
        setReminderDays(days);
        setLastBackupDate(lastDateStr);

        // Check if dismissed again in case of async race
        if (sessionStorage.getItem('dismissed_backup_reminder') === 'true') return;

        if (days === -1) {
          // Setiap kali login
          setIsOpen(true);
        } else if (days > 0) {
          if (!lastDateStr) {
            setIsOpen(true);
          } else {
            const lastDate = new Date(lastDateStr);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= days) {
              setIsOpen(true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to evaluate global backup reminder:', err);
      }
    };

    checkBackupStatus();
    window.addEventListener('backupReminderChanged', checkBackupStatus);
    window.addEventListener('masterUpdated', checkBackupStatus);
    return () => {
      window.removeEventListener('backupReminderChanged', checkBackupStatus);
      window.removeEventListener('masterUpdated', checkBackupStatus);
    };
  }, [status, canBackup]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dismissed_backup_reminder', 'true');
    }
    setIsOpen(false);
  };

  const handleDownloadBackup = async () => {
    const toastId = toast.loading('Sedang mengunduh seluruh data (database & file)...');
    try {
      const res = await fetch('/api/database');
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Gagal mengambil backup: HTTP ${res.status} ${errText.substring(0, 100)}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Backup_Database_Pekerjaan_${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      toast.dismiss(toastId);
      toast.success('Backup berhasil diunduh!');
      setIsOpen(false);
      setLastBackupDate(new Date().toISOString());
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.message || 'Gagal mengunduh backup');
    }
  };

  if (!canBackup) return null;

  return (
    <BackupReminderModal
      isOpen={isOpen}
      onClose={handleDismiss}
      onDownloadBackup={handleDownloadBackup}
      reminderDays={reminderDays}
      lastBackupDate={lastBackupDate}
      tasks={tasks}
    />
  );
}
