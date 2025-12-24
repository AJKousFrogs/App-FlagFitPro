#!/bin/bash
# CSS Consolidation Script
# Merges multiple CSS files into optimized bundles

set -e

echo "🎨 Starting CSS consolidation..."

# Create output directory
mkdir -p src/css/consolidated

# Consolidate component CSS
echo "📦 Consolidating component CSS..."
cat src/css/components/*.css > src/css/consolidated/components-bundle.css
echo "✅ Components: $(wc -l < src/css/consolidated/components-bundle.css) lines"

# Consolidate page CSS
echo "📦 Consolidating page CSS..."
cat src/css/pages/*.css > src/css/consolidated/pages-bundle.css
echo "✅ Pages: $(wc -l < src/css/consolidated/pages-bundle.css) lines"

# Consolidate theme CSS
echo "📦 Consolidating theme CSS..."
cat src/css/themes/*.css > src/css/consolidated/themes-bundle.css
echo "✅ Themes: $(wc -l < src/css/consolidated/themes-bundle.css) lines"

# Create main consolidated CSS
echo "📦 Creating main bundle..."
cat src/css/base.css \
    src/css/tokens.css \
    src/css/layout.css \
    src/css/utilities.css \
    src/css/z-index-system.css \
    src/css/animations.css \
    src/css/gradients.css \
    > src/css/consolidated/main-bundle.css
echo "✅ Main: $(wc -l < src/css/consolidated/main-bundle.css) lines"

# Calculate sizes
echo ""
echo "📊 Size comparison:"
echo "Before: $(du -sh src/css | cut -f1)"
echo "Bundles: $(du -sh src/css/consolidated | cut -f1)"

# Calculate savings
ORIGINAL_SIZE=$(find src/css -name "*.css" -not -path "*/consolidated/*" -exec cat {} \; | wc -c)
BUNDLE_SIZE=$(cat src/css/consolidated/*.css | wc -c)
SAVINGS=$((100 - (BUNDLE_SIZE * 100 / ORIGINAL_SIZE)))

echo ""
echo "✨ Consolidation complete!"
echo "💾 Space efficiency: ${SAVINGS}% reduction in HTTP requests"
echo ""
echo "Next steps:"
echo "1. Update HTML to use consolidated bundles"
echo "2. Run: npm run build"
echo "3. Test the application"

