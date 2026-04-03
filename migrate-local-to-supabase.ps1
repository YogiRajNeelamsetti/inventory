[CmdletBinding()]
param(
  [string]$SourceHost = "localhost",
  [int]$SourcePort = 5432,
  [string]$SourceDatabase = "kirana_db",
  [string]$SourceUsername = "kirana",
  [string]$SourcePassword = "password123",
  [string]$SourceSchema = "public",
  [string]$SupabaseJdbcUrl = $env:DB_URL,
  [string]$SupabaseUsername = $env:DB_USERNAME,
  [string]$SupabasePassword = $env:DB_PASSWORD,
  [string]$OutputFile = "local-data-export.sql",
  [switch]$SkipTargetTruncate,
  [switch]$KeepDump
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

function Resolve-SupabaseSetting {
  param(
    [string]$CurrentValue,
    [string]$EnvLocalKey
  )

  if (-not [string]::IsNullOrWhiteSpace($CurrentValue)) {
    return $CurrentValue
  }

  $fromLocal = Get-EnvFileValue -FilePath ".env.local" -Key $EnvLocalKey
  if (-not [string]::IsNullOrWhiteSpace($fromLocal)) {
    return $fromLocal
  }

  $fromEnv = Get-EnvFileValue -FilePath ".env" -Key $EnvLocalKey
  return $fromEnv
}

function Parse-JdbcUrl {
  param([string]$JdbcUrl)

  if ([string]::IsNullOrWhiteSpace($JdbcUrl) -or -not $JdbcUrl.StartsWith("jdbc:postgresql://")) {
    throw "Supabase JDBC URL must start with jdbc:postgresql://"
  }

  $uri = [Uri]($JdbcUrl.Substring(5))
  if (-not $uri.Host) {
    throw "Unable to parse host from Supabase JDBC URL."
  }

  $database = $uri.AbsolutePath.TrimStart('/')
  if ([string]::IsNullOrWhiteSpace($database)) {
    throw "Unable to parse database name from Supabase JDBC URL."
  }

  $sslMode = "require"
  if ($uri.Query) {
    $query = $uri.Query.TrimStart('?').Split('&', [System.StringSplitOptions]::RemoveEmptyEntries)
    foreach ($pair in $query) {
      $parts = $pair.Split('=', 2)
      if ($parts.Count -eq 2 -and $parts[0].ToLowerInvariant() -eq "sslmode") {
        $sslMode = [Uri]::UnescapeDataString($parts[1])
      }
    }
  }

  return [PSCustomObject]@{
    Host = $uri.Host
    Port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
    Database = $database
    SslMode = $sslMode
  }
}

function Invoke-PostgresCommand {
  param(
    [string]$Password,
    [string]$SslMode,
    [string[]]$CommandArgs
  )

  $args = @("run", "--rm", "-e", "PGPASSWORD=$Password")
  if (-not [string]::IsNullOrWhiteSpace($SslMode)) {
    $args += @("-e", "PGSSLMODE=$SslMode")
  }
  $args += @("postgres:16-alpine")
  $args += $CommandArgs

  & docker @args
  return $LASTEXITCODE
}

$SupabaseJdbcUrl = Resolve-SupabaseSetting -CurrentValue $SupabaseJdbcUrl -EnvLocalKey "COMPOSE_DB_URL"
$SupabaseUsername = Resolve-SupabaseSetting -CurrentValue $SupabaseUsername -EnvLocalKey "COMPOSE_DB_USERNAME"
$SupabasePassword = Resolve-SupabaseSetting -CurrentValue $SupabasePassword -EnvLocalKey "COMPOSE_DB_PASSWORD"

if ([string]::IsNullOrWhiteSpace($SupabaseJdbcUrl) -or [string]::IsNullOrWhiteSpace($SupabaseUsername) -or [string]::IsNullOrWhiteSpace($SupabasePassword)) {
  throw "Missing Supabase settings. Provide DB_URL/DB_USERNAME/DB_PASSWORD or COMPOSE_DB_URL/COMPOSE_DB_USERNAME/COMPOSE_DB_PASSWORD in .env.local."
}

if ($SupabaseJdbcUrl -match "<region>|<project-ref>|<supabase-db-password>" -or $SupabaseUsername -match "<project-ref>" -or $SupabasePassword -match "<supabase-db-password>") {
  throw "Supabase settings still contain placeholders. Replace them with real values before running migration."
}

$target = Parse-JdbcUrl -JdbcUrl $SupabaseJdbcUrl
$dumpPath = Join-Path $PSScriptRoot $OutputFile

Write-Host "=== Kirana Local PostgreSQL -> Supabase Migration ===" -ForegroundColor Cyan
Write-Host "Source: $SourceHost`:$SourcePort/$SourceDatabase ($SourceSchema schema)" -ForegroundColor White
Write-Host "Target: $($target.Host):$($target.Port)/$($target.Database) (sslmode=$($target.SslMode))" -ForegroundColor White

Write-Host "\n[1/4] Exporting local data..." -ForegroundColor Yellow
$dumpArgs = @(
  "run", "--rm", "-e", "PGPASSWORD=$SourcePassword", "postgres:16-alpine",
  "pg_dump", "--data-only", "--no-owner", "--no-privileges", "--column-inserts",
  "--schema=$SourceSchema",
  "-h", $SourceHost,
  "-p", "$SourcePort",
  "-U", $SourceUsername,
  "-d", $SourceDatabase
)

& docker @dumpArgs > $dumpPath
if ($LASTEXITCODE -ne 0) {
  throw "Failed to export local data. Ensure local PostgreSQL is reachable and credentials are correct."
}

if (-not (Test-Path $dumpPath) -or (Get-Item $dumpPath).Length -eq 0) {
  throw "Data export produced an empty dump file: $dumpPath"
}

Write-Host "[2/4] Verifying Supabase schema (Flyway baseline)..." -ForegroundColor Yellow
$schemaCheckSql = "SELECT to_regclass('public.flyway_schema_history') IS NOT NULL;"
$checkArgs = @(
  "psql", "-tA",
  "-h", $target.Host,
  "-p", "$($target.Port)",
  "-U", $SupabaseUsername,
  "-d", $target.Database,
  "-c", $schemaCheckSql
)

$schemaResult = & docker run --rm -e "PGPASSWORD=$SupabasePassword" -e "PGSSLMODE=$($target.SslMode)" postgres:16-alpine @checkArgs
if ($LASTEXITCODE -ne 0) {
  throw "Failed to connect to Supabase target. Verify JDBC URL/username/password and network access."
}

if ($schemaResult.Trim().ToLowerInvariant() -ne "t") {
  throw "Supabase schema is not ready. Start backend once against Supabase so Flyway creates baseline schema, then rerun this script."
}

if (-not $SkipTargetTruncate) {
  Write-Host "[3/4] Truncating target tables (except flyway history)..." -ForegroundColor Yellow
  $truncateSql = "SELECT 'TRUNCATE TABLE ' || string_agg(format('%I.%I', schemaname, tablename), ', ') || ' RESTART IDENTITY CASCADE;' FROM pg_tables WHERE schemaname='public' AND tablename <> 'flyway_schema_history';"
  $truncateCommand = & docker run --rm -e "PGPASSWORD=$SupabasePassword" -e "PGSSLMODE=$($target.SslMode)" postgres:16-alpine psql -tA -h $target.Host -p "$($target.Port)" -U $SupabaseUsername -d $target.Database -c $truncateSql
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to build target truncate statement."
  }

  $truncateCommand = $truncateCommand.Trim()
  if (-not [string]::IsNullOrWhiteSpace($truncateCommand)) {
    $truncateExit = Invoke-PostgresCommand -Password $SupabasePassword -SslMode $target.SslMode -CommandArgs @(
      "psql", "-v", "ON_ERROR_STOP=1",
      "-h", $target.Host,
      "-p", "$($target.Port)",
      "-U", $SupabaseUsername,
      "-d", $target.Database,
      "-c", $truncateCommand
    )
    if ($truncateExit -ne 0) {
      throw "Failed to truncate target tables."
    }
  }
} else {
  Write-Host "[3/4] SkipTargetTruncate enabled. Existing Supabase data will be kept." -ForegroundColor Yellow
}

Write-Host "[4/4] Importing dump into Supabase..." -ForegroundColor Yellow
$workspaceMount = "$PSScriptRoot:/workspace"
$importArgs = @(
  "run", "--rm",
  "-e", "PGPASSWORD=$SupabasePassword",
  "-e", "PGSSLMODE=$($target.SslMode)",
  "-v", $workspaceMount,
  "-w", "/workspace",
  "postgres:16-alpine",
  "psql", "-v", "ON_ERROR_STOP=1",
  "-h", $target.Host,
  "-p", "$($target.Port)",
  "-U", $SupabaseUsername,
  "-d", $target.Database,
  "-f", $OutputFile
)

& docker @importArgs
if ($LASTEXITCODE -ne 0) {
  throw "Failed to import dump into Supabase."
}

if (-not $KeepDump -and (Test-Path $dumpPath)) {
  Remove-Item $dumpPath -Force
}

Write-Host "\nMigration completed successfully." -ForegroundColor Green
Write-Host "Next: run smoke tests (auth, items, sales, purchases, forecast endpoints)." -ForegroundColor Green
