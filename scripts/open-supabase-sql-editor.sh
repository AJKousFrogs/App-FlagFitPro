#!/bin/bash
# Open Supabase SQL Editor with migration SQL ready to paste

PROJECT_REF="grfjmnjpzvknmsxrwesx"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL_FILE="$PROJECT_ROOT/database/migration_results/all_migrations_consolidated.sql"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "⚠️  Consolidated SQL not found at:"
  echo "   $SQL_FILE"
  echo ""
  echo "Generate it from the repo root:"
  echo "   node scripts/run-migrations-via-api.js"
  echo ""
fi

echo "🚀 Opening Supabase SQL Editor"
echo "=" .repeat(60)
echo "📡 Project: ${PROJECT_REF}"
echo "=" .repeat(60)
echo ""
echo "Opening browser to SQL Editor..."
echo ""

# Open browser to SQL Editor
open "https://supabase.com/dashboard/project/${PROJECT_REF}/sql" 2>/dev/null || \
  xdg-open "https://supabase.com/dashboard/project/${PROJECT_REF}/sql" 2>/dev/null || \
  echo "Please open: https://supabase.com/dashboard/project/${PROJECT_REF}/sql"

echo ""
echo "📋 Instructions:"
echo "1. Click 'New query' in the SQL Editor"
echo "2. Copy the SQL file content:"
echo "   cat ${SQL_FILE} | pbcopy  # macOS"
echo "   OR manually open: ${SQL_FILE}"
echo "3. Paste into the SQL Editor"
echo "4. Click 'Run' (or Cmd/Ctrl + Enter)"
echo ""
echo "📄 SQL file location:"
echo "   ${SQL_FILE}"
echo ""

# Try to copy to clipboard on macOS
if command -v pbcopy &> /dev/null; then
  echo "💡 Tip: Run this to copy SQL to clipboard:"
  echo "   cat ${SQL_FILE} | pbcopy"
  echo ""
fi
