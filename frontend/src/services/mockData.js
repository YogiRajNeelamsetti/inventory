// Mock data for the application - no backend needed

// Dashboard Data
export const dashboardData = {
  today: {
    sales: 45000.00,
    bills: 125,
    profit: 8500.00,
    cash_sales: 20000.00,
    digital_sales: 25000.00
  },
  this_month: {
    sales: 450000.00,
    purchases: 280000.00,
    profit: 85000.00,
    bills: 1250
  },
  inventory: {
    total_items: 150,
    low_stock_items: 12,
    out_of_stock_items: 3,
    total_stock_value: 125000.50
  },
  payments: {
    pending_supplier_payments: 45000.00,
    pending_customer_payments: 15000.00
  }
};

// Suppliers Data
export const suppliers = [
  {
    id: 1,
    company_name: "ABC Distributors",
    contact_person: "Ramesh Kumar",
    phone: "9123456789",
    email: "abc@suppliers.com",
    address: "Warehouse 5, Industrial Area, Mumbai",
    gst_number: "24AABCU9603R1ZM"
  },
  {
    id: 2,
    company_name: "XYZ Wholesale",
    contact_person: "Suresh Patel",
    phone: "9876543210",
    email: "xyz@suppliers.com",
    address: "Plot 12, Market Yard, Pune",
    gst_number: "27AABCU9603R1ZM"
  },
  {
    id: 3,
    company_name: "Global Foods Supply",
    contact_person: "Amit Shah",
    phone: "9988776655",
    email: "global@suppliers.com",
    address: "Shop 45, Wholesale Market, Delhi",
    gst_number: "07AABCU9603R1ZM"
  },
  {
    id: 4,
    company_name: "Metro Trading Co",
    contact_person: "Vijay Kumar",
    phone: "9876512345",
    email: "metro@suppliers.com",
    address: "Building 23, Trade Center, Bangalore",
    gst_number: "29AABCU9603R1ZM"
  }
];

// Items/Products Data
export const items = [
  {
    id: 1,
    name: "Tata Salt 1kg",
    sku: "SALT-001",
    barcode: "8901030123450",
    category: "Groceries",
    unit: "kg",
    purchase_price: 35.00,
    selling_price: 40.00,
    current_stock: 50.5,
    min_stock_threshold: 10,
    reorder_point: 15,
    is_available: true,
    is_low_stock: false,
    last_purchase_date: "2024-12-20T10:00:00Z",
    last_sale_date: "2024-12-26T14:30:00Z"
  },
  {
    id: 2,
    name: "Maggi Noodles 200g",
    sku: "MAG-200",
    barcode: "8901030456789",
    category: "Snacks",
    unit: "packet",
    purchase_price: 10.00,
    selling_price: 12.00,
    current_stock: 8,
    min_stock_threshold: 20,
    reorder_point: 25,
    is_available: true,
    is_low_stock: true,
    last_purchase_date: "2024-12-15T10:00:00Z",
    last_sale_date: "2024-12-27T11:20:00Z"
  },
  {
    id: 3,
    name: "Britannia Biscuits 500g",
    sku: "BIS-500",
    barcode: "8901030789012",
    category: "Snacks",
    unit: "packet",
    purchase_price: 45.00,
    selling_price: 50.00,
    current_stock: 35,
    min_stock_threshold: 15,
    reorder_point: 20,
    is_available: true,
    is_low_stock: false,
    last_purchase_date: "2024-12-18T10:00:00Z",
    last_sale_date: "2024-12-26T16:45:00Z"
  },
  {
    id: 4,
    name: "Amul Milk 1L",
    sku: "MLK-001",
    barcode: "8901030345678",
    category: "Dairy",
    unit: "liter",
    purchase_price: 50.00,
    selling_price: 58.00,
    current_stock: 25,
    min_stock_threshold: 10,
    reorder_point: 15,
    is_available: true,
    is_low_stock: false,
    last_purchase_date: "2024-12-26T08:00:00Z",
    last_sale_date: "2024-12-27T09:15:00Z"
  },
  {
    id: 5,
    name: "Surf Excel 1kg",
    sku: "DET-001",
    barcode: "8901030567890",
    category: "Household",
    unit: "kg",
    purchase_price: 120.00,
    selling_price: 140.00,
    current_stock: 18,
    min_stock_threshold: 10,
    reorder_point: 12,
    is_available: true,
    is_low_stock: false,
    last_purchase_date: "2024-12-22T10:00:00Z",
    last_sale_date: "2024-12-25T14:30:00Z"
  },
  {
    id: 6,
    name: "Parle-G Biscuits 1kg",
    sku: "BIS-001",
    barcode: "8901030234567",
    category: "Snacks",
    unit: "kg",
    purchase_price: 80.00,
    selling_price: 95.00,
    current_stock: 5,
    min_stock_threshold: 15,
    reorder_point: 20,
    is_available: true,
    is_low_stock: true,
    last_purchase_date: "2024-12-10T10:00:00Z",
    last_sale_date: "2024-12-27T10:00:00Z"
  },
  {
    id: 7,
    name: "Red Label Tea 500g",
    sku: "TEA-500",
    barcode: "8901030678901",
    category: "Beverages",
    unit: "packet",
    purchase_price: 180.00,
    selling_price: 200.00,
    current_stock: 0,
    min_stock_threshold: 10,
    reorder_point: 15,
    is_available: false,
    is_low_stock: false,
    last_purchase_date: "2024-12-05T10:00:00Z",
    last_sale_date: "2024-12-24T18:30:00Z"
  },
  {
    id: 8,
    name: "Fortune Oil 1L",
    sku: "OIL-001",
    barcode: "8901030890123",
    category: "Groceries",
    unit: "liter",
    purchase_price: 140.00,
    selling_price: 165.00,
    current_stock: 30,
    min_stock_threshold: 12,
    reorder_point: 18,
    is_available: true,
    is_low_stock: false,
    last_purchase_date: "2024-12-20T10:00:00Z",
    last_sale_date: "2024-12-26T13:20:00Z"
  },
  {
    id: 9,
    name: "Colgate Toothpaste 200g",
    sku: "TPS-200",
    barcode: "8901030901234",
    category: "Personal Care",
    unit: "piece",
    purchase_price: 90.00,
    selling_price: 105.00,
    current_stock: 22,
    min_stock_threshold: 15,
    reorder_point: 20,
    is_available: true,
    is_low_stock: false,
    last_purchase_date: "2024-12-19T10:00:00Z",
    last_sale_date: "2024-12-27T08:45:00Z"
  },
  {
    id: 10,
    name: "Lays Chips 100g",
    sku: "CHP-100",
    barcode: "8901030012345",
    category: "Snacks",
    unit: "packet",
    purchase_price: 18.00,
    selling_price: 20.00,
    current_stock: 45,
    min_stock_threshold: 20,
    reorder_point: 30,
    is_available: true,
    is_low_stock: false,
    last_purchase_date: "2024-12-24T10:00:00Z",
    last_sale_date: "2024-12-27T12:30:00Z"
  }
];

// Purchase Orders Data
export const purchaseOrders = [
  {
    id: 1,
    supplier_id: 1,
    supplier_name: "ABC Distributors",
    order_date: "2024-12-20T10:00:00Z",
    status: "received",
    total_amount: 25000.00,
    payment_status: "partial",
    paid_amount: 10000.00,
    pending_amount: 15000.00,
    items_count: 5
  },
  {
    id: 2,
    supplier_id: 2,
    supplier_name: "XYZ Wholesale",
    order_date: "2024-12-22T14:30:00Z",
    status: "received",
    total_amount: 18500.00,
    payment_status: "paid",
    paid_amount: 18500.00,
    pending_amount: 0,
    items_count: 4
  },
  {
    id: 3,
    supplier_id: 3,
    supplier_name: "Global Foods Supply",
    order_date: "2024-12-25T09:00:00Z",
    status: "pending",
    total_amount: 32000.00,
    payment_status: "pending",
    paid_amount: 0,
    pending_amount: 32000.00,
    items_count: 6
  },
  {
    id: 4,
    supplier_id: 1,
    supplier_name: "ABC Distributors",
    order_date: "2024-12-26T11:30:00Z",
    status: "pending",
    total_amount: 15000.00,
    payment_status: "pending",
    paid_amount: 0,
    pending_amount: 15000.00,
    items_count: 3
  }
];

// Customers Data
export const customers = [
  {
    id: 1,
    name: "Priya Sharma",
    phone_number: "9876543210",
    email: "priya@gmail.com",
    address: "Flat 201, Building A, Andheri, Mumbai",
    total_purchases: 15000.50
  },
  {
    id: 2,
    name: "Rahul Verma",
    phone_number: "9123456789",
    email: "rahul@gmail.com",
    address: "House 45, Sector 12, Pune",
    total_purchases: 8500.00
  },
  {
    id: 3,
    name: "Anjali Gupta",
    phone_number: "9988776655",
    email: "anjali@gmail.com",
    address: "Apartment 304, Tower B, Delhi",
    total_purchases: 22000.75
  },
  {
    id: 4,
    name: "Vikram Singh",
    phone_number: "9876512345",
    email: "vikram@gmail.com",
    address: "Bungalow 12, Green Park, Bangalore",
    total_purchases: 32500.00
  }
];

// Sales Data
export const sales = [
  {
    id: 1,
    bill_number: "BILL-000001",
    customer_id: 1,
    customer_name: "Priya Sharma",
    sale_date: "2024-12-26T14:30:00Z",
    total_amount: 140.00,
    discount: 10.00,
    final_amount: 130.00,
    payment_method: "upi",
    payment_status: "paid",
    items_count: 2
  },
  {
    id: 2,
    bill_number: "BILL-000002",
    customer_id: null,
    customer_name: "Walk-in",
    sale_date: "2024-12-26T15:45:00Z",
    total_amount: 235.00,
    discount: 0,
    final_amount: 235.00,
    payment_method: "cash",
    payment_status: "paid",
    items_count: 4
  },
  {
    id: 3,
    bill_number: "BILL-000003",
    customer_id: 2,
    customer_name: "Rahul Verma",
    sale_date: "2024-12-26T16:20:00Z",
    total_amount: 450.00,
    discount: 20.00,
    final_amount: 430.00,
    payment_method: "card",
    payment_status: "paid",
    items_count: 5
  },
  {
    id: 4,
    bill_number: "BILL-000004",
    customer_id: null,
    customer_name: "Walk-in",
    sale_date: "2024-12-27T10:15:00Z",
    total_amount: 85.00,
    discount: 0,
    final_amount: 85.00,
    payment_method: "upi",
    payment_status: "paid",
    items_count: 3
  },
  {
    id: 5,
    bill_number: "BILL-000005",
    customer_id: 3,
    customer_name: "Anjali Gupta",
    sale_date: "2024-12-27T11:30:00Z",
    total_amount: 650.00,
    discount: 30.00,
    final_amount: 620.00,
    payment_method: "credit",
    payment_status: "pending",
    items_count: 6
  },
  {
    id: 6,
    bill_number: "BILL-000006",
    customer_id: null,
    customer_name: "Walk-in",
    sale_date: "2024-12-27T12:45:00Z",
    total_amount: 120.00,
    discount: 0,
    final_amount: 120.00,
    payment_method: "cash",
    payment_status: "paid",
    items_count: 2
  }
];

// Categories Data
export const categories = [
  {
    id: 1,
    name: "Groceries",
    item_count: 45,
    total_stock_value: 45000.00
  },
  {
    id: 2,
    name: "Snacks",
    item_count: 32,
    total_stock_value: 18000.00
  },
  {
    id: 3,
    name: "Beverages",
    item_count: 18,
    total_stock_value: 12000.00
  },
  {
    id: 4,
    name: "Dairy",
    item_count: 12,
    total_stock_value: 8500.00
  },
  {
    id: 5,
    name: "Household",
    item_count: 25,
    total_stock_value: 22000.00
  },
  {
    id: 6,
    name: "Personal Care",
    item_count: 18,
    total_stock_value: 15500.50
  }
];

// Helper function to simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockApi = {
  // ==================== Dashboard ====================
  getDashboard: async () => {
    await delay(300);
    return { success: true, data: dashboardData };
  },

  // ==================== Suppliers ====================
  getSuppliers: async (params = {}) => {
    await delay(200);
    let filtered = [...suppliers];
    
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(s => 
        s.company_name.toLowerCase().includes(search)
      );
    }

    return {
      success: true,
      data: {
        suppliers: filtered,
        pagination: {
          total: filtered.length,
          page: 1,
          limit: 20,
          total_pages: 1
        }
      }
    };
  },

  getSupplierById: async (id) => {
    await delay(200);
    const supplier = suppliers.find(s => s.id === parseInt(id));
    if (!supplier) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Supplier not found" } };
    }
    return { success: true, data: { supplier } };
  },

  addSupplier: async (data) => {
    await delay(300);
    const newSupplier = {
      id: suppliers.length + 1,
      ...data,
      created_at: new Date().toISOString()
    };
    suppliers.push(newSupplier);
    return {
      success: true,
      data: { supplier: newSupplier },
      message: "Supplier added successfully"
    };
  },

  updateSupplier: async (id, data) => {
    await delay(300);
    const index = suppliers.findIndex(s => s.id === parseInt(id));
    if (index === -1) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Supplier not found" } };
    }
    suppliers[index] = { ...suppliers[index], ...data };
    return {
      success: true,
      data: { supplier: suppliers[index] },
      message: "Supplier updated successfully"
    };
  },

  deleteSupplier: async (id) => {
    await delay(300);
    const index = suppliers.findIndex(s => s.id === parseInt(id));
    if (index === -1) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Supplier not found" } };
    }
    suppliers.splice(index, 1);
    return { success: true, message: "Supplier deleted successfully" };
  },

  // ==================== Items ====================
  getItems: async (params = {}) => {
    await delay(200);
    let filtered = [...items];
    
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.sku?.toLowerCase().includes(search) ||
        item.barcode?.includes(search)
      );
    }

    if (params.category) {
      filtered = filtered.filter(item => item.category === params.category);
    }

    return {
      success: true,
      data: {
        items: filtered,
        pagination: {
          total: filtered.length,
          page: 1,
          limit: 20,
          total_pages: 1
        }
      }
    };
  },

  getItemById: async (id) => {
    await delay(200);
    const item = items.find(i => i.id === parseInt(id));
    if (!item) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Item not found" } };
    }
    return { success: true, data: { item } };
  },

  getAvailableItems: async (params = {}) => {
    await delay(200);
    let filtered = items.filter(item => item.is_available);
    
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.sku?.toLowerCase().includes(search) ||
        item.barcode?.includes(search)
      );
    }

    return {
      success: true,
      data: { items: filtered }
    };
  },

  getItemsInventory: async (params = {}) => {
    await delay(200);
    let filtered = [...items];
    
    if (params.low_stock) {
      filtered = filtered.filter(item => item.is_low_stock || item.current_stock === 0);
    }

    return {
      success: true,
      data: {
        items: filtered,
        summary: {
          total_items: items.length,
          low_stock_items: items.filter(i => i.is_low_stock).length,
          out_of_stock_items: items.filter(i => i.current_stock === 0).length,
          total_stock_value: items.reduce((sum, i) => sum + (i.current_stock * i.purchase_price), 0)
        },
        pagination: {
          total: filtered.length,
          page: 1,
          limit: 50,
          total_pages: 1
        }
      }
    };
  },

  addItem: async (data) => {
    await delay(300);
    const newItem = {
      id: items.length + 1,
      ...data,
      is_available: true,
      is_low_stock: data.current_stock <= data.min_stock_threshold,
      created_at: new Date().toISOString()
    };
    items.push(newItem);
    return {
      success: true,
      data: { item: newItem },
      message: "Item added successfully"
    };
  },

  updateItem: async (id, data) => {
    await delay(300);
    const index = items.findIndex(i => i.id === parseInt(id));
    if (index === -1) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Item not found" } };
    }
    items[index] = { 
      ...items[index], 
      ...data,
      is_low_stock: data.current_stock <= data.min_stock_threshold,
      is_available: data.current_stock > 0
    };
    return {
      success: true,
      data: { item: items[index] },
      message: "Item updated successfully"
    };
  },

  deleteItem: async (id) => {
    await delay(300);
    const index = items.findIndex(i => i.id === parseInt(id));
    if (index === -1) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Item not found" } };
    }
    items.splice(index, 1);
    return { success: true, message: "Item deleted successfully" };
  },

  adjustStock: async (id, data) => {
    await delay(300);
    const item = items.find(i => i.id === parseInt(id));
    if (!item) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Item not found" } };
    }
    item.current_stock += data.adjustment;
    item.is_low_stock = item.current_stock <= item.min_stock_threshold;
    item.is_available = item.current_stock > 0;
    return {
      success: true,
      data: { item },
      message: "Stock adjusted successfully"
    };
  },

  getItemTransactions: async (id, params = {}) => {
    await delay(200);
    // Return mock transaction history for an item
    return {
      success: true,
      data: {
        transactions: [
          { id: 1, type: 'sale', quantity: -2, date: new Date().toISOString(), reference: 'BILL-000001' },
          { id: 2, type: 'purchase', quantity: 10, date: new Date().toISOString(), reference: 'PO-1' },
        ]
      }
    };
  },

  // ==================== Categories ====================
  getCategories: async () => {
    await delay(200);
    return {
      success: true,
      data: { categories }
    };
  },

  addCategory: async (data) => {
    await delay(300);
    const newCategory = {
      id: categories.length + 1,
      ...data,
      item_count: 0,
      total_stock_value: 0
    };
    categories.push(newCategory);
    return {
      success: true,
      data: { category: newCategory },
      message: "Category added successfully"
    };
  },

  updateCategory: async (id, data) => {
    await delay(300);
    const index = categories.findIndex(c => c.id === parseInt(id));
    if (index === -1) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Category not found" } };
    }
    categories[index] = { ...categories[index], ...data };
    return {
      success: true,
      data: { category: categories[index] },
      message: "Category updated successfully"
    };
  },

  deleteCategory: async (id) => {
    await delay(300);
    const index = categories.findIndex(c => c.id === parseInt(id));
    if (index === -1) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Category not found" } };
    }
    categories.splice(index, 1);
    return { success: true, message: "Category deleted successfully" };
  },

  // ==================== Purchase Orders ====================
  getPurchaseOrders: async (params = {}) => {
    await delay(200);
    return {
      success: true,
      data: {
        purchase_orders: purchaseOrders,
        summary: {
          total_purchases: purchaseOrders.reduce((sum, po) => sum + po.total_amount, 0),
          total_orders: purchaseOrders.length,
          pending_payment: purchaseOrders.reduce((sum, po) => sum + po.pending_amount, 0)
        },
        pagination: {
          total: purchaseOrders.length,
          page: 1,
          limit: 20,
          total_pages: 1
        }
      }
    };
  },

  getPurchaseOrderById: async (id) => {
    await delay(200);
    const po = purchaseOrders.find(p => p.id === parseInt(id));
    if (!po) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Purchase order not found" } };
    }
    return { success: true, data: { purchase_order: po } };
  },

  createPurchaseOrder: async (data) => {
    await delay(400);
    const newPO = {
      id: purchaseOrders.length + 1,
      ...data,
      status: "pending",
      items_count: data.items.length,
      total_amount: data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0),
      pending_amount: data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0),
      supplier_name: suppliers.find(s => s.id === parseInt(data.supplier_id))?.company_name || "Unknown"
    };
    purchaseOrders.unshift(newPO);
    return {
      success: true,
      data: { purchase_order: newPO },
      message: "Purchase order created successfully"
    };
  },

  updatePurchaseOrder: async (id, data) => {
    await delay(300);
    const index = purchaseOrders.findIndex(p => p.id === parseInt(id));
    if (index === -1) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Purchase order not found" } };
    }
    purchaseOrders[index] = { ...purchaseOrders[index], ...data };
    return {
      success: true,
      data: { purchase_order: purchaseOrders[index] },
      message: "Purchase order updated successfully"
    };
  },

  updatePurchaseOrderStatus: async (id, data) => {
    await delay(300);
    const po = purchaseOrders.find(p => p.id === parseInt(id));
    if (po) {
      po.status = data.status;
      if (data.status === 'received') {
        // Update stock quantities in items
        // In a real app, this would update based on the PO items
      }
    }
    return {
      success: true,
      data: { purchase_order: po },
      message: "Stock updated successfully"
    };
  },

  deletePurchaseOrder: async (id) => {
    await delay(300);
    const index = purchaseOrders.findIndex(p => p.id === parseInt(id));
    if (index === -1) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Purchase order not found" } };
    }
    purchaseOrders.splice(index, 1);
    return { success: true, message: "Purchase order deleted successfully" };
  },

  // ==================== Customers ====================
  getCustomers: async (params = {}) => {
    await delay(200);
    let filtered = [...customers];
    
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.phone_number.includes(search)
      );
    }

    return {
      success: true,
      data: {
        customers: filtered,
        pagination: {
          total: filtered.length,
          page: 1,
          limit: 20,
          total_pages: 1
        }
      }
    };
  },

  getCustomerById: async (id) => {
    await delay(200);
    const customer = customers.find(c => c.id === parseInt(id));
    if (!customer) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Customer not found" } };
    }
    return { success: true, data: { customer } };
  },

  searchCustomer: async (phone) => {
    await delay(200);
    const customer = customers.find(c => c.phone_number === phone);
    if (!customer) {
      throw {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Customer not found"
        }
      };
    }
    return {
      success: true,
      data: { customer }
    };
  },

  addCustomer: async (data) => {
    await delay(300);
    const newCustomer = {
      id: customers.length + 1,
      ...data,
      total_purchases: 0,
      created_at: new Date().toISOString()
    };
    customers.push(newCustomer);
    return {
      success: true,
      data: { customer: newCustomer },
      message: "Customer added successfully"
    };
  },

  updateCustomer: async (id, data) => {
    await delay(300);
    const index = customers.findIndex(c => c.id === parseInt(id));
    if (index === -1) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Customer not found" } };
    }
    customers[index] = { ...customers[index], ...data };
    return {
      success: true,
      data: { customer: customers[index] },
      message: "Customer updated successfully"
    };
  },

  deleteCustomer: async (id) => {
    await delay(300);
    const index = customers.findIndex(c => c.id === parseInt(id));
    if (index === -1) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Customer not found" } };
    }
    customers.splice(index, 1);
    return { success: true, message: "Customer deleted successfully" };
  },

  // ==================== Sales ====================
  getSales: async (params = {}) => {
    await delay(200);
    let filtered = [...sales];
    
    if (params.date_from) {
      filtered = filtered.filter(s => new Date(s.sale_date) >= new Date(params.date_from));
    }
    if (params.date_to) {
      filtered = filtered.filter(s => new Date(s.sale_date) <= new Date(params.date_to));
    }
    
    return {
      success: true,
      data: {
        sales: filtered,
        summary: {
          total_sales: filtered.reduce((sum, s) => sum + s.final_amount, 0),
          total_bills: filtered.length,
          total_profit: filtered.reduce((sum, s) => sum + (s.final_amount * 0.15), 0),
          cash_sales: filtered.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + s.final_amount, 0),
          card_sales: filtered.filter(s => s.payment_method === 'card').reduce((sum, s) => sum + s.final_amount, 0),
          upi_sales: filtered.filter(s => s.payment_method === 'upi').reduce((sum, s) => sum + s.final_amount, 0),
          pending_amount: filtered.filter(s => s.payment_status === 'pending').reduce((sum, s) => sum + s.final_amount, 0)
        },
        pagination: {
          total: filtered.length,
          page: 1,
          limit: 20,
          total_pages: 1
        }
      }
    };
  },

  getSaleById: async (id) => {
    await delay(200);
    const sale = sales.find(s => s.id === parseInt(id));
    if (!sale) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Sale not found" } };
    }
    return { success: true, data: { sale } };
  },

  getSaleDetails: async (id) => {
    await delay(200);
    const sale = sales.find(s => s.id === parseInt(id));
    if (!sale) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Sale not found" } };
    }
    return { 
      success: true, 
      data: { 
        sale,
        items: [
          { item_name: "Sample Item 1", quantity: 2, unit_price: 50, total: 100 },
          { item_name: "Sample Item 2", quantity: 1, unit_price: 35, total: 35 }
        ]
      } 
    };
  },

  createSale: async (data) => {
    await delay(400);
    const subtotal = data.items.reduce((sum, item) => {
      const itemData = items.find(i => i.id === item.item_id);
      return sum + (item.quantity * itemData.selling_price);
    }, 0);

    const newSale = {
      id: sales.length + 1,
      bill_number: `BILL-${String(sales.length + 1).padStart(6, '0')}`,
      customer_id: data.customer_id,
      customer_name: data.customer_id ? customers.find(c => c.id === data.customer_id)?.name : "Walk-in",
      sale_date: data.sale_date,
      total_amount: subtotal,
      discount: data.discount,
      final_amount: subtotal - data.discount,
      payment_method: data.payment_method,
      payment_status: data.payment_status,
      items_count: data.items.length
    };

    sales.unshift(newSale);

    // Update stock
    data.items.forEach(saleItem => {
      const item = items.find(i => i.id === saleItem.item_id);
      if (item) {
        item.current_stock -= saleItem.quantity;
        item.is_low_stock = item.current_stock <= item.min_stock_threshold;
        item.is_available = item.current_stock > 0;
        item.last_sale_date = new Date().toISOString();
      }
    });

    return {
      success: true,
      data: { sale: newSale },
      message: "Bill created successfully"
    };
  },

  updateSale: async (id, data) => {
    await delay(300);
    const index = sales.findIndex(s => s.id === parseInt(id));
    if (index === -1) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Sale not found" } };
    }
    sales[index] = { ...sales[index], ...data };
    return {
      success: true,
      data: { sale: sales[index] },
      message: "Sale updated successfully"
    };
  },

  deleteSale: async (id) => {
    await delay(300);
    const index = sales.findIndex(s => s.id === parseInt(id));
    if (index === -1) {
      throw { success: false, error: { code: "NOT_FOUND", message: "Sale not found" } };
    }
    sales.splice(index, 1);
    return { success: true, message: "Sale deleted successfully" };
  },

  // ==================== Payments ====================
  getSupplierPayments: async (supplierId, params = {}) => {
    await delay(200);
    // Mock payment history
    return {
      success: true,
      data: {
        payments: [
          { id: 1, amount: 10000, date: new Date().toISOString(), method: 'bank_transfer' }
        ]
      }
    };
  },

  recordSupplierPayment: async (data) => {
    await delay(300);
    return {
      success: true,
      data: { payment: { id: Date.now(), ...data } },
      message: "Payment recorded successfully"
    };
  },

  getPendingSupplierPayments: async () => {
    await delay(200);
    const pendingPayments = purchaseOrders
      .filter(po => po.pending_amount > 0)
      .map(po => ({
        supplier_id: po.supplier_id,
        supplier_name: po.supplier_name,
        pending_amount: po.pending_amount,
        order_id: po.id
      }));
    return {
      success: true,
      data: { pending_payments: pendingPayments }
    };
  },

  // ==================== Reports ====================
  getSummaryReport: async (params = {}) => {
    await delay(300);
    return {
      success: true,
      data: {
        total_sales: sales.reduce((sum, s) => sum + s.final_amount, 0),
        total_purchases: purchaseOrders.reduce((sum, po) => sum + po.total_amount, 0),
        total_profit: sales.reduce((sum, s) => sum + (s.final_amount * 0.15), 0),
        inventory_value: items.reduce((sum, i) => sum + (i.current_stock * i.purchase_price), 0)
      }
    };
  },

  getTopItems: async (params = {}) => {
    await delay(300);
    // Return mock top selling items
    return {
      success: true,
      data: {
        top_items: items.slice(0, 5).map((item, index) => ({
          ...item,
          total_sold: 100 - (index * 15),
          total_revenue: (100 - (index * 15)) * item.selling_price
        }))
      }
    };
  },

};
