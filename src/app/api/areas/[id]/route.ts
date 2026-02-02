import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type Params = { id: string };

type UpdateAreaRequest = {
  name?: string;
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
  const result = await pool.query(`SELECT id, name, status FROM areas WHERE id = $1 LIMIT 1`, [id]);
  const area = result.rows[0];
  if (!area) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true, area });
}

export async function PATCH(request: Request, context: { params: Params }) {
  const id = parseId(context.params);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  let body: UpdateAreaRequest;
  try {
    body = (await request.json()) as UpdateAreaRequest;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const status =
    body.status === undefined ? undefined : body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  if (name !== undefined && !name) {
    return NextResponse.json({ success: false, message: 'Invalid name' }, { status: 400 });
  }

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(name);
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
    UPDATE areas
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING id, name, status
    `,
    values,
  );

  const area = result.rows[0];
  if (!area) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true, area });
}

export async function DELETE(_request: Request, context: { params: Params }) {
  const id = parseId(context.params);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  // Safer than hard delete (customers reference areas)
  const pool = getDbPool();
  const result = await pool.query(`UPDATE areas SET status = 'INACTIVE' WHERE id = $1 RETURNING id`, [id]);
  if (result.rowCount === 0) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}

