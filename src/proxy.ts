import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Izinkan akses ke file statis dan public
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/calendar') ||
    pathname === '/calendar.ics'
  ) {
    return NextResponse.next();
  }

  // Jika belum login dan mencoba mengakses selain halaman login
  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika sudah login dan mencoba mengakses halaman login
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}
