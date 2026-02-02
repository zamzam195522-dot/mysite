import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        user: null,
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      user,
    },
    { status: 200 },
  );
}

