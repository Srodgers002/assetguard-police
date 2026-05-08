#!/bin/bash
echo "Starting AssetGuard - Mordabad Police Line"
echo "============================================"

# Start backend
cd "$(dirname "$0")/backend"
echo "Starting FastAPI backend on port 8000..."
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
cd "$(dirname "$0")/frontend"
echo "Starting React frontend on port 3000..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "AssetGuard is running!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Login: admin / admin123"
echo ""
echo "Press Ctrl+C to stop all servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servers stopped'" INT
wait
