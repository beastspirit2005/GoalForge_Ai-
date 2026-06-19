# GoalForge AI — Vercel production deploy helper
# Run from repo root:  powershell -ExecutionPolicy Bypass -File scripts/vercel-deploy.ps1

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root
Write-Host "`n=== GoalForge AI — Vercel deploy ===" -ForegroundColor Cyan

# 1. Vercel CLI
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel@latest
}

# 2. Login (opens browser once)
Write-Host "`nStep 1: Log in to Vercel (browser will open if needed)..." -ForegroundColor Green
vercel login

# 3. Link project
Write-Host "`nStep 2: Link this folder to a Vercel project..." -ForegroundColor Green
vercel link

# 4. Environment variables (required for real login)
Write-Host "`nStep 3: Set production environment variables." -ForegroundColor Green
Write-Host @"

REQUIRED on Vercel (Project → Settings → Environment Variables):

  DATABASE_URL     = postgresql+asyncpg://...  (use Vercel Postgres / Neon — NOT localhost)
  SECRET_KEY       = long random string
  GEMINI_API_KEY   = your Google Gemini key (optional)
  CORS_ORIGINS     = https://YOUR-APP.vercel.app

Do NOT set NEXT_PUBLIC_API_URL for monorepo deploy (API is at /api on same domain).

After first deploy, seed users once (from your PC, with production DATABASE_URL):
  cd backend
  `$env:DATABASE_URL = '<paste production url>'
  python ..\scripts\seed.py

"@ -ForegroundColor DarkGray

$setEnv = Read-Host "Add env vars via CLI now? (y/n)"
if ($setEnv -eq "y") {
    $db = Read-Host "DATABASE_URL (postgresql+asyncpg://...)"
    if ($db) { $db | vercel env add DATABASE_URL production }
    $secret = Read-Host "SECRET_KEY"
    if ($secret) { $secret | vercel env add SECRET_KEY production }
    $gemini = Read-Host "GEMINI_API_KEY (optional, Enter to skip)"
    if ($gemini) { $gemini | vercel env add GEMINI_API_KEY production }
    $cors = Read-Host "CORS_ORIGINS (e.g. https://your-app.vercel.app)"
    if ($cors) { $cors | vercel env add CORS_ORIGINS production }
}

# 5. Deploy
Write-Host "`nStep 4: Deploying to production..." -ForegroundColor Green
vercel deploy --prod

Write-Host "`nDone. Test: https://<your-deployment>/api/health" -ForegroundColor Cyan
Write-Host "Login: employee@example.com / password123 (after running seed.py on production DB)`n" -ForegroundColor Cyan
