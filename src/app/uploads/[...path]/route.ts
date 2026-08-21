import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json',
};

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  props: { params: Promise<{ path: string[] }> }
) {
  try {
    const params = await props.params;
    const pathSegments = params.path || [];
    if (pathSegments.length === 0) {
      return new NextResponse('File path not provided', { status: 400 });
    }

    const filename = pathSegments[pathSegments.length - 1];
    const decodedFilename = decodeURIComponent(filename);

    // 1. Check local disk in public/uploads/
    const localFilePath = path.join(process.cwd(), 'public', 'uploads', ...pathSegments);
    if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile()) {
      const fileBuffer = fs.readFileSync(localFilePath);
      const ext = path.extname(localFilePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${encodeURIComponent(decodedFilename)}"`,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 2. Check Vercel Blob cloud storage if BLOB_READ_WRITE_TOKEN is configured
    const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    if (hasBlobToken) {
      try {
        const { list } = await import('@vercel/blob');
        
        // Search by prefix or list blobs
        const listResult = await list({ prefix: decodedFilename });
        let matchedBlob = listResult.blobs.find(b => 
          b.pathname === decodedFilename || 
          b.pathname.endsWith(decodedFilename) ||
          b.url.includes(encodeURIComponent(decodedFilename)) ||
          b.url.includes(decodedFilename)
        );

        if (!matchedBlob && listResult.blobs.length > 0) {
          matchedBlob = listResult.blobs[0];
        }

        // If not found with prefix, search full blob list (up to 1000)
        if (!matchedBlob) {
          const allBlobs = await list({ limit: 1000 });
          matchedBlob = allBlobs.blobs.find(b => 
            b.pathname === decodedFilename || 
            b.pathname.endsWith(decodedFilename) ||
            b.url.includes(encodeURIComponent(decodedFilename)) ||
            b.url.includes(decodedFilename)
          );
        }

        if (matchedBlob) {
          return NextResponse.redirect(matchedBlob.downloadUrl || matchedBlob.url, 307);
        }
      } catch (blobErr) {
        console.error('Error fetching from Vercel Blob in /uploads handler:', blobErr);
      }
    }

    return new NextResponse('File tidak ditemukan (404)', { 
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  } catch (error: any) {
    console.error('Error in /uploads route:', error);
    return new NextResponse('Internal Server Error: ' + (error.message || 'Unknown error'), { status: 500 });
  }
}
