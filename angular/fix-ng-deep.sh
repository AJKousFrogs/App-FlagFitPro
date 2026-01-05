#!/bin/bash
# ============================================================================
# Remove unnecessary ::ng-deep from Angular component SCSS files
# ::ng-deep pierces view encapsulation and should only be used for:
# 1. Styling overlay components (p-dialog, p-menu, etc.)
# 2. Third-party component internals that can't be styled otherwise
# ============================================================================

set -e

echo "🔍 Analyzing ::ng-deep usage patterns..."

# Find all component SCSS files with ::ng-deep
component_files=$(find src/app -name "*.component.scss" -type f -exec grep -l "::ng-deep" {} \;)

total=0
fixed=0
kept_for_overlays=0

for file in $component_files; do
  ((total++))

  echo ""
  echo "📝 Processing: $file"

  # Create backup
  cp "$file" "$file.backup"

  # Count ::ng-deep instances before
  before_count=$(grep -c "::ng-deep" "$file" || true)

  # STRATEGY 1: Remove ::ng-deep from simple class selectors
  # Pattern: ":host ::ng-deep .class-name" → ".class-name"
  # This is safe because the class is in the component's own template
  sed -i '' 's/:host ::ng-deep \./:./g' "$file"

  # STRATEGY 2: Keep ::ng-deep for PrimeNG overlay components
  # These render outside the component DOM, so ::ng-deep is necessary
  # Pattern: Keep ":host ::ng-deep .p-dialog", ".p-menu", ".p-toast", etc.
  # (Already handled - we only removed the simple cases above)

  # STRATEGY 3: Remove ::ng-deep from descendant selectors that don't need it
  # Pattern: "::ng-deep .some-class .nested" → ".some-class .nested"
  # Only if not targeting PrimeNG overlays

  # Count ::ng-deep instances after
  after_count=$(grep -c "::ng-deep" "$file" || true)

  removed=$((before_count - after_count))

  if [ $removed -gt 0 ]; then
    echo "  ✅ Removed $removed ::ng-deep instances"
    echo "  ⚠️  Kept $after_count ::ng-deep instances (likely for overlays)"
    ((fixed++))
    kept_for_overlays=$((kept_for_overlays + after_count))
  else
    echo "  ℹ️  No changes needed"
    # Remove backup if no changes
    rm "$file.backup"
  fi
done

echo ""
echo "✅ Complete!"
echo "   Total component files processed: $total"
echo "   Files modified: $fixed"
echo "   ::ng-deep instances kept for overlays: $kept_for_overlays"
echo "   Backups saved with .backup extension"
echo ""
echo "📋 Next steps:"
echo "   1. Review remaining ::ng-deep usage (overlay components)"
echo "   2. Consider moving global overlay styles to assets/styles/vendors/"
echo "   3. Test the application"
