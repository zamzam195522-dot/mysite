import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET() {
  const pool = getDbPool();
  const result = await pool.query(
    `
    WITH invoice_totals AS (
      SELECT
        si.customer_id,
        SUM(si.total_amount) AS invoiced_total
      FROM sales_invoices si
      WHERE si.status = 'POSTED'
      GROUP BY si.customer_id
    ),
    payment_totals AS (
      SELECT
        cp.customer_id,
        SUM(cp.received_amount + cp.discount_tax_amount) AS settled_total
      FROM customer_payments cp
      WHERE cp.status = 'POSTED'
      GROUP BY cp.customer_id
    ),
    bottle_totals AS (
      SELECT
        si.customer_id,
        SUM(sii.sale_qty - sii.return_qty) AS bottles_in_market
      FROM sales_invoices si
      JOIN sales_invoice_items sii ON sii.invoice_id = si.id
      JOIN products p ON p.id = sii.product_id
      WHERE si.status = 'POSTED' AND p.is_returnable = true
      GROUP BY si.customer_id
    )
    SELECT
      c.id,
      c.code,
      c.name AS customer,
      (c.opening_balance + COALESCE(it.invoiced_total, 0) - COALESCE(pt.settled_total, 0)) AS "outstandingAmount",
      COALESCE(bt.bottles_in_market, 0) AS "bottleBalance"
    FROM customers c
    LEFT JOIN invoice_totals it ON it.customer_id = c.id
    LEFT JOIN payment_totals pt ON pt.customer_id = c.id
    LEFT JOIN bottle_totals bt ON bt.customer_id = c.id
    WHERE c.status = 'ACTIVE'
    ORDER BY c.code
    `,
  );

  return NextResponse.json({ success: true, rows: result.rows });
}

