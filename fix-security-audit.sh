#!/bin/bash

# Fix jws security vulnerability
echo "🔐 Fixing jws security vulnerability..."

# Navigate to project root
cd "$(dirname "$0")"

# Remove package-lock.json to force regeneration with overrides
echo "📦 Removing package-lock.json..."
rm -f package-lock.json

# Reinstall dependencies with overrides
echo "📥 Reinstalling dependencies..."
npm install --legacy-peer-deps

# Verify the fix
echo ""
echo "✅ Installation complete. Running security audit..."
npm audit --audit-level high

echo ""
echo "🎉 Security audit fix complete!"

