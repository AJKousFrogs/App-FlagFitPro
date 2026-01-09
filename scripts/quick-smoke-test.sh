#!/bin/bash

# Quick Smoke Test Runner
# Simplified version for rapid manual testing
# Executes core flow 10 times for quick validation

set -e

BASE_URL="${BASE_URL:-http://localhost:4200}"
TRIALS="${TRIALS:-10}"

echo "=================================================="
echo "🚀 Quick Smoke Test"
echo "=================================================="
echo "Base URL: $BASE_URL"
echo "Trials: $TRIALS"
echo ""

# Check if server is running
if ! curl -s "$BASE_URL" > /dev/null; then
    echo "❌ Server not reachable at $BASE_URL"
    echo "Start the dev server first:"
    echo "  npm run dev:angular-only"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Run quick smoke test with Playwright
cd angular
npx playwright test e2e/quick-smoke-test.spec.ts \
    --workers=1 \
    --reporter=list

echo ""
echo "=================================================="
echo "Quick smoke test complete!"
echo "=================================================="
