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

# Load environment from .env.local or .env file if it exists
if [[ -f .env.local ]]; then
    echo "📄 Loading environment from .env.local file..."
    set -a
    # shellcheck source=/dev/null
    source .env.local
    set +a
elif [[ -f .env ]]; then
    echo "📄 Loading environment from .env file..."
    set -a
    # shellcheck source=/dev/null
    source .env
    set +a
else
    echo "⚠️  No .env or .env.local file found."
    echo "   Please create one with your Supabase credentials."
    echo "   Required variables: SUPABASE_URL, SUPABASE_ANON_KEY"
    exit 1
fi

export NODE_ENV="development"
export VITE_SUPABASE_URL="${SUPABASE_URL:-}"
export VITE_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"

if [[ -z "${SUPABASE_URL:-}" ]] || [[ -z "${SUPABASE_ANON_KEY:-}" ]]; then
    echo "❌ Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY"
    exit 1
fi

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
