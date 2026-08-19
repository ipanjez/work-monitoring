import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkServerPermission } from '@/lib/serverPermissions';

const prisma = new PrismaClient();

// PUT /api/users/reset-requests/[id] — approve or reject
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any)?.role || '';
  const isAllowed = await checkServerPermission('user_management', userRole);
  if (!isAllowed) {
    return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk memproses reset password.' }, { status: 403 });
  }

  const body = await request.json();
  const { action, newPassword, note } = body; // action: 'APPROVE' | 'REJECT'

  const resetReq = await prisma.passwordResetRequest.findUnique({
    where: { id: parseInt(id) },
    include: { user: true },
  });

  if (!resetReq) {
    return NextResponse.json({ error: 'Permintaan tidak ditemukan.' }, { status: 404 });
  }

  if (action === 'APPROVE') {
    let hashed = resetReq.requestedPassword;

    // If the admin provided a manual override
    if (newPassword && newPassword.trim() !== '') {
      hashed = await bcrypt.hash(newPassword, 10);
    }

    if (!hashed) {
      return NextResponse.json({ error: 'Password baru tidak ditemukan.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: resetReq.userId },
      data: { password: hashed },
    });

    await prisma.passwordResetRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'APPROVED', note: note || null },
    });

    await prisma.activityLog.create({
      data: {
        action: 'APPROVE_RESET',
        title: 'Reset Password Disetujui',
        message: `Admin ${(session.user as any)?.name} menyetujui reset password ${resetReq.user.name} (${resetReq.user.npk})`,
        type: 'success',
        userId: (session.user as any)?.id,
        userName: session.user?.name || '',
      },
    });

    return NextResponse.json({ success: true, message: 'Password berhasil direset.' });
  }

  if (action === 'REJECT') {
    await prisma.passwordResetRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'REJECTED', note: note || null },
    });

    await prisma.activityLog.create({
      data: {
        action: 'REJECT_RESET',
        title: 'Reset Password Ditolak',
        message: `Admin ${(session.user as any)?.name} menolak reset password ${resetReq.user.name} (${resetReq.user.npk})`,
        type: 'warning',
        userId: (session.user as any)?.id,
        userName: session.user?.name || '',
      },
    });

    return NextResponse.json({ success: true, message: 'Permintaan ditolak.' });
  }

  return NextResponse.json({ error: 'Action tidak valid.' }, { status: 400 });
}
