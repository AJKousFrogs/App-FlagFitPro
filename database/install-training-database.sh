#!/bin/bash

# =====================================================
# FlagFit Pro - Training Database Installation Script
# =====================================================
# This script installs the complete training database schema
# and seeds it with the QB Annual Program data.
#
# Usage:
#   chmod +x database/install-training-database.sh
#   ./database/install-training-database.sh
#
# Prerequisites:
#   - Supabase CLI installed (https://supabase.com/docs/guides/cli)
#   - Logged into Supabase CLI (supabase login)
#   - Project linked (supabase link --project-ref grfjmnjpzvknmsxrwesx)
#   OR
#   - Supabase URL and Service Key in .env file
# =====================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}"
echo "=============================================="
echo "  FlagFit Pro Training Database Installer"
echo "=============================================="
echo -e "${NC}"

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✓${NC} Supabase CLI found"
    USE_CLI=true
else
    echo -e "${YELLOW}⚠${NC} Supabase CLI not found. Will use psql if available."
    USE_CLI=false
fi

# Function to install via Supabase CLI
install_via_cli() {
    echo -e "\n${BLUE}Installing via Supabase CLI...${NC}"

    # Check if linked to project
    if ! supabase status &> /dev/null; then
        echo -e "${RED}✗${NC} Not linked to a Supabase project."
        echo -e "${YELLOW}Run:${NC} supabase link --project-ref grfjmnjpzvknmsxrwesx"
        exit 1
    fi

    echo -e "\n${BLUE}Step 1/2:${NC} Creating training database schema..."
    supabase db push --file "$SCRIPT_DIR/create-training-schema.sql" || {
        echo -e "${RED}✗${NC} Failed to create schema"
        exit 1
    }
    echo -e "${GREEN}✓${NC} Schema created successfully"

    echo -e "\n${BLUE}Step 2/2:${NC} Seeding QB Annual Program data..."
    supabase db push --file "$SCRIPT_DIR/seed-qb-annual-program.sql" || {
        echo -e "${RED}✗${NC} Failed to seed data"
        exit 1
    }
    echo -e "${GREEN}✓${NC} QB Program seeded successfully"
}

# Function to install via psql
install_via_psql() {
    echo -e "\n${BLUE}Installing via psql...${NC}"

    # Load environment variables
    if [ -f "$SCRIPT_DIR/../.env" ]; then
        source "$SCRIPT_DIR/../.env"
    else
        echo -e "${RED}✗${NC} .env file not found"
        exit 1
    fi

    # Check for required variables
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
        echo -e "${RED}✗${NC} Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env"
        exit 1
    fi

    # Extract database connection string
    DB_URL="postgresql://postgres.grfjmnjpzvknmsxrwesx:${SUPABASE_SERVICE_KEY}@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

    echo -e "\n${BLUE}Step 1/2:${NC} Creating training database schema..."
    psql "$DB_URL" -f "$SCRIPT_DIR/create-training-schema.sql" || {
        echo -e "${RED}✗${NC} Failed to create schema"
        exit 1
    }
    echo -e "${GREEN}✓${NC} Schema created successfully"

    echo -e "\n${BLUE}Step 2/2:${NC} Seeding QB Annual Program data..."
    psql "$DB_URL" -f "$SCRIPT_DIR/seed-qb-annual-program.sql" || {
        echo -e "${RED}✗${NC} Failed to seed data"
        exit 1
    }
    echo -e "${GREEN}✓${NC} QB Program seeded successfully"
}

# Function to verify installation
verify_installation() {
    echo -e "\n${BLUE}Verifying installation...${NC}"

    local count=0

    # Check positions table
    if $USE_CLI; then
        count=$(supabase db query "SELECT COUNT(*) FROM positions" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")
    else
        count=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM positions" 2>/dev/null | tr -d ' ' || echo "0")
    fi

    if [ "$count" -ge 6 ]; then
        echo -e "${GREEN}✓${NC} Positions table: $count positions created"
    else
        echo -e "${YELLOW}⚠${NC} Positions table: Only $count positions found (expected 6)"
    fi

    # Check training_programs table
    if $USE_CLI; then
        count=$(supabase db query "SELECT COUNT(*) FROM training_programs" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")
    else
        count=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM training_programs" 2>/dev/null | tr -d ' ' || echo "0")
    fi

    if [ "$count" -ge 1 ]; then
        echo -e "${GREEN}✓${NC} Training programs: $count program created (QB Annual Program)"
    else
        echo -e "${YELLOW}⚠${NC} Training programs: No programs found"
    fi

    # Check exercises table
    if $USE_CLI; then
        count=$(supabase db query "SELECT COUNT(*) FROM exercises" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")
    else
        count=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM exercises" 2>/dev/null | tr -d ' ' || echo "0")
    fi

    if [ "$count" -ge 25 ]; then
        echo -e "${GREEN}✓${NC} Exercises library: $count exercises created"
    else
        echo -e "${YELLOW}⚠${NC} Exercises library: Only $count exercises found (expected 25+)"
    fi

    # Check training_sessions table
    if $USE_CLI; then
        count=$(supabase db query "SELECT COUNT(*) FROM training_sessions" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")
    else
        count=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM training_sessions" 2>/dev/null | tr -d ' ' || echo "0")
    fi

    if [ "$count" -ge 7 ]; then
        echo -e "${GREEN}✓${NC} Training sessions: $count sessions created (Week 1)"
    else
        echo -e "${YELLOW}⚠${NC} Training sessions: Only $count sessions found (expected 7)"
    fi
}

# Main installation flow
echo -e "\n${YELLOW}This will install the training database schema and seed QB program data.${NC}"
echo -e "${YELLOW}Existing data will NOT be deleted, but conflicts may occur if tables already exist.${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Installation cancelled.${NC}"
    exit 1
fi

# Install
if $USE_CLI; then
    install_via_cli
else
    if command -v psql &> /dev/null; then
        install_via_psql
    else
        echo -e "${RED}✗${NC} Neither Supabase CLI nor psql found."
        echo -e "${YELLOW}Install one of the following:${NC}"
        echo -e "  - Supabase CLI: ${BLUE}https://supabase.com/docs/guides/cli${NC}"
        echo -e "  - PostgreSQL: ${BLUE}https://www.postgresql.org/download/${NC}"
        exit 1
    fi
fi

# Verify
verify_installation

# Success message
echo -e "\n${GREEN}=============================================="
echo "  Installation Complete!"
echo "=============================================="
echo -e "${NC}"
echo "Next steps:"
echo "  1. Assign QB program to a player:"
echo "     ${BLUE}INSERT INTO player_programs (player_id, program_id, start_date, is_active)${NC}"
echo "     ${BLUE}VALUES ('player-uuid', '11111111-1111-1111-1111-111111111111', '2025-12-01', true);${NC}"
echo ""
echo "  2. View the database structure:"
echo "     ${BLUE}cat database/README-TRAINING-DATABASE.md${NC}"
echo ""
echo "  3. Connect the frontend to display training data"
echo ""
echo -e "${GREEN}Happy training!${NC} 🏈"
