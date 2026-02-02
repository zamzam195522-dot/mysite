import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET() {
  const pool = getDbPool();

  // Rollup balances per product: warehouse filled/empty, damaged total, market total
  const result = await pool.query(
    `
    WITH deltas AS (
      SELECT sm.product_id, sm.to_location_id AS location_id, sm.to_state AS stock_state, sm.qty::bigint AS qty_delta
      FROM stock_movements sm
      WHERE sm.to_location_id IS NOT NULL
      UNION ALL
      SELECT sm.product_id, sm.from_location_id AS location_id, sm.from_state AS stock_state, -(sm.qty::bigint) AS qty_delta
      FROM stock_movements sm
      WHERE sm.from_location_id IS NOT NULL
    ),
    balances AS (
      SELECT
        sl.location_type,
        d.product_id,
        d.stock_state,
        SUM(d.qty_delta) AS balance_qty
      FROM deltas d
      JOIN stock_locations sl ON sl.id = d.location_id
      GROUP BY sl.location_type, d.product_id, d.stock_state
    ),
    latest_prices AS (
      SELECT DISTINCT ON (pp.product_id)
        pp.product_id,
        pp.price
      FROM product_prices pp
      WHERE pp.effective_from <= CURRENT_DATE
        AND (pp.effective_to IS NULL OR pp.effective_to > CURRENT_DATE)
      ORDER BY pp.product_id, pp.effective_from DESC
    )
    SELECT
      p.id,
      p.name,
      p.bottle_type AS "type",
      COALESCE(lp.price, 0) AS price,
      COALESCE(SUM(b.balance_qty) FILTER (WHERE b.location_type = 'WAREHOUSE' AND b.stock_state = 'FILLED'), 0) AS "warehouseFilled",
      COALESCE(SUM(b.balance_qty) FILTER (WHERE b.location_type = 'WAREHOUSE' AND b.stock_state = 'EMPTY'), 0) AS "warehouseEmpty",
      COALESCE(SUM(b.balance_qty) FILTER (WHERE b.location_type = 'WAREHOUSE'), 0) AS "warehouseTotal",
      COALESCE(SUM(b.balance_qty) FILTER (WHERE b.location_type = 'DAMAGED'), 0) AS "damagedTotal",
      COALESCE(SUM(b.balance_qty) FILTER (WHERE b.location_type = 'EMPLOYEE'), 0) AS "marketTotal"
    FROM products p
    LEFT JOIN balances b ON b.product_id = p.id
    LEFT JOIN latest_prices lp ON lp.product_id = p.id
    WHERE p.status = 'ACTIVE'
    GROUP BY p.id, p.name, p.bottle_type, lp.price
    ORDER BY p.name ASC
    `,
  );

  return NextResponse.json({ success: true, rows: result.rows });
}

