import { prisma } from '@/lib/prisma';
import { defaultRolePermissions, hasPermission, RolePermissionsConfig } from '@/lib/permissions';

export async function getRoleConfigFromDB(): Promise<RolePermissionsConfig> {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'role_permissions' }
    });
    if (setting && setting.value) {
      return JSON.parse(setting.value);
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
