# Demo Access and Data

Use this when you want manual login (no auto-login on app load).

## Demo Credentials

- Email: `rajesh@example.com`
- Password: `password123`

## Load Demo Data

Run this command from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\inject-demo-data.ps1
```

This seeds realistic data for frontend and ML analytics:

- Items: 24
- Sales: 83
- Sale Items: 315

## Login Flow

1. Open `http://localhost`
2. You will land on the login page.
3. Use the demo credentials above (or click **Use Demo Credentials** on the login form).
4. Sign in and verify Dashboard, Inventory, Transactions, and Analytics pages.
