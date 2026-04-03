[CmdletBinding()]
param(
  [switch]$ResetData,
  [switch]$UseLocalDb,
  [switch]$SkipBuild,
  [int]$WaitSeconds = 120
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env.local")) {
  Write-Error "Missing .env.local. Copy .env.local.example to .env.local first."
}

# Prevent stale shell overrides from taking precedence over --env-file values.
Remove-Item Env:COMPOSE_DB_NAME,Env:COMPOSE_DB_URL,Env:COMPOSE_DB_USERNAME,Env:COMPOSE_DB_PASSWORD,Env:COMPOSE_LOCAL_DB_USERNAME,Env:COMPOSE_LOCAL_DB_PASSWORD,Env:COMPOSE_JWT_SECRET,Env:COMPOSE_CORS_ALLOWED_ORIGINS,Env:COMPOSE_GOOGLE_CLIENT_ID -ErrorAction SilentlyContinue
Remove-Item Env:DB_URL,Env:DB_USERNAME,Env:DB_PASSWORD,Env:JWT_SECRET,Env:CORS_ALLOWED_ORIGINS,Env:GOOGLE_CLIENT_ID -ErrorAction SilentlyContinue

function Get-EnvFileValue {
  param(
    [string]$FilePath,
    [string]$Key
  )

  if (-not (Test-Path $FilePath)) {
    return $null
  }

  $keyRegex = [Regex]::Escape($Key)
  $line = Get-Content $FilePath | Where-Object { $_ -match "^\s*$keyRegex\s*=" } | Select-Object -First 1
  if (-not $line) {
    return $null
  }

  $value = ($line -split "=", 2)[1].Trim()
  return $value.Trim('"').Trim("'")
}

$composeArgs = @("compose", "--env-file", ".env.local")

$composeDbUrl = Get-EnvFileValue -FilePath ".env.local" -Key "COMPOSE_DB_URL"
if ([string]::IsNullOrWhiteSpace($composeDbUrl)) {
  $composeDbUrl = Get-EnvFileValue -FilePath ".env.local" -Key "DB_URL"
}

$composeDbUsername = Get-EnvFileValue -FilePath ".env.local" -Key "COMPOSE_DB_USERNAME"
if ([string]::IsNullOrWhiteSpace($composeDbUsername)) {
  $composeDbUsername = Get-EnvFileValue -FilePath ".env.local" -Key "DB_USERNAME"
}

$composeDbPassword = Get-EnvFileValue -FilePath ".env.local" -Key "COMPOSE_DB_PASSWORD"
if ([string]::IsNullOrWhiteSpace($composeDbPassword)) {
  $composeDbPassword = Get-EnvFileValue -FilePath ".env.local" -Key "DB_PASSWORD"
}

if (-not [string]::IsNullOrWhiteSpace($composeDbUrl)) {
  $env:COMPOSE_DB_URL = $composeDbUrl
}
if (-not [string]::IsNullOrWhiteSpace($composeDbUsername)) {
  $env:COMPOSE_DB_USERNAME = $composeDbUsername
}
if (-not [string]::IsNullOrWhiteSpace($composeDbPassword)) {
  $env:COMPOSE_DB_PASSWORD = $composeDbPassword
}

if ($UseLocalDb) {
  $composeArgs += @("--profile", "localdb")
  Write-Host "Using local PostgreSQL fallback profile (localdb)." -ForegroundColor Yellow
} else {
  Write-Host "Using Supabase-first database configuration from .env.local." -ForegroundColor Cyan
  if ([string]::IsNullOrWhiteSpace($composeDbUrl) -or $composeDbUrl -match "<region>|<project-ref>|<supabase-db-password>") {
    throw "COMPOSE_DB_URL in .env.local is not configured for Supabase yet. Set real Supabase values or run with -UseLocalDb for local fallback."
  }
}

function Start-LocalCompose {
  param([bool]$PurgeVolume)

  if (-not $UseLocalDb) {
    # Ensure leftover fallback-only services are stopped when running Supabase mode.
    docker compose --env-file .env.local --profile localdb down --remove-orphans | Out-Null
  }

  if ($PurgeVolume) {
    docker @composeArgs down -v --remove-orphans
  } else {
    docker @composeArgs down --remove-orphans
  }

  if ($SkipBuild) {
    docker @composeArgs up -d
  } else {
    docker @composeArgs up --build -d
  }
}

function Wait-ServiceHealth {
  param(
    [string]$Service,
    [int]$TimeoutSeconds
  )

  $start = Get-Date
  while (((Get-Date) - $start).TotalSeconds -lt $TimeoutSeconds) {
    $serviceId = docker @composeArgs ps -q $Service
    if (-not [string]::IsNullOrWhiteSpace($serviceId)) {
      $status = docker inspect -f "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}" $serviceId
      if ($status -eq "healthy") {
        return "healthy"
      }
      if ($status -eq "unhealthy" -or $status -eq "exited") {
        return $status
      }
    }
    Start-Sleep -Seconds 2
  }
  return "timeout"
}

function Show-BackendLogs {
  docker @composeArgs logs backend --tail 200
}

function Show-FrontendLogs {
  docker @composeArgs logs frontend --tail 120
}

$didResetRetry = $false
Start-LocalCompose -PurgeVolume:$ResetData
$backendState = Wait-ServiceHealth -Service "backend" -TimeoutSeconds $WaitSeconds

if ($backendState -ne "healthy") {
  $backendLogs = Show-BackendLogs | Out-String

  if (-not $ResetData -and $backendLogs -match "Migration checksum mismatch" -and -not $didResetRetry) {
    Write-Host "Detected Flyway checksum mismatch in local volume. Retrying with a local volume reset..." -ForegroundColor Yellow
    $didResetRetry = $true
    Start-LocalCompose -PurgeVolume:$true
    $backendState = Wait-ServiceHealth -Service "backend" -TimeoutSeconds $WaitSeconds
    if ($backendState -ne "healthy") {
      Show-BackendLogs
      throw "Backend is not healthy after retry with reset."
    }
  } else {
    Write-Host "Backend failed to become healthy. Recent logs:" -ForegroundColor Red
    Write-Host $backendLogs
    throw "Backend is not healthy ($backendState)."
  }
}

$frontendState = Wait-ServiceHealth -Service "frontend" -TimeoutSeconds $WaitSeconds
if ($frontendState -ne "healthy") {
  Show-FrontendLogs
  throw "Frontend is not healthy ($frontendState)."
}

docker @composeArgs ps
