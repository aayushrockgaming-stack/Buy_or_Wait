# Buy or Wait? - PowerShell Launcher Script
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "        BUY OR WAIT? - AI FINANCIAL AFFORDABILITY PLATFORM" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting 2 Localhost Servers..." -ForegroundColor Yellow
Write-Host "1. Python FastAPI Backend Engine  -> http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "2. React Vite Frontend Web App    -> http://localhost:5173" -ForegroundColor Green
Write-Host ""

# Start Backend Server with 127.0.0.1 host binding
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot'; python -m uvicorn code.api:app --host 127.0.0.1 --port 8000 --reload"

# Start Frontend Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev"

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173/"

Write-Host "Application launched successfully!" -ForegroundColor Green
