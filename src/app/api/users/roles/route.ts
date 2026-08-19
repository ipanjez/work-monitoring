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
      select: { name: true, role: true }
    });

    const roleMap: Record<string, string> = {};
    users.forEach(u => {
      if (u.name && u.role) {
        roleMap[u.name.trim()] = u.role;
        roleMap[u.name.trim().toLowerCase()] = u.role;
      }
    });

    return NextResponse.json(roleMap);
  } catch (error: any) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json({});
  }
}
