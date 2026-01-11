# Storage Access Guide

**Version**: 1.0  
**Last Updated**: 2025-01-11  
**Status**: Migration Guide

---

## Overview

This guide documents the recommended patterns for accessing browser storage (localStorage, sessionStorage) across the FlagFit Pro codebase. Direct storage access is scattered across 50+ files; this guide helps migrate to centralized services.

---

## Centralized Storage Services

### For Vanilla JavaScript (Legacy HTML Pages)

**Location**: `src/js/services/storage-service-unified.js`

```javascript
import { storageService } from '../services/storage-service-unified.js';

// Set a value
storageService.set('key', value);

// Get a value
const value = storageService.get('key', defaultValue);

// Remove a value
storageService.remove('key');

// Check if key exists
if (storageService.has('key')) { ... }
```

### For Angular Components

**Location**: `angular/src/app/core/services/platform.service.ts`

```typescript
import { PlatformService } from '@core/services/platform.service';

@Component({...})
export class MyComponent {
  constructor(private platform: PlatformService) {}

  saveData() {
    this.platform.setStorage('key', 'value');
  }

  loadData() {
    return this.platform.getStorage('key');
  }

  removeData() {
    this.platform.removeStorage('key');
  }
}
```

---

## Migration Patterns

### Pattern 1: Simple Get/Set

**Before (Direct Access)**:
```javascript
// Setting
localStorage.setItem('user_settings', JSON.stringify(settings));

// Getting
const settings = JSON.parse(localStorage.getItem('user_settings') || '{}');

// Removing
localStorage.removeItem('user_settings');
```

**After (Centralized Service)**:
```javascript
import { storageService } from '../services/storage-service-unified.js';

// Setting (auto-serializes objects)
storageService.set('user_settings', settings);

// Getting (auto-deserializes)
const settings = storageService.get('user_settings', {});

// Removing
storageService.remove('user_settings');
```

### Pattern 2: Session Storage

**Before**:
```javascript
sessionStorage.setItem('csrf_token', token);
const token = sessionStorage.getItem('csrf_token');
```

**After**:
```javascript
storageService.set('csrf_token', token, { storage: 'session' });
const token = storageService.get('csrf_token', null, { storage: 'session' });
```

### Pattern 3: Prefixed Keys

**Before**:
```javascript
localStorage.setItem('flagfit_preferences', JSON.stringify(prefs));
```

**After**:
```javascript
// The service can auto-prefix keys
storageService.set('preferences', prefs, { usePrefix: true });
// Stores as 'flagfit_preferences'
```

---

## Storage Keys Reference

### User Data Keys
| Key | Service | Description |
|-----|---------|-------------|
| `user_settings` | localStorage | User preferences |
| `flagfit_preferences` | localStorage | App preferences |
| `sidebar-me-group-expanded` | localStorage | Sidebar UI state |
| `temperatureUnit` | localStorage | Temperature unit preference |

### Auth Keys
| Key | Service | Description |
|-----|---------|-------------|
| `authToken` | localStorage | Authentication token (legacy) |
| `__auth_token_enc` | localStorage | Encrypted auth token |
| `__auth_method` | sessionStorage | Auth method indicator |
| `__session_id` | sessionStorage | Session identifier |
| `__crypto_key_data` | sessionStorage | Encryption key data |

### Feature Data Keys
| Key | Service | Description |
|-----|---------|-------------|
| `tournament_schedule` | localStorage | Tournament data |
| `hydration_logs_*` | localStorage | Daily hydration logs |
| `wellness-streak` | localStorage | Wellness check-in streak |
| `recentSearches` | localStorage | Search history |
| `active-tournament` | localStorage | Active tournament state |

### Temporary/Session Keys
| Key | Service | Description |
|-----|---------|-------------|
| `programAssignmentPending` | sessionStorage | Onboarding state |
| `refreshProgramAssignment` | sessionStorage | Refresh trigger |
| `postOnboardingRedirect` | sessionStorage | Redirect after onboarding |

---

## Files Requiring Migration

### High Priority (Direct Auth Storage)
1. `src/secure-storage.js` - Already has encryption, keep as-is
2. `src/auth-manager.js` - Consider using secure-storage.js

### Medium Priority (Feature Data)
1. `angular/src/app/core/services/search.service.ts` - Lines 555, 565, 580
2. `angular/src/app/features/settings/settings.component.ts` - Lines 666, 1518
3. `angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.ts`
4. `angular/src/app/features/game-tracker/game-tracker.component.ts`
5. `angular/src/app/core/services/tournament-mode.service.ts`

### Low Priority (UI State)
1. `angular/src/app/shared/components/sidebar/sidebar.component.ts`
2. `angular/src/app/shared/components/enhanced-data-table/enhanced-data-table.component.ts`
3. `angular/src/app/shared/components/quick-wellness-checkin/quick-wellness-checkin.component.ts`

---

## Best Practices

### 1. Always Use Try-Catch
Storage can fail (quota exceeded, private browsing):

```javascript
// storageService handles this internally, but if using direct access:
try {
  localStorage.setItem('key', value);
} catch (e) {
  console.warn('Storage unavailable:', e);
}
```

### 2. Validate Retrieved Data
Data can be corrupted or in unexpected format:

```javascript
const data = storageService.get('key');
if (data && typeof data === 'object') {
  // Use data
}
```

### 3. Clean Up Old Keys
When migrating, clean up legacy keys:

```javascript
// Migration example
const legacyData = localStorage.getItem('old_key');
if (legacyData) {
  storageService.set('new_key', JSON.parse(legacyData));
  localStorage.removeItem('old_key');
}
```

### 4. Use Appropriate Storage
- **localStorage**: Persistent data, user preferences
- **sessionStorage**: Temporary session data, CSRF tokens
- **secure-storage**: Authentication tokens, sensitive data

---

## Angular Platform Service Details

The `PlatformService` provides:

1. **SSR Safety**: Checks if running in browser before accessing storage
2. **Type Safety**: Proper TypeScript types
3. **Fallbacks**: Graceful handling when storage is unavailable

```typescript
// platform.service.ts methods:
getStorage(key: string): string | null
setStorage(key: string, value: string): void
removeStorage(key: string): void
getSessionStorage(key: string): string | null
setSessionStorage(key: string, value: string): void
```

---

## Migration Checklist

- [ ] Identify all direct localStorage/sessionStorage calls in file
- [ ] Import appropriate storage service
- [ ] Replace direct calls with service methods
- [ ] Test in private browsing mode
- [ ] Test with storage quota exceeded (use DevTools)
- [ ] Clean up any legacy key migrations
- [ ] Update unit tests if applicable

---

## Related Documentation

- `src/js/services/storage-service-unified.js` - Vanilla JS storage service
- `angular/src/app/core/services/platform.service.ts` - Angular platform service
- `src/secure-storage.js` - Secure/encrypted storage for auth tokens
