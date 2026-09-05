import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { checkRateLimitAsync, recordFailedAttemptAsync } from '@/lib/rateLimit';
import { sanitizeLoginIdentifier, sanitizeInput } from '@/lib/security';

export async function POST(request: Request) {
  try {
    // 1. IP Rate Limiting (anti-DDoS & anti-spam account creation)
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');
    const rateKey = `signup_ip:${clientIp}`;
    const rateCheck = await checkRateLimitAsync(rateKey, 5, 1800000, 1800000); // 5 signups per 30 mins
    if (rateCheck.isBlocked) {
      return NextResponse.json({
        error: `Terlalu banyak pendaftaran dari alamat IP Anda. Silakan coba lagi dalam ${rateCheck.waitTimeSeconds || 1800} detik.`
      }, { status: 429 });
    }

    const body = await request.json();
    const { npk, name, email, password } = body;

    if (!npk || !name || !password) {
      return NextResponse.json({ error: 'NPK, Nama, dan Password wajib diisi.' }, { status: 400 });
    }

    const npkTrimmed = sanitizeLoginIdentifier(npk);
    const nameTrimmed = sanitizeInput(name);

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal harus 6 karakter.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { npk: npkTrimmed } });
    if (existing) {
      return NextResponse.json({ error: 'NPK sudah terdaftar.' }, { status: 409 });
    }

    let cleanEmail: string | null = null;
    if (email && email.trim()) {
      cleanEmail = sanitizeLoginIdentifier(email);
      const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (existingEmail) {
        return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });
      }
    }

    // SECURITY: Self-registering users MUST ALWAYS get default MEMBER role (least privilege).
    // Privilege elevation is strictly restricted to authenticated Administrators.
    const assignedRole = 'MEMBER';

    // Record attempt towards rate limiter
    await recordFailedAttemptAsync(rateKey, 5, 1800000, 1800000);

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        npk: npkTrimmed,
        name: nameTrimmed,
        password: hashed,
        email: cleanEmail,
        role: assignedRole,
        status: 'PENDING',
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'REGISTER_USER',
        title: 'Registrasi User Baru',
        message: `User baru ${nameTrimmed} (${npkTrimmed}) mendaftar secara mandiri.`,
        type: 'info',
        userId: user.id,
        userName: user.name || user.npk,
      },
    });

    return NextResponse.json({
      id: user.id,
      npk: user.npk,
      name: user.name,
      role: user.role,
      status: user.status
    }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
