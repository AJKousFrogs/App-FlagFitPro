# 🚨 Quick Troubleshooting Reference

## 🚀 **Emergency Commands** (Try in Order)

```bash
# 1. Quick fix (90% of issues)
npm run troubleshoot

# 2. Deep clean (stubborn issues)  
npm run debug

# 3. Nuclear option (last resort)
npm run clean:full
```

## 🔍 **Diagnostic Commands**

```bash
npm run doctor          # Full environment check
npm run check:env       # Quick environment check
npm run check:location  # Check if in cloud folder
npm run port:info       # Check port usage
```

## ⚡ **Common Issue → Quick Fix**

| Problem | Quick Fix |
|---------|-----------|
| **HMR not working** | `npm run troubleshoot` |
| **Build failing** | `npm run clean:node` |
| **Port conflicts** | `npm run port:cleanup` |
| **Cache issues** | `npm run clean:cache` |
| **Dependencies broken** | `npm run debug` |
| **File watching broken** | `npm run dev:polling` |
| **Everything broken** | `npm run clean:full` |

## 🔧 **Step-by-Step Troubleshooting**

### 1. **Clear Cache** 🧹
```bash
npm run clean:cache     # Clear Vite cache only
npm run clean:node      # Remove node_modules + reinstall  
npm run clean:full      # Nuclear option - reset everything
```

### 2. **Check Console** 👀
- **Browser**: Press `F12` → Console tab → Look for red errors
- **Terminal**: Run `npm run build` to see build errors
- **Lint**: Run `npm run lint` to check code issues

### 3. **Verify Dependencies** 📦
```bash
npm run doctor          # Check if dependencies installed
npm outdated           # Check for outdated packages
npm audit              # Check for security issues
```

### 4. **Test Incremental Changes** 🔬
```bash
git stash              # Save current changes
npm run dev            # Test without changes
git stash pop          # Restore changes
# Test one file at a time
```

## 🚨 **Emergency Scenarios**

### **Nothing Works - Complete Reset**
```bash
git stash                           # Save changes
npm run clean:full                  # Nuclear reset
npm run doctor                      # Verify environment
npm run dev                         # Start fresh
git stash pop                       # Restore changes
```

### **HMR Completely Broken**
```bash
npm run dev:polling                 # Force file polling
# OR
VITE_USE_POLLING=true npm run dev   # Manual polling
```

### **Build Keeps Failing**
```bash
npm run clean:node                  # Fresh dependencies
npm run build                       # Test build
npm run lint:fix                    # Fix code issues
```

### **Port Issues**
```bash
npm run port:cleanup                # Clean port locks
npm run port:info                   # See port usage
VITE_DEV_PORT=4001 npm run dev     # Use different port
```

## 🎯 **Prevention Tips**

- **Daily**: Keep `npm run dev` running, don't restart unnecessarily
- **Weekly**: Run `npm run doctor` to check environment health  
- **Before big changes**: Run `git stash` to save work
- **After package changes**: Always restart dev server
- **Avoid**: Developing in cloud-synced folders (OneDrive, Dropbox)

## 📞 **When to Ask for Help**

If these don't work:
1. `npm run doctor` - Share the output
2. Browser console errors - Screenshot red errors
3. Terminal errors - Copy exact error messages
4. System info - OS, Node version, project location

---

**💡 Pro Tip**: Most issues are solved by `npm run troubleshoot` - try it first!