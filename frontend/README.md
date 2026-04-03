# Inventory Management System

A complete, fully-functional retail management application with runs entirely in the browser!

## 🎯 What Makes This Special

**✨ Zero Backend Required** - All data is hardcoded and lives in the browser
**✨ Fully Interactive** - Add items, create bills, manage purchases - everything works!
**✨ Data Persists** - Changes stay in memory during your session
**✨ Production-Ready UI** - Professional dark theme design
**✨ Complete Features** - All 5 main screens fully functional

## 🚀 Quick Start

### Installation

```bash
# Navigate to project
cd inventory-management

# Install dependencies
npm install

# Start the app
npm run dev
```

The application will start on `http://localhost:3000`

**That's it!** No database setup, no API configuration, no authentication - just install and run!

## 📊 Pre-loaded Demo Data

The application comes with realistic sample data:

### Suppliers (4)
- ABC Distributors
- XYZ Wholesale  
- Global Foods Supply
- Metro Trading Co

### Products (10)
- Tata Salt 1kg
- Maggi Noodles 200g
- Britannia Biscuits 500g
- Amul Milk 1L
- Surf Excel 1kg
- Parle-G Biscuits 1kg
- Red Label Tea 500g (Out of Stock)
- Fortune Oil 1L
- Colgate Toothpaste 200g
- Lays Chips 100g

### Customers (4)
- Priya Sharma
- Rahul Verma
- Anjali Gupta
- Vikram Singh

### Purchase Orders (4)
- 2 received, 2 pending
- Mixed payment statuses

### Sales Transactions (6)
- Mix of walk-in and registered customers
- Different payment methods
- Various amounts and discounts

## 🎮 Features You Can Try

### 1. Dashboard
- View sales metrics (₹45,000 today!)
- Check inventory alerts
- Monitor pending payments
- See payment method breakdown

### 2. Purchase Management
- **View Suppliers** - See all 4 suppliers with contact details
- **Add New Supplier** - Form works, adds to supplier list
- **View Purchase Orders** - See pending and received orders
- **Create Purchase Order** - Search items, add quantities, create PO
- **Mark as Received** - Updates order status

### 3. Billing / Point of Sale
- **Search Items** - Type to search by name/SKU/barcode
- **Add to Cart** - Click items to add to cart
- **Adjust Quantities** - Change quantities in cart
- **Search Customer** - Find by phone number
- **Add New Customer** - Register walk-in customers
- **Apply Discount** - Add discount amount
- **Process Sale** - Create bill, auto-updates inventory!

### 4. Inventory Management
- **View All Items** - See complete stock list
- **Filter Low Stock** - Show only low/out-of-stock items
- **Search Products** - Find specific items
- **Stock Indicators** - Visual alerts for low stock
- **Real-time Updates** - Stock changes after sales

### 5. Transaction History
- **Sales History** - All bills with details
- **Purchase History** - All purchase orders
- **Filter & Search** - Find specific transactions

## 🎨 Features

### Data Interactions
- ✅ Add suppliers (adds to list)
- ✅ Create purchase orders (adds to PO list)
- ✅ Add customers (adds to customer list)
- ✅ Create sales bills (adds to sales, **updates inventory**)
- ✅ Mark PO as received (updates status)
- ✅ Search functionality (works on all data)
- ✅ Filter low stock (filters based on thresholds)

### UI Features
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Loading states (simulated API delays)
- ✅ Empty states (when no data)
- ✅ Error handling (stock validation, etc.)
- ✅ Form validation (required fields)
- ✅ Modal dialogs (for forms)
- ✅ Search autocomplete
- ✅ Real-time calculations

## 📁 Project Structure

```
kirana-shop-app/
├── src/
│   ├── services/
│   │   ├── mockData.js       # 🔥 All hardcoded data here
│   │   └── api.js            # Mock API functions
│   │
│   ├── components/
│   │   ├── Layout.jsx        # Sidebar navigation
│   │   └── Layout.css
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx     # Main dashboard
│   │   ├── Purchases.jsx     # Purchase management
│   │   ├── Billing.jsx       # Point of sale
│   │   ├── Inventory.jsx     # Stock monitoring
│   │   └── Transactions.jsx  # Transaction history
│   │
│   ├── context/
│   │   └── AppContext.jsx    # Global state
│   │
│   ├── utils/
│   │   └── helpers.js        # Utility functions
│   │
│   ├── App.jsx              # Main app + routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
│
├── package.json
├── vite.config.js
└── README.md
```

## 🔧 How Mock Data Works

All data is stored in `src/services/mockData.js`:

```javascript
// Example: Suppliers array
export const suppliers = [
  {
    id: 1,
    company_name: "ABC Distributors",
    contact_person: "Ramesh Kumar",
    phone: "9123456789",
    // ... more fields
  },
  // ... more suppliers
];

// Mock API functions simulate real API with delays
export const mockApi = {
  getSuppliers: async () => {
    await delay(200); // Simulate network latency
    return { success: true, data: { suppliers } };
  },
  // ... more functions
};
```

### Data Persistence

- **Session-based**: Data persists while the app is open
- **In-memory**: Reloading the page resets to original data
- **No localStorage**: Fresh state on each reload
- **Want persistence?** Uncomment localStorage code in mockData.js

## 🎯 Testing Scenarios

### Scenario 1: Create a Sale
1. Go to **Billing** page
2. Search for "Tata Salt"
3. Click to add to cart
4. Search customer by phone: `9876543210`
5. Add discount: `10`
6. Select payment method: `UPI`
7. Click "Generate Bill"
8. ✅ Bill created! Check **Transactions** to see it
9. ✅ Go to **Inventory** - Tata Salt stock reduced!

### Scenario 2: Low Stock Alert
1. Go to **Inventory**
2. Notice "Maggi Noodles" has only 8 units (threshold: 20)
3. See the orange "Low" badge
4. Click **Low Stock** filter
5. See all items needing reorder

### Scenario 3: Purchase Order
1. Go to **Purchases**
2. Click "New Purchase"
3. Select supplier: "ABC Distributors"
4. Search for items and add quantities
5. Add delivery notes
6. Click "Create Purchase Order"
7. ✅ PO appears in list
8. Click "Mark Received" on pending order
9. ✅ Status changes to "received"

### Scenario 4: Dashboard Overview
1. Check Dashboard
2. See today's sales: ₹45,000
3. Notice 3 out-of-stock items alert
4. View pending supplier payments
5. Check payment method breakdown

## 🎨 Design System

### Colors
- **Primary**: Green `#4ade80` - Growth, money
- **Accent**: Amber `#fbbf24` - Highlights
- **Background**: Navy `#0a0e1a`
- **Surface**: Slate `#141824`

### Typography
- **Display**: Space Mono (for numbers/headers)
- **Body**: Work Sans (readable)

### Components
- Custom buttons with hover effects
- Responsive tables
- Modal forms
- Badge system for status
- Card-based layouts

## 🚀 Next Steps

### To Connect Real Backend:

1. **Update API Service**: Edit `src/services/api.js`
   ```javascript
   // Change this:
   import { mockApi } from './mockData';
   
   // To this:
   import axios from 'axios';
   const apiClient = axios.create({ baseURL: 'your-api-url' });
   ```

2. **Add Authentication**: Implement JWT token handling

3. **Remove Mock Data**: Delete `src/services/mockData.js`

### To Add LocalStorage Persistence:

Edit `src/services/mockData.js`:
```javascript
// Save to localStorage after each change
localStorage.setItem('kirana_suppliers', JSON.stringify(suppliers));

// Load from localStorage on start
const suppliers = JSON.parse(localStorage.getItem('kirana_suppliers')) || defaultSuppliers;
```

## 📱 Responsive Design

Works perfectly on:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Laptop (1024px+)
- 🖥️ Desktop (1440px+)

## 🎯 Key Features

✅ **No Backend Needed** - Pure frontend app
✅ **Realistic Data** - Indian retail context
✅ **Full CRUD** - Create, Read, Update operations
✅ **Live Updates** - Inventory changes in real-time
✅ **Professional UI** - Production-grade design
✅ **Fast Setup** - npm install & run
✅ **Zero Config** - No .env files needed
✅ **Learn React** - Great for learning/demos

## 🐛 Known Limitations

- ⚠️ Data resets on page reload
- ⚠️ No data export/import
- ⚠️ No print functionality
- ⚠️ No barcode scanning
- ⚠️ Single user session

These are intentional for demo purposes. All can be added when connecting to real backend!

## 💡 Use Cases

- **Learning React**: Study real-world app structure
- **UI/UX Demo**: Show design to clients
- **Prototype**: Test workflows before backend
- **Training**: Teach staff the interface
- **Portfolio**: Showcase your skills

## 🎓 Learning Points

This project demonstrates:
- React Router for navigation
- Context API for state management
- Component composition
- Form handling
- Search & filter logic
- Responsive CSS
- Mock API patterns
- Clean code structure

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🎉 Ready to Explore!

Start the app and try creating your first sale. The stock will update in real-time, demonstrating how a real retail system works!

```bash
npm run dev
```

Visit `http://localhost:3000` and enjoy exploring! 🚀

---

**Built with:** React 18 + Vite + Love ❤️  
**Design:** Custom Dark Theme  
**Status:** Fully Functional Demo ✨  
**Backend:** Not Required! 🎯
