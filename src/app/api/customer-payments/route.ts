import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type NewCustomerPaymentRequest = {
  customerId: number | string;
  receiverEmployeeId?: number | string | null;
  paymentDate: string; // YYYY-MM-DD
  method: 'CASH' | 'BANK' | 'CHEQUE';
  bankId?: number | string | null;
  chequeNo?: string | null;
  paymentMode?: string | null;
  receivedAmount: number;
  discountTaxAmount?: number;
  remarks?: string | null;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const customerIdParam = url.searchParams.get('customerId');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const limitParam = url.searchParams.get('limit');

  const customerId = customerIdParam ? Number(customerIdParam) : null;
  if (customerId !== null && (!Number.isInteger(customerId) || customerId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid customerId' }, { status: 400 });
  }

  const hasFrom = from && /^\d{4}-\d{2}-\d{2}$/.test(from);
  const hasTo = to && /^\d{4}-\d{2}-\d{2}$/.test(to);
  if ((from && !hasFrom) || (to && !hasTo)) {
    return NextResponse.json({ success: false, message: 'Invalid date filter' }, { status: 400 });
  }

  const limit = limitParam ? Number(limitParam) : 50;
  const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 200 ? Math.floor(limit) : 50;

  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT
      cp.id,
      cp.customer_id AS "customerId",
      c.code AS "customerCode",
      c.name AS "customerName",
      cp.receiver_employee_id AS "receiverEmployeeId",
      e.name AS "receiverName",
      cp.payment_date AS "paymentDate",
      cp.method,
      cp.bank_id AS "bankId",
      b.name AS "bankName",
      cp.cheque_no AS "chequeNo",
      cp.payment_mode AS "paymentMode",
      cp.received_amount AS "receivedAmount",
      cp.discount_tax_amount AS "discountTaxAmount",
      cp.remarks,
      cp.status
    FROM customer_payments cp
    JOIN customers c ON c.id = cp.customer_id
    LEFT JOIN employees e ON e.id = cp.receiver_employee_id
    LEFT JOIN banks b ON b.id = cp.bank_id
    WHERE ($1::bigint IS NULL OR cp.customer_id = $1::bigint)
      AND ($2::date IS NULL OR cp.payment_date >= $2::date)
      AND ($3::date IS NULL OR cp.payment_date <= $3::date)
    ORDER BY cp.payment_date DESC, cp.id DESC
    LIMIT $4
    `,
    [customerId, hasFrom ? from : null, hasTo ? to : null, safeLimit],
  );

  return NextResponse.json({ success: true, payments: result.rows });
}

export async function POST(request: Request) {
  let body: Partial<NewCustomerPaymentRequest>;
  try {
    body = (await request.json()) as Partial<NewCustomerPaymentRequest>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (!body.customerId || !body.paymentDate || !body.method || body.receivedAmount === undefined || body.receivedAmount === null) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const customerId = Number(body.customerId);
  if (!Number.isInteger(customerId) || customerId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid customerId' }, { status: 400 });
  }

  const receiverEmployeeIdRaw = body.receiverEmployeeId;
  const receiverEmployeeId =
    receiverEmployeeIdRaw === undefined || receiverEmployeeIdRaw === null || receiverEmployeeIdRaw === ''
      ? null
      : Number(receiverEmployeeIdRaw);
  if (receiverEmployeeId !== null && (!Number.isInteger(receiverEmployeeId) || receiverEmployeeId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid receiverEmployeeId' }, { status: 400 });
  }

  const paymentDate = String(body.paymentDate).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
    return NextResponse.json({ success: false, message: 'Invalid paymentDate' }, { status: 400 });
  }

  const method = String(body.method).toUpperCase() as NewCustomerPaymentRequest['method'];
  if (!['CASH', 'BANK', 'CHEQUE'].includes(method)) {
    return NextResponse.json({ success: false, message: 'Invalid method' }, { status: 400 });
  }

  const bankIdRaw = body.bankId;
  const bankId = bankIdRaw === undefined || bankIdRaw === null || bankIdRaw === '' ? null : Number(bankIdRaw);
  if (bankId !== null && (!Number.isInteger(bankId) || bankId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid bankId' }, { status: 400 });
  }

  const chequeNo = body.chequeNo === undefined || body.chequeNo === null ? null : String(body.chequeNo).trim();
  const paymentMode = body.paymentMode === undefined || body.paymentMode === null ? null : String(body.paymentMode).trim();
  const remarks = body.remarks === undefined || body.remarks === null ? null : String(body.remarks).trim();

  const receivedAmount = Number(body.receivedAmount);
  const discountTaxAmount = body.discountTaxAmount === undefined ? 0 : Number(body.discountTaxAmount);

  if (!Number.isFinite(receivedAmount) || receivedAmount < 0) {
    return NextResponse.json({ success: false, message: 'Invalid receivedAmount' }, { status: 400 });
  }
  if (!Number.isFinite(discountTaxAmount)) {
    return NextResponse.json({ success: false, message: 'Invalid discountTaxAmount' }, { status: 400 });
  }

  // Enforce method-specific rules similar to schema CHECK
  if (method === 'CASH') {
    if (bankId !== null || chequeNo) {
      return NextResponse.json({ success: false, message: 'Cash payment cannot have bank/cheque' }, { status: 400 });
    }
  }
  if (method === 'BANK') {
    if (bankId === null) {
      return NextResponse.json({ success: false, message: 'Bank payment requires bankId' }, { status: 400 });
    }
  }
  if (method === 'CHEQUE') {
    if (!chequeNo) {
      return NextResponse.json({ success: false, message: 'Cheque payment requires chequeNo' }, { status: 400 });
    }
  }

  const pool = getDbPool();
  const result = await pool.query(
    `
    INSERT INTO customer_payments (
      customer_id, receiver_employee_id, payment_date,
      method, bank_id, cheque_no, payment_mode,
      received_amount, discount_tax_amount, remarks, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'POSTED')
    RETURNING id
    `,
    [
      customerId,
      receiverEmployeeId,
      paymentDate,
      method,
      bankId,
      chequeNo,
      paymentMode,
      receivedAmount,
      discountTaxAmount,
      remarks,
    ],
  );

  return NextResponse.json({ success: true, paymentId: result.rows[0].id });
}

