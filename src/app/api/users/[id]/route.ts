import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// PUT /api/users/[id] — edit user (ADMIN only)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

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

// DELETE /api/users/[id] — delete user (ADMIN only)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: deleteId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
