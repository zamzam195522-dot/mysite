import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type Params = { id: string };

type UpdateCategoryRequest = {
  name?: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

function parseId(params: Params) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (!id) {
    return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
  }

  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT id, name, status
    FROM product_categories
    WHERE id = $1
    LIMIT 1
    `,
    [id],
  );

  const category = result.rows[0];
  if (!category) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, category });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (!id) {
    return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
  }

  let body: UpdateCategoryRequest;
  try {
    body = (await request.json()) as UpdateCategoryRequest;
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
    UPDATE product_categories
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING id, name, status
    `,
    values,
  );

  const category = result.rows[0];
  if (!category) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, category });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (!id) {
    return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
  }

  const pool = getDbPool();
  const result = await pool.query(`DELETE FROM product_categories WHERE id = $1 RETURNING id`, [id]);
  if (result.rowCount === 0) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

