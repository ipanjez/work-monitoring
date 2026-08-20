import { prisma } from '@/lib/prisma';
import { defaultRolePermissions, hasPermission, RolePermissionsConfig } from '@/lib/permissions';

export async function getRoleConfigFromDB(): Promise<RolePermissionsConfig> {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'role_permissions' }
    });
    if (setting && setting.value) {
      const parsed = JSON.parse(setting.value);
      const merged: RolePermissionsConfig = {
        labels: (parsed.labels && Object.keys(parsed.labels).length > 0) ? parsed.labels : defaultRolePermissions.labels,
        icons: parsed.icons || defaultRolePermissions.icons,
        colors: parsed.colors || defaultRolePermissions.colors,
        permissions: {
          ...defaultRolePermissions.permissions,
          ...(parsed.permissions || {})
        }
      };
      if (!parsed.permissions?.role_management && parsed.permissions?.user_management) {
        merged.permissions.role_management = parsed.permissions.user_management;
      }
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
