import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const isLocal = process.env.DATABASE_URL?.startsWith('file:');

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const setting = await prisma.appSetting.findUnique({ where: { key: 'max_total_storage_mb' } });
    const maxTotalStorageMb = setting ? Number(setting.value) : 5000;

    let usedBytes = 0;

    if (isLocal) {
      // Local mode: calculate from public/uploads directory
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (fs.existsSync(uploadsDir)) {
        const allFiles = fs.readdirSync(uploadsDir);
        for (const f of allFiles) {
          const stat = fs.statSync(path.join(uploadsDir, f));
          usedBytes += stat.size;
        }
      }
    } else {
      // Cloud mode: calculate from Vercel Blob
      const { list } = await import('@vercel/blob');
      let cursor: string | undefined;
      do {
        const listResult: any = await list({ cursor });
        usedBytes += listResult.blobs.reduce((acc: number, b: any) => acc + b.size, 0);
        cursor = listResult.cursor;
      } while (cursor);
    }

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
