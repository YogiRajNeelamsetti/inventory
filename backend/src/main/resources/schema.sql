-- ============================================
-- KIRANA SHOP MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================

-- 1. RETAILERS TABLE
CREATE TABLE IF NOT EXISTS retailers (
    id BIGSERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    phone_number VARCHAR(15),
    address TEXT,
    gst_number VARCHAR(15),
    business_type VARCHAR(50),
    auth_provider VARCHAR(20) DEFAULT 'local',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS idx_retailers_active ON retailers(is_active) WHERE deleted_at IS NULL;

-- 2. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGSERIAL PRIMARY KEY,
    retailer_id BIGINT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(15),
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_suppliers_retailer ON suppliers(retailer_id) WHERE deleted_at IS NULL;

-- 3. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    retailer_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    total_purchases DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_customers_retailer ON customers(retailer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(retailer_id, phone_number);

-- 4. ITEMS TABLE
CREATE TABLE IF NOT EXISTS items (
    id BIGSERIAL PRIMARY KEY,
    retailer_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    category VARCHAR(100),
    unit VARCHAR(50),
    purchase_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    current_stock DECIMAL(10,2) DEFAULT 0,
    min_stock_threshold DECIMAL(10,2) DEFAULT 0,
    reorder_point DECIMAL(10,2) DEFAULT 0,
    max_stock_level DECIMAL(10,2),
    last_purchase_date TIMESTAMP,
    last_sale_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_items_retailer ON items(retailer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_items_category ON items(retailer_id, category);
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(retailer_id, sku);
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_low_stock ON items(retailer_id)
    WHERE current_stock <= min_stock_threshold AND is_active = TRUE;

-- 5. PURCHASE ORDERS TABLE
CREATE TABLE IF NOT EXISTS purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    retailer_id BIGINT NOT NULL,
    supplier_id BIGINT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(12,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    paid_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_retailer ON purchase_orders(retailer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(retailer_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(retailer_id, order_date DESC);

-- 6. PURCHASE ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_po_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_items_item ON purchase_order_items(item_id);

-- 7. SUPPLIER PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS supplier_payments (
    id BIGSERIAL PRIMARY KEY,
    retailer_id BIGINT NOT NULL,
    supplier_id BIGINT NOT NULL,
    purchase_order_id BIGINT,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(20),
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_retailer ON supplier_payments(retailer_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_po ON supplier_payments(purchase_order_id);

-- 8. SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
    id BIGSERIAL PRIMARY KEY,
    retailer_id BIGINT NOT NULL,
    customer_id BIGINT,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(12,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(20),
    payment_status VARCHAR(20) DEFAULT 'paid',
    paid_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_sales_retailer ON sales(retailer_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(retailer_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(retailer_id, payment_status);

-- 9. SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_selling_price DECIMAL(10,2) NOT NULL,
    unit_cost_price DECIMAL(10,2) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    profit DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_item ON sale_items(item_id);

-- 10. INVENTORY TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    retailer_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id BIGINT,
    previous_stock DECIMAL(10,2),
    new_stock DECIMAL(10,2),
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_retailer ON inventory_transactions(retailer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_item ON inventory_transactions(item_id, created_at DESC);

-- 11. RETURNS TABLE
CREATE TABLE IF NOT EXISTS returns (
    id BIGSERIAL PRIMARY KEY,
    retailer_id BIGINT NOT NULL,
    sale_id BIGINT,
    customer_id BIGINT,
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(12,2) NOT NULL,
    refund_status VARCHAR(20) DEFAULT 'pending',
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_returns_retailer ON returns(retailer_id, return_date DESC);

-- 12. RETURN ITEMS TABLE
CREATE TABLE IF NOT EXISTS return_items (
    id BIGSERIAL PRIMARY KEY,
    return_id BIGINT NOT NULL,
    sale_item_id BIGINT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id);

-- 13. DAILY SUMMARY TABLE
CREATE TABLE IF NOT EXISTS daily_summary (
    id BIGSERIAL PRIMARY KEY,
    retailer_id BIGINT NOT NULL,
    summary_date DATE NOT NULL,
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_purchases DECIMAL(12,2) DEFAULT 0,
    total_profit DECIMAL(12,2) DEFAULT 0,
    cash_sales DECIMAL(12,2) DEFAULT 0,
    card_sales DECIMAL(12,2) DEFAULT 0,
    upi_sales DECIMAL(12,2) DEFAULT 0,
    credit_sales DECIMAL(12,2) DEFAULT 0,
    total_transactions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE CASCADE,
    UNIQUE(retailer_id, summary_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON daily_summary(retailer_id, summary_date DESC);

-- CONSTRAINTS
ALTER TABLE sales ADD CONSTRAINT IF NOT EXISTS check_sales_amount CHECK (final_amount >= 0);
ALTER TABLE purchase_orders ADD CONSTRAINT IF NOT EXISTS check_po_amount CHECK (total_amount >= 0);
ALTER TABLE sales ADD CONSTRAINT IF NOT EXISTS check_sales_payment CHECK (paid_amount <= final_amount);
ALTER TABLE purchase_orders ADD CONSTRAINT IF NOT EXISTS check_po_payment CHECK (paid_amount <= total_amount);

-- TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
    CREATE TRIGGER update_retailers_updated_at BEFORE UPDATE ON retailers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TRIGGER update_daily_summary_updated_at BEFORE UPDATE ON daily_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- SAMPLE RETAILER (for development/testing, password: password123)
INSERT INTO retailers (business_name, owner_name, email, password_hash, phone_number, address, gst_number, business_type)
VALUES ('Sharma General Store', 'Rajesh Sharma', 'rajesh@example.com', '$2b$10$DOYiV3EAiQxH0HQsYQI4XO3SMTXo4IIdis5lyl2tvupObv0liwwwu', '9876543210', 'Shop 12, MG Road, Mumbai', '27AABCU9603R1ZM', 'kirana')
ON CONFLICT (email) DO NOTHING;
