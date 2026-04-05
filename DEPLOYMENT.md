# Deployment Guide — Supabase + Cloud Run + Render + Vercel + Google OAuth

For an explicit free-tier-only execution flow, see [FREE_TIER_DEPLOYMENT_GUIDE.md](FREE_TIER_DEPLOYMENT_GUIDE.md).
For Cloud Run primary deployment with Render backup, see [CLOUD_RUN_DEPLOYMENT_GUIDE.md](CLOUD_RUN_DEPLOYMENT_GUIDE.md).

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

## 3. Cloud Run Deployment (Primary)

Use GitHub Actions workflow `.github/workflows/deploy-cloud-run.yml` with OIDC Workload Identity Federation.

1. Configure repository variables and secrets listed in [CLOUD_RUN_DEPLOYMENT_GUIDE.md](CLOUD_RUN_DEPLOYMENT_GUIDE.md).
2. Run the workflow **Deploy Backend to Cloud Run**.
3. Copy deployed Cloud Run URL (for example, `https://kirana-backend-xxxxxx-uc.a.run.app`).
4. Update Vercel env `VITE_API_BASE_URL=<cloud-run-url>/api`.

You can validate and smoke-test before traffic switch:

```powershell
.\validate-cloud-run-deploy.ps1 -BackendEnvFile .env -FrontendEnvFile frontend/.env.vercel.example -CloudRunServiceUrl https://<your-cloud-run-service>.run.app -RenderBackupServiceUrl https://<your-render-service>.onrender.com -ProjectId <gcp-project-id> -Region <gcp-region> -ServiceName kirana-backend -Strict

.\smoke-check-cloud-run.ps1 -ApiBaseUrl https://<your-cloud-run-service>.run.app -Email <login-email> -Password <login-password>
```

Keep Render deployment active as backup and do not remove `render.yaml`.

## 4. Render Deployment (Backup Service)

### Option A: Render Dashboard

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
   | `SERVER_PORT` | *(do not set on Render; platform injects `PORT`)* |
   | `DB_URL` | `jdbc:postgresql://aws-1-<region>.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0` |
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

### Verify Backup Backend Health

```bash
curl https://kirana-backend.onrender.com/actuator/health
# Expected: {"status":"UP"}
```

---

### ML on Free Tier

ML runs inside the same Render container as backend. No second Render service is required.

---

## 5. Vercel Frontend Deployment

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
   | `VITE_API_BASE_URL` | `https://<your-cloud-run-service>.run.app/api` |
   | `VITE_GOOGLE_CLIENT_ID` | *(same Client ID from Google Cloud)* |

5. Click **Deploy**.
6. Note the Vercel URL (e.g., `https://your-app.vercel.app`).

---

## 6. Post-Deploy Configuration

After backend and frontend are deployed:

1. **Backend ML URL must stay local**: Keep `ML_SERVICE_URL=http://127.0.0.1:8000`.
2. **Update CORS on backend**: Set `CORS_ALLOWED_ORIGINS` to your actual Vercel URL.
3. **Update CORS for ML middleware**: Set `ML_ALLOWED_ORIGINS` to include Vercel + Cloud Run + Render backup URLs as needed.
4. **Update Google OAuth origins**: Add your Vercel production URL to the authorized JavaScript origins in Google Cloud Console.
5. **Primary API target**: Keep `VITE_API_BASE_URL` pointing to Cloud Run.
6. **Manual failover**: If Cloud Run is unavailable, switch `VITE_API_BASE_URL` to Render and redeploy Vercel.

---

## 7. Smoke Tests

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
.\smoke-check-cloud-run.ps1 -ApiBaseUrl https://<your-cloud-run-service>.run.app -SkipForecast
```

---

## Environment Variable Summary

### Backend (Cloud Run Primary)

| Variable | Required | Description |
|----------|----------|-------------|
| `SPRING_PROFILES_ACTIVE` | Yes | Set to `prod` |
| `DB_URL` | Yes | Supabase JDBC URL (prefer transaction pooler `:6543`) |
| `DB_USERNAME` | Yes | `postgres.<project-ref>` |
| `DB_PASSWORD` | Yes | Supabase DB password |
| `JWT_SECRET` | Yes | 256-bit+ secret key |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `ML_SERVICE_URL` | Yes | Internal ML URL (`http://127.0.0.1:8000`) |
| `ENABLE_ML_SERVICE` | No | `true` for Cloud Run primary runtime |
| `CORS_ALLOWED_ORIGINS` | Yes | Vercel frontend URL |
| `ML_ALLOWED_ORIGINS` | Yes | Vercel + Cloud Run + Render URLs as required |
| `DB_MAX_POOL_SIZE` | No | Hikari max pool size |
| `DB_MIN_IDLE` | No | Hikari min idle connections |
| `DB_CONNECTION_TIMEOUT_MS` | No | Hikari acquire timeout |
| `FLYWAY_CONNECT_RETRIES` | No | Flyway startup retry count |

### Backend (Render Backup)

| Variable | Required | Description |
|----------|----------|-------------|
| `SPRING_PROFILES_ACTIVE` | Yes | Set to `prod` |
| `SERVER_PORT` | No | Do not set on Render; platform injects `PORT` |
| `DB_URL` | Yes | Supabase JDBC URL (prefer transaction pooler `:6543`) |
| `DB_USERNAME` | Yes | `postgres.<project-ref>` |
| `DB_PASSWORD` | Yes | Supabase DB password |
| `DB_MAX_POOL_SIZE` | No | Hikari max pool size (default `2` for free tier startup stability; reduce to `1` if max-clients errors appear) |
| `DB_MIN_IDLE` | No | Hikari minimum idle connections (default `0`) |
| `DB_CONNECTION_TIMEOUT_MS` | No | Hikari connection acquire timeout in ms (default `10000` for faster startup retries) |
| `FLYWAY_CONNECT_RETRIES` | No | Flyway startup retry count (default `20`) |
| `JWT_SECRET` | Yes | 256-bit+ secret key |
| `ML_SERVICE_URL` | Yes | Internal ML URL (`http://127.0.0.1:8000`) |
| `ENABLE_ML_SERVICE` | No | Set `false` on Render free tier to prevent OOM; set `true` on higher-memory plans |
| `ML_ALLOWED_ORIGINS` | Yes | Vercel frontend URL for ML CORS middleware |
| `CORS_ALLOWED_ORIGINS` | Yes | Vercel frontend URL |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Cloud Run backend URL + `/api` (switch to Render URL for manual failover) |
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
