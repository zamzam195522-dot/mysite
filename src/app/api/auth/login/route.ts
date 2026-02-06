import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { getDbPool } from '@/lib/db';
import { createSessionToken, attachSessionCookie } from '@/lib/auth';

type LoginRequest = {
  username?: string;
  password?: string;
};

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  console.log('verifyPassword: Hash length:', hash.length);
  console.log('verifyPassword: Hash starts with:', hash.substring(0, 10));

  // Try bcrypt first (new method)
  if (hash.length > 50 && hash.startsWith('$2')) {
    console.log('verifyPassword: Using bcrypt verification');
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.log('verifyPassword: Bcrypt verification failed:', error);
      return false;
    }
  }

  // Fallback to SHA256 (old method)
  console.log('verifyPassword: Using SHA256 verification');
  const oldHash = createHash('sha256').update(password).digest('hex');
  const isMatch = oldHash === hash;
  console.log('verifyPassword: SHA256 match:', isMatch);
  return isMatch;
}

export async function POST(request: NextRequest) {
  // Debug: Check JWT_SECRET
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);

  let body: LoginRequest;
  try {
    body = (await request.json()) as LoginRequest;
    console.log('Login: Request body parsed successfully');
  } catch (error) {
    console.log('Login: Failed to parse request body:', error);
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const username = (body.username ?? '').trim();
  const password = body.password ?? '';

  console.log('Login: Username:', username);
  console.log('Login: Password provided:', !!password);

  if (!username || !password) {
    console.log('Login: Missing username or password');
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

  console.log('Login: User found:', !!user);
  if (user) {
    console.log('Login: User status:', user.status);
    console.log('Login: User roles:', user.roles);
  }

  if (!user || user.status !== 'ACTIVE') {
    console.log('Login: Invalid credentials - user not found or inactive');
    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  }

  console.log('Login: Verifying password...');
  const passwordMatch = await verifyPassword(password, user.password_hash);
  console.log('Login: Password match:', passwordMatch);
  if (!passwordMatch) {
    console.log('Login: Invalid credentials - password mismatch');
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

