import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PassThrough } from 'stream';
import fs from 'fs';
import path from 'path';
import { list, put } from '@vercel/blob';

// Import CJS modules dynamically or via require to avoid Turbopack default export errors
const archiver = require('archiver');
const AdmZip = require('adm-zip');

const isLocal = process.env.DATABASE_URL?.startsWith('file:');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tasks = await prisma.task.findMany();
    const settings = await prisma.appSetting.findMany();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        npk: true,
        name: true,
        email: true,
        image: true,
        password: true,
        role: true,
        status: true,
      }
    });
    const activityLogs = await prisma.activityLog.findMany();

    const dbData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      tasks,
      settings,
      users,
      activityLogs,
    };

    // Create a PassThrough stream
    const stream = new PassThrough();

    // Create archiver
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    // Listen for all archive data to be written
    archive.on('error', function(err: any) {
      console.error('Archive error:', err);
      stream.emit('error', err);
    });

    // Pipe archive data to the stream
    archive.pipe(stream);

    // Append database JSON
    archive.append(JSON.stringify(dbData, null, 2), { name: 'database.json' });

    if (isLocal) {
      // Append uploads directory if it exists locally
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (fs.existsSync(uploadsDir)) {
        archive.directory(uploadsDir, 'uploads');
      }
      archive.finalize();
    } else {
      // Cloud MODE: Fetch all blobs from Vercel Blob
      (async () => {
        try {
          let cursor: string | undefined;
          do {
            const listResult: any = await list({ cursor });
            
            // Fetch in parallel
            const fetchPromises = listResult.blobs.map(async (blob: any) => {
              try {
                const res = await fetch(blob.url);
                if (res.ok) {
                  const arrayBuffer = await res.arrayBuffer();
                  return { data: Buffer.from(arrayBuffer), name: `uploads/${blob.pathname}` };
                }
              } catch (e) {
                console.error('Failed to fetch blob:', blob.url, e);
              }
              return null;
            });
            
            const results = await Promise.all(fetchPromises);
            for (const item of results) {
              if (item) {
                archive.append(item.data, { name: item.name });
              }
            }
            
            cursor = listResult.cursor;
          } while (cursor);
        } catch (cloudErr) {
          console.error('Error fetching blobs for backup:', cloudErr);
        } finally {
          archive.finalize();
        }
      })();
    }

    // Convert Node PassThrough stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk)));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      }
    });

    const filename = `Backup_Database_Pekerjaan_${new Date().toISOString().split('T')[0]}.zip`;

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error('Error exporting database:', error);
    return NextResponse.json({ error: error.message || 'Failed to export database' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Allow import without auth if database has zero users (fresh local setup)
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      const session = await getServerSession(authOptions);
      if (!session || (session.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    let dbData: any = null;
    let zipBuffer: Buffer | null = null;

    // Check content type to see if it's JSON (legacy backup) or multipart/form-data (zip backup)
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No backup file provided' }, { status: 400 });
      }
      
      const arrayBuffer = await file.arrayBuffer();
      zipBuffer = Buffer.from(arrayBuffer);
      
      const zip = new AdmZip(zipBuffer);
      const zipEntries = zip.getEntries();
      
      const dbEntry = zipEntries.find((entry: any) => entry.entryName === 'database.json');
      if (!dbEntry) {
        return NextResponse.json({ error: 'Invalid backup: database.json not found inside zip' }, { status: 400 });
      }
      
      const jsonString = zip.readAsText(dbEntry);
      dbData = JSON.parse(jsonString);

      // If local, create uploads directory
      let uploadsDir = '';
      if (isLocal) {
        uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        // Delete old uploads
        if (fs.existsSync(uploadsDir)) {
           fs.rmSync(uploadsDir, { recursive: true, force: true });
        }
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Extract all files in the "uploads/" folder of the zip
      for (const entry of zipEntries as any[]) {
        if (entry.entryName.startsWith('uploads/') && !entry.isDirectory) {
          const fileName = entry.entryName.replace('uploads/', '');
          if (fileName) {
            const entryData = zip.readFile(entry);
            if (entryData) {
              if (isLocal) {
                const filePath = path.join(uploadsDir, fileName);
                fs.writeFileSync(filePath, entryData);
              } else {
                // Upload to Vercel Blob
                // Ensure unique name or replace existing. Since we're restoring, we might want to keep the exact name.
                // Vercel blob put allows overwriting if we use exact name, but default put generates random prefix.
                // To keep the exact name, we can use `addRandomSuffix: false` if supported, or just let it generate.
                // Wait, if tasks reference the URL, we can't easily change the URL.
                // Oh wait, Vercel Blob URLs are immutable and generated by Vercel. 
                // If we upload a new blob, it gets a NEW URL, which means the tasks referring to old URLs will be broken!
                // To fix this, we should really just rely on Vercel's existing blobs (they don't get deleted by db wipe).
                // Actually, restoring a DB doesn't delete blobs from Vercel Blob!
                // So if it's Vercel Blob, we just re-upload it just in case it was deleted, but wait, `addRandomSuffix: false` allows exact paths.
                await put(fileName, entryData, {
                  access: 'public',
                  addRandomSuffix: false
                });
              }
            }
          }
        }
      }
    } else {
      // Legacy JSON backup support
      dbData = await req.json();
    }

    if (!dbData) {
       return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 });
    }

    const { tasks, settings, users, activityLogs } = dbData;

    if (!Array.isArray(tasks) || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'Invalid backup format: tasks or settings missing' }, { status: 400 });
    }

    // Helper: parse date fields safely for both PostgreSQL and SQLite
    const parseDate = (d: any): Date => {
      if (!d) return new Date();
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    // Clean tasks: remove id (let autoincrement handle it) and parse dates
    const cleanTasks = tasks.map((t: any) => {
      const { id, createdBy, ...rest } = t;
      return {
        ...rest,
        startDate: parseDate(rest.startDate),
        endDate: parseDate(rest.endDate),
        createdAt: parseDate(rest.createdAt),
        updatedAt: parseDate(rest.updatedAt),
        lastEditedAt: rest.lastEditedAt ? parseDate(rest.lastEditedAt) : null,
        isAllDay: typeof rest.isAllDay === 'string' ? rest.isAllDay === 'true' : Boolean(rest.isAllDay),
        progress: Number(rest.progress) || 0,
        orderIndex: Number(rest.orderIndex) || 0,
        editCount: Number(rest.editCount) || 0,
        // Remove relational field that can't be directly inserted
        createdById: null,
      };
    });

    const cleanSettings = settings.map((s: any) => {
      const { id, ...rest } = s;
      return {
        ...rest,
        updatedAt: parseDate(rest.updatedAt),
      };
    });

    // Execute deletion + insertion in a transaction
    const deleteOps: any[] = [
      prisma.activityLog.deleteMany(),
      prisma.passwordResetRequest.deleteMany(),
      prisma.account.deleteMany(),
      prisma.session.deleteMany(),
      prisma.task.deleteMany(),
      prisma.appSetting.deleteMany(),
      prisma.user.deleteMany(),
    ];
    
    await prisma.$transaction(deleteOps);

    // Insert users first (tasks may reference them)
    if (Array.isArray(users) && users.length > 0) {
      const cleanUsers = users.map((u: any) => ({
        id: u.id,
        npk: u.npk,
        name: u.name || null,
        email: u.email || null,
        image: u.image || null,
        password: u.password || null,
        role: u.role || 'MEMBER',
        status: u.status || 'ACTIVE',
      }));

      for (const user of cleanUsers) {
        await prisma.user.create({ data: user });
      }
    }

    // Insert tasks
    if (cleanTasks.length > 0) {
      await prisma.task.createMany({ data: cleanTasks });
    }

    // Insert settings
    if (cleanSettings.length > 0) {
      await prisma.appSetting.createMany({ data: cleanSettings });
    }

    // Insert activity logs
    if (Array.isArray(activityLogs) && activityLogs.length > 0) {
      const cleanLogs = activityLogs.map((l: any) => {
        const { id, ...rest } = l;
        return {
          ...rest,
          createdAt: parseDate(rest.createdAt),
        };
      });
      await prisma.activityLog.createMany({ data: cleanLogs });
    }

    // Log this restore (try, don't fail if it errors)
    try {
      await prisma.activityLog.create({
        data: {
          action: 'RESTORE_DATABASE',
          title: 'Database Restored',
          message: `Database dipulihkan dari file backup. ${cleanTasks.length} pekerjaan, ${cleanSettings.length} pengaturan, ${users?.length || 0} user berhasil diimpor.`,
          type: 'warning',
          userName: 'System',
        }
      });
    } catch (e) {}

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil memulihkan: ${cleanTasks.length} pekerjaan, ${cleanSettings.length} pengaturan, ${users?.length || 0} user.` 
    });
  } catch (error: any) {
    console.error('Error restoring database:', error);
    return NextResponse.json({ error: error.message || 'Failed to restore database' }, { status: 500 });
  }
}
