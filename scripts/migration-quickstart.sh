#!/bin/bash

# Quick Start Migration Script
# Guides you through the migration process step by step

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================="
echo "  Supabase Migration Quick Start"
echo "==============================================${NC}"
echo ""

# Step 1: Update .env file
echo -e "${BLUE}Step 1: Update .env file${NC}"
echo "This will update your .env file with new Supabase credentials."
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  cd "$PROJECT_DIR"
  node scripts/update-env-file.js
else
  echo -e "${YELLOW}Skipping .env update${NC}"
fi

echo ""

# Step 2: Verify connection
echo -e "${BLUE}Step 2: Verify connection to new Supabase project${NC}"
read -p "Test connection now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  cd "$PROJECT_DIR"
  node scripts/verify-new-supabase.js || {
    echo -e "${RED}Connection verification failed${NC}"
    echo "Please check your credentials and try again."
    exit 1
  }
else
  echo -e "${YELLOW}Skipping connection test${NC}"
fi

echo ""

# Step 3: Run migrations
echo -e "${BLUE}Step 3: Run database migrations${NC}"
echo "The new Supabase project needs all database migrations applied."
echo ""
echo "Choose a method:"
echo "1) Run via script (requires psql)"
echo "2) Run via Supabase Dashboard (manual)"
echo "3) Skip for now"
read -p "Choose option (1-3): " -n 1 -r
echo

case $REPLY in
  1)
    echo -e "${GREEN}Running migrations via script...${NC}"
    cd "$PROJECT_DIR"
    ./scripts/run-all-migrations-supabase.sh
    ;;
  2)
    echo -e "${YELLOW}Manual migration via Dashboard:${NC}"
    echo "1. Go to: https://supabase.com/dashboard/project/grfjmnjpzvknmsxrwesx/sql"
    echo "2. Copy/paste each migration file from supabase/migrations/"
    echo "3. Run them in order"
    echo ""
    read -p "Press Enter when migrations are complete..."
    ;;
  3)
    echo -e "${YELLOW}Skipping migrations${NC}"
    ;;
esac

echo ""

# Step 4: Verify migrations
echo -e "${BLUE}Step 4: Verify migrations${NC}"
read -p "Verify migrations now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  cd "$PROJECT_DIR"
  node scripts/verify-new-supabase.js
fi

echo ""

# Step 5: Data migration
echo -e "${BLUE}Step 5: Migrate data from old project${NC}"
echo "Do you have data in the old project that needs to be migrated?"
read -p "Migrate data? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "You'll need:"
  echo "1. Old project service key"
  echo "2. Old project URL: https://pvzicicwxgftcielnm.supabase.co"
  echo ""
  read -p "Set OLD_SUPABASE_SERVICE_KEY environment variable and press Enter..."
  
  cd "$PROJECT_DIR"
  node scripts/migrate-supabase-data.js || {
    echo -e "${RED}Data migration failed${NC}"
    echo "Check the output above for details."
  }
else
  echo -e "${YELLOW}Skipping data migration${NC}"
fi

echo ""

# Step 6: Summary
echo -e "${GREEN}=============================================="
echo "  Migration Steps Complete"
echo "==============================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update Netlify environment variables:"
echo "   https://app.netlify.com/sites/your-site/settings/deploys#environment-variables"
echo ""
echo "2. Test your application:"
echo "   npm run dev"
echo ""
echo "3. Deploy to production and verify"
echo ""
echo -e "${GREEN}Setup guide: docs/LOCAL_DEVELOPMENT_SETUP.md${NC}"
