import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { attachSessionCookie, createSessionToken } from '@/lib/auth';

type LoginRequest = {
  username?: string;
  password?: string;
};

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function POST(request: NextRequest) {
  // Debug: Check JWT_SECRET
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);

  let body: LoginRequest;
  try {
    body = (await request.json()) as LoginRequest;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const username = (body.username ?? '').trim();
  const password = body.password ?? '';

  if (!username || !password) {
    return NextResponse.json({ success: false, message: 'Username and password are required' }, { status: 400 });
  }

  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT u.id, u.username, u.password_hash, u.status,
           COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[]) as roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.username = $1
    GROUP BY u.id, u.username, u.password_hash, u.status
    LIMIT 1
    `,
    [username],
  );

  const user = result.rows[0] as
    | {
      id: number;
      username: string;
      password_hash: string;
      status: string;
      roles: string[];
    }
    | undefined;

  if (!user || user.status !== 'ACTIVE') {
    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  }

  const passwordMatch = await verifyPassword(password, user.password_hash);
  if (!passwordMatch) {
    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  }

  const response = NextResponse.json({
    success: true,
    user: {
      id: Number(user.id),
      username: user.username,
    },
  });

  // Debug: Log token creation
  const token = await createSessionToken({ id: Number(user.id), username: user.username, roles: user.roles });
  console.log('Login: Token created successfully, length:', token.length);

  const finalResponse = attachSessionCookie(response, token);
  console.log('Login: Cookie attached to response');

  return finalResponse;
}

