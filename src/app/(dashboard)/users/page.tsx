import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';
import { prisma } from '@/lib/prisma';
import { defaultRolePermissions, hasPermission, RolePermissionsConfig } from '@/lib/permissions';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/signin');
  }

  const userRole = (session.user as any)?.role || 'VIEWER';
  
  let roleConfig: RolePermissionsConfig = defaultRolePermissions;
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: 'role_permissions' } });
    if (setting && setting.value) {
      roleConfig = JSON.parse(setting.value);
    }
  } catch (e) {}

  if (!hasPermission(roleConfig, 'user_management', userRole)) {
    redirect('/');
  }

  return <UsersClient userRole={userRole} />;
}
