import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type Params = { id: string };

type UpdateProductRequest = {
  name?: string;
  price?: number;
  type?: string;
  categoryId?: number | string | null;
  status?: 'ACTIVE' | 'INACTIVE';
};

function parseId(params: Params) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export async function GET(_request: Request, context: { params: Params }) {
  const id = parseId(context.params);
  if (!id) {
    return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
  }

  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT
      p.id,
      p.name,
      p.status,
      p.category_id AS "categoryId",
      pc.name AS "categoryName",
      p.bottle_type AS "type",
      COALESCE(pp.price, 0) AS price
    FROM products p
    LEFT JOIN product_categories pc ON pc.id = p.category_id
    LEFT JOIN LATERAL (
      SELECT price
      FROM product_prices
      WHERE product_id = p.id
      ORDER BY effective_from DESC
      LIMIT 1
    ) pp ON true
    WHERE p.id = $1
    LIMIT 1
    `,
    [id],
  );

  const product = result.rows[0];
  if (!product) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, product });
}

export async function PATCH(request: Request, context: { params: Params }) {
  const id = parseId(context.params);
  if (!id) {
    return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
  }

  let body: UpdateProductRequest;
  try {
    body = (await request.json()) as UpdateProductRequest;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const pool = getDbPool();

  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const type = body.type !== undefined ? String(body.type).trim() : undefined;

  const categoryId =
    body.categoryId === undefined
      ? undefined
      : body.categoryId === null || body.categoryId === ''
        ? null
        : Number(body.categoryId);

  const status =
    body.status === undefined ? undefined : body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  if (name !== undefined && !name) {
    return NextResponse.json({ success: false, message: 'Invalid name' }, { status: 400 });
  }
  if (type !== undefined && !type) {
    return NextResponse.json({ success: false, message: 'Invalid type' }, { status: 400 });
  }
  if (categoryId !== undefined && categoryId !== null && !Number.isInteger(categoryId)) {
    return NextResponse.json({ success: false, message: 'Invalid categoryId' }, { status: 400 });
  }
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ success: false, message: 'Invalid price' }, { status: 400 });
    }
  }

  // Update core product fields (only those provided)
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(name);
  }
  if (categoryId !== undefined) {
    fields.push(`category_id = $${idx++}`);
    values.push(categoryId);
  }
  if (type !== undefined) {
    fields.push(`bottle_type = $${idx++}`);
    values.push(type);
    fields.push(`is_returnable = $${idx++}`);
    values.push(type.toLowerCase().includes('return'));
  }
  if (status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(status);
  }

  if (fields.length > 0) {
    values.push(id);
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  }

  // Update price by upserting "today's" default price
  if (body.price !== undefined) {
    const price = Number(body.price);
    await pool.query(
      `
      INSERT INTO product_prices (product_id, price, effective_from)
      VALUES ($1, $2, CURRENT_DATE)
      ON CONFLICT (product_id, effective_from)
      DO UPDATE SET price = EXCLUDED.price
      `,
      [id, price],
    );
  }

  // Return updated row (same shape as list)
  const updated = await pool.query(
    `
    SELECT
      p.id,
      p.name,
      p.status,
      p.category_id AS "categoryId",
      pc.name AS "categoryName",
      p.bottle_type AS "type",
      COALESCE(pp.price, 0) AS price
    FROM products p
    LEFT JOIN product_categories pc ON pc.id = p.category_id
    LEFT JOIN LATERAL (
      SELECT price
      FROM product_prices
      WHERE product_id = p.id
      ORDER BY effective_from DESC
      LIMIT 1
    ) pp ON true
    WHERE p.id = $1
    LIMIT 1
    `,
    [id],
  );

  const product = updated.rows[0];
  if (!product) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, product });
}

export async function DELETE(_request: Request, context: { params: Params }) {
  const id = parseId(context.params);
  if (!id) {
    return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
  }

  // Soft delete (safe with sales references)
  const pool = getDbPool();
  const result = await pool.query(`UPDATE products SET status = 'INACTIVE' WHERE id = $1 RETURNING id`, [id]);
  if (result.rowCount === 0) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

