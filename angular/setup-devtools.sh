#!/bin/bash

# Angular DevTools + Debug Setup Script
# This script sets up the development environment for debugging Angular signals and effects

set -e  # Exit on error

echo "🔧 Setting up Angular DevTools + Debug Environment..."
echo ""

# Check if we're in the angular directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in Angular project directory"
    echo "Please run this script from the angular/ directory"
    exit 1
fi

echo "✅ Found Angular project"
echo ""

# Check Node version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "⚠️  Warning: Node.js version should be >= 22.0.0"
    echo "Current version: $(node --version)"
    echo "Consider upgrading: https://nodejs.org/"
    echo ""
else
    echo "✅ Node.js version: $(node --version)"
    echo ""
fi

# Check if build is successful
echo "🏗️  Building project to verify setup..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build successful"
    echo ""
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi

# Check if dev server is running
echo "🔍 Checking if dev server is running..."
if lsof -i:4200 > /dev/null 2>&1; then
    echo "✅ Dev server is already running on port 4200"
    echo ""
else
    echo "ℹ️  Dev server is not running"
    echo "Start it with: npm start"
    echo ""
fi

# Print setup summary
echo "═══════════════════════════════════════════════════════════"
echo "✅ Angular DevTools + Debug Setup Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📚 Next Steps:"
echo ""
echo "1. Install Angular DevTools Browser Extension:"
echo "   Chrome:  https://chrome.google.com/webstore/detail/ienfalfjdbdpebioblfackkekamfmbnh"
echo "   Firefox: https://addons.mozilla.org/en-US/firefox/addon/angular-devtools/"
echo "   Edge:    https://microsoftedge.microsoft.com/addons/detail/ienfalfjdbdpebioblfackkekamfmbnh"
echo ""
echo "2. Start the dev server (if not already running):"
echo "   npm start"
echo ""
echo "3. Open your browser to: http://localhost:4200"
echo ""
echo "4. Open DevTools (F12 or Cmd+Option+I)"
echo ""
echo "5. Look for the 'Angular' tab in DevTools"
echo ""
echo "6. Open the Console tab and type:"
echo "   window.angularDebug"
echo ""
echo "7. Read the guides:"
echo "   - DEBUGGING_GUIDE.md (comprehensive guide)"
echo "   - DEVTOOLS_QUICK_REFERENCE.md (quick reference)"
echo ""
echo "📊 Debug Utilities Available:"
echo ""
echo "  window.angularDebug.getSignalLogs()  - View signal updates"
echo "  window.angularDebug.getEffectLogs()  - View effect executions"
echo "  window.angularDebug.getApiLogs()     - View API calls"
echo "  window.angularDebug.clearLogs()      - Clear all logs"
echo "  window.angularDebug.setConfig({...}) - Configure debug service"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Happy Debugging! 🎉"
echo "═══════════════════════════════════════════════════════════"
