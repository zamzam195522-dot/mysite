import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    jwtSecretExists: !!process.env.JWT_SECRET,
    jwtSecretLength: process.env.JWT_SECRET?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
