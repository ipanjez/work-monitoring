import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { npk, name, email, password, role } = body;

    if (!npk || !name || !password) {
      return NextResponse.json({ error: 'NPK, Nama, dan Password wajib diisi.' }, { status: 400 });
    }

    const npkTrimmed = npk.trim();
    const nameTrimmed = name.trim();

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal harus 6 karakter.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { npk: npkTrimmed } });
    if (existing) {
      return NextResponse.json({ error: 'NPK sudah terdaftar.' }, { status: 409 });
    }

    if (email && email.trim()) {
      const existingEmail = await prisma.user.findUnique({ where: { email: email.trim() } });
      if (existingEmail) {
        return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });
      }
    }

    const assignedRole = role && role !== 'ADMIN' ? role : 'MEMBER';

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        npk: npkTrimmed,
        name: nameTrimmed,
        password: hashed,
        email: email && email.trim() ? email.trim() : null,
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
