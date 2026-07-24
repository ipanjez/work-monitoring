import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { 
      nama, pic, status, prioritas, kategori, progress, 
      deskripsi, catatan, fileUrl, fileName, filesJson, 
      isAllDay, startTime, endTime, repetisi, additionalPics, 
      startDate, endDate 
    } = body;

    const parseDate = (d: any) => {
      if (!d) return undefined;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    };

    let existingTask: any = null;
    try {
      existingTask = await prisma.task.findUnique({ where: { id: Number(id) } });
    } catch (e) {}

    const now = new Date();
    const newCount = ((existingTask?.editCount || 0) + 1);
    let currentLogs: Array<{ action: string; timestamp: string }> = [];

    if (existingTask?.historyLogsJson) {
      try {
        currentLogs = JSON.parse(existingTask.historyLogsJson);
      } catch (e) {}
    }

    currentLogs.push({
      action: `Diedit ke-${newCount} kali`,
      timestamp: now.toISOString(),
    });

    let finalProgress = progress !== undefined ? Number(progress) : undefined;
    
    // Auto-update progress based on status changes if progress isn't explicitly set to a custom value during this update
    if (status !== undefined) {
      if (status === 'Done') {
        finalProgress = 100;
      } else if (status === 'To Do') {
        finalProgress = 0;
      } else if (status === 'In Progress') {
        if (finalProgress === undefined || finalProgress === 0) {
          finalProgress = 50;
        }
      }
    }

    try {
      const task = await prisma.task.update({
        where: { id: Number(id) },
        data: {
          ...(finalProgress !== undefined && { progress: finalProgress }),
          ...(nama !== undefined && { nama: String(nama) }),
          ...(pic !== undefined && { pic: String(pic) }),
          ...(status !== undefined && { status }),
          ...(prioritas !== undefined && { prioritas }),
          ...(kategori !== undefined && { kategori }),
          ...(deskripsi !== undefined && { deskripsi }),
          ...(catatan !== undefined && { catatan }),
          ...(fileUrl !== undefined && { fileUrl }),
          ...(fileName !== undefined && { fileName }),
          ...(filesJson !== undefined && { filesJson }),
          ...(isAllDay !== undefined && { isAllDay: Boolean(isAllDay) }),
          ...(startTime !== undefined && { startTime }),
          ...(endTime !== undefined && { endTime }),
          ...(repetisi !== undefined && { repetisi }),
          ...(additionalPics !== undefined && { additionalPics }),
          ...(startDate && { startDate: parseDate(startDate) }),
          ...(endDate && { endDate: parseDate(endDate) }),
          editCount: newCount,
          lastEditedAt: now,
          historyLogsJson: JSON.stringify(currentLogs),
        },
      });

      return NextResponse.json(task);
    } catch (updateErr: any) {
      console.error('Primary task update failed, trying fallback 1:', updateErr);
      
      try {
        const task = await prisma.task.update({
          where: { id: Number(id) },
          data: {
            ...(nama !== undefined && { nama: String(nama) }),
            ...(pic !== undefined && { pic: String(pic) }),
            ...(status !== undefined && { status }),
            ...(prioritas !== undefined && { prioritas }),
            ...(kategori !== undefined && { kategori }),
            ...(finalProgress !== undefined && { progress: finalProgress }),
            ...(deskripsi !== undefined && { deskripsi }),
            ...(catatan !== undefined && { catatan }),
            ...(startDate && { startDate: parseDate(startDate) }),
            ...(endDate && { endDate: parseDate(endDate) }),
          },
        });

        return NextResponse.json(task);
      } catch (fallbackErr: any) {
        console.error('Fallback 1 update failed, trying minimal update fallback:', fallbackErr);

        const task = await prisma.task.update({
          where: { id: Number(id) },
          data: {
            ...(nama !== undefined && { nama: String(nama) }),
            ...(pic !== undefined && { pic: String(pic) }),
            ...(status !== undefined && { status }),
            ...(prioritas !== undefined && { prioritas }),
            ...(kategori !== undefined && { kategori }),
            ...(finalProgress !== undefined && { progress: finalProgress }),
            ...(deskripsi !== undefined && { deskripsi }),
            ...(catatan !== undefined && { catatan }),
            ...(startDate && { startDate: parseDate(startDate) }),
            ...(endDate && { endDate: parseDate(endDate) }),
          },
        });

        return NextResponse.json(task);
      }
    }
  } catch (error: any) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ error: error.message || 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.task.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete task:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete task' }, { status: 500 });
  }
}
