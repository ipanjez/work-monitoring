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
        labels: { ...defaultRolePermissions.labels, ...(parsed.labels || {}) },
        icons: { ...defaultRolePermissions.icons, ...(parsed.icons || {}) },
        colors: { ...defaultRolePermissions.colors, ...(parsed.colors || {}) },
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
