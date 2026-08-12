export interface RolePermissionsConfig {
  labels: Record<string, string>;
  permissions: Record<string, string[]>;
}

export const defaultRolePermissions: RolePermissionsConfig = {
  labels: {
    ADMIN: 'Admin',
    MEMBER: 'Member',
    VIEWER: 'Viewer',
    SPV: 'Supervisor'
  },
  permissions: {
    view_dashboard: ['ADMIN', 'MEMBER', 'VIEWER', 'SPV'],
    view_detail: ['ADMIN', 'MEMBER', 'VIEWER', 'SPV'],
    manage_task: ['ADMIN', 'MEMBER'],
    delete_task: ['ADMIN', 'MEMBER'],
    upload_comment: ['ADMIN', 'MEMBER'],
    export_data: ['ADMIN', 'MEMBER'],
    master_data: ['ADMIN'],
    user_management: ['ADMIN'],
    system_logs: ['ADMIN']
  }
};

export const hasPermission = (
  config: RolePermissionsConfig | null | undefined, 
  feature: string, 
  userRole: string
): boolean => {
  if (!config) config = defaultRolePermissions;
  const allowedRoles = config.permissions[feature];
  if (!allowedRoles) return false;
  return allowedRoles.includes(userRole);
};

export const getRoleLabel = (
  config: RolePermissionsConfig | null | undefined,
  userRole: string
): string => {
  if (!config) config = defaultRolePermissions;
  return config.labels[userRole] || userRole;
};
