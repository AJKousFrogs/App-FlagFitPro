#!/usr/bin/env bash
# ============================================================
# Check PrimeNG Selectors Script
# ============================================================
# Checks SCSS files for forbidden .p-* PrimeNG selectors.
# Used in CI to fail on violations in changed files only.
#
# Usage:
#   ./scripts/check-primeng-selectors.sh [base_branch]
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
echo "🔍 Checking PrimeNG .p-* Selectors"
echo "============================================"
echo ""

# Get changed SCSS files
CHANGED_FILES=$("$SCRIPT_DIR/get-changed-files.sh" "$BASE_BRANCH" | grep -E '\.(scss|css)$' || true)

if [ -z "$CHANGED_FILES" ]; then
  echo -e "${GREEN}✅ No SCSS/CSS files changed${NC}"
  echo "   Skipping PrimeNG selector check."
  exit 0
fi

# Convert space-separated to array
read -ra FILES_ARRAY <<< "$CHANGED_FILES"

echo -e "${BLUE}📋 Changed SCSS/CSS files to check:${NC}"
for file in "${FILES_ARRAY[@]}"; do
  echo "   - $file"
done
echo ""

FAILED=0

# Allowed files (where .p-* selectors are permitted)
ALLOWED_PATTERNS=(
  "primeng/"
  "overrides/"
  "design-system-tokens.scss"
)

# Check each file for .p-* selectors
for file in "${FILES_ARRAY[@]}"; do
  # Remove 'angular/' prefix if present
  RELATIVE_FILE="${file#angular/}"
  
  if [ ! -f "$RELATIVE_FILE" ]; then
    echo -e "${YELLOW}⚠️  File not found: $RELATIVE_FILE${NC}"
    continue
  fi
  
  # Skip if file is in allowed location
  SKIP_FILE=0
  for pattern in "${ALLOWED_PATTERNS[@]}"; do
    if [[ "$RELATIVE_FILE" == *"$pattern"* ]]; then
      SKIP_FILE=1
      break
    fi
  done
  
  if [ $SKIP_FILE -eq 1 ]; then
    echo -e "${GREEN}✅ Skipped (allowed location): $RELATIVE_FILE${NC}"
    continue
  fi
  
  echo -e "${BLUE}Checking: $RELATIVE_FILE${NC}"
  
  # Check for .p-* selectors (but not in comments)
  # Match: .p-*, :global(.p-*)
  # Note: ::ng-deep has been fully removed from the codebase (January 2026)
  VIOLATIONS=$(grep -n -E '\.p-[a-zA-Z0-9-]+|:global\(\.p-[a-zA-Z0-9-]+\)' "$RELATIVE_FILE" 2>/dev/null | grep -v '^\s*//' | grep -v '^\s*/\*' || true)
  
  if [ -n "$VIOLATIONS" ]; then
    echo -e "${RED}❌ Violations found in: $RELATIVE_FILE${NC}"
    echo "$VIOLATIONS" | while read -r line; do
      if [ -n "$line" ]; then
        echo "   $line"
      fi
    done
    echo ""
    echo "   Fix: Move PrimeNG overrides to:"
    echo "   - angular/src/assets/styles/primeng/_brand-overrides.scss"
    echo "   - OR use @layer overrides with exception ticket"
    FAILED=1
  else
    echo -e "${GREEN}✅ Passed: $RELATIVE_FILE${NC}"
  fi
  echo ""
done

# Summary
echo "============================================"
if [ $FAILED -eq 1 ]; then
  echo -e "${RED}❌ PrimeNG selector checks FAILED${NC}"
  echo ""
  echo "Violations found in changed SCSS files."
  echo "Fix these violations before merging:"
  echo ""
  echo "1. Move .p-* selectors to primeng/_brand-overrides.scss"
  echo "2. OR use @layer overrides with exception ticket"
  echo ""
  echo "See docs/DESIGN_SYSTEM_ENFORCEMENT.md for details."
  exit 1
else
  echo -e "${GREEN}✅ All changed SCSS files pass PrimeNG selector checks${NC}"
fi
echo "============================================"

