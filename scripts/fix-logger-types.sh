#!/bin/bash

# Script to fix logger type errors across the Angular codebase
# This script makes systematic replacements to fix common logger call patterns

set -e

ANGULAR_SRC="angular/src/app"

echo "🔧 Fixing logger type errors..."
echo ""

# Step 1: Add import for error utilities at the top of files that use logger.error with unknown
echo "Step 1: Adding error-utils import to files..."
find "$ANGULAR_SRC" -type f -name "*.ts" ! -name "*.spec.ts" -exec grep -l "this\.logger\.error" {} \; | while read -r file; do
  # Check if file already has the import
  if ! grep -q "import.*toError.*from.*error-utils" "$file"; then
    # Check if it has LoggerService import
    if grep -q "import.*LoggerService" "$file"; then
      # Add import after the logger import line
      sed -i.bak '/import.*LoggerService/a\
import { toError, toLogContext } from "../../core/utils/error-utils";
' "$file" && rm "${file}.bak"
      echo "  ✓ Added import to $file"
    fi
  fi
done

echo ""
echo "Step 2: Fixing error() calls with unknown type..."

# Fix pattern: this.logger.error("message", error) where error is unknown
# Replace with: this.logger.error("message", toError(error))
find "$ANGULAR_SRC" -type f -name "*.ts" ! -name "*.spec.ts" -print0 | while IFS= read -r -d '' file; do
  # Create backup
  cp "$file" "$file.backup"
  
  # Fix common error variable names in error() calls
  perl -i -pe 's/(this\.logger\.error\([^,)]+,\s+)(error|err|e)(\s*[,)])/${1}toError($2)${3}/g' "$file"
  
  # Check if file changed
  if ! cmp -s "$file" "$file.backup"; then
    echo "  ✓ Fixed $file"
  fi
  
  rm "$file.backup"
done

echo ""
echo "Step 3: Fixing warn() calls with unknown type in context position..."

# Fix pattern: this.logger.warn("message", error) 
# Replace with: this.logger.warn("message", toLogContext(error))
find "$ANGULAR_SRC" -type f -name "*.ts" ! -name "*.spec.ts" -print0 | while IFS= read -r -d '' file; do
  cp "$file" "$file.backup"
  
  # Fix warn calls with unknown in context position
  perl -i -pe 's/(this\.logger\.warn\([^,)]+,\s+)(error|err|e)(\s*\))/${1}toLogContext($2)${3}/g' "$file"
  
  if ! cmp -s "$file" "$file.backup"; then
    echo "  ✓ Fixed $file"
  fi
  
  rm "$file.backup"
done

echo ""
echo "Step 4: Fixing info/debug/success calls with string as LogContext..."

# Fix calls like: this.logger.info("message", someString)
# Replace with: this.logger.info("message", toLogContext(someString))
find "$ANGULAR_SRC" -type f -name "*.ts" ! -name "*.spec.ts" -print0 | while IFS= read -r -d '' file; do
  cp "$file" "$file.backup"
  
  # Fix info/debug/success calls
  perl -i -pe 's/(this\.logger\.(info|debug|success)\([^,)]+,\s+)([a-zA-Z_][a-zA-Z0-9_]*\.(message|id|name|type|code))(\s*[,)])/${1}toLogContext($3)${5}/g' "$file"
  
  if ! cmp -s "$file" "$file.backup"; then
    echo "  ✓ Fixed $file"
  fi
  
  rm "$file.backup"
done

echo ""
echo "✅ Logger type fixes applied!"
echo ""
echo "Running TypeScript compilation to check for remaining errors..."
cd angular && npx ng build --configuration production
