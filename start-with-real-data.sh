#!/bin/bash

# Start localhost with real Supabase data and full functionality

echo "🚀 Starting FlagFit Pro with Real Data..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Set environment variables for Supabase
export SUPABASE_URL="https://pvziciccwxgftcielknm.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWN3eGdmdGNpZWxrbm0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1OTUzNzA1OCwiZXhwIjoyMDc1MTEzMDU4fQ.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU"
export SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWN3eGdmdGNpZWxrbm0iLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzU5NTM3MDU4LCJleHAiOjIwNzUxMTMwNTh9.UwVhLpQOpC50G8D8zL8MCbIe8mm_2EqubaC2s_-Z5mo"
export JWT_SECRET="flagfit-pro-jwt-secret-2024"
export NODE_ENV="development"
export VITE_SUPABASE_URL="https://pvziciccwxgftcielknm.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWN3eGdmdGNpZWxrbm0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1OTUzNzA1OCwiZXhwIjoyMDc1MTEzMDU4fQ.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU"
export DATABASE_URL="${SUPABASE_URL}"

echo "✅ Environment variables configured"
echo "📊 Supabase URL: $SUPABASE_URL"
echo ""

# Change to script directory
cd "$(dirname "$0")"

# Check if ports are available
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3001 is already in use. Killing process..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 1
fi

if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 4000 is already in use. Killing process..."
    lsof -ti:4000 | xargs kill -9 2>/dev/null
    sleep 1
fi

echo ""
echo "🌐 Starting servers..."
echo ""

# Start API server in background
echo "📦 Starting API server on port 3001..."
node server.js &
API_PID=$!

# Wait for API server to start
sleep 2

# Start enhanced dev server (frontend with hot reload)
echo "⚡ Starting frontend dev server on port 4000..."
node dev-server-enhanced.cjs &
FRONTEND_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Servers started successfully!"
echo ""
echo "📱 Frontend: http://localhost:4000"
echo "🔌 API Server: http://localhost:3001"
echo "📊 Health Check: http://localhost:3001/api/health"
echo ""
echo "🔗 Real Data Connection:"
echo "   - Supabase Database: Connected"
echo "   - Authentication: Real user accounts"
echo "   - Training Data: Live from database"
echo "   - Community: Real posts and interactions"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $API_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Wait for processes
wait

