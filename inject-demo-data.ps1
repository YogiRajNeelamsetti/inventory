[CmdletBinding()]
param(
  [string]$DataFile = "demo-data.sql",
  [string]$ComposeEnvFile = ".env.local"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Get-EnvFileValue {
  param(
    [string]$FilePath,
    [string]$Key
  )

  if (-not $FilePath -or -not (Test-Path $FilePath)) {
    return $null
  }

  $keyRegex = [Regex]::Escape($Key)
  $line = Get-Content $FilePath | Where-Object { $_ -match "^\s*$keyRegex\s*=" } | Select-Object -First 1

  if (-not $line) {
    return $null
  }

  $value = ($line -split "=", 2)[1].Trim()
  $value = $value.Trim('"')
  $value = $value.Trim("'")
  return $value
}

if (-not (Test-Path $DataFile)) {
  throw "Demo data file not found: $DataFile"
}

$dataFilePath = (Resolve-Path $DataFile).Path

$composeArgs = @("compose")
if ($ComposeEnvFile -and (Test-Path $ComposeEnvFile)) {
  $composeArgs += @("--env-file", $ComposeEnvFile)
  Write-Host "Using compose env file: $ComposeEnvFile" -ForegroundColor DarkGray
}

$dbName = $env:COMPOSE_DB_NAME
if (-not $dbName) { $dbName = Get-EnvFileValue -FilePath $ComposeEnvFile -Key "COMPOSE_DB_NAME" }
if (-not $dbName) { $dbName = "kirana_db" }

$dbUser = $env:COMPOSE_DB_USERNAME
if (-not $dbUser) { $dbUser = Get-EnvFileValue -FilePath $ComposeEnvFile -Key "COMPOSE_DB_USERNAME" }
if (-not $dbUser) { $dbUser = "kirana" }

$dbPassword = $env:COMPOSE_DB_PASSWORD
if (-not $dbPassword) { $dbPassword = Get-EnvFileValue -FilePath $ComposeEnvFile -Key "COMPOSE_DB_PASSWORD" }
if (-not $dbPassword) { $dbPassword = "password123" }

Write-Host "\n========================================" -ForegroundColor Cyan
Write-Host "  Kirana Shop - Demo Data Injector" -ForegroundColor Cyan
Write-Host "========================================\n" -ForegroundColor Cyan

Write-Host "Checking database service..." -ForegroundColor Yellow
$dbContainerId = (& docker @composeArgs ps -q db | Select-Object -First 1).Trim()
if ([string]::IsNullOrWhiteSpace($dbContainerId)) {
  throw "Database service 'db' is not running. Start it first with: docker compose --profile localdb up --build -d"
}

$copiedToContainer = $false

try {
  Write-Host "Copying demo data file into db container..." -ForegroundColor Yellow
  & docker cp $dataFilePath "${dbContainerId}:/tmp/demo-data.sql"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to copy demo data file into db container."
  }
  $copiedToContainer = $true

  Write-Host "Injecting demo data (this will reset and re-seed data)..." -ForegroundColor Yellow
  & docker @composeArgs exec -T -e "PGPASSWORD=$dbPassword" db psql -v ON_ERROR_STOP=1 -U $dbUser -d $dbName -f /tmp/demo-data.sql
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to apply demo dataset."
  }

  $itemsCount = (& docker @composeArgs exec -T -e "PGPASSWORD=$dbPassword" db psql -U $dbUser -d $dbName -At -c "SELECT COUNT(*) FROM items;").Trim()
  $salesCount = (& docker @composeArgs exec -T -e "PGPASSWORD=$dbPassword" db psql -U $dbUser -d $dbName -At -c "SELECT COUNT(*) FROM sales;").Trim()
  $saleItemsCount = (& docker @composeArgs exec -T -e "PGPASSWORD=$dbPassword" db psql -U $dbUser -d $dbName -At -c "SELECT COUNT(*) FROM sale_items;").Trim()

  Write-Host "\nDemo dataset loaded successfully." -ForegroundColor Green
  Write-Host "  - Items: $itemsCount" -ForegroundColor Green
  Write-Host "  - Sales: $salesCount" -ForegroundColor Green
  Write-Host "  - Sale Items: $saleItemsCount" -ForegroundColor Green
  Write-Host "\nDemo login credentials:" -ForegroundColor Cyan
  Write-Host "  - Email:    rajesh@example.com" -ForegroundColor Cyan
  Write-Host "  - Password: password123" -ForegroundColor Cyan
  Write-Host "\nYou can now open http://localhost and test frontend + ML analytics." -ForegroundColor Green
}
finally {
  if ($copiedToContainer) {
    & docker @composeArgs exec -T db rm -f /tmp/demo-data.sql > $null 2>&1
  }
}
