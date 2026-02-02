import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from './src/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  // Always allow Next.js internals and static assets.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Allow auth endpoints without a session.
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Login and Register pages: redirect to dashboard if already logged in.
  if (pathname === '/login' || pathname === '/register') {
    if (sessionCookie?.value) {
      const url = new URL('/dashboard', request.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Protect all other API routes.
  if (pathname.startsWith('/api/')) {
    if (!sessionCookie?.value) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthenticated' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
    return NextResponse.next();
  }

  // Protect all other app pages.
  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

