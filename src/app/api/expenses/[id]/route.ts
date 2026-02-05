import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type Params = { id: string };

type UpdateExpenseRequest = {
  headId?: number | string;
  expenseDate?: string; // YYYY-MM-DD
  description?: string | null;
  amount?: number;
};

function parseId(params: Params) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
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
      e.head_id AS "headId",
      eh.name AS "headName",
      e.expense_date AS "date",
      e.description,
      e.amount
    FROM expenses e
    JOIN expense_heads eh ON eh.id = e.head_id
    WHERE e.id = $1
    LIMIT 1
    `,
    [id],
  );

  const expense = result.rows[0];
  if (!expense) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, expense });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  let body: UpdateExpenseRequest;
  try {
    body = (await request.json()) as UpdateExpenseRequest;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const headId = body.headId === undefined ? undefined : Number(body.headId);
  if (headId !== undefined && (!Number.isInteger(headId) || headId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid headId' }, { status: 400 });
  }

  const expenseDate = body.expenseDate === undefined ? undefined : String(body.expenseDate).trim();
  if (expenseDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    return NextResponse.json({ success: false, message: 'Invalid expenseDate' }, { status: 400 });
  }

  const description = body.description === undefined ? undefined : body.description === null ? null : String(body.description).trim();

  const amount = body.amount === undefined ? undefined : Number(body.amount);
  if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
    return NextResponse.json({ success: false, message: 'Invalid amount' }, { status: 400 });
  }

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (headId !== undefined) {
    fields.push(`head_id = $${idx++}`);
    values.push(headId);
  }
  if (expenseDate !== undefined) {
    fields.push(`expense_date = $${idx++}`);
    values.push(expenseDate);
  }
  if (description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(description);
  }
  if (amount !== undefined) {
    fields.push(`amount = $${idx++}`);
    values.push(amount);
  }

  if (fields.length === 0) {
    return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 });
  }

  values.push(id);
  const pool = getDbPool();
  const result = await pool.query(
    `
    UPDATE expenses
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING id
    `,
    values,
  );

  if (result.rowCount === 0) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const updated = await pool.query(
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
    WHERE e.id = $1
    LIMIT 1
    `,
    [id],
  );

  return NextResponse.json({ success: true, expense: updated.rows[0] });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  const pool = getDbPool();
  const result = await pool.query(`DELETE FROM expenses WHERE id = $1 RETURNING id`, [id]);
  if (result.rowCount === 0) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}

