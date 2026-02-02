import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true });
  return clearSessionCookie(response);
}

