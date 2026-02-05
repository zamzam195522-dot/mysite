-- SQL Export Script for Business Reset Tables
-- Generated from fullResetBusiness method

-- Tables with business_id column (can be filtered by business_id)
-- These tables can be safely exported with WHERE business_id = ? condition

-- 1. Transaction related tables
CREATE TABLE IF NOT EXISTS export_transaction_payments AS
SELECT * FROM transaction_payments 
WHERE transaction_id IN (
    SELECT id FROM transactions WHERE business_id = ?
);

CREATE TABLE IF NOT EXISTS export_transaction_sell_lines AS
SELECT * FROM transaction_sell_lines 
WHERE transaction_id IN (
    SELECT id FROM transactions WHERE business_id = ?
);

CREATE TABLE IF NOT EXISTS export_transactions AS
SELECT * FROM transactions WHERE business_id = ?;

-- 2. Product and inventory related tables
CREATE TABLE IF NOT EXISTS export_products AS
SELECT * FROM products WHERE business_id = ?;

CREATE TABLE IF NOT EXISTS export_variations AS
SELECT * FROM variations 
WHERE product_id IN (
    SELECT id FROM products WHERE business_id = ?
);

CREATE TABLE IF NOT EXISTS export_product_variations AS
SELECT * FROM product_variations 
WHERE product_id IN (
    SELECT id FROM products WHERE business_id = ?
);

CREATE TABLE IF NOT EXISTS export_variation_location_details AS
SELECT * FROM variation_location_details 
WHERE location_id IN (
    SELECT id FROM business_locations WHERE business_id = ?
);

CREATE TABLE IF NOT EXISTS export_media AS
SELECT * FROM media 
WHERE model_id IN (
    SELECT id FROM products WHERE business_id = ?
) AND model_type = 'App\\Product';

-- 3. Business setup tables
CREATE TABLE IF NOT EXISTS export_categories AS
SELECT * FROM categories WHERE business_id = ?;

CREATE TABLE IF NOT EXISTS export_brands AS
SELECT * FROM brands WHERE business_id = ?;

CREATE TABLE IF NOT EXISTS export_units AS
SELECT * FROM units 
WHERE business_id = ? AND actual_name != 'Pieces';

CREATE TABLE IF NOT EXISTS export_business_locations AS
SELECT * FROM business_locations WHERE business_id = ?;

-- 4. Customer and supplier tables
CREATE TABLE IF NOT EXISTS export_contacts AS
SELECT * FROM contacts 
WHERE business_id = ? AND name != 'Walk-In Customer';

CREATE TABLE IF NOT EXISTS export_customer_groups AS
SELECT * FROM customer_groups WHERE business_id = ?;

-- 5. Other business-related tables
CREATE TABLE IF NOT EXISTS export_cash_registers AS
SELECT * FROM cash_registers WHERE business_id = ?;

-- Tables WITHOUT business_id column (need special handling)
-- These tables are referenced by foreign keys from business-specific tables

-- 6. Barcode table (referenced by products, no business_id)
-- Need to join with products to get business-specific barcodes
CREATE TABLE IF NOT EXISTS export_barcodes AS
SELECT b.* 
FROM barcodes b
JOIN variations v ON b.variation_id = v.id
JOIN products p ON v.product_id = p.id
WHERE p.business_id = ?;

-- 7. Tenants table (for multi-tenant setup)
-- Contains business_id as reference
CREATE TABLE IF NOT EXISTS export_tenants AS
SELECT * FROM tenants WHERE business_id = ?;

-- Alternative approach for tables without direct business_id:
-- Use EXISTS subqueries to find related records

-- For any other tables that might be referenced:
CREATE TABLE IF NOT EXISTS export_related_tables AS
SELECT 'barcodes' as table_name, COUNT(*) as record_count
FROM barcodes b
WHERE EXISTS (
    SELECT 1 FROM variations v 
    JOIN products p ON v.product_id = p.id 
    WHERE v.id = b.variation_id AND p.business_id = ?
)
UNION ALL
SELECT 'tenants' as table_name, COUNT(*) as record_count
FROM tenants WHERE business_id = ?;

-- Export summary query
SELECT 
    'export_transactions' as table_name, COUNT(*) as record_count FROM export_transactions
UNION ALL
SELECT 'export_products' as table_name, COUNT(*) as record_count FROM export_products
UNION ALL
SELECT 'export_variations' as table_name, COUNT(*) as record_count FROM export_variations
UNION ALL
SELECT 'export_categories' as table_name, COUNT(*) as record_count FROM export_categories
UNION ALL
SELECT 'export_contacts' as table_name, COUNT(*) as record_count FROM export_contacts
UNION ALL
SELECT 'export_barcodes' as table_name, COUNT(*) as record_count FROM export_barcodes
ORDER BY table_name;
