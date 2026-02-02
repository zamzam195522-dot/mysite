import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type NewExpenseRequest = {
  headId: number | string;
  expenseDate: string; // YYYY-MM-DD
  description?: string | null;
  amount: number;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const headIdParam = url.searchParams.get('headId');
  const fromDate = url.searchParams.get('from');
  const toDate = url.searchParams.get('to');
  const groupWise = url.searchParams.get('groupWise') === 'true';

  const headId = headIdParam ? Number(headIdParam) : null;
  if (headId !== null && (!Number.isInteger(headId) || headId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid headId' }, { status: 400 });
  }

  const hasFrom = fromDate && /^\d{4}-\d{2}-\d{2}$/.test(fromDate);
  const hasTo = toDate && /^\d{4}-\d{2}-\d{2}$/.test(toDate);
  if ((fromDate && !hasFrom) || (toDate && !hasTo)) {
    return NextResponse.json({ success: false, message: 'Invalid date filter' }, { status: 400 });
  }

  const pool = getDbPool();

  if (groupWise) {
    const result = await pool.query(
      `
      SELECT
        eh.id AS "headId",
        eh.name AS "headName",
        SUM(e.amount) AS amount
      FROM expenses e
      JOIN expense_heads eh ON eh.id = e.head_id
      WHERE ($1::bigint IS NULL OR e.head_id = $1::bigint)
        AND ($2::date IS NULL OR e.expense_date >= $2::date)
        AND ($3::date IS NULL OR e.expense_date <= $3::date)
      GROUP BY eh.id, eh.name
      ORDER BY eh.name ASC
      `,
      [headId, hasFrom ? fromDate : null, hasTo ? toDate : null],
    );
    return NextResponse.json({ success: true, groupWise: true, rows: result.rows });
  }

  const result = await pool.query(
    `
    SELECT
      e.id,
      e.head_id AS "headId",
      eh.name AS "headName",
      e.expense_date AS "date",
      e.description,
      e.amount
    FROM expenses e
    JOIN expense_heads eh ON eh.id = e.head_id
    WHERE ($1::bigint IS NULL OR e.head_id = $1::bigint)
      AND ($2::date IS NULL OR e.expense_date >= $2::date)
      AND ($3::date IS NULL OR e.expense_date <= $3::date)
    ORDER BY e.expense_date DESC, e.id DESC
    LIMIT 500
    `,
    [headId, hasFrom ? fromDate : null, hasTo ? toDate : null],
  );

  return NextResponse.json({ success: true, groupWise: false, rows: result.rows });
}

export async function POST(request: Request) {
  let body: Partial<NewExpenseRequest>;
  try {
    body = (await request.json()) as Partial<NewExpenseRequest>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (body.headId === undefined || !body.expenseDate || body.amount === undefined || body.amount === null) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const headId = Number(body.headId);
  const amount = Number(body.amount);
  const expenseDate = String(body.expenseDate).trim();
  const description = body.description === undefined || body.description === null ? null : String(body.description).trim();

  if (!Number.isInteger(headId) || headId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid headId' }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ success: false, message: 'Invalid amount' }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    return NextResponse.json({ success: false, message: 'Invalid expenseDate' }, { status: 400 });
  }

  const pool = getDbPool();
  const result = await pool.query(
    `
    INSERT INTO expenses (head_id, expense_date, description, amount)
    VALUES ($1, $2, $3, $4)
    RETURNING id, head_id AS "headId", expense_date AS "date", description, amount
    `,
    [headId, expenseDate, description, amount],
  );

  return NextResponse.json({ success: true, expense: result.rows[0] });
}

