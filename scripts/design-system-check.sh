#!/usr/bin/env bash
# ============================================================
# Design System Enforcement Script
# ============================================================
# Enforces DESIGN_SYSTEM_RULES.md decisions via grep checks.
# Run as part of CI or pre-commit.
#
# Usage: npm run lint:ds
# ============================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

FAILED=0

# ============================================================
# Decision 0: Generated CSS outputs must be bannered
# ============================================================
CSS_ROOT="$(dirname "$0")/../src/css"
BANNER="/* GENERATED FILE - DO NOT EDIT."

if [ -d "$CSS_ROOT" ]; then
  echo "📋 Decision 0: Checking generated CSS banner in src/css..."
  MISSING_BANNER=0
  while IFS= read -r -d '' file; do
    first_line="$(head -n 1 "$file" || true)"
    if [[ "$first_line" != "$BANNER"* ]]; then
      echo -e "${RED}❌ Missing generated banner: ${file}${NC}"
      MISSING_BANNER=1
    fi
  done < <(find "$CSS_ROOT" -type f -name "*.css" -print0)

  if [ "$MISSING_BANNER" -eq 1 ]; then
    echo -e "${YELLOW}   Fix: Run npm run sass:compile${NC}"
    FAILED=1
  else
    echo -e "${GREEN}   ✓ Generated CSS banners present${NC}"
  fi
  echo ""
fi

# Paths (relative to angular/ directory)
TOKENS="src/scss/tokens/design-system-tokens.scss"
OVERRIDES_DIR="src/assets/styles/overrides"
PRIMENG_DIR="src/scss/components/primeng"

# Change to angular directory
cd "$(dirname "$0")/../angular"

echo "============================================"
echo "🔍 Design System Enforcement Checks"
echo "============================================"
echo ""

# ============================================================
# Decision 1: Hex colors only in tokens file
# ============================================================
echo "📋 Decision 1: Checking for hex colors outside tokens..."

HEX=$(grep -RIn \
  --include="*.scss" \
  --include="*.css" \
  --exclude-dir=node_modules \
  --exclude-dir=.angular \
  --exclude-dir=dist \
  -E "#[0-9a-fA-F]{3,8}\b" src \
  | grep -v "design-system-tokens.scss" \
  | grep -v "// allowed:" \
  | grep -v "/* allowed:" \
  || true)

if [ -n "$HEX" ]; then
  echo -e "${RED}❌ Hex colors found outside tokens file:${NC}"
  echo "$HEX" | head -20
  HEX_COUNT=$(echo "$HEX" | wc -l | tr -d ' ')
  echo ""
  echo -e "${YELLOW}   Total: $HEX_COUNT violations${NC}"
  echo "   Fix: Replace with var(--token-name)"
  FAILED=1
else
  echo -e "${GREEN}   ✓ No hex colors outside tokens${NC}"
fi
echo ""

# ============================================================
# Decision 7: !important only in overrides
# ============================================================
echo "📋 Decision 7: Checking for !important outside overrides..."

IMPORTANT=$(grep -RIn \
  --include="*.scss" \
  --include="*.css" \
  --exclude-dir=node_modules \
  --exclude-dir=.angular \
  --exclude-dir=dist \
  --exclude-dir=overrides \
  "!important" src \
  | grep -v "// exception:" \
  | grep -v "/* exception:" \
  || true)

if [ -n "$IMPORTANT" ]; then
  echo -e "${YELLOW}⚠️  !important found outside overrides:${NC}"
  echo "$IMPORTANT" | head -20
  IMP_COUNT=$(echo "$IMPORTANT" | wc -l | tr -d ' ')
  echo ""
  echo -e "${YELLOW}   Total: $IMP_COUNT violations${NC}"
  echo "   Fix: Move to @layer overrides with exception template"
  # Warning only, not blocking
else
  echo -e "${GREEN}   ✓ No !important outside overrides${NC}"
fi
echo ""

# ============================================================
# Decision 19: No transition: all
# ============================================================
echo "📋 Decision 19: Checking for transition: all..."

TRANS_ALL=$(grep -RIn \
  --include="*.scss" \
  --include="*.css" \
  --exclude-dir=node_modules \
  --exclude-dir=.angular \
  --exclude-dir=dist \
  -E "transition:\s*all" src \
  || true)

if [ -n "$TRANS_ALL" ]; then
  echo -e "${RED}❌ transition: all found:${NC}"
  echo "$TRANS_ALL" | head -20
  TRANS_COUNT=$(echo "$TRANS_ALL" | wc -l | tr -d ' ')
  echo ""
  echo -e "${YELLOW}   Total: $TRANS_COUNT violations${NC}"
  echo "   Fix: Specify exact properties (e.g., transition: background-color var(--motion-fast))"
  FAILED=1
else
  echo -e "${GREEN}   ✓ No transition: all${NC}"
fi
echo ""

# ============================================================
# Decision 23: No imports from generated src/css
# ============================================================
echo "📋 Decision 23: Checking for imports from src/css..."

GENERATED_IMPORTS=$(grep -RIn \
  --include="*.scss" \
  --include="*.css" \
  --include="*.ts" \
  --include="*.html" \
  --exclude-dir=node_modules \
  --exclude-dir=.angular \
  --exclude-dir=dist \
  -E "src/css/" src \
  || true)

if [ -n "$GENERATED_IMPORTS" ]; then
  echo -e "${RED}❌ Imports from generated src/css found:${NC}"
  echo "$GENERATED_IMPORTS" | head -20
  GEN_COUNT=$(echo "$GENERATED_IMPORTS" | wc -l | tr -d ' ')
  echo ""
  echo -e "${YELLOW}   Total: $GEN_COUNT violations${NC}"
  echo "   Fix: Import SCSS sources instead (styles.scss or scss entrypoints)"
  FAILED=1
else
  echo -e "${GREEN}   ✓ No imports from generated src/css${NC}"
fi
echo ""

# ============================================================
# Decision 22: ::ng-deep fully removed (January 2026)
# ============================================================
echo "📋 Decision 22: Checking for ::ng-deep usage..."

# Only check for actual ::ng-deep usage, not comments mentioning it
NG_DEEP=$(grep -RIn \
  --include="*.scss" \
  --include="*.css" \
  --include="*.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=.angular \
  --exclude-dir=dist \
  -E "^\s+::ng-deep|^\s+:host\s+::ng-deep" src \
  || true)

if [ -n "$NG_DEEP" ]; then
  echo -e "${RED}❌ ::ng-deep usage found (should be fully removed):${NC}"
  echo "$NG_DEEP" | head -20
  NG_COUNT=$(echo "$NG_DEEP" | wc -l | tr -d ' ')
  echo ""
  echo -e "${RED}   Total: $NG_COUNT violations${NC}"
  echo "   Fix: Use ViewEncapsulation.None or CSS custom properties"
  FAILED=1
else
  echo -e "${GREEN}   ✓ No ::ng-deep usage (fully removed from codebase)${NC}"
fi
echo ""

# ============================================================
# Decision 16: .p-* classes only in primeng folder
# ============================================================
echo "📋 Decision 16: Checking for .p-* selectors outside primeng folder..."

P_CLASSES=$(grep -RIn \
  --include="*.scss" \
  --exclude-dir=node_modules \
  --exclude-dir=.angular \
  --exclude-dir=dist \
  --exclude-dir=primeng \
  --exclude-dir=overrides \
  -E "\.p-[a-z]+" src/app \
  | grep -v "// allowed:" \
  | grep -v "/* allowed:" \
  || true)

if [ -n "$P_CLASSES" ]; then
  echo -e "${YELLOW}⚠️  .p-* PrimeNG selectors found in feature SCSS:${NC}"
  echo "$P_CLASSES" | head -20
  P_COUNT=$(echo "$P_CLASSES" | wc -l | tr -d ' ')
  echo ""
  echo -e "${YELLOW}   Total: $P_COUNT violations${NC}"
  echo "   Fix: Move PrimeNG overrides to primeng/ folder or use component inputs"
  # Warning only
else
  echo -e "${GREEN}   ✓ No .p-* selectors in feature SCSS${NC}"
fi
echo ""

# ============================================================
# Decision 56: No hardcoded font-family
# ============================================================
echo "📋 Decision 56: Checking for hardcoded font-family..."

FONT_FAMILY=$(grep -RIn \
  --include="*.scss" \
  --include="*.css" \
  --exclude-dir=node_modules \
  --exclude-dir=.angular \
  --exclude-dir=dist \
  -E "font-family:\s*['\"]?(Poppins|Arial|Helvetica|sans-serif)" src \
  | grep -v "design-system-tokens.scss" \
  | grep -v "var(--font" \
  || true)

if [ -n "$FONT_FAMILY" ]; then
  echo -e "${YELLOW}⚠️  Hardcoded font-family found:${NC}"
  echo "$FONT_FAMILY" | head -20
  FONT_COUNT=$(echo "$FONT_FAMILY" | wc -l | tr -d ' ')
  echo ""
  echo -e "${YELLOW}   Total: $FONT_COUNT violations${NC}"
  echo "   Fix: Use var(--font-family-sans) or var(--font-family-mono)"
  # Warning only
else
  echo -e "${GREEN}   ✓ No hardcoded font-family${NC}"
fi
echo ""

# ============================================================
# Summary
# ============================================================
echo "============================================"
if [ $FAILED -eq 1 ]; then
  echo -e "${RED}❌ Design system checks FAILED${NC}"
  echo "   Fix the errors above before merging."
  exit 1
else
  echo -e "${GREEN}✅ Design system checks PASSED${NC}"
  echo "   (Warnings should be addressed but don't block merge)"
fi
echo "============================================"
