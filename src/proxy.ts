import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/api/auth/login', '/api/auth/logout', '/api/webhooks'];
const ignoredPaths = ['/_next', '/favicon.ico'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files
  if (ignoredPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow public paths
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check auth cookie
  const authCookie = request.cookies.get('founter-auth');
  if (!authCookie || authCookie.value !== 'authenticated') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
