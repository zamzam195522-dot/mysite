import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, getSessionUser, isAdmin } from './src/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  // Debug: Log all API requests
  if (pathname.startsWith('/api/')) {
    console.log(`Middleware: ${request.method} ${pathname}`);
    console.log('Middleware: Has session cookie:', !!sessionCookie?.value);
  }

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
    console.log('Middleware: Allowing auth endpoint:', pathname);
    return NextResponse.next();
  }

  // Allow debug endpoints for troubleshooting.
  if (pathname.startsWith('/api/debug/')) {
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

    // Additional check for admin-only endpoints
    const adminOnlyEndpoints = [
      '/api/employees',
      '/api/products',
      '/api/product-categories',
      '/api/vendors',
      '/api/vendor-purchases',
      '/api/vendor-payments',
      '/api/expense-heads',
      '/api/expenses',
      '/api/areas',
      '/api/banks',
      '/api/employee-areas',
      '/api/stock',
      '/api/reports',
    ];

    const isAdminEndpoint = adminOnlyEndpoints.some(endpoint => pathname.startsWith(endpoint));

    if (isAdminEndpoint) {
      const user = await getSessionUser(request);
      if (!user || !isAdmin(user)) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Admin access required' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    }

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

  // Protect all other app pages.
  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if session is valid
  const user = await getSessionUser(request);
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('session', 'expired');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

