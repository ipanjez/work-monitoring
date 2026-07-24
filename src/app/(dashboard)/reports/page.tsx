import { prisma } from '@/lib/prisma';
import ReportsClient from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  let tasks: any[] = [];
  try {
    tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to load tasks for reports:', error);
  }

  return <ReportsClient tasks={tasks} />;
}
