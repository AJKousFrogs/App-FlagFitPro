# Code Duplication Report

**Generated**: 2025-01-11  
**Updated**: 2025-01-11 (Fixes Applied)  
**Scope**: TypeScript (.ts), JavaScript (.js), Shell Scripts (.sh)

## Executive Summary

This report identifies duplicate code patterns across the codebase. Some duplications are intentional (e.g., shared utilities), while others represent opportunities for consolidation.

**Key Findings**:
- **Error Handling**: 6+ different error handling implementations
- **Date/Time Formatting**: Multiple implementations across JS and TS
- ~~**Authentication Middleware**: Duplicated in 2+ locations~~ ✅ FIXED
- **Utility Functions**: Duplicate implementations of common utilities (debounce, throttle, capitalize, etc.)
- **Storage Access**: Direct localStorage/sessionStorage access scattered across 50+ files

## ✅ Fixes Applied (2025-01-11)

### 1. Authentication Middleware (HIGH PRIORITY) ✅
- **Removed** duplicate `authenticateToken`, `authorizeUserAccess`, `optionalAuth` from `server.js`
- **Now imports** from centralized `routes/middleware/auth.middleware.js`
- **Impact**: ~140 lines of duplicate code eliminated

### 2. Debounce/Throttle Consolidation ✅
- **Updated** `src/js/utils/event-delegation.js` to re-export from `shared.js`
- **Canonical implementation** now in `src/js/utils/shared.js`
- **Impact**: ~30 lines of duplicate code eliminated

### 3. Error Handling Deprecation ✅
- **Added** deprecation notice to `src/js/utils/error-handling.js`
- **Recommends** migration to `unified-error-handler.js`

### 4. Angular Error Utils Consolidation ✅
- **Updated** `angular/src/app/core/utils/error-utils.ts` to re-export `getErrorMessage` from shared utils
- **Updated** `angular/src/app/core/services/logger.service.ts` to re-export `toError` from centralized location
- **Impact**: Eliminated duplicate `getErrorMessage` and `toError` implementations

---

## 1. Error Handling Duplications

### 1.1 Error Handler Classes/Functions

**Issue**: Multiple error handling implementations with similar functionality

#### Duplicate Implementations:

1. **`src/js/utils/error-handling.js`** (Lines 41-113)
   - `handleError()` function
   - `ErrorType` enum
   - `AppError` class
   - Basic error categorization

2. **`src/js/utils/unified-error-handler.js`** (Lines 68-684)
   - `UnifiedErrorHandler` class
   - `ErrorType` enum (duplicate)
   - `AppError` class (duplicate)
   - More comprehensive error handling with Sentry integration

3. **`angular/src/app/shared/utils/error.utils.ts`** (Lines 34-139)
   - `getErrorMessage()` function
   - `getHttpErrorMessage()` function
   - Error type checking functions

4. **`angular/src/app/core/utils/error-utils.ts`** (Lines 10-101)
   - `toError()` function
   - `getErrorMessage()` function (duplicate of above)
   - `toLogContext()` function

5. **`src/error-handler.js`** (Full file)
   - `ErrorHandler` class
   - Similar functionality to UnifiedErrorHandler

6. **`netlify/functions/utils/error-handler.cjs`** (Lines 74-324)
   - Backend error handling utilities
   - `createErrorResponse()`, `handleServerError()`, etc.

**Recommendation**:
- ✅ Keep `src/js/utils/unified-error-handler.js` as the main frontend error handler
- ✅ Keep `angular/src/app/shared/utils/error.utils.ts` for Angular-specific error utilities
- ✅ Keep `netlify/functions/utils/error-handler.cjs` for backend
- ❌ Consider deprecating `src/js/utils/error-handling.js` and `src/error-handler.js`
- 🔄 Consolidate `getErrorMessage()` implementations (currently in 2+ places)

---

## 2. Date/Time Formatting Duplications

### 2.1 Date Formatting Functions

**Issue**: Multiple date formatting implementations

#### Duplicate Implementations:

1. **`src/js/utils/shared.js`** (Lines 174-207)
   ```javascript
   export function formatTime(timestamp) { ... }
   export function formatDateTime(timestamp) { ... }
   export function getTimeAgo(timestamp) { ... }
   ```

2. **`angular/src/app/shared/utils/date.utils.ts`** (Lines 38-56)
   ```typescript
   export function formatDate(date: Date | string, formatStr: string = "PPP"): string { ... }
   ```
   - Uses `date-fns` library

3. **`src/athlete-performance-data.js`** (Lines 970-991)
   ```javascript
   export const formatDate = (date, format = "short") => { ... }
   ```

4. **`netlify/functions/utils/date-utils.cjs`** (Lines 38-91)
   - Backend date utilities

**Recommendation**:
- ✅ Keep `angular/src/app/shared/utils/date.utils.ts` for Angular (uses date-fns)
- ✅ Keep `netlify/functions/utils/date-utils.cjs` for backend
- 🔄 Migrate `src/js/utils/shared.js` date functions to use a shared date library or consolidate
- ❌ Consider removing `src/athlete-performance-data.js` formatDate if unused

---

## 3. Utility Function Duplications

### 3.1 String Utilities

#### `capitalize()` Function

**Duplicated in**:
1. **`src/js/utils/shared.js`** (Line 336)
   ```javascript
   export function capitalize(str) {
     return str.charAt(0).toUpperCase() + str.slice(1);
   }
   ```

2. **`angular/src/app/shared/utils/format.utils.ts`** (Line 10)
   ```typescript
   export function capitalize(str: string): string {
     if (!str) return "";
     return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
   }
   ```
   - Note: Slightly different implementation (adds `.toLowerCase()`)

**Recommendation**: Keep both (different contexts: JS vs TS), but align implementations.

#### `getInitials()` Function

**Duplicated in**:
1. **`src/js/utils/shared.js`** (Lines 10-20)
   ```javascript
   export function getInitials(name) {
     if (!name) return "??";
     return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
   }
   ```

2. **`angular/src/app/shared/utils/format.utils.ts`** (Lines 229-235)
   ```typescript
   export function getInitials(name: string, maxLength: number = 2): string {
     return name.split(" ").map((word) => word.charAt(0).toUpperCase())
       .slice(0, maxLength).join("");
   }
   ```
   - Note: Different fallback behavior

**Recommendation**: Align implementations and fallback behavior.

#### `kebabCase()` Function

**Duplicated in**:
1. **`src/js/utils/shared.js`** (Line 340)
   ```javascript
   export function kebabCase(str) {
     return str.toLowerCase().replace(/\s+/g, "-");
   }
   ```

2. **`angular/src/app/shared/utils/format.utils.ts`** (Lines 44-49)
   ```typescript
   export function kebabCase(str: string): string {
     return str.replace(/([a-z])([A-Z])/g, "$1-$2")
       .replace(/[\s_]+/g, "-").toLowerCase();
   }
   ```
   - Note: More comprehensive implementation in TS version

**Recommendation**: Use the more comprehensive TS version as reference.

#### `truncate()` Function

**Duplicated in**:
1. **`src/js/utils/shared.js`** (Lines 344-349)
   ```javascript
   export function truncate(str, length = 50, suffix = "...") { ... }
   ```

2. **`angular/src/app/shared/utils/format.utils.ts`** (Lines 68-75)
   ```typescript
   export function truncate(str: string, length: number, suffix: string = "..."): string { ... }
   ```

**Recommendation**: Keep both (different contexts), but ensure consistent behavior.

### 3.2 Number Formatting

#### `formatNumber()` Function

**Duplicated in**:
1. **`src/js/utils/shared.js`** (Lines 355-360)
   ```javascript
   export function formatNumber(num, decimals = 0) {
     return Number(num).toLocaleString("en-US", { ... });
   }
   ```

2. **`angular/src/app/shared/utils/format.utils.ts`** (Lines 106-111)
   ```typescript
   export function formatNumber(num: number, decimals: number = 0): string {
     return num.toLocaleString("en-US", { ... });
   }
   ```

**Recommendation**: Keep both (different contexts), implementations are consistent.

#### `formatPercentage()` Function

**Duplicated in**:
1. **`src/js/utils/shared.js`** (Lines 362-364)
   ```javascript
   export function formatPercentage(num, decimals = 1) {
     return `${(num * 100).toFixed(decimals)}%`;
   }
   ```

2. **`angular/src/app/shared/utils/format.utils.ts`** (Lines 143-145)
   ```typescript
   export function formatPercentage(value: number, decimals: number = 2): string {
     return formatPercent(value, decimals);
   }
   ```
   - Note: Different default decimals (1 vs 2)

**Recommendation**: Align default decimals.

### 3.3 Event Utilities

#### `debounce()` Function ✅ CONSOLIDATED

~~**Duplicated in**:~~
~~1. **`src/js/utils/shared.js`** (Lines 374-384)~~
~~2. **`src/js/utils/event-delegation.js`** (Lines 71-81)~~

**Status**: ✅ FIXED
- `event-delegation.js` now re-exports from `shared.js`
- Canonical implementation in `src/js/utils/shared.js`
- Angular version (`search-debounce.utils.ts`) kept separate (typed, generic)

#### `throttle()` Function ✅ CONSOLIDATED

~~**Duplicated in**:~~
~~1. **`src/js/utils/shared.js`** (Lines 386-397)~~
~~2. **`src/js/utils/event-delegation.js`** (Lines 88-97)~~

**Status**: ✅ FIXED
- `event-delegation.js` now re-exports from `shared.js`
- Canonical implementation in `src/js/utils/shared.js`
- Angular version (`search-debounce.utils.ts`) kept separate (typed)

---

## 4. Authentication Middleware Duplications ✅ FIXED

### 4.1 `authenticateToken()` Function ✅ CONSOLIDATED

~~**Duplicated in**:~~

~~1. **`routes/middleware/auth.middleware.js`** (Lines 42-93)~~
~~2. **`server.js`** (Lines 155-206)~~

**Status**: ✅ FIXED
- Removed duplicate from `server.js`
- Now imports from `routes/middleware/auth.middleware.js`
- Single source of truth established

### 4.2 `authorizeUserAccess()` Function ✅ CONSOLIDATED

~~**Duplicated in**:~~

~~1. **`routes/middleware/auth.middleware.js`** (Lines 103-149)~~
~~2. **`server.js`** (Lines 212-249)~~

**Status**: ✅ FIXED
- Removed duplicate from `server.js`
- Now imports from `routes/middleware/auth.middleware.js`

---

## 5. Storage Access Patterns

### 5.1 Direct localStorage/sessionStorage Access

**Issue**: Direct storage access scattered across 50+ files instead of using centralized storage service

**Files with Direct Access** (Sample):
- `angular/src/app/core/services/search.service.ts` (Lines 555, 565, 580)
- `angular/src/app/features/onboarding/onboarding.component.ts` (Lines 2474, 2520, 2532, etc.)
- `angular/src/app/core/services/platform.service.ts` (Lines 65, 80, 96, 128, 143)
- `angular/src/app/features/settings/settings.component.ts` (Lines 666, 1518)
- `angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.ts` (Lines 808, 828, 876, etc.)
- `src/secure-storage.js` (Multiple lines)
- `src/unit-manager.js` (Lines 13, 26)
- `src/performance-api.js` (Lines 36, 40, 440, 446, 456)
- And 40+ more files...

**Existing Centralized Service**:
- `src/js/services/storage-service-unified.js` - Unified storage service
- `angular/src/app/core/services/platform.service.ts` - Has `getStorage()`, `setStorage()`, `removeStorage()` methods

**Recommendation**:
- ✅ Use `storage-service-unified.js` for vanilla JS files
- ✅ Use `platform.service.ts` methods for Angular files
- 🔄 Gradually migrate direct storage access to use centralized services
- 📝 Document storage access patterns in coding guidelines

---

## 6. Validation Function Duplications

### 6.1 Email Validation

**Duplicated in**:

1. **`src/js/utils/shared.js`** (Lines 213-216)
   ```javascript
   export function validateEmail(email) {
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     return emailRegex.test(email);
   }
   ```

2. **`src/js/utils/validation.js`** (Likely has similar implementation)
   - Need to verify exact implementation

3. **`routes/utils/validation.js`** (Likely has similar implementation)
   - Backend validation

**Recommendation**: 
- ✅ Keep backend validation separate
- 🔄 Consolidate frontend validation functions

---

## 7. Shell Script Patterns

### 7.1 Common Patterns

**Issue**: Similar patterns repeated across shell scripts

#### Color Output Functions

**Duplicated in multiple scripts**:
- `scripts/test-mobile-responsive.sh` (Lines 14-36)
- `scripts/check-backend-health.sh` (Lines 10-14)
- And likely others...

**Pattern**:
```bash
GREEN='\033[0;32m'
RED='\033[0;31m'
# ... color definitions
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
```

**Recommendation**:
- ✅ Create `scripts/lib/colors.sh` with common color functions
- 🔄 Source it in all scripts: `source "$(dirname "$0")/lib/colors.sh"`

#### Server Health Check

**Duplicated in**:
- `scripts/test-mobile-responsive.sh` (Lines 39-71)
- Similar patterns in other scripts

**Recommendation**: Extract to shared utility script.

---

## 8. Summary of Recommendations

### High Priority (Consolidate Now) ✅ COMPLETED

1. ✅ **Authentication Middleware** (`server.js` vs `routes/middleware/auth.middleware.js`)
   - ~~Remove duplicate from `server.js`~~ DONE
   - ~~Use centralized middleware~~ DONE

2. ✅ **Error Handling** (`src/js/utils/error-handling.js` vs `unified-error-handler.js`)
   - ~~Deprecate older error handlers~~ DONE (deprecation notice added)
   - Angular error utils consolidated

3. ✅ **Debounce/Throttle** (JS versions)
   - ~~Consolidate JS implementations~~ DONE
   - Angular typed versions kept separate

### Medium Priority (Gradual Migration)

4. **Storage Access**
   - Migrate direct localStorage/sessionStorage to centralized services
   - Document patterns

5. **Date Formatting**
   - Align JS date utilities with TS implementations
   - Consider shared date library

6. **String Utilities**
   - Align implementations (capitalize, getInitials, kebabCase)
   - Ensure consistent behavior

### Low Priority (Documentation)

7. **Shell Script Utilities**
   - Extract common patterns to shared library
   - Create `scripts/lib/` directory

---

## 9. Files Requiring Action

### Immediate Actions ✅ COMPLETED

1. ✅ **`server.js`**
   - ~~Remove `authenticateToken` and `authorizeUserAccess` functions~~ DONE
   - ~~Import from `routes/middleware/auth.middleware.js`~~ DONE

2. ✅ **`src/js/utils/error-handling.js`**
   - ~~Add deprecation notice~~ DONE
   - Consumers should update imports to use `unified-error-handler.js`

3. ✅ **`src/js/utils/event-delegation.js`**
   - ~~Consolidate `debounce()` and `throttle()` implementations~~ DONE
   - Now re-exports from `shared.js`

4. ✅ **Angular Error Utils**
   - ~~Consolidate `getErrorMessage` implementations~~ DONE
   - ~~Consolidate `toError` implementations~~ DONE

### Gradual Migration (Future Work)

5. **Storage Access** (50+ files)
   - Create migration guide
   - Update files incrementally
   - Use centralized storage services

6. **Date Utilities**
   - Align JS implementations with TS
   - Consider date-fns for consistency

---

## 10. Metrics

### Duplication Statistics (Before Fixes)

- **Error Handling**: 6 implementations
- **Date Formatting**: 4 implementations
- **String Utilities**: 8+ duplicate functions
- ~~**Authentication**: 2 duplicate middleware functions~~ ✅ FIXED
- **Storage Access**: 50+ files with direct access
- ~~**Debounce/Throttle**: 3 implementations each~~ ✅ FIXED (JS consolidated)

### After Fixes (2025-01-11)

- **Lines Removed**: ~200+ lines of duplicate code
- **Files Modified**: 5 files
- **Consolidations Applied**: 4 major duplications fixed

### Remaining Work

- **Lines of Duplicate Code**: ~300-600 lines (medium priority items)
- **Files Affected**: 50+ files (mostly storage access patterns)
- **Consolidation Potential**: Medium (gradual migration recommended)

---

## Notes

- Some duplications are intentional (e.g., JS vs TS implementations)
- Backend vs Frontend duplications are acceptable
- Focus on consolidating within the same context (JS vs JS, TS vs TS)
- Prioritize high-impact consolidations first

---

**Next Steps**:
1. Review this report with the team
2. Prioritize consolidation tasks
3. Create tickets for high-priority items
4. Update coding guidelines to prevent future duplications
