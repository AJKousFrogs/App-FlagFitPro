#!/bin/bash

# Supabase Backend Debugging Quick Reference
# Run this script to check the health of your Supabase backend

echo "🔍 Supabase Backend Debugging Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we have the debug functions installed
echo "📋 Checking debug helper functions..."
psql "$DATABASE_URL" -c "SELECT proname FROM pg_proc WHERE proname IN ('check_user_id_index', 'get_table_columns', 'get_table_indexes', 'get_table_policies');" -t | while read func; do
  if [ ! -z "$func" ]; then
    echo -e "${GREEN}✅${NC} Function $func exists"
  fi
done

echo ""
echo "🔒 Checking RLS Policies for critical tables..."

# Check user_profiles policies
echo ""
echo "Table: user_profiles"
psql "$DATABASE_URL" -c "SELECT * FROM get_table_policies('user_profiles');" -t | head -3

# Check injuries policies
echo ""
echo "Table: injuries"
psql "$DATABASE_URL" -c "SELECT * FROM get_table_policies('injuries');" -t | head -3

echo ""
echo "📊 Checking indexes on user_id columns..."

TABLES=("user_profiles" "injuries" "daily_wellness_checkin" "nutrition_logs" "performance_records")

for table in "${TABLES[@]}"; do
  echo ""
  echo "Table: $table"
  result=$(psql "$DATABASE_URL" -c "SELECT * FROM check_user_id_index('$table');" -t)
  if [ ! -z "$result" ]; then
    echo -e "${GREEN}✅${NC} Index exists"
  else
    echo -e "${RED}❌${NC} No index on user_id"
    echo "   Run: CREATE INDEX idx_${table}_user_id ON ${table}(user_id);"
  fi
done

echo ""
echo "🔍 Checking for missing columns (from recent errors)..."

# Check daily_wellness_checkin for pain_level
echo ""
echo "Table: daily_wellness_checkin"
result=$(psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'daily_wellness_checkin' AND column_name = 'pain_level';" -t)
if [ ! -z "$result" ]; then
  echo -e "${GREEN}✅${NC} Column pain_level exists"
else
  echo -e "${RED}❌${NC} Column pain_level missing"
  echo "   Run migration to add column"
fi

# Check physical_measurements for measurement_date
echo ""
echo "Table: physical_measurements"
result=$(psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'physical_measurements' AND column_name = 'measurement_date';" -t)
if [ ! -z "$result" ]; then
  echo -e "${GREEN}✅${NC} Column measurement_date exists"
else
  echo -e "${RED}❌${NC} Column measurement_date missing"
  echo "   Run migration to add column"
fi

echo ""
echo "⚡ Checking for updated_at triggers (optimistic concurrency)..."

TABLES_WITH_TRIGGERS=("injuries" "user_profiles" "daily_wellness_checkin")

for table in "${TABLES_WITH_TRIGGERS[@]}"; do
  result=$(psql "$DATABASE_URL" -c "SELECT tgname FROM pg_trigger WHERE tgname = 'update_${table}_updated_at';" -t)
  if [ ! -z "$result" ]; then
    echo -e "${GREEN}✅${NC} Trigger exists for $table"
  else
    echo -e "${YELLOW}⚠️${NC}  No trigger for $table"
    echo "   Run: CREATE TRIGGER update_${table}_updated_at BEFORE UPDATE ON ${table} FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();"
  fi
done

echo ""
echo "🎯 Performance Check: Query slow tables..."

echo ""
echo "Running test query on injuries table..."
time psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM injuries WHERE user_id = (SELECT id FROM user_profiles LIMIT 1);" -q

echo ""
echo "✨ Debug script complete!"
echo ""
echo "Next steps:"
echo "1. Review any ❌ or ⚠️  warnings above"
echo "2. Run the suggested SQL commands to fix issues"
echo "3. Check Supabase Dashboard > Logs for recent errors"
echo "4. Use the Angular debug service for detailed client-side logging"
echo ""
echo "For more help, see: docs/SUPABASE_DEBUGGING_GUIDE.md"
