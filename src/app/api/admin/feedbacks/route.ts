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
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const feedbacks = await prisma.activityLog.findMany({
      where: { action: 'SUBMIT_FEEDBACK' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(feedbacks);
  } catch (error: any) {
    console.error('Error fetching feedbacks:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
