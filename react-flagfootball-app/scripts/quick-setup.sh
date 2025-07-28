#!/bin/bash

echo "🚀 Quick PocketBase Setup"
echo "========================"
echo ""
echo "This script will automatically create all required collections."
echo "You'll need your admin credentials that you created earlier."
echo ""
echo "Admin credentials you created:"
echo "- Email: admin@flagfootball.com"
echo "- Password: admin123456"
echo ""
echo "Or use your custom credentials if you created different ones."
echo ""

cd "/Users/aljosaursakous/Desktop/Flag football HTML - APP/react-flagfootball-app"

echo "🔄 Running automated setup..."
node scripts/auto-setup-collections.js

echo ""
echo "🎯 Next steps:"
echo "1. Check if all collections were created successfully"
echo "2. Refresh your React app at http://localhost:3000"
echo "3. Test the login/registration functionality"
echo ""
echo "📱 Your app should now work without connection errors!"