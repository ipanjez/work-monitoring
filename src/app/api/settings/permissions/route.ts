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
    const labels = (parsed.labels && Object.keys(parsed.labels).length > 0) ? parsed.labels : defaultRolePermissions.labels;
    const validRoleKeys = new Set(Object.keys(labels));
    const permissions: Record<string, string[]> = {};
    const featKeys = ['view_tasks', 'manage_task', 'delete_task', 'export_data', 'system_settings', 'user_administration'];
    featKeys.forEach(k => {
      let rawList: string[] = [];
      if (parsed.permissions && Array.isArray(parsed.permissions[k])) {
        rawList = parsed.permissions[k];
      } else {
        if (k === 'view_tasks') {
          rawList = parsed.permissions?.view_tasks || parsed.permissions?.view_dashboard || ['ADMIN'];
        } else if (k === 'manage_task') {
          rawList = parsed.permissions?.manage_task || ['ADMIN'];
        } else if (k === 'delete_task') {
          rawList = parsed.permissions?.delete_task || ['ADMIN'];
        } else if (k === 'export_data') {
          rawList = parsed.permissions?.export_data || ['ADMIN'];
        } else if (k === 'system_settings') {
          rawList = parsed.permissions?.system_settings || parsed.permissions?.master_data || ['ADMIN'];
        } else if (k === 'user_administration') {
          rawList = parsed.permissions?.user_administration || parsed.permissions?.user_management || ['ADMIN'];
        } else {
          rawList = ['ADMIN'];
        }
      }
      permissions[k] = rawList.filter(rk => rk === 'ADMIN' || validRoleKeys.has(rk));
    });

    const merged = {
      labels,
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

    const validRoleKeys = new Set(Object.keys(body.labels));
    const sanitizedPermissions: Record<string, string[]> = {};
    Object.entries(body.permissions).forEach(([k, list]) => {
      if (Array.isArray(list)) {
        sanitizedPermissions[k] = list.filter((rk: any) => typeof rk === 'string' && (rk === 'ADMIN' || validRoleKeys.has(rk)));
      }
    });

    const sanitizedBody = {
      ...body,
      permissions: sanitizedPermissions
    };

    await prisma.appSetting.upsert({
      where: { key: 'role_permissions' },
      update: { value: JSON.stringify(sanitizedBody) },
      create: { key: 'role_permissions', value: JSON.stringify(sanitizedBody) },
    });

    return NextResponse.json({ success: true, roleConfig: sanitizedBody });
  } catch (error: any) {
    console.error('Error updating role_permissions:', error);
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
  }
}
