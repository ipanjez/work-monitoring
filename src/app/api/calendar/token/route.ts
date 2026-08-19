import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkServerPermission } from '@/lib/serverPermissions';

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

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role || '';
    const isAllowed = await checkServerPermission('system_config', userRole);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Unauthorized: Izin konfigurasi sistem diperlukan' }, { status: 403 });
    }

    const newToken = crypto.randomBytes(16).toString('hex');
    const updated = await prisma.appSetting.upsert({
      where: { key: 'calendar_token' },
      update: { value: newToken },
      create: { key: 'calendar_token', value: newToken },
    });

    return NextResponse.json({ success: true, token: updated.value });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to reset calendar token' }, { status: 500 });
  }
}
