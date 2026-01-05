#!/bin/bash
set -e

echo "Removing @layer from component SCSS files..."

# Find all component SCSS files with @layer
files=$(find src/app -name "*.component.scss" -type f -exec grep -l "@layer" {} \;)

count=0
for file in $files; do
  echo "Processing: $file"

  # Create backup
  cp "$file" "$file.layer-backup"

  # Find the line numbers for @layer and its closing brace
  layer_line=$(grep -n "^@layer" "$file" | head -1 | cut -d: -f1)

  if [ -n "$layer_line" ]; then
    # Find the matching closing brace (last line with just a closing brace)
    # Typically it's the last line or second-to-last line
    total_lines=$(wc -l < "$file")

    # Try to find the closing brace (look for a line with just "}")
    closing_line=$(tail -20 "$file" | grep -n "^}$" | tail -1 | cut -d: -f1)

    if [ -n "$closing_line" ]; then
      # Calculate actual line number from end of file
      actual_closing=$((total_lines - 20 + closing_line))

      # Remove the @layer line
      sed -i '' "${layer_line}d" "$file"

      # Remove the closing brace (now one line less due to previous deletion)
      new_closing=$((actual_closing - 1))
      sed -i '' "${new_closing}d" "$file"

      # Un-indent all lines between the removed @layer and closing brace
      # (now 2 lines less, so adjust range)
      start=$((layer_line))
      end=$((new_closing - 1))

      # Un-indent by 2 spaces
      sed -i '' "${start},${end}s/^  //" "$file"

      count=$((count + 1))
      echo "  ✓ Removed @layer from $file"
    else
      echo "  ⚠ Could not find closing brace for $file"
    fi
  fi
done

echo ""
echo "✅ Processed $count files"
echo "Backups saved with .layer-backup extension"
