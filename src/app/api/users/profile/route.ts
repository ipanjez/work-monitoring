import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/users/profile — get logged-in user profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: {
      id: true,
      npk: true,
      name: true,
      email: true,
      role: true,
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
  const body = await request.json();
  const { name, email, currentPassword, newPassword } = body;

  if (!name) {
    return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
  }

  const updateData: any = { name, email: email || null };

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
    where: { id: userId },
    data: updateData,
  });

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
    }
  });
}
