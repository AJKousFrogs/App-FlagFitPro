#!/bin/bash

# FlagFit Pro - Vercel Deployment Script
# This script commits and pushes the build fixes to trigger a new Vercel deployment

echo "🚀 Starting FlagFit Pro deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "react-flagfootball-app" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Expected to find package.json or react-flagfootball-app directory"
    exit 1
fi

# Navigate to the correct directory if needed
if [ -d "react-flagfootball-app" ]; then
    echo "📁 Found react-flagfootball-app directory, checking if we need to navigate..."
    if [ ! -f "react-flagfootball-app/package.json" ]; then
        echo "❌ Error: react-flagfootball-app directory doesn't contain package.json"
        exit 1
    fi
fi

echo "✅ Directory structure looks good"

# Check git status
echo "📊 Checking git status..."
git status

# Add all changes
echo "📦 Adding all changes to git..."
git add .

# Check what's staged
echo "📋 Staged changes:"
git diff --cached --name-only

# Commit the changes
echo "💾 Committing changes..."
git commit -m "Fix Vercel build: Remove .js extensions from service imports and fix Sentry compatibility

- Fixed module resolution issues in Vercel build
- Removed .js extensions from all service imports
- Fixed Sentry API compatibility issues
- Ensures proper build process for production deployment"

# Push to remote
echo "🚀 Pushing to remote repository..."
git push origin main

echo "✅ Deployment script completed!"
echo ""
echo "📋 Summary:"
echo "   - All service imports fixed (removed .js extensions)"
echo "   - Sentry compatibility issues resolved"
echo "   - Changes committed and pushed to main branch"
echo "   - Vercel should now trigger a new deployment"
echo ""
echo "🔗 Check your Vercel dashboard for deployment status:"
echo "   https://vercel.com/dashboard"
echo ""
echo "🎉 Your FlagFit Pro app should deploy successfully now!" 