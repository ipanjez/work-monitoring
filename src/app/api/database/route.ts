import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tasks = await prisma.task.findMany();
    const settings = await prisma.appSetting.findMany();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        npk: true,
        name: true,
        email: true,
        image: true,
        password: true,
        role: true,
        status: true,
      }
    });
    const activityLogs = await prisma.activityLog.findMany();

    return NextResponse.json({
      version: '2.0',
      exportedAt: new Date().toISOString(),
      tasks,
      settings,
      users,
      activityLogs,
    });
  } catch (error: any) {
    console.error('Error exporting database:', error);
    return NextResponse.json({ error: error.message || 'Failed to export database' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Allow import without auth if database has zero users (fresh local setup)
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      const session = await getServerSession(authOptions);
      if (!session || (session.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { tasks, settings, users, activityLogs } = body;

    if (!Array.isArray(tasks) || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 });
    }

    // Helper: parse date fields safely for both PostgreSQL and SQLite
    const parseDate = (d: any): Date => {
      if (!d) return new Date();
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    // Clean tasks: remove id (let autoincrement handle it) and parse dates
    const cleanTasks = tasks.map((t: any) => {
      const { id, createdBy, ...rest } = t;
      return {
        ...rest,
        startDate: parseDate(rest.startDate),
        endDate: parseDate(rest.endDate),
        createdAt: parseDate(rest.createdAt),
        updatedAt: parseDate(rest.updatedAt),
        lastEditedAt: rest.lastEditedAt ? parseDate(rest.lastEditedAt) : null,
        isAllDay: typeof rest.isAllDay === 'string' ? rest.isAllDay === 'true' : Boolean(rest.isAllDay),
        progress: Number(rest.progress) || 0,
        orderIndex: Number(rest.orderIndex) || 0,
        editCount: Number(rest.editCount) || 0,
        // Remove relational field that can't be directly inserted
        createdById: null,
      };
    });

    const cleanSettings = settings.map((s: any) => {
      const { id, ...rest } = s;
      return {
        ...rest,
        updatedAt: parseDate(rest.updatedAt),
      };
    });

    // Execute deletion + insertion in a transaction
    const deleteOps: any[] = [
      prisma.activityLog.deleteMany(),
      prisma.passwordResetRequest.deleteMany(),
      prisma.account.deleteMany(),
      prisma.session.deleteMany(),
      prisma.task.deleteMany(),
      prisma.appSetting.deleteMany(),
      prisma.user.deleteMany(),
    ];
    
    await prisma.$transaction(deleteOps);

    // Insert users first (tasks may reference them)
    if (Array.isArray(users) && users.length > 0) {
      const cleanUsers = users.map((u: any) => ({
        id: u.id,
        npk: u.npk,
        name: u.name || null,
        email: u.email || null,
        image: u.image || null,
        password: u.password || null,
        role: u.role || 'MEMBER',
        status: u.status || 'ACTIVE',
      }));

      for (const user of cleanUsers) {
        await prisma.user.create({ data: user });
      }
    }

    // Insert tasks
    if (cleanTasks.length > 0) {
      await prisma.task.createMany({ data: cleanTasks });
    }

    // Insert settings
    if (cleanSettings.length > 0) {
      await prisma.appSetting.createMany({ data: cleanSettings });
    }

    // Insert activity logs
    if (Array.isArray(activityLogs) && activityLogs.length > 0) {
      const cleanLogs = activityLogs.map((l: any) => {
        const { id, ...rest } = l;
        return {
          ...rest,
          createdAt: parseDate(rest.createdAt),
        };
      });
      await prisma.activityLog.createMany({ data: cleanLogs });
    }

    // Log this restore (try, don't fail if it errors)
    try {
      await prisma.activityLog.create({
        data: {
          action: 'RESTORE_DATABASE',
          title: 'Database Restored',
          message: `Database dipulihkan dari file backup. ${cleanTasks.length} pekerjaan, ${cleanSettings.length} pengaturan, ${users?.length || 0} user berhasil diimpor.`,
          type: 'warning',
          userName: 'System',
        }
      });
    } catch (e) {}

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil memulihkan: ${cleanTasks.length} pekerjaan, ${cleanSettings.length} pengaturan, ${users?.length || 0} user.` 
    });
  } catch (error: any) {
    console.error('Error restoring database:', error);
    return NextResponse.json({ error: error.message || 'Failed to restore database' }, { status: 500 });
  }
}
