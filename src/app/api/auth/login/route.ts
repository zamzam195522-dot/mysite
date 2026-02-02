import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { createHash } from 'crypto';
import { attachSessionCookie, createSessionPayload } from '@/lib/auth';

type LoginRequest = {
  username?: string;
  password?: string;
};

function hashPassword(password: string) {
  // Must match the hashing logic used when creating users/employees.
  return createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
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

  const candidateHash = hashPassword(password);
  if (user.password_hash !== candidateHash) {
    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  }

  const response = NextResponse.json({
    success: true,
    user: {
      id: Number(user.id),
      username: user.username,
    },
  });

  return attachSessionCookie(
    response,
    createSessionPayload({ id: Number(user.id), username: user.username, roles: user.roles }),
  );
}

