import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { createHash } from 'crypto';
import { attachSessionCookie, createSessionPayload } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type RegisterRequest = {
  username?: string;
  password?: string;
};

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  let body: RegisterRequest;
  try {
    body = (await request.json()) as RegisterRequest;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const username = (body.username ?? '').trim();
  const password = body.password ?? '';

  if (!username || !password) {
    return NextResponse.json(
      { success: false, message: 'Username and password are required' },
      { status: 400 },
    );
  }

  if (username.length < 3) {
    return NextResponse.json(
      { success: false, message: 'Username must be at least 3 characters' },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { success: false, message: 'Password must be at least 6 characters' },
      { status: 400 },
    );
  }

  const pool = getDbPool();
  const passwordHash = hashPassword(password);

  try {
    const result = await pool.query(
      `
      INSERT INTO users (username, password_hash, status)
      VALUES ($1, $2, 'ACTIVE')
      RETURNING id, username
      `,
      [username, passwordHash],
    );

    const user = result.rows[0] as { id: number; username: string };

    const response = NextResponse.json({
      success: true,
      user: {
        id: Number(user.id),
        username: user.username,
      },
    });

    return attachSessionCookie(
      response,
      createSessionPayload({ id: Number(user.id), username: user.username }),
    );
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr?.code === '23505') {
      return NextResponse.json(
        { success: false, message: 'Username already exists' },
        { status: 409 },
      );
    }
    throw err;
  }
}
