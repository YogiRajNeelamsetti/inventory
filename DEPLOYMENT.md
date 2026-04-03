# Deployment Guide — Supabase + Render + Vercel + Google OAuth (Single Render Service)

For an explicit free-tier-only execution flow, see [FREE_TIER_DEPLOYMENT_GUIDE.md](FREE_TIER_DEPLOYMENT_GUIDE.md).

## Prerequisites

- GitHub repository with the project pushed
- Accounts on: [Supabase](https://supabase.com), [Render](https://render.com), [Vercel](https://vercel.com), [Google Cloud Console](https://console.cloud.google.com)

---

## 0. Free-Tier Preflight (Recommended)

Before creating any cloud resources, prepare env values and run the validation script:

1. Copy root env template:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Fill required values in `.env`.
3. Reference frontend template for Vercel values:
   - `frontend/.env.vercel.example`
4. Run deployment preflight validation:
   ```powershell
   .\validate-free-tier-deploy.ps1 -BackendEnvFile .env -Strict
   ```

If you already configure frontend env variables directly in the Vercel dashboard, you can skip passing a frontend env file to the script.

Never commit real `.env` secrets. Rotate credentials immediately if secrets were previously exposed.

---

## 1. Supabase Database Setup

1. Create a new Supabase project.
2. Go to **Settings → Database → Connection string → JDBC**.
3. Copy the connection string — it looks like:
   ```
   jdbc:postgresql://aws-1-<region>.pooler.supabase.com:5432/postgres?sslmode=require
   ```
4. Note the **database password** you set during project creation.
5. Connection details for Render env vars:
   - `DB_URL` = the JDBC connection string above
   - `DB_USERNAME` = `postgres.<project-ref>`
   - `DB_PASSWORD` = your Supabase database password

Flyway migrations will run automatically on first backend start.

In production profile, migrations are loaded from `db/migration/prod` to avoid running local/mock data scripts.
Versions V4 and V5 are included as explicit no-op migrations for Flyway history compatibility.

### 1.1 Local Data Migration to Supabase (Optional)

If you already have data in local PostgreSQL and want to move it to Supabase:

1. Run backend once against Supabase so Flyway creates schema baseline.
2. Ensure your local source database is reachable (default: `localhost:5432`, `kirana_db`).
3. Run migration script from repo root:

   ```powershell
   .\migrate-local-to-supabase.ps1
   ```

4. To preserve target data (skip truncate), run:

   ```powershell
   .\migrate-local-to-supabase.ps1 -SkipTargetTruncate
   ```

The script reads Supabase target credentials from `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` or `.env.local` (`COMPOSE_DB_*` values).

If backend startup reports Flyway checksum mismatch for versions `4` and `5`, run:

```powershell
.\repair-supabase-flyway.ps1
```

---

## 2. Google Cloud OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project (or select existing).
3. Navigate to **APIs & Services → Credentials**.
4. Click **Create Credentials → OAuth client ID**.
5. Application type: **Web application**.
6. Add **Authorized JavaScript origins**:
   - `http://localhost:5173` (local dev)
   - `https://your-app.vercel.app` (production — update after Vercel deploy)
7. Click **Create** and copy the **Client ID** (looks like `123456789-abc.apps.googleusercontent.com`).

You'll also need to configure the **OAuth consent screen** (APIs & Services → OAuth consent screen):
- User type: External
- App name, support email, developer email
- No scopes needed beyond default (email, profile, openid)

---

## 3. Render Deployment (Single Service)

### Option A: Render Dashboard (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com) → **New → Web Service**.
2. Connect your GitHub repo.
3. Configure:
   - **Name**: `kirana-backend`
   - **Root Directory**: repository root
   - **Runtime**: Docker
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Plan**: Free (or Starter for production)
4. Add **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `SPRING_PROFILES_ACTIVE` | `prod` |
   | `SERVER_PORT` | `5000` |
   | `DB_URL` | `jdbc:postgresql://aws-1-<region>.pooler.supabase.com:5432/postgres?sslmode=require` |
   | `DB_USERNAME` | `postgres.<project-ref>` |
   | `DB_PASSWORD` | *(Supabase DB password)* |
   | `JWT_SECRET` | *(generate: `openssl rand -base64 48`)* |
   | `ML_SERVICE_URL` | `http://127.0.0.1:8000` |
   | `ML_ALLOWED_ORIGINS` | `https://your-app.vercel.app` |
   | `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` |
   | `GOOGLE_CLIENT_ID` | *(from Google Cloud Console)* |

5. Click **Create Web Service** and wait for the build.
6. Note the Render URL (e.g., `https://kirana-backend.onrender.com`).

### Option B: Blueprint (render.yaml)

Push the repo and use **New → Blueprint** in Render Dashboard. It will read `render.yaml` from the repo root and create a single service.

### Verify Backend Health

```bash
curl https://kirana-backend.onrender.com/actuator/health
# Expected: {"status":"UP"}
```

---

### ML on Free Tier

ML runs inside the same Render container as backend. No second Render service is required.

---

## 4. Vercel Frontend Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New → Project**.
2. Import your GitHub repo.
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | `https://kirana-backend.onrender.com/api` |
   | `VITE_GOOGLE_CLIENT_ID` | *(same Client ID from Google Cloud)* |

5. Click **Deploy**.
6. Note the Vercel URL (e.g., `https://your-app.vercel.app`).

---

## 5. Post-Deploy Configuration

After backend and frontend are deployed:

1. **Backend ML URL must stay local**: Keep `ML_SERVICE_URL=http://127.0.0.1:8000`.
2. **Update CORS on backend**: Set `CORS_ALLOWED_ORIGINS` to your actual Vercel URL.
3. **Update CORS for ML middleware**: Set `ML_ALLOWED_ORIGINS` to your actual Vercel URL.
4. **Update Google OAuth origins**: Add your Vercel production URL to the authorized JavaScript origins in Google Cloud Console.
5. **Redeploy backend** on Render after env var updates (Render auto-restarts on env changes).

---

## 6. Smoke Tests

Run these checks on the deployed URLs:

- [ ] Backend health: `GET /actuator/health` returns `{"status":"UP"}`
- [ ] Email/password login: `POST /api/auth/login` with valid credentials
- [ ] Email/password register: `POST /api/auth/register` with new user data
- [ ] Google OAuth login: Click Google button on auth page
- [ ] Google OAuth auto-signup: Sign in with a Google account not yet registered
- [ ] Protected API: Access dashboard/items with JWT token
- [ ] Auth rejection: Access protected endpoint without token → 401
- [ ] Forecast proxy endpoint works: `GET /api/forecast/recommendations` with JWT token

You can also run local smoke scripts before production rollout:

```powershell
.\smoke-check-supabase.ps1
.\verify-supabase-routing.ps1 -EnvFile .env.local
```

---

## Environment Variable Summary

### Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `SPRING_PROFILES_ACTIVE` | Yes | Set to `prod` |
| `SERVER_PORT` | Yes | `5000` |
| `DB_URL` | Yes | Supabase JDBC URL |
| `DB_USERNAME` | Yes | `postgres.<project-ref>` |
| `DB_PASSWORD` | Yes | Supabase DB password |
| `JWT_SECRET` | Yes | 256-bit+ secret key |
| `ML_SERVICE_URL` | Yes | Internal ML URL (`http://127.0.0.1:8000`) |
| `ML_ALLOWED_ORIGINS` | Yes | Vercel frontend URL for ML CORS middleware |
| `CORS_ALLOWED_ORIGINS` | Yes | Vercel frontend URL |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Render backend URL + `/api` |
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
