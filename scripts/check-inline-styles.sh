#!/usr/bin/env bash
# ============================================================
# Check Inline Styles in Templates
# ============================================================
# Checks HTML templates for inline style usage.
# Used in CI to fail on violations in changed files only.
#
# Usage:
#   ./scripts/check-inline-styles.sh [base_branch]
#   Default base_branch: main
#
# Exit codes:
#   0: No violations found
#   1: Violations found
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
echo "🔍 Checking inline styles in HTML templates"
echo "============================================"
echo ""

# Get changed HTML files
CHANGED_FILES=$("$SCRIPT_DIR/get-changed-files.sh" "$BASE_BRANCH" | rg -e '\.html$' || true)

if [ -z "$CHANGED_FILES" ]; then
  echo -e "${GREEN}✅ No HTML files changed${NC}"
  echo "   Skipping inline style check."
  exit 0
fi

# Convert space-separated to array
read -ra FILES_ARRAY <<< "$CHANGED_FILES"

echo -e "${BLUE}📋 Changed HTML files to check:${NC}"
for file in "${FILES_ARRAY[@]}"; do
  echo "   - $file"
done
echo ""

FAILED=0

# Check each file for inline style usage
for file in "${FILES_ARRAY[@]}"; do
  # Remove 'angular/' prefix if present
  RELATIVE_FILE="${file#angular/}"

  if [ ! -f "$RELATIVE_FILE" ]; then
    echo -e "${YELLOW}⚠️  File not found: $RELATIVE_FILE${NC}"
    continue
  fi

  echo -e "${BLUE}Checking: $RELATIVE_FILE${NC}"

  # style=, [style], or [ngStyle] are not allowed in templates
  VIOLATIONS=$(rg -n --pcre2 'style=|\\[style\\]=|\\[ngStyle\\]=' "$RELATIVE_FILE" 2>/dev/null || true)

  if [ -n "$VIOLATIONS" ]; then
    echo -e "${RED}❌ Inline style violations found in: $RELATIVE_FILE${NC}"
    echo "$VIOLATIONS" | while read -r line; do
      if [ -n "$line" ]; then
        echo "   Line $line"
      fi
    done
    echo ""
    echo "   Fix: Move styles into SCSS and use class bindings."
    FAILED=1
  else
    echo -e "${GREEN}✅ Passed: $RELATIVE_FILE${NC}"
  fi
  echo ""
done

# Summary
echo "============================================"
if [ $FAILED -eq 1 ]; then
  echo -e "${RED}❌ Inline style checks FAILED${NC}"
  echo ""
  echo "Violations found in changed HTML files."
  echo "Fix these violations before merging:"
  echo ""
  echo "1. Remove inline style attributes/bindings"
  echo "2. Move styles into component SCSS or global utilities"
  echo ""
  echo "See docs/DESIGN_SYSTEM_ENFORCEMENT.md for details."
  exit 1
else
  echo -e "${GREEN}✅ All changed HTML files pass inline style checks${NC}"
fi
echo "============================================"
