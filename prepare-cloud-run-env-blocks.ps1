[CmdletBinding()]
param(
  [string]$BackendEnvFile = ".env",
  [string]$CloudRunServiceUrl = "https://<your-cloud-run-service>.run.app",
  [string]$RenderBackupServiceUrl = "https://<your-render-service>.onrender.com",
  [string]$FrontendUrl = "https://<your-vercel-domain>",
  [switch]$ShowSecrets
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Load-EnvMap {
  param([string]$FilePath)

  $map = @{}
  if (-not (Test-Path $FilePath)) {
    return $map
  }

  foreach ($line in Get-Content $FilePath) {
    $trimmed = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed)) { continue }
    if ($trimmed.StartsWith("#")) { continue }
    if ($trimmed -notmatch "=") { continue }

    $parts = $trimmed -split "=", 2
    $key = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")

    if (-not [string]::IsNullOrWhiteSpace($key)) {
      $map[$key] = $value
    }
  }

  return $map
}

function Normalize-Url {
  param([string]$Url)

  if ([string]::IsNullOrWhiteSpace($Url)) {
    return $Url
  }

  return $Url.Trim().TrimEnd('/')
}

function Convert-SessionPoolerDbUrl {
  param([string]$Url)

  if ([string]::IsNullOrWhiteSpace($Url)) {
    return $Url
  }

  $urlLower = $Url.ToLowerInvariant()
  if (-not $urlLower.Contains("pooler.supabase.com:5432")) {
    return $Url
  }

  $updated = $Url -replace "pooler\.supabase\.com:5432", "pooler.supabase.com:6543"
  if ($updated.ToLowerInvariant().Contains("preparethreshold=")) {
    return $updated
  }

  if ($updated.Contains("?")) {
    return "$updated&prepareThreshold=0"
  }

  return "$updated?prepareThreshold=0"
}

function Get-EnvOrPlaceholder {
  param(
    [hashtable]$Map,
    [string]$Key,
    [string]$Placeholder,
    [bool]$HideSecret
  )

  if (-not $Map.ContainsKey($Key) -or [string]::IsNullOrWhiteSpace($Map[$Key])) {
    return $Placeholder
  }

  $value = $Map[$Key]
  if ($HideSecret -and -not $ShowSecrets) {
    return "<hidden>"
  }

  return $value
}

$envMap = Load-EnvMap -FilePath $BackendEnvFile
$cloudRunUrl = Normalize-Url -Url $CloudRunServiceUrl
$renderBackupUrl = Normalize-Url -Url $RenderBackupServiceUrl
$frontendOrigin = Normalize-Url -Url $FrontendUrl

$rawDbUrl = Get-EnvOrPlaceholder -Map $envMap -Key "DB_URL" -Placeholder "<supabase-jdbc-url>" -HideSecret:$false
$dbUrl = Convert-SessionPoolerDbUrl -Url $rawDbUrl
$dbUsername = Get-EnvOrPlaceholder -Map $envMap -Key "DB_USERNAME" -Placeholder "postgres.<project-ref>" -HideSecret:$false
$dbPassword = Get-EnvOrPlaceholder -Map $envMap -Key "DB_PASSWORD" -Placeholder "<supabase-db-password>" -HideSecret:$true
$jwtSecret = Get-EnvOrPlaceholder -Map $envMap -Key "JWT_SECRET" -Placeholder "<generate-strong-secret-min-32-chars>" -HideSecret:$true
$googleClientId = Get-EnvOrPlaceholder -Map $envMap -Key "GOOGLE_CLIENT_ID" -Placeholder "<google-oauth-client-id>.apps.googleusercontent.com" -HideSecret:$false

Write-Output "=== Cloud Run Backend Runtime Environment Variables ==="
Write-Output "SPRING_PROFILES_ACTIVE=prod"
Write-Output "DB_URL=$dbUrl"
Write-Output "DB_USERNAME=$dbUsername"
Write-Output "DB_PASSWORD=$dbPassword"
Write-Output "JWT_SECRET=$jwtSecret"
Write-Output "GOOGLE_CLIENT_ID=$googleClientId"
Write-Output "ML_SERVICE_URL=http://127.0.0.1:8000"
Write-Output "ENABLE_ML_SERVICE=true"
Write-Output "DB_MAX_POOL_SIZE=2"
Write-Output "DB_MIN_IDLE=0"
Write-Output "DB_CONNECTION_TIMEOUT_MS=10000"
Write-Output "FLYWAY_CONNECT_RETRIES=20"
Write-Output "JAVA_MAX_RAM_PERCENTAGE=45.0"
Write-Output "JAVA_INITIAL_RAM_PERCENTAGE=10.0"
Write-Output "JAVA_MAX_METASPACE_MB=192"
Write-Output "JAVA_RESERVED_CODE_CACHE_MB=96"
Write-Output "JAVA_THREAD_STACK_KB=512"
Write-Output "CORS_ALLOWED_ORIGINS=$frontendOrigin"
Write-Output "ML_ALLOWED_ORIGINS=$frontendOrigin,$cloudRunUrl,$renderBackupUrl"
Write-Output ""
Write-Output "=== Cloud Run GitHub Variables (repo variables) ==="
Write-Output "GCP_PROJECT_ID=<gcp-project-id>"
Write-Output "CLOUD_RUN_REGION=<gcp-region>"
Write-Output "CLOUD_RUN_SERVICE=kirana-backend"
Write-Output "CLOUD_RUN_IMAGE_REPO=<artifact-registry-repo>"
Write-Output "CLOUD_RUN_CPU=1"
Write-Output "CLOUD_RUN_MEMORY=1Gi"
Write-Output "CLOUD_RUN_TIMEOUT=600"
Write-Output "CLOUD_RUN_MIN_INSTANCES=1"
Write-Output "CLOUD_RUN_MAX_INSTANCES=5"
Write-Output "CLOUD_RUN_CONCURRENCY=80"
Write-Output "CLOUD_RUN_CORS_ALLOWED_ORIGINS=$frontendOrigin"
Write-Output "CLOUD_RUN_ML_ALLOWED_ORIGINS=$frontendOrigin,$cloudRunUrl,$renderBackupUrl"
Write-Output "CLOUD_RUN_DB_MAX_POOL_SIZE=2"
Write-Output "CLOUD_RUN_DB_MIN_IDLE=0"
Write-Output "CLOUD_RUN_DB_CONNECTION_TIMEOUT_MS=10000"
Write-Output "CLOUD_RUN_FLYWAY_CONNECT_RETRIES=20"
Write-Output "CLOUD_RUN_JAVA_MAX_RAM_PERCENTAGE=45.0"
Write-Output "CLOUD_RUN_JAVA_INITIAL_RAM_PERCENTAGE=10.0"
Write-Output "CLOUD_RUN_JAVA_MAX_METASPACE_MB=192"
Write-Output "CLOUD_RUN_JAVA_RESERVED_CODE_CACHE_MB=96"
Write-Output "CLOUD_RUN_JAVA_THREAD_STACK_KB=512"
Write-Output "GCP_SECRET_DB_URL=<secret-name>"
Write-Output "GCP_SECRET_DB_USERNAME=<secret-name>"
Write-Output "GCP_SECRET_DB_PASSWORD=<secret-name>"
Write-Output "GCP_SECRET_JWT_SECRET=<secret-name>"
Write-Output "GCP_SECRET_GOOGLE_CLIENT_ID=<secret-name>"
Write-Output ""
Write-Output "=== Cloud Run GitHub Secrets ==="
Write-Output "GCP_WORKLOAD_IDENTITY_PROVIDER=<projects/.../locations/global/workloadIdentityPools/.../providers/...>"
Write-Output "GCP_SERVICE_ACCOUNT_EMAIL=<deploy-sa@project.iam.gserviceaccount.com>"
Write-Output ""
Write-Output "=== Vercel Frontend Environment Variables ==="
Write-Output "# Primary (Cloud Run)"
Write-Output "VITE_API_BASE_URL=$cloudRunUrl/api"
Write-Output "VITE_GOOGLE_CLIENT_ID=$googleClientId"
Write-Output ""
Write-Output "# Backup switch target (Render)"
Write-Output "# VITE_API_BASE_URL=$renderBackupUrl/api"
Write-Output ""
Write-Output "Notes:"
Write-Output "- Pass -ShowSecrets only on a trusted machine if you want actual secret values printed."
Write-Output "- Keep render.yaml unchanged; Render stays available as backup."
Write-Output "- After switching VITE_API_BASE_URL, trigger a Vercel redeploy to apply runtime target changes."
Write-Output "- CLOUD_RUN_MIN_INSTANCES=1 keeps one instance always warm and adds continuous Cloud Run cost."
Write-Output "- CLOUD_RUN_CONCURRENCY controls per-instance request parallelism; start at 80 and tune with load tests."
if ($dbUrl -ne $rawDbUrl) {
  Write-Output "- DB_URL output was auto-upgraded from session pooler (:5432) to transaction pooler (:6543)."
}
