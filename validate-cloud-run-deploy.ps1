[CmdletBinding()]
param(
  [string]$BackendEnvFile = ".env",
  [string]$FrontendEnvFile = "frontend/.env.vercel.example",
  [string]$CloudRunServiceUrl = "https://<your-cloud-run-service>.run.app",
  [string]$RenderBackupServiceUrl = "https://<your-render-service>.onrender.com",
  [string]$ProjectId = "",
  [string]$Region = "",
  [string]$ServiceName = "kirana-backend",
  [string]$CloudRunMinInstances = "",
  [string]$CloudRunMaxInstances = "",
  [string]$CloudRunConcurrency = "",
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
  if ($v.Contains("your-") -or $v.Contains("project-ref") -or $v.Contains("replace")) { return $true }
  if ($v.Contains("changeme") -or $v.Contains("example")) { return $true }

  return $false
}

function Normalize-Url {
  param([string]$Url)
  if ([string]::IsNullOrWhiteSpace($Url)) { return $Url }
  return $Url.Trim().TrimEnd('/')
}

if (-not (Test-Path $BackendEnvFile)) {
  Add-Error "Backend env file not found: $BackendEnvFile"
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

  if (-not $dbUrlLower.Contains("sslmode=require")) {
    Add-Warning "DB_URL should include sslmode=require"
  }

  if ($dbUrlLower.Contains("pooler.supabase.com:5432")) {
    Add-Warning "DB_URL uses session pooler (:5432). Transaction pooler (:6543) is recommended for production concurrency."
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

$cloudRunUrl = Normalize-Url -Url $CloudRunServiceUrl
$renderUrl = Normalize-Url -Url $RenderBackupServiceUrl

if (Test-Placeholder -Value $cloudRunUrl) {
  Add-Error "CloudRunServiceUrl still contains placeholder values"
} elseif ($cloudRunUrl -notmatch "^https://") {
  Add-Error "CloudRunServiceUrl must use https"
} elseif ($cloudRunUrl -notmatch "\.run\.app$") {
  Add-Warning "CloudRunServiceUrl does not end with .run.app (custom domains are allowed, verify DNS and cert)"
}

if (Test-Placeholder -Value $renderUrl) {
  Add-Warning "RenderBackupServiceUrl still contains placeholder values"
} elseif ($renderUrl -notmatch "^https://") {
  Add-Error "RenderBackupServiceUrl must use https"
}

if ([string]::IsNullOrWhiteSpace($ProjectId)) {
  if ($Strict) {
    Add-Error "ProjectId is required in strict mode"
  } else {
    Add-Warning "ProjectId not provided; ensure GCP project is configured in GitHub variables"
  }
}

if ([string]::IsNullOrWhiteSpace($Region)) {
  if ($Strict) {
    Add-Error "Region is required in strict mode"
  } else {
    Add-Warning "Region not provided; ensure CLOUD_RUN_REGION is configured"
  }
}

if ([string]::IsNullOrWhiteSpace($ServiceName) -or (Test-Placeholder -Value $ServiceName)) {
  Add-Error "ServiceName is missing or placeholder"
}

$minInstances = $null
$maxInstances = $null
$concurrency = $null

if ([string]::IsNullOrWhiteSpace($CloudRunMinInstances)) {
  if ($Strict) {
    Add-Error "CloudRunMinInstances is required in strict mode"
  } else {
    Add-Warning "CloudRunMinInstances not provided; set CLOUD_RUN_MIN_INSTANCES in GitHub variables"
  }
} elseif ($CloudRunMinInstances -notmatch "^\d+$") {
  Add-Error "CloudRunMinInstances must be a non-negative integer"
} else {
  $minInstances = [int]$CloudRunMinInstances
  if ($Strict -and $minInstances -lt 1) {
    Add-Error "CloudRunMinInstances must be at least 1 in strict mode to keep Cloud Run warm"
  }
}

if ([string]::IsNullOrWhiteSpace($CloudRunMaxInstances)) {
  if ($Strict) {
    Add-Error "CloudRunMaxInstances is required in strict mode"
  } else {
    Add-Warning "CloudRunMaxInstances not provided; set CLOUD_RUN_MAX_INSTANCES in GitHub variables"
  }
} elseif ($CloudRunMaxInstances -notmatch "^\d+$") {
  Add-Error "CloudRunMaxInstances must be a non-negative integer"
} else {
  $maxInstances = [int]$CloudRunMaxInstances
}

if ($null -ne $minInstances -and $null -ne $maxInstances -and $maxInstances -lt $minInstances) {
  Add-Error "CloudRunMaxInstances must be greater than or equal to CloudRunMinInstances"
}

if ([string]::IsNullOrWhiteSpace($CloudRunConcurrency)) {
  if ($Strict) {
    Add-Error "CloudRunConcurrency is required in strict mode"
  } else {
    Add-Warning "CloudRunConcurrency not provided; set CLOUD_RUN_CONCURRENCY in GitHub variables"
  }
} elseif ($CloudRunConcurrency -notmatch "^\d+$") {
  Add-Error "CloudRunConcurrency must be a positive integer"
} else {
  $concurrency = [int]$CloudRunConcurrency
  if ($concurrency -lt 1 -or $concurrency -gt 1000) {
    Add-Error "CloudRunConcurrency must be between 1 and 1000"
  }
}

if (Test-Path $FrontendEnvFile) {
  $frontendEnv = Load-EnvFile -FilePath $FrontendEnvFile

  if (-not $frontendEnv.ContainsKey("VITE_API_BASE_URL")) {
    Add-Error "Missing VITE_API_BASE_URL in $FrontendEnvFile"
  } else {
    $apiBase = $frontendEnv["VITE_API_BASE_URL"]
    if (Test-Placeholder -Value $apiBase) {
      Add-Warning "VITE_API_BASE_URL in $FrontendEnvFile still uses placeholder values"
    }
  }

  if (-not $frontendEnv.ContainsKey("VITE_GOOGLE_CLIENT_ID")) {
    Add-Error "Missing VITE_GOOGLE_CLIENT_ID in $FrontendEnvFile"
  }
} else {
  Add-Warning "Frontend env template not found at $FrontendEnvFile"
}

Write-Output "=== Cloud Run Deployment Validation ==="
Write-Output "backend_env_file=$BackendEnvFile"
Write-Output "frontend_env_file=$FrontendEnvFile"
Write-Output "cloud_run_url=$cloudRunUrl"
Write-Output "render_backup_url=$renderUrl"
Write-Output "project_id=$ProjectId"
Write-Output "region=$Region"
Write-Output "service_name=$ServiceName"
Write-Output "cloud_run_min_instances=$CloudRunMinInstances"
Write-Output "cloud_run_max_instances=$CloudRunMaxInstances"
Write-Output "cloud_run_concurrency=$CloudRunConcurrency"
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
