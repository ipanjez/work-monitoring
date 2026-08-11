import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role === 'VIEWER') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    const { updates } = await request.json(); // expected: { id: number, orderIndex: number }[]
    
    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const updatePromises = updates.map((update: { id: number, orderIndex: number }) => 
      prisma.task.update({
        where: { id: update.id },
        data: { orderIndex: update.orderIndex }
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ success: true, message: 'Tasks reordered' });
  } catch (error: any) {
    console.error('Reorder error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
