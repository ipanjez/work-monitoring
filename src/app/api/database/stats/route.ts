import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany();
    
    const taskCount = tasks.length;
    const todoCount = tasks.filter(t => (t.status || '').toLowerCase().replace(/\s+/g, '') === 'todo').length;
    const inProgressCount = tasks.filter(t => (t.status || '').toLowerCase().replace(/\s+/g, '') === 'inprogress').length;
    const reviewCount = tasks.filter(t => (t.status || '').toLowerCase() === 'review').length;
    const doneCount = tasks.filter(t => (t.status || '').toLowerCase() === 'done').length;

    // Collect all referenced file paths/names in tasks and comments
    const referencedFiles = new Map<string, { name: string; url: string; size?: number }>();

    for (const t of tasks as any[]) {
      if (t.fileUrl) {
        const u = t.fileUrl;
        const match = u.match(/\/([^/?#]+)$/);
        const name = match ? decodeURIComponent(match[1]) : u;
        if (name && !name.startsWith('data:')) {
          referencedFiles.set(name, { name, url: u, size: t.fileSize || 0 });
        }
      }
      if (t.filesJson) {
        try {
          const files = JSON.parse(t.filesJson);
          if (Array.isArray(files)) {
            for (const f of files) {
              const u = f.url || '';
              const match = u.match(/\/([^/?#]+)$/);
              const name = f.name || (match ? decodeURIComponent(match[1]) : u);
              if (name && !name.startsWith('data:')) {
                referencedFiles.set(name, { name, url: u, size: f.size || 0 });
              }
            }
          }
        } catch (e) {}
      }
      if (t.commentsJson) {
        try {
          const comments = JSON.parse(t.commentsJson);
          if (Array.isArray(comments)) {
            for (const c of comments) {
              if (c.fileUrl) {
                const u = c.fileUrl;
                const match = u.match(/\/([^/?#]+)$/);
                const name = c.fileName || (match ? decodeURIComponent(match[1]) : u);
                if (name && !name.startsWith('data:')) {
                  referencedFiles.set(name, { name, url: u, size: c.fileSize || 0 });
                }
              }
            }
          }
        } catch (e) {}
      }
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const localFiles = new Set<string>();
    let totalLocalBytes = 0;

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const f of files) {
        const fPath = path.join(uploadsDir, f);
        if (fs.statSync(fPath).isFile()) {
          localFiles.add(f);
          totalLocalBytes += fs.statSync(fPath).size;
        }
      }
    }

    const blobFiles = new Set<string>();
    let totalBlobBytes = 0;
    const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

    if (hasBlobToken) {
      try {
        const { list } = await import('@vercel/blob');
        let cursor: string | undefined;
        do {
          const listRes: any = await list({ cursor, limit: 1000 });
          for (const b of listRes.blobs) {
            const fname = b.pathname.replace(/^uploads\//, '');
            blobFiles.add(fname);
            totalBlobBytes += b.size;
          }
          cursor = listRes.cursor;
        } while (cursor);
      } catch (err) {
        console.warn('Error querying blobs for backup stats:', err);
      }
    }

    // Check all referenced files against local disk and blob
    const allAvailableFiles = new Set([...localFiles, ...blobFiles]);
    const missingFiles: string[] = [];
    let availableReferencedCount = 0;

    for (const [fname, fObj] of referencedFiles.entries()) {
      if (allAvailableFiles.has(fname) || fObj.url.startsWith('http')) {
        availableReferencedCount++;
      } else {
        missingFiles.push(fname);
      }
    }

    const totalDistinctAvailableFiles = allAvailableFiles.size;

    return NextResponse.json({
      totalTasks: taskCount,
      todoCount,
      inProgressCount,
      reviewCount,
      doneCount,
      totalReferencedFiles: referencedFiles.size,
      availableReferencedCount,
      totalDistinctAvailableFiles,
      missingFilesCount: missingFiles.length,
      missingFiles,
      totalLocalBytes,
      totalBlobBytes,
      estimatedTotalBytes: totalLocalBytes + totalBlobBytes,
      hasBlobStorage: hasBlobToken,
    });
  } catch (error: any) {
    console.error('Error getting database backup stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
