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
      startDate, endDate, subTasksJson, commentsJson, historyLogsJson, lokasi 
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
      if (startTime !== undefined && startTime !== existingTask.startTime) changes.push(`Jam Mulai`);
      if (endTime !== undefined && endTime !== existingTask.endTime) changes.push(`Jam Selesai`);
      if (isAllDay !== undefined && isAllDay !== existingTask.isAllDay) changes.push(`Sepanjang Hari`);
      if (subTasksJson !== undefined && subTasksJson !== existingTask.subTasksJson) changes.push(`Sub Pekerjaan`);
      if (repetisi !== undefined && repetisi !== existingTask.repetisi) changes.push(`Pengulangan`);
      if (catatan !== undefined && catatan !== existingTask.catatan) changes.push(`Catatan`);
      if (additionalPics !== undefined && additionalPics !== existingTask.additionalPics) changes.push(`PIC Tambahan`);
      if (fileUrl !== undefined && fileUrl !== existingTask.fileUrl) changes.push(`Lampiran`);
      if (filesJson !== undefined && filesJson !== existingTask.filesJson) changes.push(`Lampiran Multiple`);
    }

    if (historyLogsJson !== undefined) {
      // If the client explicitly provided new history logs (e.g. for deletion), use them
      try {
        currentLogs = JSON.parse(historyLogsJson);
      } catch (e) {}
    } else if (changes.length > 0 || Object.keys(body).length > 2) {
      // Only push an edit log if there are changes (not when just adding a comment)
      currentLogs.push({
        action: `Diedit ke-${newCount} kali`,
        details: changes.length > 0 ? `${changes.join(', ')}` : 'Memperbarui data',
        timestamp: now.toISOString(),
      });
    }
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
          ...(startDate !== undefined && { startDate: parseDate(startDate) }),
          ...(endDate !== undefined && { endDate: parseDate(endDate) }),
          ...(subTasksJson !== undefined && { subTasksJson }),
          ...(commentsJson !== undefined && { commentsJson }),
          ...(historyLogsJson !== undefined && { historyLogsJson }),
          ...(lokasi !== undefined && { lokasi }),
          editCount: changes.length > 0 ? newCount : existingTask?.editCount || 0,
          lastEditedAt: historyLogsJson !== undefined || commentsJson !== undefined ? existingTask.lastEditedAt : now,
          historyLogsJson: JSON.stringify(currentLogs),
        },
      });

      if (existingTask && status !== undefined && status !== existingTask.status) {
        try {
          await prisma.activityLog.create({
            data: {
              action: `Pembaruan Pekerjaan: ${task.nama}`,
              title: `Status pekerjaan "${task.nama}" diubah menjadi ${status}`,
              message: `Status pekerjaan "${task.nama}" diubah dari ${existingTask.status} menjadi ${status}`,
              type: 'info'
            }
          });
        } catch(e) { console.error('Failed to log activity', e); }
      } else if (existingTask && changes.length > 0) {
        try {
          await prisma.activityLog.create({
            data: {
              action: `Pembaruan Pekerjaan: ${task.nama}`,
              title: `Pekerjaan diperbarui`,
              message: `Perubahan: ${changes.join(', ')}`,
              type: 'info'
            }
          });
        } catch(e) { console.error('Failed to log activity', e); }
      }

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

        if (existingTask && status !== undefined && status !== existingTask.status) {
          try {
            await prisma.activityLog.create({
              data: {
                action: 'UPDATE_TASK_STATUS',
                title: `Status pekerjaan "${existingTask.nama}" diubah menjadi ${status}`,
                message: `Status pekerjaan "${existingTask.nama}" diubah dari ${existingTask.status} menjadi ${status}`,
                type: 'info'
              }
            });
          } catch(e) {}
        } else if (existingTask && changes.length > 0) {
          try {
            await prisma.activityLog.create({
              data: {
                action: `Pembaruan Pekerjaan: ${task.nama}`,
                title: `Pekerjaan diperbarui`,
                message: `Perubahan: ${changes.join(', ')}`,
                type: 'info'
              }
            });
          } catch(e) {}
        }

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
