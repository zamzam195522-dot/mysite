import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const customerIdParam = url.searchParams.get('customerId');
  const productIdParam = url.searchParams.get('productId');

  if (!productIdParam) {
    return NextResponse.json({ success: false, message: 'Missing productId' }, { status: 400 });
  }

  const customerId = customerIdParam ? Number(customerIdParam) : null;
  const productId = Number(productIdParam);

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid productId' }, { status: 400 });
  }
  if (customerId !== null && (!Number.isInteger(customerId) || customerId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid customerId' }, { status: 400 });
  }

  const pool = getDbPool();

  const result = await pool.query(
    `
    WITH customer_price AS (
      SELECT price
      FROM customer_product_prices
      WHERE customer_id = $1
        AND product_id = $2
        AND effective_from <= CURRENT_DATE
        AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
      ORDER BY effective_from DESC
      LIMIT 1
    ),
    default_price AS (
      SELECT price
      FROM product_prices
      WHERE product_id = $2
        AND effective_from <= CURRENT_DATE
        AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
      ORDER BY effective_from DESC
      LIMIT 1
    )
    SELECT
      $2::bigint AS "productId",
      COALESCE((SELECT price FROM customer_price), (SELECT price FROM default_price), 0) AS price,
      CASE
        WHEN (SELECT price FROM customer_price) IS NOT NULL THEN 'CUSTOMER'
        WHEN (SELECT price FROM default_price) IS NOT NULL THEN 'DEFAULT'
        ELSE 'NONE'
      END AS source
    `,
    [customerId, productId],
  );

  return NextResponse.json({ success: true, ...result.rows[0] });
}

