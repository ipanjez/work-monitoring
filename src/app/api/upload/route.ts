import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('file') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedResults = [];

    for (const file of files) {
      if (typeof file === 'string') continue;
      
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${safeName}`;

      // Unggah ke Vercel Blob
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
