#!/bin/bash
# dev-clean.sh - Clean development environment script for Claude Code/Cursor
# Fixes service worker cache conflicts with Radix UI

set -e  # Exit on any error

echo ""
echo "🧹 Flag Football App - Development Environment Cleaner"
echo "======================================================="
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill processes on port
kill_port() {
    local port=$1
    echo "🔍 Checking for processes on port $port..."
    
    if command_exists lsof; then
        local pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "💀 Killing processes on port $port: $pids"
            echo "$pids" | xargs kill -9 2>/dev/null || true
            sleep 1
        else
            echo "✅ No processes found on port $port"
        fi
    else
        echo "⚠️  lsof not available, skipping port cleanup"
    fi
}

# Function to clean cache directories
clean_cache() {
    echo "🧹 Cleaning cache directories..."
    
    # Remove Vite cache
    if [ -d ".vite" ]; then
        echo "   Removing .vite cache..."
        rm -rf .vite
    fi
    
    # Remove dist directory
    if [ -d "dist" ]; then
        echo "   Removing dist directory..."
        rm -rf dist
    fi
    
    # Remove general cache directories
    for cache_dir in ".cache" "node_modules/.cache" ".parcel-cache" ".next"; do
        if [ -d "$cache_dir" ]; then
            echo "   Removing $cache_dir..."
            rm -rf "$cache_dir"
        fi
    done
    
    echo "✅ Cache directories cleaned"
}

# Function to clean node modules (if requested)
clean_node_modules() {
    if [ "$1" = "--fresh" ] || [ "$1" = "--full" ]; then
        echo "🗑️  Performing fresh install..."
        
        if [ -f "package-lock.json" ]; then
            echo "   Removing package-lock.json..."
            rm -f package-lock.json
        fi
        
        if [ -d "node_modules" ]; then
            echo "   Removing node_modules..."
            rm -rf node_modules
        fi
        
        echo "📦 Installing fresh dependencies..."
        npm install
        
        echo "✅ Fresh installation complete"
    fi
}

# Function to display cleanup instructions
show_browser_instructions() {
    echo ""
    echo "🌐 Browser Cleanup Instructions for Claude Code/Cursor:"
    echo "========================================================="
    echo ""
    echo "If you still see 'Safari Can't Connect to Server' errors:"
    echo ""
    echo "1. 🔧 Manual Browser Cleanup:"
    echo "   • Open DevTools (F12 or right-click → Inspect)"
    echo "   • Go to Application tab"
    echo "   • Click 'Storage' → 'Clear site data'"
    echo "   • Check ALL boxes (especially Service Workers)"
    echo "   • Click 'Clear site data'"
    echo ""
    echo "2. 🔄 Hard Refresh:"
    echo "   • Press Ctrl+Shift+R (Cmd+Shift+R on Mac)"
    echo "   • Or right-click refresh → 'Empty Cache and Hard Reload'"
    echo ""
    echo "3. 🛠️  Service Worker Check:"
    echo "   • DevTools → Application → Service Workers"
    echo "   • Click 'Unregister' for any localhost:8888 workers"
    echo ""
    echo "4. 🎯 Automated Cleanup:"
    echo "   • Visit: http://localhost:8888/cleanup.html"
    echo "   • Click 'Full Cleanup' button"
    echo ""
    echo "5. 🚫 Prevention:"
    echo "   • Service Workers are now DISABLED in development"
    echo "   • Use Incognito mode for clean testing"
    echo "   • Check 'Disable cache' in Network tab while developing"
    echo ""
}

# Main execution
main() {
    # Parse arguments
    FRESH_INSTALL=false
    
    for arg in "$@"; do
        case $arg in
            --fresh|--full)
                FRESH_INSTALL=true
                ;;
            --help|-h)
                echo "Usage: $0 [--fresh] [--help]"
                echo ""
                echo "Options:"
                echo "  --fresh    Perform fresh npm install (removes node_modules)"
                echo "  --help     Show this help message"
                echo ""
                exit 0
                ;;
        esac
    done
    
    # Step 1: Kill processes on development ports
    echo "1. 🔌 Cleaning up ports..."
    kill_port 8888
    kill_port 4001
    kill_port 3000
    
    # Step 2: Clean cache directories
    echo ""
    echo "2. 🧹 Cleaning cache..."
    clean_cache
    
    # Step 3: Clean node modules if requested
    echo ""
    echo "3. 📦 Managing dependencies..."
    clean_node_modules "$1"
    
    # Step 4: Show browser cleanup instructions
    show_browser_instructions
    
    # Step 5: Start development server
    echo ""
    echo "4. 🚀 Starting development server..."
    echo ""
    echo "   Server will start on: http://localhost:8888"
    echo "   Cleanup tool available at: http://localhost:8888/cleanup.html"
    echo ""
    echo "   🚫 Service Workers are DISABLED in development"
    echo "   ✅ Radix UI cache conflicts should be resolved"
    echo ""
    
    # Check if npm is available
    if command_exists npm; then
        echo "Starting npm development server..."
        npm run dev
    else
        echo "❌ npm not found. Please install Node.js and npm first."
        exit 1
    fi
}

# Run main function with all arguments
main "$@"
