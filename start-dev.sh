#!/bin/bash

# Start development servers with hot reload
# Backend: nodemon for hot reload
# Frontend: Angular CLI has built-in hot reload

echo "🚀 Starting FlagFit Pro Development Servers..."
echo ""

# Start backend server with nodemon (hot reload)
echo "📦 Starting backend server on port 3001 (with hot reload)..."
cd "$(dirname "$0")"
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
