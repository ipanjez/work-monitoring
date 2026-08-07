import { prisma } from '@/lib/prisma';
import BoardClient from './BoardClient';

export const dynamic = 'force-dynamic';

export default async function BoardPage() {
  let tasks: any[] = [];
  try {
    tasks = await prisma.task.findMany({
      orderBy: [
        { orderIndex: 'asc' },
        { id: 'desc' }
      ]
    });
  } catch (error) {
    console.error("Failed to fetch tasks", error);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Monitoring Board
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Board interaktif untuk memonitoring progres pekerjaan
        </p>
      </div>

      <BoardClient tasks={tasks} />
    </div>
  );
}
