# 🔍 Kirana Shop Management System — $20,000 Full Audit

> **Audit Date:** 2026-03-30 | **Deadline:** Tomorrow | **Auditor Role:** Senior Full Stack Developer (React + Spring Boot + DevOps)

---

## Executive Summary & Scorecard

| Dimension | Score | Grade | Verdict |
|---|:---:|:---:|---|
| **Security** | 3/10 | 🔴 F | **Critical secrets committed to Git. Demo-token endpoint still accessible. No rate limiting.** |
| **Backend Architecture** | 7/10 | 🟢 B | Clean layered architecture, good multi-tenant isolation, proper transactional boundaries. |
| **Database Design** | 7/10 | 🟢 B | Well-normalized 13-table schema, proper indexes, Flyway migrations in place. |
| **Performance** | 4/10 | 🟠 D | Severe N+1 query problems in Sales and Purchase Order services. No pagination on core lists. |
| **Frontend Architecture** | 6/10 | 🟡 C | Functional React SPA with good routing. Monolithic page components, no error boundaries. |
| **Code Quality** | 6/10 | 🟡 C | Consistent patterns but commented-out dead code, missing tests entirely, no input sanitization. |
| **DevOps & Infrastructure** | 7/10 | 🟢 B | Docker multi-stage builds, CI/CD pipeline, Render+Vercel deployment. Missing staging env. |
| **Documentation** | 8/10 | 🟢 A | Excellent README, deployment guide, API reference. BUGS.md is honest. |
| **ML Service** | 5/10 | 🟡 C | Working Prophet-based forecasting, but no caching, no auth verification, fragile coupling. |

### **Overall: 5.9/10 — NOT production-ready as a $20,000 deliverable.**

> [!CAUTION]
> **3 showstopper issues must be fixed before delivery:**
> 1. `.env` file with real database password + JWT secret committed to Git
> 2. Zero test coverage — `backend/src/test/` directory doesn't even exist
> 3. N+1 query explosion will cause timeouts under any real load

---

## 🔴 CRITICAL: Security Issues

### 1. **Secrets Committed to Version Control** — SEVERITY: P0/SHOWSTOPPER

**File:** [.env](file:///e:/inventory-management-system-main/.env)

```
DB_URL=jdbc:postgresql://aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
DB_USERNAME=postgres.<project-ref>
DB_PASSWORD=<supabase-db-password>
JWT_SECRET=<32-plus-char-random-secret>
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```

> [!CAUTION]
> **The actual production Supabase database password, JWT signing secret, and Google OAuth Client ID are committed in plaintext.** Even though `.env` is in `.gitignore`, it's already in the working tree and likely in Git history. Anyone with repo access has full database access.

**Fix (Immediate):**
1. Rotate ALL credentials: Supabase password, JWT secret, Google OAuth client secret
2. Run `git rm --cached .env` and force-push
3. Use `git filter-branch` or BFG Repo Cleaner to scrub history
4. Never commit `.env` again — only `.env.example` with placeholder values

---

### 2. **`/api/auth/demo-token` Removed But Security Config Still Permissive** — SEVERITY: P1

**File:** [SecurityConfig.java](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/config/SecurityConfig.java#L50)

The demo-token endpoint was removed from the controller, but the security config still permits:
```java
auth.requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/google").permitAll();
```

This is correct now. However:
- No rate limiting on login/register endpoints → vulnerable to brute force
- No account lockout after failed attempts
- Password minimum is only 6 characters (line RegisterRequest.java:15) — industry standard is 8+

---

### 3. **JWT Filter Silently Passes Invalid Tokens** — SEVERITY: P2

**File:** [JwtAuthenticationFilter.java](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/security/JwtAuthenticationFilter.java#L27-L35)

```java
if (header != null && header.startsWith("Bearer ")) {
    String token = header.substring(7);
    if (jwtUtil.validateToken(token)) {
        // sets auth
    }
}
filterChain.doFilter(request, response); // continues regardless
```

If a Bearer token is present but invalid/expired, the filter silently continues rather than rejecting. The `SecurityConfig` catches this because unauthenticated requests to protected endpoints return 401, but it means malformed tokens don't get explicit rejection — they just fall through to "anonymous" access.

---

### 4. **No CSRF Protection Rationale** — SEVERITY: P3

**File:** [SecurityConfig.java](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/config/SecurityConfig.java#L42)

```java
.csrf(csrf -> csrf.disable())
```

CSRF is disabled, which is correct for a stateless JWT API. However, since `allowCredentials(true)` is set in CORS config with specific origins, this is acceptable. Just noting that origin validation is the only CSRF defense.

---

### 5. **ML Service Has No Authentication** — SEVERITY: P2

**File:** [ml-service/main.py](file:///e:/inventory-management-system-main/ml-service/main.py#L10-L21)

The ML service relies only on CORS for protection. It runs inside the same Docker container (exposed on `127.0.0.1:8000`), so it's not directly accessible externally in the current deployment. However:
- No JWT verification
- No API key validation
- If the container network changes, the ML service is wide open
- The `retailer_id` parameter is user-supplied — no verification it matches the authenticated user

---

## 🟠 HIGH: Performance Issues

### 6. **N+1 Query Explosions in SaleService and PurchaseOrderService** — SEVERITY: P1

**File:** [SaleService.java](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/service/SaleService.java#L183-L219)

The `toDto()` method makes **2 database calls per sale** (customer lookup + item name lookups per sale item):

```java
private SaleDto toDto(Sale s, Long retailerId) {
    // DB call 1: customer lookup per sale
    customerName = customerRepository.findByIdAndRetailerIdAndDeletedAtIsNull(s.getCustomerId(), retailerId)...
    
    // DB call 2+: item lookup per sale item
    s.getItems().stream().map(si -> {
        itemRepository.findByIdAndRetailerIdAndDeletedAtIsNull(si.getItemId(), retailerId)...
    })
}
```

**Impact:** For a retailer with 100 sales, each having 3 items, this generates **100 + (100 × 3) = 400 SQL queries** for a single `GET /api/sales` call.

The same pattern exists in:
- [PurchaseOrderService.toDto()](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/service/PurchaseOrderService.java#L196-L227) — supplier + item lookups per PO
- [SaleService.getSales() search filter](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/service/SaleService.java#L46-L55) — customer lookup per sale during in-memory filtering
- [PaymentService.getPendingSupplierPayments()](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/service/PaymentService.java#L98-L113) — supplier lookup per order

**Fix:** Use `JOIN FETCH` queries or batch-load related entities:
```java
@Query("SELECT s FROM Sale s LEFT JOIN FETCH s.items WHERE s.retailerId = :rid AND s.deletedAt IS NULL ORDER BY s.saleDate DESC")
List<Sale> findByRetailerIdWithItems(@Param("rid") Long retailerId);
```

---

### 7. **No Pagination on Core List Endpoints** — SEVERITY: P2

**File:** [ItemService.java](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/service/ItemService.java#L27-L31)

All list methods fetch the entire dataset:
```java
public List<ItemDto> getItems(Long retailerId) {
    return itemRepository.findByRetailerIdAndDeletedAtIsNull(retailerId).stream()...
}
```

The controller returns a fake pagination object:
```java
Map.of("pagination", Map.of("total", items.size(), "page", 1, "limit", items.size(), "total_pages", 1))
```

This is cosmetic pagination — it always returns ALL items. Real pagination using `Pageable` is not implemented anywhere.

---

### 8. **In-Memory Filtering Instead of SQL** — SEVERITY: P2

**File:** [PurchaseOrderService.java](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/service/PurchaseOrderService.java#L35-L56)

Date filtering and search are done in-memory after fetching ALL records:
```java
List<PurchaseOrder> orders = purchaseOrderRepository.findByRetailerIdAndDeletedAtIsNullOrderByOrderDateDesc(retailerId);
// then filter in-memory...
orders = orders.stream().filter(o -> ...).toList();
```

This fetches the entire table every time, then discards most rows.

---

### 9. **DashboardService Loads All Items Into Memory** — SEVERITY: P2

**File:** [DashboardService.java](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/service/DashboardService.java#L142-L155)

```java
List<Item> allItems = itemRepository.findByRetailerIdAndDeletedAtIsNull(retailerId);
// then counts with stream().filter().count()
```

Low/out-of-stock counts and stock value should be aggregate SQL queries, not in-memory computations.

---

## 🟡 MEDIUM: Architecture & Code Quality Issues

### 10. **Commented-Out Dead Code in DashboardService** — SEVERITY: P3

**File:** [DashboardService.java](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/service/DashboardService.java#L1-L77)

The entire first 77 lines are a commented-out old version of the class. This should never exist in a $20,000 deliverable. Remove it.

---

### 11. **Zero Test Coverage — Test Directory Doesn't Exist** — SEVERITY: P0/SHOWSTOPPER

**Path:** `backend/src/test/` — **DOES NOT EXIST**

There are no unit tests, no integration tests, no test infrastructure whatsoever. The `pom.xml` includes `spring-boot-starter-test` and `spring-security-test` as dependencies, but they're unused.

For a $20,000 project, this is unacceptable. At minimum you need:
- Unit tests for all service layer methods
- Integration tests for critical flows (sale creation with stock deduction, payment recording)
- Controller tests for auth endpoints
- Repository tests for custom queries

---

### 12. **Missing `@Transactional` on Several Write Operations** — SEVERITY: P2

| Method | File | Issue |
|---|---|---|
| `addItem()` | [ItemService.java:85](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/service/ItemService.java#L85) | No `@Transactional` |
| `updateItem()` | [ItemService.java:105](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/service/ItemService.java#L105) | No `@Transactional` |
| `deleteItem()` | [ItemService.java:122](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/service/ItemService.java#L122) | No `@Transactional` |
| `deleteSale()` | [SaleService.java:176](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/service/SaleService.java#L176) | No `@Transactional` |
| `deletePurchaseOrder()` | [PurchaseOrderService.java:189](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/service/PurchaseOrderService.java#L189) | No `@Transactional` |

These are single-operation methods, so they'll each get their own transaction from JPA's auto-transaction, but explicit annotation is a best practice and signals intent.

---

### 13. **Soft-Delete on Sale Doesn't Restore Stock** — SEVERITY: P1 (Business Logic Bug)

**File:** [SaleService.java](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/service/SaleService.java#L176-L181)

```java
public void deleteSale(Long id, Long retailerId) {
    Sale sale = saleRepository.findByIdAndRetailerIdAndDeletedAtIsNull(id, retailerId)
            .orElseThrow(() -> new NotFoundException("Sale not found"));
    sale.setDeletedAt(LocalDateTime.now());
    saleRepository.save(sale);
}
```

When a sale is "deleted" (soft-deleted), the stock that was deducted during the sale is **never restored**. This means:
- Creating a sale: stock goes down ✅
- Deleting that sale: stock stays down ❌

This is a **data integrity bug** that will cause inventory discrepancies.

---

### 14. **Entity Relationships Use Long IDs Instead of JPA References** — SEVERITY: P3

**File:** [Sale.java](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/entity/Sale.java#L27), [Item.java](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/entity/Item.java#L21)

Most entities store `retailerId` as a `Long` column rather than using a `@ManyToOne` relationship:
```java
@Column(name = "retailer_id", nullable = false)
private Long retailerId;
```

This is a conscious design choice that avoids lazy-loading complexity and N+1 patterns on the retailer side, but it means:
- No FK validation at the JPA level
- No cascading operations
- Manual joins required everywhere

This is acceptable for the multi-tenant design pattern used here.

---

### 15. **Exception Handler Swallows Stack Traces** — SEVERITY: P2

**File:** [GlobalExceptionHandler.java](file:///e:/inventory-management-system-main/backend/src/main/java/com/kirana/exception/GlobalExceptionHandler.java#L57-L67)

```java
@ExceptionHandler(RuntimeException.class)
public ResponseEntity<ApiResponse<Void>> handleRuntimeException(RuntimeException ex) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("INTERNAL_ERROR", "An unexpected error occurred"));
}
```

No logging of the actual exception. In production, you'll have no idea what went wrong. Add:
```java
log.error("Unhandled RuntimeException", ex);
```

---

## 🟡 MEDIUM: Frontend Issues

### 16. **Monolithic Page Components** — SEVERITY: P3

The largest page files are:
- [Purchases.jsx](file:///e:/inventory-management-system-main/frontend/src/pages/Purchases.jsx) — **45KB, 1200+ lines**
- [Inventory.jsx](file:///e:/inventory-management-system-main/frontend/src/pages/Inventory.jsx) — **23KB**
- [AuthPage.jsx](file:///e:/inventory-management-system-main/frontend/src/pages/AuthPage.jsx) — **20KB**
- [Billing.jsx](file:///e:/inventory-management-system-main/frontend/src/pages/Billing.jsx) — **19KB**
- [Analytics.jsx](file:///e:/inventory-management-system-main/frontend/src/pages/Analytics.jsx) — **18KB**

Each is a single massive component with inline modals, form state, table rendering, and business logic. This makes them:
- Hard to maintain
- Impossible to test
- Not reusable
- Performance-sensitive (entire component re-renders on any state change)

---

### 17. **No Error Boundaries** — SEVERITY: P2

There are no React Error Boundaries anywhere. If any component throws during render, the entire app crashes to a white screen. For a production app, wrap routes in error boundaries:

```jsx
<ErrorBoundary fallback={<ErrorPage />}>
  <Route ... />
</ErrorBoundary>
```

---

### 18. **No Loading/Error States on Several Pages** — SEVERITY: P2

The Dashboard has loading states, but several API calls across pages don't handle error states gracefully. Failed API calls result in silent failures with console.error only.

---

### 19. **Token Stored in localStorage** — SEVERITY: P3

**File:** [AppContext.jsx](file:///e:/inventory-management-system-main/frontend/src/context/AppContext.jsx#L72)

```javascript
localStorage.setItem('authToken', d.token);
```

`localStorage` is vulnerable to XSS attacks. For a production app, consider `httpOnly` cookies set by the backend, or at minimum implement Content Security Policy headers.

---

### 20. **Frontend Has Mock Data System (30KB)** — SEVERITY: P3

**File:** [mockData.js](file:///e:/inventory-management-system-main/frontend/src/services/mockData.js) — 29,785 bytes

This is useful for development but adds 30KB to the production bundle since `USE_MOCK_DATA` is checked at runtime. The mock system should be conditionally imported or removed for production builds via tree-shaking.

---

## 🟢 DevOps Analysis

### 21. **Docker Setup — Well Done** ✅

The Docker configuration is solid:
- Multi-stage builds for both frontend and backend
- Backend Dockerfile bundles the ML service in the same container (pragmatic for free-tier deployment)
- Frontend uses nginx with proper SPA routing (`try_files $uri $uri/ /index.html`)
- Health checks configured for both services
- `docker-compose.yml` properly references environment variables

### 22. **CI/CD Pipeline — Minimal But Functional** ⚠️

**File:** [ci.yml](file:///e:/inventory-management-system-main/.github/workflows/ci.yml)

The CI pipeline:
- ✅ Compiles backend with Maven
- ✅ Runs `mvn test` (but there are no tests)
- ✅ Builds frontend with npm
- ❌ No linting step
- ❌ No Docker build verification
- ❌ No deployment automation
- ❌ No staging environment

### 23. **Flyway Migrations — Mixed Quality** ⚠️

**Migrations:**
- `V1__initial_schema.sql` — Good, creates all 13 tables with proper FKs and indexes
- `V2__google_oauth_support.sql` — OAuth schema updates
- `V3__seed_data.sql` — Seed data (acceptable)
- `V4__mock_data.sql` (25KB) — **Mock/test data in production migrations** ❌
- `V5__mock_data.sql` (40KB) — **More mock data in production migrations** ❌

> [!WARNING]
> **V4 and V5 inject 65KB of mock data into PRODUCTION databases.** This is a major issue. Mock data should be loaded via a separate seeding script, not Flyway migrations which are permanent and sequential.

### 24. **Database Schema — Good Design** ✅

The schema has:
- ✅ Proper foreign key constraints
- ✅ Indexes on `retailer_id` for multi-tenant queries
- ✅ Composite index on `(retailer_id, sale_date)` for dashboard queries
- ✅ Soft-delete support (`deleted_at`) on all main tables
- ✅ Audit timestamps (`created_at`, `updated_at`)
- ⚠️ Missing: index on `items(retailer_id, category)` for category queries
- ⚠️ Missing: index on `items(retailer_id, is_active, current_stock)` for low-stock queries

---

## 🟡 ML Service Analysis

### 25. **Prophet Forecasting — Functional But Fragile** ⚠️

**File:** [forecast.py](file:///e:/inventory-management-system-main/ml-service/forecast.py)

**Strengths:**
- Properly uses Facebook Prophet for time-series forecasting
- Clips predictions to ≥ 0 (physically meaningful)
- Structured response with forecast, total_predicted, avg_daily

**Issues:**
- `cache = {}` defined but never populated — forecasts recompute every request
- Prophet model training happens on every API call — slow and CPU-intensive
- No model persistence (pickle/joblib)
- Minimum 10 data points required, but error message isn't surfaced well to the frontend
- No memory management — Prophet models can be large

### 26. **ML Database Connection Duplicates Backend Config** — SEVERITY: P3

**File:** [database.py](file:///e:/inventory-management-system-main/ml-service/database.py)

The ML service creates its own SQLAlchemy connection pool to the same database. This duplicates connection management and could cause connection pool exhaustion on free-tier databases (Supabase free tier limits connections).

---

## 📋 What's Actually Good

| Area | Details |
|---|---|
| **Multi-tenant isolation** | All queries scope by `retailer_id` via `TenantContext`. Consistent across all controllers. |
| **Consistent API responses** | `ApiResponse<T>` wrapper with `success`, `data`, `error` fields throughout. |
| **JWT implementation** | HS512 signing, proper secret length validation, clean util class. |
| **Google OAuth** | Server-side ID token verification with `GoogleIdTokenVerifier`. Proper email verification check. |
| **Soft deletes** | Consistently implemented across all entities with `deleted_at` timestamp. |
| **Business logic** | Stock deduction on sale, stock addition on PO receipt, payment tracking — all functional. |
| **Pessimistic locking** | `@Lock(LockModeType.PESSIMISTIC_WRITE)` on stock-modifying operations prevents race conditions. |
| **Documentation** | README is comprehensive. DEPLOYMENT.md is step-by-step. BUGS.md admits known issues. |
| **Error handling** | Custom exception hierarchy with proper HTTP status mapping. |
| **Frontend UX** | Dark/light theme, responsive sidebar, Google OAuth integration, password strength meter. |

---

## 🚨 Prioritized Remediation Plan (For Tomorrow's Deadline)

### Must Fix (Tonight) — Blocks Delivery

| # | Issue | Time Est. | Fix |
|---|---|---|---|
| 1 | **Secrets in `.env`** | 30 min | Rotate all credentials, remove `.env` from Git, scrub history |
| 2 | **V4/V5 mock data in Flyway** | 20 min | Can't undo migrations — add V6 to `DELETE FROM` mock data, or accept for demo |
| 3 | **Dead commented code** | 5 min | Delete lines 1-77 in DashboardService.java |
| 4 | **Exception handler logging** | 10 min | Add `log.error()` to RuntimeException and Exception handlers |

### Should Fix (Tomorrow Morning) — Professional Quality

| # | Issue | Time Est. | Fix |
|---|---|---|---|
| 5 | **Sale deletion doesn't restore stock** | 30 min | Add stock restoration logic to `deleteSale()` |
| 6 | **N+1 queries in SaleService** | 1.5 hr | Add `JOIN FETCH` repository methods, batch load customers/items |
| 7 | **N+1 queries in PurchaseOrderService** | 1 hr | Same pattern as above |
| 8 | **Add basic tests** | 2 hr | Create test dir, add 10-15 critical service/controller tests |
| 9 | **Missing `@Transactional`** | 15 min | Add annotations to write methods |
| 10 | **Add Error Boundaries to frontend** | 30 min | Create ErrorBoundary component, wrap routes |

### Nice to Have (If Time Permits)

| # | Issue | Time Est. |
|---|---|---|
| 11 | Real pagination with Spring `Pageable` | 2 hr |
| 12 | Rate limiting on auth endpoints | 1 hr |
| 13 | Split monolithic page components | 4 hr |
| 14 | ML service caching | 1 hr |
| 15 | Frontend error boundary + toast notifications | 1 hr |

---

## File-by-File Heat Map

| File | Issues | Severity |
|---|---|---|
| `.env` | Secrets committed | 🔴 Critical |
| `DashboardService.java` | Dead code, in-memory aggregation | 🟠 High |
| `SaleService.java` | N+1 queries, missing stock restore on delete | 🟠 High |
| `PurchaseOrderService.java` | N+1 queries, in-memory filtering | 🟠 High |
| `PaymentService.java` | N+1 queries | 🟠 High |
| `GlobalExceptionHandler.java` | No logging | 🟡 Medium |
| `ItemService.java` | Missing @Transactional, fake pagination | 🟡 Medium |
| `V4/V5 migrations` | Mock data in production migrations | 🟡 Medium |
| `Purchases.jsx` | 45KB monolith | 🟡 Medium |
| `ml-service/forecast.py` | Unused cache, retrains every call | 🟡 Medium |
| `SecurityConfig.java` | No rate limiting | 🟡 Medium |
| `AppContext.jsx` | Token in localStorage | 🟢 Low |
| `mockData.js` | 30KB dead weight in production bundle | 🟢 Low |

---

## Final Verdict

> [!IMPORTANT]
> **This is a solid 4th-year project that demonstrates real competence in full-stack development.** The architecture is clean, the feature set is substantial, and the deployment story is well thought out. However, it has **critical gaps that prevent it from being a $20,000 production deliverable:**
>
> 1. **Security hygiene** — Committed secrets need immediate remediation
> 2. **Zero test coverage** — Unacceptable for any professional delivery
> 3. **Performance time bombs** — N+1 queries will crash under real load
> 4. **Business logic bugs** — Stock not restored on sale deletion
>
> Fix the P0 and P1 issues above, and this project jumps from a **5.9 to a solid 7.5/10** — a respectable professional delivery.
