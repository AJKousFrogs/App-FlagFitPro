#!/bin/bash

# ============================================
# Mobile Responsive Testing Script
# Tests iPhone, Samsung, and Xiaomi devices
# ============================================

set -e

echo "🏈 FlagFit Pro - Mobile Responsive Testing"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if server is running
check_server() {
  print_status "Checking if development server is running..."
  
  if curl -s http://localhost:4200 > /dev/null; then
    print_success "Development server is running"
    return 0
  else
    print_warning "Development server not running. Starting it now..."
    return 1
  fi
}

# Start development server in background if not running
start_server() {
  if ! check_server; then
    print_status "Starting development server..."
    npm run dev &
    SERVER_PID=$!
    
    # Wait for server to be ready (max 3 minutes)
    print_status "Waiting for server to be ready..."
    for i in {1..60}; do
      if curl -s http://localhost:4200 > /dev/null; then
        print_success "Server is ready!"
        return 0
      fi
      sleep 3
    done
    
    print_error "Server failed to start within 3 minutes"
    return 1
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
    if [[ "$OSTYPE" == "darwin"* ]]; then
      print_status "Opening report in browser..."
      open playwright-report/index.html
    fi
  fi
}

# Cleanup
cleanup() {
  if [ ! -z "$SERVER_PID" ]; then
    print_status "Stopping development server..."
    kill $SERVER_PID 2>/dev/null || true
  fi
}

# Trap cleanup on exit
trap cleanup EXIT

# Main execution
main() {
  echo ""
  print_status "Step 1/4: Checking dependencies..."
  
  # Check if playwright is installed
  if ! command -v npx &> /dev/null; then
    print_error "npx not found. Please install Node.js and npm"
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
