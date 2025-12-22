# Deprecated and Obsolete Code Audit Report

**Date**: Generated automatically  
**Scope**: Full codebase analysis for deprecated APIs, obsolete patterns, and unused code

---

## Executive Summary

This audit identified **6 major categories** of deprecated/obsolete code:
1. **Deprecated npm packages** (1 critical)
2. **Deprecated JavaScript functions** (5 functions)
3. **Deprecated SCSS files** (3 files)
4. **Security anti-patterns** (244 instances of `innerHTML`)
5. **TODO comments** (91 instances)
6. **Legacy encryption methods** (2 functions)

---

## 1. Deprecated NPM Packages

### Critical: `node-fetch` (v3.3.2)
**Status**: ⚠️ **DEPRECATED**  
**Location**: `package.json:96`

**Issue**: 
- `node-fetch` v3+ is deprecated
- Node.js 18+ has native `fetch()` API built-in
- No need for external dependency

**Recommendation**:
```json
// Remove from package.json
// Replace all imports with native fetch
```

**Files using node-fetch**:
- `scripts/fetch-research-articles.js` (line 20)
- **Action**: Replace `import fetch from "node-fetch"` with native `fetch` (Node.js 18+)

**Action Required**: 
- ✅ Remove `node-fetch` from dependencies
- ✅ Update all imports to use native `fetch`
- ✅ Test all API calls

---

## 2. Deprecated JavaScript Functions

### 2.1 Storage Functions in `src/js/utils/shared.js`

**Status**: ⚠️ **DEPRECATED** (marked with `@deprecated`)

**Functions**:
- `saveToStorage()` (line 193)
- `getFromStorage()` (line 200)
- `removeFromStorage()` (line 207)

**Replacement**: Use `storageService` from `src/js/services/storage-service-unified.js`

**Current Usage**: 
- ✅ **Good news**: No actual usage found in codebase (only definitions)
- Still exported in `shared.js` utils object (lines 701-703)
- Backward compatibility exports in `storage-service-unified.js` (lines 361-363)
- Migration script exists: `scripts/migrate-to-unified-storage.js`
- Files that import from `shared.js` (but may not use storage functions):
  - `community.html`, `roster.html`, `login.html`, `reset-password.html`, `register.html`
  - `src/js/pages/training-page.js`, `src/js/pages/settings-page.js`
  - `src/js/pages/exercise-library-page.js`, `src/js/pages/chat-page.js`
  - `src/js/components/top-bar-loader.js`, `src/js/components/base-component-loader.js`

**Action Required**:
- ✅ Remove deprecated functions from `shared.js`
- ✅ Update all imports to use `storageService` directly
- ✅ Remove backward compatibility exports once migration complete

---

### 2.2 Legacy Encryption Functions in `src/secure-storage.js`

**Status**: ⚠️ **DEPRECATED** (marked with `@deprecated`)

**Functions**:
- `simpleEncrypt()` (line 283)
- `simpleDecrypt()` (line 300)

**Replacement**: Use `encrypt()` and `decrypt()` methods instead

**Current Usage**:
- Still used internally for legacy data migration (lines 493, 606)
- Should be removed after all legacy data is migrated

**Action Required**:
- ⚠️ Keep until all legacy encrypted data is migrated
- ✅ Add migration script to convert old encrypted data
- ✅ Remove after migration complete

---

## 3. Deprecated SCSS Files

**Status**: ⚠️ **DEPRECATED** (marked with deprecation warnings)

**Files**:
1. `angular/src/assets/styles/_variables.scss`
2. `angular/src/assets/styles/_tokens.scss`
3. `angular/src/assets/styles/_theme.scss`

**Replacement**: Use `angular/src/assets/styles/design-system-tokens.scss`

**Current Status**:
- All three files redirect to `design-system-tokens.scss` via `@import`
- Kept for backward compatibility
- Migration guide referenced: `DESIGN_SYSTEM_REVAMP_SUMMARY.md`

**Action Required**:
- ✅ Verify all Angular components use new tokens
- ✅ Remove deprecated files once migration complete
- ✅ Update any remaining imports

---

## 4. Security Anti-Patterns

### 4.1 `innerHTML` Usage (244 instances across 67 files)

**Status**: ⚠️ **SECURITY RISK** (XSS vulnerability)

**Issue**: 
- `innerHTML` can execute malicious scripts
- Should use `textContent` or safe DOM manipulation
- Consider using DOMPurify for HTML content

**High-Risk Files** (most instances):
- `roster.html`: 17 instances
- `wellness.html`: 18 instances
- `src/js/pages/dashboard-page.js`: 10 instances
- `src/js/components/chatbot.js`: 9 instances
- `src/js/pages/exercise-library-page.js`: 10 instances
- `src/js/pages/chat-page.js`: 10 instances

**Recommendation**:
```javascript
// Instead of:
element.innerHTML = userContent;

// Use:
element.textContent = userContent;
// OR for HTML:
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userContent);
```

**Action Required**:
- ⚠️ **HIGH PRIORITY**: Audit all `innerHTML` usage
- ✅ Replace with `textContent` where possible
- ✅ Use DOMPurify for trusted HTML content
- ✅ Add ESLint rule to warn on `innerHTML`

---

### 4.2 `document.write()` Mention

**Status**: ✅ **ALREADY FIXED**

**Location**: `analytics.html:103`
- Comment indicates `document.write()` was replaced with safe dynamic script loading
- No actual usage found

---

## 5. TODO Comments (91 instances)

**Status**: ⚠️ **INCOMPLETE IMPLEMENTATIONS**

**Categories**:

### 5.1 High Priority TODOs
- **Drag and drop**: `src/js/components/enhanced-training-schedule.js:610`
- **Preferences panel**: `src/js/components/enhanced-notification-center.js:792`
- **API integrations**: Multiple files need actual API calls instead of TODOs

### 5.2 Angular Component TODOs
- `angular/src/app/shared/components/training-builder/training-builder.component.ts`: 2 TODOs
- `angular/src/app/shared/components/header/header.component.ts`: 3 TODOs
- `angular/src/app/features/training/training.component.ts`: 3 TODOs
- `angular/src/app/core/services/acwr-alerts.service.ts`: 4 TODOs

### 5.3 Service Worker TODOs
- `sw.js`: 2 TODOs for IndexedDB queries

**Action Required**:
- ✅ Create issue tracker for all TODOs
- ✅ Prioritize by feature importance
- ✅ Implement or remove placeholder TODOs

---

## 6. Vulnerable Dependencies

### `jws` Package (via netlify-cli)

**Status**: ⚠️ **HIGH SEVERITY VULNERABILITY**

**Issue**: 
- `jws < 3.2.3` has improper HMAC signature verification (CWE-347)
- CVSS Score: 7.5
- Affects: `node_modules/netlify-cli/node_modules/jws`

**Current Fix**: 
- Package.json has override for `jws: ^4.0.1` (lines 135-142)
- Postinstall script: `scripts/fix-jws-vulnerability.js`

**Action Required**:
- ✅ Verify override is working: `npm audit`
- ✅ Ensure postinstall script runs correctly
- ✅ Monitor for updates

---

## 7. Obsolete Code Patterns

### 7.1 Legacy RxJS Patterns

**Location**: `angular/src/app/core/services/auth.service.ts`

**Issue**: 
- Using `BehaviorSubject` import but not using it
- Some subscriptions without proper cleanup

**Action Required**:
- ✅ Remove unused imports
- ✅ Use `takeUntilDestroyed()` for subscriptions (Angular 19 best practice)

---

### 7.2 Console.log Statements

**Status**: ⚠️ **17 instances found**

**Issue**: 
- Console.log should be replaced with proper logging service
- Especially in production code

**Action Required**:
- ✅ Replace with logger service
- ✅ Use Angular's console only in development
- ✅ Consider logging library (e.g., Sentry)

---

## 8. Duplicate/Obsolete Files

### Migration Scripts
- `scripts/migrate-to-unified-storage.js`: Exists but may not be fully executed
- Check if all files listed in script have been migrated

### Backup Files
- ✅ No `.backup` files found
- ✅ No `.old` files found
- ✅ No `.deprecated` files found

---

## Priority Action Items

### 🔴 Critical (Fix Immediately)
1. **Remove `node-fetch` dependency** - Use native fetch
2. **Fix `jws` vulnerability** - Verify override is working
3. **Audit `innerHTML` usage** - Replace with safe alternatives

### 🟡 High Priority (Fix Soon)
4. **Remove deprecated storage functions** - Complete migration
5. **Remove deprecated SCSS files** - Complete Angular migration
6. **Implement or remove TODOs** - Clean up incomplete code

### 🟢 Medium Priority (Plan for Future)
7. **Remove legacy encryption functions** - After data migration
8. **Replace console.log** - With proper logging service
9. **Fix RxJS patterns** - Use Angular 19 best practices

---

## Migration Checklist

- [ ] Remove `node-fetch` from `package.json`
- [ ] Update all fetch imports to use native fetch
- [ ] Verify `jws` override is working (`npm audit`)
- [ ] Audit and fix all `innerHTML` usage (start with high-risk files)
- [ ] Complete storage function migration
- [ ] Remove deprecated storage functions from `shared.js`
- [ ] Verify Angular components use new design tokens
- [ ] Remove deprecated SCSS files
- [ ] Implement or remove all TODO comments
- [ ] Migrate legacy encrypted data
- [ ] Remove legacy encryption functions
- [ ] Replace console.log with logger service
- [ ] Fix RxJS subscription patterns

---

## Files Requiring Immediate Attention

1. `package.json` - Remove `node-fetch`
2. `src/js/utils/shared.js` - Remove deprecated storage functions
3. `roster.html` - Fix 17 `innerHTML` instances
4. `wellness.html` - Fix 18 `innerHTML` instances
5. `src/js/pages/dashboard-page.js` - Fix 10 `innerHTML` instances
6. `angular/src/assets/styles/_variables.scss` - Remove after migration
7. `angular/src/assets/styles/_tokens.scss` - Remove after migration
8. `angular/src/assets/styles/_theme.scss` - Remove after migration

---

## Recommendations

1. **Add ESLint Rules**:
   ```javascript
   "no-restricted-syntax": [
     "error",
     {
       "selector": "MemberExpression[property.name='innerHTML']",
       "message": "Use textContent or DOMPurify.sanitize() instead of innerHTML"
     }
   ]
   ```

2. **Create Migration Scripts**:
   - Script to replace all `innerHTML` with safe alternatives
   - Script to verify all deprecated functions are unused
   - Script to check for TODO comments

3. **Documentation**:
   - Update coding standards to prohibit `innerHTML`
   - Document migration path for deprecated functions
   - Create deprecation policy

---

**Generated**: Automated audit  
**Next Review**: After completing priority fixes

