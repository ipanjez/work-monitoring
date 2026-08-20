import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkServerPermission } from '@/lib/serverPermissions';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any)?.role || '';
  const isAllowed = await checkServerPermission('system_logs', userRole);
  if (!isAllowed) {
    return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk melihat log aktivitas sistem.' }, { status: 403 });
  }

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  return NextResponse.json(logs);
}
