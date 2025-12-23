# Angular 21 Migration Guide

## Overview

This guide documents the migration from Angular 19 to Angular 21 for FlagFit Pro.

**Migration Date**: December 2024  
**From**: Angular 19.2.x + PrimeNG 19.1.x  
**To**: Angular 21.0.x + PrimeNG 21.0.x

---

## 🎯 Key Changes in Angular 21

### Major Features

1. **Zoneless Change Detection** - Stable, optional zone.js (we'll keep zone.js for now)
2. **Signal Forms** - Experimental signal-based forms (optional)
3. **Vitest Integration** - Default test runner (replaces Karma/Jasmine)
4. **Angular ARIA** - New accessibility package
5. **NgClass/NgStyle Migrations** - Automatic migrations available

### Breaking Changes

- TypeScript 5.7+ required
- Zone.js 0.16.0+ recommended
- Some deprecated APIs removed
- PrimeNG 21 requires Angular 21

---

## 📋 Pre-Migration Checklist

- [x] Current Angular version: 19.2.17
- [x] Current PrimeNG version: 19.1.4
- [x] Current TypeScript version: 5.6.3
- [x] Zone.js enabled: Yes (via provideZoneChangeDetection)
- [ ] Backup current codebase
- [ ] Review all components for NgClass/NgStyle usage
- [ ] Check test configuration

---

## 🚀 Migration Steps

### Step 1: Update Angular Core Packages

```bash
cd angular
ng update @angular/core@21 @angular/cli@21
```

This will:

- Update all Angular packages to version 21
- Update Angular CLI to version 21
- Update TypeScript if needed
- Update zone.js if needed

### Step 2: Update PrimeNG

```bash
npm install primeng@^21.0.0 primeicons@^7.0.0
```

### Step 3: Update TypeScript (if not updated automatically)

```bash
npm install --save-dev typescript@~5.9.0
```

### Step 4: Update Zone.js (if not updated automatically)

```bash
npm install zone.js@~0.16.0
```

### Step 5: Update @types/node

```bash
npm install --save-dev @types/node@^24.0.0
```

### Step 6: Run NgClass/NgStyle Migrations (if needed)

```bash
# Check for NgClass usage
ng generate @angular/core:ngclass-to-class

# Check for NgStyle usage
ng generate @angular/core:ngstyle-to-style
```

### Step 7: Update angular.json (if needed)

The Angular CLI update should handle most changes, but verify:

- Build configuration is correct
- Test configuration (if migrating to Vitest)

### Step 8: Test the Application

```bash
npm run build
npm start
npm test
```

---

## 🔧 Configuration Updates

### app.config.ts

No changes required if keeping zone.js. The current configuration:

```typescript
provideZoneChangeDetection({ eventCoalescing: true });
```

Will continue to work. If you want to experiment with zoneless:

```typescript
// Optional: Enable zoneless (experimental)
import { provideExperimentalZonelessChangeDetection } from "@angular/core";

// Replace provideZoneChangeDetection with:
provideExperimentalZonelessChangeDetection();
```

### angular.json

Verify the polyfills configuration:

```json
"polyfills": ["zone.js"]
```

This should remain if using zone.js.

### tsconfig.json

TypeScript target may need updating:

```json
{
  "compilerOptions": {
    "target": "ES2022", // or ES2023
    "lib": ["ES2022", "dom"] // or ES2023
  }
}
```

---

## 🧪 Testing Migration

### Option 1: Keep Existing Test Setup

If you're using Karma/Jasmine, you can continue using it. Angular 21 doesn't force Vitest migration.

### Option 2: Migrate to Vitest (Recommended)

Angular 21 recommends Vitest. To migrate:

1. Install Vitest:

```bash
npm install --save-dev vitest @vitest/ui
```

2. Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import angular from "@analogjs/vite-plugin-angular";

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: "jsdom",
  },
});
```

3. Update package.json:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

---

## ⚠️ Breaking Changes to Watch For

### 1. Deprecated APIs Removed

- Check for any deprecated Angular APIs
- Review console warnings during build

### 2. PrimeNG Component Changes

- Review PrimeNG 21 changelog for component API changes
- Test all PrimeNG components used in the app

### 3. TypeScript Strictness

- Angular 21 may enforce stricter TypeScript checks
- Fix any new type errors

### 4. RxJS Compatibility

- Ensure RxJS version is compatible (7.8.0 should work)

---

## 📦 Package Versions After Migration

```json
{
  "dependencies": {
    "@angular/animations": "^21.0.0",
    "@angular/common": "^21.0.0",
    "@angular/compiler": "^21.0.0",
    "@angular/core": "^21.0.0",
    "@angular/forms": "^21.0.0",
    "@angular/platform-browser": "^21.0.0",
    "@angular/platform-browser-dynamic": "^21.0.0",
    "@angular/router": "^21.0.0",
    "primeng": "^21.0.0",
    "primeicons": "^7.0.0",
    "rxjs": "~7.8.0",
    "zone.js": "~0.16.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^21.0.0",
    "@angular/cli": "^21.0.0",
    "@angular/compiler-cli": "^21.0.0",
    "@types/node": "^24.0.0",
    "typescript": "~5.9.0"
  }
}
```

---

## 🔍 Post-Migration Verification

### Build Verification

```bash
npm run build
# Should complete without errors
```

### Runtime Verification

```bash
npm start
# Test all major features:
# - Authentication
# - Dashboard
# - Training
# - Analytics
# - All PrimeNG components
```

### Test Verification

```bash
npm test
# All tests should pass
```

---

## 🐛 Troubleshooting

### Issue: Build fails with TypeScript errors

**Solution**: Update TypeScript to 5.9.0 and fix type errors

### Issue: PrimeNG components not rendering

**Solution**: Ensure PrimeNG 21 is installed and check component imports

### Issue: Zone.js errors

**Solution**: Verify zone.js version is 0.16.0+

### Issue: Test failures

**Solution**: Review test configuration and update if migrating to Vitest

---

## 📚 Additional Resources

- [Angular 21 Release Notes](https://github.com/angular/angular/releases/tag/21.0.0)
- [Angular Update Guide](https://update.angular.io/)
- [PrimeNG 21 Changelog](https://github.com/primefaces/primeng/blob/master/CHANGELOG.md)
- [Angular 21 Blog Post](https://blog.angular.io/angular-v21-is-now-available-6d8c8c0c5c4a)

---

## ✅ Migration Checklist

- [ ] Run migration script
- [ ] Update all packages
- [ ] Run NgClass/NgStyle migrations (if needed)
- [ ] Update configuration files
- [ ] Fix any TypeScript errors
- [ ] Test build process
- [ ] Test all features
- [ ] Run test suite
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Verify production build

---

**Migration Status**: Ready to execute  
**Estimated Time**: 1-2 hours  
**Risk Level**: Medium (major version upgrade)
