#!/bin/bash
# Build Angular and emit runtime environment config
# Usage: ./scripts/build-angular.sh

set -e

echo "🔨 Building Angular application..."

if [ ! -d "angular" ]; then
  echo "❌ Error: angular directory not found. Run this script from project root."
  exit 1
fi

SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "⚠️  Warning: SUPABASE_URL or SUPABASE_ANON_KEY not set"
  echo "   The build will fall back to the canonical public Supabase project."
  echo "   Or set environment variables:"
  echo "   export SUPABASE_URL='your-url'"
  echo "   export SUPABASE_ANON_KEY='your-anon-key'"
fi

echo "🏗️  Building Angular..."
cd angular

if npm run build --configuration=production; then
  echo "✅ Angular build successful!"
  echo "📦 Output: angular/dist/flagfit-pro"
  cd ..
  node scripts/inject-env-into-html-angular.js
else
  echo "❌ Angular build failed"
  exit 1
fi

echo ""
echo "🎉 Build complete!"
echo ""
echo "Next steps:"
echo "  1. Deploy dist/flagfit-pro to your hosting platform"
echo "  2. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in production"
echo "  3. Or rely on the canonical fallback project configured in the app"
