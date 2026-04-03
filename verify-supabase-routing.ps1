[CmdletBinding()]
param(
  [string]$EnvFile = ".env.local"
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

if (-not (Test-Path $EnvFile)) {
  throw "Environment file not found: $EnvFile"
}

function New-ProbeAuthHeaders {
  $timestamp = Get-Date -Format "yyyyMMddHHmmss"
  $email = "probe.$timestamp@example.com"
  $phone = "9" + $timestamp.Substring($timestamp.Length - 9)
  $password = "Strong#Pass12345"

  $registerPayload = @{
    owner_name = "Probe User"
    business_name = "Probe Store"
    email = $email
    phone_number = $phone
    password = $password
  } | ConvertTo-Json

  $null = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body $registerPayload

  $loginPayload = @{
    email = $email
    password = $password
  } | ConvertTo-Json

  $loginResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginPayload
  if (-not $loginResp.success -or -not $loginResp.data.token) {
    throw "Unable to authenticate probe user via register/login"
  }

  return @{ Authorization = "Bearer $($loginResp.data.token)"; "Content-Type" = "application/json" }
}

$baseUrl = "http://localhost:5000/api"
$headers = New-ProbeAuthHeaders

$probeName = "SUPABASE-PROBE-$(Get-Date -Format yyyyMMddHHmmss)"
$probeEmail = "probe.$((Get-Date).ToString('yyyyMMddHHmmss'))@example.com"
$payload = @{
  company_name = $probeName
  contact_person = "Probe User"
  phone = "9898989898"
  email = $probeEmail
  address = "Probe Address"
  gst_number = "36PROBE$((Get-Date).ToString('HHmmss'))"
} | ConvertTo-Json

$createResp = Invoke-RestMethod -Uri "$baseUrl/suppliers" -Method POST -Headers $headers -Body $payload
if (-not $createResp.success) {
  throw "Failed to create probe supplier via API."
}

$localCount = "N/A"
$localDbContainerRaw = & docker compose --env-file $EnvFile --profile localdb ps -q db
$localDbContainerId = ($localDbContainerRaw | Select-Object -First 1)
if ($localDbContainerId) {
  $localDbContainerId = $localDbContainerId.ToString().Trim()
} else {
  $localDbContainerId = ""
}
if (-not [string]::IsNullOrWhiteSpace($localDbContainerId)) {
  $localDbName = Get-EnvFileValue -FilePath $EnvFile -Key "COMPOSE_DB_NAME"
  if (-not $localDbName) { $localDbName = "kirana_db" }

  $localDbUser = Get-EnvFileValue -FilePath $EnvFile -Key "COMPOSE_LOCAL_DB_USERNAME"
  if (-not $localDbUser) { $localDbUser = "kirana" }

  $localDbPassword = Get-EnvFileValue -FilePath $EnvFile -Key "COMPOSE_LOCAL_DB_PASSWORD"
  if (-not $localDbPassword) { $localDbPassword = "password123" }

  $localQuery = "SELECT COUNT(*) FROM suppliers WHERE company_name = '$probeName';"
  $localCount = (& docker compose --env-file $EnvFile --profile localdb exec -T -e "PGPASSWORD=$localDbPassword" db psql -tA -U $localDbUser -d $localDbName -c $localQuery).Trim()
}

$supabaseJdbc = Get-EnvFileValue -FilePath $EnvFile -Key "COMPOSE_DB_URL"
if (-not $supabaseJdbc) { $supabaseJdbc = Get-EnvFileValue -FilePath $EnvFile -Key "DB_URL" }

$supabaseUser = Get-EnvFileValue -FilePath $EnvFile -Key "COMPOSE_DB_USERNAME"
if (-not $supabaseUser) { $supabaseUser = Get-EnvFileValue -FilePath $EnvFile -Key "DB_USERNAME" }

$supabasePassword = Get-EnvFileValue -FilePath $EnvFile -Key "COMPOSE_DB_PASSWORD"
if (-not $supabasePassword) { $supabasePassword = Get-EnvFileValue -FilePath $EnvFile -Key "DB_PASSWORD" }

if ([string]::IsNullOrWhiteSpace($supabaseJdbc) -or -not $supabaseJdbc.StartsWith("jdbc:postgresql://")) {
  throw "Supabase JDBC URL is missing or invalid in $EnvFile"
}

if ([string]::IsNullOrWhiteSpace($supabaseUser) -or [string]::IsNullOrWhiteSpace($supabasePassword)) {
  throw "Supabase credentials are missing in $EnvFile"
}

$uri = [Uri]($supabaseJdbc.Substring(5))
$targetHost = $uri.Host
$targetPort = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
$targetDb = $uri.AbsolutePath.TrimStart('/')
$sslMode = "require"
if ($uri.Query) {
  foreach ($pair in $uri.Query.TrimStart('?').Split('&', [System.StringSplitOptions]::RemoveEmptyEntries)) {
    $parts = $pair.Split('=', 2)
    if ($parts.Count -eq 2 -and $parts[0].ToLowerInvariant() -eq "sslmode") {
      $sslMode = [Uri]::UnescapeDataString($parts[1])
    }
  }
}

$supabaseQuery = "SELECT COUNT(*) FROM suppliers WHERE company_name = '$probeName';"
$supabaseCount = (& docker run --rm -e "PGPASSWORD=$supabasePassword" -e "PGSSLMODE=$sslMode" postgres:16-alpine psql -tA -h $targetHost -p "$targetPort" -U $supabaseUser -d $targetDb -c $supabaseQuery).Trim()

Write-Output "probe_name=$probeName"
Write-Output "api_create_success=true"
Write-Output "local_db_count=$localCount"
Write-Output "supabase_count=$supabaseCount"

if ($supabaseCount -eq "1" -and ($localCount -eq "N/A" -or $localCount -eq "0")) {
  Write-Output "routing_verification=PASS"
  exit 0
}

Write-Output "routing_verification=CHECK_REQUIRED"
exit 2
