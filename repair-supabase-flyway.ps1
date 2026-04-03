[CmdletBinding()]
param(
  [string]$EnvFile = ".env.local",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

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

function Resolve-DbSetting {
  param(
    [string]$PrimaryKey,
    [string]$FallbackKey
  )

  $value = Get-EnvFileValue -FilePath $EnvFile -Key $PrimaryKey
  if (-not $value -and $FallbackKey) {
    $value = Get-EnvFileValue -FilePath $EnvFile -Key $FallbackKey
  }

  if (-not $value -and (Test-Path ".env")) {
    $value = Get-EnvFileValue -FilePath ".env" -Key $PrimaryKey
    if (-not $value -and $FallbackKey) {
      $value = Get-EnvFileValue -FilePath ".env" -Key $FallbackKey
    }
  }

  return $value
}

$dbUrl = Resolve-DbSetting -PrimaryKey "COMPOSE_DB_URL" -FallbackKey "DB_URL"
$dbUser = Resolve-DbSetting -PrimaryKey "COMPOSE_DB_USERNAME" -FallbackKey "DB_USERNAME"
$dbPassword = Resolve-DbSetting -PrimaryKey "COMPOSE_DB_PASSWORD" -FallbackKey "DB_PASSWORD"

if (-not $dbUrl -or -not $dbUser -or -not $dbPassword) {
  throw "Missing Supabase DB settings (URL/username/password)."
}

if (-not $dbUrl.StartsWith("jdbc:postgresql://")) {
  throw "DB URL is not a PostgreSQL JDBC URL."
}

$uri = [Uri]($dbUrl.Substring(5))
$dbHost = $uri.Host
$port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
$database = $uri.AbsolutePath.TrimStart('/')
$sslMode = "require"
if ($uri.Query) {
  foreach ($pair in $uri.Query.TrimStart('?').Split('&', [System.StringSplitOptions]::RemoveEmptyEntries)) {
    $parts = $pair.Split('=', 2)
    if ($parts.Count -eq 2 -and $parts[0].ToLowerInvariant() -eq "sslmode") {
      $sslMode = [Uri]::UnescapeDataString($parts[1])
    }
  }
}

$baseArgs = @(
  "run", "--rm",
  "-e", "PGPASSWORD=$dbPassword",
  "-e", "PGSSLMODE=$sslMode",
  "postgres:16-alpine",
  "psql", "-v", "ON_ERROR_STOP=1",
  "-h", $dbHost,
  "-p", "$port",
  "-U", $dbUser,
  "-d", $database
)

Write-Host "Checking flyway checksums for versions 4 and 5..." -ForegroundColor Yellow
& docker @baseArgs -c "SELECT version, checksum FROM flyway_schema_history WHERE version IN ('4','5') ORDER BY version;"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to query flyway_schema_history in Supabase."
}

if ($DryRun) {
  Write-Host "Dry run complete. No updates were applied." -ForegroundColor Cyan
  exit 0
}

# Resolved local checksum observed from Flyway validation logs for V4 and V5.
$targetChecksum = -262397768
$updateSql = "UPDATE flyway_schema_history SET checksum = $targetChecksum WHERE version IN ('4','5') AND checksum <> $targetChecksum;"

Write-Host "Applying checksum repair for versions 4 and 5..." -ForegroundColor Yellow
& docker @baseArgs -c $updateSql
if ($LASTEXITCODE -ne 0) {
  throw "Failed to update flyway checksums."
}

Write-Host "Post-repair checksum state:" -ForegroundColor Yellow
& docker @baseArgs -c "SELECT version, checksum FROM flyway_schema_history WHERE version IN ('4','5') ORDER BY version;"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to verify flyway checksums after update."
}

Write-Host "Flyway checksum repair completed." -ForegroundColor Green
