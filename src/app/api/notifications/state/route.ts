import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID missing' }, { status: 400 });
    }

    let state = await prisma.userNotificationState.findUnique({
      where: { userId }
    });

    if (!state) {
      state = await prisma.userNotificationState.create({
        data: {
          userId,
          readIds: '[]',
          clearedAt: null,
          soundMuted: false,
        }
      });
    }

    let parsedReadIds: number[] = [];
    try {
      parsedReadIds = JSON.parse(state.readIds || '[]');
      if (!Array.isArray(parsedReadIds)) parsedReadIds = [];
    } catch {
      parsedReadIds = [];
    }

    return NextResponse.json({
      readIds: parsedReadIds,
      clearedAt: state.clearedAt ? state.clearedAt.toISOString() : null,
      soundMuted: state.soundMuted
    });
  } catch (error: any) {
    console.error('Error fetching notification state:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch notification state' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID missing' }, { status: 400 });
    }

    const body = await request.json();
    const { action, id, ids, soundMuted, clearedAt } = body;

    let state = await prisma.userNotificationState.findUnique({
      where: { userId }
    });

    let currentReadIds: number[] = [];
    if (state?.readIds) {
      try {
        currentReadIds = JSON.parse(state.readIds);
        if (!Array.isArray(currentReadIds)) currentReadIds = [];
      } catch {
        currentReadIds = [];
      }
    }

    let newReadIds = [...currentReadIds];
    let newClearedAt = state?.clearedAt || null;
    let newSoundMuted = state?.soundMuted ?? false;

    if (action === 'MARK_READ') {
      if (typeof id === 'number' && !newReadIds.includes(id)) {
        newReadIds.push(id);
      }
    } else if (action === 'MARK_ALL_READ') {
      if (Array.isArray(ids)) {
        ids.forEach((num: any) => {
          const parsed = Number(num);
          if (!isNaN(parsed) && !newReadIds.includes(parsed)) {
            newReadIds.push(parsed);
          }
        });
      }
    } else if (action === 'CLEAR_ALL') {
      newClearedAt = new Date();
      newReadIds = []; // reset read IDs since all prior notifications are cleared
    } else if (action === 'TOGGLE_SOUND') {
      if (typeof soundMuted === 'boolean') {
        newSoundMuted = soundMuted;
      }
    }

    // Limit stored readIds to latest 200 items to keep column lightweight
    if (newReadIds.length > 200) {
      newReadIds = newReadIds.slice(-200);
    }

    const updated = await prisma.userNotificationState.upsert({
      where: { userId },
      update: {
        readIds: JSON.stringify(newReadIds),
        clearedAt: newClearedAt,
        soundMuted: newSoundMuted
      },
      create: {
        userId,
        readIds: JSON.stringify(newReadIds),
        clearedAt: newClearedAt,
        soundMuted: newSoundMuted
      }
    });

    return NextResponse.json({
      success: true,
      readIds: newReadIds,
      clearedAt: updated.clearedAt ? updated.clearedAt.toISOString() : null,
      soundMuted: updated.soundMuted
    });
  } catch (error: any) {
    console.error('Error updating notification state:', error);
    return NextResponse.json({ error: error.message || 'Failed to update notification state' }, { status: 500 });
  }
}
