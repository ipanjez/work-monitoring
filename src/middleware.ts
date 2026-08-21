import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, favicon, calendar exports, auth, settings, and reset requests (for forgot password page)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/icon.svg' ||
    pathname === '/api/favicon' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/calendar') ||
    pathname.startsWith('/api/settings') ||
    pathname.startsWith('/api/database') ||
    pathname === '/api/users/reset-requests' ||
    pathname === '/calendar.ics'
  ) {
    return NextResponse.next();
  }

  // Get NextAuth session token
  const isHttps = request.nextUrl.protocol === 'https:';
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'dept-monitor-secret-key-12345',
    secureCookie: isHttps,
  });

  // If not logged in
  if (!session && pathname !== '/auth/signin' && pathname !== '/auth/forgot' && pathname !== '/auth/signup') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // If already logged in and trying to access signin/signup page
  if (session && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}
