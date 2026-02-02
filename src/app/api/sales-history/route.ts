import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const customerIdParam = url.searchParams.get('customerId');

  const customerId = customerIdParam ? Number(customerIdParam) : null;
  if (customerId !== null && (!Number.isInteger(customerId) || customerId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid customerId' }, { status: 400 });
  }

  const hasFrom = from && /^\d{4}-\d{2}-\d{2}$/.test(from);
  const hasTo = to && /^\d{4}-\d{2}-\d{2}$/.test(to);
  if ((from && !hasFrom) || (to && !hasTo)) {
    return NextResponse.json({ success: false, message: 'Invalid date filter' }, { status: 400 });
  }

  const pool = getDbPool();

  // Get invoices with customer info
  const invoiceResult = await pool.query(
    `
    SELECT
      si.id AS "invoiceId",
      si.invoice_no AS "invoiceNo",
      si.order_date AS "date",
      c.id AS "customerId",
      c.code AS "customerCode",
      c.name AS "customer",
      e.name AS "salesmanName",
      si.total_amount AS "totalAmount"
    FROM sales_invoices si
    JOIN customers c ON c.id = si.customer_id
    LEFT JOIN employees e ON e.id = si.salesman_employee_id
    WHERE si.status = 'POSTED'
      AND ($1::bigint IS NULL OR si.customer_id = $1::bigint)
      AND ($2::date IS NULL OR si.order_date >= $2::date)
      AND ($3::date IS NULL OR si.order_date <= $3::date)
    ORDER BY si.order_date DESC, si.id DESC
    LIMIT 200
    `,
    [customerId, hasFrom ? from : null, hasTo ? to : null],
  );

  // Get items for all invoices
  const itemsResult = await pool.query(
    `
    SELECT
      sii.invoice_id AS "invoiceId",
      p.id AS "productId",
      p.name AS "product",
      sii.sale_qty AS "qty",
      sii.return_qty AS "returnQty",
      sii.line_amount AS "amount"
    FROM sales_invoice_items sii
    JOIN products p ON p.id = sii.product_id
    JOIN sales_invoices si ON si.id = sii.invoice_id
    WHERE si.status = 'POSTED'
      AND ($1::bigint IS NULL OR si.customer_id = $1::bigint)
      AND ($2::date IS NULL OR si.order_date >= $2::date)
      AND ($3::date IS NULL OR si.order_date <= $3::date)
    ORDER BY sii.invoice_id, sii.line_no
    `,
    [customerId, hasFrom ? from : null, hasTo ? to : null],
  );

  // Group items by invoice
  const itemsByInvoice = new Map();
  itemsResult.rows.forEach(item => {
    if (!itemsByInvoice.has(item.invoiceId)) {
      itemsByInvoice.set(item.invoiceId, []);
    }
    itemsByInvoice.get(item.invoiceId).push({
      productId: item.productId,
      product: item.product,
      qty: item.qty,
      returnQty: item.returnQty,
      amount: item.amount,
    });
  });

  // Combine invoice data with items
  const invoices = invoiceResult.rows.map(invoice => ({
    ...invoice,
    items: itemsByInvoice.get(invoice.invoiceId) || [],
  }));

  return NextResponse.json({ success: true, invoices });
}

