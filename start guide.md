# Start Guide

This guide gives you a clean, repeatable way to run the full project on Windows PowerShell.

## 1) Open project folder

```powershell
Set-Location "E:\inventory-management-system-main"
```

## 2) Kill other running PowerShell terminals (optional but recommended)

```powershell
Get-Process -Name pwsh -ErrorAction SilentlyContinue |
  Where-Object { $_.Id -ne $PID } |
  Stop-Process -Force -ErrorAction SilentlyContinue
```

## 3) Create local env file (first time only)

```powershell
Copy-Item .env.local.example .env.local
```

## 4) Fresh full start (build + run all services)

```powershell
.\start-local.ps1
```

## 5) Check container status

```powershell
docker compose --env-file .env.local ps
```

Expected: `backend`, `frontend`, and `db` should become `healthy`.

## 6) Check backend health endpoint

```powershell
$h = (Invoke-WebRequest -Uri "http://localhost:5000/actuator/health" -TimeoutSec 20).Content
[System.Text.Encoding]::UTF8.GetString($h)
```

Expected output:

```json
{"status":"UP"}
```

## 7) Access app

- Frontend: http://localhost
- Backend: http://localhost:5000

## 8) Useful logs

```powershell
docker compose --env-file .env.local logs -f backend
docker compose --env-file .env.local logs -f frontend
docker compose --env-file .env.local logs -f db
```

## 9) Quick API smoke test (register + protected call)

Note: request fields use `snake_case`.

```powershell
$ts=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$email="supa$ts@example.com"
$phone='9'+(Get-Random -Minimum 100000000 -Maximum 999999999)

$body=@{
  email=$email
  password='SupaPass123!'
  owner_name='Supa Owner'
  business_name='Supa Store'
  phone_number=$phone
  address='Test Address'
  gst_number=''
  business_type='kirana'
} | ConvertTo-Json

$reg=Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method Post -ContentType 'application/json' -Body $body
$token=$reg.data.token
$items=Invoke-RestMethod -Uri 'http://localhost:5000/api/items' -Headers @{ Authorization = "Bearer $token" }

"REGISTER_OK=$($reg.success)"
"ITEMS_OK=$($items.success)"
```

## 10) Stop project

```powershell
docker compose --env-file .env.local down
```

## 11) Stop and remove volumes (full reset)

```powershell
.\start-local.ps1 -ResetData
```
