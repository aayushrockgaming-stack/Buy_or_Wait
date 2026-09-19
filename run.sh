#!/usr/bin/env bash
echo "=================================================================="
echo "        BUY OR WAIT? - AI FINANCIAL AFFORDABILITY PLATFORM"
echo "=================================================================="
echo ""
echo "Starting 2 Localhost Servers..."
echo "1. Python FastAPI Backend Engine  -> http://localhost:8000"
echo "2. React Vite Frontend Web App    -> http://localhost:5173"
echo ""

# Start FastAPI backend in background
python3 -m uvicorn code.api:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start React Vite frontend in background
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
