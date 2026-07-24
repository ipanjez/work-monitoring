import { prisma } from '@/lib/prisma';
import CalendarClient from './CalendarClient';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 700 }}>Kalender Pekerjaan</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Tampilan visual jadwal dan tenggat waktu pekerjaan departemen.</p>
      
      <CalendarClient tasks={tasks} />
    </div>
  );
}
