-- Example reporting queries (PostgreSQL)
-- These queries match the intent of your UI screens (ledger, outstanding, stock balance, daily sales, vendor ledger, expenditure).

-- =========================
-- Customer outstanding + bottle balance (Balance Sheet screen)
-- =========================
-- Outstanding amount is computed as:
--   opening_balance
-- + sum(posted invoice totals)
-- - sum(posted payments (cash) + discount/tax adjustments)
--
-- Bottle balance uses returnable products:
--   bottles_in_market = sum(sale_qty - return_qty) for products.is_returnable = true

WITH invoice_totals AS (
  SELECT
    si.customer_id,
    SUM(si.total_amount) AS invoiced_total
  FROM sales_invoices si
  WHERE si.status = 'POSTED'
  GROUP BY si.customer_id
),
payment_totals AS (
  SELECT
    cp.customer_id,
    SUM(cp.received_amount + cp.discount_tax_amount) AS settled_total
  FROM customer_payments cp
  WHERE cp.status = 'POSTED'
  GROUP BY cp.customer_id
),
bottle_totals AS (
  SELECT
    si.customer_id,
    SUM(sii.sale_qty - sii.return_qty) AS bottles_in_market
  FROM sales_invoices si
  JOIN sales_invoice_items sii ON sii.invoice_id = si.id
  JOIN products p ON p.id = sii.product_id
  WHERE si.status = 'POSTED' AND p.is_returnable = true
  GROUP BY si.customer_id
)
SELECT
  c.id,
  c.code AS customer_code,
  c.name AS customer_name,
  COALESCE(it.invoiced_total, 0) AS invoiced_total,
  COALESCE(pt.settled_total, 0) AS settled_total,
  c.opening_balance,
  (c.opening_balance + COALESCE(it.invoiced_total, 0) - COALESCE(pt.settled_total, 0)) AS outstanding_amount,
  COALESCE(bt.bottles_in_market, 0) AS bottles_in_market
FROM customers c
LEFT JOIN invoice_totals it ON it.customer_id = c.id
LEFT JOIN payment_totals pt ON pt.customer_id = c.id
LEFT JOIN bottle_totals bt ON bt.customer_id = c.id
ORDER BY c.code;

-- =========================
-- Customer ledger with running balance (Ledger screen)
-- =========================
-- Produces a chronological event stream for a single customer.
-- Replace :customer_id with your parameter.

WITH invoice_events AS (
  SELECT
    si.customer_id,
    si.order_date AS event_date,
    'INVOICE'::text AS event_type,
    si.invoice_no AS ref_no,
    si.bill_no AS bill_no,
    si.total_amount AS debit,
    0::numeric(12,2) AS credit
  FROM sales_invoices si
  WHERE si.status = 'POSTED'
),
payment_events AS (
  SELECT
    cp.customer_id,
    cp.payment_date AS event_date,
    'PAYMENT'::text AS event_type,
    ('PMT-' || cp.id::text) AS ref_no,
    NULL::text AS bill_no,
    0::numeric(12,2) AS debit,
    (cp.received_amount + cp.discount_tax_amount) AS credit
  FROM customer_payments cp
  WHERE cp.status = 'POSTED'
),
events AS (
  SELECT * FROM invoice_events
  UNION ALL
  SELECT * FROM payment_events
)
SELECT
  e.event_date,
  e.event_type,
  e.ref_no,
  e.bill_no,
  e.debit,
  e.credit,
  SUM(e.debit - e.credit) OVER (
    PARTITION BY e.customer_id
    ORDER BY e.event_date, e.event_type, e.ref_no
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_balance
FROM events e
WHERE e.customer_id = :customer_id
ORDER BY e.event_date, e.event_type, e.ref_no;

-- =========================
-- Sales history (date-wise / customer-wise / product-wise)
-- =========================
-- Date-wise product summary between :from and :to.

SELECT
  si.order_date,
  p.name AS product,
  SUM(sii.sale_qty) AS sale_qty,
  SUM(sii.return_qty) AS return_qty,
  SUM(sii.line_amount) AS amount
FROM sales_invoices si
JOIN sales_invoice_items sii ON sii.invoice_id = si.id
JOIN products p ON p.id = sii.product_id
WHERE si.status = 'POSTED'
  AND si.order_date BETWEEN :from_date AND :to_date
GROUP BY si.order_date, p.name
ORDER BY si.order_date, p.name;

-- Monthly sales summary (matches Monthly Sales intent)
SELECT
  date_trunc('month', si.order_date)::date AS month,
  SUM(si.total_amount) AS total_sales_amount
FROM sales_invoices si
WHERE si.status = 'POSTED'
GROUP BY date_trunc('month', si.order_date)
ORDER BY month;

-- Salesman report (amount by salesman)
SELECT
  e.code AS salesman_code,
  e.name AS salesman_name,
  SUM(si.total_amount) AS total_sales_amount
FROM sales_invoices si
LEFT JOIN employees e ON e.id = si.salesman_employee_id
WHERE si.status = 'POSTED'
  AND si.order_date BETWEEN :from_date AND :to_date
GROUP BY e.code, e.name
ORDER BY total_sales_amount DESC NULLS LAST;

-- =========================
-- Stock balance (Warehouse / Market / Damaged)
-- =========================
-- This produces balances per location, product, and stock state by summing movements.
-- Balance formula:
--   +qty when movement arrives to (location,state)
--   -qty when movement leaves from (location,state)

WITH deltas AS (
  SELECT
    sm.product_id,
    sm.to_location_id AS location_id,
    sm.to_state AS stock_state,
    sm.qty::bigint AS qty_delta
  FROM stock_movements sm
  WHERE sm.to_location_id IS NOT NULL
  UNION ALL
  SELECT
    sm.product_id,
    sm.from_location_id AS location_id,
    sm.from_state AS stock_state,
    -(sm.qty::bigint) AS qty_delta
  FROM stock_movements sm
  WHERE sm.from_location_id IS NOT NULL
)
SELECT
  sl.location_type,
  sl.code AS location_code,
  sl.name AS location_name,
  p.name AS product_name,
  d.stock_state,
  SUM(d.qty_delta) AS balance_qty
FROM deltas d
JOIN stock_locations sl ON sl.id = d.location_id
JOIN products p ON p.id = d.product_id
GROUP BY sl.location_type, sl.code, sl.name, p.name, d.stock_state
ORDER BY sl.location_type, sl.code, p.name, d.stock_state;

-- “Warehouse / Market Stock Balance” style rollup:
-- - Warehouse filled/empty/total
-- - Damaged (any state)
-- - Market total = sum over EMPLOYEE locations (any state you care about; usually FILLED and EMPTY)

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
)
SELECT
  p.name AS product_name,
  COALESCE(SUM(b.balance_qty) FILTER (WHERE b.location_type = 'WAREHOUSE' AND b.stock_state = 'FILLED'), 0) AS warehouse_filled,
  COALESCE(SUM(b.balance_qty) FILTER (WHERE b.location_type = 'WAREHOUSE' AND b.stock_state = 'EMPTY'), 0) AS warehouse_empty,
  COALESCE(SUM(b.balance_qty) FILTER (WHERE b.location_type = 'WAREHOUSE'), 0) AS warehouse_total,
  COALESCE(SUM(b.balance_qty) FILTER (WHERE b.location_type = 'DAMAGED'), 0) AS damaged_total,
  COALESCE(SUM(b.balance_qty) FILTER (WHERE b.location_type = 'EMPLOYEE'), 0) AS market_total
FROM products p
LEFT JOIN balances b ON b.product_id = p.id
GROUP BY p.name
ORDER BY p.name;

-- =========================
-- Vendor ledger (Vendor Ledger screen)
-- =========================
-- Running balance where:
-- - Purchases increase payable (debit)
-- - Payments reduce payable (credit)

WITH purchase_events AS (
  SELECT
    vp.vendor_id,
    vp.purchase_date AS event_date,
    'PURCHASE'::text AS event_type,
    ('PUR-' || vp.id::text) AS ref_no,
    vp.total_amount AS debit,
    0::numeric(12,2) AS credit
  FROM vendor_purchases vp
  WHERE vp.status = 'POSTED'
),
payment_events AS (
  SELECT
    vpay.vendor_id,
    vpay.payment_date AS event_date,
    'PAYMENT'::text AS event_type,
    ('VPAY-' || vpay.id::text) AS ref_no,
    0::numeric(12,2) AS debit,
    vpay.amount AS credit
  FROM vendor_payments vpay
  WHERE vpay.status = 'POSTED'
),
events AS (
  SELECT * FROM purchase_events
  UNION ALL
  SELECT * FROM payment_events
)
SELECT
  e.event_date,
  e.event_type,
  e.ref_no,
  e.debit,
  e.credit,
  SUM(e.debit - e.credit) OVER (
    PARTITION BY e.vendor_id
    ORDER BY e.event_date, e.event_type, e.ref_no
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_balance
FROM events e
WHERE e.vendor_id = :vendor_id
ORDER BY e.event_date, e.event_type, e.ref_no;

-- =========================
-- Expenditure details (Expenditure screen)
-- =========================

-- Detailed rows with filters
SELECT
  eh.name AS head_name,
  e.expense_date,
  e.description,
  e.amount
FROM expenses e
JOIN expense_heads eh ON eh.id = e.head_id
WHERE e.expense_date BETWEEN :from_date AND :to_date
  AND (:head_id IS NULL OR e.head_id = :head_id)
ORDER BY e.expense_date DESC, eh.name;

-- Group-wise totals (when GroupWise is checked)
SELECT
  eh.name AS head_name,
  SUM(e.amount) AS total_amount
FROM expenses e
JOIN expense_heads eh ON eh.id = e.head_id
WHERE e.expense_date BETWEEN :from_date AND :to_date
GROUP BY eh.name
ORDER BY total_amount DESC;

