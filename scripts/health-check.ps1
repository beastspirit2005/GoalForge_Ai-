# GoalForge AI - health and stability check
# Run from repo root: powershell -ExecutionPolicy Bypass -File scripts/health-check.ps1

$ErrorActionPreference = "Continue"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root
$failed = 0
$passed = 0

function Report($name, $ok, $detail) {
    Write-Host "DEBUG: Report called for '$name' with ok=$ok, detail='$detail'" -ForegroundColor Yellow
    if ($ok) {
        $script:passed++
        Write-Host "[PASS] $name — $detail" -ForegroundColor Green
    } else {
        $script:failed++
        Write-Host "[FAIL] $name — $detail" -ForegroundColor Red
    }
}

Write-Host "`n=== GoalForge AI Health & Stability Check ===`n" -ForegroundColor Cyan

# Docker services
$containers = try { docker compose ps --format json 2>$null | ConvertFrom-Json } catch { $null }
if ($containers) {
    $down = @($containers | Where-Object { $_.State -notmatch "running" })
    Report "Docker compose services" ($down.Count -eq 0) "$(@($containers).Count) services, $($down.Count) not running"
} else {
    Report "Docker compose services" $false "docker compose not running or unavailable"
}

# HTTP endpoints
function Test-Http($name, $uri, $method = "GET", $body = $null) {
    try {
        $params = @{ Uri = $uri; Method = $method; TimeoutSec = 30; UseBasicParsing = $true; ErrorAction = "Stop" }
        if ($body) { $params.ContentType = "application/json"; $params.Body = $body }
        $r = Invoke-WebRequest @params
        Report $name ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) "HTTP $($r.StatusCode)"
        return $true
    } catch {
        Report $name $false $_.Exception.Message
        return $false
    }
}

Test-Http "Backend /health" "http://localhost:8000/health" | Out-Null
Test-Http "Frontend /api/health" "http://localhost:3000/api/health" | Out-Null
Test-Http "Frontend home" "http://localhost:3000/" | Out-Null

$loginBody = '{"email":"employee@goalforge.ai","password":"password123"}'
try {
    $login = Invoke-RestMethod -Uri "http://localhost:8000/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -TimeoutSec 30 -ErrorAction Stop
    Report "Auth login" $true "token issued"
    $headers = @{ Authorization = "Bearer $($login.access_token)" }
    Invoke-RestMethod -Uri "http://localhost:8000/goals/" -Headers $headers -TimeoutSec 30 -ErrorAction Stop | Out-Null
    Report "Goals API (authenticated)" $true "OK"
} catch {
    Report "Auth login" $false $_.Exception.Message
    Report "Goals API (authenticated)" $false "skipped (no token)"
}

Test-Http "Auth via frontend proxy" "http://localhost:3000/api/auth/login" "POST" $loginBody | Out-Null
Test-Http "Ollama" "http://localhost:11434/api/tags" | Out-Null

# Production (optional)
try {
    $vh = Invoke-RestMethod -Uri "https://goal-forge-ai-lake.vercel.app/api/health" -TimeoutSec 60 -ErrorAction Stop
    Report "Vercel /api/health" ($vh.status -eq "ok") $vh.status
} catch {
    Report "Vercel /api/health" $false "unreachable or not configured"
}

# Build / lint (local toolchain)
Write-Host ""
Push-Location (Join-Path $Root "frontend")
npm run build 2>&1 | Out-Null
Report "Frontend production build" ($LASTEXITCODE -eq 0) "npm run build"
npm run lint 2>&1 | Out-Null
$lintOk = $LASTEXITCODE -eq 0
Report "Frontend ESLint" $lintOk $(if ($lintOk) { "clean" } else { "see npm run lint output" })
Pop-Location

Push-Location (Join-Path $Root "backend")
python -c "from app.main import app" 2>&1 | Out-Null
Report "Backend import" ($LASTEXITCODE -eq 0) "app.main"
Pop-Location

Write-Host "`n=== Summary: $passed passed, $failed failed ===`n" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
exit $failed
