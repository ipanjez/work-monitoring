import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkServerPermission } from '@/lib/serverPermissions';

const prisma = new PrismaClient();

// PUT /api/users/[id] — edit user
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any)?.role || 'VIEWER';
  const isAllowed = await checkServerPermission('user_management', userRole);
  if (!isAllowed) {
    return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk mengedit user.' }, { status: 403 });
  }

  const body = await request.json();
  const { name, npk, role, status, password, email } = body;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (npk !== undefined) updateData.npk = npk;
  if (role !== undefined) updateData.role = role;
  if (status !== undefined) updateData.status = status;
  if (email !== undefined) updateData.email = email || null;
  if (password && password.trim() !== '') {
    updateData.password = await bcrypt.hash(password, 10);
  }

  // Find original user for sync check
  const originalUser = await prisma.user.findUnique({
    where: { id }
  });
  if (!originalUser) {
    return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  // Sync profile photo (image) and name changes to master settings (master_pic_avatars)
  try {
    const settingsRecord = await prisma.appSetting.findUnique({
      where: { key: 'master_pic_avatars' }
    });
    let avatars: Record<string, string> = {};
    if (settingsRecord && settingsRecord.value) {
      avatars = JSON.parse(settingsRecord.value);
    }

    // Sync old name mapping
    if (originalUser.name && originalUser.name !== user.name) {
      const userImage = avatars[originalUser.name] || user.image;
      delete avatars[originalUser.name];
      if (userImage) {
        avatars[user.name || ''] = userImage;
      }
    } else if (user.image) {
      avatars[user.name || ''] = user.image;
    }

    await prisma.appSetting.upsert({
      where: { key: 'master_pic_avatars' },
      update: { value: JSON.stringify(avatars) },
      create: { key: 'master_pic_avatars', value: JSON.stringify(avatars) }
    });

    // Also sync the name change in master_pics list
    const picsRecord = await prisma.appSetting.findUnique({
      where: { key: 'master_pics' }
    });
    if (picsRecord && picsRecord.value) {
      let pics: string[] = JSON.parse(picsRecord.value);
      if (originalUser.name && pics.includes(originalUser.name)) {
        pics = pics.map(p => p === originalUser.name ? (user.name || '') : p);
      } else if (user.name && !pics.includes(user.name)) {
        pics.push(user.name);
      }
      await prisma.appSetting.update({
        where: { key: 'master_pics' },
        data: { value: JSON.stringify(pics) }
      });
    }
  } catch (syncErr) {
    console.error('Failed to sync admin user update with master settings:', syncErr);
  }

  await prisma.activityLog.create({
    data: {
      action: 'EDIT_USER',
      title: 'User Diperbarui',
      message: `User ${user.name} (${user.npk}) diperbarui oleh ${(session.user as any)?.name}`,
      type: 'info',
      userId: (session.user as any)?.id,
      userName: session.user?.name || '',
    },
  });

  return NextResponse.json({ id: user.id, npk: user.npk, name: user.name, role: user.role, status: user.status });
}

// DELETE /api/users/[id] — delete user
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: deleteId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any)?.role || 'VIEWER';
  const isAllowed = await checkServerPermission('user_management', userRole);
  if (!isAllowed) {
    return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk menghapus user.' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: deleteId } });
  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
  }

  // Prevent deleting self
  if (user.id === (session.user as any)?.id) {
    return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri.' }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: deleteId } });

  await prisma.activityLog.create({
    data: {
      action: 'DELETE_USER',
      title: 'User Dihapus',
      message: `User ${user.name} (${user.npk}) dihapus oleh ${(session.user as any)?.name}`,
      type: 'warning',
      userId: (session.user as any)?.id,
      userName: session.user?.name || '',
    },
  });

  return NextResponse.json({ success: true });
}
