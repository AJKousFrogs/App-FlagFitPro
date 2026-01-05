#!/bin/bash
# ============================================================================
# Remove unnecessary !important from top 5 problematic files
# Target: 197 !important flags across 5 files
# Strategy: Remove !important and rely on CSS specificity instead
# ============================================================================

set -e

echo "🎯 Fixing !important in top 5 files..."
echo ""

files=(
  "src/app/features/profile/profile.component.scss"
  "src/app/shared/components/morning-briefing/morning-briefing.component.scss"
  "src/app/features/settings/settings.component.scss"
  "src/app/shared/components/button/button.component.scss"
  "src/app/shared/components/search-panel/search-panel.component.scss"
)

total_removed=0

for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "⚠️  File not found: $file"
    continue
  fi

  echo "📝 Processing: $file"

  # Count before
  before=$(grep -c "!important" "$file" || echo "0")

  # Create backup
  cp "$file" "$file.important-backup"

  # STRATEGY: Remove !important and let CSS cascade/specificity work
  # Since we fixed ViewEncapsulation.None, proper scoping should work

  # Remove !important but keep the value
  sed -i '' 's/ !important//g' "$file"

  # Count after
  after=$(grep -c "!important" "$file" || echo "0")

  removed=$((before - after))
  total_removed=$((total_removed + removed))

  echo "  ✅ Removed $removed !important flags"
  echo "  ℹ️  Remaining: $after"
  echo ""
done

echo "✅ Complete!"
echo "   Total !important flags removed: $total_removed"
echo "   Backups saved with .important-backup extension"
echo ""
echo "⚠️  IMPORTANT: Test these components carefully:"
echo "   - Profile page tabs and layout"
echo "   - Morning briefing cards"
echo "   - Settings dialog interactions"
echo "   - Button component states"
echo "   - Search panel behavior"
echo ""
echo "If any styling breaks, we can restore from backups"
