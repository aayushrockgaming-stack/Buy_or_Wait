@echo off
title Buy or Wait? - 1-Click Launcher
echo ==================================================================
echo         BUY OR WAIT? - AI FINANCIAL AFFORDABILITY PLATFORM
echo ==================================================================
echo.
echo Starting 2 Localhost Servers...
echo 1. Python FastAPI Backend Engine  -> http://127.0.0.1:8080
echo 2. React Vite Frontend Web App    -> http://localhost:5173
echo.

:: Launch Python FastAPI Backend Server on Port 8080 (bypasses Windows port 8000 socket permission blocks)
start "Buy-or-Wait FastAPI Backend (Port 8080)" cmd /k "python -m uvicorn code.api:app --host 127.0.0.1 --port 8080 --reload"

:: Launch React Vite Frontend Dev Server
start "Buy-or-Wait React Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo Launching browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173/

echo.
echo ==================================================================
echo  Application is running!
echo  Close the popup terminal windows to stop the servers.
echo ==================================================================
