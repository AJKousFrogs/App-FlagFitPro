#!/bin/bash

# =============================================================================
# Run Database Upgrade Migration
# =============================================================================
# This script helps you run a legacy database upgrade migration (043).
# Canonical migration chain is under supabase/migrations.
# 
# Usage:
#   chmod +x scripts/run-upgrade-migration.sh
#   ./scripts/run-upgrade-migration.sh
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_FILE="${MIGRATION_FILE:-$SCRIPT_DIR/../database/migrations/043_database_upgrade_consistency.sql}"

echo -e "${BLUE}"
echo "=============================================="
echo "  Database Upgrade Migration Runner"
echo "=============================================="
echo -e "${NC}"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}✗${NC} Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo -e "${GREEN}✓${NC} Migration file found: $(basename "$MIGRATION_FILE")"

# Method selection
echo -e "\n${YELLOW}Select method to run migration:${NC}"
echo "1) Supabase Dashboard SQL Editor (Recommended)"
echo "2) Supabase CLI (if linked)"
echo "3) psql (direct connection)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo -e "\n${BLUE}Method 1: Supabase Dashboard SQL Editor${NC}"
        echo -e "${YELLOW}─────────────────────────────────────────────────────────${NC}"
        echo ""
        echo "1. Go to: https://supabase.com/dashboard/project/grfjmnjpzvknmsxrwesx"
        echo "2. Click 'SQL Editor' in the left sidebar"
        echo "3. Click 'New query'"
        echo "4. Copy and paste the SQL below:"
        echo ""
        echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
        cat "$MIGRATION_FILE"
        echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
        echo ""
        echo "5. Click 'Run' (or press Cmd+Enter)"
        echo "6. Verify success by running: SELECT * FROM check_database_consistency();"
        ;;
    
    2)
        echo -e "\n${BLUE}Method 2: Supabase CLI${NC}"
        
        if ! command -v supabase &> /dev/null; then
            echo -e "${RED}✗${NC} Supabase CLI not found"
            echo "Install: https://supabase.com/docs/guides/cli"
            exit 1
        fi
        
        # Check if linked
        if ! supabase status &> /dev/null; then
            echo -e "${YELLOW}⚠${NC} Not linked to Supabase project"
            echo "Linking to project..."
            supabase link --project-ref grfjmnjpzvknmsxrwesx || {
                echo -e "${RED}✗${NC} Failed to link project"
                exit 1
            }
        fi
        
        echo -e "${GREEN}✓${NC} Supabase CLI ready"
        echo "Running migration..."
        
        # Use db push for SQL files
        supabase db push --file "$MIGRATION_FILE" || {
            echo -e "${RED}✗${NC} Migration failed"
            echo ""
            echo "Alternative: Use Method 1 (Supabase Dashboard)"
            exit 1
        }
        
        echo -e "${GREEN}✓${NC} Migration completed successfully!"
        echo ""
        echo "Verifying consistency..."
        supabase db query "SELECT * FROM check_database_consistency();" || {
            echo -e "${YELLOW}⚠${NC} Could not verify (this is okay)"
        }
        ;;
    
    3)
        echo -e "\n${BLUE}Method 3: psql Direct Connection${NC}"
        
        if ! command -v psql &> /dev/null; then
            echo -e "${RED}✗${NC} psql not found"
            echo "Install PostgreSQL: https://www.postgresql.org/download/"
            exit 1
        fi
        
        # Load environment variables
        if [ -f "$SCRIPT_DIR/../.env" ]; then
            source "$SCRIPT_DIR/../.env"
        else
            echo -e "${YELLOW}⚠${NC} .env file not found"
        fi
        
        # Check for connection string
        if [ -z "$SUPABASE_SERVICE_KEY" ]; then
            echo -e "${RED}✗${NC} SUPABASE_SERVICE_KEY not found in .env"
            echo ""
            echo "Add to .env file:"
            echo "SUPABASE_SERVICE_KEY=your_service_role_key_here"
            exit 1
        fi
        
        # Build connection string
        DB_URL="postgresql://postgres.grfjmnjpzvknmsxrwesx:${SUPABASE_SERVICE_KEY}@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
        
        echo -e "${GREEN}✓${NC} Connection string ready"
        echo "Running migration..."
        
        psql "$DB_URL" -f "$MIGRATION_FILE" || {
            echo -e "${RED}✗${NC} Migration failed"
            exit 1
        }
        
        echo -e "${GREEN}✓${NC} Migration completed successfully!"
        echo ""
        echo "Verifying consistency..."
        psql "$DB_URL" -c "SELECT * FROM check_database_consistency();" || {
            echo -e "${YELLOW}⚠${NC} Could not verify (this is okay)"
        }
        ;;
    
    *)
        echo -e "${RED}✗${NC} Invalid choice"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}=============================================="
echo "  Migration Complete!"
echo "=============================================="
echo -e "${NC}"
echo "Next steps:"
echo "  1. Verify consistency: SELECT * FROM check_database_consistency();"
echo "  2. Check RLS policies: SELECT * FROM pg_policies WHERE tablename IN ('training_sessions', 'team_members');"
echo "  3. Test your application to ensure everything works"
echo ""
