  # Free-Tier Deployment Guide (Step by Step)

This guide deploys the current architecture using only free plans:
- Backend + ML: Render Free (single Docker web service)
- Frontend: Vercel Hobby
- Database: Supabase Free
- OAuth: Google Cloud OAuth client

## 1. Prepare Local Configuration

1. Copy env templates:
   ```powershell
   Copy-Item .env.example .env
   Copy-Item .env.local.example .env.local
   ```
2. Fill real values in `.env` for:
   - `DB_URL` (use Supabase transaction pooler `:6543`, avoid session mode `:5432`)
   - `DB_USERNAME`
   - `DB_PASSWORD`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `JAVA_MAX_RAM_PERCENTAGE=45.0`
   - `DB_POOL_SIZE=1`
   - `DB_MAX_OVERFLOW=0`
3. Validate before deployment:
   ```powershell
   .\validate-free-tier-deploy.ps1 -BackendEnvFile .env -Strict
   ```

## 2. Create Supabase Free Project

1. Create a new Supabase project.
2. Get JDBC transaction pooler URL (port 6543):
   - Format: `jdbc:postgresql://aws-1-<region>.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0`
3. Set `DB_URL`, `DB_USERNAME` (`postgres.<project-ref>`), and `DB_PASSWORD` in `.env`.

## 3. Create Google OAuth Client

1. Open Google Cloud Console.
2. Create OAuth client (Web application).
3. Add origins:
   - `http://localhost:5173`
   - `https://<your-vercel-domain>`
4. Save client id into `GOOGLE_CLIENT_ID`.

## 4. Deploy Backend on Render Free

1. Push latest code to GitHub.
2. In Render:
   - New Web Service (or Blueprint using `render.yaml`)
   - Root Directory: repository root (leave empty)
   - Docker Build Context: `.`
   - Dockerfile: `./backend/Dockerfile`
   - Plan: Free
3. Add backend env vars in Render dashboard:
   - `SPRING_PROFILES_ACTIVE=prod`
   - `DB_URL`
   - `DB_USERNAME`
   - `DB_PASSWORD`
   - `DB_MAX_POOL_SIZE=2`
   - `DB_MIN_IDLE=0`
   - `DB_CONNECTION_TIMEOUT_MS=10000`
   - `FLYWAY_CONNECT_RETRIES=20`
   - `JWT_SECRET`
   - `ML_SERVICE_URL=http://127.0.0.1:8000`
   - `CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>`
   - `ML_ALLOWED_ORIGINS=https://<your-vercel-domain>`
   - `GOOGLE_CLIENT_ID`
4. Wait for deploy and confirm:
   - `https://<your-render-service>/actuator/health` returns UP.

### Render Build Error Fix

If Render fails with:

`failed to calculate checksum ... "/backend/start-services.sh": not found`

then the service is building from the wrong context.

Use these exact settings in Render service config:

1. Root Directory: repository root (blank)
2. Docker Build Context: `.`
3. Dockerfile Path: `backend/Dockerfile`

Then click **Clear build cache** and redeploy.

### Supabase Max Clients Error Fix

If Render fails with:

`FATAL: MaxClientsInSessionMode: max clients reached`

set these Render env vars and redeploy:

1. `DB_MAX_POOL_SIZE=1`
2. `DB_MIN_IDLE=0`
3. `FLYWAY_CONNECT_RETRIES=10`

This lowers Hikari startup pressure and gives Flyway retries while old sessions drain.

### Render "No Open Ports" + Hikari Timeout Fix

If Render logs show this pattern during deploy:

- `No open ports detected on 0.0.0.0`
- `Connection error: HikariPool-1 - Connection is not available, request timed out after 30000ms (total=1, active=1, idle=0, waiting=0)`

then Spring startup is blocked waiting on DB connections, so Render never sees a listening web port.

Set these Render env vars and redeploy (clear build cache once):

1. `DB_MAX_POOL_SIZE=2`
2. `DB_MIN_IDLE=0`
3. `DB_CONNECTION_TIMEOUT_MS=10000`
4. `FLYWAY_CONNECT_RETRIES=20`
5. Keep `DB_URL` on Supabase transaction pooler `:6543` with `prepareThreshold=0`

If you later hit `MaxClientsInSessionMode`, reduce `DB_MAX_POOL_SIZE` back to `1` after backend reaches stable startup.

### Render Out Of Memory (512Mi) Fix

If Render logs show `Out of memory (used over 512Mi)`, your single-container stack is exceeding free-tier memory (Java + Python ML in one service).

Set these Render env vars and redeploy:

1. `JAVA_MAX_RAM_PERCENTAGE=45.0`
2. `DB_POOL_SIZE=1`
3. `DB_MAX_OVERFLOW=0`

Why this works:

1. Java heap is capped so Spring and ML can coexist in 512Mi.
2. ML DB pool footprint is kept minimal.
3. Prophet is now lazy-loaded, so heavy ML dependencies are not loaded at service startup.

## 5. Deploy Frontend on Vercel Hobby

1. Import repo into Vercel.
2. Set root directory to `frontend`.
3. Add frontend env vars:
   - `VITE_API_BASE_URL=https://<your-render-service>/api`
   - `VITE_GOOGLE_CLIENT_ID=<same-google-client-id>`
4. Deploy and note Vercel URL.

## 6. Generate Provider-Ready Env Blocks (Optional Automation)

Use this script to print copy-paste env blocks for both Render and Vercel:

```powershell
.\prepare-free-tier-env-blocks.ps1 -BackendEnvFile .env -BackendServiceUrl https://<your-render-service> -FrontendUrl https://<your-vercel-domain>
```

If you need actual secret values printed (trusted machine only):

```powershell
.\prepare-free-tier-env-blocks.ps1 -BackendEnvFile .env -BackendServiceUrl https://<your-render-service> -FrontendUrl https://<your-vercel-domain> -ShowSecrets
```

## 7. Final Pre-Launch Validation

1. Run local smoke checks:
   ```powershell
   .\smoke-check-supabase.ps1
   .\verify-supabase-routing.ps1 -EnvFile .env.local
   ```
2. Re-run deploy preflight:
   ```powershell
   .\validate-free-tier-deploy.ps1 -BackendEnvFile .env -Strict
   ```

## 8. Production Smoke Tests

After deployment, verify:
1. Backend health endpoint is UP.
2. Register/login works.
3. Google sign-in works.
4. Dashboard, Inventory, Purchases, and Transactions load without 5xx.
5. Protected APIs return 401 without token.

## 9. Free-Tier Operations Notes

1. Render Free can cold-start after inactivity.
2. Supabase Free has storage and egress limits.
3. Keep logs monitored for auth errors and 5xx spikes during first 48 hours.
4. Upgrade plan only if cold-start, resource, or quota limits become frequent blockers.
