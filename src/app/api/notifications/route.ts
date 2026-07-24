import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20, // Only fetch the last 20 updated tasks
      select: {
        id: true,
        nama: true,
        pic: true,
        status: true,
        updatedAt: true,
        historyLogsJson: true,
      }
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}
