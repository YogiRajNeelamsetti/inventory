[CmdletBinding()]
param(
  [string]$BackendEnvFile = ".env",
  [string]$FrontendEnvFile = "frontend/.env.production",
  [string]$RenderConfig = "render.yaml",
  [switch]$Strict
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

function Add-Error {
  param([string]$Message)
  $script:errors.Add($Message)
}

function Add-Warning {
  param([string]$Message)
  $script:warnings.Add($Message)
}

function Load-EnvFile {
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

function Test-Placeholder {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) { return $true }

  $v = $Value.ToLowerInvariant()
  if ($v.Contains("<") -or $v.Contains(">")) { return $true }
  if ($v.Contains("your-app") -or $v.Contains("project-ref") -or $v.Contains("replace")) { return $true }
  if ($v.Contains("changeme") -or $v.Contains("example")) { return $true }

  return $false
}

if (-not (Test-Path $BackendEnvFile)) {
  Add-Error "Backend env file not found: $BackendEnvFile"
}

if (-not (Test-Path $RenderConfig)) {
  Add-Error "Render config not found: $RenderConfig"
}

$backendEnv = Load-EnvFile -FilePath $BackendEnvFile
$requiredBackend = @("DB_URL", "DB_USERNAME", "DB_PASSWORD", "JWT_SECRET", "CORS_ALLOWED_ORIGINS", "GOOGLE_CLIENT_ID")

foreach ($key in $requiredBackend) {
  if (-not $backendEnv.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($backendEnv[$key])) {
    Add-Error "Missing backend env key: $key"
  }
}

if ($backendEnv.ContainsKey("DB_URL")) {
  $dbUrl = $backendEnv["DB_URL"]
  $dbUrlLower = $dbUrl.ToLowerInvariant()
  if (-not $dbUrl.StartsWith("jdbc:postgresql://")) {
    Add-Error "DB_URL must be a PostgreSQL JDBC URL"
  }
  if (-not ($dbUrlLower.Contains("pooler.supabase.com") -or $dbUrlLower.Contains(".supabase.co"))) {
    Add-Warning "DB_URL does not look like a Supabase host; verify networking and credentials"
  }
  if ($dbUrlLower.Contains("pooler.supabase.com:5432")) {
    Add-Error "DB_URL is using Supabase session pooler (:5432), which can cause MaxClientsInSessionMode on free tier. Use transaction pooler (:6543) or direct database URL."
  }
  if ($dbUrlLower.Contains("pooler.supabase.com:6543") -and -not $dbUrlLower.Contains("preparethreshold=0")) {
    Add-Warning "DB_URL uses Supabase transaction pooler. Add prepareThreshold=0 to reduce prepared-statement issues."
  }
  if (-not $dbUrlLower.Contains("sslmode=require")) {
    Add-Warning "DB_URL should include sslmode=require"
  }
  if (Test-Placeholder -Value $dbUrl) {
    Add-Error "DB_URL still contains placeholder values"
  }
}

if ($backendEnv.ContainsKey("DB_USERNAME") -and (Test-Placeholder -Value $backendEnv["DB_USERNAME"])) {
  Add-Error "DB_USERNAME still contains placeholder values"
}

if ($backendEnv.ContainsKey("DB_PASSWORD") -and (Test-Placeholder -Value $backendEnv["DB_PASSWORD"])) {
  Add-Error "DB_PASSWORD still contains placeholder values"
}

if ($backendEnv.ContainsKey("JWT_SECRET")) {
  $jwt = $backendEnv["JWT_SECRET"]
  if ($jwt.Length -lt 32) {
    Add-Error "JWT_SECRET must be at least 32 characters"
  }
  if ($jwt.ToLowerInvariant().Contains("secret") -or $jwt.ToLowerInvariant().Contains("jwt")) {
    Add-Warning "JWT_SECRET appears human-readable; use a random value from a secure generator"
  }
}

if ($backendEnv.ContainsKey("CORS_ALLOWED_ORIGINS")) {
  $origins = $backendEnv["CORS_ALLOWED_ORIGINS"] -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ }
  if ($origins.Count -eq 0) {
    Add-Error "CORS_ALLOWED_ORIGINS is empty"
  }

  foreach ($origin in $origins) {
    if ($origin -notmatch "^https://") {
      if ($Strict) {
        Add-Error "CORS origin is not HTTPS: $origin"
      } else {
        Add-Warning "CORS origin is not HTTPS: $origin"
      }
    }
    if (Test-Placeholder -Value $origin) {
      Add-Error "CORS_ALLOWED_ORIGINS contains placeholder: $origin"
    }
  }
}

if ($backendEnv.ContainsKey("GOOGLE_CLIENT_ID")) {
  $googleClientId = $backendEnv["GOOGLE_CLIENT_ID"]
  if (-not $googleClientId.ToLowerInvariant().EndsWith(".apps.googleusercontent.com")) {
    Add-Error "GOOGLE_CLIENT_ID format looks invalid"
  }
  if (Test-Placeholder -Value $googleClientId) {
    Add-Error "GOOGLE_CLIENT_ID still contains placeholder values"
  }
}

if (Test-Path $FrontendEnvFile) {
  $frontendEnv = Load-EnvFile -FilePath $FrontendEnvFile
  foreach ($key in @("VITE_API_BASE_URL", "VITE_GOOGLE_CLIENT_ID")) {
    if (-not $frontendEnv.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($frontendEnv[$key])) {
      Add-Error "Missing frontend env key: $key in $FrontendEnvFile"
    }
  }

  if ($frontendEnv.ContainsKey("VITE_API_BASE_URL") -and (Test-Placeholder -Value $frontendEnv["VITE_API_BASE_URL"])) {
    Add-Error "VITE_API_BASE_URL still contains placeholder values"
  }

  if ($frontendEnv.ContainsKey("VITE_GOOGLE_CLIENT_ID") -and (Test-Placeholder -Value $frontendEnv["VITE_GOOGLE_CLIENT_ID"])) {
    Add-Error "VITE_GOOGLE_CLIENT_ID still contains placeholder values"
  }
} else {
  Add-Warning "Frontend env file not found at $FrontendEnvFile (skip if configuring in Vercel dashboard)"
}

if (Test-Path $RenderConfig) {
  $renderText = Get-Content $RenderConfig -Raw
  if ($renderText -notmatch "(?m)^\s*plan:\s*free\s*$") {
    Add-Warning "Render plan is not explicitly set to free"
  }
  if ($renderText -notmatch "(?m)^\s*healthCheckPath:\s*/actuator/health\s*$") {
    Add-Error "Render healthCheckPath must be /actuator/health"
  }
  if ($renderText -notmatch "(?m)^\s*dockerfilePath:\s*\./backend/Dockerfile\s*$") {
    Add-Error "Render dockerfilePath must point to ./backend/Dockerfile"
  }
}

Write-Output "=== Free-Tier Deployment Validation ==="
Write-Output "backend_env_file=$BackendEnvFile"
Write-Output "frontend_env_file=$FrontendEnvFile"
Write-Output "render_config=$RenderConfig"
Write-Output ""

if ($warnings.Count -gt 0) {
  Write-Output "Warnings:"
  foreach ($warning in $warnings) {
    Write-Output " - $warning"
  }
  Write-Output ""
}

if ($errors.Count -gt 0) {
  Write-Output "Errors:"
  foreach ($err in $errors) {
    Write-Output " - $err"
  }
  Write-Output ""
  Write-Output "validation=FAIL"
  exit 1
}

Write-Output "validation=PASS"
exit 0
