import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


const calculateProgress = (status: string, subTasksJson: string | null | undefined): number => {
  if (subTasksJson) {
    try {
      const subTasks = JSON.parse(subTasksJson);
      if (Array.isArray(subTasks) && subTasks.length > 0) {
        const doneCount = subTasks.filter(t => t.status === 'Done').length;
        const inProgCount = subTasks.filter(t => t.status === 'In Progress').length;
        return Math.round(((doneCount + (inProgCount * 0.5)) / subTasks.length) * 100);
      }
    } catch(e) {}
  }
  if (status === 'Done') return 100;
  if (status === 'In Progress') return 50;
  return 0;
};

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { 
      nama, pic, status, prioritas, kategori, progress, 
      deskripsi, catatan, fileUrl, fileName, filesJson, 
      isAllDay, startTime, endTime, repetisi, additionalPics, 
      startDate, endDate, subTasksJson 
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
    let currentLogs: Array<{ action: string; timestamp: string; details?: string }> = [];

    if (existingTask?.historyLogsJson) {
      try {
        currentLogs = JSON.parse(existingTask.historyLogsJson);
      } catch (e) {}
    }

    const changes: string[] = [];
    if (existingTask) {
      if (status !== undefined && status !== existingTask.status) changes.push(`Status (${existingTask.status} ➔ ${status})`);
      if (prioritas !== undefined && prioritas !== existingTask.prioritas) changes.push(`Prioritas (${existingTask.prioritas} ➔ ${prioritas})`);
      if (kategori !== undefined && kategori !== existingTask.kategori) changes.push(`Kategori (${existingTask.kategori || 'Umum'} ➔ ${kategori})`);
      if (pic !== undefined && pic !== existingTask.pic) changes.push(`PIC (${existingTask.pic} ➔ ${pic})`);
      if (nama !== undefined && nama !== existingTask.nama) changes.push(`Nama Pekerjaan`);
      if (deskripsi !== undefined && deskripsi !== existingTask.deskripsi) changes.push(`Deskripsi`);
      
      const formatDt = (d: any) => d ? new Date(d).toISOString().split('T')[0] : '';
      if (startDate !== undefined && formatDt(startDate) !== formatDt(existingTask.startDate)) changes.push(`Tgl Mulai`);
      if (endDate !== undefined && formatDt(endDate) !== formatDt(existingTask.endDate)) changes.push(`Tgl Selesai`);
      if (subTasksJson !== undefined && subTasksJson !== existingTask.subTasksJson) changes.push(`Sub Pekerjaan`);
    }

    currentLogs.push({
      action: `Diedit ke-${newCount} kali`,
      details: changes.length > 0 ? `${changes.join(', ')}` : '',
      timestamp: now.toISOString(),
    });

    
    const finalStatus = status !== undefined ? status : existingTask.status;
    const currentSubTasksJson = subTasksJson !== undefined ? subTasksJson : existingTask.subTasksJson;
    const finalProgress = calculateProgress(finalStatus, currentSubTasksJson);

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
          ...(subTasksJson !== undefined && { subTasksJson }),
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
