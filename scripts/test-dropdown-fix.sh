#!/bin/bash

# Quick test for dropdown z-index fix on iPhone 12 Pro

echo "🏈 Testing Dropdown Z-Index Fix on iPhone 12 Pro"
echo "================================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:4200 > /dev/null; then
  echo "⚠️  Development server not running!"
  echo "   Start it with: npm run dev"
  exit 1
fi

echo "✅ Server is running"
echo ""
echo "Running dropdown z-index tests..."
echo ""

# Run the specific dropdown test
npx playwright test tests/responsive/dropdown-zindex.test.js \
  --grep "iPhone 12 Pro" \
  --reporter=list

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ All dropdown z-index tests passed on iPhone 12 Pro!"
  echo ""
  echo "📊 What was tested:"
  echo "  ✓ Dropdown appears above form content"
  echo "  ✓ Dropdown fits within viewport"
  echo "  ✓ Dropdown is accessible via touch"
  echo "  ✓ No content overlap"
  echo "  ✓ Keyboard handling works"
  echo ""
  echo "🎉 The dropdown issue is FIXED!"
else
  echo ""
  echo "❌ Some tests failed. Check the output above."
  exit 1
fi
