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

    // Scan physical files in public/uploads
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

    // Scan database AppFile storage (Primary cloud storage)
    const dbFiles = new Set<string>();
    let totalDbBytes = 0;
    try {
      const appFiles = await prisma.appFile.findMany({
        select: { filename: true, size: true }
      });
      for (const af of appFiles) {
        dbFiles.add(af.filename);
        totalDbBytes += af.size;
      }
    } catch (e) {}

    // Scan physical files in Vercel Blob cloud
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
      } catch (err: any) {
        if (!err.message?.includes('store does not exist')) {
          console.warn('Error querying blobs for backup stats:', err.message);
        }
      }
    }

    const allAvailableFiles = new Set([...localFiles, ...dbFiles, ...blobFiles]);
    const availableCleanNames = new Map<string, string>();
    for (const f of allAvailableFiles) {
      // Map stripped name (e.g. tanpa prefix 1786351023282_499_)
      const clean = f.replace(/^\d+_\d+_/, '').toLowerCase().replace(/\s+/g, '_');
      availableCleanNames.set(clean, f);
      availableCleanNames.set(f.toLowerCase(), f);
    }

    // Collect all referenced files across tasks, filesJson, and commentsJson
    const referencedFiles = new Map<string, { displayName: string; rawFileName: string; url: string }>();

    for (const t of tasks as any[]) {
      if (t.fileUrl) {
        const u = t.fileUrl;
        // Skip data URLs — they are embedded in the DB and always available
        if (u.startsWith('data:')) {
          // Count them as available but don't add to referencedFiles for disk/cloud checks
        } else {
          const urlFile = decodeURIComponent(u.replace(/^.*[\\\/]/, ''));
          const dispName = t.fileName || urlFile;
          if (urlFile && !referencedFiles.has(urlFile)) {
            referencedFiles.set(urlFile, { displayName: dispName, rawFileName: urlFile, url: u });
          }
        }
      }
      if (t.filesJson) {
        try {
          const files = JSON.parse(t.filesJson);
          if (Array.isArray(files)) {
            for (const f of files) {
              const u = f.url || '';
              // Skip data URLs — embedded in DB
              if (u.startsWith('data:')) continue;
              const urlFile = u ? decodeURIComponent(u.replace(/^.*[\\\/]/, '')) : '';
              const dispName = f.name || urlFile;
              const key = urlFile || dispName;
              if (key && !referencedFiles.has(key)) {
                referencedFiles.set(key, { displayName: dispName, rawFileName: urlFile || dispName, url: u });
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
                // Skip data URLs — embedded in DB
                if (u.startsWith('data:')) continue;
                const urlFile = decodeURIComponent(u.replace(/^.*[\\\/]/, ''));
                const dispName = c.fileName || urlFile;
                if (urlFile && !referencedFiles.has(urlFile)) {
                  referencedFiles.set(urlFile, { displayName: dispName, rawFileName: urlFile, url: u });
                }
              }
            }
          }
        } catch (e) {}
      }
    }

    // Check presence of referenced files
    const missingFiles: string[] = [];
    let availableReferencedCount = 0;

    for (const [key, fObj] of referencedFiles.entries()) {
      const rawName = fObj.rawFileName;
      const cleanRaw = rawName.replace(/^\d+_\d+_/, '').toLowerCase().replace(/\s+/g, '_');
      const cleanDisp = (fObj.displayName || '').replace(/^\d+_\d+_/, '').toLowerCase().replace(/\s+/g, '_');

      const exists = 
        allAvailableFiles.has(rawName) ||
        allAvailableFiles.has(fObj.displayName) ||
        availableCleanNames.has(cleanRaw) ||
        availableCleanNames.has(cleanDisp) ||
        (fObj.url && fObj.url.startsWith('http'));

      if (exists) {
        availableReferencedCount++;
      } else {
        missingFiles.push(fObj.displayName || rawName);
      }
    }

    // Total files to report: max of total referenced files or total physical files on disk/cloud
    const totalCount = Math.max(referencedFiles.size, allAvailableFiles.size);
    const availableCount = totalCount - missingFiles.length;

    // Track latest database updates across tables
    const latestTask = await prisma.task.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { nama: true, updatedAt: true, pic: true, status: true, prioritas: true }
    });

    const latestLog = await prisma.activityLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { userName: true, action: true, title: true, message: true, createdAt: true }
    });

    const latestSetting = await prisma.appSetting.findFirst({
      where: {
        key: { notIn: ['last_backup_downloaded_by', 'last_backup_downloaded_at', 'last_backup_date'] }
      },
      orderBy: { updatedAt: 'desc' },
      select: { key: true, updatedAt: true }
    });

    const lastBackupDownloadedBySetting = await prisma.appSetting.findUnique({
      where: { key: 'last_backup_downloaded_by' }
    });
    const lastBackupDownloadedAtSetting = await prisma.appSetting.findUnique({
      where: { key: 'last_backup_downloaded_at' }
    });

    let lastDownloadedBy = '';
    let lastDownloadedAt = '';
    if (lastBackupDownloadedBySetting) {
      try { lastDownloadedBy = JSON.parse(lastBackupDownloadedBySetting.value); } catch { lastDownloadedBy = lastBackupDownloadedBySetting.value; }
    }
    if (lastBackupDownloadedAtSetting) {
      try { lastDownloadedAt = JSON.parse(lastBackupDownloadedAtSetting.value); } catch { lastDownloadedAt = lastBackupDownloadedAtSetting.value; }
    }

    const updateCandidates: { date: string; summary: string; type: string }[] = [];
    if (latestTask?.updatedAt) {
      updateCandidates.push({
        date: new Date(latestTask.updatedAt).toISOString(),
        summary: `Pekerjaan: "${latestTask.nama}" (PIC: ${latestTask.pic || 'All Staf'}, Status: ${latestTask.status})`,
        type: 'task'
      });
    }
    if (latestLog?.createdAt) {
      updateCandidates.push({
        date: new Date(latestLog.createdAt).toISOString(),
        summary: `${latestLog.title ? `${latestLog.title}: ` : ''}${latestLog.message || `Aktivitas oleh ${latestLog.userName}`}`,
        type: 'activity'
      });
    }
    if (latestSetting?.updatedAt) {
      updateCandidates.push({
        date: new Date(latestSetting.updatedAt).toISOString(),
        summary: `Pengaturan Sistem (${latestSetting.key})`,
        type: 'setting'
      });
    }

    updateCandidates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastDatabaseUpdate = updateCandidates[0] || {
      date: new Date().toISOString(),
      summary: 'Data database siap',
      type: 'general'
    };

    return NextResponse.json({
      totalTasks: taskCount,
      todoCount,
      inProgressCount,
      reviewCount,
      doneCount,
      totalReferencedFiles: totalCount,
      availableReferencedCount: availableCount,
      totalDistinctAvailableFiles: allAvailableFiles.size,
      missingFilesCount: missingFiles.length,
      missingFiles,
      totalDbBytes,
      totalLocalBytes,
      totalBlobBytes,
      estimatedTotalBytes: totalLocalBytes + totalDbBytes + totalBlobBytes,
      hasBlobStorage: hasBlobToken,
      lastDownloadedBy,
      lastDownloadedAt,
      lastDatabaseUpdate
    });
  } catch (error: any) {
    console.error('Error getting database backup stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
