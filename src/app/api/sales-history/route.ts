import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const customerIdParam = url.searchParams.get('customerId');

  const customerId = customerIdParam ? Number(customerIdParam) : null;
  if (customerId !== null && (!Number.isInteger(customerId) || customerId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid customerId' }, { status: 400 });
  }

  const hasFrom = from && /^\d{4}-\d{2}-\d{2}$/.test(from);
  const hasTo = to && /^\d{4}-\d{2}-\d{2}$/.test(to);
  if ((from && !hasFrom) || (to && !hasTo)) {
    return NextResponse.json({ success: false, message: 'Invalid date filter' }, { status: 400 });
  }

  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT
      si.id AS "invoiceId",
      si.order_date AS "date",
      c.id AS "customerId",
      c.name AS "customer",
      p.id AS "productId",
      p.name AS "product",
      SUM(sii.sale_qty) AS qty,
      SUM(sii.line_amount) AS amount
    FROM sales_invoices si
    JOIN customers c ON c.id = si.customer_id
    JOIN sales_invoice_items sii ON sii.invoice_id = si.id
    JOIN products p ON p.id = sii.product_id
    WHERE si.status = 'POSTED'
      AND ($1::bigint IS NULL OR si.customer_id = $1::bigint)
      AND ($2::date IS NULL OR si.order_date >= $2::date)
      AND ($3::date IS NULL OR si.order_date <= $3::date)
    GROUP BY si.id, si.order_date, c.id, c.name, p.id, p.name
    ORDER BY si.order_date DESC, si.id DESC, p.name ASC
    LIMIT 500
    `,
    [customerId, hasFrom ? from : null, hasTo ? to : null],
  );

  return NextResponse.json({ success: true, rows: result.rows });
}

