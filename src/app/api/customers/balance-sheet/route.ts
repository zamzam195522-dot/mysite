import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET() {
  const pool = getDbPool();

  try {
    // Get customer balance summary with outstanding amounts, bottles in market, and credit
    const result = await pool.query(
      `
      SELECT 
        c.id,
        c.code,
        c.name,
        c.contact,
        c.address,
        c.status,
        COALESCE(c.opening_balance, 0) as opening_balance,
        -- Calculate outstanding: opening_balance + invoice_total - payments_received
        COALESCE(c.opening_balance, 0) + 
        COALESCE(
          (SELECT COALESCE(SUM(si.total_amount), 0)
           FROM sales_invoices si
           WHERE si.customer_id = c.id AND si.status = 'POSTED'), 0
        ) -
        COALESCE(
          (SELECT COALESCE(SUM(cp.received_amount), 0)
           FROM customer_payments cp
           WHERE cp.customer_id = c.id AND cp.status = 'POSTED'), 0
        ) as outstanding,
        -- Calculate bottles in market (filled bottles - returned bottles)
        COALESCE(
          (SELECT COALESCE(SUM(smi.sale_qty - smi.return_qty), 0)
           FROM sales_invoice_items smi
           JOIN sales_invoices si ON si.id = smi.invoice_id
           WHERE si.customer_id = c.id AND si.status = 'POSTED'
           AND smi.product_id IN (SELECT id FROM products WHERE is_returnable = true)), 0
        ) as bottles_in_market,
        -- Calculate 19 LTR bottles specifically
        COALESCE(
          (SELECT COALESCE(SUM(smi.sale_qty - smi.return_qty), 0)
           FROM sales_invoice_items smi
           JOIN sales_invoices si ON si.id = smi.invoice_id
           WHERE si.customer_id = c.id AND si.status = 'POSTED'
           AND smi.product_id IN (SELECT id FROM products WHERE is_returnable = true AND name ILIKE '%19%LTR%')), 0
        ) as bottles_19ltr,
        -- Calculate credit (security deposits)
        COALESCE(
          (SELECT COALESCE(SUM(cs.amount), 0)
           FROM customer_security_deposits cs
           WHERE cs.customer_id = c.id), 0
        ) -
        COALESCE(
          (SELECT COALESCE(SUM(csr.amount), 0)
           FROM customer_security_refunds csr
           WHERE csr.customer_id = c.id), 0
        ) as credit,
        -- Calculate total amount received
        COALESCE(
          (SELECT COALESCE(SUM(cp.received_amount), 0)
           FROM customer_payments cp
           WHERE cp.customer_id = c.id AND cp.status = 'POSTED'), 0
        ) as amount_received
      FROM customers c
      WHERE c.status = 'ACTIVE'
      ORDER BY c.code ASC
      `,
    );

    // Calculate totals
    const totals = result.rows.reduce(
      (acc, row) => ({
        totalOutstanding: acc.totalOutstanding + parseFloat(row.outstanding || 0),
        totalBottles: acc.totalBottles + parseInt(row.bottles_in_market || 0),
        totalBottles19ltr: acc.totalBottles19ltr + parseInt(row.bottles_19ltr || 0),
        totalCredit: acc.totalCredit + parseFloat(row.credit || 0),
        totalAmountReceived: acc.totalAmountReceived + parseFloat(row.amount_received || 0),
      }),
      { totalOutstanding: 0, totalBottles: 0, totalBottles19ltr: 0, totalCredit: 0, totalAmountReceived: 0 }
    );

    const balanceData = result.rows.map(row => ({
      id: row.id,
      code: row.code,
      customer: row.name,
      contact: row.contact || '',
      address: row.address || '',
      status: row.status || 'ACTIVE',
      outstanding: parseFloat(row.outstanding || 0).toFixed(2),
      bottles: parseInt(row.bottles_in_market || 0),
      bottles19ltr: parseInt(row.bottles_19ltr || 0),
      credit: parseFloat(row.credit || 0).toFixed(2),
      amountReceived: parseFloat(row.amount_received || 0).toFixed(2),
    }));

    return NextResponse.json({
      success: true,
      customers: balanceData,
      totals: {
        outstanding: totals.totalOutstanding.toFixed(2),
        bottles: totals.totalBottles,
        bottles19ltr: totals.totalBottles19ltr,
        credit: totals.totalCredit.toFixed(2),
        amountReceived: totals.totalAmountReceived.toFixed(2),
      }
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message ? String(e.message) : 'Failed to fetch balance sheet data' },
      { status: 500 },
    );
  }
}
