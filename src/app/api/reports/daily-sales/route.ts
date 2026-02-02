import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date'); // YYYY-MM-DD
  const employeeIdParam = url.searchParams.get('employeeId');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ success: false, message: 'date is required (YYYY-MM-DD)' }, { status: 400 });
  }

  const employeeId = employeeIdParam ? Number(employeeIdParam) : null;
  if (employeeId !== null && (!Number.isInteger(employeeId) || employeeId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid employeeId' }, { status: 400 });
  }

  const pool = getDbPool();

  const productRes = await pool.query(
    `
    SELECT
      p.name AS product,
      SUM(sii.sale_qty) AS qty,
      SUM(sii.line_amount) AS amount
    FROM sales_invoices si
    JOIN sales_invoice_items sii ON sii.invoice_id = si.id
    JOIN products p ON p.id = sii.product_id
    WHERE si.status = 'POSTED'
      AND si.order_date = $1::date
      AND ($2::bigint IS NULL OR si.salesman_employee_id = $2::bigint)
    GROUP BY p.name
    ORDER BY p.name ASC
    `,
    [date, employeeId],
  );

  const salesTotalRes = await pool.query(
    `
    SELECT COALESCE(SUM(total_amount), 0) AS total
    FROM sales_invoices
    WHERE status = 'POSTED'
      AND order_date = $1::date
      AND ($2::bigint IS NULL OR salesman_employee_id = $2::bigint)
    `,
    [date, employeeId],
  );

  const paymentsTotalRes = await pool.query(
    `
    SELECT COALESCE(SUM(received_amount + discount_tax_amount), 0) AS total
    FROM customer_payments
    WHERE status = 'POSTED'
      AND payment_date = $1::date
      AND ($2::bigint IS NULL OR receiver_employee_id = $2::bigint)
    `,
    [date, employeeId],
  );

  const totalSalesAmount = Number(salesTotalRes.rows[0]?.total ?? 0);
  const cashInHand = Number(paymentsTotalRes.rows[0]?.total ?? 0);
  const receivableAmount = Math.max(0, totalSalesAmount - cashInHand);

  return NextResponse.json({
    success: true,
    summary: { cashInHand, receivableAmount, totalSalesAmount },
    rows: productRes.rows,
  });
}

