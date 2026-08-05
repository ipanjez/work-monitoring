import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const setting = await prisma.appSetting.findUnique({ where: { key: 'max_total_storage_mb' } });
    const maxTotalStorageMb = setting ? Number(setting.value) : 5000;
    
    let usedBytes = 0;
    let cursor: string | undefined;
    do {
      const listResult: any = await list({ cursor });
      usedBytes += listResult.blobs.reduce((acc: number, b: any) => acc + b.size, 0);
      cursor = listResult.cursor;
    } while (cursor);

    return NextResponse.json({
      usedBytes,
      maxTotalStorageMb,
      usedMb: usedBytes / (1024 * 1024),
    });
  } catch (error) {
    console.error('Storage API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
