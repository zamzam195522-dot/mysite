import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type Params = { id: string };

function parseId(params: Params) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export async function GET(_request: Request, context: { params: Params }) {
  const id = parseId(context.params);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

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
    WHERE r.id = $1
    LIMIT 1
    `,
    [id],
  );

  if (!result.rows[0]) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, refund: result.rows[0] });
}

export async function PATCH(request: Request, context: { params: Params }) {
  const id = parseId(context.params);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  let body: Partial<{ refundDate: string; amount: number; remarks?: string | null }>;
  try {
    body = (await request.json()) as Partial<{ refundDate: string; amount: number; remarks?: string | null }>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (!body.refundDate || body.amount === undefined || body.amount === null) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
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
  const updated = await pool.query(
    `
    UPDATE customer_security_refunds
    SET refund_date = $2::date, amount = $3, remarks = $4
    WHERE id = $1
    RETURNING id
    `,
    [id, refundDate, amount, remarks],
  );

  if (updated.rowCount === 0) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, context: { params: Params }) {
  const id = parseId(context.params);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  const pool = getDbPool();
  const result = await pool.query(`DELETE FROM customer_security_refunds WHERE id = $1`, [id]);
  if (result.rowCount === 0) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

