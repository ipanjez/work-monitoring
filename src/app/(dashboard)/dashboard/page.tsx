import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let tasks: any[] = [];
  let backupSettings = {
    backup_reminder_days: 0,
    last_backup_date: ''
  };

  try {
    const [fetchedTasks, settings] = await Promise.all([
      prisma.task.findMany({
        orderBy: { createdAt: 'desc' }
      }),
      prisma.appSetting.findMany({
        where: {
          key: {
            in: ['backup_reminder_days', 'last_backup_date']
          }
        }
      })
    ]);

    tasks = fetchedTasks;
    settings.forEach(s => {
      if (s.key === 'backup_reminder_days') {
        backupSettings.backup_reminder_days = Number(s.value) || 0;
      }
      if (s.key === 'last_backup_date') {
        backupSettings.last_backup_date = s.value || '';
      }
    });
  } catch (error) {
    console.error("Failed to fetch tasks/settings", error);
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Dashboard Executive Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Monitoring & Analisis Pekerjaan Departemen Real-Time
        </p>
      </div>

      <DashboardClient tasks={tasks} initialBackupSettings={backupSettings} />
    </div>
  );
}
