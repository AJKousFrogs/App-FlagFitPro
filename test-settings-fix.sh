#!/bin/bash

# Test Script for Settings Save Fix
# This script helps verify that the settings save functionality is working correctly

echo "🔍 Testing Settings Save Functionality..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if Angular dev server is running
echo "1. Checking if dev server is running..."
if curl -s http://localhost:4200 > /dev/null; then
    echo -e "${GREEN}✓ Dev server is running${NC}"
else
    echo -e "${RED}✗ Dev server is not running${NC}"
    echo "Please start the dev server with: npm start"
    exit 1
fi

# Step 2: Check TypeScript compilation
echo ""
echo "2. Checking TypeScript compilation..."
cd angular
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    echo -e "${RED}✗ TypeScript compilation errors found${NC}"
    npx tsc --noEmit | grep "error TS" | head -10
    exit 1
else
    echo -e "${GREEN}✓ No TypeScript errors${NC}"
fi
cd ..

# Step 3: Check if required files were modified
echo ""
echo "3. Verifying modified files..."
required_files=(
    "angular/src/app/features/settings/settings.component.ts"
    "angular/src/app/features/settings/settings.component.html"
    "angular/src/app/core/services/auth.service.ts"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        echo -e "${RED}✗ $file not found${NC}"
        exit 1
    fi
done

# Step 4: Check for key changes in the code
echo ""
echo "4. Verifying key code changes..."

# Check for isSavingSettings signal
if grep -q "isSavingSettings = signal" "angular/src/app/features/settings/settings.component.ts"; then
    echo -e "${GREEN}✓ Loading state signal added${NC}"
else
    echo -e "${RED}✗ Loading state signal not found${NC}"
fi

# Check for upsert
if grep -q "\.upsert(updateData" "angular/src/app/features/settings/settings.component.ts"; then
    echo -e "${GREEN}✓ Upsert operation implemented${NC}"
else
    echo -e "${RED}✗ Upsert operation not found${NC}"
fi

# Check for refreshUser method
if grep -q "async refreshUser" "angular/src/app/core/services/auth.service.ts"; then
    echo -e "${GREEN}✓ Auth refresh method added${NC}"
else
    echo -e "${RED}✗ Auth refresh method not found${NC}"
fi

# Check for enhanced logging
if grep -q "this.logger.info.*Upserting users table" "angular/src/app/features/settings/settings.component.ts"; then
    echo -e "${GREEN}✓ Enhanced logging added${NC}"
else
    echo -e "${RED}✗ Enhanced logging not found${NC}"
fi

# Step 5: Manual testing instructions
echo ""
echo "=================================="
echo "📋 Manual Testing Required"
echo "=================================="
echo ""
echo "Please perform the following tests in your browser:"
echo ""
echo "1. Navigate to: http://localhost:4200/settings"
echo ""
echo "2. Open Browser DevTools (F12 or Cmd+Option+I)"
echo "   - Go to the Console tab"
echo ""
echo "3. Make a change to your profile:"
echo "   - Update your display name"
echo "   - Add or update date of birth"
echo "   - Select a position"
echo ""
echo "4. Click 'Save Changes' button"
echo ""
echo "5. Check the Console for log messages:"
echo -e "   ${GREEN}Expected logs:${NC}"
echo "   - 'Saving settings for user: <id>'"
echo "   - 'Settings saved to localStorage'"
echo "   - 'Upserting users table with: <data>'"
echo "   - 'User profile upserted successfully'"
echo "   - 'Services refreshed successfully'"
echo ""
echo "6. Verify success toast appears"
echo ""
echo "7. Refresh the page (Cmd+R or F5)"
echo ""
echo "8. Verify your changes persisted"
echo ""
echo "=================================="
echo "🐛 Troubleshooting"
echo "=================================="
echo ""
echo "If changes don't persist:"
echo ""
echo "1. Check browser console for errors"
echo "   - Red error messages indicate issues"
echo ""
echo "2. Check localStorage:"
echo "   - Open DevTools → Application → Local Storage"
echo "   - Look for 'user_settings' key"
echo "   - Verify it contains your changes"
echo ""
echo "3. Check Supabase connection:"
echo "   - Verify .env.local has correct SUPABASE_URL"
echo "   - Check network tab for API calls"
echo "   - Look for 401 or 403 errors (auth issues)"
echo ""
echo "4. Check RLS policies:"
echo "   - User must have INSERT and UPDATE permissions"
echo "   - on 'users' and 'user_settings' tables"
echo ""
echo "For detailed fix information, see: SETTINGS_FIX_SUMMARY.md"
echo ""
