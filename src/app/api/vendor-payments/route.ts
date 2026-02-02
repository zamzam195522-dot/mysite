import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type NewVendorPaymentRequest = {
  vendorId: number | string;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
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
      vp.payment_date AS "paymentDate",
      vp.amount,
      vp.remarks,
      vp.status
    FROM vendor_payments vp
    JOIN vendors v ON v.id = vp.vendor_id
    WHERE ($1::bigint IS NULL OR vp.vendor_id = $1::bigint)
    ORDER BY vp.payment_date DESC, vp.id DESC
    LIMIT $2
    `,
    [vendorId, safeLimit],
  );

  return NextResponse.json({ success: true, payments: result.rows });
}

export async function POST(request: Request) {
  let body: Partial<NewVendorPaymentRequest>;
  try {
    body = (await request.json()) as Partial<NewVendorPaymentRequest>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (body.vendorId === undefined || !body.paymentDate || body.amount === undefined || body.amount === null) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const vendorId = Number(body.vendorId);
  const amount = Number(body.amount);
  const paymentDate = String(body.paymentDate).trim();
  const remarks = body.remarks === undefined || body.remarks === null ? null : String(body.remarks).trim();

  if (!Number.isInteger(vendorId) || vendorId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid vendorId' }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid amount' }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
    return NextResponse.json({ success: false, message: 'Invalid paymentDate' }, { status: 400 });
  }

  const pool = getDbPool();
  const result = await pool.query(
    `
    INSERT INTO vendor_payments (vendor_id, payment_date, amount, remarks, status)
    VALUES ($1, $2, $3, $4, 'POSTED')
    RETURNING id, vendor_id AS "vendorId", payment_date AS "paymentDate", amount, remarks, status
    `,
    [vendorId, paymentDate, amount, remarks],
  );

  return NextResponse.json({ success: true, payment: result.rows[0] });
}

