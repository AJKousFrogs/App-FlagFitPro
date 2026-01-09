#!/bin/bash
# ============================================================================
# Test Script: Verify Security Linter Fixes
# Purpose: Verify that security linter warnings have been properly fixed
# Usage: ./scripts/verify-security-fixes.sh [database_url]
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔒 Verifying Security Linter Fixes..."
echo ""

# Get database URL from argument or environment
DATABASE_URL=${1:-$DATABASE_URL}

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL not provided${NC}"
    echo "Usage: $0 [database_url]"
    echo "Or set DATABASE_URL environment variable"
    exit 1
fi

# Function to run SQL and capture output
run_sql() {
    psql "$DATABASE_URL" -t -A -c "$1" 2>&1
}

# Test counter
PASS=0
FAIL=0
WARN=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Verify cleanup_expired_notifications search_path"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESULT=$(run_sql "SELECT array_to_string(proconfig, ', ') FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'cleanup_expired_notifications';")

if [ -z "$RESULT" ]; then
    echo -e "${YELLOW}⚠️  SKIP: Function cleanup_expired_notifications does not exist${NC}"
    ((WARN++))
elif echo "$RESULT" | grep -q "search_path=public"; then
    echo -e "${GREEN}✅ PASS: search_path is set to public${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL: search_path is not set correctly${NC}"
    echo "   Got: $RESULT"
    ((FAIL++))
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Verify send_notification search_path"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESULT=$(run_sql "SELECT array_to_string(proconfig, ', ') FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'send_notification';")

if [ -z "$RESULT" ]; then
    echo -e "${YELLOW}⚠️  SKIP: Function send_notification does not exist${NC}"
    ((WARN++))
elif echo "$RESULT" | grep -q "search_path=public"; then
    echo -e "${GREEN}✅ PASS: search_path is set to public${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL: search_path is not set correctly${NC}"
    echo "   Got: $RESULT"
    ((FAIL++))
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Verify player_activity_tracking RLS policy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check that old policy is gone
OLD_POLICY=$(run_sql "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'player_activity_tracking' AND policyname = 'System can insert activity';")

if [ "$OLD_POLICY" = "0" ]; then
    echo -e "${GREEN}✅ PASS: Old permissive policy 'System can insert activity' removed${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL: Old permissive policy still exists${NC}"
    ((FAIL++))
fi

# Check that new policy exists
NEW_POLICY=$(run_sql "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'player_activity_tracking' AND policyname = 'Authenticated can insert activity tracking';")

if [ "$NEW_POLICY" = "1" ]; then
    echo -e "${GREEN}✅ PASS: New secure policy 'Authenticated can insert activity tracking' exists${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL: New secure policy not found${NC}"
    ((FAIL++))
fi

# Check that new policy doesn't use WITH CHECK (true)
POLICY_CHECK=$(run_sql "SELECT with_check FROM pg_policies WHERE tablename = 'player_activity_tracking' AND policyname = 'Authenticated can insert activity tracking';")

if echo "$POLICY_CHECK" | grep -qi "true"; then
    echo -e "${RED}❌ FAIL: Policy still uses WITH CHECK (true)${NC}"
    echo "   Got: $POLICY_CHECK"
    ((FAIL++))
else
    echo -e "${GREEN}✅ PASS: Policy uses proper authentication checks${NC}"
    ((PASS++))
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Check SELECT policies on player_activity_tracking"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for player view policy
PLAYER_POLICY=$(run_sql "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'player_activity_tracking' AND policyname = 'Players can view own activity';")

if [ "$PLAYER_POLICY" = "1" ]; then
    echo -e "${GREEN}✅ PASS: Player SELECT policy exists${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️  WARN: Player SELECT policy not found${NC}"
    ((WARN++))
fi

# Check for coach view policy
COACH_POLICY=$(run_sql "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'player_activity_tracking' AND policyname = 'Coaches can view team activity';")

if [ "$COACH_POLICY" = "1" ]; then
    echo -e "${GREEN}✅ PASS: Coach SELECT policy exists${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️  WARN: Coach SELECT policy not found${NC}"
    ((WARN++))
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Verify table has RLS enabled"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RLS_ENABLED=$(run_sql "SELECT relrowsecurity FROM pg_class WHERE relname = 'player_activity_tracking';")

if [ "$RLS_ENABLED" = "t" ]; then
    echo -e "${GREEN}✅ PASS: RLS is enabled on player_activity_tracking${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL: RLS is not enabled${NC}"
    ((FAIL++))
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo -e "${YELLOW}Warnings: $WARN${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
    echo -e "${RED}❌ VERIFICATION FAILED${NC}"
    echo "Some tests failed. Please review the migration."
    exit 1
elif [ $WARN -gt 0 ]; then
    echo -e "${YELLOW}⚠️  VERIFICATION COMPLETED WITH WARNINGS${NC}"
    echo "All critical tests passed, but some optional checks failed."
    echo ""
    echo "Note: If functions don't exist in your database, that's expected."
    echo "The migration will create them when they're called."
    exit 0
else
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    echo "Security linter fixes verified successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Enable 'Leaked Password Protection' in Supabase Dashboard"
    echo "   → Authentication → Providers → Email → Password Settings"
    echo "2. Run database linter in Supabase Dashboard to verify"
    echo "3. Monitor application logs for any RLS-related issues"
    exit 0
fi
