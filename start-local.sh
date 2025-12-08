#!/bin/bash

# Start local development server with real Supabase data

echo "🚀 Starting FlagFit Pro with Real Data..."
echo ""

# Set environment variables
export SUPABASE_URL="https://pvziciccwxgftcielknm.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWN3eGdmdGNpZWxrbm0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1OTUzNzA1OCwiZXhwIjoyMDc1MTEzMDU4fQ.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU"
export SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWN3eGdmdGNpZWxrbm0iLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzU5NTM3MDU4LCJleHAiOjIwNzUxMTMwNTh9.UwVhLpQOpC50G8D8zL8MCbIe8mm_2EqubaC2s_-Z5mo"
export JWT_SECRET="flagfit-pro-jwt-secret-2024"
export NODE_ENV="development"
export VITE_SUPABASE_URL="https://pvziciccwxgftcielknm.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWN3eGdmdGNpZWxrbm0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1OTUzNzA1OCwiZXhwIjoyMDc1MTEzMDU4fQ.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU"

echo "✅ Environment variables set"
echo ""
echo "📊 Supabase URL: $SUPABASE_URL"
echo "🔑 Using real database connection"
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
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

