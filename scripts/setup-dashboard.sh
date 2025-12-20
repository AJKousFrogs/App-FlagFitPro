#!/bin/bash

echo "🚀 Setting up FlagFit Pro Dashboard..."

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

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please update .env file with your database credentials"
    echo "🔑 Key variables to update:"
    echo "   - DATABASE_URL (your Neon PostgreSQL connection string)"
    echo "   - JWT_SECRET (for authentication)"
    echo "   - Other API keys as needed"
    echo ""
    echo "Press Enter when you've updated the .env file..."
    read
fi

# Check if database URL is set
if ! grep -q "DATABASE_URL" .env || grep -q "your_neon_connection_string" .env; then
    echo "❌ Please update DATABASE_URL in .env file with your Neon database connection string"
    exit 1
fi

echo "✅ Environment variables configured"

# Seed the database
echo "🌱 Seeding database with sample data..."
npm run seed

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi

echo "✅ Database seeded successfully"

# Start the server
echo "🚀 Starting the server..."
echo "📱 Dashboard will be available at: http://localhost:3001"
echo "🌐 Login page: http://localhost:3001/login.html"
echo "🌐 Dashboard wireframe: dashboard-complete-wireframe.html"
echo ""
echo "💡 Quick Start:"
echo "   1. Open login.html in your browser"
echo "   2. Use any email and password to login"
echo "   3. You'll be redirected to the dashboard"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
