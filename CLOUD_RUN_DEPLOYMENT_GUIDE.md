# Cloud Run Deployment Guide (Primary) with Render Backup

This guide sets Cloud Run as the primary backend runtime while keeping the existing Render deployment available as manual backup.

## Target Architecture

- Backend + ML runtime: Cloud Run (single service, primary)
- Frontend: Vercel (unchanged)
- Database: Supabase (unchanged)
- OAuth: Google OAuth client (unchanged)
- Backup backend: Render (existing service retained)
- Deployment automation: GitHub Actions with OIDC Workload Identity Federation

## 1. Prerequisites

- GCP project with billing enabled
- `gcloud` CLI authenticated locally
- Existing Supabase credentials (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`)
- Existing Google OAuth client id
- Existing Render backend still healthy (for fallback)
- Budget approved for always-on Cloud Run (`CLOUD_RUN_MIN_INSTANCES=1` adds continuous runtime cost)

## 2. Validate and Prepare Environment Values

1. Copy root env template if needed:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Fill real backend values in `.env`:
   - `DB_URL`
   - `DB_USERNAME`
   - `DB_PASSWORD`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
3. Generate Cloud Run and Vercel env blocks:
   ```powershell
   .\prepare-cloud-run-env-blocks.ps1 -BackendEnvFile .env -CloudRunServiceUrl https://<your-cloud-run-service>.run.app -RenderBackupServiceUrl https://<your-render-service>.onrender.com -FrontendUrl https://<your-vercel-domain>
   ```
4. Run preflight validation:
   ```powershell
   .\validate-cloud-run-deploy.ps1 -BackendEnvFile .env -FrontendEnvFile frontend/.env.vercel.example -CloudRunServiceUrl https://<your-cloud-run-service>.run.app -RenderBackupServiceUrl https://<your-render-service>.onrender.com -ProjectId <gcp-project-id> -Region <gcp-region> -ServiceName kirana-backend -CloudRunMinInstances 1 -CloudRunMaxInstances 5 -CloudRunConcurrency 80 -Strict
   ```

## 3. One-Time GCP Setup

Set local shell variables:

```powershell
$PROJECT_ID="<gcp-project-id>"
$REGION="<gcp-region>"
$REPO_NAME="<artifact-registry-repo>"
$SERVICE_NAME="kirana-backend"
$DEPLOY_SA="github-cloud-run-deployer"
```

Enable APIs:

```powershell
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com iamcredentials.googleapis.com sts.googleapis.com --project $PROJECT_ID
```

Create Artifact Registry repository:

```powershell
gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION --description="Kirana backend images" --project=$PROJECT_ID
```

Create deploy service account:

```powershell
gcloud iam service-accounts create $DEPLOY_SA --display-name="GitHub Cloud Run Deployer" --project=$PROJECT_ID
$DEPLOY_SA_EMAIL="$DEPLOY_SA@$PROJECT_ID.iam.gserviceaccount.com"
```

Grant deploy roles:

```powershell
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$DEPLOY_SA_EMAIL" --role="roles/run.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$DEPLOY_SA_EMAIL" --role="roles/iam.serviceAccountUser"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$DEPLOY_SA_EMAIL" --role="roles/cloudbuild.builds.editor"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$DEPLOY_SA_EMAIL" --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$DEPLOY_SA_EMAIL" --role="roles/secretmanager.secretAccessor"
```

## 4. Configure OIDC Workload Identity Federation for GitHub Actions

Set GitHub coordinates:

```powershell
$GITHUB_OWNER="<github-owner>"
$GITHUB_REPO="<github-repo>"
$POOL_ID="github-pool"
$PROVIDER_ID="github-provider"
```

Create pool and provider:

```powershell
gcloud iam workload-identity-pools create $POOL_ID --location="global" --display-name="GitHub Actions Pool" --project=$PROJECT_ID

gcloud iam workload-identity-pools providers create-oidc $PROVIDER_ID --location="global" --workload-identity-pool=$POOL_ID --display-name="GitHub OIDC Provider" --issuer-uri="https://token.actions.githubusercontent.com" --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" --attribute-condition="assertion.repository=='$GITHUB_OWNER/$GITHUB_REPO'" --project=$PROJECT_ID
```

Bind provider principal to deploy service account:

```powershell
$PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
$WIF_PRINCIPAL="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_ID/attribute.repository/$GITHUB_OWNER/$GITHUB_REPO"

gcloud iam service-accounts add-iam-policy-binding $DEPLOY_SA_EMAIL --role="roles/iam.workloadIdentityUser" --member="$WIF_PRINCIPAL" --project=$PROJECT_ID
```

Get provider resource path for GitHub secret:

```powershell
gcloud iam workload-identity-pools providers describe $PROVIDER_ID --location="global" --workload-identity-pool=$POOL_ID --project=$PROJECT_ID --format="value(name)"
```

## 5. Create Secret Manager Secrets

Create these secrets in GCP and add latest versions:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`

Example:

```powershell
"<value>" | gcloud secrets create DB_URL --data-file=- --replication-policy=automatic --project=$PROJECT_ID
"<value>" | gcloud secrets versions add DB_URL --data-file=- --project=$PROJECT_ID
```

If secret already exists, only run `versions add`.

## 6. Configure GitHub Repository Variables and Secrets

The workflow file is:

- `.github/workflows/deploy-cloud-run.yml`

Add repository variables:

- `GCP_PROJECT_ID`
- `CLOUD_RUN_REGION`
- `CLOUD_RUN_SERVICE` (recommended: `kirana-backend`)
- `CLOUD_RUN_IMAGE_REPO` (Artifact Registry repo name)
- `CLOUD_RUN_CPU` (example: `1`)
- `CLOUD_RUN_MEMORY` (example: `1Gi`)
- `CLOUD_RUN_TIMEOUT` (example: `600`)
- `CLOUD_RUN_MIN_INSTANCES` (set `1` for always-on)
- `CLOUD_RUN_MAX_INSTANCES` (example: `5`)
- `CLOUD_RUN_CONCURRENCY` (example: `80`)
- `CLOUD_RUN_CORS_ALLOWED_ORIGINS` (Vercel URL)
- `CLOUD_RUN_ML_ALLOWED_ORIGINS` (Vercel URL, Cloud Run URL, Render URL)
- `CLOUD_RUN_DB_MAX_POOL_SIZE` (example: `2`)
- `CLOUD_RUN_DB_MIN_IDLE` (example: `0`)
- `CLOUD_RUN_DB_CONNECTION_TIMEOUT_MS` (example: `10000`)
- `CLOUD_RUN_FLYWAY_CONNECT_RETRIES` (example: `20`)
- `CLOUD_RUN_JAVA_MAX_RAM_PERCENTAGE` (example: `45.0`)
- `CLOUD_RUN_JAVA_INITIAL_RAM_PERCENTAGE` (example: `10.0`)
- `CLOUD_RUN_JAVA_MAX_METASPACE_MB` (example: `192`)
- `CLOUD_RUN_JAVA_RESERVED_CODE_CACHE_MB` (example: `96`)
- `CLOUD_RUN_JAVA_THREAD_STACK_KB` (example: `512`)
- `GCP_SECRET_DB_URL` (secret name)
- `GCP_SECRET_DB_USERNAME` (secret name)
- `GCP_SECRET_DB_PASSWORD` (secret name)
- `GCP_SECRET_JWT_SECRET` (secret name)
- `GCP_SECRET_GOOGLE_CLIENT_ID` (secret name)

Add repository secrets:

- `GCP_WORKLOAD_IDENTITY_PROVIDER` (provider resource name)
- `GCP_SERVICE_ACCOUNT_EMAIL` (deploy SA email)

## 7. Deploy Cloud Run from GitHub Actions

1. Open GitHub Actions.
2. Run workflow: `Deploy Backend to Cloud Run`.
3. Optionally provide `image_tag`.
4. After success, copy the printed Cloud Run URL.
5. Verify scaling applied:
   ```powershell
   gcloud run services describe kirana-backend --region <gcp-region> --project <gcp-project-id> --format="value(spec.template.scaling.minInstanceCount,spec.template.scaling.maxInstanceCount,spec.template.maxInstanceRequestConcurrency)"
   ```
   Expected output starts with `1` for min instances, and includes the configured concurrency value.

## 8. Switch Frontend to Cloud Run Primary

In Vercel environment variables:

- Set `VITE_API_BASE_URL=https://<your-cloud-run-service>.run.app/api`
- Keep backup value recorded: `https://<your-render-service>.onrender.com/api`

Redeploy frontend after env update.

## 9. Production Smoke Check

Run post-deploy checks against Cloud Run:

```powershell
.\smoke-check-cloud-run.ps1 -ApiBaseUrl https://<your-cloud-run-service>.run.app -Email <login-email> -Password <login-password> -ForecastItemId 5
```

If you only want health/auth verification initially:

```powershell
.\smoke-check-cloud-run.ps1 -ApiBaseUrl https://<your-cloud-run-service>.run.app -SkipForecast
```

## 10. Manual Failover Runbook (Cloud Run -> Render)

Use this only when Cloud Run has a sustained incident.

1. In Vercel, set:
   - `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api`
2. Trigger Vercel redeploy.
3. Verify health and login.
4. Run targeted checks on key flows (dashboard, inventory, purchases, transactions).

To fail back to Cloud Run after recovery, restore Cloud Run URL and redeploy frontend.

## 11. Rollback on Cloud Run

If a deployment is unhealthy but service itself is reachable:

```powershell
gcloud run revisions list --service $SERVICE_NAME --region $REGION --project $PROJECT_ID
gcloud run services update-traffic $SERVICE_NAME --region $REGION --to-revisions <stable-revision>=100 --project $PROJECT_ID
```

Then run smoke checks again.

## 12. Keep Render as Warm Backup

- Do not remove `render.yaml`.
- Keep Render env variables in sync for DB/auth/OAuth.
- Periodically run backup health checks:
  - `https://<your-render-service>.onrender.com/actuator/health`
- Document the current backup URL in team runbooks.
