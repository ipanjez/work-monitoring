import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, favicon, calendar exports, and auth endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/calendar') ||
    pathname === '/calendar.ics'
  ) {
    return NextResponse.next();
  }

  // Get NextAuth session token
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'dept-monitor-secret-key-12345',
  });

  // If not logged in and trying to access app pages/APIs
  if (!session && pathname !== '/auth/signin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // If already logged in and trying to access signin page
  if (session && pathname === '/auth/signin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}
