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

| Problem                  | Quick Fix              |
| ------------------------ | ---------------------- |
| **HMR not working**      | `npm run troubleshoot` |
| **Build failing**        | `npm run clean:node`   |
| **Port conflicts**       | `npm run port:cleanup` |
| **Cache issues**         | `npm run clean:cache`  |
| **Dependencies broken**  | `npm run debug`        |
| **File watching broken** | `npm run dev:polling`  |
| **Everything broken**    | `npm run clean:full`   |

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

## 🗃️ **Database Schema Errors**

### Column/Table Not Found Errors

If you see errors like:
- `Could not find the 'equipment' column of 'training_sessions'`
- `column team_invitations.message does not exist`
- `Could not find a relationship between 'recovery_sessions' and 'recovery_protocols'`

**Solution**: Run the latest database migrations:
```bash
# Via Supabase CLI
supabase db push

# Or apply migrations manually in Supabase Dashboard
# Files in: supabase/migrations/20260112_*.sql
```

### Common Schema Fixes (Jan 2026)

| Error | Table | Fix |
|-------|-------|-----|
| Missing `message` column | `team_invitations` | Run migration `20260112_fix_missing_schema_elements.sql` |
| Missing `target_muscles` | `exercises` | Run migration `20260112_add_missing_tables_for_frontend.sql` |
| Missing `recovery_protocols` relationship | `recovery_sessions` | Run migration `20260112_fix_missing_schema_elements.sql` |

## 🔌 **API Endpoint Errors**

### 500 Errors on Wellness Check-in

**Wrong**: `/api/wellness/checkin` → 500 error  
**Correct**: `/api/wellness-checkin` (with hyphen)

### 404 Errors on Coach Games

**Wrong**: `/api/coach/games` → 404  
**Correct**: `/api/games` (main games endpoint, role-based filtering server-side)

## 📊 **Chart Component Errors**

### "t.clear is not a function" or "createComponent is not a function"

These errors indicate PrimeNG 21 Chart component issues.

**Solution**: The `LazyChartComponent` has been updated to use Chart.js directly instead of dynamic PrimeNG component loading. Ensure you have the latest version of:
- `angular/src/app/shared/components/lazy-chart/lazy-chart.component.ts`

## 📞 **When to Ask for Help**

If these don't work:

1. `npm run doctor` - Share the output
2. Browser console errors - Screenshot red errors
3. Terminal errors - Copy exact error messages
4. System info - OS, Node version, project location

---

**💡 Pro Tip**: Most issues are solved by `npm run troubleshoot` - try it first!

---

_Last Updated: January 12, 2026_
