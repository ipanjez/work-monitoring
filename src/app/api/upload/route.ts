import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

const isLocal = process.env.DATABASE_URL?.startsWith('file:');

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('file') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.xlsx', '.zip', '.txt', '.csv'];

    // --- LOCAL MODE: Save to disk ---
    if (isLocal) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Check storage limit
      const setting = await prisma.appSetting.findUnique({ where: { key: 'max_total_storage_mb' } });
      const maxTotalStorageMb = setting ? Number(setting.value) : 5000;
      const maxTotalStorageBytes = maxTotalStorageMb * 1024 * 1024;

      let usedBytes = 0;
      if (fs.existsSync(uploadsDir)) {
        const allFiles = fs.readdirSync(uploadsDir);
        for (const f of allFiles) {
          const stat = fs.statSync(path.join(uploadsDir, f));
          usedBytes += stat.size;
        }
      }

      const totalFileSize = files.reduce((acc, f) => acc + (typeof f !== 'string' ? f.size : 0), 0);
      if (usedBytes + totalFileSize > maxTotalStorageBytes) {
        return NextResponse.json({ error: `Kapasitas penyimpanan penuh. Tersisa ${((maxTotalStorageBytes - usedBytes) / (1024 * 1024)).toFixed(1)} MB.` }, { status: 400 });
      }

      const uploadedResults = [];
      for (const file of files) {
        if (typeof file === 'string') continue;

        const fileName = file.name.toLowerCase();
        const isValidExt = allowedExtensions.some(ext => fileName.endsWith(ext));
        if (!isValidExt) {
          return NextResponse.json({ error: `Tipe file tidak didukung: ${file.name}` }, { status: 400 });
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${safeName}`;
        const filePath = path.join(uploadsDir, uniqueFileName);

        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        uploadedResults.push({
          url: `/uploads/${uniqueFileName}`,
          name: file.name,
          size: file.size,
        });
      }

      return NextResponse.json({
        files: uploadedResults,
        fileUrl: uploadedResults[0]?.url || '',
        fileName: uploadedResults[0]?.name || '',
        fileSize: uploadedResults[0]?.size || 0,
      });
    }

    // --- CLOUD MODE: Use Vercel Blob ---
    const { put, list } = await import('@vercel/blob');

    // Check max total storage
    const setting = await prisma.appSetting.findUnique({ where: { key: 'max_total_storage_mb' } });
    const maxTotalStorageMb = setting ? Number(setting.value) : 5000;
    const maxTotalStorageBytes = maxTotalStorageMb * 1024 * 1024;

    const totalFileSize = files.reduce((acc, f) => acc + (typeof f !== 'string' ? f.size : 0), 0);

    let usedBytes = 0;
    let cursor: string | undefined;
    do {
      const listResult: any = await list({ cursor });
      usedBytes += listResult.blobs.reduce((acc: number, b: any) => acc + b.size, 0);
      cursor = listResult.cursor;
    } while (cursor);

    if (usedBytes + totalFileSize > maxTotalStorageBytes) {
      return NextResponse.json({ error: `Kapasitas penyimpanan penuh. Tersisa ${((maxTotalStorageBytes - usedBytes) / (1024 * 1024)).toFixed(1)} MB.` }, { status: 400 });
    }

    const uploadedResults = [];
    for (const file of files) {
      if (typeof file === 'string') continue;

      const fileName = file.name.toLowerCase();
      const isValidExt = allowedExtensions.some(ext => fileName.endsWith(ext));
      if (!isValidExt) {
        return NextResponse.json({ error: `Tipe file tidak didukung: ${file.name}` }, { status: 400 });
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${safeName}`;

      const blob = await put(uniqueFileName, file, {
        access: 'public',
      });

      uploadedResults.push({
        url: blob.url,
        name: file.name,
        size: file.size,
      });
    }

    return NextResponse.json({
      files: uploadedResults,
      fileUrl: uploadedResults[0]?.url || '',
      fileName: uploadedResults[0]?.name || '',
      fileSize: uploadedResults[0]?.size || 0,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}
