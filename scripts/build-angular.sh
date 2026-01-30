#!/bin/bash
# Build Angular with environment variable injection
# Usage: ./scripts/build-angular.sh

set -e

echo "🔨 Building Angular application..."

# Check if we're in the project root
if [ ! -d "angular" ]; then
  echo "❌ Error: angular directory not found. Run this script from project root."
  exit 1
fi

# Get environment variables (with defaults)
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDI4OTksImV4cCI6MjA4NTA3ODg5OX0.63Do5rUEHBT7-pZEXzFFHB5LqFRaXWAt-YrH2v45vo0"

# Check if environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "⚠️  Warning: SUPABASE_URL or SUPABASE_ANON_KEY not set"
  echo "   Using empty values - ensure environment.prod.ts has correct values"
  echo "   Or set environment variables:"
  echo "   export SUPABASE_URL='your-url'"
  echo "   export SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDI4OTksImV4cCI6MjA4NTA3ODg5OX0.63Do5rUEHBT7-pZEXzFFHB5LqFRaXWAt-YrH2v45vo0'"
fi

# Create backup of environment.prod.ts
ENV_FILE="angular/src/environments/environment.prod.ts"
if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "${ENV_FILE}.bak"
  echo "✅ Created backup: ${ENV_FILE}.bak"
fi

# Replace placeholders if environment variables are set
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_ANON_KEY" ]; then
  echo "📝 Injecting environment variables..."
  
  # Use sed to replace empty strings with actual values
  # Note: This is a simple approach - for production, consider using Angular's file replacement
  sed -i.tmp "s|url: ''|url: '${SUPABASE_URL}'|g" "$ENV_FILE"
  sed -i.tmp "s|anonKey: ''|anonKey: '${SUPABASE_ANON_KEY}'|g" "$ENV_FILE"
  
  # Clean up temp file
  rm -f "${ENV_FILE}.tmp"
  
  echo "✅ Environment variables injected"
else
  echo "⚠️  Skipping environment variable injection (not set)"
  echo "   Make sure environment.prod.ts has correct values or use file replacement"
fi

# Build Angular
echo "🏗️  Building Angular..."
cd angular

if npm run build --configuration=production; then
  echo "✅ Angular build successful!"
  echo "📦 Output: angular/dist/flagfit-pro"
else
  echo "❌ Angular build failed"
  
  # Restore backup if build failed
  if [ -f "../${ENV_FILE}.bak" ]; then
    mv "../${ENV_FILE}.bak" "../${ENV_FILE}"
    echo "✅ Restored environment.prod.ts from backup"
  fi
  
  exit 1
fi

# Restore original environment.prod.ts from backup
if [ -f "../${ENV_FILE}.bak" ]; then
  mv "../${ENV_FILE}.bak" "../${ENV_FILE}"
  echo "✅ Restored original environment.prod.ts"
fi

echo ""
echo "🎉 Build complete!"
echo ""
echo "Next steps:"
echo "  1. Deploy dist/flagfit-pro to your hosting platform"
echo "  2. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in production"
echo "  3. Or configure Angular file replacement for automatic injection"

