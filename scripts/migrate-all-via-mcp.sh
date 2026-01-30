#!/bin/bash
# Comprehensive Migration Script using MCP Supabase Tools
# Migrates everything to project grfjmnjpzvknmsxrwesx

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=============================================="
echo "  Supabase Migration via MCP Tools"
echo "==============================================${NC}"
echo ""
echo "Target Project: grfjmnjpzvknmsxrwesx"
echo "Project URL: https://grfjmnjpzvknmsxrwesx.supabase.co"
echo ""

# Step 1: Verify MCP connection
echo -e "${BLUE}Step 1: Verifying MCP Supabase connection...${NC}"
echo "The MCP Supabase server should be configured for project grfjmnjpzvknmsxrwesx"
echo ""

# Step 2: Check current migration status
echo -e "${BLUE}Step 2: Checking migration status...${NC}"
echo "Use MCP 'list_migrations' tool to see what's already applied"
echo ""

# Step 3: Prepare migrations
echo -e "${BLUE}Step 3: Preparing migrations...${NC}"
cd "$PROJECT_DIR"
node scripts/apply-missing-migrations-mcp.js
echo ""

# Step 4: Instructions for applying migrations
echo -e "${BLUE}Step 4: Apply Migrations${NC}"
echo ""
echo "To apply migrations using MCP tools, you can:"
echo ""
echo "Option A: Use MCP 'apply_migration' tool for each migration"
echo "  - Migration names and SQL are in: database/migration_results/migrations_for_mcp.json"
echo "  - Use the 'apply_migration' MCP tool with migration name and SQL query"
echo ""
echo "Option B: Use MCP 'execute_sql' tool for bulk operations"
echo "  - Read migration files and execute SQL directly"
echo ""
echo "Option C: Use the migration script (requires psql)"
echo "  - Run: ./scripts/run-all-migrations-supabase.sh"
echo ""

# Step 5: Data migration
echo -e "${BLUE}Step 5: Data Migration${NC}"
echo ""
echo "If you need to migrate data from the old project (pvzicicwxgftcielnm):"
echo ""
echo "1. Set environment variables:"
echo "   export OLD_SUPABASE_URL=\"https://pvzicicwxgftcielnm.supabase.co\""
echo "   export OLD_SUPABASE_SERVICE_KEY=\"your_old_service_key\""
echo ""
echo "2. Run data migration script:"
echo "   node scripts/migrate-supabase-data.js"
echo ""

echo -e "${GREEN}=============================================="
echo "  Migration Preparation Complete"
echo "==============================================${NC}"
echo ""
echo "Next steps:"
echo "1. Ask Cursor AI to apply migrations using MCP tools"
echo "2. Or run migrations manually using the scripts above"
echo "3. Migrate data if needed from the old project"
echo ""
