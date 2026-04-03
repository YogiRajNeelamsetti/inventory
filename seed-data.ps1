# ============================================================
# Kirana Shop Management System - Data Seeding Script
# ============================================================
# This script populates the backend with realistic sample data.
# Make sure the backend is running on http://localhost:5000
# Usage:  powershell -ExecutionPolicy Bypass -File seed-data.ps1
# ============================================================

$BASE = "http://localhost:5000/api"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Kirana Shop - Data Seeding Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# --- Step 1: Get auth token ---
Write-Host "[1/7] Getting authentication token..." -ForegroundColor Yellow
$authResponse = Invoke-RestMethod -Uri "$BASE/auth/demo-token" -Method GET
$TOKEN = $authResponse.data.token
$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type"  = "application/json"
}
Write-Host "  Authenticated as: $($authResponse.data.business_name) ($($authResponse.data.email))" -ForegroundColor Green

# --- Step 2: Add Suppliers ---
Write-Host "`n[2/7] Adding suppliers..." -ForegroundColor Yellow

$suppliers = @(
    @{ company_name="Hindustan Unilever Ltd"; contact_person="Vikram Mehta"; phone="9876501001"; email="vikram@hul.com"; address="Andheri East, Mumbai, Maharashtra"; gst_number="27AAACH1234F1ZP" },
    @{ company_name="ITC Limited"; contact_person="Suresh Iyer"; phone="9876501002"; email="suresh@itc.com"; address="Virginia House, Kolkata, West Bengal"; gst_number="19AABCI1234G1ZQ" },
    @{ company_name="Parle Products"; contact_person="Deepak Chauhan"; phone="9876501003"; email="deepak@parle.com"; address="Vile Parle, Mumbai, Maharashtra"; gst_number="27AABCP1234H1ZR" },
    @{ company_name="Amul (GCMMF)"; contact_person="Nita Patel"; phone="9876501004"; email="nita@amul.coop"; address="Anand, Gujarat"; gst_number="24AAATG1234J1ZS" },
    @{ company_name="Britannia Industries"; contact_person="Rajan Nair"; phone="9876501005"; email="rajan@britannia.com"; address="Whitefield, Bangalore, Karnataka"; gst_number="29AABCB1234K1ZT" },
    @{ company_name="Dabur India Ltd"; contact_person="Priya Singh"; phone="9876501006"; email="priya@dabur.com"; address="Kaushambi, Ghaziabad, UP"; gst_number="09AABCD1234L1ZU" },
    @{ company_name="Marico Limited"; contact_person="Anand Joshi"; phone="9876501007"; email="anand@marico.com"; address="BKC, Mumbai, Maharashtra"; gst_number="27AABCM1234M1ZV" },
    @{ company_name="Nestle India"; contact_person="Kavita Sharma"; phone="9876501008"; email="kavita@nestle.in"; address="Gurgaon, Haryana"; gst_number="06AABCN1234N1ZW" }
)

foreach ($s in $suppliers) {
    $body = $s | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BASE/suppliers" -Method POST -Headers $headers -Body $body
    Write-Host "  + $($s.company_name)" -ForegroundColor Green
}

# --- Step 3: Add Items ---
Write-Host "`n[3/7] Adding inventory items..." -ForegroundColor Yellow

$items = @(
    # Groceries & Staples
    @{ name="Tata Salt 1kg"; sku="GRC-001"; barcode="8901030123450"; category="Groceries"; unit="kg"; purchase_price=18; selling_price=22; current_stock=120; min_stock_threshold=25; reorder_point=30 },
    @{ name="Aashirvaad Atta 5kg"; sku="GRC-002"; barcode="8901030123451"; category="Groceries"; unit="packet"; purchase_price=210; selling_price=250; current_stock=45; min_stock_threshold=10; reorder_point=15 },
    @{ name="Fortune Sunflower Oil 1L"; sku="GRC-003"; barcode="8901030123452"; category="Groceries"; unit="bottle"; purchase_price=135; selling_price=160; current_stock=60; min_stock_threshold=15; reorder_point=20 },
    @{ name="Toor Dal 1kg"; sku="GRC-004"; barcode="8901030123453"; category="Groceries"; unit="kg"; purchase_price=120; selling_price=145; current_stock=80; min_stock_threshold=20; reorder_point=25 },
    @{ name="India Gate Basmati Rice 5kg"; sku="GRC-005"; barcode="8901030123454"; category="Groceries"; unit="packet"; purchase_price=380; selling_price=440; current_stock=30; min_stock_threshold=8; reorder_point=12 },
    @{ name="Sugar 1kg"; sku="GRC-006"; barcode="8901030123455"; category="Groceries"; unit="kg"; purchase_price=38; selling_price=45; current_stock=100; min_stock_threshold=25; reorder_point=30 },

    # Snacks & Biscuits
    @{ name="Parle-G Biscuits 800g"; sku="SNK-001"; barcode="8901030223450"; category="Snacks"; unit="packet"; purchase_price=48; selling_price=56; current_stock=150; min_stock_threshold=30; reorder_point=40 },
    @{ name="Maggi Noodles 280g (4-pack)"; sku="SNK-002"; barcode="8901030223451"; category="Snacks"; unit="packet"; purchase_price=48; selling_price=56; current_stock=200; min_stock_threshold=40; reorder_point=50 },
    @{ name="Lays Classic Salted 52g"; sku="SNK-003"; barcode="8901030223452"; category="Snacks"; unit="packet"; purchase_price=17; selling_price=20; current_stock=300; min_stock_threshold=50; reorder_point=60 },
    @{ name="Britannia Good Day Cashew 200g"; sku="SNK-004"; barcode="8901030223453"; category="Snacks"; unit="packet"; purchase_price=32; selling_price=38; current_stock=120; min_stock_threshold=25; reorder_point=30 },
    @{ name="Kurkure Masala Munch 90g"; sku="SNK-005"; barcode="8901030223454"; category="Snacks"; unit="packet"; purchase_price=17; selling_price=20; current_stock=250; min_stock_threshold=40; reorder_point=50 },

    # Beverages
    @{ name="Brooke Bond Red Label Tea 500g"; sku="BEV-001"; barcode="8901030323450"; category="Beverages"; unit="packet"; purchase_price=195; selling_price=230; current_stock=55; min_stock_threshold=12; reorder_point=18 },
    @{ name="Nescafe Classic Coffee 100g"; sku="BEV-002"; barcode="8901030323451"; category="Beverages"; unit="jar"; purchase_price=230; selling_price=275; current_stock=40; min_stock_threshold=10; reorder_point=15 },
    @{ name="Thums Up 750ml"; sku="BEV-003"; barcode="8901030323452"; category="Beverages"; unit="bottle"; purchase_price=32; selling_price=40; current_stock=180; min_stock_threshold=30; reorder_point=40 },
    @{ name="Amul Taaza Milk 500ml"; sku="BEV-004"; barcode="8901030323453"; category="Beverages"; unit="packet"; purchase_price=25; selling_price=29; current_stock=80; min_stock_threshold=20; reorder_point=30 },

    # Dairy
    @{ name="Amul Butter 500g"; sku="DRY-001"; barcode="8901030423450"; category="Dairy"; unit="packet"; purchase_price=250; selling_price=290; current_stock=25; min_stock_threshold=8; reorder_point=12 },
    @{ name="Mother Dairy Curd 400g"; sku="DRY-002"; barcode="8901030423451"; category="Dairy"; unit="cup"; purchase_price=35; selling_price=42; current_stock=40; min_stock_threshold=10; reorder_point=15 },
    @{ name="Amul Cheese Slices 200g"; sku="DRY-003"; barcode="8901030423452"; category="Dairy"; unit="packet"; purchase_price=95; selling_price=115; current_stock=30; min_stock_threshold=8; reorder_point=12 },

    # Personal Care
    @{ name="Dove Soap 100g"; sku="PRC-001"; barcode="8901030523450"; category="Personal Care"; unit="piece"; purchase_price=42; selling_price=52; current_stock=90; min_stock_threshold=20; reorder_point=25 },
    @{ name="Colgate MaxFresh Toothpaste 150g"; sku="PRC-002"; barcode="8901030523451"; category="Personal Care"; unit="tube"; purchase_price=78; selling_price=95; current_stock=70; min_stock_threshold=15; reorder_point=20 },
    @{ name="Head & Shoulders Shampoo 340ml"; sku="PRC-003"; barcode="8901030523452"; category="Personal Care"; unit="bottle"; purchase_price=280; selling_price=340; current_stock=35; min_stock_threshold=8; reorder_point=12 },
    @{ name="Dettol Handwash 200ml"; sku="PRC-004"; barcode="8901030523453"; category="Personal Care"; unit="bottle"; purchase_price=55; selling_price=68; current_stock=60; min_stock_threshold=12; reorder_point=18 },

    # Household
    @{ name="Vim Dishwash Bar 300g"; sku="HH-001"; barcode="8901030623450"; category="Household"; unit="piece"; purchase_price=18; selling_price=22; current_stock=100; min_stock_threshold=20; reorder_point=30 },
    @{ name="Surf Excel Easy Wash 1kg"; sku="HH-002"; barcode="8901030623451"; category="Household"; unit="packet"; purchase_price=110; selling_price=135; current_stock=50; min_stock_threshold=12; reorder_point=18 },
    @{ name="Harpic Toilet Cleaner 500ml"; sku="HH-003"; barcode="8901030623452"; category="Household"; unit="bottle"; purchase_price=85; selling_price=105; current_stock=45; min_stock_threshold=10; reorder_point=15 },

    # Spices & Masala
    @{ name="MDH Chana Masala 100g"; sku="SPC-001"; barcode="8901030723450"; category="Spices"; unit="packet"; purchase_price=52; selling_price=65; current_stock=70; min_stock_threshold=15; reorder_point=20 },
    @{ name="Everest Turmeric Powder 200g"; sku="SPC-002"; barcode="8901030723451"; category="Spices"; unit="packet"; purchase_price=45; selling_price=55; current_stock=65; min_stock_threshold=15; reorder_point=20 },
    @{ name="Catch Red Chilli Powder 200g"; sku="SPC-003"; barcode="8901030723452"; category="Spices"; unit="packet"; purchase_price=50; selling_price=62; current_stock=55; min_stock_threshold=12; reorder_point=18 },

    # Low stock items (to trigger alerts)
    @{ name="Ghee (Patanjali) 1L"; sku="DRY-004"; barcode="8901030823450"; category="Dairy"; unit="jar"; purchase_price=480; selling_price=560; current_stock=3; min_stock_threshold=5; reorder_point=8 },
    @{ name="Saffola Gold Oil 1L"; sku="GRC-007"; barcode="8901030823451"; category="Groceries"; unit="bottle"; purchase_price=175; selling_price=210; current_stock=2; min_stock_threshold=8; reorder_point=12 },
    @{ name="Cadbury Dairy Milk Silk 150g"; sku="SNK-006"; barcode="8901030823452"; category="Snacks"; unit="piece"; purchase_price=130; selling_price=160; current_stock=0; min_stock_threshold=10; reorder_point=15 }
)

foreach ($item in $items) {
    $body = $item | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BASE/items" -Method POST -Headers $headers -Body $body
    Write-Host "  + $($item.name) (Stock: $($item.current_stock))" -ForegroundColor Green
}

# --- Step 4: Add Customers ---
Write-Host "`n[4/7] Adding customers..." -ForegroundColor Yellow

$customers = @(
    @{ name="Priya Sharma"; phone_number="9876543001"; email="priya.sharma@gmail.com"; address="Flat 201, Andheri West, Mumbai" },
    @{ name="Rajesh Gupta"; phone_number="9876543002"; email="rajesh.gupta@yahoo.com"; address="B-12, Sector 15, Noida" },
    @{ name="Meena Devi"; phone_number="9876543003"; address="House 45, MG Road, Pune" },
    @{ name="Amit Patel"; phone_number="9876543004"; email="amit.patel@gmail.com"; address="Shop 8, Navrangpura, Ahmedabad" },
    @{ name="Sunita Kumari"; phone_number="9876543005"; address="Flat 3B, Lajpat Nagar, Delhi" },
    @{ name="Vikash Yadav"; phone_number="9876543006"; email="vikash.y@outlook.com"; address="Near Bus Stand, Varanasi" },
    @{ name="Fatima Begum"; phone_number="9876543007"; address="Old City, Hyderabad" },
    @{ name="Arjun Reddy"; phone_number="9876543008"; email="arjun.r@gmail.com"; address="Jubilee Hills, Hyderabad" },
    @{ name="Lakshmi Iyer"; phone_number="9876543009"; email="lakshmi.iyer@gmail.com"; address="T. Nagar, Chennai" },
    @{ name="Mohammed Irfan"; phone_number="9876543010"; address="Charminar Area, Hyderabad" },
    @{ name="Geeta Deshpande"; phone_number="9876543011"; email="geeta.d@gmail.com"; address="Shivaji Nagar, Pune" },
    @{ name="Ravi Shankar"; phone_number="9876543012"; address="Gomti Nagar, Lucknow" }
)

foreach ($c in $customers) {
    $body = $c | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BASE/customers" -Method POST -Headers $headers -Body $body
    Write-Host "  + $($c.name) ($($c.phone_number))" -ForegroundColor Green
}

# --- Step 5: Create Purchase Orders ---
Write-Host "`n[5/7] Creating purchase orders..." -ForegroundColor Yellow

$purchaseOrders = @(
    @{ supplier_id=1; total_amount=5600; notes="Monthly HUL restock"; items=@(
        @{ item_id=19; quantity=30; unit_price=42 },
        @{ item_id=20; quantity=20; unit_price=78 },
        @{ item_id=22; quantity=25; unit_price=55 }
    )},
    @{ supplier_id=2; total_amount=4800; notes="ITC products order"; items=@(
        @{ item_id=12; quantity=20; unit_price=195 },
        @{ item_id=23; quantity=40; unit_price=18 }
    )},
    @{ supplier_id=3; total_amount=3360; notes="Parle biscuits bulk order"; items=@(
        @{ item_id=7; quantity=50; unit_price=48 },
        @{ item_id=9; quantity=40; unit_price=17 }
    )},
    @{ supplier_id=4; total_amount=8750; notes="Amul dairy products"; items=@(
        @{ item_id=15; quantity=50; unit_price=25 },
        @{ item_id=16; quantity=20; unit_price=250 },
        @{ item_id=18; quantity=15; unit_price=95 }
    )},
    @{ supplier_id=8; total_amount=5600; notes="Nestle products restock"; items=@(
        @{ item_id=8; quantity=60; unit_price=48 },
        @{ item_id=13; quantity=15; unit_price=230 }
    )}
)

foreach ($po in $purchaseOrders) {
    $body = $po | ConvertTo-Json -Depth 3
    $resp = Invoke-RestMethod -Uri "$BASE/purchase-orders" -Method POST -Headers $headers -Body $body
    Write-Host "  + PO #$($resp.data.purchase_order.id) - Rs.$($po.total_amount) ($($po.notes))" -ForegroundColor Green
}

# Mark first two as received (adds stock)
Write-Host "  Marking PO #1 as received..." -ForegroundColor DarkYellow
Invoke-RestMethod -Uri "$BASE/purchase-orders/1/status" -Method PATCH -Headers $headers -Body '{"status":"received"}'
Write-Host "  Marking PO #2 as received..." -ForegroundColor DarkYellow
Invoke-RestMethod -Uri "$BASE/purchase-orders/2/status" -Method PATCH -Headers $headers -Body '{"status":"received"}'

# --- Step 6: Create Sales ---
Write-Host "`n[6/7] Creating sales transactions..." -ForegroundColor Yellow

$sales = @(
    @{ customer_id=1; total_amount=573; discount=23; final_amount=550; payment_method="upi"; payment_status="paid"; paid_amount=550; notes="Regular weekly purchase"; items=@(
        @{ item_id=2; quantity=1; unit_price=250 },
        @{ item_id=3; quantity=1; unit_price=160 },
        @{ item_id=1; quantity=2; unit_price=22 },
        @{ item_id=6; quantity=2; unit_price=45 },
        @{ item_id=27; quantity=1; unit_price=55 }
    )},
    @{ customer_id=2; total_amount=396; discount=0; final_amount=396; payment_method="cash"; payment_status="paid"; paid_amount=396; items=@(
        @{ item_id=7; quantity=2; unit_price=56 },
        @{ item_id=8; quantity=3; unit_price=56 },
        @{ item_id=14; quantity=2; unit_price=40 },
        @{ item_id=9; quantity=2; unit_price=20 }
    )},
    @{ customer_id=3; total_amount=1015; discount=15; final_amount=1000; payment_method="cash"; payment_status="paid"; paid_amount=1000; notes="Bulk monthly purchase"; items=@(
        @{ item_id=5; quantity=1; unit_price=440 },
        @{ item_id=4; quantity=2; unit_price=145 },
        @{ item_id=12; quantity=1; unit_price=230 },
        @{ item_id=26; quantity=1; unit_price=65 }
    )},
    @{ customer_id=4; total_amount=740; discount=0; final_amount=740; payment_method="card"; payment_status="paid"; paid_amount=740; items=@(
        @{ item_id=16; quantity=1; unit_price=290 },
        @{ item_id=21; quantity=1; unit_price=340 },
        @{ item_id=20; quantity=1; unit_price=95 }
    )},
    @{ customer_id=5; total_amount=510; discount=10; final_amount=500; payment_method="upi"; payment_status="paid"; paid_amount=500; items=@(
        @{ item_id=24; quantity=2; unit_price=135 },
        @{ item_id=25; quantity=1; unit_price=105 },
        @{ item_id=23; quantity=3; unit_price=22 },
        @{ item_id=19; quantity=1; unit_price=52 }
    )},
    @{ customer_id=6; total_amount=283; discount=0; final_amount=283; payment_method="cash"; payment_status="paid"; paid_amount=283; items=@(
        @{ item_id=8; quantity=2; unit_price=56 },
        @{ item_id=11; quantity=3; unit_price=20 },
        @{ item_id=10; quantity=1; unit_price=38 },
        @{ item_id=15; quantity=3; unit_price=29 }
    )},
    @{ customer_id=7; total_amount=627; discount=27; final_amount=600; payment_method="cash"; payment_status="paid"; paid_amount=600; items=@(
        @{ item_id=2; quantity=1; unit_price=250 },
        @{ item_id=6; quantity=3; unit_price=45 },
        @{ item_id=1; quantity=3; unit_price=22 },
        @{ item_id=28; quantity=2; unit_price=62 },
        @{ item_id=22; quantity=1; unit_price=68 }
    )},
    @{ customer_id=8; total_amount=1185; discount=35; final_amount=1150; payment_method="card"; payment_status="paid"; paid_amount=1150; items=@(
        @{ item_id=13; quantity=2; unit_price=275 },
        @{ item_id=16; quantity=1; unit_price=290 },
        @{ item_id=18; quantity=2; unit_price=115 },
        @{ item_id=17; quantity=1; unit_price=42 }
    )},
    @{ total_amount=176; discount=0; final_amount=176; payment_method="cash"; payment_status="paid"; paid_amount=176; notes="Walk-in customer"; items=@(
        @{ item_id=7; quantity=1; unit_price=56 },
        @{ item_id=9; quantity=3; unit_price=20 },
        @{ item_id=14; quantity=1; unit_price=40 },
        @{ item_id=11; quantity=1; unit_price=20 }
    )},
    @{ customer_id=9; total_amount=855; discount=5; final_amount=850; payment_method="upi"; payment_status="paid"; paid_amount=850; items=@(
        @{ item_id=5; quantity=1; unit_price=440 },
        @{ item_id=3; quantity=1; unit_price=160 },
        @{ item_id=12; quantity=1; unit_price=230 },
        @{ item_id=1; quantity=1; unit_price=22 }
    )},
    @{ customer_id=10; total_amount=318; discount=0; final_amount=318; payment_method="cash"; payment_status="paid"; paid_amount=318; items=@(
        @{ item_id=26; quantity=2; unit_price=65 },
        @{ item_id=27; quantity=2; unit_price=55 },
        @{ item_id=28; quantity=1; unit_price=62 }
    )},
    @{ customer_id=11; total_amount=460; discount=0; final_amount=460; payment_method="credit"; payment_status="pending"; paid_amount=0; notes="Will pay next week"; items=@(
        @{ item_id=2; quantity=1; unit_price=250 },
        @{ item_id=4; quantity=1; unit_price=145 },
        @{ item_id=26; quantity=1; unit_price=65 }
    )}
)

$saleNum = 0
foreach ($sale in $sales) {
    $saleNum++
    $body = $sale | ConvertTo-Json -Depth 3
    $resp = Invoke-RestMethod -Uri "$BASE/sales" -Method POST -Headers $headers -Body $body
    $custName = if ($sale.customer_id) { "Customer #$($sale.customer_id)" } else { "Walk-in" }
    Write-Host "  + BILL-$($resp.data.sale.id) | Rs.$($sale.final_amount) | $($sale.payment_method) | $custName" -ForegroundColor Green
}

# --- Step 7: Record Supplier Payments ---
Write-Host "`n[7/7] Recording supplier payments..." -ForegroundColor Yellow

$payments = @(
    @{ supplier_id=1; purchase_order_id=1; amount=5600; method="bank_transfer"; reference_number="NEFT-2026031001"; notes="Full payment for PO #1" },
    @{ supplier_id=2; purchase_order_id=2; amount=2500; method="cheque"; reference_number="CHQ-445566"; notes="Partial payment for PO #2" },
    @{ supplier_id=3; purchase_order_id=3; amount=3360; method="upi"; reference_number="UPI-PARLE-001"; notes="Full payment for PO #3" }
)

foreach ($p in $payments) {
    $body = $p | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BASE/payments/supplier" -Method POST -Headers $headers -Body $body
    Write-Host "  + Rs.$($p.amount) to Supplier #$($p.supplier_id) ($($p.method))" -ForegroundColor Green
}

# --- Summary ---
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Seeding Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$dash = Invoke-RestMethod -Uri "$BASE/dashboard" -Method GET -Headers $headers
Write-Host "`n  Dashboard Summary:" -ForegroundColor White
Write-Host "  - Today's Sales:    Rs.$($dash.data.today.sales)" -ForegroundColor White
Write-Host "  - Today's Bills:    $($dash.data.today.bills)" -ForegroundColor White
Write-Host "  - Total Items:      $($dash.data.inventory.total_items)" -ForegroundColor White
Write-Host "  - Low Stock Items:  $($dash.data.inventory.low_stock_items)" -ForegroundColor White
Write-Host "  - Out of Stock:     $($dash.data.inventory.out_of_stock_items)" -ForegroundColor White
Write-Host "  - Stock Value:      Rs.$($dash.data.inventory.total_stock_value)" -ForegroundColor White

Write-Host "`n  Data seeded:" -ForegroundColor DarkGray
Write-Host "    8 Suppliers" -ForegroundColor DarkGray
Write-Host "   31 Inventory Items (across 7 categories)" -ForegroundColor DarkGray
Write-Host "   12 Customers" -ForegroundColor DarkGray
Write-Host "    5 Purchase Orders (2 received, 3 pending)" -ForegroundColor DarkGray
Write-Host "   12 Sales (11 paid, 1 credit/pending)" -ForegroundColor DarkGray
Write-Host "    3 Supplier Payments" -ForegroundColor DarkGray

Write-Host "`n  Open http://localhost:3000 to see it all!`n" -ForegroundColor Green
