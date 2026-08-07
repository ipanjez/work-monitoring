import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listType, oldValue, newValue } = await request.json();

    if (!listType || !oldValue || !newValue) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    let settingKey = '';
    if (listType === 'cat') settingKey = 'master_categories';
    if (listType === 'pic') settingKey = 'master_pics';
    if (listType === 'status') settingKey = 'master_statuses';
    if (listType === 'priority') settingKey = 'master_priorities';
    if (listType === 'location') settingKey = 'master_locations';

    if (!settingKey) {
      return NextResponse.json({ error: 'Invalid listType' }, { status: 400 });
    }

    // 1. Update the main setting array
    const settingRecord = await prisma.appSetting.findUnique({ where: { key: settingKey } });
    if (settingRecord) {
      try {
        const arr = JSON.parse(settingRecord.value);
        if (Array.isArray(arr)) {
          const index = arr.indexOf(oldValue);
          if (index !== -1) {
            arr[index] = newValue;
            await prisma.appSetting.update({
              where: { key: settingKey },
              data: { value: JSON.stringify(arr) }
            });
          }
        }
      } catch (e) {
        console.error('Failed to parse setting array', e);
      }
    }

    // 2. Update master_colors and master_status_progress
    const colorsRecord = await prisma.appSetting.findUnique({ where: { key: 'master_colors' } });
    if (colorsRecord) {
      try {
        const colors = JSON.parse(colorsRecord.value);
        const oldColorKey = `${listType}_${oldValue}`;
        const newColorKey = `${listType}_${newValue}`;
        if (colors[oldColorKey]) {
          colors[newColorKey] = colors[oldColorKey];
          delete colors[oldColorKey];
          await prisma.appSetting.update({
            where: { key: 'master_colors' },
            data: { value: JSON.stringify(colors) }
          });
        }
      } catch (e) {}
    }

    if (listType === 'status') {
      const progressRecord = await prisma.appSetting.findUnique({ where: { key: 'master_status_progress' } });
      if (progressRecord) {
        try {
          const progress = JSON.parse(progressRecord.value);
          if (progress[oldValue] !== undefined) {
            progress[newValue] = progress[oldValue];
            delete progress[oldValue];
            await prisma.appSetting.update({
              where: { key: 'master_status_progress' },
              data: { value: JSON.stringify(progress) }
            });
          }
        } catch (e) {}
      }
    }

    // 3. Cascade update Tasks
    if (listType === 'cat') {
      await prisma.task.updateMany({
        where: { kategori: oldValue },
        data: { kategori: newValue }
      });
    } else if (listType === 'status') {
      await prisma.task.updateMany({
        where: { status: oldValue },
        data: { status: newValue }
      });
    } else if (listType === 'priority') {
      await prisma.task.updateMany({
        where: { prioritas: oldValue },
        data: { prioritas: newValue }
      });
    } else if (listType === 'location') {
      // For locations, we need to find tasks that have this location in their JSON
      const allTasks = await prisma.task.findMany({
        where: { lokasi: { not: null } }
      });
      for (const task of allTasks) {
        if (!task.lokasi) continue;
        try {
          const parsedLoc = JSON.parse(task.lokasi);
          let changed = false;
          
          if (parsedLoc.tipe === 'offline' && parsedLoc.lokasiFisik === oldValue) {
            parsedLoc.lokasiFisik = newValue;
            changed = true;
          } else if (parsedLoc.lokasi === oldValue || task.lokasi === oldValue) {
            // raw string match
            changed = true;
          }

          if (changed) {
            await prisma.task.update({
              where: { id: task.id },
              data: { lokasi: task.lokasi === oldValue ? newValue : JSON.stringify(parsedLoc) }
            });
          }
        } catch (e) {
          if (task.lokasi === oldValue) {
            await prisma.task.update({
              where: { id: task.id },
              data: { lokasi: newValue }
            });
          }
        }
      }
    } else if (listType === 'pic') {
      // 1. PIC utama
      await prisma.task.updateMany({
        where: { pic: oldValue },
        data: { pic: newValue }
      });

      // 2. PIC tambahan (additionalPics)
      const tasksWithAddPics = await prisma.task.findMany({
        where: { additionalPics: { contains: oldValue } }
      });
      for (const task of tasksWithAddPics) {
        if (!task.additionalPics) continue;
        try {
          let arr = JSON.parse(task.additionalPics);
          if (Array.isArray(arr)) {
            let changed = false;
            arr = arr.map(p => {
              if (p === oldValue) {
                changed = true;
                return newValue;
              }
              return p;
            });
            if (changed) {
              await prisma.task.update({
                where: { id: task.id },
                data: { additionalPics: JSON.stringify(arr) }
              });
            }
          }
        } catch (e) {}
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error renaming setting:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
