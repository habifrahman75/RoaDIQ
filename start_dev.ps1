#!/usr/bin/env pwsh
<#
.SYNOPSIS
    RoadIQ – One-command demo launcher (Windows PowerShell)
    Member 4: System Integration & Demo Stability

.DESCRIPTION
    Starts all three RoadIQ services in separate PowerShell windows:
      1. Backend   → http://localhost:8000
      2. AI Service → http://localhost:8001
      3. Frontend  → http://localhost:5173

    Prerequisites:
      - Python 3.10+ in PATH
      - Node.js 18+ in PATH
      - MongoDB running (local or Atlas in .env)
      - All dependencies installed (see README.md)

.USAGE
    From repository root:
        powershell -ExecutionPolicy Bypass -File start_dev.ps1

    To seed the database first:
        powershell -ExecutionPolicy Bypass -File start_dev.ps1 -Seed
#>

param(
    [switch]$Seed = $false
)

$RootDir    = $PSScriptRoot
$BackendDir = Join-Path $RootDir "RoaDIQ\Backend"
$AIDir      = Join-Path $RootDir "ai"
$FrontDir   = Join-Path $RootDir "RoaDIQ\frontend"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  RoadIQ – Starting all services" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# ---------------------------------------------------------------------------
# Validate directories exist
# ---------------------------------------------------------------------------
foreach ($dir in @($BackendDir, $AIDir, $FrontDir)) {
    if (-not (Test-Path $dir)) {
        Write-Host "  ERROR: Directory not found: $dir" -ForegroundColor Red
        exit 1
    }
}

# ---------------------------------------------------------------------------
# Seed database (optional)
# ---------------------------------------------------------------------------
if ($Seed) {
    Write-Host "  Seeding database..." -ForegroundColor Yellow
    $activate = Join-Path $BackendDir "venv\Scripts\Activate.ps1"
    if (Test-Path $activate) {
        & $activate
        & python (Join-Path $BackendDir "seed_db.py")
    } else {
        Write-Host "  WARNING: Backend venv not found — skipping seed." -ForegroundColor Yellow
        Write-Host "  Run: cd RoaDIQ\Backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt" -ForegroundColor Gray
    }
}

# ---------------------------------------------------------------------------
# Terminal 1 — Backend (port 8000)
# ---------------------------------------------------------------------------
Write-Host "  Starting Backend (port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$BackendDir'; if (Test-Path venv\Scripts\Activate.ps1) { .\venv\Scripts\Activate.ps1 }; Write-Host 'RoadIQ Backend — http://localhost:8000' -ForegroundColor Cyan; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
) -WindowStyle Normal

Start-Sleep -Seconds 2

# ---------------------------------------------------------------------------
# Terminal 2 — AI Service (port 8001)
# ---------------------------------------------------------------------------
Write-Host "  Starting AI Service (port 8001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$AIDir'; if (Test-Path venv\Scripts\Activate.ps1) { .\venv\Scripts\Activate.ps1 }; Write-Host 'RoadIQ AI Service — http://localhost:8001' -ForegroundColor Cyan; uvicorn main:app --host 0.0.0.0 --port 8001 --reload"
) -WindowStyle Normal

Start-Sleep -Seconds 2

# ---------------------------------------------------------------------------
# Terminal 3 — Frontend (port 5173)
# ---------------------------------------------------------------------------
Write-Host "  Starting Frontend (port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$FrontDir'; Write-Host 'RoadIQ Frontend — http://localhost:5173' -ForegroundColor Cyan; npm run dev"
) -WindowStyle Normal

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  Services launching in separate windows." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend:    http://localhost:8000/health" -ForegroundColor White
Write-Host "  API Docs:   http://localhost:8000/docs"  -ForegroundColor White
Write-Host "  AI Service: http://localhost:8001/health" -ForegroundColor White
Write-Host "  Frontend:   http://localhost:5173"        -ForegroundColor White
Write-Host ""
Write-Host "  Login: admin@roadiq.gov / admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Run integration tests after all services start:" -ForegroundColor Gray
Write-Host "    python tests\test_integration.py" -ForegroundColor Gray
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Open frontend in browser after a short delay
Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"
