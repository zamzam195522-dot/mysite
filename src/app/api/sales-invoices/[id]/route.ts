import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type Params = { id: string };

function parseId(params: Params) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  const pool = getDbPool();
  const invoiceRes = await pool.query(
    `
    SELECT
      si.id,
      si.invoice_no AS "invoiceNo",
      si.bill_no AS "billNo",
      si.bill_book_no AS "billBookNo",
      si.customer_id AS "customerId",
      c.code AS "customerCode",
      c.name AS "customerName",
      si.salesman_employee_id AS "salesmanEmployeeId",
      e.name AS "salesmanName",
      si.order_date AS "orderDate",
      si.status,
      si.subtotal_amount AS "subtotalAmount",
      si.discount_tax_amount AS "discountTaxAmount",
      si.total_amount AS "totalAmount",
      si.remarks
    FROM sales_invoices si
    JOIN customers c ON c.id = si.customer_id
    LEFT JOIN employees e ON e.id = si.salesman_employee_id
    WHERE si.id = $1
    LIMIT 1
    `,
    [id],
  );

  const invoice = invoiceRes.rows[0];
  if (!invoice) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const itemsRes = await pool.query(
    `
    SELECT
      sii.id,
      sii.line_no AS "lineNo",
      sii.product_id AS "productId",
      p.name AS "productName",
      sii.unit_price AS "unitPrice",
      sii.sale_qty AS "saleQty",
      sii.return_qty AS "returnQty",
      sii.line_amount AS "lineAmount"
    FROM sales_invoice_items sii
    JOIN products p ON p.id = sii.product_id
    WHERE sii.invoice_id = $1
    ORDER BY sii.line_no ASC
    `,
    [id],
  );

  return NextResponse.json({ success: true, invoice, items: itemsRes.rows });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  // Soft-cancel invoice
  const pool = getDbPool();
  const result = await pool.query(
    `UPDATE sales_invoices SET status = 'CANCELLED' WHERE id = $1 RETURNING id`,
    [id],
  );
  if (result.rowCount === 0) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}

