import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkServerPermission } from '@/lib/serverPermissions';

const prisma = new PrismaClient();

// GET /api/users — list all users
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any)?.role || '';
  const isAllowed = await checkServerPermission('user_management', userRole);
  if (!isAllowed) {
    return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk melihat daftar user.' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      npk: true,
      name: true,
      email: true,
      role: true,
      status: true,
      image: true,
    },
    orderBy: { npk: 'asc' },
  });

  return NextResponse.json(users);
}

// POST /api/users — create new user
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any)?.role || '';
  const isAllowed = await checkServerPermission('user_management', userRole);
  if (!isAllowed) {
    return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk menambah user.' }, { status: 403 });
  }

  const body = await request.json();
  const { npk, name, role, password, email } = body;

  if (!npk || !name || !role || !password) {
    return NextResponse.json({ error: 'NPK, Nama, Role, dan Password wajib diisi.' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { npk } });
  if (existing) {
    return NextResponse.json({ error: 'NPK sudah terdaftar.' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      npk,
      name,
      role,
      password: hashed,
      email: email || null,
      status: 'ACTIVE',
    },
  });

  // Log
  await prisma.activityLog.create({
    data: {
      action: 'CREATE_USER',
      title: 'User Dibuat',
      message: `User ${name} (${npk}) ditambahkan oleh ${(session.user as any)?.name}`,
      type: 'info',
      userId: (session.user as any)?.id,
      userName: session.user?.name || '',
    },
  });

  return NextResponse.json({ id: user.id, npk: user.npk, name: user.name, role: user.role, status: user.status }, { status: 201 });
}
