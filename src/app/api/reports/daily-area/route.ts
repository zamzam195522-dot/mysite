import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

function dayToken(day: string) {
  const d = day.toLowerCase();
  if (d.startsWith('mon')) return 'mon';
  if (d.startsWith('tue')) return 'tue';
  if (d.startsWith('wed')) return 'wed';
  if (d.startsWith('thu')) return 'thu';
  if (d.startsWith('fri')) return 'fri';
  if (d.startsWith('sat')) return 'sat';
  if (d.startsWith('sun')) return 'sun';
  return d.slice(0, 3);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const day = url.searchParams.get('day'); // Monday, Tuesday...
  const salesmanIdParam = url.searchParams.get('salesmanId');

  if (!day) {
    return NextResponse.json({ success: false, message: 'day is required' }, { status: 400 });
  }

  const salesmanId = salesmanIdParam ? Number(salesmanIdParam) : null;
  if (salesmanId !== null && (!Number.isInteger(salesmanId) || salesmanId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid salesmanId' }, { status: 400 });
  }

  const token = dayToken(day);
  const pool = getDbPool();

  const result = await pool.query(
    `
    SELECT
      c.id,
      c.name AS customer,
      COALESCE(a.name, '') AS area,
      c.required_bottles AS bottles,
      COALESCE(e.name, '') AS salesman
    FROM customers c
    LEFT JOIN areas a ON a.id = c.area_id
    LEFT JOIN employees e ON e.id = c.default_salesman_employee_id
    WHERE c.status = 'ACTIVE'
      AND (c.delivery_days IS NOT NULL AND lower(c.delivery_days) LIKE '%' || $1 || '%')
      AND ($2::bigint IS NULL OR c.default_salesman_employee_id = $2::bigint)
    ORDER BY a.name NULLS LAST, c.name ASC
    `,
    [token, salesmanId],
  );

  return NextResponse.json({ success: true, rows: result.rows });
}

