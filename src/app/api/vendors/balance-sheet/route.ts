import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET() {
  const pool = getDbPool();
  const result = await pool.query(
    `
    WITH purchase_totals AS (
      SELECT vendor_id, SUM(total_amount) AS total_purchases
      FROM vendor_purchases
      WHERE status = 'POSTED'
      GROUP BY vendor_id
    ),
    payment_totals AS (
      SELECT vendor_id, SUM(amount) AS total_payments
      FROM vendor_payments
      WHERE status = 'POSTED'
      GROUP BY vendor_id
    )
    SELECT
      v.id,
      v.code,
      v.name AS vendor,
      COALESCE(pt.total_purchases, 0) AS "totalPurchases",
      COALESCE(pay.total_payments, 0) AS "totalPayments",
      (COALESCE(pt.total_purchases, 0) - COALESCE(pay.total_payments, 0)) AS outstanding
    FROM vendors v
    LEFT JOIN purchase_totals pt ON pt.vendor_id = v.id
    LEFT JOIN payment_totals pay ON pay.vendor_id = v.id
    ORDER BY v.name ASC
    `,
  );

  const summary = result.rows.reduce(
    (acc, r: any) => {
      acc.totalPurchases += Number(r.totalPurchases ?? 0);
      acc.totalPayments += Number(r.totalPayments ?? 0);
      acc.outstanding += Number(r.outstanding ?? 0);
      return acc;
    },
    { totalPurchases: 0, totalPayments: 0, outstanding: 0 },
  );

  return NextResponse.json({ success: true, summary, rows: result.rows });
}

