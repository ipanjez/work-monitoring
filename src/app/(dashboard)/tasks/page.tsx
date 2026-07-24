import { prisma } from '@/lib/prisma';
import TasksClient from './TasksClient';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--text-primary)' }}>Daftar Pekerjaan</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Kelola daftar pekerjaan, tambah, edit, atau import dari Excel.</p>
      
      <TasksClient initialTasks={tasks} />
    </div>
  );
}
