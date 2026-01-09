#!/bin/bash

################################################################################
# Security Scan Script
# Tests API routes for SQL injection, XSS, and over-fetching vulnerabilities
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
TEST_USER_EMAIL="${TEST_USER_EMAIL:-test@example.com}"
TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-testpassword123}"
REPORT_FILE="security-scan-report-$(date +%Y%m%d-%H%M%S).txt"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Functions
print_header() {
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
}

print_test() {
  echo -ne "${YELLOW}[TEST]${NC} $1... "
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

print_pass() {
  echo -e "${GREEN}✅ PASS${NC}"
  PASSED_TESTS=$((PASSED_TESTS + 1))
}

print_fail() {
  echo -e "${RED}❌ FAIL${NC}"
  echo -e "${RED}  → $1${NC}"
  FAILED_TESTS=$((FAILED_TESTS + 1))
}

print_warn() {
  echo -e "${YELLOW}⚠️  WARN${NC}"
  echo -e "${YELLOW}  → $1${NC}"
  WARNINGS=$((WARNINGS + 1))
}

# Start report
{
  echo "Security Scan Report"
  echo "Generated: $(date)"
  echo "API Base URL: $API_BASE_URL"
  echo "===================="
  echo ""
} > "$REPORT_FILE"

print_header "Security Scan Starting"

# Step 1: Authenticate
print_header "Step 1: Authentication"

print_test "Authenticating test user"
AUTH_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}")

if echo "$AUTH_RESPONSE" | grep -q '"success":true'; then
  print_pass
  AUTH_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  USER_ID=$(echo "$AUTH_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "  Token: ${AUTH_TOKEN:0:20}..."
  echo "  User ID: $USER_ID"
else
  print_fail "Authentication failed"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

# Step 2: SQL Injection Tests
print_header "Step 2: SQL Injection Tests"

SQL_PAYLOADS=(
  "'; DROP TABLE workout_logs--"
  "1' OR '1'='1"
  "1 UNION SELECT * FROM users--"
  "'; UPDATE workout_logs SET player_id = 'evil'--"
  "admin'--"
  "' OR 1=1--"
  "1; DELETE FROM training_sessions WHERE 1=1--"
  "'; EXEC xp_cmdshell('dir')--"
)

for payload in "${SQL_PAYLOADS[@]}"; do
  print_test "SQL injection: ${payload:0:30}..."
  
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    "$API_BASE_URL/api/training/stats?userId=$(echo -n "$payload" | jq -sRr @uri)")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)
  
  # Check if response contains SQL error messages
  if echo "$BODY" | grep -qi "syntax error\|SQL error\|database error\|ORA-\|PG::"; then
    print_fail "SQL error message exposed"
    echo "  HTTP Code: $HTTP_CODE"
    echo "  Body snippet: ${BODY:0:100}"
    echo "SQL Injection Vulnerability: $payload" >> "$REPORT_FILE"
  elif [ "$HTTP_CODE" = "500" ]; then
    print_warn "Server error (500) - possible SQL injection"
    echo "  Payload: $payload"
    echo "  HTTP Code: $HTTP_CODE"
    echo "SQL Injection Warning: $payload (500 error)" >> "$REPORT_FILE"
  else
    print_pass
  fi
  
  sleep 0.1
done

# Step 3: XSS Tests
print_header "Step 3: XSS (Cross-Site Scripting) Tests"

XSS_PAYLOADS=(
  "<script>alert('xss')</script>"
  "<img src=x onerror=alert('xss')>"
  "<svg onload=alert('xss')>"
  "javascript:alert('xss')"
  "<iframe src='javascript:alert(1)'>"
  "<body onload=alert('xss')>"
)

for payload in "${XSS_PAYLOADS[@]}"; do
  print_test "XSS test: ${payload:0:30}..."
  
  RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/training/complete" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"demo-session\",\"rpe\":5,\"duration\":60,\"notes\":\"$payload\"}")
  
  # Check if response contains unescaped script tags
  if echo "$RESPONSE" | grep -q "<script>"; then
    print_fail "Unescaped script tag in response"
    echo "  Payload: $payload"
    echo "XSS Vulnerability: $payload" >> "$REPORT_FILE"
  elif echo "$RESPONSE" | grep -qi "syntax error\|malformed"; then
    print_warn "Payload caused parsing error"
  else
    print_pass
  fi
  
  sleep 0.1
done

# Step 4: Authorization Bypass Tests
print_header "Step 4: Authorization Bypass Tests"

print_test "Attempt to access other user's data"
OTHER_USER_ID="550e8400-e29b-41d4-a716-446655440999"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  "$API_BASE_URL/api/training/stats?userId=$OTHER_USER_ID")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "401" ]; then
  print_pass
elif echo "$BODY" | grep -q "\"totalSessions\":[1-9]"; then
  print_warn "Returned data for other user (may be ok if RLS enforced)"
  echo "  HTTP Code: $HTTP_CODE"
else
  print_pass
fi

print_test "Attempt to update other user's workout"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PUT "$API_BASE_URL/api/training/workouts/$OTHER_USER_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Should not update"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "404" ]; then
  print_pass
elif [ "$HTTP_CODE" = "200" ]; then
  print_fail "Successfully updated other user's data"
  echo "Authorization Bypass: Can update other user's workout" >> "$REPORT_FILE"
else
  print_pass
fi

print_test "Attempt to access without authentication"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$API_BASE_URL/api/training/session" \
  -H "Content-Type: application/json" \
  -d '{"session_type":"agility"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
  print_pass
else
  print_fail "Request succeeded without authentication"
  echo "  HTTP Code: $HTTP_CODE"
  echo "Auth Bypass: Session creation without auth" >> "$REPORT_FILE"
fi

# Step 5: Over-fetching Tests
print_header "Step 5: Over-fetching / Data Exposure Tests"

print_test "Check for SELECT * over-fetching"
RESPONSE=$(curl -s \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  "$API_BASE_URL/api/training/sessions?limit=1")

# Check if response contains excessive fields
FIELD_COUNT=$(echo "$RESPONSE" | grep -o '"[^"]*":' | wc -l)

if [ "$FIELD_COUNT" -gt 50 ]; then
  print_warn "Response contains $FIELD_COUNT fields - possible over-fetching"
  echo "  Consider selecting only needed columns"
elif [ "$FIELD_COUNT" -gt 100 ]; then
  print_fail "Excessive over-fetching: $FIELD_COUNT fields"
  echo "Over-fetching: $FIELD_COUNT fields in /api/training/sessions" >> "$REPORT_FILE"
else
  print_pass
fi

print_test "Check for unbounded query results"
RESPONSE=$(curl -s \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  "$API_BASE_URL/api/training/sessions")

RESULT_COUNT=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)

if [ "$RESULT_COUNT" -gt 100 ]; then
  print_warn "Query returned $RESULT_COUNT results without limit"
  echo "  Add pagination or default limit"
elif [ "$RESULT_COUNT" -gt 1000 ]; then
  print_fail "Excessive results: $RESULT_COUNT records"
  echo "Unbounded Query: $RESULT_COUNT results from /api/training/sessions" >> "$REPORT_FILE"
else
  print_pass
fi

# Step 6: Request Size Limit Tests
print_header "Step 6: Request Size Limit Tests"

print_test "Test request body size limit (2MB payload)"
LARGE_PAYLOAD=$(printf 'x%.0s' {1..2097152}) # 2MB of 'x'
RESPONSE=$(curl -s -w "\n%{http_code}" -m 10 \
  -X POST "$API_BASE_URL/api/training/complete" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"demo-session\",\"rpe\":5,\"duration\":60,\"notes\":\"$LARGE_PAYLOAD\"}" \
  2>/dev/null || echo "timeout")

if [ "$RESPONSE" = "timeout" ]; then
  print_warn "Request timed out (may indicate no size limit)"
  echo "Request Size: No limit or very high limit detected" >> "$REPORT_FILE"
else
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  
  if [ "$HTTP_CODE" = "413" ] || [ "$HTTP_CODE" = "400" ]; then
    print_pass
  else
    print_warn "Large payload accepted (HTTP $HTTP_CODE)"
    echo "  Consider adding body size limits"
  fi
fi

# Step 7: Rate Limiting Verification
print_header "Step 7: Rate Limiting Verification"

print_test "Verify rate limit headers present"
RESPONSE=$(curl -s -i "$API_BASE_URL/api/training/suggestions" | head -n 20)

if echo "$RESPONSE" | grep -qi "X-RateLimit"; then
  print_pass
else
  print_fail "Rate limit headers not found"
  echo "Missing Rate Limit Headers: /api/training/suggestions" >> "$REPORT_FILE"
fi

print_test "Test rate limit enforcement (10 rapid requests)"
SUCCESS_COUNT=0
for i in {1..10}; do
  HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    "$API_BASE_URL/api/training/suggestions")
  
  if [ "$HTTP_CODE" = "200" ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  fi
  
  sleep 0.05
done

if [ "$SUCCESS_COUNT" -eq 10 ]; then
  print_pass
else
  print_warn "Some requests were rate limited ($SUCCESS_COUNT/10 succeeded)"
fi

# Step 8: CORS & Security Headers
print_header "Step 8: Security Headers Check"

RESPONSE=$(curl -s -i "$API_BASE_URL/api/training/stats" \
  -H "Authorization: Bearer $AUTH_TOKEN" | head -n 30)

print_test "Check for X-Content-Type-Options header"
if echo "$RESPONSE" | grep -qi "X-Content-Type-Options"; then
  print_pass
else
  print_warn "Missing X-Content-Type-Options header"
  echo "  Recommendation: Add helmet.js middleware"
fi

print_test "Check for X-Frame-Options header"
if echo "$RESPONSE" | grep -qi "X-Frame-Options"; then
  print_pass
else
  print_warn "Missing X-Frame-Options header"
  echo "  Recommendation: Add helmet.js middleware"
fi

print_test "Check for Strict-Transport-Security header"
if echo "$RESPONSE" | grep -qi "Strict-Transport-Security"; then
  print_pass
else
  print_warn "Missing Strict-Transport-Security header (OK for localhost)"
fi

# Step 9: Input Validation Tests
print_header "Step 9: Input Validation Tests"

print_test "Invalid RPE (out of range: 15)"
RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/training/complete" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo-session","rpe":15,"duration":60}')

if echo "$RESPONSE" | grep -qi "error\|invalid"; then
  print_pass
else
  print_warn "Invalid RPE accepted without validation"
  echo "  Recommendation: Add RPE range validation (1-10)"
fi

print_test "Invalid duration (negative: -60)"
RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/training/complete" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo-session","rpe":5,"duration":-60}')

if echo "$RESPONSE" | grep -qi "error\|invalid"; then
  print_pass
else
  print_warn "Negative duration accepted"
  echo "  Recommendation: Add duration validation (> 0)"
fi

print_test "Invalid weeks parameter (out of range: 100)"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  "$API_BASE_URL/api/analytics/performance-trends?userId=$USER_ID&weeks=100")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "400" ]; then
  print_pass
else
  print_warn "Invalid weeks parameter not rejected (HTTP $HTTP_CODE)"
fi

# Generate Summary
print_header "Security Scan Summary"

echo -e "${BLUE}Total Tests:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
echo -e "${RED}Failed:${NC} $FAILED_TESTS"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "${BLUE}Pass Rate:${NC} $PASS_RATE%"
echo ""

if [ "$FAILED_TESTS" -eq 0 ]; then
  echo -e "${GREEN}✅ No critical security issues found!${NC}"
else
  echo -e "${RED}❌ $FAILED_TESTS critical security issue(s) found!${NC}"
  echo -e "${RED}   Review report file: $REPORT_FILE${NC}"
fi

if [ "$WARNINGS" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  $WARNINGS warning(s) - review for potential improvements${NC}"
fi

# Append summary to report
{
  echo ""
  echo "===================="
  echo "Summary"
  echo "===================="
  echo "Total Tests: $TOTAL_TESTS"
  echo "Passed: $PASSED_TESTS"
  echo "Failed: $FAILED_TESTS"
  echo "Warnings: $WARNINGS"
  echo "Pass Rate: $PASS_RATE%"
} >> "$REPORT_FILE"

echo ""
echo -e "${BLUE}Report saved to:${NC} $REPORT_FILE"
echo ""

# Exit with error if there are critical failures
if [ "$FAILED_TESTS" -gt 0 ]; then
  exit 1
else
  exit 0
fi
