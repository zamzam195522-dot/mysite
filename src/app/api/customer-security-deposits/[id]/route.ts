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
      d.id,
      d.customer_id AS "customerId",
      c.code AS "customerCode",
      c.name AS "customerName",
      d.deposit_date AS "depositDate",
      d.amount,
      d.remarks
    FROM customer_security_deposits d
    JOIN customers c ON c.id = d.customer_id
    WHERE d.id = $1
    LIMIT 1
    `,
    [id],
  );

  if (!result.rows[0]) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, deposit: result.rows[0] });
}

export async function PATCH(request: Request, context: { params: Params }) {
  const id = parseId(context.params);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  let body: Partial<{ depositDate: string; amount: number; remarks?: string | null }>;
  try {
    body = (await request.json()) as Partial<{ depositDate: string; amount: number; remarks?: string | null }>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (!body.depositDate || body.amount === undefined || body.amount === null) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
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
  const updated = await pool.query(
    `
    UPDATE customer_security_deposits
    SET deposit_date = $2::date, amount = $3, remarks = $4
    WHERE id = $1
    RETURNING id
    `,
    [id, depositDate, amount, remarks],
  );

  if (updated.rowCount === 0) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, context: { params: Params }) {
  const id = parseId(context.params);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  const pool = getDbPool();
  const result = await pool.query(`DELETE FROM customer_security_deposits WHERE id = $1`, [id]);
  if (result.rowCount === 0) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

