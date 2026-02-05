import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { attachSessionCookie, createSessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type RegisterRequest = {
  username?: string;
  password?: string;
};

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
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
  const passwordHash = await hashPassword(password);

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

    // Fetch user roles for the session
    const rolesResult = await pool.query(
      `
      SELECT COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[]) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1
      GROUP BY u.id
      `,
      [user.id],
    );

    const roles = rolesResult.rows[0]?.roles || [];

    const response = NextResponse.json({
      success: true,
      user: {
        id: Number(user.id),
        username: user.username,
      },
    });

    return attachSessionCookie(
      response,
      await createSessionToken({ id: Number(user.id), username: user.username, roles }),
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
