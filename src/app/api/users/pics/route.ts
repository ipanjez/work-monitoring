import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: { 
        status: 'ACTIVE',
        name: { not: 'Administrator' }
      },
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    const names = users.map(u => u.name).filter(Boolean) as string[];
    return NextResponse.json(names);
  } catch (error: any) {
    console.error('Error fetching registered PIC names:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
