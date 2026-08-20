import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: { 
        status: 'ACTIVE',
        role: { not: 'ADMIN' },
        name: { not: 'Administrator' }
      },
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    const names = users
      .map(u => u.name)
      .filter(Boolean)
      .filter(name => name!.toLowerCase() !== 'administrator') as string[];
    return NextResponse.json(names);
  } catch (error: any) {
    console.error('Error fetching registered PIC names:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
