#!/bin/bash

# Script to run all SQL migrations on Supabase and save results locally
# Usage: ./scripts/run-all-migrations-supabase.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RESULTS_DIR="$PROJECT_DIR/database/migration_results"
LOG_FILE="$RESULTS_DIR/migration_run_$(date +%Y%m%d_%H%M%S).log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}=============================================="
echo "  Running All Migrations on Supabase"
echo "==============================================${NC}"
echo ""
echo "Results will be saved to: $RESULTS_DIR"
echo "Log file: $LOG_FILE"
echo ""

# Load environment variables
if [ -f "$PROJECT_DIR/.env" ]; then
  source "$PROJECT_DIR/.env"
else
  echo -e "${RED}✗${NC} .env file not found"
  exit 1
fi

# Check for Supabase credentials
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo -e "${RED}✗${NC} SUPABASE_URL or SUPABASE_SERVICE_KEY not found in .env"
  exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://||' | sed 's|\.supabase\.co||')
echo -e "${GREEN}✓${NC} Project: $PROJECT_REF"
echo ""

# Build connection string
# Supabase connection format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
DB_URL="postgresql://postgres.${PROJECT_REF}:${SUPABASE_SERVICE_KEY}@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# Test connection
echo -e "${BLUE}Testing connection...${NC}"
if psql "$DB_URL" -c "SELECT version();" > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Connected to Supabase"
else
  echo -e "${YELLOW}⚠${NC} Direct connection failed. You may need to run migrations via Supabase Dashboard SQL Editor."
  echo ""
  echo "To run via Dashboard:"
  echo "1. Go to https://supabase.com/dashboard"
  echo "2. Select project: $PROJECT_REF"
  echo "3. Click SQL Editor → New query"
  echo "4. Copy/paste each migration file and run"
  echo ""
  echo "Migration files to run:"
  find "$PROJECT_DIR/database/migrations" -name "*.sql" -type f | sort | while read file; do
    echo "  - $(basename "$file")"
  done
  exit 0
fi

echo ""

# List of migration files in order
MIGRATIONS=(
  "database/migrations/001_base_tables.sql"
  "database/migrations/025_complete_flag_football_player_system.sql"
  "database/migrations/026_enhanced_strength_conditioning_system.sql"
  "database/migrations/027_load_management_system.sql"
  "database/migrations/028_evidence_based_knowledge_base.sql"
  "database/migrations/029_game_events_system.sql"
  "database/migrations/029_sponsors_table.sql"
  "database/migrations/030_advanced_ux_components_support.sql"
  "database/migrations/031_open_data_sessions_system.sql"
  "database/migrations/031_wellness_and_measurements_tables.sql"
  "database/migrations/032_acwr_compute_function.sql"
  "database/migrations/032_fix_analytics_events_rls_performance.sql"
  "database/migrations/033_consolidate_analytics_events_policies.sql"
  "database/migrations/033_readiness_score_system.sql"
  "database/migrations/033_readiness_score_system_create_tables.sql"
  "database/migrations/034_check_acwr_rpe_consistency.sql"
  "database/migrations/034_enable_rls_wearables_data.sql"
  "database/migrations/035_enable_rls_remaining_tables.sql"
  "database/migrations/036_add_rls_policies_users_implementation_steps.sql"
  "database/migrations/037_fix_users_insert_policy_registration.sql"
  "database/migrations/037_notifications_unification.sql"
  "database/migrations/038_add_username_and_verification_fields.sql"
  "database/migrations/039_chatbot_role_aware_system.sql"
  "database/migrations/040_knowledge_base_governance.sql"
  "database/migrations/041_player_stats_aggregation_view.sql"
  "database/migrations/042_training_data_consistency.sql"
  "database/migrations/043_database_upgrade_consistency.sql"
  "database/migrations/044_fix_rls_performance_and_consolidate_policies.sql"
  "database/migrations/045_add_missing_constraints.sql"
  "database/migrations/046_fix_acwr_baseline_checks_supabase.sql"
)

# Other SQL files (non-migrations)
OTHER_SQL=(
  "database/create-auth-tables.sql"
  "database/create-missing-tables.sql"
  "database/create-training-schema.sql"
  "database/supabase-rls-policies.sql"
  "database/apply-rls-policies-missing-tables.sql"
  "database/apply-rls-policies-users-implementation-steps.sql"
  "database/add_email_verification.sql"
  "database/fix-rls-performance-helper.sql"
)

# Function to run migration and save results
run_migration() {
  local file="$1"
  local basename=$(basename "$file" .sql)
  local result_file="$RESULTS_DIR/${basename}_result.txt"
  local error_file="$RESULTS_DIR/${basename}_errors.txt"
  
  echo -e "${BLUE}Running:${NC} $(basename "$file")"
  
  # Run migration and capture output
  if psql "$DB_URL" -f "$file" > "$result_file" 2> "$error_file"; then
    echo -e "${GREEN}✓${NC} Success: $(basename "$file")" | tee -a "$LOG_FILE"
    echo "  Results: $result_file" | tee -a "$LOG_FILE"
    return 0
  else
    echo -e "${RED}✗${NC} Failed: $(basename "$file")" | tee -a "$LOG_FILE"
    echo "  Errors: $error_file" | tee -a "$LOG_FILE"
    if [ -s "$error_file" ]; then
      echo "  Error details:" | tee -a "$LOG_FILE"
      head -5 "$error_file" | tee -a "$LOG_FILE"
    fi
    return 1
  fi
}

# Run migrations
SUCCESS_COUNT=0
FAILED_COUNT=0
FAILED_FILES=()

echo -e "${BLUE}=============================================="
echo "  Running Migrations"
echo "==============================================${NC}"
echo ""

for migration in "${MIGRATIONS[@]}"; do
  if [ -f "$PROJECT_DIR/$migration" ]; then
    if run_migration "$PROJECT_DIR/$migration"; then
      ((SUCCESS_COUNT++))
    else
      ((FAILED_COUNT++))
      FAILED_FILES+=("$migration")
    fi
    echo ""
  else
    echo -e "${YELLOW}⚠${NC} File not found: $migration"
  fi
done

# Run other SQL files
echo -e "${BLUE}=============================================="
echo "  Running Other SQL Files"
echo "==============================================${NC}"
echo ""

for sql_file in "${OTHER_SQL[@]}"; do
  if [ -f "$PROJECT_DIR/$sql_file" ]; then
    if run_migration "$PROJECT_DIR/$sql_file"; then
      ((SUCCESS_COUNT++))
    else
      ((FAILED_COUNT++))
      FAILED_FILES+=("$sql_file")
    fi
    echo ""
  else
    echo -e "${YELLOW}⚠${NC} File not found: $sql_file"
  fi
done

# Summary
echo -e "${BLUE}=============================================="
echo "  Migration Summary"
echo "==============================================${NC}"
echo ""
echo -e "${GREEN}✓${NC} Successful: $SUCCESS_COUNT"
echo -e "${RED}✗${NC} Failed: $FAILED_COUNT"
echo ""
echo "Results saved to: $RESULTS_DIR"
echo "Log file: $LOG_FILE"
echo ""

if [ ${#FAILED_FILES[@]} -gt 0 ]; then
  echo -e "${YELLOW}Failed files:${NC}"
  for file in "${FAILED_FILES[@]}"; do
    echo "  - $file"
  done
  echo ""
fi

# Create summary file
SUMMARY_FILE="$RESULTS_DIR/migration_summary_$(date +%Y%m%d_%H%M%S).md"
cat > "$SUMMARY_FILE" << EOF
# Migration Run Summary

**Date**: $(date)
**Project**: $PROJECT_REF
**Database**: Supabase

## Results

- **Successful**: $SUCCESS_COUNT
- **Failed**: $FAILED_COUNT

## Migration Files Run

### Successful Migrations
EOF

for migration in "${MIGRATIONS[@]}"; do
  if [ -f "$PROJECT_DIR/$migration" ]; then
    basename=$(basename "$migration" .sql)
    if [ ! -s "$RESULTS_DIR/${basename}_errors.txt" ] 2>/dev/null; then
      echo "- ✅ $(basename "$migration")" >> "$SUMMARY_FILE"
    fi
  fi
done

cat >> "$SUMMARY_FILE" << EOF

### Failed Migrations
EOF

for file in "${FAILED_FILES[@]}"; do
  echo "- ❌ $(basename "$file")" >> "$SUMMARY_FILE"
done

cat >> "$SUMMARY_FILE" << EOF

## Files Generated

All results saved to: \`database/migration_results/\`

- \`*_result.txt\` - Migration output
- \`*_errors.txt\` - Error messages (if any)
- \`migration_run_*.log\` - Complete execution log
- \`migration_summary_*.md\` - This summary

## Next Steps

1. Review failed migrations in \`*_errors.txt\` files
2. Fix any issues and re-run failed migrations
3. Verify database state after successful migrations
EOF

echo -e "${GREEN}✓${NC} Summary saved to: $SUMMARY_FILE"
echo ""

