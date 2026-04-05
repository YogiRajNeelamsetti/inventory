[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ApiBaseUrl,

  [string]$Email = "",
  [string]$Password = "",
  [string]$GoogleIdToken = "",
  [int]$ForecastItemId = 5,
  [switch]$SkipForecast,
  [switch]$AllowInsecureHttp
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Get-ApiData {
  param([object]$Response)

  if ($null -eq $Response) {
    return $null
  }

  if ($Response.PSObject.Properties.Name -contains "data") {
    return $Response.data
  }

  return $Response
}

function Get-AuthToken {
  param([object]$Response)

  if ($null -eq $Response) {
    return ""
  }

  if ($Response.PSObject.Properties.Name -contains "success") {
    if (-not $Response.success) {
      return ""
    }
  }

  $data = Get-ApiData -Response $Response
  if ($null -ne $data -and $data.PSObject.Properties.Name -contains "token") {
    return [string]$data.token
  }

  if ($Response.PSObject.Properties.Name -contains "token") {
    return [string]$Response.token
  }

  return ""
}

function Ensure-ApiSuccess {
  param(
    [object]$Response,
    [string]$Operation
  )

  if ($null -eq $Response) {
    Fail "$Operation returned an empty response"
  }

  if ($Response.PSObject.Properties.Name -contains "success") {
    if (-not $Response.success) {
      $message = ""
      if ($Response.PSObject.Properties.Name -contains "message") {
        $message = [string]$Response.message
      }
      if ([string]::IsNullOrWhiteSpace($message) -and $Response.PSObject.Properties.Name -contains "error" -and $null -ne $Response.error) {
        if ($Response.error.PSObject.Properties.Name -contains "message") {
          $message = [string]$Response.error.message
        }
      }
      if ([string]::IsNullOrWhiteSpace($message)) {
        $message = "response.success was false"
      }
      Fail "$Operation failed: $message"
    }
  }
}

function Fail {
  param([string]$Message)
  Write-Output "smoke_check=FAIL"
  Write-Output "reason=$Message"
  exit 1
}

function Normalize-Url {
  param([string]$Url)
  if ([string]::IsNullOrWhiteSpace($Url)) { return $Url }
  return $Url.Trim().TrimEnd('/')
}

function Invoke-ApiGet {
  param(
    [string]$Url,
    [hashtable]$Headers
  )

  try {
    return Invoke-RestMethod -Method Get -Uri $Url -Headers $Headers -TimeoutSec 60
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__) {
      $status = $_.Exception.Response.StatusCode.value__
      throw "GET $Url failed with HTTP $status"
    }
    throw
  }
}

function Invoke-ApiPost {
  param(
    [string]$Url,
    [hashtable]$Headers,
    [object]$BodyObject
  )

  $json = $BodyObject | ConvertTo-Json -Depth 10

  try {
    return Invoke-RestMethod -Method Post -Uri $Url -Headers $Headers -Body $json -ContentType "application/json" -TimeoutSec 60
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__) {
      $status = $_.Exception.Response.StatusCode.value__
      throw "POST $Url failed with HTTP $status"
    }
    throw
  }
}

$baseUrl = Normalize-Url -Url $ApiBaseUrl
if ([string]::IsNullOrWhiteSpace($baseUrl)) {
  Fail "ApiBaseUrl is required"
}

if (($baseUrl -notmatch "^https://") -and -not $AllowInsecureHttp) {
  Fail "ApiBaseUrl must use https unless -AllowInsecureHttp is set"
}

Write-Output "=== Cloud Run Smoke Check ==="
Write-Output "api_base_url=$baseUrl"

$healthUrl = "$baseUrl/actuator/health"
$health = $null
try {
  $health = Invoke-ApiGet -Url $healthUrl -Headers @{}
} catch {
  Fail $_
}

$healthJson = $health | ConvertTo-Json -Depth 10 -Compress
Write-Output "health_response=$healthJson"

if (-not $health.status -or $health.status.ToLowerInvariant() -ne "up") {
  Fail "Health endpoint did not return status=UP"
}

$token = ""
if (-not [string]::IsNullOrWhiteSpace($Email) -and -not [string]::IsNullOrWhiteSpace($Password)) {
  Write-Output "auth_mode=email_password"
  $loginUrl = "$baseUrl/api/auth/login"

  try {
    $loginResult = Invoke-ApiPost -Url $loginUrl -Headers @{} -BodyObject @{
      email    = $Email
      password = $Password
    }
  } catch {
    Fail $_
  }

  Ensure-ApiSuccess -Response $loginResult -Operation "Email/password login"

  $token = Get-AuthToken -Response $loginResult
  if ([string]::IsNullOrWhiteSpace($token)) {
    Fail "Login response did not include token"
  }
}
elseif (-not [string]::IsNullOrWhiteSpace($GoogleIdToken)) {
  Write-Output "auth_mode=google_token"
  $googleAuthUrl = "$baseUrl/api/auth/google"

  try {
    $googleResult = Invoke-ApiPost -Url $googleAuthUrl -Headers @{} -BodyObject @{
      token = $GoogleIdToken
    }
  } catch {
    Fail $_
  }

  Ensure-ApiSuccess -Response $googleResult -Operation "Google login"

  $token = Get-AuthToken -Response $googleResult
  if ([string]::IsNullOrWhiteSpace($token)) {
    Fail "Google auth response did not include token"
  }
}
else {
  Write-Output "auth_mode=none"
}

if ($SkipForecast) {
  Write-Output "forecast_check=SKIPPED"
  Write-Output "smoke_check=PASS"
  exit 0
}

if ([string]::IsNullOrWhiteSpace($token)) {
  Fail "Forecast check requires auth token. Provide -Email/-Password or -GoogleIdToken, or use -SkipForecast"
}

$recommendationsUrl = "$baseUrl/api/forecast/recommendations"
$recommendations = $null
try {
  $recommendations = Invoke-ApiGet -Url $recommendationsUrl -Headers @{ Authorization = "Bearer $token" }
} catch {
  Fail $_
}

Ensure-ApiSuccess -Response $recommendations -Operation "Forecast recommendations"

$recommendationsData = Get-ApiData -Response $recommendations
$recommendationsList = $null

if ($null -ne $recommendationsData -and $recommendationsData.PSObject.Properties.Name -contains "recommendations") {
  $recommendationsList = $recommendationsData.recommendations
} elseif ($recommendations.PSObject.Properties.Name -contains "recommendations") {
  $recommendationsList = $recommendations.recommendations
}

if ($null -eq $recommendationsList) {
  Fail "Forecast recommendations response did not include recommendations payload"
}

$recommendationsCount = @($recommendationsList).Count
Write-Output "recommendations_count=$recommendationsCount"

$forecastUrl = "$baseUrl/api/forecast/item/$ForecastItemId"
$forecast = $null
try {
  $forecast = Invoke-ApiGet -Url $forecastUrl -Headers @{ Authorization = "Bearer $token" }
} catch {
  Fail $_
}

Ensure-ApiSuccess -Response $forecast -Operation "Forecast item check"

$forecastData = Get-ApiData -Response $forecast
$decision = $null

if ($null -ne $forecastData -and $forecastData.PSObject.Properties.Name -contains "decision") {
  $decision = $forecastData.decision
} elseif ($forecast.PSObject.Properties.Name -contains "decision") {
  $decision = $forecast.decision
}

if ($null -eq $decision) {
  Fail "Forecast response did not include decision payload"
}

if ($decision.PSObject.Properties.Name -contains "itemId") {
  if ([int]$decision.itemId -ne $ForecastItemId) {
    Fail "Forecast itemId mismatch. expected=$ForecastItemId actual=$($decision.itemId)"
  }
} else {
  Fail "Forecast decision payload did not include itemId"
}

if (-not ($decision.PSObject.Properties.Name -contains "action") -or [string]::IsNullOrWhiteSpace([string]$decision.action)) {
  Fail "Forecast decision payload did not include action"
}

Write-Output "forecast_action=$($decision.action)"

Write-Output "smoke_check=PASS"
exit 0
