import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function escapeIcal(str: string): string {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function toIcalDate(dt: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function parseTaskLocation(lokasi: string | null): string {
  if (!lokasi) return '';
  try {
    const parsed = JSON.parse(lokasi);
    return parsed.lokasiFisik || parsed.linkZoom || lokasi;
  } catch {
    return lokasi;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    // Validate token
    const setting = await prisma.appSetting.findUnique({ where: { key: 'calendar_token' } });
    const expectedToken = setting?.value || (process.env.CALENDAR_SECRET_TOKEN || 'secure-calendar-token-12345');

    if (!token || token !== expectedToken) {
      return new NextResponse('Unauthorized: Invalid calendar token', { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      orderBy: { startDate: 'asc' },
    });

    // Timezone configuration (Priority: Query param `tz` -> DB setting `calendar_timezone` -> Default 'Asia/Makassar')
    const tzParam = searchParams.get('tz');
    const tzSetting = await prisma.appSetting.findUnique({ where: { key: 'calendar_timezone' } });
    const timezone = (tzParam || tzSetting?.value || 'Asia/Makassar').trim();

    // App/Dept name for calendar title
    const appSetting = await prisma.appSetting.findUnique({ where: { key: 'app_name' } });
    const deptSetting = await prisma.appSetting.findUnique({ where: { key: 'dept_name' } });
    const calTitle = `${deptSetting?.value || appSetting?.value || 'DeptMonitor'} - Jadwal Pekerjaan`;

    // Build iCal manually for maximum reliability
    const now = new Date();
    const nowStr = toIcalDate(now);

    let icsLines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DeptMonitor//Work Monitoring Calendar//ID',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeIcal(calTitle)}`,
      `X-WR-TIMEZONE:${timezone}`,
      'X-WR-CALDESC:Feed kalender otomatis dari sistem monitoring pekerjaan',
    ];

    for (const task of tasks) {
      try {
        const startRaw = task.startDate ? new Date(task.startDate) : null;
        const endRaw = task.endDate ? new Date(task.endDate) : null;

        if (!startRaw || isNaN(startRaw.getTime()) || !endRaw || isNaN(endRaw.getTime())) {
          continue; // skip tasks with invalid dates
        }

        // Apply time if provided
        let startH = 9, startM = 0, endH = 17, endM = 0;
        if (task.startTime) {
          const parts = task.startTime.split(':').map(Number);
          if (!isNaN(parts[0])) startH = parts[0];
          if (parts[1] !== undefined && !isNaN(parts[1])) startM = parts[1];
        }
        if (task.endTime) {
          const parts = task.endTime.split(':').map(Number);
          if (!isNaN(parts[0])) endH = parts[0];
          if (parts[1] !== undefined && !isNaN(parts[1])) endM = parts[1];
        } else if (task.startTime) {
          endH = Math.min(23, startH + 1);
          endM = startM;
        }

        const dtStart = new Date(startRaw.getFullYear(), startRaw.getMonth(), startRaw.getDate(), startH, startM);
        const dtEnd = new Date(endRaw.getFullYear(), endRaw.getMonth(), endRaw.getDate(), endH, endM);

        // Ensure end is after start
        if (dtEnd <= dtStart) {
          dtEnd.setTime(dtStart.getTime() + 60 * 60 * 1000); // +1 hour
        }

        let extraPics = '';
        if (task.additionalPics) {
          try {
            const arr = JSON.parse(task.additionalPics);
            if (Array.isArray(arr) && arr.length > 0) extraPics = `, ${arr.join(', ')}`;
          } catch {}
        }

        const rawDescription = [
          `PIC: ${task.pic}${extraPics}`,
          `Status: ${task.status} (${task.progress || 0}%)`,
          `Prioritas: ${task.prioritas || 'Medium'}`,
          task.deskripsi ? `Deskripsi: ${task.deskripsi.replace(/<[^>]+>/g, '')}` : '',
        ].filter(Boolean).join('\n');

        const locStr = parseTaskLocation(task.lokasi || null);
        const updated = task.updatedAt ? new Date(task.updatedAt) : now;

        icsLines.push('BEGIN:VEVENT');
        icsLines.push(`UID:task-${task.id}@deptmonitor.vercel.app`);
        icsLines.push(`DTSTAMP:${nowStr}`);
        icsLines.push(`DTSTART;TZID=${timezone}:${toIcalDate(dtStart)}`);
        icsLines.push(`DTEND;TZID=${timezone}:${toIcalDate(dtEnd)}`);
        icsLines.push(`LAST-MODIFIED:${toIcalDate(updated)}`);
        icsLines.push(`SEQUENCE:${task.editCount || 0}`);
        icsLines.push(`SUMMARY:${escapeIcal(`[${task.kategori || 'Umum'}] ${task.nama}`)}`);
        icsLines.push(`DESCRIPTION:${escapeIcal(rawDescription)}`);
        if (locStr) icsLines.push(`LOCATION:${escapeIcal(locStr)}`);
        icsLines.push('BEGIN:VALARM');
        icsLines.push('TRIGGER:-PT15M');
        icsLines.push('ACTION:DISPLAY');
        icsLines.push(`DESCRIPTION:Reminder: ${escapeIcal(task.nama)}`);
        icsLines.push('END:VALARM');
        icsLines.push('END:VEVENT');
      } catch (taskErr) {
        console.error(`Error processing task ${task.id}:`, taskErr);
        // continue with next task
      }
    }

    icsLines.push('END:VCALENDAR');

    const icsContent = icsLines.join('\r\n');

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="calendar.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Error generating calendar feed:', error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}
