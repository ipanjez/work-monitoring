import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Handle array for import
    if (Array.isArray(body)) {
      const created = await prisma.$transaction(
        body.map((task) => prisma.task.create({
          data: {
            nama: task.nama,
            pic: task.pic,
            status: task.status || 'To Do',
            startDate: new Date(task.startDate),
            endDate: new Date(task.endDate),
          }
        }))
      );
      return NextResponse.json(created);
    }

    const { nama, pic, status, startDate, endDate } = body;
    const task = await prisma.task.create({
      data: {
        nama,
        pic,
        status: status || 'To Do',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
