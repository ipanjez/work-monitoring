import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#grad)" />
  <path d="M9 16.5L14 21.5L23 11" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

export async function GET() {
  try {
    const settings = await prisma.appSetting.findMany({
      where: {
        key: {
          in: ['app_favicon', 'app_logo']
        }
      }
    });

    const faviconSetting = settings.find(s => s.key === 'app_favicon')?.value;
    const logoSetting = settings.find(s => s.key === 'app_logo')?.value;

    const iconData = faviconSetting || logoSetting;

    if (iconData) {
      // If it's a Base64 data URL
      if (iconData.startsWith('data:')) {
        const match = iconData.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const contentType = match[1];
          const base64Data = match[2];
          const buffer = Buffer.from(base64Data, 'base64');

          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=60, s-maxage=60',
            },
          });
        }
      }

      // If it's a relative URL to /uploads/
      if (iconData.startsWith('/uploads/')) {
        try {
          const filePath = path.join(process.cwd(), 'public', iconData);
          if (fs.existsSync(filePath)) {
            const buffer = fs.readFileSync(filePath);
            const ext = path.extname(filePath).toLowerCase();
            let contentType = 'image/png';
            if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
            else if (ext === '.svg') contentType = 'image/svg+xml';
            else if (ext === '.ico') contentType = 'image/x-icon';

            return new NextResponse(buffer, {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=60, s-maxage=60',
              },
            });
          }
        } catch (e) {
          console.error('Error reading local favicon file:', e);
        }
      }

      // If it's an external URL, redirect
      if (iconData.startsWith('http://') || iconData.startsWith('https://')) {
        return NextResponse.redirect(iconData);
      }
    }

    // Default fallback: modern SVG
    return new NextResponse(DEFAULT_SVG, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
  } catch (error) {
    console.error('Favicon API Error:', error);
    return new NextResponse(DEFAULT_SVG, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
  }
}
