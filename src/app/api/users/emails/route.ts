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
      where: { status: 'ACTIVE' },
      select: { name: true, email: true },
    });

    const emailMap: Record<string, string> = {};
    users.forEach(u => {
      if (u.name && u.email) emailMap[u.name] = u.email;
    });

    return NextResponse.json(emailMap);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
