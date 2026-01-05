#!/bin/bash
# ============================================================================
# Remove @layer wrappers from Angular component SCSS files
# CSS cascade layers interfere with Angular's view encapsulation
# ============================================================================

set -e

echo "🔍 Finding all component SCSS files with @layer..."

# Find all component SCSS files (exclude global styles in assets/)
component_files=$(find src/app -name "*.component.scss" -type f)

total=0
fixed=0

for file in $component_files; do
  ((total++))

  # Check if file contains @layer
  if grep -q "@layer" "$file"; then
    echo "  📝 Fixing: $file"

    # Create backup
    cp "$file" "$file.backup"

    # Remove @layer wrappers and fix indentation
    # This handles both @layer features and @layer overrides
    awk '
    BEGIN { in_layer = 0; layer_indent = 0 }

    # Match @layer line
    /^@layer (features|overrides) \{/ {
      in_layer = 1
      # Calculate indentation of @layer line
      match($0, /^[[:space:]]*/);
      layer_indent = RLENGTH
      next
    }

    # If were in a layer block
    in_layer == 1 {
      # Check for closing brace at layer indent level
      if ($0 ~ "^[[:space:]]{" layer_indent "}\\}[[:space:]]*$") {
        in_layer = 0
        next
      }
      # Remove one level of indentation (usually 2 spaces)
      if (substr($0, 1, 2) == "  ") {
        print substr($0, 3)
      } else {
        print $0
      }
      next
    }

    # Print all other lines as-is
    { print }
    ' "$file" > "$file.tmp"

    # Replace original file
    mv "$file.tmp" "$file"

    ((fixed++))
  fi
done

echo ""
echo "✅ Complete!"
echo "   Total component files: $total"
echo "   Fixed: $fixed"
echo "   Backups saved with .backup extension"
echo ""
echo "⚠️  Please review changes and test before committing"
