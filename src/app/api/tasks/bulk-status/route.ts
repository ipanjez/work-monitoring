import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role === 'VIEWER') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    const { ids, status } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    let progress = 0;
    if (status === 'Done') progress = 100;
    else if (status === 'In Progress') progress = 50;
    else if (status === 'To Do') progress = 0;

    const updatedTasks = await prisma.task.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        status,
        progress
      }
    });

    try {
      const taskRecords = await prisma.task.findMany({
        where: { id: { in: ids } },
        select: { nama: true }
      });
      const logPromises = taskRecords.map(task => 
        prisma.activityLog.create({
          data: {
            action: `Pembaruan Status Pekerjaan: ${task.nama}`,
            title: `Status diubah menjadi ${status}`,
            message: `Status pekerjaan diperbarui secara massal menjadi ${status}.`,
            type: 'info'
          }
        })
      );
      await Promise.all(logPromises);
    } catch(e) {
      console.error('Failed to create activity logs for bulk update', e);
    }

    return NextResponse.json({ success: true, count: updatedTasks.count });
  } catch (error: any) {
    console.error('Error updating bulk status:', error);
    return NextResponse.json({ error: error.message || 'Failed to update tasks' }, { status: 500 });
  }
}
