import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSyncState } from '@/lib/syncState';

// Disable caching for real-time sync endpoint across all cloud / Vercel CDN layers
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const memoryState = getSyncState();

    // Fast lightweight check against database for Vercel Serverless & Multi-instance cloud support
    const [latestTask, taskCount, settingSync] = await Promise.all([
      prisma.task.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true, id: true }
      }).catch(() => null),
      prisma.task.count().catch(() => 0),
      prisma.appSetting.findUnique({
        where: { key: 'last_settings_sync_version' }
      }).catch(() => null)
    ]);

    const dbTaskTime = latestTask?.updatedAt ? new Date(latestTask.updatedAt).getTime() : 0;
    // Combine max updatedAt and count hash to catch both updates and deletions
    const dbTaskVersion = Math.max(dbTaskTime, taskCount);
    const effectiveTaskVersion = Math.max(memoryState.taskVersion, dbTaskVersion);

    const dbSettingsVersion = settingSync?.value ? Number(settingSync.value) : 0;
    const effectiveSettingsVersion = Math.max(memoryState.settingsVersion, dbSettingsVersion);

    return NextResponse.json({
      taskVersion: effectiveTaskVersion,
      settingsVersion: effectiveSettingsVersion,
      timestamp: Date.now(),
      taskCount
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (e) {
    // Fallback to in-memory sync state
    return NextResponse.json(getSyncState(), {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}
