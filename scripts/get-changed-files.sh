#!/usr/bin/env bash
# ============================================================
# Get Changed Files Script
# ============================================================
# Detects changed SCSS/CSS files for incremental enforcement.
# Used by CI to only enforce design system rules on changed files.
#
# Usage:
#   ./scripts/get-changed-files.sh [base_branch]
#   Default base_branch: main
#
# Output: Space-separated list of changed file paths
# ============================================================

set -euo pipefail

BASE_BRANCH="${1:-main}"
CHANGED_FILES=""

# Detect if we're in a CI environment (GitHub Actions)
if [ -n "${GITHUB_BASE_REF:-}" ]; then
  # PR context: compare against base branch
  BASE_BRANCH="$GITHUB_BASE_REF"
elif [ -n "${GITHUB_REF:-}" ]; then
  # Push context: compare against main
  BASE_BRANCH="main"
fi

# Get changed SCSS/CSS/HTML files
if git rev-parse --verify "$BASE_BRANCH" >/dev/null 2>&1; then
  # Compare against base branch
  CHANGED_FILES=$(git diff --name-only --diff-filter=ACMR "$BASE_BRANCH" HEAD | grep -E '\.(scss|css|html)$' || true)
else
  # Fallback: check unstaged and staged changes
  CHANGED_FILES=$(git diff --name-only --diff-filter=ACMR | grep -E '\.(scss|css|html)$' || true)
  CHANGED_FILES="$CHANGED_FILES $(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(scss|css|html)$' || true)"
fi

# Filter to only files in angular/src directory
CHANGED_FILES=$(echo "$CHANGED_FILES" | grep "^angular/src/" || true)

# Remove duplicates and empty lines
CHANGED_FILES=$(echo "$CHANGED_FILES" | sort -u | grep -v '^$' || true)

# Output space-separated list
if [ -n "$CHANGED_FILES" ]; then
  echo "$CHANGED_FILES" | tr '\n' ' '
else
  echo ""
fi

