import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE_NAME = 'water_session';

// JWT secret key - should be stored in environment variables
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export type SessionUser = {
  id: number;
  username: string;
  roles: string[];
};

type JWTPayload = {
  userId: number;
  username: string;
  roles: string[];
  issuedAt: number;
  exp: number;
};

export async function createSessionToken(user: SessionUser): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (8 * 60 * 60); // 8 hours expiration

  return await new SignJWT({
    userId: user.id,
    username: user.username,
    roles: user.roles,
    issuedAt: now * 1000, // Keep milliseconds for compatibility
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(JWT_SECRET);
}

export function attachSessionCookie(
  response: NextResponse,
  token: string,
): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const jwtPayload = payload as JWTPayload;

    if (!jwtPayload || typeof jwtPayload.userId !== 'number' || !jwtPayload.username || !Array.isArray(jwtPayload.roles)) {
      return null;
    }

    return {
      id: jwtPayload.userId,
      username: jwtPayload.username,
      roles: jwtPayload.roles
    };
  } catch {
    return null;
  }
}

// Authorization helper functions
export function hasRole(user: SessionUser | null, role: string): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}

export function isAdmin(user: SessionUser | null): boolean {
  return hasRole(user, 'admin');
}

export function requireAdmin(user: SessionUser | null): { authorized: true } | { authorized: false; error: string } {
  if (!user) {
    return { authorized: false, error: 'Unauthenticated' };
  }
  if (!isAdmin(user)) {
    return { authorized: false, error: 'Admin access required' };
  }
  return { authorized: true };
}

