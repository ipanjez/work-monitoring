import { prisma } from '@/lib/prisma';
import { defaultRolePermissions, hasPermission, RolePermissionsConfig } from '@/lib/permissions';

export async function getRoleConfigFromDB(): Promise<RolePermissionsConfig> {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'role_permissions' }
    });
    if (setting && setting.value) {
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

      const merged: RolePermissionsConfig = {
        labels: (parsed.labels && Object.keys(parsed.labels).length > 0) ? parsed.labels : defaultRolePermissions.labels,
        icons: parsed.icons || defaultRolePermissions.icons,
        colors: parsed.colors || defaultRolePermissions.colors,
        permissions
      };
      return merged;
    }
  } catch (e) {
    console.error('Error fetching role config from DB:', e);
  }
  return defaultRolePermissions;
}

export async function checkServerPermission(feature: string, userRole: string): Promise<boolean> {
  const config = await getRoleConfigFromDB();
  return hasPermission(config, feature, userRole);
}
