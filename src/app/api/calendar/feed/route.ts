import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createEvents, EventAttributes } from 'ics';
import { getTaskDatesForExport, getTaskLocationString } from '@/utils/taskUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const setting = await prisma.appSetting.findUnique({ where: { key: 'calendar_token' } });
    const expectedToken = setting ? setting.value : (process.env.CALENDAR_SECRET_TOKEN || 'secure-calendar-token-12345');
    
    if (!token || token !== expectedToken) {
      return new NextResponse('Unauthorized: Invalid calendar token', { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      orderBy: { startDate: 'asc' },
    });

    const events: EventAttributes[] = tasks.map((task) => {
      const { startY, startMo, startD, startH, startM, endY, endMo, endD, endH, endM } = getTaskDatesForExport(task);
      const updated = new Date(task.updatedAt || task.createdAt || Date.now());
      
      let extraPicsStr = '';
      if (task.additionalPics) {
        try {
          const arr = JSON.parse(task.additionalPics);
          if (Array.isArray(arr) && arr.length > 0) extraPicsStr = `, ${arr.join(', ')}`;
        } catch (e) {}
      }

      const locStr = getTaskLocationString(task);

      return {
        uid: `task-${task.id}@deptmonitor.local`,
        title: `[${task.kategori || 'Umum'}] ${task.nama}`,
        description: `PIC: ${task.pic}${extraPicsStr}\nStatus: ${task.status} (${task.progress || 0}%)\nPrioritas: ${task.prioritas || 'Medium'}\nRepetisi: ${task.repetisi || 'Tidak Berulang'}\nDeskripsi: ${task.deskripsi || '-'}`,
        start: [startY, startMo + 1, startD, startH, startM],
        end: [endY, endMo + 1, endD, endH, endM],
        location: locStr || undefined,
        productId: 'DeptMonitor/CalendarFeed',
        sequence: task.editCount || 0,
        lastModified: [updated.getFullYear(), updated.getMonth() + 1, updated.getDate(), updated.getHours(), updated.getMinutes()],
        alarms: [
          {
            action: 'display',
            description: `Reminder: ${task.nama}`,
            trigger: { minutes: 30, before: true }
          }
        ]
      };
    });

    return new Promise<NextResponse>((resolve) => {
      if (events.length === 0) {
        const dummyFeed = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//DeptMonitor//Work Monitoring Calendar//ID\r\nX-WR-CALNAME:DeptMonitor Calendar\r\nEND:VCALENDAR`;
        return resolve(new NextResponse(dummyFeed, {
          headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'inline; filename="calendar.ics"',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }));
      }

      createEvents(events, (error, value) => {
        if (error || !value) {
          return resolve(NextResponse.json({ error: 'Failed to generate iCal feed' }, { status: 500 }));
        }

        return resolve(new NextResponse(value, {
          headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'inline; filename="calendar.ics"',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }));
      });
    });
  } catch (error: any) {
    console.error('Error generating calendar feed:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate calendar feed' }, { status: 500 });
  }
}
