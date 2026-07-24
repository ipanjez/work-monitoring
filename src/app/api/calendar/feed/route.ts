import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createEvents, EventAttributes } from 'ics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { startDate: 'asc' },
    });

    const events: EventAttributes[] = tasks.map((task) => {
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      
      let extraPicsStr = '';
      if (task.additionalPics) {
        try {
          const arr = JSON.parse(task.additionalPics);
          if (Array.isArray(arr) && arr.length > 0) extraPicsStr = `, ${arr.join(', ')}`;
        } catch (e) {}
      }

      return {
        uid: `task-${task.id}@deptmonitor.local`,
        title: `[${task.kategori || 'Umum'}] ${task.nama}`,
        description: `PIC: ${task.pic}${extraPicsStr}\nStatus: ${task.status} (${task.progress || 0}%)\nPrioritas: ${task.prioritas || 'Medium'}\nRepetisi: ${task.repetisi || 'Tidak Berulang'}\nDeskripsi: ${task.deskripsi || '-'}`,
        start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), 8, 0],
        end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), 17, 0],
        productId: 'DeptMonitor/CalendarFeed',
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
