[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
  throw ".env not found"
}

if (-not (Test-Path ".env.local")) {
  throw ".env.local not found"
}

$source = Get-Content ".env"
$target = Get-Content ".env.local"

function Get-Val {
  param(
    [string[]]$Lines,
    [string]$Key
  )

  $keyRegex = [Regex]::Escape($Key)
  $line = $Lines | Where-Object { $_ -match "^\s*$keyRegex\s*=" } | Select-Object -First 1
  if (-not $line) {
    return $null
  }

  return ($line -split "=", 2)[1].Trim()
}

$keys = @("DB_URL", "DB_USERNAME", "DB_PASSWORD")

foreach ($key in $keys) {
  $val = Get-Val -Lines $source -Key $key
  if ([string]::IsNullOrWhiteSpace($val)) {
    continue
  }

  $existingIndex = -1
  for ($i = 0; $i -lt $target.Count; $i++) {
    if ($target[$i] -match "^\s*$([Regex]::Escape($key))\s*=") {
      $existingIndex = $i
      break
    }
  }

  $newLine = "$key=$val"
  if ($existingIndex -ge 0) {
    $target[$existingIndex] = $newLine
  }
  else {
    $target += $newLine
  }
}

Set-Content ".env.local" $target -Encoding UTF8
Write-Output "env.local synced from .env for DB_* keys"
