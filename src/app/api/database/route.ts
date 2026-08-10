import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tasks = await prisma.task.findMany();
    const settings = await prisma.appSetting.findMany();

    return NextResponse.json({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks,
      settings
    });
  } catch (error: any) {
    console.error('Error exporting database:', error);
    return NextResponse.json({ error: error.message || 'Failed to export database' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { tasks, settings } = body;

    if (!Array.isArray(tasks) || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 });
    }

    // Prepare tasks by removing 'id' to avoid sequence conflicts in PostgreSQL
    const cleanTasks = tasks.map((t: any) => {
      const { id, ...rest } = t;
      return rest;
    });

    const cleanSettings = settings.map((s: any) => {
      const { id, ...rest } = s;
      return rest;
    });

    // Execute in a transaction to ensure atomicity
    await prisma.$transaction([
      prisma.task.deleteMany(),
      prisma.appSetting.deleteMany(),
      prisma.task.createMany({ data: cleanTasks }),
      prisma.appSetting.createMany({ data: cleanSettings })
    ]);

    // Log this activity
    await prisma.activityLog.create({
      data: {
        action: 'RESTORE_DATABASE',
        title: 'Database Restored',
        message: 'The entire database was restored from a backup file.',
        type: 'warning',
        userId: (session.user as any).id,
        userName: session.user?.name || 'Admin',
      }
    });

    return NextResponse.json({ success: true, message: 'Database restored successfully' });
  } catch (error: any) {
    console.error('Error restoring database:', error);
    return NextResponse.json({ error: error.message || 'Failed to restore database' }, { status: 500 });
  }
}
