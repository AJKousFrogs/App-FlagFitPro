# Build Warnings (Known, Non-Blocking)

This app targets modern browsers and uses third-party libraries that trigger
esbuild debug warnings during `ng build`. The warnings do not break the build
and are acceptable for the current target set.

## 1) Unicode property escapes (PrimeNG)

**Warning:** `unsupported-regexp`  
**Source:** `node_modules/primeng/fesm2022/primeng-utils.mjs`  
**Snippet:** `str.normalize('NFKD').replace(/\\p{Diacritic}/gu, '')`

**Why it appears:** esbuild is conservative about `\\p{Diacritic}` support in the
target environment, so it rewrites the regex and prints a warning.

**Runtime impact:** None for our targets (modern Chrome/Edge/Firefox/Safari).

**Action:** Accept. Do not patch PrimeNG or add a RegExp polyfill.

## 2) Unsupported dynamic import (Sentry)

**Warning:** `unsupported-dynamic-import`  
**Source:** `src/app/core/services/error-tracking.service.ts`

**Why it appears:** The import argument is dynamic, so the bundler leaves it
unbundled.

**Runtime impact:** None if the module path resolves at runtime.

**Action:** Accept. Sentry is optional and may not be installed in dev/test.

## html2canvas note

We apply a tiny postinstall patch to `html2canvas` to remove a duplicate
`case 22` in the list-style switch. This silences the esbuild debug warning
without changing runtime behavior.

## How to Reproduce

```bash
npx ng build --progress=false --verbose
```
