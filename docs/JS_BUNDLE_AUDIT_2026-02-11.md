# JavaScript Bundle Audit — FlagFit Pro

**Audit Date:** February 11, 2026  
**Scope:** Production build output, initial load, lazy chunks, dependencies  
**Framework:** Angular 21 (esbuild builder), zoneless, standalone components

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Initial load (raw)** | 1.66 MB |
| **Initial load (est. transfer)** | 335.85 KB (gzipped) |
| **Main bundle** | 188.88 KB |
| **Largest lazy chunks** | jspdf (410 KB), html2canvas (202 KB), onboarding (194 KB) |
| **Total route chunks** | 80+ lazy-loaded components |

The app uses proper lazy loading for routes. The heaviest cost is **third-party libraries** (jspdf, html2canvas, Supabase, Chart.js) and a few **oversized components** (onboarding ~194 KB). Initial load is within budget; optimization opportunities focus on reducing lazy chunk sizes and consolidating duplicate PDF logic.

---

## 1. Initial Load Composition

| Chunk | Raw Size | Est. Transfer | Notes |
|-------|----------|---------------|-------|
| styles | 504.73 kB | 53.26 kB | CSS (previously audited) |
| main | 188.88 kB | 30.39 kB | Core app, router, providers |
| chunk-QWR3L5JH | 173.83 kB | 39.39 kB | Shared (likely PrimeNG subset) |
| chunk-M6CJWERS | 172.10 kB | 49.91 kB | Shared (likely RxJS + shared code) |
| chunk-VERWADFU | 94.09 kB | 23.65 kB | Shared |
| chunk-63N6XSFV | 85.64 kB | 21.49 kB | Shared |
| chunk-O3BM6XSN | 48.71 kB | 13.89 kB | Shared |
| + 20 smaller chunks | ~250 kB | ~80 kB | Feature code, primitives |

**Budgets (angular.json):**
- Initial: 1.7 MB warning / 1.75 MB error ✓
- anyScript: 450 KB warning / 600 KB error ✓
- Initial load is within limits.

---

## 2. Largest Lazy Chunks

| Chunk | Size | Triggered By | Notes |
|-------|------|--------------|-------|
| jspdf.es.min | 410 KB | PDF export (ACWR, etc.) | Lazy via `import("jspdf")` ✓ |
| html2canvas | 202 KB | PDF export | Lazy via `import("html2canvas")` ✓ |
| onboarding.component | 194 KB | `/onboarding` route | **Oversized** — 3,696 lines, many PrimeNG imports |
| index.es (Supabase) | 158 KB | Auth, data access | Eager in core; consider lazy if possible |
| chunk-U632TLY6 | 229 KB | Shared | Likely Supabase or Chart.js |
| chunk-BTB26ZO7 | 204 KB | Shared | Likely PrimeNG or charting |
| analytics.component | 118 KB | `/analytics` | Chart-heavy |
| ai-coach-chat.component | 111 KB | `/chat` | AI/chat logic |
| settings.component | 108 KB | `/settings` | Many sub-features |
| travel-recovery.component | 107 KB | `/travel/recovery` | Feature size |
| today.component | 105 KB | `/todays-practice` | Core daily view |
| roster.component | 100 KB | `/roster` | Table, forms |

---

## 3. Findings & Recommendations

### 3.1 PDF Export — Duplicate Logic & Unused Services

**Issue:** Two patterns for PDF export:

1. **acwr-dashboard.component.ts** — Inline `import("jspdf")` and `import("html2canvas")` directly in `exportPDF()`.
2. **LazyPdfService** and **LazyScreenshotService** — Centralized services using the same dynamic imports. **Neither service is imported or used anywhere.**

**Fixed (Feb 11):**
- Extended `LazyPdfService` with `headerText`, `subtitleText`, `imageFormat`, `imageMaxHeight` options.
- Migrated acwr-dashboard to use `LazyPdfService` (centralized PDF export, lib caching).
- Deleted unused `LazyScreenshotService` (dead code).

---

### 3.2 Onboarding Component — 194 KB / 3,696 Lines

**Issue:** Single component with:
- Many PrimeNG imports (AutoComplete, Card, Checkbox, DatePicker, InputText, ProgressBar, Select, Stepper, etc.)
- 3,696 lines of template + logic
- One-time use flow (preload: false ✓)

**Recommendation:**
- Split into step sub-components (e.g. `OnboardingProfileStep`, `OnboardingInjuryStep`, etc.) and lazy load per step or group.
- Extract shared onboarding types and utilities to a barrel.
- Use `@defer` for below-the-fold steps if template allows.

**Potential savings:** 50–80 KB by deferring later steps.

---

### 3.3 Supabase Client — Eager Load

**Issue:** `@supabase/supabase-js` is used by `SupabaseService` and imported by many core services (auth, AcwrService, notification-state, realtime-sync, game-stats, presence, team-notification). The client is loaded eagerly.

**Recommendation:**
- Supabase is required for auth and core data; eager load is likely necessary.
- Ensure only needed Supabase features (e.g. auth, database, realtime) are used; avoid pulling unused modules if the library supports tree-shaking.
- `index.es` (158 KB) in lazy chunks suggests it may be shared across features — confirm no duplicate Supabase bundles.

---

### 3.4 Chart.js Usage

**Issue:** Chart.js is used for analytics, ACWR, and other dashboards. Build shows a small `chart` chunk (948 bytes) — likely a lazy entry; actual Chart.js may be in shared chunks.

**Recommendation:**
- Verify Chart.js is tree-shaken (import only used chart types).
- Consider lazy loading chart components with `@defer` when they enter the viewport.

---

### 3.5 PrimeNG Imports

**Issue:** Components import full PrimeNG modules (e.g. `TableModule` vs standalone `Table`). PrimeNG 21 supports standalone; migration reduces bundle when only specific components are needed.

**Recommendation:**
- Audit components importing `TableModule`, `DialogModule`, etc., and migrate to standalone `Table`, `Dialog` where possible.
- Ensure `provideAnimationsAsync()` is used (already in app.config) so animations are lazy.

---

### 3.6 Preload Strategy

**Current:** `AuthAwarePreloadStrategy` — preloads high-priority routes (dashboard, today, training, analytics, roster, etc.) after initial load.

**Recommendation:**
- Review if all preloaded routes are truly high-traffic.
- Routes with `preload: false` (onboarding, reset-password, settings, game-tracker, etc.) are correctly deferred.

---

## 4. Dependency Overview

| Package | Approx. Size | Notes |
|---------|--------------|-------|
| @supabase/supabase-js | ~158 KB | Auth, DB, realtime — core |
| primeng | Variable | Component-based; shared chunks |
| chart.js | Variable | Lazy with charts |
| jspdf | 410 KB | Lazy on PDF export ✓ |
| html2canvas | 202 KB | Lazy on PDF export ✓ |
| date-fns | Tree-shakeable | Use named imports |
| rxjs | ~50 KB | Core; use ` pipe ` + operators |
| zone.js | Optional | Zoneless — minimal/no zone |

---

## 5. Action Items (Prioritized)

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| 1 | ~~Remove or adopt `LazyPdfService` / `LazyScreenshotService`~~ | Done | Centralized PDF, removed LazyScreenshot |
| 2 | Split onboarding into smaller lazy components | Medium | −50–80 KB (deferred—larger refactor) |
| 3 | Audit PrimeNG imports (standalone vs module) | Medium | PrimeNG 21.1 still needs TableModule per prior audit |
| 4 | Chart.js: coach-analytics now uses `import type` for ChartOptions | Done | Minor tree-shake improvement |
| 5 | Run `npx esbuild-visualizer` or Angular `--stats-json` (if supported) for exact module breakdown | Low | Visibility |

---

## 6. Reproducing the Audit

```bash
cd angular && npm run build
```

Build output shows initial vs lazy chunks. For deeper analysis:

```bash
npx source-map-explorer dist/flagfit-pro/browser/*.js --html bundle-report.html
```

---

## 7. Build Configuration Notes

- **Builder:** `@angular-devkit/build-angular:application` (esbuild)
- **Output:** `dist/flagfit-pro` (static)
- **Optimization:** Scripts minified, styles minified + inlineCritical
- **Source maps:** Disabled in production
- **Allowed CJS:** canvg, core-js, raf, rgbcolor, html2canvas, jspdf (for PDF libs)

---

---

## 8. Follow-Up Audit — Other Issues

| Area | Status |
|------|--------|
| Onboarding (3,696 lines, 194 KB chunk) | Deferred — requires step extraction + shared state; see feature-routes for loadComponent pattern |
| PrimeNG TableModule | 27 components use TableModule; PrimeNG 21.1 migration attempted previously, reverted |
| Chart.js | lazy-chart uses dynamic import ✓; enhanced-chart.config used by analytics (lazy) ✓ |
| Root-provided services | Many; tree-shaken if unused; no obvious removals without usage analysis |

---

*Generated by JS Bundle Audit — February 11, 2026*
