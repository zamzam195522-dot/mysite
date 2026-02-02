import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type NewRefundRequest = {
  customerId: number | string;
  refundDate: string; // YYYY-MM-DD
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
      r.id,
      r.customer_id AS "customerId",
      c.code AS "customerCode",
      c.name AS "customerName",
      r.refund_date AS "refundDate",
      r.amount,
      r.remarks
    FROM customer_security_refunds r
    JOIN customers c ON c.id = r.customer_id
    WHERE ($1::bigint IS NULL OR r.customer_id = $1::bigint)
      AND ($2::date IS NULL OR r.refund_date >= $2::date)
      AND ($3::date IS NULL OR r.refund_date <= $3::date)
    ORDER BY r.refund_date DESC, r.id DESC
    LIMIT $4
    `,
    [customerId, hasFrom ? from : null, hasTo ? to : null, safeLimit],
  );

  return NextResponse.json({ success: true, refunds: result.rows });
}

export async function POST(request: Request) {
  let body: Partial<NewRefundRequest>;
  try {
    body = (await request.json()) as Partial<NewRefundRequest>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (!body.customerId || !body.refundDate || body.amount === undefined || body.amount === null) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const customerId = Number(body.customerId);
  if (!Number.isInteger(customerId) || customerId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid customerId' }, { status: 400 });
  }

  const refundDate = String(body.refundDate).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(refundDate)) {
    return NextResponse.json({ success: false, message: 'Invalid refundDate' }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ success: false, message: 'Invalid amount' }, { status: 400 });
  }

  const remarks = body.remarks === undefined || body.remarks === null ? null : String(body.remarks).trim();

  const pool = getDbPool();
  const inserted = await pool.query(
    `
    INSERT INTO customer_security_refunds (customer_id, refund_date, amount, remarks)
    VALUES ($1, $2::date, $3, $4)
    RETURNING id
    `,
    [customerId, refundDate, amount, remarks],
  );

  return NextResponse.json({ success: true, refundId: inserted.rows[0].id });
}

