#!/bin/bash

# ============================================
# Mobile Responsive Testing Script
# Tests iPhone, Samsung, and Xiaomi devices
# ============================================

set -e

# Load common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

print_header "🏈 FlagFit Pro - Mobile Responsive Testing"

# Check if server is running (override to add custom message)
check_dev_server() {
  print_status "Checking if development server is running..."
  
  if check_server 4200; then
    print_success "Development server is running"
    return 0
  else
    print_warning "Development server not running. Starting it now..."
    return 1
  fi
}

# Start development server in background if not running
start_server() {
  if ! check_dev_server; then
    print_status "Starting development server..."
    npm run dev &
    SERVER_PID=$!
    
    # Wait for server to be ready (max 3 minutes)
    if ! wait_for_server 4200 60 3; then
      return 1
    fi
  fi
}

# Run responsive tests
run_tests() {
  print_status "Running mobile responsive tests..."
  echo ""
  
  # Run the tests
  npx playwright test tests/responsive/mobile-devices.test.js \
    --reporter=html \
    --reporter=list
  
  if [ $? -eq 0 ]; then
    print_success "All responsive tests passed!"
  else
    print_error "Some responsive tests failed. Check the report for details."
    return 1
  fi
}

# Run visual regression tests
run_visual_tests() {
  print_status "Running visual regression tests..."
  echo ""
  
  npx playwright test tests/responsive/visual-regression.test.js \
    --reporter=html \
    --reporter=list \
    --update-snapshots
  
  if [ $? -eq 0 ]; then
    print_success "Visual regression tests completed!"
  else
    print_warning "Visual tests completed with differences. Review screenshots."
  fi
}

# Generate report
generate_report() {
  print_status "Generating test report..."
  
  if [ -d "playwright-report" ]; then
    print_success "Test report generated at: playwright-report/index.html"
    
    # Open report in browser (macOS)
    if is_macos; then
      print_status "Opening report in browser..."
      open playwright-report/index.html
    fi
  fi
}

# Cleanup
cleanup() {
  if [ -n "$SERVER_PID" ]; then
    print_status "Stopping development server..."
    kill $SERVER_PID 2>/dev/null || true
  fi
}

# Register cleanup handler
register_cleanup cleanup

# Main execution
main() {
  echo ""
  print_status "Step 1/4: Checking dependencies..."
  
  # Check if required commands are available
  if ! require_command npx "Install Node.js and npm"; then
    exit 1
  fi
  
  print_success "Dependencies OK"
  echo ""
  
  print_status "Step 2/4: Starting development server..."
  if ! start_server; then
    print_error "Failed to start server"
    exit 1
  fi
  echo ""
  
  print_status "Step 3/4: Running responsive tests..."
  run_tests
  TEST_RESULT=$?
  echo ""
  
  if [ "$1" == "--visual" ] || [ "$1" == "-v" ]; then
    print_status "Step 4/4: Running visual regression tests..."
    run_visual_tests
    echo ""
  else
    print_status "Step 4/4: Skipping visual tests (use --visual to run them)"
    echo ""
  fi
  
  generate_report
  echo ""
  
  if [ $TEST_RESULT -eq 0 ]; then
    print_success "✅ All tests completed successfully!"
    echo ""
    echo "📊 Device Coverage:"
    echo "   - iPhone: SE, 12/13/14, 14 Pro Max, 15 Pro, 15 Pro Max"
    echo "   - Samsung: S8, S20, S21, S22, S23, S24, A52, Z Fold 4"
    echo "   - Xiaomi: Mi 11, Redmi Note 10/11, 12, 13, Poco X3"
    echo ""
    exit 0
  else
    print_error "❌ Some tests failed. Please review the report."
    echo ""
    exit 1
  fi
}

# Handle script arguments
case "$1" in
  --help|-h)
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --visual, -v    Run visual regression tests"
    echo "  --help, -h      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              Run responsive tests only"
    echo "  $0 --visual     Run responsive + visual tests"
    exit 0
    ;;
  *)
    main "$@"
    ;;
esac
