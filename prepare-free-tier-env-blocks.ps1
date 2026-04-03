[CmdletBinding()]
param(
  [string]$BackendEnvFile = ".env",
  [string]$BackendServiceUrl = "https://kirana-backend.onrender.com",
  [string]$FrontendUrl = "https://your-app.vercel.app",
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
$backendUrl = Normalize-Url -Url $BackendServiceUrl
$frontendOrigin = Normalize-Url -Url $FrontendUrl

$dbUrl = Get-EnvOrPlaceholder -Map $envMap -Key "DB_URL" -Placeholder "<supabase-jdbc-url>" -HideSecret:$false
$dbUsername = Get-EnvOrPlaceholder -Map $envMap -Key "DB_USERNAME" -Placeholder "postgres.<project-ref>" -HideSecret:$false
$dbPassword = Get-EnvOrPlaceholder -Map $envMap -Key "DB_PASSWORD" -Placeholder "<supabase-db-password>" -HideSecret:$true
$jwtSecret = Get-EnvOrPlaceholder -Map $envMap -Key "JWT_SECRET" -Placeholder "<generate-strong-secret-min-32-chars>" -HideSecret:$true
$googleClientId = Get-EnvOrPlaceholder -Map $envMap -Key "GOOGLE_CLIENT_ID" -Placeholder "<google-oauth-client-id>.apps.googleusercontent.com" -HideSecret:$false

Write-Output "=== Render Backend Environment Variables ==="
Write-Output "SPRING_PROFILES_ACTIVE=prod"
Write-Output "SERVER_PORT=5000"
Write-Output "DB_URL=$dbUrl"
Write-Output "DB_USERNAME=$dbUsername"
Write-Output "DB_PASSWORD=$dbPassword"
Write-Output "JWT_SECRET=$jwtSecret"
Write-Output "ML_SERVICE_URL=http://127.0.0.1:8000"
Write-Output "CORS_ALLOWED_ORIGINS=$frontendOrigin"
Write-Output "ML_ALLOWED_ORIGINS=$frontendOrigin"
Write-Output "GOOGLE_CLIENT_ID=$googleClientId"
Write-Output ""
Write-Output "=== Vercel Frontend Environment Variables ==="
Write-Output "VITE_API_BASE_URL=$backendUrl/api"
Write-Output "VITE_GOOGLE_CLIENT_ID=$googleClientId"
Write-Output ""
Write-Output "Notes:"
Write-Output "- Pass -ShowSecrets only on a trusted machine if you want actual secret values printed."
Write-Output "- Re-run this script after you know final Render/Vercel URLs."
Write-Output "- Keep ML_SERVICE_URL as http://127.0.0.1:8000 for the single-container Render setup."
