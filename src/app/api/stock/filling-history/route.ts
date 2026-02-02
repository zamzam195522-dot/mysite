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

  const result = await pool.query(
    `
    WITH warehouse AS (
      SELECT id
      FROM stock_locations
      WHERE location_type = 'WAREHOUSE'
      LIMIT 1
    ),
    filling AS (
      SELECT
        sm.id,
        sm.occurred_on,
        sm.product_id,
        sm.qty
      FROM stock_movements sm
      JOIN warehouse w ON w.id = sm.to_location_id
      WHERE sm.movement_type = 'FILLING'
        AND ($1::date IS NULL OR sm.occurred_on >= $1::date)
        AND ($2::date IS NULL OR sm.occurred_on <= $2::date)
      ORDER BY sm.occurred_on ASC, sm.id ASC
    ),
    running AS (
      SELECT
        f.*,
        SUM(f.qty) OVER (PARTITION BY f.product_id ORDER BY f.occurred_on, f.id) AS running_filled
      FROM filling f
    )
    SELECT
      r.id,
      r.occurred_on AS "date",
      p.name AS "productName",
      (r.running_filled - r.qty) AS "oldStock",
      r.running_filled AS "newStock",
      r.qty AS "updateStock"
    FROM running r
    JOIN products p ON p.id = r.product_id
    ORDER BY r.occurred_on DESC, r.id DESC
    `,
    [hasFrom ? from : null, hasTo ? to : null],
  );

  return NextResponse.json({ success: true, rows: result.rows });
}

