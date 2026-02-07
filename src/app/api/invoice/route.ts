import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get('invoiceId');

  if (!invoiceId) {
    return NextResponse.json({ success: false, message: 'Missing invoiceId' }, { status: 400 });
  }

  const pool = getDbPool();

  try {
    // Get invoice details
    const invoiceResult = await pool.query(
      `
      SELECT 
        si.invoice_no AS "invoiceNo",
        si.order_date AS "orderDate",
        si.bill_book_no AS "billBookNo",
        c.code AS "customerCode",
        c.name AS "customerName",
        e.name AS "salesmanName",
        si.subtotal_amount AS "subtotalAmount",
        si.total_amount AS "totalAmount"
      FROM sales_invoices si
      JOIN customers c ON c.id = si.customer_id
      LEFT JOIN employees e ON e.id = si.salesman_employee_id
      WHERE si.id = $1
      `,
      [invoiceId],
    );

    if (invoiceResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });
    }

    // Get invoice items
    const itemsResult = await pool.query(
      `
      SELECT 
        p.name AS "productName",
        sii.unit_price AS "unitPrice",
        sii.sale_qty AS "saleQty",
        sii.return_qty AS "returnQty",
        sii.line_amount AS "lineAmount"
      FROM sales_invoice_items sii
      JOIN products p ON p.id = sii.product_id
      WHERE sii.invoice_id = $1
      ORDER BY sii.line_no
      `,
      [invoiceId],
    );

    // Get payment information if available
    const paymentResult = await pool.query(
      `
      SELECT 
        cp.method AS "paymentMethod",
        cp.received_amount AS "receivedAmount"
      FROM customer_payments cp
      JOIN customer_payment_allocations cpa ON cpa.payment_id = cp.id
      WHERE cpa.invoice_id = $1
      ORDER BY cp.created_at DESC
      LIMIT 1
      `,
      [invoiceId],
    );

    const invoiceData = {
      ...invoiceResult.rows[0],
      items: itemsResult.rows,
      paymentMethod: paymentResult.rows[0]?.paymentMethod || null,
      receivedAmount: paymentResult.rows[0]?.receivedAmount || null,
      mobileNumbers: ['9203786918', '9203786919', '9203786920'],
      upiId: '9993786918@pz',
      qrCode: null, // You can add a QR code image URL here later
      gstNo: '23FGSPS9732Q2Z3',
    };

    return NextResponse.json({ success: true, invoiceData });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message ? String(e.message) : 'Failed to fetch invoice' },
      { status: 500 },
    );
  }
}
