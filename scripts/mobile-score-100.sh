#!/bin/bash

# ================================================================
# Quick Path to Mobile Score 100/100
# ================================================================
# This script automates the setup for the final 5 points
# Run from project root: ./scripts/mobile-score-100.sh
# ================================================================

set -e

echo "🎯 Mobile Score 100/100 - Quick Setup"
echo "======================================"
echo ""

# Navigate to Angular directory
cd angular

# Step 1: Add Angular PWA (+2 points)
echo "📱 Step 1/3: Adding Angular PWA..."
ng add @angular/pwa --project flagfit-pro --skip-confirmation || {
    echo "❌ PWA setup failed. Run manually: cd angular && ng add @angular/pwa"
    exit 1
}
echo "✅ PWA added successfully (+2 points)"
echo ""

# Step 2: Create app icons (+PWA requirement)
echo "🎨 Step 2/3: Setting up app icons..."
mkdir -p angular/src/assets/icons
echo "⚠️  Manual step required: Add app icons to angular/src/assets/icons/"
echo "   Required sizes: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512"
echo "   You can use: https://favicon.io/favicon-converter/ or similar tool"
echo ""

# Step 3: Configure service worker caching
echo "⚙️  Step 3/3: Configuring service worker..."
cat > ngsw-config.json << 'EOF'
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(eot|svg|cur|jpg|png|webp|gif|otf|ttf|woff|woff2|ani)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api-fresh",
      "urls": [
        "https://*.supabase.co/rest/**",
        "https://*.supabase.co/auth/**"
      ],
      "cacheConfig": {
        "maxSize": 100,
        "maxAge": "1h",
        "timeout": "10s",
        "strategy": "freshness"
      }
    },
    {
      "name": "api-performance",
      "urls": [
        "https://*.supabase.co/storage/**"
      ],
      "cacheConfig": {
        "maxSize": 50,
        "maxAge": "1d",
        "strategy": "performance"
      }
    }
  ]
}
EOF
echo "✅ Service worker configured"
echo ""

# Step 4: Build and test
echo "🏗️  Building production bundle..."
npm run build -- --configuration production || {
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
}
echo "✅ Build successful"
echo ""

echo "🎉 PWA Setup Complete!"
echo ""
echo "Next Steps:"
echo "==========="
echo "1. Add app icons to angular/src/assets/icons/"
echo "2. Test PWA: cd angular && npx http-server dist/flagfit-pro/browser -p 8080"
echo "3. Open Chrome: http://localhost:8080"
echo "4. Check for install prompt (should appear)"
echo "5. Test offline mode (disconnect network)"
echo "6. Run Lighthouse: lighthouse http://localhost:8080 --view"
echo ""
echo "Expected Score: 97-98/100 (after icons are added)"
echo ""
echo "For full 100/100, complete:"
echo "- Image optimization (see MOBILE_SCORE_100_ROADMAP.md)"
echo "- Performance tuning (see MOBILE_SCORE_100_ROADMAP.md)"
echo ""
echo "✨ You're almost there!"
