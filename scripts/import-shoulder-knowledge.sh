#!/bin/bash

# =============================================================================
# Import Shoulder Knowledge to Supabase Database
# =============================================================================

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║        Importing Shoulder Knowledge to Supabase                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "database/seed-shoulder-knowledge.sql" ]; then
    echo "❌ Error: Must run from project root directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected file: database/seed-shoulder-knowledge.sql"
    exit 1
fi

echo "📋 Checking prerequisites..."

# Check for Supabase access token
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "⚠️  SUPABASE_ACCESS_TOKEN not set"
    echo ""
    echo "Options:"
    echo "  1. Set via environment: export SUPABASE_ACCESS_TOKEN=your_token"
    echo "  2. Run: supabase login"
    echo "  3. Manual import via psql (see below)"
    echo ""

    # Offer manual import option
    echo "Would you like to see manual import instructions? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo ""
        echo "Manual Import Instructions:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Via psql:"
        echo "  PGPASSWORD='your-password' psql \\"
        echo "    -h your-db-host.supabase.co \\"
        echo "    -U postgres \\"
        echo "    -d postgres \\"
        echo "    -f database/seed-shoulder-knowledge.sql"
        echo ""
        echo "Via Supabase Dashboard:"
        echo "  1. Go to https://app.supabase.com"
        echo "  2. Select your project"
        echo "  3. Go to SQL Editor"
        echo "  4. Copy contents of database/seed-shoulder-knowledge.sql"
        echo "  5. Paste and run"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi
    exit 1
fi

# Check for supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found"
    echo "   Install: npm install -g supabase"
    exit 1
fi

echo "✓ Prerequisites met"
echo ""

# Show what will be imported
echo "📦 Import Contents:"
echo "   - 1 research article (Practitioner's Guide to Shoulders)"
echo "   - 5 knowledge base entries"
echo "     • Shoulder anatomy & biomechanics"
echo "     • Shoulder assessment protocols"
echo "     • Common shoulder injuries"
echo "     • Shoulder rehabilitation"
echo "     • Shoulder prehab & training"
echo "   - Search indexes"
echo ""

# Confirm import
echo "⚠️  This will insert new records into your database."
echo "Continue? (y/n)"
read -r confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "❌ Import cancelled"
    exit 0
fi

echo ""
echo "🚀 Starting import..."
echo ""

# Run the import
if supabase db execute -f database/seed-shoulder-knowledge.sql; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║                    ✓ IMPORT SUCCESSFUL                             ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "✓ Research article imported"
    echo "✓ Knowledge base entries created"
    echo "✓ Search indexes built"
    echo ""
    echo "Next Steps:"
    echo "  1. Verify in Supabase dashboard"
    echo "  2. Test AI chat integration"
    echo "  3. Add to athlete education materials"
    echo ""

    # Verification query
    echo "Run verification query? (y/n)"
    read -r verify
    if [[ "$verify" =~ ^[Yy]$ ]]; then
        echo ""
        echo "Verification Query:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        supabase db execute --sql "
SELECT
    'Research Articles' as table_name,
    COUNT(*) as count
FROM research_articles
WHERE title = 'Practitioner''s Guide to Shoulders'
UNION ALL
SELECT
    'Knowledge Entries' as table_name,
    COUNT(*) as count
FROM knowledge_base_entries
WHERE topic LIKE 'shoulder_%';
        " || echo "⚠️  Verification query failed - check manually in dashboard"
    fi
else
    echo ""
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║                    ❌ IMPORT FAILED                                ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Possible issues:"
    echo "  - Database connection problem"
    echo "  - Schema mismatch (check migrations)"
    echo "  - Duplicate entries (data already imported)"
    echo ""
    echo "Try manual import via Supabase dashboard SQL Editor"
    exit 1
fi
