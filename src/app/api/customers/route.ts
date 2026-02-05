import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { createHash } from 'crypto';
import { getSessionUser, requireAdmin } from '@/lib/auth';

type NewCustomerRequest = {
  name: string;
  contact?: string | null;
  address?: string | null;
  areaId?: number | string | null;
  deliveryDays?: string | null;
  requiredBottles?: number;
  openingBalance?: number;
  securityDeposit?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  username?: string;
  password?: string;
};

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

export async function GET() {
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
      c.status
    FROM customers c
    LEFT JOIN areas a ON a.id = c.area_id
    ORDER BY c.id DESC
    `,
  );
  return NextResponse.json({ success: true, customers: result.rows });
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

  let body: Partial<NewCustomerRequest>;
  try {
    body = (await request.json()) as Partial<NewCustomerRequest>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (!body.name) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const name = String(body.name).trim();
  if (!name) {
    return NextResponse.json({ success: false, message: 'Invalid name' }, { status: 400 });
  }

  const contact = body.contact === undefined || body.contact === null ? null : String(body.contact).trim();
  const address = body.address === undefined || body.address === null ? null : String(body.address).trim();
  const deliveryDays =
    body.deliveryDays === undefined || body.deliveryDays === null ? null : String(body.deliveryDays).trim();

  const areaId =
    body.areaId === undefined
      ? null
      : body.areaId === null || body.areaId === ''
        ? null
        : Number(body.areaId);
  if (areaId !== null && !Number.isInteger(areaId)) {
    return NextResponse.json({ success: false, message: 'Invalid areaId' }, { status: 400 });
  }

  const requiredBottles = body.requiredBottles === undefined ? 0 : Number(body.requiredBottles);
  if (!Number.isFinite(requiredBottles) || requiredBottles < 0) {
    return NextResponse.json({ success: false, message: 'Invalid requiredBottles' }, { status: 400 });
  }

  const openingBalance = body.openingBalance === undefined ? 0 : Number(body.openingBalance);
  if (!Number.isFinite(openingBalance)) {
    return NextResponse.json({ success: false, message: 'Invalid openingBalance' }, { status: 400 });
  }

  const securityDeposit = body.securityDeposit === undefined ? 0 : Number(body.securityDeposit);
  if (!Number.isFinite(securityDeposit) || securityDeposit < 0) {
    return NextResponse.json({ success: false, message: 'Invalid securityDeposit' }, { status: 400 });
  }

  const status = body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  const usernameRaw = body.username?.trim() ?? '';
  const passwordRaw = body.password ?? '';
  const shouldCreateCreds = Boolean(usernameRaw && passwordRaw);

  const pool = getDbPool();

  const seqRes = await pool.query(`SELECT pg_get_serial_sequence('customers', 'id') AS seq`);
  const seq = String(seqRes.rows?.[0]?.seq ?? '').trim();
  if (!seq) {
    return NextResponse.json({ success: false, message: 'Could not resolve customers id sequence' }, { status: 500 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertCustomer = await client.query(
      `
      WITH nid AS (
        SELECT nextval($1::regclass) AS id
      )
      INSERT INTO customers (
        id, code, name, contact, address, area_id,
        delivery_days, required_bottles, opening_balance, status
      )
      SELECT
        nid.id,
        ('CUST-' || lpad(nid.id::text, 3, '0')) AS code,
        $2, $3, $4, $5,
        $6, $7, $8, $9
      FROM nid
      RETURNING
        id, code, name, contact, address,
        area_id AS "areaId",
        delivery_days AS "deliveryDays",
        required_bottles AS "requiredBottles",
        opening_balance AS "openingBalance",
        status
      `,
      [
        seq,
        name,
        contact,
        address,
        areaId,
        deliveryDays,
        Math.floor(requiredBottles),
        openingBalance,
        status,
      ],
    );

    const customer = insertCustomer.rows[0] as { id: number };

    if (shouldCreateCreds) {
      await client.query(
        `
        INSERT INTO customer_credentials (customer_id, username, password_hash)
        VALUES ($1, $2, $3)
        ON CONFLICT (customer_id)
        DO UPDATE SET username = EXCLUDED.username, password_hash = EXCLUDED.password_hash
        `,
        [customer.id, usernameRaw, hashPassword(passwordRaw)],
      );
    }

    if (securityDeposit > 0) {
      await client.query(
        `
        INSERT INTO customer_security_deposits (customer_id, deposit_date, amount, remarks)
        VALUES ($1, CURRENT_DATE, $2, 'Opening security deposit')
        `,
        [customer.id, securityDeposit],
      );
    }

    await client.query('COMMIT');

    // Return with areaName
    const full = await pool.query(
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
        c.status
      FROM customers c
      LEFT JOIN areas a ON a.id = c.area_id
      WHERE c.id = $1
      LIMIT 1
      `,
      [customer.id],
    );

    return NextResponse.json({ success: true, customer: full.rows[0] });
  } catch (e: any) {
    await client.query('ROLLBACK');
    return NextResponse.json(
      { success: false, message: e?.message ? String(e.message) : 'Failed to create customer' },
      { status: 400 },
    );
  } finally {
    client.release();
  }
}

