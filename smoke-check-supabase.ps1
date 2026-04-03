[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function New-SmokeAuthHeaders {
  $timestamp = Get-Date -Format "yyyyMMddHHmmss"
  $email = "smoke.$timestamp@example.com"
  $phone = "9" + $timestamp.Substring($timestamp.Length - 9)
  $password = "Strong#Pass12345"

  $registerPayload = @{
    owner_name = "Smoke User"
    business_name = "Smoke Store"
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
    throw "Unable to authenticate via register/login flow"
  }

  return @{ Authorization = "Bearer $($loginResp.data.token)" }
}

$health = Invoke-RestMethod -Uri "http://localhost:5000/actuator/health" -Method GET
if ($health.status -ne "UP") {
  throw "Backend health is not UP"
}

$headers = New-SmokeAuthHeaders

$dashboard = Invoke-RestMethod -Uri "http://localhost:5000/api/dashboard" -Method GET -Headers $headers
if (-not $dashboard.success) {
  throw "Dashboard API failed"
}

$suppliers = Invoke-RestMethod -Uri "http://localhost:5000/api/suppliers" -Method GET -Headers $headers
if (-not $suppliers.success) {
  throw "Suppliers API failed"
}

$forecast = Invoke-RestMethod -Uri "http://localhost:5000/api/forecast/recommendations" -Method GET -Headers $headers
if (-not $forecast.success) {
  throw "Forecast recommendations API failed"
}

$frontend = Invoke-WebRequest -Uri "http://localhost" -Method GET -UseBasicParsing

Write-Output "health=UP"
Write-Output "dashboard_success=true"
Write-Output "suppliers_count=$($suppliers.data.suppliers.Count)"
Write-Output "forecast_success=true"
Write-Output "frontend_http_status=$($frontend.StatusCode)"
Write-Output "smoke_check=PASS"
