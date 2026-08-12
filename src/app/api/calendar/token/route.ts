import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let setting = await prisma.appSetting.findUnique({ where: { key: 'calendar_token' } });
    if (!setting) {
      const newToken = crypto.randomBytes(16).toString('hex');
      setting = await prisma.appSetting.create({
        data: { key: 'calendar_token', value: newToken },
      });
    }
    return NextResponse.json({ token: setting.value });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch calendar token' }, { status: 500 });
  }
}
