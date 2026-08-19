import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { checkServerPermission } from '@/lib/serverPermissions';

const prisma = new PrismaClient();

// GET /api/users/reset-requests — list all requests (ADMIN) OR check request status (public for NPK)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const npk = searchParams.get('npk');

  // If NPK is provided, it's a public status check for a user
  if (npk) {
    const user = await prisma.user.findUnique({
      where: { npk: npk.trim() },
    });

    if (!user) {
      return NextResponse.json({ error: 'NPK tidak ditemukan.' }, { status: 404 });
    }

    // Find the latest reset request for this user
    const latestRequest = await prisma.passwordResetRequest.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestRequest) {
      return NextResponse.json({ status: 'NONE' });
    }

    return NextResponse.json({
      status: latestRequest.status,
      note: latestRequest.note,
      updatedAt: latestRequest.updatedAt,
    });
  }

  // Otherwise, require user_management permission session to list all requests
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any)?.role || '';
  const isAllowed = await checkServerPermission('user_management', userRole);
  if (!isAllowed) {
    return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk melihat permintaan reset password.' }, { status: 403 });
  }

  const requests = await prisma.passwordResetRequest.findMany({
    include: {
      user: {
        select: { npk: true, name: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(requests);
}

// POST /api/users/reset-requests — user requests reset (public — needs NPK and new desired password)
export async function POST(request: Request) {
  const body = await request.json();
  const { npk, newPassword } = body;

  if (!npk) {
    return NextResponse.json({ error: 'NPK wajib diisi.' }, { status: 400 });
  }

  if (!newPassword || newPassword.trim().length < 6) {
    return NextResponse.json({ error: 'Password baru wajib diisi minimal 6 karakter.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { npk: npk.trim() } });
  if (!user) {
    return NextResponse.json({ error: 'NPK tidak ditemukan.' }, { status: 404 });
  }

  // Check if there's already a pending request
  const existing = await prisma.passwordResetRequest.findFirst({
    where: { userId: user.id, status: 'PENDING' },
  });

  if (existing) {
    return NextResponse.json({ message: 'Permintaan reset password sudah ada. Tunggu persetujuan Admin.' });
  }

  // Hash the desired new password to store securely
  const hashedRequestedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.passwordResetRequest.create({
    data: { 
      userId: user.id,
      requestedPassword: hashedRequestedPassword,
      status: 'PENDING'
    },
  });

  await prisma.activityLog.create({
    data: {
      action: 'RESET_REQUEST',
      title: 'Permintaan Reset Password',
      message: `${user.name} (${user.npk}) mengajukan permintaan reset password baru`,
      type: 'warning',
      userId: user.id,
      userName: user.name || user.npk,
    },
  });

  return NextResponse.json({ success: true, message: 'Permintaan terkirim.' });
}
