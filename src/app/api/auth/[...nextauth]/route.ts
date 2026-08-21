import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

async function getDynamicOptions(req: NextRequest) {
  let sessionTimeoutHours = 24; // Default 24 hours
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: 'session_timeout_hours' } });
    if (setting) {
      sessionTimeoutHours = Number(setting.value) || 24;
    }
  } catch (e) {
    console.error('Failed to load session_timeout_hours', e);
  }

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (req.url.startsWith('https:') ? 'https' : 'http');
  const origin = `${proto}://${host}`;

  return {
    ...authOptions,
    callbacks: {
      ...authOptions.callbacks,
      async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
        const currentOrigin = origin || baseUrl;
        if (url.startsWith('/')) return `${currentOrigin}${url}`;
        try {
          const parsed = new URL(url);
          if (parsed.host === host) return url;
          return `${currentOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
        } catch {
          return currentOrigin;
        }
      },
    },
    session: {
      ...authOptions.session,
      maxAge: sessionTimeoutHours * 60 * 60, // in seconds
    },
  };
}

export async function GET(req: NextRequest, ctx: any) {
  const options = await getDynamicOptions(req);
  const params = await ctx.params;
  return NextAuth(options)(req, { ...ctx, params });
}

export async function POST(req: NextRequest, ctx: any) {
  const options = await getDynamicOptions(req);
  const params = await ctx.params;
  return NextAuth(options)(req, { ...ctx, params });
}

