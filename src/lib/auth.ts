import { NextRequest, NextResponse } from 'next/server';

export const SESSION_COOKIE_NAME = 'water_session';

export type SessionUser = {
  id: number;
  username: string;
};

type SessionPayload = {
  userId: number;
  username: string;
  issuedAt: number;
};

export function createSessionPayload(user: SessionUser): SessionPayload {
  return {
    userId: user.id,
    username: user.username,
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
    if (!parsed || typeof parsed.userId !== 'number' || !parsed.username) return null;

    // Check if session has expired (8 hours = 8 * 60 * 60 * 1000 milliseconds)
    const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const currentTime = Date.now();
    const sessionAge = currentTime - parsed.issuedAt;

    if (sessionAge > sessionDuration) {
      return null; // Session expired
    }

    return { id: parsed.userId, username: parsed.username };
  } catch {
    return null;
  }
}

