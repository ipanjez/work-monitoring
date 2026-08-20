import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { defaultRolePermissions } from '@/lib/permissions';
import { checkServerPermission } from '@/lib/serverPermissions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'role_permissions' }
    });

    if (!setting || !setting.value) {
      return NextResponse.json(defaultRolePermissions);
    }

    const parsed = JSON.parse(setting.value);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Error fetching role_permissions:', error);
    return NextResponse.json(defaultRolePermissions);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized: Silakan login terlebih dahulu' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate basic structure
    if (!body.labels || !body.permissions) {
      return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 });
    }

    await prisma.appSetting.upsert({
      where: { key: 'role_permissions' },
      update: { value: JSON.stringify(body) },
      create: { key: 'role_permissions', value: JSON.stringify(body) },
    });

    return NextResponse.json({ success: true, roleConfig: body });
  } catch (error: any) {
    console.error('Error updating role_permissions:', error);
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
  }
}
