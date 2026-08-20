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
    const permissions: Record<string, string[]> = {};
    const featKeys = ['view_tasks', 'manage_task', 'delete_task', 'export_data', 'system_settings', 'user_administration'];
    featKeys.forEach(k => {
      if (parsed.permissions && Array.isArray(parsed.permissions[k])) {
        permissions[k] = parsed.permissions[k];
      } else {
        if (k === 'view_tasks') {
          permissions[k] = parsed.permissions?.view_tasks || parsed.permissions?.view_dashboard || ['ADMIN'];
        } else if (k === 'manage_task') {
          permissions[k] = parsed.permissions?.manage_task || ['ADMIN'];
        } else if (k === 'delete_task') {
          permissions[k] = parsed.permissions?.delete_task || ['ADMIN'];
        } else if (k === 'export_data') {
          permissions[k] = parsed.permissions?.export_data || ['ADMIN'];
        } else if (k === 'system_settings') {
          permissions[k] = parsed.permissions?.system_settings || parsed.permissions?.master_data || ['ADMIN'];
        } else if (k === 'user_administration') {
          permissions[k] = parsed.permissions?.user_administration || parsed.permissions?.user_management || ['ADMIN'];
        } else {
          permissions[k] = ['ADMIN'];
        }
      }
    });

    const merged = {
      labels: (parsed.labels && Object.keys(parsed.labels).length > 0) ? parsed.labels : defaultRolePermissions.labels,
      icons: parsed.icons || defaultRolePermissions.icons,
      colors: parsed.colors || defaultRolePermissions.colors,
      permissions
    };
    return NextResponse.json(merged);
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
