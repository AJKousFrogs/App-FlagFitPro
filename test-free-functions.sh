#!/bin/bash

# Test Free Edge Functions
# Tests weather and AI suggestions to verify they work

echo "🧪 Testing Free Edge Functions..."
echo ""

PROJECT_URL="https://pvziciccwxgftcielknm.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWN3eGdmdGNpZWxrbm0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1OTUzNzA1OCwiZXhwIjoyMDc1MTEzMDU4fQ.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU"

echo "1️⃣ Testing Weather Function (Open-Meteo - FREE, no API key needed)..."
echo ""

WEATHER_RESULT=$(curl -s -X POST "${PROJECT_URL}/functions/v1/weather-free" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"city": "San Francisco"}')

echo "Weather Response:"
echo "$WEATHER_RESULT" | python3 -m json.tool 2>/dev/null || echo "$WEATHER_RESULT"
echo ""

if echo "$WEATHER_RESULT" | grep -q "success"; then
  echo "✅ Weather Function: WORKING"
else
  echo "❌ Weather Function: ERROR"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "2️⃣ Testing AI Suggestions Function (Groq - FREE, 14,400 requests/day)..."
echo ""

AI_RESULT=$(curl -s -X POST "${PROJECT_URL}/functions/v1/ai-suggestions-free" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "userProfile": {
      "level": "intermediate",
      "goals": ["speed", "agility"]
    },
    "context": "Training for flag football, need to improve acceleration"
  }')

echo "AI Response:"
echo "$AI_RESULT" | python3 -m json.tool 2>/dev/null || echo "$AI_RESULT"
echo ""

if echo "$AI_RESULT" | grep -q "success"; then
  echo "✅ AI Suggestions Function: WORKING"
else
  echo "❌ AI Suggestions Function: ERROR"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo ""

if echo "$WEATHER_RESULT" | grep -q "success" && echo "$AI_RESULT" | grep -q "success"; then
  echo "✅ All functions working!"
  echo "✅ Weather: Open-Meteo (FREE, unlimited)"
  echo "✅ AI: Groq Llama 3.1 (FREE, 14,400/day)"
  echo ""
  echo "💰 Total Cost: $0/month"
else
  echo "⚠️ Some functions have errors - check output above"
fi

echo ""

