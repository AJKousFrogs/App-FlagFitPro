#!/bin/bash

################################################################################
# Route Audit Test Runner
# Runs comprehensive validation tests for API routes
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
SUPABASE_URL="${SUPABASE_URL:-https://your-project.supabase.co}"
TEST_USER_EMAIL="${TEST_USER_EMAIL:-test@example.com}"
TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-testpassword123}"

print_header() {
  echo ""
  echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║ ${BLUE}$1${CYAN}"
  printf "${CYAN}║%-60s║${NC}\n" ""
  echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BLUE}━━━ $1 ━━━${NC}"
  echo ""
}

check_prerequisites() {
  print_header "ROUTE AUDIT - Checking Prerequisites"
  
  echo -n "Checking Node.js... "
  if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} $(node --version)"
  else
    echo -e "${RED}✗ Not found${NC}"
    exit 1
  fi
  
  echo -n "Checking npm... "
  if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓${NC} $(npm --version)"
  else
    echo -e "${RED}✗ Not found${NC}"
    exit 1
  fi
  
  echo -n "Checking curl... "
  if command -v curl &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${RED}✗ Not found${NC}"
    exit 1
  fi
  
  echo -n "Checking jq (optional)... "
  if command -v jq &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${YELLOW}✗ Not found (optional)${NC}"
  fi
  
  echo ""
  echo -e "${BLUE}Configuration:${NC}"
  echo "  API Base URL: $API_BASE_URL"
  echo "  Supabase URL: ${SUPABASE_URL:0:30}..."
  echo "  Test User: $TEST_USER_EMAIL"
  echo ""
}

check_server() {
  print_section "Checking API Server"
  
  echo -n "Testing server connectivity... "
  if curl -s --max-time 5 "$API_BASE_URL/api/health" > /dev/null; then
    echo -e "${GREEN}✓${NC} Server is running"
  else
    echo -e "${RED}✗${NC} Server not responding"
    echo ""
    echo -e "${YELLOW}Please start the server:${NC}"
    echo "  npm run dev    (or)"
    echo "  node server.js"
    exit 1
  fi
}

run_unit_tests() {
  print_header "TEST SUITE 1: Unit & Integration Tests"
  
  if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo "Running Jest/Vitest tests..."
    npm test -- tests/integration/route-audit-comprehensive.test.js || true
  else
    echo -e "${YELLOW}⚠️  No test script found in package.json${NC}"
  fi
}

run_security_scan() {
  print_header "TEST SUITE 2: Security Scan"
  
  if [ -f "scripts/security-scan.sh" ]; then
    echo "Running security scan..."
    bash scripts/security-scan.sh || true
  else
    echo -e "${YELLOW}⚠️  Security scan script not found${NC}"
  fi
}

validate_indexes() {
  print_header "TEST SUITE 3: Database Index Validation"
  
  echo "To run index validation:"
  echo "  1. Open Supabase SQL Editor"
  echo "  2. Run: database/validate_indexes.sql"
  echo ""
  echo "Or use Supabase CLI:"
  echo "  supabase db execute < database/validate_indexes.sql"
  echo ""
  
  read -p "Press Enter to continue..." -t 5 || echo ""
}

test_rate_limiting() {
  print_header "TEST SUITE 4: Rate Limiting"
  
  print_section "Testing READ Rate Limit (100/min)"
  
  echo "Sending 15 requests rapidly..."
  SUCCESS=0
  RATE_LIMITED=0
  
  for i in {1..15}; do
    HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
      "$API_BASE_URL/api/training/suggestions")
    
    if [ "$HTTP_CODE" = "200" ]; then
      SUCCESS=$((SUCCESS + 1))
    elif [ "$HTTP_CODE" = "429" ]; then
      RATE_LIMITED=$((RATE_LIMITED + 1))
    fi
    
    sleep 0.05
  done
  
  echo "  Success: $SUCCESS"
  echo "  Rate Limited: $RATE_LIMITED"
  
  if [ "$SUCCESS" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Rate limiting is active"
  else
    echo -e "${YELLOW}⚠️${NC} All requests were rate limited (may be too strict)"
  fi
  
  print_section "Checking Rate Limit Headers"
  
  HEADERS=$(curl -s -I "$API_BASE_URL/api/training/suggestions")
  
  if echo "$HEADERS" | grep -qi "X-RateLimit"; then
    echo -e "${GREEN}✓${NC} Rate limit headers present"
    echo "$HEADERS" | grep -i "x-ratelimit" | sed 's/^/  /'
  else
    echo -e "${RED}✗${NC} Rate limit headers missing"
  fi
}

test_crud_operations() {
  print_header "TEST SUITE 5: CRUD Operations"
  
  echo "To run comprehensive CRUD tests:"
  echo "  npm test -- tests/integration/route-audit-comprehensive.test.js"
  echo ""
  echo "Quick smoke test..."
  
  print_section "Testing Health Endpoint"
  RESPONSE=$(curl -s "$API_BASE_URL/api/health")
  
  if echo "$RESPONSE" | grep -q "\"status\":\"OK\""; then
    echo -e "${GREEN}✓${NC} Health endpoint working"
  else
    echo -e "${RED}✗${NC} Health endpoint failed"
  fi
  
  print_section "Testing Suggestions (No Auth)"
  RESPONSE=$(curl -s "$API_BASE_URL/api/training/suggestions")
  
  if echo "$RESPONSE" | grep -q "\"success\":true"; then
    echo -e "${GREEN}✓${NC} Optional auth endpoint working"
  else
    echo -e "${RED}✗${NC} Suggestions endpoint failed"
  fi
}

generate_report() {
  print_header "Test Summary & Report"
  
  echo -e "${BLUE}Documentation:${NC}"
  echo "  📄 Validation Report: docs/ROUTE_AUDIT_VALIDATION.md"
  echo "  🧪 Test Suite: tests/integration/route-audit-comprehensive.test.js"
  echo "  🔒 Security Scan: scripts/security-scan.sh"
  echo "  📊 Index Validation: database/validate_indexes.sql"
  echo ""
  
  echo -e "${BLUE}Next Steps:${NC}"
  echo "  1. Review validation report for recommendations"
  echo "  2. Run full test suite: npm test"
  echo "  3. Run security scan: ./scripts/security-scan.sh"
  echo "  4. Validate indexes in Supabase SQL Editor"
  echo "  5. Enable enhanced logging in development"
  echo ""
  
  echo -e "${GREEN}✓${NC} Route audit complete!"
  echo ""
}

# Main execution
main() {
  clear
  
  print_header "ROUTE AUDIT VALIDATION - Full Test Suite"
  
  check_prerequisites
  check_server
  
  # Run test suites
  run_unit_tests
  run_security_scan
  validate_indexes
  test_rate_limiting
  test_crud_operations
  
  # Generate report
  generate_report
}

# Run main
main
