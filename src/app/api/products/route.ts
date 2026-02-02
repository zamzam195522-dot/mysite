import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSessionUser, requireAdmin } from '@/lib/auth';

type NewProductRequest = {
  name: string;
  price: number;
  type: string;
  categoryId?: number | string | null;
};

export async function GET() {
  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT
      p.id,
      p.name,
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
    WHERE p.status = 'ACTIVE'
    ORDER BY p.name ASC
    `,
  );

  return NextResponse.json({ success: true, products: result.rows });
}

export async function POST(request: Request) {
  // Check admin authorization
  const authResult = requireAdmin(getSessionUser(request as any));
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, message: authResult.error },
      { status: authResult.error === 'Unauthenticated' ? 401 : 403 }
    );
  }

  try {
    const body = (await request.json()) as Partial<NewProductRequest>;

    if (!body.name || body.price === undefined || body.price === null || !body.type) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 },
      );
    }

    const pool = getDbPool();
    const name = String(body.name).trim();
    const price = Number(body.price);
    const type = String(body.type).trim();

    const categoryIdRaw = body.categoryId;
    const categoryId =
      categoryIdRaw === undefined || categoryIdRaw === null || categoryIdRaw === ''
        ? null
        : Number(categoryIdRaw);

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ success: false, message: 'Invalid price' }, { status: 400 });
    }

    if (categoryId !== null && !Number.isInteger(categoryId)) {
      return NextResponse.json({ success: false, message: 'Invalid categoryId' }, { status: 400 });
    }

    const insertProduct = await pool.query(
      `
      INSERT INTO products (name, category_id, bottle_type, is_returnable, status)
      VALUES ($1, $2, $3, $4, 'ACTIVE')
      RETURNING id, name, category_id AS "categoryId", bottle_type AS "type"
      `,
      [name, categoryId, type, type.toLowerCase().includes('return')],
    );

    const product = insertProduct.rows[0] as {
      id: number;
      name: string;
      type: string;
      categoryId: number | null;
    };

    await pool.query(
      `
      INSERT INTO product_prices (product_id, price, effective_from)
      VALUES ($1, $2, CURRENT_DATE)
      ON CONFLICT (product_id, effective_from)
      DO UPDATE SET price = EXCLUDED.price
      `,
      [product.id, price],
    );

    return NextResponse.json({ success: true, product: { ...product, price } });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 },
    );
  }
}

