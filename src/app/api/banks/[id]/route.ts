import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type Params = { id: string };

type UpdateBankRequest = {
  name?: string;
  accountNumber?: string;
  branch?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
};

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
    `SELECT id, name, account_number AS "accountNumber", branch, status FROM banks WHERE id = $1 LIMIT 1`,
    [id],
  );
  const bank = result.rows[0];
  if (!bank) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true, bank });
}

export async function PATCH(request: Request, context: { params: Params }) {
  const id = parseId(context.params);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  let body: UpdateBankRequest;
  try {
    body = (await request.json()) as UpdateBankRequest;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const accountNumber = body.accountNumber !== undefined ? String(body.accountNumber).trim() : undefined;
  const branch = body.branch === undefined ? undefined : body.branch === null ? null : String(body.branch).trim();
  const status =
    body.status === undefined ? undefined : body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  if (name !== undefined && !name) {
    return NextResponse.json({ success: false, message: 'Invalid name' }, { status: 400 });
  }
  if (accountNumber !== undefined && !accountNumber) {
    return NextResponse.json({ success: false, message: 'Invalid accountNumber' }, { status: 400 });
  }

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(name);
  }
  if (accountNumber !== undefined) {
    fields.push(`account_number = $${idx++}`);
    values.push(accountNumber);
  }
  if (branch !== undefined) {
    fields.push(`branch = $${idx++}`);
    values.push(branch);
  }
  if (status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(status);
  }

  if (fields.length === 0) {
    return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 });
  }

  values.push(id);
  const pool = getDbPool();
  const result = await pool.query(
    `
    UPDATE banks
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING id, name, account_number AS "accountNumber", branch, status
    `,
    values,
  );

  const bank = result.rows[0];
  if (!bank) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true, bank });
}

export async function DELETE(_request: Request, context: { params: Params }) {
  const id = parseId(context.params);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  // Safer than hard delete (payments may reference banks)
  const pool = getDbPool();
  const result = await pool.query(`UPDATE banks SET status = 'INACTIVE' WHERE id = $1 RETURNING id`, [id]);
  if (result.rowCount === 0) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}

