import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type NewExpenseHeadRequest = {
  name: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

export async function GET() {
  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT id, name, status
    FROM expense_heads
    ORDER BY name ASC
    `,
  );
  return NextResponse.json({ success: true, heads: result.rows });
}

export async function POST(request: Request) {
  let body: Partial<NewExpenseHeadRequest>;
  try {
    body = (await request.json()) as Partial<NewExpenseHeadRequest>;
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

  const status = body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  const pool = getDbPool();
  const result = await pool.query(
    `
    INSERT INTO expense_heads (name, status)
    VALUES ($1, $2)
    RETURNING id, name, status
    `,
    [name, status],
  );

  return NextResponse.json({ success: true, head: result.rows[0] });
}

