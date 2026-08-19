import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';
import { hasPermission } from '@/lib/permissions';
import { getRoleConfigFromDB } from '@/lib/serverPermissions';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/signin');
  }

  const userRole = (session.user as any)?.role || '';
  const roleConfig = await getRoleConfigFromDB();

  const canAccess = hasPermission(roleConfig, 'user_management', userRole) ||
                    hasPermission(roleConfig, 'system_logs', userRole) ||
                    hasPermission(roleConfig, 'admin_feedback', userRole);

  if (!canAccess) {
    redirect('/');
  }

  return <UsersClient userRole={userRole} />;
}
