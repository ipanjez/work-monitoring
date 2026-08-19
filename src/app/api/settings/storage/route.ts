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
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (fs.existsSync(uploadsDir)) {
          const allFiles = fs.readdirSync(uploadsDir);
          for (const f of allFiles) {
            const stat = fs.statSync(path.join(uploadsDir, f));
            usedBytes += stat.size;
          }
        }
      } catch (e) {
        console.warn('Could not scan local uploads directory:', e);
      }
    } else if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Cloud mode: calculate from Vercel Blob
      try {
        const { list } = await import('@vercel/blob');
        let cursor: string | undefined;
        do {
          const listResult: any = await list({ cursor });
          usedBytes += listResult.blobs.reduce((acc: number, b: any) => acc + (b.size || 0), 0);
          cursor = listResult.cursor;
        } while (cursor);
      } catch (e) {
        console.warn('Could not list Vercel blobs:', e);
      }
    }

    // Fallback: Calculate from task records metadata if usedBytes is still 0
    if (usedBytes === 0) {
      try {
        const allTasks = await prisma.task.findMany({
          select: { filesJson: true }
        });
        for (const t of allTasks) {
          if (t.filesJson) {
            try {
              const files = JSON.parse(t.filesJson);
              if (Array.isArray(files)) {
                for (const f of files) {
                  if (f && typeof f.size === 'number' && !f.isDeleted) {
                    usedBytes += f.size;
                  }
                }
              }
            } catch (e) {}
          }
        }
      } catch (e) {
        console.warn('Could not calculate from task records:', e);
      }
    }

    const usedMb = Number((usedBytes / (1024 * 1024)).toFixed(2));

    return NextResponse.json({
      usedBytes,
      usedMb,
      totalUsedMb: usedMb,
      maxTotalStorageMb,
    });
  } catch (error) {
    console.error('Storage API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
