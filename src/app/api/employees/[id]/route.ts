import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { createHash } from 'crypto';

type Params = { id: string };

type UpdateEmployeeRequest = {
  name?: string;
  contact?: string | null;
  designation?: 'SALESMAN' | 'DRIVER' | 'OFFICE_STAFF' | 'OTHER';
  status?: 'ACTIVE' | 'INACTIVE';
  username?: string;
  password?: string;
};

function parseId(params: Params) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

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
      e.user_id AS "userId",
      u.username AS "username"
    FROM employees e
    LEFT JOIN users u ON u.id = e.user_id
    WHERE e.id = $1
    LIMIT 1
    `,
    [id],
  );

  const employee = result.rows[0];
  if (!employee) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, employee });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  let body: UpdateEmployeeRequest;
  try {
    body = (await request.json()) as UpdateEmployeeRequest;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const contact = body.contact === undefined ? undefined : body.contact === null ? null : String(body.contact).trim();
  const designation =
    body.designation === undefined
      ? undefined
      : (String(body.designation).toUpperCase() as UpdateEmployeeRequest['designation']);
  const status = body.status === undefined ? undefined : body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  if (name !== undefined && !name) {
    return NextResponse.json({ success: false, message: 'Invalid name' }, { status: 400 });
  }
  if (designation !== undefined && !['SALESMAN', 'DRIVER', 'OFFICE_STAFF', 'OTHER'].includes(designation)) {
    return NextResponse.json({ success: false, message: 'Invalid designation' }, { status: 400 });
  }

  const usernameRaw = body.username?.trim() ?? '';
  const passwordRaw = body.password ?? '';
  const wantsUserChange = body.username !== undefined || body.password !== undefined;

  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(`SELECT id, user_id FROM employees WHERE id = $1 LIMIT 1`, [id]);
    const row = existing.rows[0];
    if (!row) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    let userId: number | null = row.user_id ? Number(row.user_id) : null;

    if (wantsUserChange) {
      // If setting credentials and there's no user, create one. If user exists, update it.
      if (usernameRaw && passwordRaw) {
        if (!userId) {
          const ins = await client.query(
            `INSERT INTO users (username, password_hash, status) VALUES ($1, $2, $3) RETURNING id`,
            [usernameRaw, hashPassword(passwordRaw), status ?? 'ACTIVE'],
          );
          userId = Number(ins.rows[0].id);
        } else {
          await client.query(
            `
            UPDATE users
            SET username = $1, password_hash = $2, status = $3
            WHERE id = $4
            `,
            [usernameRaw, hashPassword(passwordRaw), status ?? 'ACTIVE', userId],
          );
        }
      }
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (contact !== undefined) {
      fields.push(`contact = $${idx++}`);
      values.push(contact);
    }
    if (designation !== undefined) {
      fields.push(`designation = $${idx++}`);
      values.push(designation);
    }
    if (status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }
    if (userId !== null) {
      fields.push(`user_id = $${idx++}`);
      values.push(userId);
    }

    if (fields.length > 0) {
      values.push(id);
      await client.query(`UPDATE employees SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    }

    await client.query('COMMIT');

    const updated = await pool.query(
      `
      SELECT
        e.id,
        e.code,
        e.name,
        e.contact,
        e.designation,
        e.status,
        e.user_id AS "userId",
        u.username AS "username"
      FROM employees e
      LEFT JOIN users u ON u.id = e.user_id
      WHERE e.id = $1
      LIMIT 1
      `,
      [id],
    );

    return NextResponse.json({ success: true, employee: updated.rows[0] });
  } catch (e: any) {
    await client.query('ROLLBACK');
    return NextResponse.json(
      { success: false, message: e?.message ? String(e.message) : 'Failed to update employee' },
      { status: 400 },
    );
  } finally {
    client.release();
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  // Deactivate rather than delete (references from invoices etc.)
  const pool = getDbPool();
  const result = await pool.query(`UPDATE employees SET status = 'INACTIVE' WHERE id = $1 RETURNING id`, [id]);
  if (result.rowCount === 0) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}

