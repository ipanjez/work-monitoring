import { prisma } from '@/lib/prisma';
import TeamClient from './TeamClient';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  let tasks: any[] = [];
  try {
    tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to load tasks for team page:', error);
  }

  return <TeamClient tasks={tasks} />;
}
