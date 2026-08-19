import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { defaultRolePermissions } from '@/lib/permissions';

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'role_permissions' }
    });

    if (!setting || !setting.value) {
      return NextResponse.json(defaultRolePermissions);
    }

    const parsed = JSON.parse(setting.value);
    
    // Auto-initialize GUEST if it doesn't exist in the legacy DB settings
    if (!parsed.labels || !parsed.labels.GUEST) {
      if (!parsed.labels) parsed.labels = {};
      parsed.labels.GUEST = 'Guest';
      
      if (!parsed.permissions) parsed.permissions = {};
      Object.keys(defaultRolePermissions.permissions).forEach(key => {
        if (defaultRolePermissions.permissions[key]?.includes('GUEST')) {
          if (!parsed.permissions[key]) {
            parsed.permissions[key] = [];
          }
          if (!parsed.permissions[key].includes('GUEST')) {
            parsed.permissions[key].push('GUEST');
          }
        }
      });
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Error fetching role_permissions:', error);
    return NextResponse.json(defaultRolePermissions);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Admin yang dapat mengubah role.' }, { status: 403 });
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating role_permissions:', error);
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
  }
}
