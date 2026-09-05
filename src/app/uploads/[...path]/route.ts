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
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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
    const uploadsBaseDir = path.resolve(process.cwd(), 'public', 'uploads');
    const localFilePath = path.resolve(uploadsBaseDir, ...pathSegments);

    // SECURITY: Strictly prevent Directory Traversal attacks (e.g. ../../.env)
    if (!localFilePath.startsWith(uploadsBaseDir)) {
      return new NextResponse('Access Denied: Path Traversal Detected', { status: 403 });
    }

    if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile()) {
      const fileBuffer = fs.readFileSync(localFilePath);
      const ext = path.extname(localFilePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      const headers: Record<string, string> = {
        'Content-Type': contentType,
        'Content-Disposition': ext === '.svg'
          ? `attachment; filename="${encodeURIComponent(decodedFilename)}"`
          : `inline; filename="${encodeURIComponent(decodedFilename)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      };

      // Sanitize/Sandbox SVG files against stored XSS
      if (ext === '.svg') {
        headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";
      }

      return new NextResponse(fileBuffer, { headers });
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

        if (matchedBlob) {
          return NextResponse.redirect(matchedBlob.downloadUrl || matchedBlob.url, 307);
        }
      } catch (blobErr: any) {
        // Silently ignore store does not exist / invalid token errors
        if (!blobErr.message?.includes('store does not exist')) {
          console.warn('Vercel Blob lookup skipped in /uploads:', blobErr.message);
        }
      }
    }

    // 3. Check AppFile database table (Primary on-demand cloud storage)
    try {
      const { prisma } = await import('@/lib/prisma');
      const cleanSearchName = decodedFilename.replace(/^\d+_\d+_/, '');

      const appFile = await prisma.appFile.findFirst({
        where: {
          OR: [
            { filename: decodedFilename },
            { filename: cleanSearchName },
            { filename: { contains: cleanSearchName } },
          ],
        },
      });

      if (appFile && appFile.data) {
        const contentType = appFile.mimeType || MIME_TYPES[path.extname(decodedFilename).toLowerCase()] || 'application/octet-stream';
        const buffer = Buffer.from(appFile.data, 'base64');
        const ext = path.extname(decodedFilename).toLowerCase();
        const headers: Record<string, string> = {
          'Content-Type': contentType,
          'Content-Disposition': ext === '.svg'
            ? `attachment; filename="${encodeURIComponent(decodedFilename)}"`
            : `inline; filename="${encodeURIComponent(decodedFilename)}"`,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'X-Content-Type-Options': 'nosniff',
        };
        if (ext === '.svg') {
          headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";
        }

        return new NextResponse(buffer, { headers });
      }

      // Helper function to extract buffer & mime from base64 data URL
      const streamDataUrl = (dataUrl: string, name: string) => {
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const contentType = match[1] || MIME_TYPES[path.extname(name).toLowerCase()] || 'application/octet-stream';
          const buffer = Buffer.from(match[2], 'base64');
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `inline; filename="${encodeURIComponent(name)}"`,
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            },
          });
        }
        return null;
      };

      // Search in Tasks (fallback)
      const tasks = await prisma.task.findMany({
        where: {
          OR: [
            { fileUrl: { contains: decodedFilename } },
            { fileName: { contains: cleanSearchName } },
            { filesJson: { contains: decodedFilename } },
            { filesJson: { contains: cleanSearchName } },
            { commentsJson: { contains: decodedFilename } },
          ],
        },
      });

      for (const t of tasks) {
        // Check main fileUrl
        if (t.fileUrl) {
          if (t.fileUrl.startsWith('data:') && (t.fileName === cleanSearchName || t.fileName === decodedFilename || t.fileUrl.includes(decodedFilename))) {
            const res = streamDataUrl(t.fileUrl, t.fileName || decodedFilename);
            if (res) return res;
          } else if (t.fileUrl.startsWith('http') && !t.fileUrl.includes('/uploads/')) {
            return NextResponse.redirect(t.fileUrl, 307);
          }
        }

        // Check filesJson
        if (t.filesJson) {
          try {
            const files = JSON.parse(t.filesJson);
            if (Array.isArray(files)) {
              for (const f of files) {
                const fName = f.name || '';
                const fUrl = f.url || '';
                if (fName === decodedFilename || fName === cleanSearchName || fUrl.includes(decodedFilename)) {
                  if (fUrl.startsWith('data:')) {
                    const res = streamDataUrl(fUrl, fName || decodedFilename);
                    if (res) return res;
                  } else if (fUrl.startsWith('http') && !fUrl.includes('/uploads/')) {
                    return NextResponse.redirect(fUrl, 307);
                  }
                }
              }
            }
          } catch (e) {}
        }

        // Check commentsJson
        if (t.commentsJson) {
          try {
            const comments = JSON.parse(t.commentsJson);
            if (Array.isArray(comments)) {
              for (const c of comments) {
                const cUrl = c.fileUrl || '';
                const cName = c.fileName || '';
                if (cName === decodedFilename || cName === cleanSearchName || cUrl.includes(decodedFilename)) {
                  if (cUrl.startsWith('data:')) {
                    const res = streamDataUrl(cUrl, cName || decodedFilename);
                    if (res) return res;
                  } else if (cUrl.startsWith('http') && !cUrl.includes('/uploads/')) {
                    return NextResponse.redirect(cUrl, 307);
                  }
                }
              }
            }
          } catch (e) {}
        }
      }

      // Check AppSettings (e.g. master_pic_avatars, app_logo)
      const settings = await prisma.appSetting.findMany({
        where: {
          OR: [
            { key: 'master_pic_avatars' },
            { key: 'app_logo' }
          ]
        }
      });
      for (const s of settings) {
        if (s.key === 'master_pic_avatars' && s.value) {
          try {
            const avatars = JSON.parse(s.value);
            for (const pic in avatars) {
              const url = avatars[pic];
              if (url && (url.includes(decodedFilename) || url.includes(cleanSearchName))) {
                if (url.startsWith('data:')) {
                  const res = streamDataUrl(url, decodedFilename);
                  if (res) return res;
                }
              }
            }
          } catch (e) {}
        } else if (s.key === 'app_logo' && s.value && s.value.startsWith('data:')) {
          if (s.value.includes(decodedFilename) || s.value.includes(cleanSearchName)) {
            const res = streamDataUrl(s.value, decodedFilename);
            if (res) return res;
          }
        }
      }

    } catch (dbErr) {
      console.warn('DB lookup fallback in /uploads handler:', dbErr);
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

