#!/bin/bash

# Run SQL migrations in a deterministic, source-of-truth order.
# Default source of truth: supabase/migrations
# Optional legacy source: database/migrations when INCLUDE_LEGACY_DATABASE_MIGRATIONS=true
#
# Usage:
#   ./scripts/run-all-migrations-supabase.sh
#   DATABASE_URL='postgresql://...' ./scripts/run-all-migrations-supabase.sh
#   INCLUDE_LEGACY_DATABASE_MIGRATIONS=true DATABASE_URL='postgresql://...' ./scripts/run-all-migrations-supabase.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RESULTS_DIR="$PROJECT_DIR/database/migration_results"
LOG_FILE="$RESULTS_DIR/migration_run_$(date +%Y%m%d_%H%M%S).log"
PLAN_FILE="$RESULTS_DIR/migration_execution_plan_$(date +%Y%m%d_%H%M%S).txt"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}=============================================="
echo "  Supabase Migration Runner"
echo "==============================================${NC}"

echo "Project: $PROJECT_DIR"
echo "Results: $RESULTS_DIR"
echo "Log: $LOG_FILE"

declare -a migration_roots=("$PROJECT_DIR/supabase/migrations")
if [[ "${INCLUDE_LEGACY_DATABASE_MIGRATIONS:-false}" == "true" ]]; then
  migration_roots+=("$PROJECT_DIR/database/migrations")
fi

declare -a migrations=()
for root in "${migration_roots[@]}"; do
  if [[ -d "$root" ]]; then
    while IFS= read -r file; do
      migrations+=("$file")
    done < <(find "$root" -maxdepth 1 -type f -name '*.sql' | sort)
  fi
done

if [[ ${#migrations[@]} -eq 0 ]]; then
  echo -e "${RED}No migration SQL files found.${NC}"
  exit 1
fi

printf "%s\n" "${migrations[@]}" > "$PLAN_FILE"
echo -e "${GREEN}✓${NC} Migration plan generated: $PLAN_FILE"
echo "Total files: ${#migrations[@]}"

if [[ -z "${DATABASE_URL:-}" && -z "${SUPABASE_DB_URL:-}" ]]; then
  echo -e "${YELLOW}⚠${NC} DATABASE_URL/SUPABASE_DB_URL not set."
  echo "Generated plan only. No SQL executed."
  echo
  echo "To execute directly:"
  echo "  DATABASE_URL='postgresql://...' ./scripts/run-all-migrations-supabase.sh"
  exit 0
fi

DB_URL="${DATABASE_URL:-${SUPABASE_DB_URL:-}}"

if ! command -v psql >/dev/null 2>&1; then
  echo -e "${RED}psql is required for direct execution but was not found.${NC}"
  exit 1
fi

echo -e "${BLUE}Testing database connection...${NC}"
if ! psql "$DB_URL" -c "select current_database(), current_user;" >/dev/null 2>&1; then
  echo -e "${RED}Could not connect using provided DATABASE_URL/SUPABASE_DB_URL.${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Connection successful"

echo -e "${BLUE}Executing migrations...${NC}"
SUCCESS_COUNT=0
FAILED_COUNT=0

for file in "${migrations[@]}"; do
  base="$(basename "$file" .sql)"
  out_file="$RESULTS_DIR/${base}_result.txt"
  err_file="$RESULTS_DIR/${base}_errors.txt"

  echo "Running: $(basename "$file")" | tee -a "$LOG_FILE"
  if psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$file" >"$out_file" 2>"$err_file"; then
    echo -e "${GREEN}✓${NC} $(basename "$file")" | tee -a "$LOG_FILE"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo -e "${RED}✗${NC} $(basename "$file")" | tee -a "$LOG_FILE"
    head -20 "$err_file" | tee -a "$LOG_FILE"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi
  echo

done

echo -e "${BLUE}=============================================="
echo "  Summary"
echo "==============================================${NC}"
echo -e "${GREEN}Successful:${NC} $SUCCESS_COUNT"
echo -e "${RED}Failed:${NC} $FAILED_COUNT"
echo "Plan: $PLAN_FILE"
echo "Log: $LOG_FILE"
