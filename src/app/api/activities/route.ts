import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    const userId = (session.user as any)?.id;

    let activities = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // Fetch more to allow for filtering
    });

    if (role === 'MEMBER') {
      const memberName = session.user?.name;
      const memberNpk = (session.user as any)?.npk;

      // Find all task names where this member is a primary or additional PIC
      const memberTasks = await prisma.task.findMany({
        where: {
          OR: [
            { pic: memberName || undefined },
            { additionalPics: memberName ? { contains: memberName } : undefined }
          ].filter(Boolean) as any
        },
        select: { nama: true }
      });
      const memberTaskNames = new Set(memberTasks.map(t => t.nama));

      activities = activities.filter(act => {
        const message = act.message || '';
        const title = act.title || '';

        // 1. Logs triggered by the member themselves
        if (act.userId === userId) return true;

        // 2. Direct mentions of the member's name or NPK in the log message/title
        if (memberName && (message.includes(memberName) || title.includes(memberName))) return true;
        if (memberNpk && (message.includes(memberNpk) || title.includes(memberNpk))) return true;

        // 3. Task-related logs (where the task name is mentioned)
        for (const taskName of memberTaskNames) {
          if (message.includes(taskName) || title.includes(taskName)) return true;
        }

        return false;
      });
    }

    return NextResponse.json(activities.slice(0, 50));
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { action, title, message, type } = body;

    if (!action || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const activity = await prisma.activityLog.create({
      data: {
        action,
        title,
        message,
        type: type || 'info',
        userId: session?.user ? (session.user as any).id : null,
        userName: session?.user ? session.user.name : null,
      }
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: error.message || 'Failed to create activity' }, { status: 500 });
  }
}
