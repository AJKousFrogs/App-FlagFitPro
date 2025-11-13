# Development Server Guide

## 🚀 Quick Start

### Start Development Server with Hot Reload & Bug Fixing

```bash
npm run dev:bugfix
```

Or use the convenience script:
```bash
./start-dev.sh
```

## 📋 Available Commands

### Development Servers

- **`npm run dev:bugfix`** - Starts both API server (port 3001) and enhanced dev server (port 4000) with hot reload and bug fixing
- **`npm run dev:enhanced`** - Starts only the enhanced dev server with hot reload and bug fixing (port 4000)
- **`npm run dev:api`** - Starts only the API server (port 3001)
- **`npm run dev:hot`** - Starts the original hot reload server
- **`npm run dev:frontend`** - Starts simple static file server (port 4000)

### Access URLs

- **Frontend Dev Server**: http://localhost:4000
- **API Server**: http://localhost:3001
- **Health Check**: http://localhost:4000/dev/health

## 🔥 Features

### Hot Reload
- Automatically reloads browser when HTML, CSS, or JS files change
- CSS changes reload without full page refresh
- WebSocket-based for instant updates

### Bug Detection & Auto-Fixing
- **ESLint Integration**: Automatically runs ESLint and fixes issues on file save
- **Common Bug Detection**:
  - Console.log statements (warnings)
  - Undefined/null checks
  - Memory leaks (setInterval without clearInterval)
  - Trailing whitespace
- **Auto-Fix**: Automatically fixes formatting issues and ESLint errors

### File Watching
- Watches all `.html`, `.css`, `.js` files
- Watches `src/` directory recursively
- Ignores `node_modules/`, `tests/`, and backup files

## 🐛 Bug Fixing Features

The enhanced dev server automatically:

1. **Detects bugs** when files are saved:
   - Console.log statements
   - Potential memory leaks
   - Code quality issues

2. **Auto-fixes issues**:
   - Runs ESLint with `--fix` flag
   - Removes trailing whitespace
   - Formats code automatically

3. **Reports issues** in console:
   - Shows file path and line number
   - Displays bug type (error/warning)
   - Shows the problematic code

## 📝 Example Output

```
📁 File changed: src/auth-manager.js
✅ ESLint: src/auth-manager.js - No issues
🔧 Auto-fixed 2 issues in src/auth-manager.js

🐛 Bugs detected in src/auth-manager.js:
   ⚠️  Line 45: console.log found - consider removing for production
   Code: console.log('User authenticated');
```

## 🛑 Stopping the Server

Press `Ctrl+C` in the terminal to stop both servers gracefully.

## 🔧 Troubleshooting

### Port Already in Use

If port 4000 or 3001 is already in use:

```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

Or use the startup script which handles this automatically:
```bash
./start-dev.sh
```

### Hot Reload Not Working

1. Check browser console for WebSocket connection errors
2. Ensure firewall isn't blocking WebSocket connections
3. Try refreshing the page manually
4. Check that the dev server is running on port 4000

## 📚 Additional Resources

- ESLint config: `eslint.config.js`
- Server config: `dev-server-enhanced.cjs`
- API server: `server.js`

