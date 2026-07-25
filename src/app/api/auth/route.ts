import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const GLOBAL_PASSWORD = process.env.GLOBAL_PASSWORD || 'rahasia123'; // In production, set this in .env
const HASHED_PASSWORD = bcrypt.hashSync(GLOBAL_PASSWORD, 10);


const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    
    let activeHashedPassword = HASHED_PASSWORD;
    const dbGlobalPassword = await prisma.appSetting.findUnique({ where: { key: 'global_password' } });
    if (dbGlobalPassword && dbGlobalPassword.value) {
      activeHashedPassword = dbGlobalPassword.value;
    }
    
    const isValid = bcrypt.compareSync(password, activeHashedPassword);
    
    if (isValid) {

      const cookieStore = await cookies();
      // Set an auth cookie
      cookieStore.set('auth_token', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Password salah' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  return NextResponse.json({ success: true });
}
