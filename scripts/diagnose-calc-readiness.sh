#!/bin/bash
# Diagnostic script for calc-readiness 502 error
# This script helps diagnose the issue by checking various components

set -e

echo "==========================================="
echo "Calc-Readiness Diagnostic Script"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check deployment status
echo "1. Checking Netlify deployment status..."
DEPLOY_STATUS=$(npx netlify api listSiteDeploys --data '{"site_id":"50b440ee-8280-45ab-90b6-ebd6dbbdd7ba"}' 2>/dev/null | jq -r '.[0].state')
if [ "$DEPLOY_STATUS" == "ready" ]; then
    echo -e "${GREEN}✓ Deployment is ready${NC}"
else
    echo -e "${YELLOW}⚠ Deployment status: $DEPLOY_STATUS${NC}"
fi
echo ""

# 2. Check if function exists
echo "2. Checking if calc-readiness function is deployed..."
FUNCTION_EXISTS=$(npx netlify functions:list 2>/dev/null | grep -c "calc-readiness" || true)
if [ "$FUNCTION_EXISTS" -gt 0 ]; then
    echo -e "${GREEN}✓ Function is deployed${NC}"
else
    echo -e "${RED}✗ Function not found${NC}"
fi
echo ""

# 3. Check environment variables
echo "3. Checking critical environment variables..."
npx netlify env:list 2>/dev/null | grep -E "(SUPABASE_URL|SUPABASE_SERVICE_KEY|SUPABASE_ANON_KEY)" | while read line; do
    VAR_NAME=$(echo "$line" | awk '{print $1}')
    if [ -n "$VAR_NAME" ]; then
        echo -e "${GREEN}✓ $VAR_NAME is set${NC}"
    fi
done
echo ""

# 4. Check database tables
echo "4. Checking database tables..."
TABLES=("wellness_logs" "training_sessions" "readiness_scores" "fixtures")
for table in "${TABLES[@]}"; do
    # Check via Supabase (requires supabase CLI)
    if command -v supabase &> /dev/null; then
        TABLE_EXISTS=$(supabase db query "SELECT table_name FROM information_schema.tables WHERE table_name='$table'" 2>/dev/null | grep -c "$table" || echo "0")
        if [ "$TABLE_EXISTS" -gt 0 ]; then
            echo -e "${GREEN}✓ Table $table exists${NC}"
        else
            echo -e "${RED}✗ Table $table not found${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Supabase CLI not installed, skipping table check${NC}"
        break
    fi
done
echo ""

# 5. Test function locally (if netlify dev is running)
echo "5. Testing function locally (requires netlify dev to be running)..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    -d '{"athleteId":"test-id","day":"2026-01-11"}' \
    http://localhost:8888/.netlify/functions/calc-readiness 2>/dev/null || echo "000")

if [ "$RESPONSE" == "200" ]; then
    echo -e "${GREEN}✓ Function returns 200 OK${NC}"
elif [ "$RESPONSE" == "401" ] || [ "$RESPONSE" == "403" ]; then
    echo -e "${YELLOW}⚠ Function returns $RESPONSE (auth required)${NC}"
elif [ "$RESPONSE" == "000" ]; then
    echo -e "${YELLOW}⚠ Local dev server not running (netlify dev)${NC}"
else
    echo -e "${RED}✗ Function returns $RESPONSE${NC}"
fi
echo ""

# 6. Check function logs
echo "6. Recent function logs (last 10 lines)..."
echo -e "${YELLOW}Run this command to view live logs:${NC}"
echo "  netlify logs:functions calc-readiness --live"
echo ""

# 7. Provide next steps
echo "==========================================="
echo "Next Steps:"
echo "==========================================="
echo ""
echo "1. View function logs:"
echo "   netlify logs:functions calc-readiness --live"
echo ""
echo "2. Test the function in production:"
echo "   curl -X POST \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "     -d '{\"athleteId\":\"YOUR_ID\",\"day\":\"2026-01-11\"}' \\"
echo "     https://webflagfootballfrogs.netlify.app/api/calc-readiness"
echo ""
echo "3. Check Netlify function logs in UI:"
echo "   https://app.netlify.com/sites/webflagfootballfrogs/logs"
echo ""
echo "4. If 502 persists, check for:"
echo "   - Missing wellness log for the specified day"
echo "   - Database connection timeout"
echo "   - RPC function errors (detect_acwr_trigger)"
echo "   - Invalid date format in request"
echo ""

# 8. Summary
echo "==========================================="
echo "Diagnostic Summary"
echo "==========================================="
echo ""
echo "For detailed debugging information, see:"
echo "  docs/DEBUGGING_502_CALC_READINESS.md"
echo ""
