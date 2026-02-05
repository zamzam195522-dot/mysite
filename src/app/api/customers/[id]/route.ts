import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { createHash } from 'crypto';

type Params = { id: string };

type UpdateCustomerRequest = {
  name?: string;
  contact?: string | null;
  address?: string | null;
  areaId?: number | string | null;
  deliveryDays?: string | null;
  requiredBottles?: number;
  openingBalance?: number;
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
      c.id,
      c.code,
      c.name,
      c.contact,
      c.address,
      c.area_id AS "areaId",
      a.name AS "areaName",
      c.delivery_days AS "deliveryDays",
      c.required_bottles AS "requiredBottles",
      c.opening_balance AS "openingBalance",
      c.status,
      cc.username AS "username"
    FROM customers c
    LEFT JOIN areas a ON a.id = c.area_id
    LEFT JOIN customer_credentials cc ON cc.customer_id = c.id
    WHERE c.id = $1
    LIMIT 1
    `,
    [id],
  );

  const customer = result.rows[0];
  if (!customer) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, customer });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  let body: UpdateCustomerRequest;
  try {
    body = (await request.json()) as UpdateCustomerRequest;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  if (name !== undefined && !name) {
    return NextResponse.json({ success: false, message: 'Invalid name' }, { status: 400 });
  }

  const contact = body.contact === undefined ? undefined : body.contact === null ? null : String(body.contact).trim();
  const address = body.address === undefined ? undefined : body.address === null ? null : String(body.address).trim();
  const deliveryDays =
    body.deliveryDays === undefined ? undefined : body.deliveryDays === null ? null : String(body.deliveryDays).trim();

  const areaId =
    body.areaId === undefined
      ? undefined
      : body.areaId === null || body.areaId === ''
        ? null
        : Number(body.areaId);
  if (areaId !== undefined && areaId !== null && !Number.isInteger(areaId)) {
    return NextResponse.json({ success: false, message: 'Invalid areaId' }, { status: 400 });
  }

  const requiredBottles = body.requiredBottles === undefined ? undefined : Number(body.requiredBottles);
  if (requiredBottles !== undefined && (!Number.isFinite(requiredBottles) || requiredBottles < 0)) {
    return NextResponse.json({ success: false, message: 'Invalid requiredBottles' }, { status: 400 });
  }

  const openingBalance = body.openingBalance === undefined ? undefined : Number(body.openingBalance);
  if (openingBalance !== undefined && !Number.isFinite(openingBalance)) {
    return NextResponse.json({ success: false, message: 'Invalid openingBalance' }, { status: 400 });
  }

  const status = body.status === undefined ? undefined : body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  const usernameRaw = body.username?.trim() ?? '';
  const passwordRaw = body.password ?? '';
  const wantsCreds = body.username !== undefined || body.password !== undefined;

  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const exists = await client.query(`SELECT id FROM customers WHERE id = $1 LIMIT 1`, [id]);
    if (exists.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
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
    if (address !== undefined) {
      fields.push(`address = $${idx++}`);
      values.push(address);
    }
    if (areaId !== undefined) {
      fields.push(`area_id = $${idx++}`);
      values.push(areaId);
    }
    if (deliveryDays !== undefined) {
      fields.push(`delivery_days = $${idx++}`);
      values.push(deliveryDays);
    }
    if (requiredBottles !== undefined) {
      fields.push(`required_bottles = $${idx++}`);
      values.push(Math.floor(requiredBottles));
    }
    if (openingBalance !== undefined) {
      fields.push(`opening_balance = $${idx++}`);
      values.push(openingBalance);
    }
    if (status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }

    if (fields.length > 0) {
      values.push(id);
      await client.query(`UPDATE customers SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    }

    if (wantsCreds && usernameRaw && passwordRaw) {
      await client.query(
        `
        INSERT INTO customer_credentials (customer_id, username, password_hash)
        VALUES ($1, $2, $3)
        ON CONFLICT (customer_id)
        DO UPDATE SET username = EXCLUDED.username, password_hash = EXCLUDED.password_hash
        `,
        [id, usernameRaw, hashPassword(passwordRaw)],
      );
    }

    await client.query('COMMIT');

    const updated = await pool.query(
      `
      SELECT
        c.id,
        c.code,
        c.name,
        c.contact,
        c.address,
        c.area_id AS "areaId",
        a.name AS "areaName",
        c.delivery_days AS "deliveryDays",
        c.required_bottles AS "requiredBottles",
        c.opening_balance AS "openingBalance",
        c.status,
        cc.username AS "username"
      FROM customers c
      LEFT JOIN areas a ON a.id = c.area_id
      LEFT JOIN customer_credentials cc ON cc.customer_id = c.id
      WHERE c.id = $1
      LIMIT 1
      `,
      [id],
    );

    return NextResponse.json({ success: true, customer: updated.rows[0] });
  } catch (e: any) {
    await client.query('ROLLBACK');
    return NextResponse.json(
      { success: false, message: e?.message ? String(e.message) : 'Failed to update customer' },
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

  // Deactivate rather than delete
  const pool = getDbPool();
  const result = await pool.query(`UPDATE customers SET status = 'INACTIVE' WHERE id = $1 RETURNING id`, [id]);
  if (result.rowCount === 0) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}

