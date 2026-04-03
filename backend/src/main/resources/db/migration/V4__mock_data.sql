-- ============================================================
-- V3__mock_data.sql
-- Realistic mock data for Kirana Inventory Management System
-- NOTE: Assumes retailer with id=1 already exists (from your app login)
-- Run: psql -U springuser -d springdb -f V3__mock_data.sql
-- ============================================================

-- Clear existing test data (safe order due to FK constraints)
TRUNCATE return_items, returns, sale_items, sales,
         inventory_transactions, purchase_order_items,
         purchase_orders, supplier_payments,
         customers, suppliers, items
RESTART IDENTITY CASCADE;

-- ============================================================
-- SUPPLIERS
-- ============================================================
INSERT INTO suppliers (retailer_id, company_name, contact_person, phone, email, address, gst_number, created_at, updated_at, deleted_at) VALUES
(1, 'HUL Distributor Hyderabad',   'Ramesh Gupta',   '9000011111', 'hul.hyd@distributor.com',   'Plot 12, IDA Nacharam, Hyderabad',    '36AAACH1234F1ZX', NOW(), NOW(), NULL),
(1, 'ITC Foods & Snacks',          'Sunil Mehta',    '9000022222', 'itc.foods@supplier.com',    'Road No 5, Banjara Hills, Hyderabad', '36AAACI5678G1ZY', NOW(), NOW(), NULL),
(1, 'Amul Dairy Products',         'Pradeep Shah',   '9000033333', 'amul.hyd@dairy.com',        'Kukatpally Industrial Area, Hyd',     '36AAACJ9012H1ZZ', NOW(), NOW(), NULL),
(1, 'Tata Consumer Products',      'Vikram Nair',    '9000044444', 'tata.consumer@supply.com',  'Secunderabad, Hyderabad',             '36AAACK3456I1ZW', NOW(), NOW(), NULL),
(1, 'Nestle India Pvt Ltd',        'Anand Pillai',   '9000055555', 'nestle.hyd@india.com',      'Gachibowli, Hyderabad',               '36AAACL7890J1ZV', NOW(), NOW(), NULL);

-- ============================================================
-- CUSTOMERS
-- ============================================================
INSERT INTO customers (retailer_id, name, phone_number, email, address, total_purchases, created_at, updated_at, deleted_at) VALUES
(1, 'Arjun Sharma',   '9111111111', 'arjun.sharma@gmail.com',  'Flat 3B, Madhapur, Hyderabad',      1250.00, NOW(), NOW(), NULL),
(1, 'Priya Reddy',    '9222222222', 'priya.reddy@gmail.com',   'H No 45, Kondapur, Hyderabad',      850.00,  NOW(), NOW(), NULL),
(1, 'Suresh Kumar',   '9333333333', 'suresh.k@gmail.com',      '12-4-56, Miyapur, Hyderabad',       2100.00, NOW(), NOW(), NULL),
(1, 'Anita Verma',    '9444444444', 'anita.v@gmail.com',       'Plot 7, KPHB Colony, Hyderabad',    600.00,  NOW(), NOW(), NULL),
(1, 'Ramesh Babu',    '9555555555', 'ramesh.babu@gmail.com',   '8-2-293, Ameerpet, Hyderabad',      3200.00, NOW(), NOW(), NULL),
(1, 'Kavitha Nair',   '9666666666', 'kavitha.n@gmail.com',     'SR Nagar, Hyderabad',               450.00,  NOW(), NOW(), NULL),
(1, 'Venkat Rao',     '9777777777', 'venkat.rao@gmail.com',    'Dilsukhnagar, Hyderabad',           1800.00, NOW(), NOW(), NULL),
(1, 'Deepa Iyer',     '9888888888', 'deepa.iyer@gmail.com',    'LB Nagar, Hyderabad',               920.00,  NOW(), NOW(), NULL),
(1, 'Kiran Reddy',    '9123456789', 'kiran.r@gmail.com',       'Uppal, Hyderabad',                  700.00,  NOW(), NOW(), NULL),
(1, 'Sneha Patel',    '9876501234', 'sneha.p@gmail.com',       'Attapur, Hyderabad',                1100.00, NOW(), NOW(), NULL);

-- ============================================================
-- ITEMS
-- ============================================================
INSERT INTO items (retailer_id, name, description, sku, barcode, category, unit, purchase_price, selling_price, current_stock, min_stock_threshold, reorder_point, max_stock_level, is_active, created_at, updated_at, deleted_at) VALUES
(1, 'Aashirvaad Atta 5kg',    'Whole wheat flour',         'SKU001', '8901234500001', 'Grocery',   'bag',    220.00, 250.00, 45,  10, 15, 100, true, NOW(), NOW(), NULL),
(1, 'Tata Salt 1kg',          'Iodized table salt',        'SKU002', '8901234500002', 'Grocery',   'packet', 18.00,  22.00,  80,  20, 30, 200, true, NOW(), NOW(), NULL),
(1, 'Sugar 1kg',              'Refined white sugar',       'SKU003', '8901234500003', 'Grocery',   'kg',     45.00,  50.00,  60,  15, 20, 150, true, NOW(), NOW(), NULL),
(1, 'Amul Butter 500g',       'Pasteurized table butter',  'SKU004', '8901234500004', 'Dairy',     'packet', 240.00, 260.00, 30,  10, 15, 80,  true, NOW(), NOW(), NULL),
(1, 'Amul Milk 1L',           'Full cream milk',           'SKU005', '8901234500005', 'Dairy',     'litre',  58.00,  65.00,  50,  20, 25, 120, true, NOW(), NOW(), NULL),
(1, 'Parle-G Biscuits 800g',  'Glucose biscuits family pack','SKU006','8901234500006','Snacks',    'packet', 8.00,   10.00,  100, 30, 40, 250, true, NOW(), NOW(), NULL),
(1, 'Lays Chips 26g',         'Classic salted chips',      'SKU007', '8901234500007', 'Snacks',    'packet', 18.00,  22.00,  75,  20, 30, 200, true, NOW(), NOW(), NULL),
(1, 'Tata Tea Premium 250g',  'Blended CTC tea',           'SKU008', '8901234500008', 'Beverages', 'packet', 85.00,  95.00,  40,  10, 15, 100, true, NOW(), NOW(), NULL),
(1, 'Nescafe Classic 50g',    'Instant coffee powder',     'SKU009', '8901234500009', 'Beverages', 'jar',    150.00, 175.00, 25,  8,  10, 60,  true, NOW(), NOW(), NULL),
(1, 'Surf Excel 1kg',         'Washing powder',            'SKU010', '8901234500010', 'Household', 'packet', 110.00, 130.00, 35,  10, 15, 80,  true, NOW(), NOW(), NULL),
(1, 'Colgate Total 200g',     'Fluoride toothpaste',       'SKU011', '8901234500011', 'Personal',  'tube',   85.00,  95.00,  55,  15, 20, 120, true, NOW(), NOW(), NULL),
(1, 'Fortune Sunflower Oil 1L','Refined sunflower oil',    'SKU012', '8901234500012', 'Grocery',   'bottle', 140.00, 160.00, 20,  8,  12, 60,  true, NOW(), NOW(), NULL),
(1, 'Toor Dal 1kg',           'Split pigeon peas',         'SKU013', '8901234500013', 'Grocery',   'kg',     120.00, 140.00, 40,  10, 15, 100, true, NOW(), NOW(), NULL),
(1, 'Dettol Soap 75g',        'Antibacterial soap',        'SKU014', '8901234500014', 'Personal',  'piece',  35.00,  42.00,  60,  15, 20, 150, true, NOW(), NOW(), NULL),
(1, 'Maggi Noodles 70g',      '2-minute instant noodles',  'SKU015', '8901234500015', 'Snacks',    'packet', 12.00,  15.00,  90,  25, 35, 250, true, NOW(), NOW(), NULL),
(1, 'Horlicks 500g',          'Health drink powder',       'SKU016', '8901234500016', 'Beverages', 'jar',    220.00, 250.00, 18,  5,  8,  50,  true, NOW(), NOW(), NULL),
(1, 'Vim Dishwash Bar 250g',  'Dish cleaning bar',         'SKU017', '8901234500017', 'Household', 'piece',  22.00,  28.00,  70,  20, 25, 150, true, NOW(), NOW(), NULL),
(1, 'Moong Dal 500g',         'Split green gram',          'SKU018', '8901234500018', 'Grocery',   'packet', 55.00,  65.00,  35,  10, 15, 80,  true, NOW(), NOW(), NULL),
(1, 'Good Day Biscuits 200g', 'Butter cookies',            'SKU019', '8901234500019', 'Snacks',    'packet', 25.00,  30.00,  65,  15, 20, 150, true, NOW(), NOW(), NULL),
(1, 'Lifebuoy Soap 100g',     'Germ protection soap',      'SKU020', '8901234500020', 'Personal',  'piece',  28.00,  35.00,  80,  20, 25, 180, true, NOW(), NOW(), NULL);

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
INSERT INTO purchase_orders (retailer_id, supplier_id, order_date, status, total_amount, payment_status, paid_amount, notes, created_at, updated_at, deleted_at) VALUES
(1, 1, NOW() - INTERVAL '28 days', 'received', 4400.00, 'paid',    4400.00, 'Monthly HUL stock replenishment',     NOW() - INTERVAL '28 days', NOW(), NULL),
(1, 2, NOW() - INTERVAL '22 days', 'received', 2160.00, 'paid',    2160.00, 'ITC snacks and biscuits restock',     NOW() - INTERVAL '22 days', NOW(), NULL),
(1, 3, NOW() - INTERVAL '18 days', 'received', 5800.00, 'paid',    5800.00, 'Amul dairy monthly order',            NOW() - INTERVAL '18 days', NOW(), NULL),
(1, 4, NOW() - INTERVAL '12 days', 'received', 3400.00, 'partial', 2000.00, 'Tata beverages and grocery',          NOW() - INTERVAL '12 days', NOW(), NULL),
(1, 5, NOW() - INTERVAL '7 days',  'received', 4400.00, 'paid',    4400.00, 'Nestle products restock',             NOW() - INTERVAL '7 days',  NOW(), NULL),
(1, 1, NOW() - INTERVAL '3 days',  'received', 2800.00, 'pending', 0.00,    'Household items urgent restock',      NOW() - INTERVAL '3 days',  NOW(), NULL);

-- ============================================================
-- PURCHASE ORDER ITEMS
-- ============================================================
INSERT INTO purchase_order_items (purchase_order_id, item_id, quantity, unit_price, amount, created_at) VALUES
-- PO 1: HUL (Surf Excel, Colgate, Dettol, Vim, Lifebuoy)
(1, 10, 20, 110.00, 2200.00, NOW() - INTERVAL '28 days'),
(1, 11, 10, 85.00,  850.00,  NOW() - INTERVAL '28 days'),
(1, 14, 20, 35.00,  700.00,  NOW() - INTERVAL '28 days'),
(1, 17, 15, 22.00,  330.00,  NOW() - INTERVAL '28 days'),
(1, 20, 15, 28.00,  420.00,  NOW() - INTERVAL '28 days'),
-- PO 2: ITC (Parle-G, Lays, Good Day, Maggi)
(2, 6,  30, 8.00,   240.00,  NOW() - INTERVAL '22 days'),
(2, 7,  20, 18.00,  360.00,  NOW() - INTERVAL '22 days'),
(2, 19, 25, 25.00,  625.00,  NOW() - INTERVAL '22 days'),
(2, 15, 45, 12.00,  540.00,  NOW() - INTERVAL '22 days'),
(2, 18, 10, 55.00,  550.00,  NOW() - INTERVAL '22 days'),
-- PO 3: Amul (Butter, Milk)
(3, 4,  15, 240.00, 3600.00, NOW() - INTERVAL '18 days'),
(3, 5,  30, 58.00,  1740.00, NOW() - INTERVAL '18 days'),
(3, 16, 2,  220.00, 440.00,  NOW() - INTERVAL '18 days'),
-- PO 4: Tata (Tea, Salt, Atta)
(4, 8,  15, 85.00,  1275.00, NOW() - INTERVAL '12 days'),
(4, 2,  30, 18.00,  540.00,  NOW() - INTERVAL '12 days'),
(4, 1,  10, 220.00, 2200.00, NOW() - INTERVAL '12 days'),
-- PO 5: Nestle (Nescafe, Maggi, Horlicks)
(5, 9,  10, 150.00, 1500.00, NOW() - INTERVAL '7 days'),
(5, 15, 50, 12.00,  600.00,  NOW() - INTERVAL '7 days'),
(5, 16, 10, 220.00, 2200.00, NOW() - INTERVAL '7 days'),
-- PO 6: HUL urgent
(6, 10, 15, 110.00, 1650.00, NOW() - INTERVAL '3 days'),
(6, 14, 15, 35.00,  525.00,  NOW() - INTERVAL '3 days'),
(6, 20, 20, 28.00,  560.00,  NOW() - INTERVAL '3 days');

-- ============================================================
-- SUPPLIER PAYMENTS
-- ============================================================
INSERT INTO supplier_payments (retailer_id, supplier_id, purchase_order_id, payment_date, amount, payment_method, reference_number, notes, created_at) VALUES
(1, 1, 1, NOW() - INTERVAL '28 days', 4400.00, 'bank_transfer', 'TXN-HUL-001', 'Full payment PO1', NOW() - INTERVAL '28 days'),
(1, 2, 2, NOW() - INTERVAL '22 days', 2160.00, 'upi',           'TXN-ITC-001', 'Full payment PO2', NOW() - INTERVAL '22 days'),
(1, 3, 3, NOW() - INTERVAL '18 days', 5800.00, 'bank_transfer', 'TXN-AML-001', 'Full payment PO3', NOW() - INTERVAL '18 days'),
(1, 4, 4, NOW() - INTERVAL '12 days', 2000.00, 'cash',          'TXN-TAT-001', 'Partial payment PO4', NOW() - INTERVAL '12 days'),
(1, 5, 5, NOW() - INTERVAL '7 days',  4400.00, 'bank_transfer', 'TXN-NST-001', 'Full payment PO5', NOW() - INTERVAL '7 days');

-- ============================================================
-- SALES  (25 bills spread across this month)
-- ============================================================
INSERT INTO sales (retailer_id, customer_id, sale_date, total_amount, discount, final_amount, payment_method, payment_status, paid_amount, notes, created_at, updated_at, deleted_at) VALUES
(1, 1,    NOW() - INTERVAL '27 days', 572.00,  0.00,  572.00,  'cash',   'paid',    572.00,  NULL, NOW() - INTERVAL '27 days', NOW(), NULL),
(1, 2,    NOW() - INTERVAL '26 days', 347.00,  0.00,  347.00,  'upi',    'paid',    347.00,  NULL, NOW() - INTERVAL '26 days', NOW(), NULL),
(1, NULL, NOW() - INTERVAL '25 days', 185.00,  0.00,  185.00,  'cash',   'paid',    185.00,  NULL, NOW() - INTERVAL '25 days', NOW(), NULL),
(1, 3,    NOW() - INTERVAL '24 days', 780.00,  30.00, 750.00,  'card',   'paid',    750.00,  NULL, NOW() - INTERVAL '24 days', NOW(), NULL),
(1, 4,    NOW() - INTERVAL '23 days', 260.00,  0.00,  260.00,  'cash',   'paid',    260.00,  NULL, NOW() - INTERVAL '23 days', NOW(), NULL),
(1, NULL, NOW() - INTERVAL '22 days', 435.00,  0.00,  435.00,  'upi',    'paid',    435.00,  NULL, NOW() - INTERVAL '22 days', NOW(), NULL),
(1, 5,    NOW() - INTERVAL '21 days', 920.00,  50.00, 870.00,  'cash',   'paid',    870.00,  NULL, NOW() - INTERVAL '21 days', NOW(), NULL),
(1, 6,    NOW() - INTERVAL '20 days', 310.00,  0.00,  310.00,  'upi',    'paid',    310.00,  NULL, NOW() - INTERVAL '20 days', NOW(), NULL),
(1, NULL, NOW() - INTERVAL '19 days', 155.00,  0.00,  155.00,  'cash',   'paid',    155.00,  NULL, NOW() - INTERVAL '19 days', NOW(), NULL),
(1, 7,    NOW() - INTERVAL '18 days', 640.00,  0.00,  640.00,  'card',   'paid',    640.00,  NULL, NOW() - INTERVAL '18 days', NOW(), NULL),
(1, 1,    NOW() - INTERVAL '17 days', 475.00,  25.00, 450.00,  'upi',    'paid',    450.00,  NULL, NOW() - INTERVAL '17 days', NOW(), NULL),
(1, 8,    NOW() - INTERVAL '16 days', 390.00,  0.00,  390.00,  'cash',   'paid',    390.00,  NULL, NOW() - INTERVAL '16 days', NOW(), NULL),
(1, NULL, NOW() - INTERVAL '15 days', 220.00,  0.00,  220.00,  'cash',   'paid',    220.00,  NULL, NOW() - INTERVAL '15 days', NOW(), NULL),
(1, 3,    NOW() - INTERVAL '14 days', 860.00,  60.00, 800.00,  'card',   'paid',    800.00,  NULL, NOW() - INTERVAL '14 days', NOW(), NULL),
(1, 9,    NOW() - INTERVAL '13 days', 305.00,  0.00,  305.00,  'upi',    'paid',    305.00,  NULL, NOW() - INTERVAL '13 days', NOW(), NULL),
(1, NULL, NOW() - INTERVAL '12 days', 175.00,  0.00,  175.00,  'cash',   'paid',    175.00,  NULL, NOW() - INTERVAL '12 days', NOW(), NULL),
(1, 5,    NOW() - INTERVAL '11 days', 1050.00, 50.00, 1000.00, 'card',   'paid',    1000.00, NULL, NOW() - INTERVAL '11 days', NOW(), NULL),
(1, 10,   NOW() - INTERVAL '10 days', 430.00,  0.00,  430.00,  'upi',    'paid',    430.00,  NULL, NOW() - INTERVAL '10 days', NOW(), NULL),
(1, NULL, NOW() - INTERVAL '9 days',  265.00,  0.00,  265.00,  'cash',   'paid',    265.00,  NULL, NOW() - INTERVAL '9 days',  NOW(), NULL),
(1, 2,    NOW() - INTERVAL '8 days',  590.00,  0.00,  590.00,  'upi',    'paid',    590.00,  NULL, NOW() - INTERVAL '8 days',  NOW(), NULL),
(1, 6,    NOW() - INTERVAL '7 days',  340.00,  0.00,  340.00,  'cash',   'paid',    340.00,  NULL, NOW() - INTERVAL '7 days',  NOW(), NULL),
(1, NULL, NOW() - INTERVAL '6 days',  195.00,  0.00,  195.00,  'cash',   'paid',    195.00,  NULL, NOW() - INTERVAL '6 days',  NOW(), NULL),
(1, 7,    NOW() - INTERVAL '5 days',  720.00,  20.00, 700.00,  'card',   'paid',    700.00,  NULL, NOW() - INTERVAL '5 days',  NOW(), NULL),
(1, 4,    NOW() - INTERVAL '3 days',  455.00,  0.00,  455.00,  'upi',    'paid',    455.00,  NULL, NOW() - INTERVAL '3 days',  NOW(), NULL),
(1, NULL, NOW() - INTERVAL '1 days',  285.00,  0.00,  285.00,  'cash',   'paid',    285.00,  NULL, NOW() - INTERVAL '1 days',  NOW(), NULL);

-- ============================================================
-- SALE ITEMS  (correctly calculated: amount = qty * unit_selling_price)
-- ============================================================
INSERT INTO sale_items (sale_id, item_id, quantity, unit_selling_price, unit_cost_price, amount, profit, created_at) VALUES
-- Sale 1
(1, 1,  2, 250.00, 220.00,  500.00, 60.00,  NOW() - INTERVAL '27 days'),
(1, 6,  5, 10.00,  8.00,    50.00,  10.00,  NOW() - INTERVAL '27 days'),
(1, 15, 1, 15.00,  12.00,   15.00,  3.00,   NOW() - INTERVAL '27 days'),
-- Sale 2
(2, 4,  1, 260.00, 240.00,  260.00, 20.00,  NOW() - INTERVAL '26 days'),
(2, 3,  1, 50.00,  45.00,   50.00,  5.00,   NOW() - INTERVAL '26 days'),
(2, 7,  2, 22.00,  18.00,   44.00,  8.00,   NOW() - INTERVAL '26 days'),
-- Sale 3
(3, 6,  3, 10.00,  8.00,    30.00,  6.00,   NOW() - INTERVAL '25 days'),
(3, 2,  3, 22.00,  18.00,   66.00,  12.00,  NOW() - INTERVAL '25 days'),
(3, 15, 2, 15.00,  12.00,   30.00,  6.00,   NOW() - INTERVAL '25 days'),
(3, 20, 2, 35.00,  28.00,   70.00,  14.00,  NOW() - INTERVAL '25 days'),
-- Sale 4
(4, 8,  2, 95.00,  85.00,   190.00, 20.00,  NOW() - INTERVAL '24 days'),
(4, 9,  1, 175.00, 150.00,  175.00, 25.00,  NOW() - INTERVAL '24 days'),
(4, 10, 1, 130.00, 110.00,  130.00, 20.00,  NOW() - INTERVAL '24 days'),
(4, 11, 1, 95.00,  85.00,   95.00,  10.00,  NOW() - INTERVAL '24 days'),
(4, 14, 5, 42.00,  35.00,   210.00, 35.00,  NOW() - INTERVAL '24 days'),
-- Sale 5
(5, 4,  1, 260.00, 240.00,  260.00, 20.00,  NOW() - INTERVAL '23 days'),
-- Sale 6
(6, 1,  1, 250.00, 220.00,  250.00, 30.00,  NOW() - INTERVAL '22 days'),
(6, 3,  2, 50.00,  45.00,   100.00, 10.00,  NOW() - INTERVAL '22 days'),
(6, 6,  5, 10.00,  8.00,    50.00,  10.00,  NOW() - INTERVAL '22 days'),
(6, 20, 1, 35.00,  28.00,   35.00,  7.00,   NOW() - INTERVAL '22 days'),
-- Sale 7
(7, 12, 2, 160.00, 140.00,  320.00, 40.00,  NOW() - INTERVAL '21 days'),
(7, 13, 2, 140.00, 120.00,  280.00, 40.00,  NOW() - INTERVAL '21 days'),
(7, 18, 2, 65.00,  55.00,   130.00, 20.00,  NOW() - INTERVAL '21 days'),
(7, 15, 3, 15.00,  12.00,   45.00,  9.00,   NOW() - INTERVAL '21 days'),
(7, 19, 5, 30.00,  25.00,   150.00, 25.00,  NOW() - INTERVAL '21 days'),
-- Sale 8
(8, 5,  2, 65.00,  58.00,   130.00, 14.00,  NOW() - INTERVAL '20 days'),
(8, 2,  2, 22.00,  18.00,   44.00,  8.00,   NOW() - INTERVAL '20 days'),
(8, 3,  1, 50.00,  45.00,   50.00,  5.00,   NOW() - INTERVAL '20 days'),
(8, 17, 3, 28.00,  22.00,   84.00,  18.00,  NOW() - INTERVAL '20 days'),
-- Sale 9
(9, 6,  5, 10.00,  8.00,    50.00,  10.00,  NOW() - INTERVAL '19 days'),
(9, 7,  3, 22.00,  18.00,   66.00,  12.00,  NOW() - INTERVAL '19 days'),
(9, 20, 1, 35.00,  28.00,   35.00,  7.00,   NOW() - INTERVAL '19 days'),
-- Sale 10
(10, 9,  1, 175.00, 150.00, 175.00, 25.00,  NOW() - INTERVAL '18 days'),
(10, 8,  2, 95.00,  85.00,  190.00, 20.00,  NOW() - INTERVAL '18 days'),
(10, 16, 1, 250.00, 220.00, 250.00, 30.00,  NOW() - INTERVAL '18 days'),
-- Sale 11
(11, 1,  1, 250.00, 220.00, 250.00, 30.00,  NOW() - INTERVAL '17 days'),
(11, 13, 1, 140.00, 120.00, 140.00, 20.00,  NOW() - INTERVAL '17 days'),
(11, 6,  4, 10.00,  8.00,   40.00,  8.00,   NOW() - INTERVAL '17 days'),
(11, 2,  2, 22.00,  18.00,  44.00,  8.00,   NOW() - INTERVAL '17 days'),
-- Sale 12
(12, 5,  3, 65.00,  58.00,  195.00, 21.00,  NOW() - INTERVAL '16 days'),
(12, 4,  1, 260.00, 240.00, 260.00, 20.00,  NOW() - INTERVAL '16 days'),
-- Sale 13
(13, 2,  4, 22.00,  18.00,  88.00,  16.00,  NOW() - INTERVAL '15 days'),
(13, 15, 4, 15.00,  12.00,  60.00,  12.00,  NOW() - INTERVAL '15 days'),
(13, 19, 2, 30.00,  25.00,  60.00,  10.00,  NOW() - INTERVAL '15 days'),
-- Sale 14
(14, 12, 2, 160.00, 140.00, 320.00, 40.00,  NOW() - INTERVAL '14 days'),
(14, 13, 2, 140.00, 120.00, 280.00, 40.00,  NOW() - INTERVAL '14 days'),
(14, 10, 2, 130.00, 110.00, 260.00, 40.00,  NOW() - INTERVAL '14 days'),
-- Sale 15
(15, 7,  3, 22.00,  18.00,  66.00,  12.00,  NOW() - INTERVAL '13 days'),
(15, 6,  5, 10.00,  8.00,   50.00,  10.00,  NOW() - INTERVAL '13 days'),
(15, 15, 5, 15.00,  12.00,  75.00,  15.00,  NOW() - INTERVAL '13 days'),
(15, 20, 4, 35.00,  28.00,  140.00, 28.00,  NOW() - INTERVAL '13 days'),
-- Sale 16
(16, 6,  3, 10.00,  8.00,   30.00,  6.00,   NOW() - INTERVAL '12 days'),
(16, 2,  2, 22.00,  18.00,  44.00,  8.00,   NOW() - INTERVAL '12 days'),
(16, 3,  2, 50.00,  45.00,  100.00, 10.00,  NOW() - INTERVAL '12 days'),
-- Sale 17
(17, 9,  2, 175.00, 150.00, 350.00, 50.00,  NOW() - INTERVAL '11 days'),
(17, 8,  2, 95.00,  85.00,  190.00, 20.00,  NOW() - INTERVAL '11 days'),
(17, 16, 1, 250.00, 220.00, 250.00, 30.00,  NOW() - INTERVAL '11 days'),
(17, 1,  1, 250.00, 220.00, 250.00, 30.00,  NOW() - INTERVAL '11 days'),
-- Sale 18
(18, 4,  1, 260.00, 240.00, 260.00, 20.00,  NOW() - INTERVAL '10 days'),
(18, 5,  2, 65.00,  58.00,  130.00, 14.00,  NOW() - INTERVAL '10 days'),
(18, 17, 1, 28.00,  22.00,  28.00,  6.00,   NOW() - INTERVAL '10 days'),
-- Sale 19
(19, 6,  3, 10.00,  8.00,   30.00,  6.00,   NOW() - INTERVAL '9 days'),
(19, 19, 3, 30.00,  25.00,  90.00,  15.00,  NOW() - INTERVAL '9 days'),
(19, 7,  3, 22.00,  18.00,  66.00,  12.00,  NOW() - INTERVAL '9 days'),
(19, 2,  3, 22.00,  18.00,  66.00,  12.00,  NOW() - INTERVAL '9 days'),
-- Sale 20
(20, 12, 1, 160.00, 140.00, 160.00, 20.00,  NOW() - INTERVAL '8 days'),
(20, 11, 2, 95.00,  85.00,  190.00, 20.00,  NOW() - INTERVAL '8 days'),
(20, 14, 5, 42.00,  35.00,  210.00, 35.00,  NOW() - INTERVAL '8 days'),
-- Sale 21
(21, 3,  2, 50.00,  45.00,  100.00, 10.00,  NOW() - INTERVAL '7 days'),
(21, 2,  3, 22.00,  18.00,  66.00,  12.00,  NOW() - INTERVAL '7 days'),
(21, 15, 5, 15.00,  12.00,  75.00,  15.00,  NOW() - INTERVAL '7 days'),
(21, 6,  5, 10.00,  8.00,   50.00,  10.00,  NOW() - INTERVAL '7 days'),
(21, 20, 1, 35.00,  28.00,  35.00,  7.00,   NOW() - INTERVAL '7 days'),
-- Sale 22
(22, 6,  5, 10.00,  8.00,   50.00,  10.00,  NOW() - INTERVAL '6 days'),
(22, 7,  3, 22.00,  18.00,  66.00,  12.00,  NOW() - INTERVAL '6 days'),
(22, 17, 1, 28.00,  22.00,  28.00,  6.00,   NOW() - INTERVAL '6 days'),
(22, 2,  2, 22.00,  18.00,  44.00,  8.00,   NOW() - INTERVAL '6 days'),
-- Sale 23
(23, 8,  2, 95.00,  85.00,  190.00, 20.00,  NOW() - INTERVAL '5 days'),
(23, 9,  1, 175.00, 150.00, 175.00, 25.00,  NOW() - INTERVAL '5 days'),
(23, 10, 1, 130.00, 110.00, 130.00, 20.00,  NOW() - INTERVAL '5 days'),
(23, 19, 3, 30.00,  25.00,  90.00,  15.00,  NOW() - INTERVAL '5 days'),
(23, 6,  5, 10.00,  8.00,   50.00,  10.00,  NOW() - INTERVAL '5 days'),
-- Sale 24
(24, 1,  1, 250.00, 220.00, 250.00, 30.00,  NOW() - INTERVAL '3 days'),
(24, 3,  1, 50.00,  45.00,  50.00,  5.00,   NOW() - INTERVAL '3 days'),
(24, 5,  1, 65.00,  58.00,  65.00,  7.00,   NOW() - INTERVAL '3 days'),
(24, 15, 3, 15.00,  12.00,  45.00,  9.00,   NOW() - INTERVAL '3 days'),
(24, 20, 1, 35.00,  28.00,  35.00,  7.00,   NOW() - INTERVAL '3 days'),
-- Sale 25
(25, 6,  5, 10.00,  8.00,   50.00,  10.00,  NOW() - INTERVAL '1 days'),
(25, 7,  2, 22.00,  18.00,  44.00,  8.00,   NOW() - INTERVAL '1 days'),
(25, 15, 5, 15.00,  12.00,  75.00,  15.00,  NOW() - INTERVAL '1 days'),
(25, 2,  2, 22.00,  18.00,  44.00,  8.00,   NOW() - INTERVAL '1 days'),
(25, 19, 2, 30.00,  25.00,  60.00,  10.00,  NOW() - INTERVAL '1 days');

-- ============================================================
-- RETURNS  (2 sample returns)
-- ============================================================
INSERT INTO returns (retailer_id, sale_id, customer_id, return_date, total_amount, refund_status, reason, created_at) VALUES
(1, 4,  3, NOW() - INTERVAL '22 days', 95.00,  'completed', 'Item damaged on delivery', NOW() - INTERVAL '22 days'),
(1, 14, 3, NOW() - INTERVAL '12 days', 130.00, 'completed', 'Wrong item delivered',     NOW() - INTERVAL '12 days');

-- ============================================================
-- RETURN ITEMS
-- ============================================================
INSERT INTO return_items (return_id, sale_item_id, quantity, amount) VALUES
(1, 13, 1, 95.00),   -- Colgate from sale 4
(2, 43, 1, 130.00);  -- Surf Excel from sale 14

-- ============================================================
-- INVENTORY TRANSACTIONS
-- ============================================================
INSERT INTO inventory_transactions (retailer_id, item_id, transaction_type, quantity, reference_type, reference_id, previous_stock, new_stock, notes, created_by, created_at) VALUES
-- Stock in from purchases
(1, 10, 'purchase', 20, 'purchase_order', 1, 15, 35, 'Restocked from PO1', 'system', NOW() - INTERVAL '28 days'),
(1, 11, 'purchase', 10, 'purchase_order', 1, 45, 55, 'Restocked from PO1', 'system', NOW() - INTERVAL '28 days'),
(1, 6,  'purchase', 30, 'purchase_order', 2, 70, 100,'Restocked from PO2', 'system', NOW() - INTERVAL '22 days'),
(1, 7,  'purchase', 20, 'purchase_order', 2, 55, 75, 'Restocked from PO2', 'system', NOW() - INTERVAL '22 days'),
(1, 4,  'purchase', 15, 'purchase_order', 3, 15, 30, 'Restocked from PO3', 'system', NOW() - INTERVAL '18 days'),
(1, 5,  'purchase', 30, 'purchase_order', 3, 20, 50, 'Restocked from PO3', 'system', NOW() - INTERVAL '18 days'),
-- Stock out from sales
(1, 1,  'sale', 2, 'sale', 1, 47, 45, 'Sold in BILL-1', 'system', NOW() - INTERVAL '27 days'),
(1, 6,  'sale', 5, 'sale', 1, 95, 90, 'Sold in BILL-1', 'system', NOW() - INTERVAL '27 days'),
(1, 4,  'sale', 1, 'sale', 2, 29, 28, 'Sold in BILL-2', 'system', NOW() - INTERVAL '26 days'),
(1, 12, 'sale', 2, 'sale', 7, 22, 20, 'Sold in BILL-7', 'system', NOW() - INTERVAL '21 days');

-- ============================================================
-- DAILY SUMMARY  (last 10 days)
-- ============================================================
INSERT INTO daily_summary (retailer_id, summary_date, total_sales, total_purchases, total_profit, cash_sales, card_sales, upi_sales, credit_sales, total_transactions, created_at, updated_at) VALUES
(1, CURRENT_DATE - 9,  265.00, 0.00,    51.00,  265.00, 0.00,   0.00,   0.00, 1, NOW(), NOW()),
(1, CURRENT_DATE - 8,  590.00, 0.00,    75.00,  0.00,   0.00,   590.00, 0.00, 1, NOW(), NOW()),
(1, CURRENT_DATE - 7,  340.00, 0.00,    54.00,  340.00, 0.00,   0.00,   0.00, 1, NOW(), NOW()),
(1, CURRENT_DATE - 6,  195.00, 0.00,    36.00,  195.00, 0.00,   0.00,   0.00, 1, NOW(), NOW()),
(1, CURRENT_DATE - 5,  700.00, 0.00,    90.00,  0.00,   700.00, 0.00,   0.00, 1, NOW(), NOW()),
(1, CURRENT_DATE - 4,  0.00,   0.00,    0.00,   0.00,   0.00,   0.00,   0.00, 0, NOW(), NOW()),
(1, CURRENT_DATE - 3,  455.00, 2800.00, 58.00,  0.00,   0.00,   455.00, 0.00, 1, NOW(), NOW()),
(1, CURRENT_DATE - 2,  0.00,   0.00,    0.00,   0.00,   0.00,   0.00,   0.00, 0, NOW(), NOW()),
(1, CURRENT_DATE - 1,  285.00, 0.00,    51.00,  285.00, 0.00,   0.00,   0.00, 1, NOW(), NOW()),
(1, CURRENT_DATE,      0.00,   0.00,    0.00,   0.00,   0.00,   0.00,   0.00, 0, NOW(), NOW());
