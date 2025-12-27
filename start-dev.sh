#!/bin/bash
set -euo pipefail

# Start development servers with hot reload
# Backend: nodemon for hot reload
# Frontend: Angular CLI has built-in hot reload

# Error handling
trap 'echo ""; echo "🛑 Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0' SIGINT SIGTERM
trap 'echo "❌ Error at line $LINENO"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 1' ERR

echo "🚀 Starting FlagFit Pro Development Servers..."
echo ""

# Change to script directory
cd "$(dirname "$0")"

# Check if nodemon is installed
if ! command -v nodemon &> /dev/null; then
    echo "⚠️  nodemon not found, installing..."
    npm install -g nodemon
fi

# Start backend server with nodemon (hot reload)
echo "📦 Starting backend server on port 3001 (with hot reload)..."
nodemon server.js --watch . --ext js,json --ignore node_modules/ --ignore angular/ --ignore "*.backup" &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start Angular frontend (has built-in hot reload)
echo "⚡ Starting Angular frontend on port 4200 (with hot reload)..."
cd angular
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Servers starting..."
echo ""
echo "📊 Backend API: http://localhost:3001"
echo "🌐 Frontend App: http://localhost:4200"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user interrupt
wait
