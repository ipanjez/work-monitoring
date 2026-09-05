import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { checkServerPermission } from '@/lib/serverPermissions';
import { checkRateLimitAsync, recordFailedAttemptAsync } from '@/lib/rateLimit';
import { sanitizeLoginIdentifier } from '@/lib/security';

// GET /api/users/reset-requests — list all requests (ADMIN) OR check request status (public for NPK)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const npk = searchParams.get('npk');

  // If NPK is provided, it's a public status check for a user
  if (npk) {
    // IP Rate Limit check against brute-force enumeration
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');
    const getRateKey = `reset_status_ip:${clientIp}`;
    const getRateCheck = await checkRateLimitAsync(getRateKey, 30, 300000, 600000);
    if (getRateCheck.isBlocked) {
      return NextResponse.json({
        error: `Terlalu banyak permintaan. Silakan tunggu ${Math.ceil((getRateCheck.waitTimeSeconds || 600) / 60)} menit lagi.`
      }, { status: 429 });
    }
    await recordFailedAttemptAsync(getRateKey, 30, 300000, 600000);

    const cleanNpk = sanitizeLoginIdentifier(npk);
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { npk: cleanNpk },
          { npk: cleanNpk.toLowerCase() },
          { npk: cleanNpk.toUpperCase() }
        ]
      },
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
  // Rate Limit per IP
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');
  const postRateKey = `reset_post_ip:${clientIp}`;
  const postRateCheck = await checkRateLimitAsync(postRateKey, 10, 900000, 900000);
  if (postRateCheck.isBlocked) {
    return NextResponse.json({
      error: `Terlalu banyak permintaan reset password dari IP ini. Silakan coba lagi dalam ${Math.ceil((postRateCheck.waitTimeSeconds || 900) / 60)} menit.`
    }, { status: 429 });
  }

  const body = await request.json();
  const { npk, newPassword } = body;

  if (!npk || !npk.trim()) {
    return NextResponse.json({ error: 'NPK wajib diisi.' }, { status: 400 });
  }

  if (!newPassword || newPassword.trim().length < 6) {
    return NextResponse.json({ error: 'Password baru wajib diisi minimal 6 karakter.' }, { status: 400 });
  }

  const cleanNpk = sanitizeLoginIdentifier(npk);
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { npk: cleanNpk },
        { npk: cleanNpk.toLowerCase() },
        { npk: cleanNpk.toUpperCase() }
      ]
    }
  });
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

  await recordFailedAttemptAsync(postRateKey, 10, 900000, 900000);

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
