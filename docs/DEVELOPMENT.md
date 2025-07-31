# Development Best Practices

## 🚀 Development Server Management

### Keep Development Server Running
- **DO**: Keep `npm run dev` running while coding
- **WHY**: Hot Module Replacement (HMR) provides instant feedback
- **BENEFIT**: Changes appear immediately without manual refresh

### Only Restart When Necessary
Stop and restart the development server **only** when:

#### 🔄 **Always Restart Required:**
- **Adding new dependencies** - `npm install` or `yarn add`
- **Changing configuration files**:
  - `vite.config.js`
  - `package.json`
  - `.env` files
  - `tsconfig.json`
- **Installing new Vite plugins**
- **Changing environment variables**

#### ⚠️ **Sometimes Restart Required:**
- **Persistent HMR errors** - Try refresh first, then restart
- **Memory issues** - Development server using excessive RAM
- **Port conflicts** - When switching between projects
- **Cache issues** - Stale module resolution

#### ✅ **No Restart Needed:**
- Editing React components (`.jsx`, `.tsx`)
- Modifying CSS/SCSS files
- Updating JavaScript/TypeScript files
- Adding new components or pages
- Changing props or state

## 📁 File System Best Practices

### Avoid Cloud-Synced Folders
**❌ DON'T develop in these locations:**
- OneDrive folders (`C:\Users\{user}\OneDrive\`)
- Dropbox folders
- Google Drive File Stream folders
- iCloud Drive folders
- Box Sync folders

**✅ DO use these locations:**
- Local drive: `C:\dev\projects\` (Windows)
- Local drive: `~/dev/projects/` (Mac/Linux)
- External SSD (if fast enough)
- WSL filesystem: `/home/{user}/projects/` (WSL users)

### Why Cloud Folders Cause Issues:
- **File locking** - Cloud sync can lock files during upload
- **Sync delays** - Changes may not be immediately available
- **Performance** - File operations are slower
- **HMR issues** - File watchers may not work correctly
- **Build failures** - Intermediate files may be synced/corrupted

### File Permissions
Ensure proper file permissions for development:

```bash
# Check permissions (Mac/Linux)
ls -la

# Fix permissions if needed (Mac/Linux)
chmod -R 755 .
chmod -R 644 *.json *.md *.js *.jsx *.ts *.tsx

# Windows - Run as Administrator if needed
# Right-click project folder → Properties → Security
```

## 🛠️ Quick Troubleshooting Steps

### 🚀 **One-Command Solutions**
```bash
# Step 1: Quick troubleshoot (clears cache + checks environment + restarts)
npm run troubleshoot

# Step 2: Deep clean (removes node_modules + reinstalls + checks environment)  
npm run debug

# Step 3: Nuclear option (complete reset)
npm run clean:full
```

### 🔍 **Step-by-Step Troubleshooting**

#### **1. Clear Cache** 🧹
```bash
# Clear Vite cache only
npm run clean:cache

# Clear node_modules and reinstall
npm run clean:node

# Nuclear option - clear everything
npm run clean:full
```

#### **2. Check Console** 🔍
**Browser Developer Console:**
- Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
- Look for **red error messages** in Console tab
- Check **Network tab** for failed requests
- Look for **warning messages** in yellow

**Terminal Console:**
```bash
# Check for build errors
npm run build

# Check for linting issues  
npm run lint

# Run environment diagnostics
npm run doctor
```

#### **3. Verify Dependencies** 📦
```bash
# Check if dependencies are installed
ls node_modules

# Verify key packages exist
npm run doctor  # Includes dependency check

# Update to latest versions (careful!)
npm update

# Check for outdated packages
npm outdated
```

#### **4. Test Incremental Changes** 🔬
```bash
# Start with clean state
git stash  # Save current changes

# Test if issue exists without changes
npm run dev

# Apply changes incrementally
git stash pop
# Test one file change at a time
```

### 🔧 **Common Issues & Solutions**

#### **HMR Not Working?**
1. **Quick fixes** (in order):
   ```bash
   # Refresh browser
   Ctrl+R (Windows/Linux) or Cmd+R (Mac)
   
   # Hard refresh  
   Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   
   # Clear browser cache
   Ctrl+Shift+Delete (Windows/Linux) or Cmd+Shift+Delete (Mac)
   
   # Restart with clean cache
   npm run troubleshoot
   ```

2. **For persistent HMR issues**:
   ```bash
   # Force polling mode (for cloud folders, Docker, WSL)
   npm run dev:polling
   
   # Check if in problematic location
   npm run check:location
   ```

### File Changes Not Detected?
```bash
# Check if in cloud folder - MOVE PROJECT if yes
pwd

# Force polling mode for file watching issues
VITE_USE_POLLING=true npm run dev

# Check file permissions
ls -la src/
```

### Performance Issues?
```bash
# Clear development cache
rm -rf node_modules/.vite
rm -rf dist

# Check memory usage
ps aux | grep node  # Mac/Linux
tasklist | findstr node  # Windows

# Restart with memory limit (if needed)
node --max-old-space-size=4096 node_modules/.bin/vite
```

### Port Conflicts?
```bash
# Check what's using your port
lsof -i :4000  # Mac/Linux
netstat -ano | findstr :4000  # Windows

# Use different port
VITE_DEV_PORT=4001 npm run dev
```

## 🔧 Development Workflow

### Recommended Daily Workflow:
1. **Start development** - `npm run dev` (once per session)
2. **Code continuously** - Edit files, see instant changes
3. **Add dependencies** - Stop server → `npm install` → Restart server
4. **End session** - `Ctrl+C` to stop server

### When Working with Team:
```bash
# Pull latest changes
git pull

# Install any new dependencies (if package.json changed)
npm install

# Start development (only if not running)
npm run dev
```

### Environment Setup Validation:
```bash
# Check if project is in cloud folder
pwd | grep -E "(OneDrive|Dropbox|Google Drive|iCloud)"

# Check Node.js version
node --version  # Should be 18+ for this project

# Check npm version  
npm --version

# Verify Vite can start
npm run dev -- --port 4001 --host localhost
```

## 📝 Quick Reference Commands

### Development Commands:
```bash
# Start development server
npm run dev

# Start with custom port
VITE_DEV_PORT=4001 npm run dev

# Start with polling (for file system issues)
VITE_USE_POLLING=true npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Health check all services
npm run health:check
```

### Troubleshooting Commands:
```bash
# Clear all caches
npm run clean

# Reset development environment
rm -rf node_modules/.vite dist
npm install

# Check port availability
npm run port:info

# Clean up port locks
npm run port:cleanup
```

## 🎯 Performance Tips

### Maximize Development Speed:
1. **Use local SSD** - Fastest file system access
2. **Exclude from antivirus** - Add project folder to exclusions
3. **Close unused apps** - Free up system resources
4. **Use dedicated browser profile** - Separate dev from personal browsing
5. **Enable Fast Refresh** - Already configured in our Vite setup

### VS Code Optimizations:
```json
// .vscode/settings.json
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/.git/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "off"
}
```

## 🚨 Common Pitfalls to Avoid

### ❌ **Don't Do This:**
- Develop in cloud-synced folders
- Restart server for every small change
- Keep multiple dev servers running on same port
- Edit files in `node_modules/`
- Commit `dist/` folder to git
- Run `npm install` while dev server is running

### ✅ **Do This Instead:**
- Use local file system
- Let HMR handle updates automatically
- Use unique ports for different projects
- Create proper components in `src/`
- Build fresh for deployment
- Stop server before installing packages

---

Following these practices will ensure a **smooth, fast development experience** with minimal interruptions and maximum productivity! 🎉