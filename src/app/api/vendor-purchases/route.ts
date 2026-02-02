import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type NewVendorPurchaseRequest = {
  vendorId: number | string;
  purchaseDate: string; // YYYY-MM-DD
  productId: number | string;
  qty: number;
  rate: number;
  remarks?: string | null;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const vendorIdParam = url.searchParams.get('vendorId');
  const limitParam = url.searchParams.get('limit');

  const vendorId = vendorIdParam ? Number(vendorIdParam) : null;
  const limit = limitParam ? Number(limitParam) : 20;

  if (vendorId !== null && (!Number.isInteger(vendorId) || vendorId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid vendorId' }, { status: 400 });
  }

  const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 200 ? Math.floor(limit) : 20;

  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT
      vp.id,
      vp.vendor_id AS "vendorId",
      v.name AS "vendorName",
      vp.purchase_date AS "purchaseDate",
      vp.total_amount AS "totalAmount",
      vp.remarks,
      vp.status
    FROM vendor_purchases vp
    JOIN vendors v ON v.id = vp.vendor_id
    WHERE ($1::bigint IS NULL OR vp.vendor_id = $1::bigint)
    ORDER BY vp.purchase_date DESC, vp.id DESC
    LIMIT $2
    `,
    [vendorId, safeLimit],
  );

  return NextResponse.json({ success: true, purchases: result.rows });
}

export async function POST(request: Request) {
  let body: Partial<NewVendorPurchaseRequest>;
  try {
    body = (await request.json()) as Partial<NewVendorPurchaseRequest>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (
    body.vendorId === undefined ||
    !body.purchaseDate ||
    body.productId === undefined ||
    body.qty === undefined ||
    body.rate === undefined
  ) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const vendorId = Number(body.vendorId);
  const productId = Number(body.productId);
  const qty = Number(body.qty);
  const rate = Number(body.rate);
  const purchaseDate = String(body.purchaseDate).trim();
  const remarks = body.remarks === undefined || body.remarks === null ? null : String(body.remarks).trim();

  if (!Number.isInteger(vendorId) || vendorId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid vendorId' }, { status: 400 });
  }
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid productId' }, { status: 400 });
  }
  if (!Number.isFinite(qty) || qty <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid qty' }, { status: 400 });
  }
  if (!Number.isFinite(rate) || rate < 0) {
    return NextResponse.json({ success: false, message: 'Invalid rate' }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
    return NextResponse.json({ success: false, message: 'Invalid purchaseDate' }, { status: 400 });
  }

  const lineAmount = qty * rate;

  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const purchase = await client.query(
      `
      INSERT INTO vendor_purchases (vendor_id, purchase_date, status, subtotal_amount, total_amount, remarks)
      VALUES ($1, $2, 'POSTED', $3, $3, $4)
      RETURNING id, vendor_id AS "vendorId", purchase_date AS "purchaseDate", total_amount AS "totalAmount", remarks, status
      `,
      [vendorId, purchaseDate, lineAmount, remarks],
    );

    const purchaseId = Number(purchase.rows[0].id);

    await client.query(
      `
      INSERT INTO vendor_purchase_items (purchase_id, line_no, product_id, qty, rate, line_amount)
      VALUES ($1, 1, $2, $3, $4, $5)
      `,
      [purchaseId, productId, Math.floor(qty), rate, lineAmount],
    );

    await client.query('COMMIT');

    return NextResponse.json({ success: true, purchase: purchase.rows[0] });
  } catch (e: any) {
    await client.query('ROLLBACK');
    return NextResponse.json(
      { success: false, message: e?.message ? String(e.message) : 'Failed to save purchase' },
      { status: 400 },
    );
  } finally {
    client.release();
  }
}

