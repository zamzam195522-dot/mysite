import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type Params = { id: string };

function parseId(params: Params) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const vendorId = parseId(resolvedParams);
  if (!vendorId) return NextResponse.json({ success: false, message: 'Invalid vendor id' }, { status: 400 });

  const url = new URL(request.url);
  const fromDate = url.searchParams.get('from');
  const toDate = url.searchParams.get('to');

  const hasFrom = fromDate && /^\d{4}-\d{2}-\d{2}$/.test(fromDate);
  const hasTo = toDate && /^\d{4}-\d{2}-\d{2}$/.test(toDate);

  if ((fromDate && !hasFrom) || (toDate && !hasTo)) {
    return NextResponse.json({ success: false, message: 'Invalid date filter' }, { status: 400 });
  }

  const pool = getDbPool();
  const result = await pool.query(
    `
    WITH purchase_events AS (
      SELECT
        vp.vendor_id,
        vp.purchase_date AS event_date,
        'PURCHASE'::text AS event_type,
        ('PUR-' || vp.id::text) AS ref_no,
        COALESCE(vp.remarks, '') AS description,
        vp.total_amount AS debit,
        0::numeric(12,2) AS credit
      FROM vendor_purchases vp
      WHERE vp.status = 'POSTED'
        AND vp.vendor_id = $1
        AND ($2::date IS NULL OR vp.purchase_date >= $2::date)
        AND ($3::date IS NULL OR vp.purchase_date <= $3::date)
    ),
    payment_events AS (
      SELECT
        vpay.vendor_id,
        vpay.payment_date AS event_date,
        'PAYMENT'::text AS event_type,
        ('VPAY-' || vpay.id::text) AS ref_no,
        COALESCE(vpay.remarks, '') AS description,
        0::numeric(12,2) AS debit,
        vpay.amount AS credit
      FROM vendor_payments vpay
      WHERE vpay.status = 'POSTED'
        AND vpay.vendor_id = $1
        AND ($2::date IS NULL OR vpay.payment_date >= $2::date)
        AND ($3::date IS NULL OR vpay.payment_date <= $3::date)
    ),
    events AS (
      SELECT * FROM purchase_events
      UNION ALL
      SELECT * FROM payment_events
    )
    SELECT
      event_date AS "date",
      event_type AS "type",
      ref_no AS "refNo",
      description,
      debit,
      credit,
      SUM(debit - credit) OVER (
        PARTITION BY vendor_id
        ORDER BY event_date, event_type, ref_no
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS balance
    FROM events
    ORDER BY event_date, event_type, ref_no
    `,
    [vendorId, hasFrom ? fromDate : null, hasTo ? toDate : null],
  );

  return NextResponse.json({ success: true, ledger: result.rows });
}

