# Cookie Banner - Development Refresh Guide

## Quick Fixes for Changes Not Showing

### 1. Clear localStorage (Most Common Issue)
The cookie banner won't show if you've already dismissed it. Clear it:

**Browser Console:**
```javascript
localStorage.removeItem('flagfit_cookie_consent');
location.reload();
```

**Or manually:**
- Chrome DevTools → Application → Local Storage → `http://localhost:4200` → Delete `flagfit_cookie_consent`

### 2. Unregister Service Worker
Even though SW is disabled in dev, it might still be active:

**Browser Console:**
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  location.reload();
});
```

### 3. Hard Refresh Browser
- **Mac**: `Cmd + Shift + R` or `Cmd + Option + R`
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`

### 4. Clear Browser Cache
- Chrome: DevTools → Application → Clear Storage → Clear site data
- Or use Incognito/Private window

### 5. Restart Dev Server
Sometimes Angular's file watcher gets stuck:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev:angular-only
```

### 6. Force Component Re-render
If using OnPush, manually trigger change detection (temporary debug):

Add to component temporarily:
```typescript
import { ChangeDetectorRef } from '@angular/core';

constructor(private cdr: ChangeDetectorRef) {}

ngOnInit() {
  // Force check on init
  this.cdr.markForCheck();
}
```

## Why This Happens

1. **localStorage Persistence**: Cookie consent is stored in localStorage, so once dismissed, it won't show again until cleared.

2. **Service Worker**: Even disabled in dev mode, previously registered SW can cache old files.

3. **Browser Cache**: Aggressive caching of JS/CSS files.

4. **OnPush Change Detection**: Component only updates when signals change, not on every file change.

## Prevention

For development, you can temporarily disable localStorage persistence:

In `cookie-consent.service.ts`, add a dev mode check:
```typescript
private savePreferences(preferences: CookiePreferences): void {
  if (isDevMode()) {
    console.log('[Cookie Service] Dev mode - preferences not persisted');
    return; // Skip localStorage in dev
  }
  // ... rest of code
}
```
