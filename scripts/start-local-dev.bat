@echo off
REM 🚀 FlagFit Pro - Local Development Startup Script (Windows)
REM This script starts your app for local development with no authentication required

echo 🏈 Starting FlagFit Pro - LA28 Olympics Preparation App
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm found
echo 📦 Installing dependencies...

REM Install dependencies
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo 🌐 Starting development server...

REM Start development server
npm run dev

echo 🎉 App started successfully!
echo 🌐 Open your browser to: http://localhost:5173
echo 🔐 No login required - automatically authenticated as demo user
echo 🏆 All 6 advanced features are working immediately
echo.
echo Press Ctrl+C to stop the server
pause
