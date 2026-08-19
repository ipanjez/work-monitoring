import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkServerPermission } from '@/lib/serverPermissions';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role || '';
    const isAllowed = await checkServerPermission('manage_task', userRole);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk mengedit pekerjaan secara massal.' }, { status: 403 });
    }
    const { ids, updates } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const updatedTasks = await prisma.task.updateMany({
      where: {
        id: { in: ids }
      },
      data: updates
    });

    return NextResponse.json({ success: true, count: updatedTasks.count });
  } catch (error: any) {
    console.error('Error updating bulk tasks:', error);
    return NextResponse.json({ error: error.message || 'Failed to update tasks' }, { status: 500 });
  }
}
