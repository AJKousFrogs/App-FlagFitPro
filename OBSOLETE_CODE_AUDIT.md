# Obsolete Code Audit Report

**Date:** January 9, 2026  
**Project:** FlagFit Pro (Angular 21 + PrimeNG 21)  
**Auditor:** AI Code Auditor

---

## Executive Summary

This audit identified obsolete code, unused dependencies, redundant files, and deprecated patterns across the codebase. The project has recently undergone significant refactoring (as evidenced by commit history), but several legacy artifacts remain.

### Key Findings

- ✅ **Good**: No deprecated Angular patterns (e.g., `HttpClientModule`, `CommonModule` imports in standalone components)
- ⚠️ **Warning**: Multiple redundant development servers
- ⚠️ **Warning**: Unused dependencies still in package.json
- ⚠️ **Warning**: Deleted files still referenced in some places
- ⚠️ **Warning**: Backup files and legacy scripts present

---

## 1. Deleted Files (Git Status)

The following files have been deleted but not yet committed:

### 1.1 Python Script (Already Removed)
- `angular/remove-unused-imports.py` ❌ DELETED
  - **Status**: Good - Python scripts don't belong in an Angular/Node project
  - **Action**: Already deleted, just needs to be committed

### 1.2 TypeScript Constants File
- `angular/src/app/core/constants/training-thresholds.ts` ❌ DELETED
  - **Usage Check**: No references found in codebase ✅
  - **Action**: Safe to commit deletion

### 1.3 Component Files
- `angular/src/app/shared/components/button-primary/button-primary.component.ts` ❌ DELETED
  - **Reason**: Project has standardized on `<app-button>` component
  - **Remaining References**: Still using `p-button-primary` style class in 3 files:
    - `rtp-phase-celebration.component.ts`
    - `action-required-badge.component.ts`
    - `missing-data-explanation.component.ts`
  - **Action**: These are using PrimeNG's CSS class, not the deleted component - SAFE ✅

### 1.4 Documentation Files
Deleted documentation files (likely consolidated into `docs/AUDITS.md`):
- `docs/AUDIT_GAPS.md`
- `docs/DESIGN-INCONSISTENCIES-AUDIT.md`
- `docs/DESIGN-TOKEN-AUDIT-2026-01-08.md`
- `docs/DOCS_INDEX.md`
- `docs/HARDCODE-AUDIT-REPORT.md`
- `docs/HARDCODED-SPACING-AUDIT-2026-01-08.md`
- `docs/README.md`
- `docs/example-schedule-template.csv`

**Status**: Good consolidation effort ✅

### 1.5 Route Files
- `routes/algorithmRoutes.js` ❌ DELETED
- `routes/analyticsRoutes.js` ❌ DELETED (Note: `routes/analytics.routes.js` exists)
- `routes/dashboardRoutes.js` ❌ DELETED (Note: `routes/dashboard.routes.js` exists)

**Analysis**: 
- Old camelCase naming convention → replaced with kebab-case convention
- `routes/index.js` still exports `dashboardRoutes` (kebab-case file exists)
- **Action**: Ensure no imports reference old camelCase filenames ✅

### 1.6 Admin Components
- `angular/src/app/features/admin/superadmin-dashboard.component.scss` ❌ DELETED
- `angular/src/app/features/admin/superadmin-dashboard.component.ts` ❌ DELETED

**Note**: A different file `angular/src/app/features/superadmin/superadmin-dashboard.component.*` exists
- **Action**: Check if admin vs superadmin folders have duplicate functionality

### 1.7 Scripts
- `scripts/apply-migration.js` ❌ DELETED
- `scripts/audit-frontend-layouts.js` ❌ DELETED
- `scripts/audit-page-component.js` ❌ DELETED
- `scripts/find-legacy-dark-variables.js` ❌ DELETED
- `scripts/generate-icons.js` ❌ DELETED

**Status**: Cleanup of one-time migration scripts - Good ✅

---

## 2. Unused Dependencies

### 2.1 Root package.json

#### Currently Installed But Unused:
```json
"bcryptjs": "^3.0.3"
```

**Analysis**: 
- No usage found in codebase via grep search
- `cleanup-deps.sh` script already identifies this for removal
- **Recommendation**: Remove with `npm uninstall bcryptjs`

#### Potential Candidates for Review:
```json
"jsonwebtoken": "^9.0.3"
```
- Used primarily in overrides for security patching
- May not be directly used if authentication is handled by Supabase
- **Action**: Verify actual usage before removing

---

## 3. Redundant Development Servers

### 3.1 Multiple Server Files

The project has **FOUR** different server implementations:

1. **`server.js`** (3,547 lines) - Full-featured Express server with:
   - Supabase integration
   - Modular routes (training, wellness, analytics, notifications, dashboard)
   - WebSocket hot reload
   - Comprehensive API endpoints
   - Request logging and monitoring
   - **Status**: PRIMARY SERVER ✅

2. **`simple-server.js`** (486 lines) - Lightweight static file server:
   - HTTP server with compression
   - Static file serving
   - API proxying
   - Supabase credential injection
   - **Status**: REDUNDANT? ⚠️
   - **Use Case**: May be useful for minimal static serving without API

3. **`dev-server.cjs`** (201 lines) - Hot reload development server:
   - Express-based
   - WebSocket hot reload
   - API proxying
   - File watching with chokidar
   - **Status**: LEGACY? ⚠️
   - **Replaced by**: Angular CLI's built-in dev server

4. **`dev-server-enhanced.cjs`** (555 lines) - Enhanced development server:
   - All features from `dev-server.cjs`
   - Netlify Functions support
   - Auto-bug detection and fixing
   - ESLint integration
   - **Status**: LEGACY? ⚠️
   - **Replaced by**: Angular CLI + Netlify CLI

### 3.2 Server-Related Files
```
server-supabase.js (385 lines) - Supabase client and utilities
```
- **Status**: Imported by `server.js` - ACTIVE ✅

### Recommendation:
- **Keep**: `server.js` (primary API server)
- **Keep**: `server-supabase.js` (Supabase utilities)
- **Consider Removing**: `dev-server.cjs` and `dev-server-enhanced.cjs`
  - Angular 21 has excellent built-in dev server with hot reload
  - Netlify CLI provides function testing locally
  - Bug detection features in `dev-server-enhanced.cjs` are better handled by ESLint/IDE
- **Keep or Remove**: `simple-server.js`
  - Useful if you need ultra-lightweight static serving
  - Consider moving to `/scripts/` folder if kept

---

## 4. Deprecated NPM Scripts

### 4.1 Already Marked as Deprecated

In `package.json`:
```json
"audit:docs:generate": "echo '⚠️ DEPRECATED: Audits are complete. See docs/AUDITS.md' && node scripts/generate-design-tokens-audit.js",
"audit:docs:verify": "echo '⚠️ DEPRECATED: Script removed. See docs/AUDITS.md'",
"audit:docs": "echo '⚠️ DEPRECATED: Audits are complete and consolidated in docs/AUDITS.md'"
```

**Recommendation**: Remove these scripts entirely from package.json

### 4.2 Script File Still Referenced
- `scripts/generate-design-tokens-audit.js` - Still referenced in deprecated npm script
- **Action**: Check if file exists; if not, remove script reference

---

## 5. Backup and Lock Files

### 5.1 Root Directory
```
.ports.lock          (2 bytes)    - Runtime lock file, OK to keep
deno.lock            (2KB)        - Deno dependency lock, REMOVE if not using Deno
package-lock.json.bak (679KB)     - Backup file, REMOVE ⚠️
```

**Recommendation**:
- Delete `package-lock.json.bak` immediately
- Check if Deno is actually used; if not, remove `deno.lock`
- Add `*.bak` to `.gitignore` to prevent future backups from being tracked

---

## 6. Netlify Functions

### 6.1 Function Count
```
129 functions (128 .cjs files + 1 .js file)
```

**Status**: Large number of functions - typical for complex app
**Action**: No immediate concern, but consider:
- Regular auditing for unused functions
- Consolidation opportunities where functions share logic

---

## 7. Shell Scripts

### 7.1 Development Scripts
```
cleanup-deps.sh         916 bytes   - Dependency cleanup utility
deploy-to-netlify.sh    725 bytes   - Netlify deployment
deploy.sh               4041 bytes  - General deployment
dev-clean.sh            5395 bytes  - Development cleanup
start-dev.sh            1441 bytes  - Start development
start-local.sh          1873 bytes  - Start local server
start-with-real-data.sh 3640 bytes  - Start with real data
test-free-functions.sh  2473 bytes  - Test functions
```

**Status**: All appear to be actively used ✅
**Action**: Ensure they're documented in README or `docs/DEVELOPMENT.md`

---

## 8. Source Code Redundancy

### 8.1 src/ Directory Structure
The `src/` directory contains legacy vanilla JavaScript code:
```
src/js/                  - 43 JS files
src/training-modules/    - 2 JS files
src/services/            - 1 JS file
src/data/                - 5 JS files
src/config/              - 1 JS file
src/hooks/               - 1 JS file
src/examples/            - 1 JSX file
```

**Analysis**:
- The project is now Angular 21 with TypeScript
- Legacy vanilla JS files in `src/` are likely obsolete
- **Exception**: Some may be used by Node.js backend (`server.js`)

**Recommendation**:
1. Review each `src/` subdirectory
2. Identify if any files are imported by `server.js` or `netlify/functions/`
3. Move actively used files to appropriate locations
4. Delete or archive truly obsolete files

---

## 9. Angular-Specific Findings

### 9.1 Good Practices ✅
- No usage of deprecated `HttpClientModule` (using provideHttpClient)
- No static `@ViewChild` with `static: true` flag
- No `ModuleWithProviders` without generic type
- Standalone components (no `CommonModule` imports needed)
- Modern Angular 21 patterns

### 9.2 ESLint Configuration
The `angular/eslint.config.mjs` includes:
- Button standardization rules ✅
- Constants barrel import enforcement ✅
- Storybook integration ✅
- Custom TypeScript rules ✅

**Status**: Well-configured, no obsolete patterns ✅

---

## 10. Git Repository Cleanup

### 10.1 Untracked Files
Check for untracked files that should be committed or ignored:
```
?? angular/src/app/core/constants/constants-validation.ts
?? angular/src/app/core/constants/error.constants.ts
?? angular/src/app/core/constants/positions.constants.ts
?? angular/src/app/core/constants/toast-messages.constants.ts
?? angular/src/app/core/constants/ui-options.constants.ts
?? angular/src/app/core/services/team-membership.service.ts
?? angular/src/app/features/help/help-center.component.ts
```

**Status**: New files that should be added to git ✅

---

## Priority Action Items

### High Priority (Do Immediately)
1. ✅ Commit deleted files that are already removed
2. 🗑️ Delete `package-lock.json.bak`
3. 🗑️ Remove unused dependency: `bcryptjs`
4. 📝 Remove deprecated npm scripts from package.json
5. 📝 Add `*.bak` to `.gitignore`

### Medium Priority (This Week)
1. 🔍 Audit `src/` directory - identify truly obsolete vanilla JS files
2. 🔍 Review `dev-server.cjs` and `dev-server-enhanced.cjs` - consider removing
3. 🔍 Review `simple-server.js` - keep only if actively used
4. 🔍 Check `deno.lock` - remove if Deno not used
5. 📝 Add Git commit for untracked constants and services

### Low Priority (When Time Permits)
1. 📊 Audit Netlify functions for consolidation opportunities
2. 📝 Document all shell scripts in development guide
3. 🔍 Review admin vs superadmin folder structure
4. 🔍 Verify `jsonwebtoken` dependency usage

---

## Testing Recommendations

Before removing any code:
1. ✅ Run full test suite: `npm run test:all`
2. ✅ Check for linter errors: `npm run lint:all`
3. ✅ Run E2E tests: `npm run test:e2e`
4. ✅ Test local development: `npm run dev`
5. ✅ Build production bundle: `npm run build:production`

---

## Automated Cleanup Script

Create a script to automate safe cleanups:

```bash
#!/bin/bash
# cleanup-obsolete-code.sh

echo "🧹 Cleaning obsolete code..."

# Remove backup files
rm -f package-lock.json.bak
echo "✅ Removed package-lock.json.bak"

# Remove unused dependency
npm uninstall bcryptjs
echo "✅ Removed bcryptjs dependency"

# Check for deno usage
if ! grep -r "deno" package.json scripts/ > /dev/null 2>&1; then
    rm -f deno.lock
    echo "✅ Removed deno.lock (Deno not in use)"
fi

# Add to gitignore
if ! grep -q "*.bak" .gitignore; then
    echo "*.bak" >> .gitignore
    echo "✅ Added *.bak to .gitignore"
fi

echo ""
echo "🎉 Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Review and commit deleted files: git add -u"
echo "2. Add new files: git add angular/src/app/core/constants/*.ts"
echo "3. Test the application: npm run test:all"
```

---

## Conclusion

The codebase is in relatively good shape after recent refactoring efforts. The main areas of concern are:

1. **Redundant development servers** - Consider consolidating
2. **Unused dependencies** - Safe to remove
3. **Legacy src/ directory** - Needs audit for obsolete vanilla JS
4. **Backup files** - Should be deleted

The Angular codebase itself follows modern best practices with no deprecated patterns detected.

### Estimated Cleanup Impact
- **Disk Space Saved**: ~1-2 MB
- **npm install Time**: Slightly faster (fewer dependencies)
- **Developer Clarity**: Significantly improved (less confusion about which server to use)
- **Maintenance Burden**: Reduced (fewer files to maintain)

---

## Appendix: Commands Used in Audit

```bash
# Search for deprecated patterns
grep -r "DEPRECATED\|@deprecated\|obsolete" --include="*.ts" --include="*.js"

# Find backup files
find . -name "*.backup" -o -name "*.old" -o -name "*.bak"

# Check for Python artifacts
find . -name "*.pyc" -o -name "__pycache__"

# Count Netlify functions
find netlify/functions -name "*.cjs" -o -name "*.js" | wc -l

# Check for deleted files
git diff --name-only --diff-filter=D

# Search for deprecated Angular patterns
grep -r "HttpClientModule\|@ViewChild.*static.*true" --include="*.ts"

# Check dependency usage
grep -r "bcryptjs" --include="*.js" --include="*.ts"
```

---

**Report Generated**: January 9, 2026  
**Next Audit Recommended**: March 2026
