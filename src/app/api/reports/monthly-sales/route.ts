import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const month = url.searchParams.get('month'); // YYYY-MM
  const employeeIdParam = url.searchParams.get('employeeId');

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ success: false, message: 'month is required (YYYY-MM)' }, { status: 400 });
  }

  const employeeId = employeeIdParam ? Number(employeeIdParam) : null;
  if (employeeId !== null && (!Number.isInteger(employeeId) || employeeId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid employeeId' }, { status: 400 });
  }

  const fromDate = `${month}-01`;

  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT
      p.id AS "productId",
      p.name AS product,
      SUM(sii.sale_qty) AS qty,
      SUM(sii.line_amount) AS amount
    FROM sales_invoices si
    JOIN sales_invoice_items sii ON sii.invoice_id = si.id
    JOIN products p ON p.id = sii.product_id
    WHERE si.status = 'POSTED'
      AND date_trunc('month', si.order_date) = date_trunc('month', $1::date)
      AND ($2::bigint IS NULL OR si.salesman_employee_id = $2::bigint)
    GROUP BY p.id, p.name
    ORDER BY p.name ASC
    `,
    [fromDate, employeeId],
  );

  return NextResponse.json({ success: true, rows: result.rows });
}

