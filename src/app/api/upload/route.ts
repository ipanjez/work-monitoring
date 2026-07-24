import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('file') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const uploadedResults = [];

    for (const file of files) {
      if (typeof file === 'string') continue;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${safeName}`;
      const filePath = path.join(uploadsDir, uniqueFileName);

      await writeFile(filePath, buffer);

      uploadedResults.push({
        url: `/uploads/${uniqueFileName}`,
        name: file.name,
      });
    }

    return NextResponse.json({ 
      files: uploadedResults,
      fileUrl: uploadedResults[0]?.url || '',
      fileName: uploadedResults[0]?.name || '',
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}
