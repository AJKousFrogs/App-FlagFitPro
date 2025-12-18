#!/bin/bash

# Angular 21 Migration Script
# This script automates the migration from Angular 19 to Angular 21

set -e  # Exit on error

echo "🚀 Starting Angular 21 Migration..."
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the angular directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: This script must be run from the angular directory${NC}"
    exit 1
fi

# Backup check
echo -e "${YELLOW}⚠️  Make sure you have committed your changes or created a backup!${NC}"
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Step 1: Update Angular CLI globally (optional but recommended)
echo ""
echo -e "${BLUE}Step 1: Updating Angular CLI...${NC}"
npm install -g @angular/cli@21 || echo "Global CLI update skipped (optional)"

# Step 2: Update Angular packages
echo ""
echo -e "${BLUE}Step 2: Updating Angular packages to version 21...${NC}"
npx ng update @angular/core@21 @angular/cli@21 --force --allow-dirty

# Step 3: Update PrimeNG
echo ""
echo -e "${BLUE}Step 3: Updating PrimeNG to version 21...${NC}"
npm install primeng@^21.0.0 primeicons@^7.0.0

# Step 4: Update TypeScript (if not updated automatically)
echo ""
echo -e "${BLUE}Step 4: Ensuring TypeScript is updated...${NC}"
npm install --save-dev typescript@~5.9.0

# Step 5: Update Zone.js (if not updated automatically)
echo ""
echo -e "${BLUE}Step 5: Ensuring Zone.js is updated...${NC}"
npm install zone.js@~0.16.0

# Step 6: Update @types/node
echo ""
echo -e "${BLUE}Step 6: Updating @types/node...${NC}"
npm install --save-dev @types/node@^24.0.0

# Step 7: Clean install
echo ""
echo -e "${BLUE}Step 7: Cleaning and reinstalling dependencies...${NC}"
rm -rf node_modules package-lock.json
npm install

# Step 8: Check for NgClass/NgStyle usage
echo ""
echo -e "${BLUE}Step 8: Checking for NgClass/NgStyle usage...${NC}"
if grep -r "ngClass\|NgClass" src/ --include="*.ts" --include="*.html" > /dev/null 2>&1; then
    echo -e "${YELLOW}Found NgClass usage. Consider running: ng generate @angular/core:ngclass-to-class${NC}"
fi

if grep -r "ngStyle\|NgStyle" src/ --include="*.ts" --include="*.html" > /dev/null 2>&1; then
    echo -e "${YELLOW}Found NgStyle usage. Consider running: ng generate @angular/core:ngstyle-to-style${NC}"
fi

# Step 9: Build test
echo ""
echo -e "${BLUE}Step 9: Testing build...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed. Please review errors above.${NC}"
    exit 1
fi

# Step 10: Summary
echo ""
echo -e "${GREEN}=================================="
echo "Migration Complete!"
echo "==================================${NC}"
echo ""
echo "Next steps:"
echo "1. Review ANGULAR_21_MIGRATION.md for details"
echo "2. Test your application: npm start"
echo "3. Run tests: npm test"
echo "4. Check for any console warnings"
echo "5. Test all features thoroughly"
echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "- Test all PrimeNG components"
echo "- Verify all features work correctly"
echo "- Check for any deprecated API usage"
echo "- Review TypeScript errors"
echo ""




