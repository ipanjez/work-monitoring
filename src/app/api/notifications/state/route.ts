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

    let state = await (prisma as any).userNotificationState.findUnique({
      where: { userId }
    });

    if (!state) {
      state = await (prisma as any).userNotificationState.create({
        data: {
          userId,
          readIds: '[]',
          clearedAt: null,
          soundMuted: false,
        }
      });
    }

    let parsedData = { read: [] as number[], deleted: [] as number[] };
    if (state?.readIds) {
      try {
        const raw = JSON.parse(state.readIds);
        if (Array.isArray(raw)) {
          parsedData.read = raw;
        } else if (raw && typeof raw === 'object') {
          parsedData.read = Array.isArray(raw.read) ? raw.read : [];
          parsedData.deleted = Array.isArray(raw.deleted) ? raw.deleted : [];
        }
      } catch {
        parsedData = { read: [], deleted: [] };
      }
    }

    return NextResponse.json({
      readIds: parsedData.read,
      deletedIds: parsedData.deleted,
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

    let state = await (prisma as any).userNotificationState.findUnique({
      where: { userId }
    });

    let parsedData = { read: [] as number[], deleted: [] as number[] };
    if (state?.readIds) {
      try {
        const raw = JSON.parse(state.readIds);
        if (Array.isArray(raw)) {
          parsedData.read = raw;
        } else if (raw && typeof raw === 'object') {
          parsedData.read = Array.isArray(raw.read) ? raw.read : [];
          parsedData.deleted = Array.isArray(raw.deleted) ? raw.deleted : [];
        }
      } catch {
        parsedData = { read: [], deleted: [] };
      }
    }

    let newClearedAt = state?.clearedAt || null;
    let newSoundMuted = state?.soundMuted ?? false;

    if (action === 'MARK_READ') {
      if (typeof id === 'number' && !parsedData.read.includes(id)) {
        parsedData.read.push(id);
      }
    } else if (action === 'MARK_ALL_READ') {
      if (Array.isArray(ids)) {
        ids.forEach((num: any) => {
          const parsed = Number(num);
          if (!isNaN(parsed) && !parsedData.read.includes(parsed)) {
            parsedData.read.push(parsed);
          }
        });
      }
    } else if (action === 'DELETE_ITEM') {
      if (typeof id === 'number' && !parsedData.deleted.includes(id)) {
        parsedData.deleted.push(id);
      }
    } else if (action === 'CLEAR_ALL') {
      newClearedAt = new Date();
      parsedData.read = [];
      parsedData.deleted = [];
    } else if (action === 'TOGGLE_SOUND') {
      if (typeof soundMuted === 'boolean') {
        newSoundMuted = soundMuted;
      }
    }

    // Limit stored IDs to latest 300 items to keep column lightweight
    if (parsedData.read.length > 300) parsedData.read = parsedData.read.slice(-300);
    if (parsedData.deleted.length > 300) parsedData.deleted = parsedData.deleted.slice(-300);

    const serializedState = JSON.stringify(parsedData);

    const updated = await (prisma as any).userNotificationState.upsert({
      where: { userId },
      update: {
        readIds: serializedState,
        clearedAt: newClearedAt,
        soundMuted: newSoundMuted
      },
      create: {
        userId,
        readIds: serializedState,
        clearedAt: newClearedAt,
        soundMuted: newSoundMuted
      }
    });

    return NextResponse.json({
      success: true,
      readIds: parsedData.read,
      deletedIds: parsedData.deleted,
      clearedAt: updated.clearedAt ? updated.clearedAt.toISOString() : null,
      soundMuted: updated.soundMuted
    });
  } catch (error: any) {
    console.error('Error updating notification state:', error);
    return NextResponse.json({ error: error.message || 'Failed to update notification state' }, { status: 500 });
  }
}
