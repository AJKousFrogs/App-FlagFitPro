#!/bin/bash
set -euo pipefail

# Flag Football Training App - Netlify Deployment Script
# Best practices: Exit on error, undefined vars, pipe failures

# Error handling trap
trap 'echo "❌ Deployment failed at line $LINENO"; exit 1' ERR

echo "🏈 Deploying Flag Football Training App to Netlify..."

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Build the application
echo "📦 Building application..."
npm run build

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
netlify deploy --prod

echo "✅ Deployment complete!"
echo "🌐 Your Olympic-level Flag Football Training App is now live!"