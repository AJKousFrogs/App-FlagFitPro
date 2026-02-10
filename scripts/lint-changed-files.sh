#!/usr/bin/env bash
# ============================================================
# Lint Changed Files Script
# ============================================================
# Lints only changed SCSS/CSS files with strict enforcement.
# Used in CI to fail on violations in changed files only.
#
# Usage:
#   ./scripts/lint-changed-files.sh [base_branch]
#   Default base_branch: main
#
# Exit codes:
#   0: All changed files pass linting
#   1: One or more changed files have violations
# ============================================================

set -euo pipefail

BASE_BRANCH="${1:-main}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd "$PROJECT_ROOT"

echo "============================================"
echo "🔍 Design System: Changed Files Enforcement"
echo "============================================"
echo ""

# Get changed files (SCSS/CSS/HTML)
CHANGED_FILES=$("$SCRIPT_DIR/get-changed-files.sh" "$BASE_BRANCH")

if [ -z "$CHANGED_FILES" ]; then
  echo -e "${GREEN}✅ No SCSS/CSS/HTML files changed${NC}"
  echo "   Skipping linting."
  exit 0
fi

# Convert space-separated to array
read -ra FILES_ARRAY <<< "$CHANGED_FILES"

# Separate SCSS/CSS files from HTML files
SCSS_FILES=()
HTML_FILES=()

for file in "${FILES_ARRAY[@]}"; do
  if [[ "$file" == *.scss || "$file" == *.css ]]; then
    SCSS_FILES+=("$file")
  elif [[ "$file" == *.html ]]; then
    HTML_FILES+=("$file")
  fi
done

echo -e "${BLUE}📋 Changed files to lint:${NC}"
for file in "${SCSS_FILES[@]}"; do
  echo "   - $file (SCSS/CSS)"
done
for file in "${HTML_FILES[@]}"; do
  echo "   - $file (HTML)"
done
echo ""

FAILED=0

# ============================================================
# Step 1: Check HTML files for [rounded]="true"
# ============================================================
if [ ${#HTML_FILES[@]} -gt 0 ]; then
  echo -e "${BLUE}🔍 Checking HTML files for [rounded]=\"true\"...${NC}"
  echo ""
  
  if ! bash "$SCRIPT_DIR/check-rounded-attribute.sh" "$BASE_BRANCH"; then
    FAILED=1
  fi
  echo ""
fi

# ============================================================
# Step 1.25: Check HTML files for inline styles
# ============================================================
if [ ${#HTML_FILES[@]} -gt 0 ]; then
  echo -e "${BLUE}🔍 Checking HTML files for inline styles...${NC}"
  echo ""

  if ! bash "$SCRIPT_DIR/check-inline-styles.sh" "$BASE_BRANCH"; then
    FAILED=1
  fi
  echo ""
fi

# ============================================================
# Step 1.5: Check SCSS files for PrimeNG .p-* selectors
# ============================================================
if [ ${#SCSS_FILES[@]} -gt 0 ]; then
  echo -e "${BLUE}🔍 Checking SCSS files for PrimeNG .p-* selectors...${NC}"
  echo ""
  
  if ! bash "$SCRIPT_DIR/check-primeng-selectors.sh" "$BASE_BRANCH"; then
    FAILED=1
  fi
  echo ""
fi

# ============================================================
# Step 2: Run stylelint on SCSS/CSS files
# ============================================================
if [ ${#SCSS_FILES[@]} -gt 0 ]; then
  echo -e "${BLUE}🔍 Running stylelint (strict mode)...${NC}"
  echo ""
  
  # Change to angular directory for stylelint
  cd "$PROJECT_ROOT/angular"
  
  # Run stylelint on each file individually to get clear error messages
  for file in "${SCSS_FILES[@]}"; do
    # Remove 'angular/' prefix if present
    RELATIVE_FILE="${file#angular/}"
    
    if [ ! -f "$RELATIVE_FILE" ]; then
      echo -e "${YELLOW}⚠️  File not found: $RELATIVE_FILE${NC}"
      continue
    fi
    
    echo -e "${BLUE}Checking: $RELATIVE_FILE${NC}"
    
    # Run stylelint with error severity (strict mode)
    if ! npx stylelint "$RELATIVE_FILE" --config ../stylelint.config.js --formatter verbose; then
      echo -e "${RED}❌ Violations found in: $RELATIVE_FILE${NC}"
      FAILED=1
    else
      echo -e "${GREEN}✅ Passed: $RELATIVE_FILE${NC}"
    fi
    echo ""
  done
fi

# Summary
echo "============================================"
if [ $FAILED -eq 1 ]; then
  echo -e "${RED}❌ Design system checks FAILED${NC}"
  echo ""
  echo "Violations found in changed files."
  echo "Fix these violations before merging:"
  echo ""
  echo "1. Run: npm run lint:css:fix"
  echo "2. Or manually fix violations using:"
  echo "   - Replace hex colors with var(--ds-*) tokens"
  echo "   - Replace raw spacing (px/rem) with var(--space-*) tokens"
  echo "   - Remove PrimeNG overrides (.p-*) from component SCSS"
  echo "   - Remove !important (or move to @layer overrides with ticket)"
  echo ""
  echo "See docs/DESIGN_SYSTEM_ENFORCEMENT.md for details."
  exit 1
else
  echo -e "${GREEN}✅ All changed files pass design system checks${NC}"
  echo "   Legacy files are tolerated, but changed files must be compliant."
fi
echo "============================================"

