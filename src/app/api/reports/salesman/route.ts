import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  const hasFrom = from && /^\d{4}-\d{2}-\d{2}$/.test(from);
  const hasTo = to && /^\d{4}-\d{2}-\d{2}$/.test(to);
  if ((from && !hasFrom) || (to && !hasTo)) {
    return NextResponse.json({ success: false, message: 'Invalid date filter' }, { status: 400 });
  }

  const pool = getDbPool();

  const salesRes = await pool.query(
    `
    SELECT
      e.id AS "employeeId",
      e.name AS salesman,
      COALESCE(SUM(si.total_amount), 0) AS sales
    FROM employees e
    LEFT JOIN sales_invoices si
      ON si.salesman_employee_id = e.id
      AND si.status = 'POSTED'
      AND ($1::date IS NULL OR si.order_date >= $1::date)
      AND ($2::date IS NULL OR si.order_date <= $2::date)
    WHERE e.designation = 'SALESMAN'
    GROUP BY e.id, e.name
    ORDER BY e.name ASC
    `,
    [hasFrom ? from : null, hasTo ? to : null],
  );

  const payRes = await pool.query(
    `
    SELECT
      e.id AS "employeeId",
      COALESCE(SUM(cp.received_amount + cp.discount_tax_amount), 0) AS payments
    FROM employees e
    LEFT JOIN customer_payments cp
      ON cp.receiver_employee_id = e.id
      AND cp.status = 'POSTED'
      AND ($1::date IS NULL OR cp.payment_date >= $1::date)
      AND ($2::date IS NULL OR cp.payment_date <= $2::date)
    WHERE e.designation = 'SALESMAN'
    GROUP BY e.id
    `,
    [hasFrom ? from : null, hasTo ? to : null],
  );

  const payMap = new Map<number, number>();
  for (const r of payRes.rows) {
    payMap.set(Number(r.employeeId), Number(r.payments ?? 0));
  }

  const rows = salesRes.rows.map((r) => {
    const employeeId = Number(r.employeeId);
    const sales = Number(r.sales ?? 0);
    const payments = Number(payMap.get(employeeId) ?? 0);
    return {
      employeeId,
      salesman: r.salesman,
      sales,
      payments,
      receivable: Math.max(0, sales - payments),
    };
  });

  return NextResponse.json({ success: true, rows });
}

