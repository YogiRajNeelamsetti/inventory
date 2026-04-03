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
   - `DB_URL`
   - `DB_USERNAME`
   - `DB_PASSWORD`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
3. Validate before deployment:
   ```powershell
   .\validate-free-tier-deploy.ps1 -BackendEnvFile .env -Strict
   ```

## 2. Create Supabase Free Project

1. Create a new Supabase project.
2. Get JDBC session pooler URL (port 5432):
   - Format: `jdbc:postgresql://aws-1-<region>.pooler.supabase.com:5432/postgres?sslmode=require`
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
   - `SERVER_PORT=5000`
   - `DB_URL`
   - `DB_USERNAME`
   - `DB_PASSWORD`
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
