#!/bin/bash

# Cleanup script for unused dependencies
# Run this from project root

echo "🧹 Removing unused dependencies..."

# Remove unused production dependencies
npm uninstall bcryptjs

# Remove unused dev dependencies
npm uninstall -D jws

echo "✅ Unused dependencies removed"

# Optional: Add missing dependencies
echo ""
echo "📦 Would you like to install missing dependencies? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Installing missing dependencies..."
    npm install -D @testing-library/jest-dom vitest esbuild esbuild-visualizer sharp
    npm install chalk web-push
    echo "✅ Missing dependencies installed"
fi

echo ""
echo "🎉 Dependency cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm audit' to check for vulnerabilities"
echo "2. Run 'npm outdated' to check for updates"
echo "3. Test the application to ensure nothing broke"
