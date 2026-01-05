#!/bin/bash
set -e

echo "Removing @layer from remaining component SCSS files..."

# Find all component SCSS files with @layer
files=$(find src/app -name "*.component.scss" -type f -exec grep -l "@layer" {} \;)

count=0
for file in $files; do
  echo "Processing: $file"

  # Create backup if not exists
  if [ ! -f "$file.layer-backup" ]; then
    cp "$file" "$file.layer-backup"
  fi

  # Use a more robust Python script for complex editing
  python3 - "$file" <<'PYTHON'
import sys
import re

file_path = sys.argv[1]

with open(file_path, 'r') as f:
    lines = f.readlines()

# Find @layer line
layer_line = -1
for i, line in enumerate(lines):
    if re.match(r'^@layer\s', line):
        layer_line = i
        break

if layer_line == -1:
    print(f"  ⚠ No @layer found in {file_path}")
    sys.exit(0)

# Find matching closing brace (last line with just "}")
closing_line = -1
for i in range(len(lines) - 1, -1, -1):
    if lines[i].strip() == '}':
        closing_line = i
        break

if closing_line == -1:
    print(f"  ⚠ No closing brace found in {file_path}")
    sys.exit(0)

# Remove @layer line and closing brace
new_lines = []
for i, line in enumerate(lines):
    if i == layer_line or i == closing_line:
        continue
    # Un-indent lines between @layer and closing brace
    if layer_line < i < closing_line:
        # Remove 2 spaces of indentation
        if line.startswith('  '):
            new_lines.append(line[2:])
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

# Write back
with open(file_path, 'w') as f:
    f.writelines(new_lines)

print(f"  ✓ Removed @layer from {file_path}")
PYTHON

  if [ $? -eq 0 ]; then
    count=$((count + 1))
  fi
done

echo ""
echo "✅ Processed $count files"
echo "Backups saved with .layer-backup extension"
