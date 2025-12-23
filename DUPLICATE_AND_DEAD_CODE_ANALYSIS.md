# Duplicate and Dead Code Analysis

**Date**: 2025-01-22  
**Last Updated**: 2025-01-22 (Cleanup completed)  
**Purpose**: Comprehensive analysis of duplicate code and dead code in the codebase

---

## ✅ Cleanup Actions Completed

1. **Removed `src/utils/shared.js`** - Completely unused file (no imports found)
2. **Removed unused functions from `netlify/functions/performance-data.js`**:
   - `_generateId()` - Unused helper function
   - `_isWithinTimeframe()` - Unused helper function
3. **Removed `angular/src/app/features/dashboard/dashboard.component.refactored.example.ts`** - Unused example file
4. **Removed unused Supabase client files**:
   - `src/js/utils/supabase-client.js` - Not imported anywhere
   - `src/js/utils/supabase-client.cjs` - Not imported anywhere (Netlify functions use their own)
5. **Removed duplicate migrations from `supabase/migrations/`**:
   - `20250122000000_drop_unused_indexes.sql` - Duplicate of `database/migrations/049_drop_unused_indexes.sql`
   - `20251221130010_add_missing_foreign_key_indexes.sql` - Duplicate of `database/migrations/050_add_missing_foreign_key_indexes.sql`

---

---

## 🔴 Critical Duplicates

### 1. Duplicate `shared.js` Utility Files

**Files:**

- `src/utils/shared.js` (535 lines)
- `src/js/utils/shared.js` (742 lines)

**Issue**: Both files contain overlapping utility functions:

- `getInitials()` - Duplicate implementation
- `formatTime()` / `formatDateTime()` - Duplicate implementations
- `validateEmail()` / `isValidEmail()` - Similar functionality, different names
- `debounce()` / `throttle()` - Duplicate implementations
- `escapeHtml()` - Duplicate implementations
- `groupBy()` - Duplicate implementations
- `shuffleArray()` - Duplicate implementations
- `formatNumber()` / `formatPercentage()` - Duplicate implementations

**Impact**:

- Code confusion - developers may import from wrong file
- Maintenance burden - changes need to be made in two places
- Bundle size - both files may be included unnecessarily

**Recommendation**:

- ✅ **`src/utils/shared.js` is COMPLETELY UNUSED** - No files import from it
- ✅ All imports correctly use `src/js/utils/shared.js`
- **ACTION**: Delete `src/utils/shared.js` immediately (dead code)

**Files importing from `src/js/utils/shared.js`** (correct usage):

- `src/js/pages/training-page.js`
- `src/js/pages/dashboard-page.js`
- `src/js/pages/settings-page.js`
- `src/js/components/enhanced-community.js`
- `src/js/pages/exercise-library-page.js`
- `src/js/components/top-bar-loader.js`
- `src/js/components/base-component-loader.js`
- `src/js/pages/chat-page.js`

---

### 2. ✅ Duplicate Supabase Client Files - **RESOLVED**

**Files (before cleanup):**

- ~~`src/js/utils/supabase-client.js`~~ - **REMOVED** (unused)
- ~~`src/js/utils/supabase-client.cjs`~~ - **REMOVED** (unused)
- `src/js/services/supabase-client.js` (377 lines) - Frontend/browser client ✅ **KEPT**
- `netlify/functions/supabase-client.cjs` - Netlify Functions client ✅ **KEPT**

**Resolution**:

- ✅ Removed unused `src/js/utils/supabase-client.js` and `.cjs` files
- ✅ Frontend uses `src/js/services/supabase-client.js` (correct)
- ✅ Netlify functions use `netlify/functions/supabase-client.cjs` (correct)
- No naming conflicts remaining

**Files importing supabase-client** (all correct):

- Frontend code imports from `src/js/services/supabase-client.js` ✅
- Netlify functions import from `netlify/functions/supabase-client.cjs` ✅

---

### 3. ✅ Duplicate Database Migrations - **RESOLVED**

**Files (before cleanup):**

- ~~`supabase/migrations/20250122000000_drop_unused_indexes.sql`~~ - **REMOVED**
- `database/migrations/049_drop_unused_indexes.sql` ✅ **KEPT** (primary system)
- ~~`supabase/migrations/20251221130010_add_missing_foreign_key_indexes.sql`~~ - **REMOVED**
- `database/migrations/050_add_missing_foreign_key_indexes.sql` ✅ **KEPT** (primary system)

**Resolution**:

- ✅ `database/migrations/` is the PRIMARY migration system (has execution scripts, plans)
- ✅ `supabase/migrations/` contains Supabase CLI migrations (timestamped format)
- ✅ Removed duplicate migrations from `supabase/migrations/`
- ✅ Primary system (`database/migrations/`) preserved

**Migration System**:

- Primary: `database/migrations/` (numbered format, has execution scripts)
- Secondary: `supabase/migrations/` (Supabase CLI timestamped format)
- No conflicts remaining

---

## 🟡 Dead Code

### 1. Unused Helper Functions

**File**: `netlify/functions/performance-data.js` (lines 1091-1112)

```javascript
// Unused helper functions - kept for potential future use
// eslint-disable-next-line no-unused-vars
function _generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// eslint-disable-next-line no-unused-vars
function _isWithinTimeframe(date, timeframe) {
  // ... implementation
}
```

**Recommendation**:

- Remove if not planned for use
- Or move to utility file if needed elsewhere

---

### 2. Deprecated Files

**File**: `angular/src/app/features/dashboard/dashboard.component.refactored.example.ts`

**Issue**: Example/refactored file that may not be needed

**Recommendation**: Remove if not actively used for reference

---

### 3. Deprecated Components

**File**: `angular/src/assets/styles/component-styles.scss`

**Issue**: Marked as DEPRECATED with duplicate styles

- Buttons and cards should use `standardized-components.scss`
- File kept for forms, navigation, modals not yet migrated

**Recommendation**:

- Complete migration of remaining components
- Remove deprecated styles once migration complete

---

### 4. Legacy/Deprecated HTML Files

**File**: `src/unified-sidebar.html`

**Issue**: Marked as DEPRECATED

- Contains inline styles and embedded JavaScript
- Should use `src/components/organisms/sidebar-navigation.html` instead

**Status**:

- Referenced in `src/page-template.html` as a template/reference
- Actual sidebar code is inline in `page-template.html`
- Not directly included in any HTML files

**Recommendation**:

- Keep as reference template if developers use it
- Or remove if `page-template.html` is sufficient

---

### 5. Archived Scripts (Documented as Unused)

**Location**: `scripts/archive/legacy-neon-scripts/`

**Files**:

- `seedNFLPlayerDatabase.js` - Uses Neon client (project uses Supabase)
- `seedEliteSprintTrainingDatabase.js` - Uses Neon client
- `seedCompletePlayerSystem.js` - Uses Neon client
- `database-health-check.js` - Uses Neon client

**Status**: Documented as archived/unused (see `CLEANUP_SUMMARY.md`)

**Recommendation**:

- Keep archived if data may be useful
- Consider updating to Supabase if needed
- Document clearly that these are archived

---

## 🟢 Potential Issues

### 1. Unused Imports

**Files importing from `src/utils/shared.js`** (need verification):

- Need to check if these files actually use the imports
- May have unused imports that can be removed

**Files importing from `src/js/utils/shared.js`**:

- `src/js/pages/training-page.js`
- `src/js/pages/dashboard-page.js`
- `src/js/pages/settings-page.js`
- `src/js/components/enhanced-community.js`
- `src/js/pages/exercise-library-page.js`
- `src/js/components/top-bar-loader.js`
- `src/js/components/base-component-loader.js`
- `src/js/pages/chat-page.js`

---

### 2. Migration Scripts

**File**: `scripts/migrate-to-unified-storage.js`

**Issue**: References deprecated storage functions that were removed from `shared.js`

- `saveToStorage`, `getFromStorage`, `removeFromStorage` - REMOVED

**Recommendation**:

- Update script if still needed
- Or remove if migration is complete

---

## 📊 Summary Statistics

- **Critical Duplicates**: ✅ **ALL RESOLVED**
  - ✅ Unused shared utility file (`src/utils/shared.js` - **REMOVED**)
  - ✅ Unused Supabase client files (`src/js/utils/supabase-client.js` and `.cjs` - **REMOVED**)
  - ✅ Duplicate migrations from `supabase/migrations/` (**REMOVED**)

- **Dead Code**:
  - 2+ unused functions
  - 1+ deprecated example files
  - 1 deprecated stylesheet (partially)
  - 1 deprecated HTML component
  - 4+ archived scripts (documented)

- **Files with TODO/FIXME/DEPRECATED markers**: 1032 matches across 269 files

---

## 🎯 Recommended Actions

### High Priority

1. ✅ **Remove unused `shared.js` file** - **COMPLETED**
   - ✅ **`src/utils/shared.js` removed** (was completely unused)
   - All imports correctly use `src/js/utils/shared.js`

2. ✅ **Remove unused Supabase client files** - **COMPLETED**
   - ✅ Removed `src/js/utils/supabase-client.js` (unused)
   - ✅ Removed `src/js/utils/supabase-client.cjs` (unused)
   - ✅ Frontend uses `src/js/services/supabase-client.js` (correct)
   - ✅ Netlify functions use `netlify/functions/supabase-client.cjs` (correct)

3. ✅ **Resolve duplicate migrations** - **COMPLETED**
   - ✅ Removed duplicates from `supabase/migrations/`
   - ✅ Primary system (`database/migrations/`) preserved

### Medium Priority

4. ✅ **Remove unused functions** - **COMPLETED**
   - ✅ Removed `_generateId()` and `_isWithinTimeframe()` from `performance-data.js`

5. ✅ **Clean up deprecated files** - **PARTIALLY COMPLETED**
   - ✅ Removed `dashboard.component.refactored.example.ts`
   - ⚠️ `unified-sidebar.html` kept (used as reference template in `page-template.html`)

6. **Complete style migration**
   - Finish migrating remaining components from `component-styles.scss`
   - Remove deprecated styles

### Low Priority

7. **Review archived scripts**
   - Keep if data is valuable
   - Update to Supabase if needed
   - Otherwise document clearly

8. **Audit imports**
   - Check for unused imports in files using shared utilities
   - Remove unused imports

---

## 🔍 Verification Commands

To verify duplicates and dead code:

```bash
# Find all imports of shared.js
grep -r "from.*shared\.js\|import.*shared\.js" src/

# Find all imports of supabase-client
grep -r "from.*supabase-client\|import.*supabase-client" src/

# Find unused functions (requires eslint)
npm run lint -- --rule "no-unused-vars"

# Find TODO/FIXME comments
grep -r "TODO\|FIXME\|DEPRECATED\|UNUSED" --include="*.js" --include="*.ts" src/
```

---

## 📝 Notes

- Some "duplicates" may be intentional (e.g., server vs client Supabase clients)
- Deprecated files may be kept for reference during migration
- Archived scripts contain valuable data but use outdated tech stack
- Always verify files are not referenced before removing
