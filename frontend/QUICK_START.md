# Quick Setup - 3 Simple Steps! 🚀

## Step 1: Install Dependencies
```bash
cd kirana-shop-app
npm install
```

## Step 2: Start the App
```bash
npm run dev
```

## Step 3: Open Browser
Go to `http://localhost:3000`

**That's it!** No database, no backend, no configuration needed!

---

## What You'll See

### 🏠 Dashboard
- Today's sales: ₹45,000
- 125 bills processed
- 12 low stock items alert
- ₹45,000 pending supplier payments

### 🛒 Try These Actions

**Create a Sale:**
1. Go to Billing page
2. Search "Tata Salt"
3. Add to cart
4. Click "Generate Bill"
5. ✅ Check Inventory - stock reduced!

**Add a Supplier:**
1. Go to Purchases → Suppliers tab
2. Click "Add Supplier"
3. Fill the form
4. ✅ New supplier appears in list!

**Create Purchase Order:**
1. Go to Purchases
2. Click "New Purchase"
3. Select supplier, add items
4. ✅ PO created!

---

## Pre-loaded Demo Data

✅ 4 Suppliers (ABC Distributors, XYZ Wholesale, etc.)
✅ 10 Products (Tata Salt, Maggi, Amul Milk, etc.)
✅ 4 Customers (searchable by phone)
✅ 4 Purchase Orders
✅ 6 Sales Transactions

Everything is **interactive** - your actions update the data in real-time!

---

## Common Questions

**Q: Do I need a database?**
No! All data is hardcoded in `src/services/mockData.js`

**Q: Does data persist?**
Only during your session. Reload = fresh start.

**Q: Can I connect a real backend?**
Yes! Just update `src/services/api.js` to use real API calls.

**Q: Port 3000 is busy?**
Vite will auto-use next available port (3001, 3002, etc.)

---

## Troubleshooting

**Module Not Found?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Blank Screen?**
- Check browser console for errors
- Try: `npm run build && npm run preview`

**Style Issues?**
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

---

## Next Steps

1. ✅ Install and run (you're here!)
2. 🎮 Explore all 5 pages
3. 🧪 Try creating sales and purchases
4. 📊 Check how inventory updates
5. 🎨 Customize the design (edit src/index.css)
6. 🔌 Connect to your backend (optional)

---

## Need Help?

Check the full `README.md` for:
- Detailed feature list
- Testing scenarios
- Code structure explanation
- Backend integration guide

**Enjoy exploring your Kirana Shop Management System!** 🎉
