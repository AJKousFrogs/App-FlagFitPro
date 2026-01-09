#!/bin/bash

###############################################################################
# Quick Magic Link Test Script
#
# Tests magic link authentication without requiring email configuration.
# Uses Supabase Auth API directly to generate magic link.
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "======================================================================="
echo "  MAGIC LINK TEST UTILITY"
echo "======================================================================="
echo ""

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${YELLOW}⚠️  Missing Supabase credentials${NC}"
  echo ""
  echo "Please set environment variables:"
  echo "  export SUPABASE_URL='https://your-project.supabase.co'"
  echo "  export SUPABASE_ANON_KEY='your-anon-key'"
  echo ""
  echo "Or create a .env file with these values."
  exit 1
fi

# Prompt for email
echo -e "${BLUE}Enter email address for magic link test:${NC}"
read -r EMAIL

if [ -z "$EMAIL" ]; then
  echo "Email is required"
  exit 1
fi

echo ""
echo "Requesting magic link for: $EMAIL"
echo ""

# Request magic link via Supabase API
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/magiclink" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\"}")

echo -e "${GREEN}✅ Magic link request sent!${NC}"
echo ""
echo "======================================================================="
echo "  NEXT STEPS"
echo "======================================================================="
echo ""
echo "1. Open Supabase Dashboard:"
echo "   ${SUPABASE_URL}/project/_/auth/users"
echo ""
echo "2. Navigate to: Authentication → Logs"
echo ""
echo "3. Filter by event type: 'magic_link'"
echo ""
echo "4. Find the most recent event for: $EMAIL"
echo ""
echo "5. Click on the event to view details"
echo ""
echo "6. Copy the magic link URL (looks like):"
echo "   http://localhost:4200/auth/callback#access_token=..."
echo ""
echo "7. Paste the URL in your browser to test authentication"
echo ""
echo "======================================================================="
echo ""
echo "Response from Supabase:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""
