import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type NewSalesInvoiceItem = {
  productId: number | string;
  unitPrice: number;
  saleQty: number;
  returnQty?: number;
};

type NewSalesInvoiceRequest = {
  customerId: number | string;
  salesmanEmployeeId?: number | string | null;
  orderDate: string; // YYYY-MM-DD
  invoiceNo?: string | null;
  billNo?: string | null;
  billBookNo?: string | null;
  remarks?: string | null;
  paymentMethod?: 'CASH' | 'BANK' | 'CREDIT';
  receivedAmount?: number | null;
  items: NewSalesInvoiceItem[];
};

async function getOrCreateWarehouseLocationId(client: any) {
  const existing = await client.query(
    `SELECT id FROM stock_locations WHERE location_type = 'WAREHOUSE' LIMIT 1`,
  );
  if (existing.rows[0]) return Number(existing.rows[0].id);

  const created = await client.query(
    `
    INSERT INTO stock_locations (code, name, location_type, status)
    VALUES ('WH-001', 'Warehouse', 'WAREHOUSE', 'ACTIVE')
    RETURNING id
    `,
  );
  return Number(created.rows[0].id);
}

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
  const result = await pool.query(
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
    WHERE ($1::bigint IS NULL OR si.customer_id = $1::bigint)
      AND ($2::date IS NULL OR si.order_date >= $2::date)
      AND ($3::date IS NULL OR si.order_date <= $3::date)
    ORDER BY si.order_date DESC, si.id DESC
    LIMIT 200
    `,
    [customerId, hasFrom ? from : null, hasTo ? to : null],
  );

  return NextResponse.json({ success: true, invoices: result.rows });
}

export async function POST(request: Request) {
  let body: Partial<NewSalesInvoiceRequest>;
  try {
    body = (await request.json()) as Partial<NewSalesInvoiceRequest>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (!body.customerId || !body.orderDate || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const customerId = Number(body.customerId);
  if (!Number.isInteger(customerId) || customerId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid customerId' }, { status: 400 });
  }

  const salesmanEmployeeIdRaw = body.salesmanEmployeeId;
  const salesmanEmployeeId =
    salesmanEmployeeIdRaw === undefined || salesmanEmployeeIdRaw === null || salesmanEmployeeIdRaw === ''
      ? null
      : Number(salesmanEmployeeIdRaw);
  if (salesmanEmployeeId !== null && (!Number.isInteger(salesmanEmployeeId) || salesmanEmployeeId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid salesmanEmployeeId' }, { status: 400 });
  }

  const orderDate = String(body.orderDate).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(orderDate)) {
    return NextResponse.json({ success: false, message: 'Invalid orderDate' }, { status: 400 });
  }

  const remarks = body.remarks === undefined || body.remarks === null ? null : String(body.remarks).trim();
  const billNo = body.billNo === undefined || body.billNo === null ? null : String(body.billNo).trim();
  const billBookNo = body.billBookNo === undefined || body.billBookNo === null ? null : String(body.billBookNo).trim();
  const invoiceNoInput = body.invoiceNo === undefined || body.invoiceNo === null ? null : String(body.invoiceNo).trim();
  const paymentMethod = body.paymentMethod || 'CASH';
  const receivedAmount = body.receivedAmount ? Number(body.receivedAmount) : null;

  const items = body.items.map((i) => ({
    productId: Number(i.productId),
    unitPrice: Number(i.unitPrice),
    saleQty: Math.floor(Number(i.saleQty)),
    returnQty: Math.floor(Number(i.returnQty ?? 0)),
  }));

  for (const it of items) {
    if (!Number.isInteger(it.productId) || it.productId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid productId in items' }, { status: 400 });
    }
    if (!Number.isFinite(it.unitPrice) || it.unitPrice < 0) {
      return NextResponse.json({ success: false, message: 'Invalid unitPrice in items' }, { status: 400 });
    }
    if (!Number.isInteger(it.saleQty) || it.saleQty < 0) {
      return NextResponse.json({ success: false, message: 'Invalid saleQty in items' }, { status: 400 });
    }
    if (!Number.isInteger(it.returnQty) || it.returnQty < 0) {
      return NextResponse.json({ success: false, message: 'Invalid returnQty in items' }, { status: 400 });
    }
    if (it.saleQty === 0 && it.returnQty === 0) {
      return NextResponse.json({ success: false, message: 'Each item must have qty or return' }, { status: 400 });
    }
  }

  const subtotalAmount = items.reduce((sum, it) => sum + it.unitPrice * it.saleQty, 0);
  const discountTaxAmount = 0;
  const totalAmount = subtotalAmount + discountTaxAmount;

  const pool = getDbPool();
  const seqRes = await pool.query(`SELECT pg_get_serial_sequence('sales_invoices', 'id') AS seq`);
  const seq = String(seqRes.rows?.[0]?.seq ?? '').trim();
  if (!seq) {
    return NextResponse.json({ success: false, message: 'Could not resolve sales_invoices id sequence' }, { status: 500 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const warehouseLocationId = await getOrCreateWarehouseLocationId(client);

    // Allocate invoice id so we can generate invoice_no if not provided.
    const idRes = await client.query(`SELECT nextval($1::regclass) AS id`, [seq]);
    const invoiceId = Number(idRes.rows[0].id);

    const invoiceNo = invoiceNoInput || `INV-${String(invoiceId).padStart(3, '0')}`;

    await client.query(
      `
      INSERT INTO sales_invoices (
        id, invoice_no, bill_no, bill_book_no,
        customer_id, salesman_employee_id,
        order_date, status,
        subtotal_amount, discount_tax_amount, total_amount,
        remarks
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'POSTED', $8, $9, $10, $11)
      `,
      [
        invoiceId,
        invoiceNo,
        billNo,
        billBookNo,
        customerId,
        salesmanEmployeeId,
        orderDate,
        subtotalAmount,
        discountTaxAmount,
        totalAmount,
        remarks,
      ],
    );

    for (let i = 0; i < items.length; i++) {
      const it = items[i]!;
      const lineAmount = it.unitPrice * it.saleQty;

      await client.query(
        `
        INSERT INTO sales_invoice_items (
          invoice_id, line_no, product_id, unit_price,
          sale_qty, return_qty, line_amount
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [invoiceId, i + 1, it.productId, it.unitPrice, it.saleQty, it.returnQty, lineAmount],
      );

      // Stock movements (simple, warehouse-based)
      if (it.saleQty > 0) {
        await client.query(
          `
          INSERT INTO stock_movements (
            occurred_on, movement_type, product_id, qty,
            from_location_id, to_location_id,
            from_state, to_state,
            remarks, sales_invoice_id
          )
          VALUES ($1, 'SALE', $2, $3, $4, NULL, 'FILLED', 'NA', $5, $6)
          `,
          [orderDate, it.productId, it.saleQty, warehouseLocationId, remarks, invoiceId],
        );
      }
      if (it.returnQty > 0) {
        await client.query(
          `
          INSERT INTO stock_movements (
            occurred_on, movement_type, product_id, qty,
            from_location_id, to_location_id,
            from_state, to_state,
            remarks, sales_invoice_id
          )
          VALUES ($1, 'RETURN', $2, $3, NULL, $4, 'NA', 'EMPTY', $5, $6)
          `,
          [orderDate, it.productId, it.returnQty, warehouseLocationId, remarks, invoiceId],
        );
      }
    }

    // Process payment if not credit
    let paymentId = null;
    if (paymentMethod !== 'CREDIT' && receivedAmount) {
      let bankId = null;

      // For BANK payments, we need to provide a bank_id to satisfy the constraint
      if (paymentMethod === 'BANK') {
        const bankResult = await client.query(
          'SELECT id FROM banks WHERE status = $1 ORDER BY id LIMIT 1',
          ['ACTIVE']
        );

        if (bankResult.rows.length === 0) {
          throw new Error('No active bank found in the system. Please add a bank first.');
        }

        bankId = bankResult.rows[0].id;
      }

      const paymentResult = await client.query(
        `
        INSERT INTO customer_payments (
          customer_id, receiver_employee_id, payment_date, method,
          bank_id, received_amount, status, created_by_user_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'POSTED', NULL)
        RETURNING id
        `,
        [customerId, salesmanEmployeeId, orderDate, paymentMethod, bankId, receivedAmount],
      );
      paymentId = paymentResult.rows[0].id;

      // Create payment allocation for this invoice
      await client.query(
        `
        INSERT INTO customer_payment_allocations (
          payment_id, invoice_id, allocated_amount
        )
        VALUES ($1, $2, $3)
        `,
        [paymentId, invoiceId, receivedAmount],
      );
    }

    await client.query('COMMIT');

    // Get complete invoice data for printing
    const invoiceDataResult = await pool.query(
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

    // Get invoice items for printing
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

    const invoiceData = {
      ...invoiceDataResult.rows[0],
      items: itemsResult.rows,
      paymentMethod,
      receivedAmount,
    };

    return NextResponse.json({ success: true, invoiceId, invoiceNo, invoiceData });
  } catch (e: any) {
    await client.query('ROLLBACK');
    return NextResponse.json(
      { success: false, message: e?.message ? String(e.message) : 'Failed to create invoice' },
      { status: 400 },
    );
  } finally {
    client.release();
  }
}

