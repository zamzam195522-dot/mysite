import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  // Check environment variables
  const envInfo = {
    jwtSecretExists: !!process.env.JWT_SECRET,
    jwtSecretLength: process.env.JWT_SECRET?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };

  // Check session cookie
  const sessionCookie = request.headers.get('cookie')?.includes('water_session=');

  // Try to get session user
  let sessionUser = null;
  let sessionError = null;
  try {
    sessionUser = await getSessionUser(request as any);
  } catch (error) {
    sessionError = error instanceof Error ? error.message : 'Unknown error';
  }

  return NextResponse.json({
    environment: envInfo,
    session: {
      hasCookie: sessionCookie,
      user: sessionUser,
      error: sessionError
    }
  });
}
