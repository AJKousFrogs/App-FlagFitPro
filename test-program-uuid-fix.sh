#!/bin/bash

# Test script to verify program assignment fix
# This checks that the correct program UUIDs are referenced in the code

echo "🔍 Testing Program UUID Configuration..."
echo ""

# Expected UUIDs (from database)
QB_UUID="11111111-1111-1111-1111-111111111111"
WRDB_UUID="22222222-2222-2222-2222-222222222222"

# Wrong UUIDs (what was causing the bug)
WRONG_QB="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
WRONG_WRDB="ffffffff-ffff-ffff-ffff-ffffffffffff"

echo "✅ Expected UUIDs:"
echo "   QB:    $QB_UUID"
echo "   WR/DB: $WRDB_UUID"
echo ""

# Check frontend service
echo "📦 Checking frontend (player-program.service.ts)..."
if grep -q "$QB_UUID" angular/src/app/core/services/player-program.service.ts && \
   grep -q "$WRDB_UUID" angular/src/app/core/services/player-program.service.ts; then
  echo "   ✅ Frontend has CORRECT UUIDs"
else
  echo "   ❌ Frontend has WRONG UUIDs"
  exit 1
fi

# Check backend API
echo "📦 Checking backend (player-programs.cjs)..."
if grep -q "$QB_UUID" netlify/functions/player-programs.cjs && \
   grep -q "$WRDB_UUID" netlify/functions/player-programs.cjs; then
  echo "   ✅ Backend has CORRECT UUIDs"
else
  echo "   ❌ Backend has WRONG UUIDs"
  exit 1
fi

# Check backfill script
echo "📦 Checking backfill script..."
if grep -q "$QB_UUID" scripts/backfill-player-programs.cjs && \
   grep -q "$WRDB_UUID" scripts/backfill-player-programs.cjs; then
  echo "   ✅ Backfill script has CORRECT UUIDs"
else
  echo "   ❌ Backfill script has WRONG UUIDs"
  exit 1
fi

# Verify no old UUIDs remain (except in docs/tests)
echo ""
echo "🔍 Checking for old (incorrect) UUIDs in code..."
WRONG_REFS=$(grep -r "$WRONG_QB\|$WRONG_WRDB" \
  --include="*.ts" --include="*.js" --include="*.cjs" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude="*.test.js" \
  --exclude="*.md" \
  . | wc -l)

if [ "$WRONG_REFS" -eq 0 ]; then
  echo "   ✅ No incorrect UUIDs found in code"
else
  echo "   ⚠️  Found $WRONG_REFS references to old UUIDs (check if they're in tests/docs)"
  grep -r "$WRONG_QB\|$WRONG_WRDB" \
    --include="*.ts" --include="*.js" --include="*.cjs" \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude="*.test.js" \
    --exclude="*.md"
fi

echo ""
echo "✅ All program UUID checks passed!"
echo ""
echo "📝 Next steps:"
echo "   1. Deploy these changes to production"
echo "   2. Test onboarding with a new user"
echo "   3. Verify program assignment succeeds"
echo "   4. Check player_programs table has active row"
