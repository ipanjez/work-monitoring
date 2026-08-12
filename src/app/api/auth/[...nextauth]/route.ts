import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

async function getDynamicOptions() {
  let sessionTimeoutHours = 720; // Default 30 days
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: 'session_timeout_hours' } });
    if (setting) {
      sessionTimeoutHours = Number(setting.value) || 720;
    }
  } catch (e) {
    console.error('Failed to load session_timeout_hours', e);
  }

  return {
    ...authOptions,
    session: {
      ...authOptions.session,
      maxAge: sessionTimeoutHours * 60 * 60, // in seconds
    },
  };
}

export async function GET(req: NextRequest, ctx: any) {
  const options = await getDynamicOptions();
  const params = await ctx.params;
  return NextAuth(options)(req, { ...ctx, params });
}

export async function POST(req: NextRequest, ctx: any) {
  const options = await getDynamicOptions();
  const params = await ctx.params;
  return NextAuth(options)(req, { ...ctx, params });
}

