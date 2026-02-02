import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type NewCustomerProductPriceRequest = {
  customerId: number | string;
  productId: number | string;
  price: number;
  effectiveFrom?: string; // YYYY-MM-DD (optional; defaults to today)
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const customerIdParam = url.searchParams.get('customerId');
  const productIdParam = url.searchParams.get('productId');

  const customerId = customerIdParam ? Number(customerIdParam) : null;
  const productId = productIdParam ? Number(productIdParam) : null;

  if (customerId !== null && (!Number.isInteger(customerId) || customerId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid customerId' }, { status: 400 });
  }
  if (productId !== null && (!Number.isInteger(productId) || productId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid productId' }, { status: 400 });
  }

  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT
      cpp.id,
      cpp.customer_id AS "customerId",
      c.code AS "customerCode",
      c.name AS "customerName",
      cpp.product_id AS "productId",
      p.name AS "productName",
      cpp.price,
      cpp.effective_from AS "effectiveFrom",
      cpp.effective_to AS "effectiveTo"
    FROM customer_product_prices cpp
    JOIN customers c ON c.id = cpp.customer_id
    JOIN products p ON p.id = cpp.product_id
    WHERE ($1::bigint IS NULL OR cpp.customer_id = $1::bigint)
      AND ($2::bigint IS NULL OR cpp.product_id = $2::bigint)
    ORDER BY cpp.effective_from DESC, cpp.id DESC
    LIMIT 500
    `,
    [customerId, productId],
  );

  return NextResponse.json({ success: true, prices: result.rows });
}

export async function POST(request: Request) {
  let body: Partial<NewCustomerProductPriceRequest>;
  try {
    body = (await request.json()) as Partial<NewCustomerProductPriceRequest>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (body.customerId === undefined || body.productId === undefined || body.price === undefined || body.price === null) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const customerId = Number(body.customerId);
  const productId = Number(body.productId);
  const price = Number(body.price);

  if (!Number.isInteger(customerId) || customerId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid customerId' }, { status: 400 });
  }
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid productId' }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ success: false, message: 'Invalid price' }, { status: 400 });
  }

  const effectiveFrom = body.effectiveFrom ? String(body.effectiveFrom).trim() : null;
  if (effectiveFrom !== null && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) {
    return NextResponse.json({ success: false, message: 'Invalid effectiveFrom' }, { status: 400 });
  }

  const pool = getDbPool();
  const result = await pool.query(
    `
    INSERT INTO customer_product_prices (customer_id, product_id, price, effective_from)
    VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE))
    ON CONFLICT (customer_id, product_id, effective_from)
    DO UPDATE SET price = EXCLUDED.price
    RETURNING id, customer_id AS "customerId", product_id AS "productId", price, effective_from AS "effectiveFrom"
    `,
    [customerId, productId, price, effectiveFrom],
  );

  return NextResponse.json({ success: true, customerProductPrice: result.rows[0] });
}

