import { prisma } from '@/lib/prisma';
import { defaultRolePermissions, hasPermission, RolePermissionsConfig } from '@/lib/permissions';

export async function getRoleConfigFromDB(): Promise<RolePermissionsConfig> {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'role_permissions' }
    });
    if (setting && setting.value) {
      const parsed = JSON.parse(setting.value);
      const labels = (parsed.labels && Object.keys(parsed.labels).length > 0) ? parsed.labels : defaultRolePermissions.labels;
      const validRoleKeys = new Set(Object.keys(labels));
      const permissions: Record<string, string[]> = {};
      const featKeys = ['manage_task', 'delete_task', 'comment_task', 'export_data', 'system_settings', 'user_administration'];
      featKeys.forEach(k => {
        let rawList: string[] = [];
        if (parsed.permissions && Array.isArray(parsed.permissions[k])) {
          rawList = parsed.permissions[k];
        } else {
          if (k === 'manage_task') {
            rawList = parsed.permissions?.manage_task || ['ADMIN'];
          } else if (k === 'delete_task') {
            rawList = parsed.permissions?.delete_task || ['ADMIN'];
          } else if (k === 'comment_task') {
            rawList = parsed.permissions?.comment_task || parsed.permissions?.upload_comment || ['ADMIN'];
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

      const merged: RolePermissionsConfig = {
        labels,
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
