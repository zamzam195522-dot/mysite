import { NextRequest, NextResponse } from 'next/server';

export const SESSION_COOKIE_NAME = 'water_session';

export type SessionUser = {
  id: number;
  username: string;
  roles: string[];
};

type SessionPayload = {
  userId: number;
  username: string;
  roles: string[];
  issuedAt: number;
};

export function createSessionPayload(user: SessionUser): SessionPayload {
  return {
    userId: user.id,
    username: user.username,
    roles: user.roles,
    issuedAt: Date.now(),
  };
}

export function attachSessionCookie(
  response: NextResponse,
  payload: SessionPayload,
): NextResponse {
  // Minimal JSON cookie; for production you should sign & encrypt this value.
  response.cookies.set(SESSION_COOKIE_NAME, JSON.stringify(payload), {
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

export function getSessionUser(request: NextRequest): SessionUser | null {
  const raw = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionPayload;
    if (!parsed || typeof parsed.userId !== 'number' || !parsed.username || !Array.isArray(parsed.roles)) return null;

    // Check if session has expired (8 hours = 8 * 60 * 60 * 1000 milliseconds)
    const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const currentTime = Date.now();
    const sessionAge = currentTime - parsed.issuedAt;

    if (sessionAge > sessionDuration) {
      return null; // Session expired
    }

    return { id: parsed.userId, username: parsed.username, roles: parsed.roles };
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

