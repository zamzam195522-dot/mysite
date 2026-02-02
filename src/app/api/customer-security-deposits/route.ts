import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type NewDepositRequest = {
  customerId: number | string;
  depositDate: string; // YYYY-MM-DD
  amount: number;
  remarks?: string | null;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const customerIdParam = url.searchParams.get('customerId');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const limitParam = url.searchParams.get('limit');

  const customerId = customerIdParam ? Number(customerIdParam) : null;
  if (customerId !== null && (!Number.isInteger(customerId) || customerId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid customerId' }, { status: 400 });
  }

  const hasFrom = from && /^\d{4}-\d{2}-\d{2}$/.test(from);
  const hasTo = to && /^\d{4}-\d{2}-\d{2}$/.test(to);
  if ((from && !hasFrom) || (to && !hasTo)) {
    return NextResponse.json({ success: false, message: 'Invalid date filter' }, { status: 400 });
  }

  const limit = limitParam ? Number(limitParam) : 50;
  const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 200 ? Math.floor(limit) : 50;

  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT
      d.id,
      d.customer_id AS "customerId",
      c.code AS "customerCode",
      c.name AS "customerName",
      d.deposit_date AS "depositDate",
      d.amount,
      d.remarks
    FROM customer_security_deposits d
    JOIN customers c ON c.id = d.customer_id
    WHERE ($1::bigint IS NULL OR d.customer_id = $1::bigint)
      AND ($2::date IS NULL OR d.deposit_date >= $2::date)
      AND ($3::date IS NULL OR d.deposit_date <= $3::date)
    ORDER BY d.deposit_date DESC, d.id DESC
    LIMIT $4
    `,
    [customerId, hasFrom ? from : null, hasTo ? to : null, safeLimit],
  );

  return NextResponse.json({ success: true, deposits: result.rows });
}

export async function POST(request: Request) {
  let body: Partial<NewDepositRequest>;
  try {
    body = (await request.json()) as Partial<NewDepositRequest>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (!body.customerId || !body.depositDate || body.amount === undefined || body.amount === null) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const customerId = Number(body.customerId);
  if (!Number.isInteger(customerId) || customerId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid customerId' }, { status: 400 });
  }

  const depositDate = String(body.depositDate).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(depositDate)) {
    return NextResponse.json({ success: false, message: 'Invalid depositDate' }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ success: false, message: 'Invalid amount' }, { status: 400 });
  }

  const remarks = body.remarks === undefined || body.remarks === null ? null : String(body.remarks).trim();

  const pool = getDbPool();
  const inserted = await pool.query(
    `
    INSERT INTO customer_security_deposits (customer_id, deposit_date, amount, remarks)
    VALUES ($1, $2::date, $3, $4)
    RETURNING id
    `,
    [customerId, depositDate, amount, remarks],
  );

  return NextResponse.json({ success: true, depositId: inserted.rows[0].id });
}

