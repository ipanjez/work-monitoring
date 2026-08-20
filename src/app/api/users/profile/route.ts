import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/users/profile — get logged-in user profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const userNpk = (session.user as any).npk;
  const userEmail = session.user.email;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(userId ? [{ id: userId }] : []),
        ...(userNpk ? [{ npk: userNpk }] : []),
        ...(userEmail ? [{ email: userEmail }] : []),
      ]
    },
    select: {
      id: true,
      npk: true,
      name: true,
      email: true,
      role: true,
      image: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PUT /api/users/profile — update logged-in user profile
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const userNpk = (session.user as any).npk;
  const userEmail = session.user.email;
  const body = await request.json();
  const { name, email, currentPassword, newPassword, image, role } = body;

  // Find user
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(userId ? [{ id: userId }] : []),
        ...(userNpk ? [{ npk: userNpk }] : []),
        ...(userEmail ? [{ email: userEmail }] : []),
      ]
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email || null;
  if (role !== undefined) updateData.role = role;
  if (image !== undefined) updateData.image = image;

  // If changing password
  if (newPassword && newPassword.trim() !== '') {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Password saat ini wajib diisi untuk mengubah password' }, { status: 400 });
    }
    const isValid = await bcrypt.compare(currentPassword, user.password || '');
    if (!isValid) {
      return NextResponse.json({ error: 'Password saat ini salah' }, { status: 400 });
    }
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
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

    // If name changed, remove the old name mapping
    if (user.name && user.name !== updatedUser.name) {
      delete avatars[user.name];
    }

    // Update avatar image mapping
    if (updatedUser.image) {
      avatars[updatedUser.name || ''] = updatedUser.image;
    } else {
      delete avatars[updatedUser.name || ''];
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
      if (user.name && pics.includes(user.name)) {
        pics = pics.map(p => p === user.name ? (updatedUser.name || '') : p);
      } else if (updatedUser.name && !pics.includes(updatedUser.name)) {
        pics.push(updatedUser.name);
      }
      await prisma.appSetting.update({
        where: { key: 'master_pics' },
        data: { value: JSON.stringify(pics) }
      });
    }
  } catch (syncErr) {
    console.error('Failed to sync profile change with master settings:', syncErr);
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: 'EDIT_USER',
      title: 'Update Profil Mandiri',
      message: `User ${updatedUser.name} (${updatedUser.npk}) memperbarui profil mandiri`,
      type: 'info',
      userId: updatedUser.id,
      userName: updatedUser.name || '',
    },
  });

  return NextResponse.json({
    success: true,
    user: {
      id: updatedUser.id,
      npk: updatedUser.npk,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
    }
  });
}
