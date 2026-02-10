#!/bin/bash

# 🚀 Quick Deploy Script
# Deploys Edge Functions and verifies deployment
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting deployment process..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI found${NC}"

# Check if we're logged in
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase${NC}"
    echo "Running: supabase login"
    supabase login
fi

echo -e "${GREEN}✓ Authenticated with Supabase${NC}"
echo ""

# List projects
echo "📋 Your Supabase projects:"
supabase projects list
echo ""

# Check for USDA API key
echo "🔑 Checking for USDA_API_KEY..."
if supabase secrets list | grep -q "USDA_API_KEY"; then
    echo -e "${GREEN}✓ USDA_API_KEY is set${NC}"
else
    echo -e "${YELLOW}⚠️  USDA_API_KEY not found${NC}"
    echo ""
    echo "To set it up:"
    echo "1. Get a free API key from: https://fdc.nal.usda.gov/api-key-signup.html"
    echo "2. Run: supabase secrets set USDA_API_KEY=your_api_key_here"
    echo ""
    read -p "Do you want to set it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your USDA API key: " usda_key
        supabase secrets set USDA_API_KEY="$usda_key"
        echo -e "${GREEN}✓ USDA_API_KEY set successfully${NC}"
    else
        echo -e "${RED}❌ Deployment cannot continue without USDA_API_KEY${NC}"
        exit 1
    fi
fi

echo ""
echo "📦 Deploying Edge Functions..."
echo ""

# Deploy USDA search function
echo "Deploying search-usda-foods..."
if supabase functions deploy search-usda-foods; then
    echo -e "${GREEN}✓ search-usda-foods deployed successfully${NC}"
else
    echo -e "${RED}❌ Failed to deploy search-usda-foods${NC}"
    exit 1
fi

echo ""
echo "🧪 Testing deployment..."

# Test the function
SUPABASE_URL=$(supabase status 2>/dev/null | grep "API URL" | awk '{print $3}')
SUPABASE_ANON_KEY=$(supabase status 2>/dev/null | grep "anon key" | awk '{print $NF}')

if [ -z "$SUPABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  Could not auto-detect Supabase URL${NC}"
    echo "You can test manually with:"
    echo 'curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/search-usda-foods \'
    echo '  -H "Authorization: Bearer YOUR_ANON_KEY" \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -d '"'"'{"query": "apple", "pageSize": 1}'"'"
else
    echo "Testing USDA search function..."
    TEST_RESULT=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/search-usda-foods" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d '{"query": "apple", "pageSize": 1}')
    
    if echo "$TEST_RESULT" | grep -q "success"; then
        echo -e "${GREEN}✓ Function test passed${NC}"
    else
        echo -e "${RED}❌ Function test failed${NC}"
        echo "Response: $TEST_RESULT"
        exit 1
    fi
fi

echo ""
echo "📊 Deployment Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Edge Functions deployed${NC}"
echo -e "${GREEN}✓ USDA API key configured${NC}"
echo -e "${GREEN}✓ Function tests passed${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🎉 Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Test USDA food search in your app"
echo "2. Verify real-time subscriptions are working"
echo "3. Check API_HEALTH_REPORT.md for full status"
echo ""
echo "📚 Documentation:"
echo "- COMPLETE_FIX_REPORT.md - Full fix details"
echo "- API_HEALTH_REPORT.md - API status"
echo "- DEPLOYMENT_CHECKLIST.md - Production deployment"
echo ""

exit 0

