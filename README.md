# Kirana Shop Management System

A full-stack retail inventory and billing management application built for small Indian retail shops (kirana stores). The system handles inventory tracking, purchase orders, billing/sales, customer management, supplier management, and financial reporting through a modern web interface backed by a robust REST API.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Run Full Stack (Supabase Default)](#1-run-full-stack-supabase-default)
  - [2. Run Backend Only (Direct Maven)](#2-run-backend-only-direct-maven)
  - [3. Run Frontend Only](#3-run-frontend-only)
  - [4. Running Frontend in Mock Mode (No Backend)](#4-running-frontend-in-mock-mode-no-backend)
- [Database Setup](#database-setup)
  - [Option A: Supabase (Default)](#option-a-supabase-default)
  - [Option B: Local PostgreSQL Fallback (Optional)](#option-b-local-postgresql-fallback-optional)
  - [Option C: H2 In-Memory (Backend-Only Dev)](#option-c-h2-in-memory-backend-only-dev)
  - [Migrate Existing Local Data to Supabase](#migrate-existing-local-data-to-supabase)
- [How to Check Stored Data](#how-to-check-stored-data)
  - [H2 Console (Browser)](#h2-console-browser)
  - [Using the API Directly](#using-the-api-directly)
- [Authentication](#authentication)
- [API Reference](#api-reference)
- [Application Features](#application-features)
- [Architecture Overview](#architecture-overview)
- [Configuration Reference](#configuration-reference)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | UI library |
| Vite | 5.x | Build tool and dev server |
| React Router | 6.x | Client-side routing |
| Tailwind CSS | 4.x | Utility-first CSS framework |
| Lucide React | 0.263 | Icon library |
| date-fns | 3.x | Date formatting utilities |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Spring Boot | 3.4.3 | Application framework |
| Java | 21 | Programming language |
| Spring Data JPA | - | Database abstraction (ORM) |
| Spring Security | - | Authentication & authorization |
| JWT (jjwt) | 0.12.5 | Token-based authentication |
| PostgreSQL | - | Production database |
| H2 Database | - | Development/testing database |
| Lombok | - | Boilerplate code reduction |
| Maven | 3.9.6 | Build tool (bundled wrapper) |

---

## Project Structure

```
4th-yr-project/
├── frontend/                          # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx             # Main app layout (sidebar + content)
│   │   │   └── Layout.css
│   │   ├── context/
│   │   │   └── AppContext.jsx          # Global state (auth, theme, dashboard)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx           # Dashboard with stats & charts
│   │   │   ├── Billing.jsx             # Sales / billing page
│   │   │   ├── Inventory.jsx           # Item & stock management
│   │   │   ├── Purchases.jsx           # Purchase orders & suppliers
│   │   │   └── Transactions.jsx        # Transaction history
│   │   ├── services/
│   │   │   ├── api.js                  # API layer (mock/real toggle)
│   │   │   └── mockData.js             # Mock data for offline development
│   │   ├── utils/
│   │   │   └── helpers.js              # Formatting & utility functions
│   │   ├── App.jsx                     # Root component with routing
│   │   ├── main.jsx                    # Entry point
│   │   └── index.css                   # Global styles & CSS variables
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── backend/                            # Spring Boot backend application
│   ├── src/main/java/com/kirana/
│   │   ├── config/
│   │   │   └── SecurityConfig.java     # CORS, JWT filter, security rules
│   │   ├── controller/                 # REST API endpoints
│   │   │   ├── AuthController.java     # Login, register, and Google auth
│   │   │   ├── DashboardController.java
│   │   │   ├── ItemController.java
│   │   │   ├── SaleController.java
│   │   │   ├── PurchaseOrderController.java
│   │   │   ├── SupplierController.java
│   │   │   ├── CustomerController.java
│   │   │   ├── CategoryController.java
│   │   │   ├── PaymentController.java
│   │   │   └── ReportController.java
│   │   ├── dto/                        # Data Transfer Objects
│   │   ├── entity/                     # JPA entities (13 tables)
│   │   ├── exception/
│   │   │   └── GlobalExceptionHandler.java
│   │   ├── repository/                 # Spring Data JPA repositories
│   │   ├── security/
│   │   │   ├── JwtUtil.java            # JWT token generation & validation
│   │   │   └── JwtAuthenticationFilter.java
│   │   ├── service/                    # Business logic layer
│   │   └── KiranaApplication.java      # Main entry point
│   ├── src/main/resources/
│   │   ├── application.yml             # App configuration
│   │   ├── schema.sql                  # PostgreSQL schema
│   │   └── schema-h2.sql              # H2 schema (development)
│   ├── .mvn/wrapper/                   # Bundled Maven (no install needed)
│   └── pom.xml
│
└── README.md
```

---

## Prerequisites

| Requirement | Minimum Version | Check Command |
|---|---|---|
| **Java JDK** | 21+ | `java -version` |
| **Node.js** | 18+ | `node -v` |
| **npm** | 9+ | `npm -v` |
| **PostgreSQL** | 14+ *(optional)* | `psql --version` |

> **Note:** Maven does NOT need to be installed separately. The project includes a bundled Maven wrapper in `backend/.mvn/wrapper/`.

---

## Getting Started

### 1. Run Full Stack (Supabase Default)

This is the recommended path. It starts frontend + backend with Docker and uses Supabase values from `.env.local`.

1. Copy `.env.local.example` to `.env.local`.
2. Replace Supabase placeholders in `.env.local`.
3. Start services:

```powershell
.\start-local.ps1
```

If you want local PostgreSQL fallback instead of Supabase:

```powershell
.\start-local.ps1 -UseLocalDb
```

### 2. Run Backend Only (Direct Maven)

If you prefer running backend outside Docker, export Supabase DB values first (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`) and then run:

**On Windows (PowerShell):**
```powershell
cd backend
& ".mvn\wrapper\maven\bin\mvn.cmd" clean spring-boot:run
```

**On macOS/Linux:**
```bash
cd backend
chmod +x .mvn/wrapper/maven/bin/mvn
.mvn/wrapper/maven/bin/mvn clean spring-boot:run
```

### 3. Run Frontend Only

Open a new terminal:

```bash
cd frontend
npm install        # First time only
npm run dev
```

Frontend runs on **http://localhost:3000**.

### 4. Running Frontend in Mock Mode (No Backend)

If you want to run the frontend without the backend (using hardcoded mock data), edit `frontend/src/services/api.js`:

```javascript
const USE_MOCK_DATA = true;   // Change from false to true
```

Then run `npm run dev` as usual. The frontend will use the built-in mock data from `mockData.js` instead of calling the backend API.

---

## Database Setup

### Option A: Supabase (Default)

Supabase is the standard database provider for this project in local Docker and production.

1. Copy `.env.local.example` to `.env.local`.
2. Set real values for:
  - `COMPOSE_DB_URL` (Supabase JDBC session pooler URL, port 5432)
  - `COMPOSE_DB_USERNAME`
  - `COMPOSE_DB_PASSWORD`
3. Start full stack:

  **Windows (PowerShell):**
  ```powershell
  .\start-local.ps1
  ```

For direct backend runs (without Docker), use `backend/env.txt` and export the same Supabase values as `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`.

### Option B: Local PostgreSQL Fallback (Optional)

If you want to run a local Docker PostgreSQL container instead of Supabase:

1. In `.env.local`, switch DB values to local:
  - `COMPOSE_DB_URL=jdbc:postgresql://db:5432/kirana_db`
  - `COMPOSE_DB_USERNAME=kirana`
  - `COMPOSE_DB_PASSWORD=password123`
2. Start with local db profile:

  **Windows (PowerShell):**
  ```powershell
  .\start-local.ps1 -UseLocalDb
  ```

### Option C: H2 In-Memory (Backend-Only Dev)

H2 remains available for backend-only experiments under the `dev` profile. This mode is ephemeral and data is cleared when the process stops.

### Migrate Existing Local Data to Supabase

If you already have data in local PostgreSQL and want to move it to Supabase:

1. Start backend once against Supabase so Flyway creates schema.
2. Run migration script from repository root:

```powershell
.\migrate-local-to-supabase.ps1
```

Optional: keep existing target data and skip truncate.

```powershell
.\migrate-local-to-supabase.ps1 -SkipTargetTruncate
```

### Database Schema (13 Tables)

| Table | Purpose |
|---|---|
| `retailers` | Store/business owner accounts |
| `suppliers` | Supplier/vendor information |
| `customers` | Customer records |
| `items` | Product catalog with pricing & stock levels |
| `purchase_orders` | Orders placed to suppliers |
| `purchase_order_items` | Line items within purchase orders |
| `supplier_payments` | Payments made to suppliers |
| `sales` | Sales/billing transactions |
| `sale_items` | Line items within each sale |
| `inventory_transactions` | Stock movement audit trail |
| `returns` | Customer return records |
| `return_items` | Line items within returns |
| `daily_summary` | Aggregated daily sales/purchase summaries |

---

## How to Check Stored Data

### H2 Console (Browser)

When running with H2 (optional dev profile), a web-based database console is available:

1. Open **http://localhost:5000/h2-console** in your browser
2. Enter these connection details:
   - **JDBC URL:** `jdbc:h2:mem:kirana_db`
   - **Username:** `sa`
   - **Password:** *(leave empty)*
3. Click **Connect**
4. You can now run SQL queries directly:

```sql
-- View all items
SELECT * FROM items;

-- View all sales with customer names
SELECT s.id, s.final_amount, s.payment_method, s.sale_date, c.name AS customer
FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.deleted_at IS NULL;

-- View inventory stock levels
SELECT name, category, current_stock, min_stock_threshold, selling_price
FROM items WHERE deleted_at IS NULL;

-- View purchase orders with supplier names
SELECT po.id, sup.company_name, po.total_amount, po.status, po.payment_status
FROM purchase_orders po JOIN suppliers sup ON po.supplier_id = sup.id;

-- View stock movement history
SELECT it.transaction_type, it.quantity, it.previous_stock, it.new_stock, i.name
FROM inventory_transactions it JOIN items i ON it.item_id = i.id
ORDER BY it.created_at DESC;

-- View the demo retailer
SELECT * FROM retailers;
```

### Using the API Directly

You can query data through the REST API using `curl` or any HTTP client (Postman, Insomnia, etc.).

**Step 1: Get an authentication token:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rajesh@example.com","password":"your-password"}'
```

**Step 2: Use the token to query data:**
```bash
# Set the token (replace with actual token from step 1)
TOKEN="eyJhbGci..."

# View all items
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/items

# View all sales
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/sales

# View dashboard summary
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/dashboard

# View all customers
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/customers

# View all suppliers
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/suppliers
```

### Using PostgreSQL (if configured)

```bash
psql -U postgres -d kirana_db

# Then run any SQL query:
SELECT * FROM items;
SELECT * FROM sales;
\dt   -- list all tables
```

---

## Authentication

The application uses **JWT (JSON Web Token)** authentication.

### How It Works

1. The user authenticates with `POST /api/auth/login`, `POST /api/auth/register`, or `POST /api/auth/google`
2. The backend returns a JWT containing the retailer ID and email
3. The frontend stores the token in `localStorage`
4. Every subsequent API request includes the token in the `Authorization: Bearer <token>` header
5. The `JwtAuthenticationFilter` validates the token and extracts the retailer ID
6. Controllers use the retailer ID to scope all data queries (multi-tenant isolation)

### Token Details

| Property | Value |
|---|---|
| Algorithm | HS512 |
| Expiration | 24 hours (86,400,000 ms) |
| Subject | Retailer ID |
| Claims | email |

### Login Endpoint

```bash
# Login with email or phone and password
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rajesh@example.com","password":"your-password"}'
```

---

## API Reference

All endpoints are prefixed with `/api`. Authenticated endpoints require `Authorization: Bearer <token>` header.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/register` | Register a new retailer account |
| POST | `/api/auth/google` | Login/signup with Google ID token |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Today's sales, monthly summary, inventory stats |

### Items (Inventory)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/items` | List all items with pagination |
| GET | `/api/items/{id}` | Get item by ID |
| GET | `/api/items/inventory` | Items with inventory summary stats |
| GET | `/api/items/available` | Items with stock > 0 |
| GET | `/api/items/low-stock` | Items below minimum threshold |
| POST | `/api/items` | Add a new item |
| PUT | `/api/items/{id}` | Update an item |
| DELETE | `/api/items/{id}` | Soft-delete an item |
| POST | `/api/items/{id}/adjust-stock` | Manual stock adjustment |
| GET | `/api/items/{id}/transactions` | Stock movement history for an item |

### Sales
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/sales` | List all sales with summary |
| GET | `/api/sales/{id}` | Get sale by ID |
| GET | `/api/sales/{id}/details` | Sale with full item breakdown |
| POST | `/api/sales` | Create a new sale (auto-deducts stock) |
| DELETE | `/api/sales/{id}` | Soft-delete a sale |

### Purchase Orders
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/purchase-orders` | List all purchase orders |
| GET | `/api/purchase-orders/{id}` | Get purchase order by ID |
| POST | `/api/purchase-orders` | Create a purchase order |
| PATCH | `/api/purchase-orders/{id}/status` | Update status (auto-adds stock when "received") |
| DELETE | `/api/purchase-orders/{id}` | Soft-delete a purchase order |

### Suppliers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/suppliers` | List all suppliers |
| GET | `/api/suppliers/{id}` | Get supplier by ID |
| POST | `/api/suppliers` | Add a supplier |
| PUT | `/api/suppliers/{id}` | Update a supplier |
| DELETE | `/api/suppliers/{id}` | Soft-delete a supplier |

### Customers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/customers` | List all customers |
| GET | `/api/customers/{id}` | Get customer by ID |
| GET | `/api/customers/search?phone=XXX` | Search customer by phone |
| POST | `/api/customers` | Add a customer |
| PUT | `/api/customers/{id}` | Update a customer |
| DELETE | `/api/customers/{id}` | Soft-delete a customer |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | List categories (derived from items) |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/suppliers/{id}/payments` | Payment history for a supplier |
| POST | `/api/payments/supplier` | Record a supplier payment |
| GET | `/api/payments/supplier/pending` | List pending supplier payments |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/summary` | Overall profit & inventory value |
| GET | `/api/reports/top-items` | Top selling items |

### API Response Format

All responses follow a consistent structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found"
  }
}
```

---

## Application Features

### Dashboard
- Today's sales total, bill count, and profit
- Monthly sales and purchase summaries
- Inventory overview (total items, low stock alerts, out of stock)
- Pending payment summaries

### Billing / Sales
- Create sales with multiple line items
- Automatic stock deduction on sale
- Profit calculation per item (selling price - purchase price)
- Support for cash, card, UPI, and credit payment methods
- Customer linking (optional)

### Inventory Management
- Full product catalog with SKU, barcode, and category support
- Real-time stock tracking
- Manual stock adjustments with audit trail
- Low stock and out-of-stock alerts
- Stock movement history per item

### Purchase Orders
- Create purchase orders with multiple items
- Status tracking (pending, received, cancelled)
- Automatic stock addition when order status is set to "received"
- Payment tracking (pending, partial, paid)

### Supplier & Customer Management
- Full CRUD for suppliers and customers
- Soft-delete support (data is never permanently removed)
- Customer search by phone number

### Theming
- Dark and Light mode toggle
- Theme preference saved in `localStorage`
- CSS variable-based theming system

---

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────────────────────┐
│                  │  HTTP   │          Spring Boot 3.4.3       │
│   React 18 SPA  │────────▶│                                  │
│   (Vite, :3000) │◀────────│  ┌────────────┐  ┌───────────┐  │
│                  │  JSON   │  │ Controllers │──│  Services  │  │
└─────────────────┘         │  └────────────┘  └─────┬─────┘  │
                            │                        │         │
                            │  ┌─────────────────────┘         │
                            │  │  Spring Data JPA              │
                            │  │  Repositories                 │
                            │  └─────────┬─────────────────────┘
                            │            │
                            │  ┌─────────▼─────────┐
                            │  │  H2 (dev) or       │
                            │  │  PostgreSQL (prod)  │
                            │  └────────────────────┘
                            │                                  │
                            │  Security: JWT Filter ──────────▶│
                            └──────────────────────────────────┘
                                       :5000
```

### Request Flow

1. User interacts with the React frontend
2. Frontend sends HTTP request with JWT token to backend
3. `JwtAuthenticationFilter` validates the token and extracts the retailer ID
4. Controller receives the request and delegates to the appropriate Service
5. Service executes business logic and calls Repository methods
6. Repository translates to SQL via Hibernate/JPA
7. Response flows back through the same layers as JSON

### Multi-Tenancy

All data is scoped by `retailer_id`. Every query filters by the authenticated retailer's ID, ensuring data isolation between different store owners.

### Soft Deletes

Records are never physically deleted. A `deleted_at` timestamp is set instead, and all queries filter out records where `deleted_at IS NOT NULL`.

---

## Configuration Reference

All configuration is in `backend/src/main/resources/application.yml`. Values can be overridden with environment variables.

| Environment Variable | Default | Description |
|---|---|---|
| `SERVER_PORT` | `5000` | Backend server port |
| `DB_URL` | *(required in prod)* | Database JDBC URL (Supabase/local PostgreSQL) |
| `DB_USERNAME` | *(required in prod)* | Database username |
| `DB_PASSWORD` | *(required in prod)* | Database password |
| `DB_DRIVER` | `org.postgresql.Driver` | JDBC driver class |
| `JPA_DDL_AUTO` | `none` | Hibernate DDL strategy |
| `JPA_SHOW_SQL` | `false` | Log SQL queries |
| `JWT_SECRET` | *(default key)* | JWT signing secret |
| `JWT_EXPIRATION_MS` | `86400000` (24h) | JWT token expiry |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Allowed CORS origins |
| `LOG_LEVEL` | `INFO` | Application log level |

---

## Troubleshooting

### Backend won't start - "Port 5000 already in use"

Another process is using port 5000. Find and kill it:

```powershell
# Windows
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```

```bash
# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Frontend shows blank page or "Initializing application..." forever

- Make sure the backend is running on port 5000
- Check the browser console (F12) for CORS or network errors
- Verify `USE_MOCK_DATA` is set to `false` in `frontend/src/services/api.js` when using the real backend

### "LazyInitializationException" in backend logs

This was a known bug that has been fixed by adding `@Transactional(readOnly = true)` to service methods that access lazy-loaded collections (`Sale.items`, `PurchaseOrder.items`).

### H2 Console shows "Database not found"

The H2 console is only available while the backend is running. The in-memory database exists only in the JVM process.

### Data disappears after backend restart

This is expected with H2 in-memory mode. Switch to PostgreSQL for persistent storage (see [Database Setup](#database-setup)).

### Frontend not connecting to backend

Check that CORS is configured correctly. The default allows `http://localhost:3000` and `http://localhost:5173`. If your frontend runs on a different port, update the `CORS_ALLOWED_ORIGINS` environment variable.

### Flyway checksum mismatch after switching to Supabase

If backend startup fails with checksum mismatch on migration versions 4/5, run:

```powershell
.\repair-supabase-flyway.ps1
```

Then restart:

```powershell
.\start-local.ps1 -SkipBuild
```

### Docker build fails on transient Python package hash validation

If image rebuild fails during ML dependency install, reuse existing images and skip rebuild:

```powershell
.\start-local.ps1 -SkipBuild
```

### Java version mismatch

The project requires Java 21+. If you have multiple Java versions, set `JAVA_HOME`:

```powershell
# Windows
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
```

```bash
# macOS/Linux
export JAVA_HOME=/usr/lib/jvm/java-21
```
