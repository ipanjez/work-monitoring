import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

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

function toIcalDay(dt: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}`;
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

function getVTimezone(tz: string): string[] {
  let offset = '+0800';
  let tzName = tz;

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset'
    });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find(p => p.type === 'timeZoneName')?.value;
    if (tzPart) {
      const match = tzPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
      if (match) {
        const sign = match[1];
        const h = match[2].padStart(2, '0');
        const m = (match[3] || '00').padStart(2, '0');
        offset = `${sign}${h}${m}`;
      } else if (tzPart === 'GMT' || tzPart === 'UTC') {
        offset = '+0000';
      }
    }
  } catch (e) {
    if (tz === 'Asia/Jakarta') offset = '+0700';
    else if (tz === 'Asia/Jayapura') offset = '+0900';
    else if (tz === 'UTC') offset = '+0000';
  }

  if (tz === 'Asia/Makassar') tzName = 'WITA';
  else if (tz === 'Asia/Jakarta') tzName = 'WIB';
  else if (tz === 'Asia/Jayapura') tzName = 'WIT';

  return [
    'BEGIN:VTIMEZONE',
    `TZID:${tz}`,
    `X-LIC-LOCATION:${tz}`,
    'BEGIN:STANDARD',
    `TZOFFSETFROM:${offset}`,
    `TZOFFSETTO:${offset}`,
    `TZNAME:${tzName}`,
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];
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

    // Timezone resolution: Query param `tz` -> DB setting `calendar_timezone` -> Default 'Asia/Makassar'
    const tzParam = searchParams.get('tz');
    const tzSetting = await prisma.appSetting.findUnique({ where: { key: 'calendar_timezone' } });
    const timezone = (tzParam || tzSetting?.value || 'Asia/Makassar').trim();

    // Query Filters (Personalization by PIC, Kategori, Status, or Active Only)
    const filterPic = searchParams.get('pic')?.trim();
    const filterKategori = searchParams.get('kategori')?.trim();
    const filterStatus = searchParams.get('status')?.trim();
    const hideCompleted = searchParams.get('hideCompleted') === 'true' || searchParams.get('hideCompleted') === '1';

    const whereClause: any = {};

    if (filterPic) {
      whereClause.OR = [
        { pic: filterPic },
        { additionalPics: { contains: filterPic } },
      ];
    }

    if (filterKategori) {
      whereClause.kategori = filterKategori;
    }

    if (filterStatus) {
      whereClause.status = filterStatus;
    } else if (hideCompleted) {
      whereClause.NOT = [
        { status: { in: ['Done', 'Selesai', 'Closed', 'Completed'] } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: { startDate: 'asc' },
    });

    // Compute ETag for efficient caching and bandwidth saving
    let maxUpdated = 0;
    for (const t of tasks) {
      const up = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;
      if (up > maxUpdated) maxUpdated = up;
    }
    const etagRaw = `cal-${tasks.length}-${maxUpdated}-${timezone}-${filterPic || ''}-${hideCompleted}`;
    const etag = `"${crypto.createHash('md5').update(etagRaw).digest('hex')}"`;

    const ifNoneMatch = req.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=1800, must-revalidate',
        },
      });
    }

    // App & Department name for calendar title
    const appSetting = await prisma.appSetting.findUnique({ where: { key: 'app_name' } });
    const deptSetting = await prisma.appSetting.findUnique({ where: { key: 'dept_name' } });
    let calTitle = `${deptSetting?.value || appSetting?.value || 'DeptMonitor'} - Jadwal Pekerjaan`;
    if (filterPic) {
      calTitle += ` (${filterPic})`;
    }

    // Build iCal standard lines (RFC 5545)
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
      'X-PUBLISHED-TTL:PT1H',
      'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
      ...getVTimezone(timezone),
    ];

    for (const task of tasks) {
      try {
        const startRaw = task.startDate ? new Date(task.startDate) : null;
        const endRaw = task.endDate ? new Date(task.endDate) : null;

        if (!startRaw || isNaN(startRaw.getTime()) || !endRaw || isNaN(endRaw.getTime())) {
          continue; // skip tasks with invalid dates
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

        // Handle All-Day Event vs Timed Event
        // If no explicit startTime is provided, format as an All-Day Event (VALUE=DATE)
        // This prevents long-range multi-day/annual tasks from blocking the entire hourly grid in Google Calendar!
        if (!task.startTime) {
          const dtStartDay = toIcalDay(startRaw);
          // In iCal RFC 5545, DTEND for all-day events is non-inclusive (day after the end date)
          const nextDay = new Date(endRaw.getFullYear(), endRaw.getMonth(), endRaw.getDate() + 1);
          const dtEndDay = toIcalDay(nextDay);

          icsLines.push(`DTSTART;VALUE=DATE:${dtStartDay}`);
          icsLines.push(`DTEND;VALUE=DATE:${dtEndDay}`);
        } else {
          // Explicit timed event
          let startH = 9, startM = 0, endH = 10, endM = 0;
          const partsStart = task.startTime.split(':').map(Number);
          if (!isNaN(partsStart[0])) startH = partsStart[0];
          if (partsStart[1] !== undefined && !isNaN(partsStart[1])) startM = partsStart[1];

          if (task.endTime) {
            const partsEnd = task.endTime.split(':').map(Number);
            if (!isNaN(partsEnd[0])) endH = partsEnd[0];
            if (partsEnd[1] !== undefined && !isNaN(partsEnd[1])) endM = partsEnd[1];
          } else {
            endH = Math.min(23, startH + 1);
            endM = startM;
          }

          const dtStart = new Date(startRaw.getFullYear(), startRaw.getMonth(), startRaw.getDate(), startH, startM);
          const dtEnd = new Date(endRaw.getFullYear(), endRaw.getMonth(), endRaw.getDate(), endH, endM);

          if (dtEnd <= dtStart) {
            dtEnd.setTime(dtStart.getTime() + 60 * 60 * 1000); // default 1 hour
          }

          icsLines.push(`DTSTART;TZID=${timezone}:${toIcalDate(dtStart)}`);
          icsLines.push(`DTEND;TZID=${timezone}:${toIcalDate(dtEnd)}`);
        }

        icsLines.push(`LAST-MODIFIED:${toIcalDate(updated)}`);
        icsLines.push(`SEQUENCE:${task.editCount || 0}`);
        icsLines.push(`SUMMARY:${escapeIcal(`[${task.kategori || 'Umum'}] ${task.nama}`)}`);
        icsLines.push(`DESCRIPTION:${escapeIcal(rawDescription)}`);
        if (locStr) icsLines.push(`LOCATION:${escapeIcal(locStr)}`);
        icsLines.push('STATUS:CONFIRMED');

        // VALARM for reminder (15 minutes prior)
        icsLines.push('BEGIN:VALARM');
        icsLines.push('TRIGGER:-PT15M');
        icsLines.push('ACTION:DISPLAY');
        icsLines.push(`DESCRIPTION:Reminder: ${escapeIcal(task.nama)}`);
        icsLines.push('END:VALARM');

        icsLines.push('END:VEVENT');
      } catch (taskErr) {
        console.error(`Error processing task ${task.id}:`, taskErr);
      }
    }

    icsLines.push('END:VCALENDAR');

    const icsContent = icsLines.join('\r\n');

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="calendar.ics"',
        'ETag': etag,
        'Cache-Control': 'public, max-age=1800, must-revalidate',
        'Expires': new Date(Date.now() + 1800 * 1000).toUTCString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating calendar feed:', error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}
