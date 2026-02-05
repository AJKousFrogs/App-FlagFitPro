#!/bin/bash
#
# Schema Fix Verification Script
# Verifies that migration 112 was applied correctly
#
# Usage: ./verify-schema-fix.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Database Schema Fix Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we have Supabase connection
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_URL" ]; then
  echo -e "${YELLOW}⚠️  Warning: No Supabase connection found${NC}"
  echo "   Set DATABASE_URL or SUPABASE_URL environment variable"
  echo "   Or run this script after applying migration manually"
  echo ""
fi

# Function to check if column exists in TypeScript types
check_ts_types() {
  local column_name=$1
  local file="supabase-types.ts"
  
  if [ ! -f "$file" ]; then
    echo -e "${RED}❌ TypeScript types file not found: $file${NC}"
    return 1
  fi
  
  if grep -q "$column_name" "$file"; then
    echo -e "${GREEN}✅ Found in TypeScript types: $column_name${NC}"
    return 0
  else
    echo -e "${RED}❌ Missing from TypeScript types: $column_name${NC}"
    return 1
  fi
}

# Function to check if column is used in settings component
check_settings_usage() {
  local column_name=$1
  local file="angular/src/app/features/settings/settings.component.ts"
  
  if [ ! -f "$file" ]; then
    echo -e "${YELLOW}⚠️  Settings component not found: $file${NC}"
    return 1
  fi
  
  if grep -q "$column_name" "$file"; then
    echo -e "${GREEN}✅ Used in settings component: $column_name${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠️  Not used in settings component: $column_name${NC}"
    return 1
  fi
}

echo -e "${BLUE}1. Checking Migration File${NC}"
echo "-----------------------------------"

MIGRATION_FILE="database/migrations/112_fix_users_table_profile_fields.sql"

if [ -f "$MIGRATION_FILE" ]; then
  echo -e "${GREEN}✅ Migration file exists: $MIGRATION_FILE${NC}"
  
  # Check what the migration does
  echo ""
  echo "Migration adds these columns:"
  grep -E "ADD COLUMN.*full_name|ADD COLUMN.*jersey_number|ADD COLUMN.*phone|ADD COLUMN.*team" "$MIGRATION_FILE" | sed 's/^/  /'
  
  echo ""
  echo "Migration renames:"
  grep -E "RENAME COLUMN.*birth_date" "$MIGRATION_FILE" | sed 's/^/  /'
else
  echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}2. Checking TypeScript Types${NC}"
echo "-----------------------------------"

if [ -f "supabase-types.ts" ]; then
  check_ts_types "full_name"
  check_ts_types "jersey_number"
  check_ts_types "phone"
  check_ts_types "date_of_birth"

  # Check if old name still exists (should not after types are regenerated)
  if grep -q "birth_date:" "supabase-types.ts" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Old field name still in types: birth_date${NC}"
    echo -e "   ${YELLOW}Run: npx supabase gen types typescript --linked > supabase-types.ts${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  supabase-types.ts not found. Generate types before running this check.${NC}"
  echo -e "   ${YELLOW}Run: npx supabase gen types typescript --linked > supabase-types.ts${NC}"
fi

echo ""
echo -e "${BLUE}3. Checking Settings Component Usage${NC}"
echo "-----------------------------------"

check_settings_usage "full_name"
check_settings_usage "jersey_number"
check_settings_usage "phone"
check_settings_usage "date_of_birth"

echo ""
echo -e "${BLUE}4. Checking HTML Template${NC}"
echo "-----------------------------------"

HTML_FILE="angular/src/app/features/settings/settings.component.html"

if [ -f "$HTML_FILE" ]; then
  if grep -q "jerseyNumber" "$HTML_FILE"; then
    echo -e "${GREEN}✅ Jersey Number field exists in template${NC}"
  else
    echo -e "${YELLOW}⚠️  Jersey Number field not found in template${NC}"
  fi
  
  if grep -q "phone" "$HTML_FILE"; then
    echo -e "${GREEN}✅ Phone field exists in template${NC}"
  else
    echo -e "${YELLOW}⚠️  Phone field not found in template${NC}"
  fi
  
  if grep -q "displayName" "$HTML_FILE"; then
    echo -e "${GREEN}✅ Display Name field exists in template${NC}"
  else
    echo -e "${YELLOW}⚠️  Display Name field not found in template${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Template file not found: $HTML_FILE${NC}"
fi

echo ""
echo -e "${BLUE}5. Checking for Common Issues${NC}"
echo "-----------------------------------"

# Check if settings component is still using wrong field names
if grep -q "birth_date:" "angular/src/app/features/settings/settings.component.ts" 2>/dev/null; then
  echo -e "${RED}❌ Settings component still uses old field name: birth_date${NC}"
  echo -e "   ${RED}Should be: date_of_birth${NC}"
else
  echo -e "${GREEN}✅ Settings component uses correct field names${NC}"
fi

# Check if updateData includes created_at (it should NOT)
if grep -A 20 "const updateData = {" "angular/src/app/features/settings/settings.component.ts" 2>/dev/null | grep -q "created_at:"; then
  echo -e "${RED}❌ Settings component includes created_at in updateData${NC}"
  echo -e "   ${RED}This will overwrite user registration date!${NC}"
else
  echo -e "${GREEN}✅ Settings component does not modify created_at${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Apply migration 112 in Supabase Dashboard:"
echo "   - Open Supabase Dashboard → SQL Editor"
echo "   - Paste contents of $MIGRATION_FILE"
echo "   - Run migration"
echo ""
echo "2. Regenerate TypeScript types:"
echo "   ${GREEN}npx supabase gen types typescript --linked > supabase-types.ts${NC}"
echo ""
echo "3. Restart your dev server:"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "4. Test profile save:"
echo "   - Open app → Settings"
echo "   - Change profile information"
echo "   - Click Save"
echo "   - Refresh page and verify changes persist"
echo ""
echo "5. Verify in database:"
echo "   SELECT id, full_name, jersey_number, phone, date_of_birth,"
echo "          created_at, updated_at"
echo "   FROM users WHERE email = 'your-email@example.com';"
echo ""

echo -e "${GREEN}✅ Verification complete!${NC}"
echo ""
echo "See SCHEMA_FIX_INSTRUCTIONS.md for detailed steps."
