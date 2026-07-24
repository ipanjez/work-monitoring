import { prisma } from '@/lib/prisma';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  let tasks: any[] = [];
  try {
    tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to load tasks for settings page:', error);
  }

  return <SettingsClient tasks={tasks} />;
}
