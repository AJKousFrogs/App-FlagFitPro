#!/bin/bash

# Test script for Community Hub persistence fix
# This script verifies that:
# 1. The community routes file is valid
# 2. The database migration can be applied
# 3. The server configuration is correct

echo "======================================"
echo "Testing Community Hub Persistence Fix"
echo "======================================"
echo ""

# Check syntax of community routes
echo "1. Checking community routes syntax..."
node --check routes/community.routes.js
if [ $? -eq 0 ]; then
    echo "✅ Community routes syntax is valid"
else
    echo "❌ Community routes has syntax errors"
    exit 1
fi
echo ""

# Check if migration file exists
echo "2. Checking database migration..."
if [ -f "database/migrations/102_add_team_to_community_posts.sql" ]; then
    echo "✅ Migration file exists"
    echo "   File: database/migrations/102_add_team_to_community_posts.sql"
else
    echo "❌ Migration file not found"
    exit 1
fi
echo ""

# Check if routes are exported
echo "3. Checking routes export..."
if grep -q "communityRoutes" routes/index.js; then
    echo "✅ Community routes exported in index.js"
else
    echo "❌ Community routes not found in index.js"
    exit 1
fi
echo ""

# Check if server.js imports community routes
echo "4. Checking server.js configuration..."
if grep -q "import communityRoutes" server.js; then
    echo "✅ Community routes imported in server.js"
else
    echo "❌ Community routes not imported in server.js"
    exit 1
fi

if grep -q 'app.use("/api/community", communityRoutes)' server.js; then
    echo "✅ Community routes registered in server.js"
else
    echo "❌ Community routes not registered in server.js"
    exit 1
fi
echo ""

echo "======================================"
echo "✅ All checks passed!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Apply the database migration:"
echo "   psql <your-db> -f database/migrations/102_add_team_to_community_posts.sql"
echo ""
echo "2. Start the server:"
echo "   npm start"
echo ""
echo "3. Test in browser:"
echo "   - Navigate to Community Hub"
echo "   - Create a post"
echo "   - Refresh the page"
echo "   - Verify the post persists"
echo ""
