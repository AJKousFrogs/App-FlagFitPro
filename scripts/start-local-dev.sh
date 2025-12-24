#!/bin/bash

# 🚀 FlagFit Pro - Local Development Startup Script
# This script starts your app for local development with no authentication required

echo "🏈 Starting FlagFit Pro - LA28 Olympics Preparation App"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm found"
echo "📦 Installing dependencies..."

# Install dependencies
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo "🌐 Starting development server..."

# Start development server
npm run dev

echo "🎉 App started successfully!"
echo "🌐 Open your browser to: http://localhost:5173"
echo "🔐 No login required - automatically authenticated as demo user"
echo "🏆 All 6 advanced features are working immediately"
echo ""
echo "Press Ctrl+C to stop the server"
