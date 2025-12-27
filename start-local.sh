#!/bin/bash
set -euo pipefail

# Start local development server with real Supabase data

# Error handling
trap 'echo ""; echo "🛑 Server stopped."; exit 0' SIGINT SIGTERM
trap 'echo "❌ Error at line $LINENO"; exit 1' ERR

echo "🚀 Starting FlagFit Pro with Real Data..."
echo ""

# Change to script directory
cd "$(dirname "$0")"

# Load environment from .env file if it exists (more secure than hardcoding)
if [[ -f .env ]]; then
    echo "📄 Loading environment from .env file..."
    set -a
    source .env
    set +a
else
    echo "⚠️  No .env file found, using default development credentials..."
    # Set environment variables (development only - production uses Netlify env vars)
    export SUPABASE_URL="${SUPABASE_URL:-https://pvziciccwxgftcielknm.supabase.co}"
    export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWN3eGdmdGNpZWxrbm0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1OTUzNzA1OCwiZXhwIjoyMDc1MTEzMDU4fQ.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU}"
    export SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"
    export JWT_SECRET="${JWT_SECRET:-flagfit-pro-jwt-secret-dev}"
fi

export NODE_ENV="development"
export VITE_SUPABASE_URL="$SUPABASE_URL"
export VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"

echo "✅ Environment variables set"
echo ""
echo "📊 Supabase URL: $SUPABASE_URL"
echo "🔑 Using real database connection"
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "⚠️  Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

echo "🌐 Starting Netlify Dev Server..."
echo ""
echo "📱 Frontend will be available at: http://localhost:8888"
echo "🔌 API Functions will be available at: http://localhost:8888/.netlify/functions/*"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start Netlify Dev (this will run both frontend and functions)
netlify dev

