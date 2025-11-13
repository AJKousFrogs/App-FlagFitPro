#!/bin/bash

# Enhanced Development Server Startup Script
# Starts localhost with hot reload and immediate bug fixing

echo "🔥 Starting Flag Football App Development Server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if port 4000 is in use
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 4000 is already in use. Attempting to kill existing process..."
    lsof -ti:4000 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Check if port 3001 is in use (API server)
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3001 is already in use. Attempting to kill existing process..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Start the enhanced dev server with bug fixing
echo ""
echo "🚀 Starting enhanced dev server with hot reload & bug fixing..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev:bugfix

