#!/bin/bash
# ============================================================================
# Analyze !important usage patterns in Angular component SCSS files
# !important creates specificity wars and should only be used when absolutely necessary
# ============================================================================

set -e

echo "🔍 Analyzing !important usage patterns..."
echo ""

# Pattern 1: display: none !important (often fixable)
echo "📊 Pattern 1: display: none !important"
grep -r "display: none !important" src/app --include="*.scss" | wc -l | xargs echo "   Count:"

# Pattern 2: !important in button overrides
echo ""
echo "📊 Pattern 2: Button property overrides"
grep -r "!important" src/app/shared/components/button --include="*.scss" | wc -l | xargs echo "   Count:"

# Pattern 3: !important in PrimeNG overrides
echo ""
echo "📊 Pattern 3: PrimeNG component overrides"
grep -r ".p-.*!important" src/app --include="*.scss" | wc -l | xargs echo "   Count:"

# Pattern 4: Layout properties (width, height, padding, margin)
echo ""
echo "📊 Pattern 4: Layout property overrides"
grep -r -E "(width|height|padding|margin|gap):.*!important" src/app --include="*.scss" | wc -l | xargs echo "   Count:"

# Pattern 5: Transform/animation overrides
echo ""
echo "📊 Pattern 5: Transform/animation overrides"
grep -r -E "(transform|animation):.*!important" src/app --include="*.scss" | wc -l | xargs echo "   Count:"

# Pattern 6: Background/color overrides
echo ""
echo "📊 Pattern 6: Background/color overrides"
grep -r -E "(background|color):.*!important" src/app --include="*.scss" | wc -l | xargs echo "   Count:"

echo ""
echo "📋 Files with most !important usage:"
find src/app -name "*.scss" -type f -exec grep -l "!important" {} \; | xargs -I {} sh -c 'echo "$(grep -c "!important" "{}" || echo 0) {}"' | sort -rn | head -10

echo ""
echo "💡 Recommendations:"
echo "   1. Replace 'display: none !important' with proper CSS specificity"
echo "   2. Use CSS custom properties for dynamic values instead of !important"
echo "   3. Increase selector specificity instead of using !important"
echo "   4. Move third-party overrides to global vendor stylesheets"
