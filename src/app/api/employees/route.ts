import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { createHash } from 'crypto';
import { getSessionUser, requireAdmin } from '@/lib/auth';

type NewEmployeeRequest = {
  name: string;
  contact?: string | null;
  designation: 'SALESMAN' | 'DRIVER' | 'OFFICE_STAFF' | 'OTHER';
  status?: 'ACTIVE' | 'INACTIVE';
  username?: string;
  password?: string;
};

function hashPassword(password: string) {
  // Minimal hash (better than plaintext). For production use bcrypt/argon2 + salt.
  return createHash('sha256').update(password).digest('hex');
}

export async function GET() {
  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT
      e.id,
      e.code,
      e.name,
      e.contact,
      e.designation,
      e.status,
      u.username AS "username"
    FROM employees e
    LEFT JOIN users u ON u.id = e.user_id
    ORDER BY e.id DESC
    `,
  );

  return NextResponse.json({ success: true, employees: result.rows });
}

export async function POST(request: Request) {
  // Check admin authorization
  const user = await getSessionUser(request as any);
  const authResult = requireAdmin(user);
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, message: authResult.error },
      { status: authResult.error === 'Unauthenticated' ? 401 : 403 }
    );
  }

  let body: Partial<NewEmployeeRequest>;
  try {
    body = (await request.json()) as Partial<NewEmployeeRequest>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (!body.name || !body.designation) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const name = String(body.name).trim();
  const contact = body.contact === undefined || body.contact === null ? null : String(body.contact).trim();
  const designation = String(body.designation).toUpperCase() as NewEmployeeRequest['designation'];
  const status = body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  if (!name) {
    return NextResponse.json({ success: false, message: 'Invalid name' }, { status: 400 });
  }
  if (!['SALESMAN', 'DRIVER', 'OFFICE_STAFF', 'OTHER'].includes(designation)) {
    return NextResponse.json({ success: false, message: 'Invalid designation' }, { status: 400 });
  }

  const usernameRaw = body.username?.trim() ?? '';
  const passwordRaw = body.password ?? '';
  const shouldCreateUser = Boolean(usernameRaw && passwordRaw);

  const pool = getDbPool();

  // Auto-generate employee code: EMP-001, EMP-002, ...
  const seqRes = await pool.query(`SELECT pg_get_serial_sequence('employees', 'id') AS seq`);
  const seq = String(seqRes.rows?.[0]?.seq ?? '').trim();
  if (!seq) {
    return NextResponse.json({ success: false, message: 'Could not resolve employees id sequence' }, { status: 500 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let userId: number | null = null;
    if (shouldCreateUser) {
      const userInsert = await client.query(
        `
        INSERT INTO users (username, password_hash, status)
        VALUES ($1, $2, $3)
        RETURNING id, username
        `,
        [usernameRaw, hashPassword(passwordRaw), status],
      );
      userId = Number(userInsert.rows[0].id);
    }

    const empInsert = await client.query(
      `
      WITH nid AS (
        SELECT nextval($1::regclass) AS id
      )
      INSERT INTO employees (id, code, name, contact, designation, status, user_id)
      SELECT
        nid.id,
        ('EMP-' || lpad(nid.id::text, 3, '0')) AS code,
        $2,
        $3,
        $4,
        $5,
        $6
      FROM nid
      RETURNING id, code, name, contact, designation, status, user_id
      `,
      [seq, name, contact, designation, status, userId],
    );

    await client.query('COMMIT');

    return NextResponse.json({ success: true, employee: empInsert.rows[0] });
  } catch (e: any) {
    await client.query('ROLLBACK');
    return NextResponse.json(
      { success: false, message: e?.message ? String(e.message) : 'Failed to create employee' },
      { status: 400 },
    );
  } finally {
    client.release();
  }
}

