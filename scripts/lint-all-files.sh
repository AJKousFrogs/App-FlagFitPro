#!/usr/bin/env bash
# ============================================================
# Lint All Files Script (Global Mode)
# ============================================================
# Lints all SCSS/CSS files with warnings (non-blocking).
# Used for reporting violations across the entire codebase.
#
# Usage:
#   ./scripts/lint-all-files.sh
#
# Exit codes:
#   0: Always succeeds (warnings don't block)
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd "$PROJECT_ROOT"

echo "============================================"
echo "🔍 Design System: Global Violation Report"
echo "============================================"
echo ""
echo -e "${BLUE}📋 Scanning all SCSS/CSS files...${NC}"
echo "   (This reports violations but doesn't block)"
echo ""

# Change to angular directory for stylelint
cd "$PROJECT_ROOT/angular"

# Run stylelint on all files with warnings (non-blocking)
echo -e "${BLUE}🔍 Running stylelint (report mode)...${NC}"
echo ""

# Use stylelint with default config (warnings for legacy violations)
npx stylelint "src/**/*.{scss,css}" \
  --config ../.stylelintrc.cjs \
  --formatter verbose \
  --max-warnings 999999 || true

echo ""
echo "============================================"
echo -e "${GREEN}✅ Global scan complete${NC}"
echo ""
echo "Note: Warnings in legacy files are tolerated."
echo "Only changed files are enforced in CI."
echo "============================================"

