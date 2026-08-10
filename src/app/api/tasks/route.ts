import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: [
        { orderIndex: 'asc' },
        { id: 'desc' }
      ],
    });
    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch tasks' }, { status: 500 });
  }
}


const calculateProgress = async (status: string, subTasksJson: string | null | undefined): Promise<number> => {
  let masterProgress: Record<string, number> = { 'To Do': 0, 'In Progress': 50, 'Done': 100 };
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: 'master_status_progress' } });
    if (setting && setting.value) {
      masterProgress = JSON.parse(setting.value);
    }
  } catch(e) {}

  if (subTasksJson) {
    try {
      const subTasks = JSON.parse(subTasksJson);
      if (Array.isArray(subTasks) && subTasks.length > 0) {
        let totalScore = 0;
        for (const st of subTasks) {
           const p = masterProgress[st.status];
           totalScore += (p !== undefined ? p : (st.status === 'Done' ? 100 : st.status === 'In Progress' ? 50 : 0));
        }
        return Math.round(totalScore / subTasks.length);
      }
    } catch(e) {}
  }
  return masterProgress[status] !== undefined ? masterProgress[status] : (status === 'Done' ? 100 : status === 'In Progress' ? 50 : 0);
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parseDate = (d: any) => {
      if (!d) return new Date();
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    const initialLog = JSON.stringify([{ action: "Pekerjaan dibuat", timestamp: new Date().toISOString() }]);

    // Handle array for bulk import
    if (Array.isArray(body)) {
      const tasksToCreate = await Promise.all(body.map(async (task) => {
        const prog = await calculateProgress(task.status || 'To Do', task.subTasksJson);
        return {
          nama: String(task.nama || 'Tanpa Nama'),
          pic: String(task.pic || 'Unassigned'),
          status: task.status || 'To Do',
          prioritas: task.prioritas || 'Medium',
          kategori: task.kategori || 'Umum',
          progress: prog,
          deskripsi: task.deskripsi || null,
          catatan: task.catatan || null,
          fileUrl: task.fileUrl || null,
          fileName: task.fileName || null,
          startDate: parseDate(task.startDate),
          endDate: parseDate(task.endDate),
          isAllDay: task.isAllDay !== undefined ? Boolean(task.isAllDay) : false,
          startTime: task.startTime || '08:00',
          endTime: task.endTime || '17:00',
          subTasksJson: task.subTasksJson || null,
          additionalPics: task.additionalPics || null,
          historyLogsJson: initialLog,
          lokasi: task.lokasi || null,
        };
      }));
      
      const created = await prisma.$transaction(
        tasksToCreate.map(data => prisma.task.create({ data }))
      );
      return NextResponse.json(created);
    }

    const { 
      nama, pic, status, prioritas, kategori, progress, 
      deskripsi, catatan, fileUrl, fileName, filesJson, 
      isAllDay, startTime, endTime, repetisi, additionalPics, 
      startDate, endDate, subTasksJson, lokasi 
    } = body;
    
    if (!nama || !pic) {
      return NextResponse.json({ error: 'Nama dan PIC wajib diisi' }, { status: 400 });
    }

    const finalStatus = status || 'To Do';
      const finalProgress = await calculateProgress(finalStatus, subTasksJson);

    try {
      const task = await prisma.task.create({
        data: {
          nama: String(nama),
          pic: String(pic),
          status: finalStatus,
          prioritas: prioritas || 'Medium',
          kategori: kategori || 'Umum',
          progress: finalProgress,
          deskripsi: deskripsi || null,
          catatan: catatan || null,
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          filesJson: filesJson || null,
          isAllDay: isAllDay !== undefined ? Boolean(isAllDay) : true,
          startTime: startTime || '08:00',
          endTime: endTime || '17:00',
          repetisi: repetisi || 'Tidak Berulang',
          additionalPics: additionalPics || null,
          editCount: 0,
          lastEditedAt: null,
          historyLogsJson: initialLog,
          startDate: parseDate(startDate),
          endDate: parseDate(endDate),
          subTasksJson: subTasksJson || null,
          lokasi: lokasi || null,
        },
      });

      return NextResponse.json(task);
    } catch (createErr: any) {
      console.error('Primary task creation failed, trying fallback 1:', createErr);
      
      try {
        const task = await prisma.task.create({
          data: {
            nama: String(nama),
            pic: String(pic),
            status: finalStatus,
            prioritas: prioritas || 'Medium',
            kategori: kategori || 'Umum',
            progress: finalProgress,
            deskripsi: deskripsi || null,
            catatan: catatan || null,
            fileUrl: fileUrl || null,
            fileName: fileName || null,
            startDate: parseDate(startDate),
            endDate: parseDate(endDate),
          },
        });

        return NextResponse.json(task);
      } catch (fallbackErr: any) {
        console.error('Fallback 1 failed, trying minimal fallback:', fallbackErr);

        const task = await prisma.task.create({
          data: {
            nama: String(nama),
            pic: String(pic),
            status: finalStatus,
            prioritas: prioritas || 'Medium',
            kategori: kategori || 'Umum',
            progress: finalProgress,
            deskripsi: deskripsi || null,
            catatan: catatan || null,
            startDate: parseDate(startDate),
            endDate: parseDate(endDate),
          },
        });

        return NextResponse.json(task);
      }
    }
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: error.message || 'Failed to create task' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const ids = idsParam.split(',').map(Number).filter(id => !isNaN(id));
      if (ids.length > 0) {
        await prisma.task.deleteMany({
          where: { id: { in: ids } }
        });
        return NextResponse.json({ success: true, count: ids.length });
      }
    }
    return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete tasks' }, { status: 500 });
  }
}

