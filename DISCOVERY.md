# DISCOVERY.md — FlagFit Pro (Angular)

**Scope:** `angular/` only. The root-level vanilla HTML/SCSS/TS app (`scripts/`, `tests/`, `sw.js`, `supabase-types.ts`, etc.) is **out of scope** per user direction ("clean slate"). It will be flagged as a deletion candidate in REVAMP.md.

**Methodology:** Read-only inspection of the repo at `main` HEAD. Counts via `find` + `wc -l` + `git log`. No edits. No opinions in this file.

---

## 1. Workspace facts

| Property | Value | Source |
|---|---|---|
| Workspace | `angular/angular.json` | `mcp__angular__list_projects` |
| Project name | `flagfit-pro` | [angular.json](angular/angular.json) |
| Type | application (SSR) | builder `@angular-devkit/build-angular:application`, `outputMode` set |
| Angular framework version | **21.2.2** | [package.json](angular/package.json) |
| Style language | SCSS | `angular.json` |
| Change detection | **Zoneless** (`provideZonelessChangeDetection()`) | [app.config.ts:55](angular/src/app/app.config.ts:55) |
| Test runner | Vitest (unit) + Playwright (e2e) + Storybook | `package.json` scripts |
| Node | `>=22.0.0` | [package.json:7](angular/package.json:7) |
| Package manager | `npm@11.4.2` | [package.json:6](angular/package.json:6) |
| Total commits on `main` | 734 | `git log --oneline` |
| App version declared | `4.0.0` | [package.json:3](angular/package.json:3) |

Build targets defined in `angular.json`: `build`, `serve`, `test`, `storybook`, `build-storybook`, `serve-ssr`, `prerender`, `server`, `lint`.

---

## 2. File tree — counts and LOC

### 2.1 Whole `src/` by extension

| Ext | Files | LOC |
|---|---:|---:|
| `.ts` (excl. spec) | 646 | — |
| `.ts` (spec) | 60 | — |
| `.ts` total | 706 | **188,232** |
| `.html` | 194 | **41,303** |
| `.scss` | 364 | **93,093** |
| `.css` | 1 | 1,328 |
| `.svg` | 9 | — |
| Font files (woff/woff2/ttf) | 12 | — |
| Images (png) | 4 | — |

### 2.2 `src/app/core/` — subdirectory sizes (TS, excl. spec)

| Path | Files | LOC |
|---|---:|---:|
| `core/services/` | 111 | **52,477** |
| `core/utils/` | 12 | 2,751 |
| `core/models/` | 13 | 2,740 |
| `core/constants/` | 10 | 2,429 |
| `core/routes/` (12 groups + `feature-routes.ts`) | 13 | 1,419 |
| `core/config/` | 3 | 1,351 |
| `core/interceptors/` | 4 | 661 |
| `core/schemas/` | 1 | 603 |
| `core/semantics/` | 2 | 542 |
| `core/view-models/` | 3 | 489 |
| `core/logging/` | 7 | 484 |
| `core/navigation/` | 1 | 444 |
| `core/strategies/` | 2 | 267 |
| `core/guards/` | 4 | 187 |
| `core/resolvers/` | 2 | 54 |
| `core/ui/` | 1 | 55 |
| **core total** | **189** | **66,953** |

`core/services/` contains **140 dir entries**, 111 of which are non-spec `.ts` files.

### 2.3 `src/app/features/` — per-feature sizes

45 feature directories. Sorted by TS LOC descending:

| Feature | TS files | HTML | SCSS | TS LOC | Last commit |
|---|---:|---:|---:|---:|---|
| training | 63 | 27 | 46 | 14,455 | 2026-05-12 |
| coach | 30 | 19 | 19 | 11,784 | 2026-05-08 |
| settings | 28 | 16 | 16 | 4,284 | 2026-04-24 |
| staff | 16 | 12 | 16 | 4,397 | 2026-05-11 |
| onboarding | 18 | 3 | 3 | 3,923 | 2026-04-24 |
| roster | 12 | 3 | 7 | 3,764 | 2026-05-12 |
| today | 13 | 5 | 7 | 3,583 | 2026-05-12 |
| dashboard | 18 | 13 | 13 | 3,006 | 2026-04-24 |
| ai-coach | 6 | 1 | 1 | 2,572 | 2026-05-12 |
| auth | 7 | 0 | 6 | 2,311 | 2026-05-08 |
| game | 4 | 2 | 2 | 1,986 | 2026-05-11 |
| tournaments | 10 | 9 | 6 | 1,802 | 2026-04-24 |
| analytics | 8 | 5 | 5 | 1,765 | 2026-05-11 |
| game-tracker | 2 | 2 | 2 | 1,591 | 2026-04-21 |
| profile | 7 | 6 | 6 | 1,366 | 2026-05-11 |
| community | 5 | 4 | 4 | 1,337 | 2026-04-24 |
| team | 7 | 2 | 3 | 1,250 | 2026-04-24 |
| performance-tracking | 2 | 1 | 1 | 1,080 | 2026-05-11 |
| chat | 5 | 5 | 5 | 1,078 | 2026-04-24 |
| acwr-dashboard | 2 | 1 | 1 | 891 | 2026-05-12 |
| return-to-play | 1 | 1 | 1 | 873 | 2026-04-24 |
| superadmin | 4 | 4 | 4 | 789 | 2026-04-24 |
| cycle-tracking | 1 | 1 | 1 | 757 | 2026-04-21 |
| wellness | 2 | 2 | 2 | 710 | 2026-05-11 |
| data-import | 4 | 4 | 2 | 691 | 2026-04-24 |
| travel | 3 | 3 | 3 | 655 | 2026-04-21 |
| exercisedb | 1 | 1 | 1 | 551 | 2026-04-24 |
| equipment | 1 | 1 | 1 | 540 | 2026-05-11 |
| officials | 1 | 1 | 1 | 514 | 2026-04-24 |
| team-calendar | 3 | 2 | 2 | 498 | 2026-04-21 |
| playbook | 5 | 4 | 4 | 492 | 2026-04-21 |
| attendance | 1 | 1 | 1 | 456 | 2026-04-24 |
| achievements | 1 | 1 | 1 | 422 | 2026-04-20 |
| workout | 2 | 1 | 1 | 413 | 2026-05-11 |
| exercise-library | 1 | 1 | 1 | 414 | 2026-04-21 |
| sleep-debt | 1 | 1 | 1 | 359 | 2026-04-21 |
| reports | 1 | 0 | 1 | 358 | 2026-04-21 |
| film-room | 1 | 1 | 1 | 357 | 2026-04-24 |
| depth-chart | 1 | 1 | 1 | 343 | 2026-04-24 |
| notifications | 1 | 1 | 1 | 311 | 2026-04-20 |
| payments | 1 | 1 | 1 | 288 | 2026-04-21 |
| landing | 1 | 1 | 1 | 271 | 2026-04-21 |
| search | 1 | 0 | 1 | 252 | 2026-04-05 |
| help | 2 | 1 | 2 | 199 | 2026-04-24 |
| legal | 1 | 0 | 1 | 146 | 2026-04-05 |
| not-found | 1 | 0 | 1 | 64 | 2026-04-24 |

### 2.4 `src/app/shared/`

| Path | Files | LOC |
|---|---:|---:|
| `shared/components/` | 109 | 17,112 |
| `shared/utils/` | 15 | 4,011 |
| `shared/config/` | 2 | 730 |
| `shared/directives/` | 4 | 504 |
| `shared/animations/` | 2 | 18 |
| `shared/pipes/` | 1 | 17 |

### 2.5 Top 30 largest TS files (excl. spec)

| Lines | Path |
|---:|---|
| 1,650 | `core/services/flag-football-performance-system.data.ts` |
| 1,424 | `core/services/flag-football-athlete-profile.data.ts` |
| 1,360 | `core/services/acwr.service.ts` |
| 1,347 | `core/services/channel.service.ts` |
| 1,315 | `core/services/sprint-training-knowledge.data.ts` |
| 1,268 | `core/services/travel-recovery.service.ts` |
| 1,206 | `features/game-tracker/game-tracker.component.ts` |
| 1,181 | `features/tournaments/tournaments.component.ts` |
| 1,175 | `features/analytics/analytics.component.ts` |
| 1,171 | `features/roster/roster.service.ts` |
| 1,146 | `features/game/tournament-nutrition/tournament-nutrition.component.ts` |
| 1,145 | `core/services/unified-training.service.ts` |
| 1,131 | `features/ai-coach/ai-coach-chat.component.ts` |
| 1,119 | `features/today/today.component.ts` |
| 1,077 | `core/services/instagram-video.service.ts` |
| 1,068 | `core/services/performance-data.service.ts` |
| 1,036 | `core/services/training-plan.service.ts` |
| 1,003 | `core/services/nutrition.service.ts` |
| 1,001 | `core/services/notification-state.service.ts` |
| 975 | `features/performance-tracking/performance-tracking.component.ts` |
| 973 | `features/dashboard/coach-dashboard.component.ts` |
| 962 | `features/dashboard/player-dashboard.component.ts` |
| 955 | `features/profile/profile.component.ts` |
| 945 | `core/services/weather-cancellation.service.ts` |
| 941 | `core/services/team-notification.service.ts` |
| 928 | `core/services/flag-football-periodization.data.ts` |
| 897 | `core/services/privacy-settings.service.ts` |
| 888 | `features/today/resolution/today-state.resolver.ts` |
| 876 | `features/staff/psychology/psychology-reports.component.ts` |
| 873 | `features/return-to-play/return-to-play.component.ts` |

### 2.6 Top 10 largest SCSS

| Lines | Path |
|---:|---|
| 3,265 | `src/scss/components/primeng-theme.scss` |
| 3,026 | `src/assets/styles/overrides/_component-overrides.scss` |
| 2,690 | `src/scss/tokens/design-system-tokens.scss` |
| 1,515 | `src/scss/components/primeng/_brand-overrides.scss` |
| 1,497 | `features/game/tournament-nutrition/tournament-nutrition.component.scss` |
| 1,405 | `src/scss/components/notifications.scss` |
| 1,345 | `features/ai-coach/ai-coach-chat.component.scss` |
| 1,157 | `src/scss/components/primeng-integration.scss` |
| 1,094 | `features/travel/travel-recovery/travel-recovery.component.scss` |
| 1,077 | `src/scss/utilities/_mixins.scss` |

Global stylesheet [styles.scss](angular/src/styles.scss): 653 lines.

### 2.7 Top 10 largest HTML templates

| Lines | Path |
|---:|---|
| 897 | `features/travel/travel-recovery/travel-recovery.component.html` |
| 847 | `features/game-tracker/game-tracker.component.html` |
| 784 | `features/exercisedb/exercisedb-manager.component.html` |
| 755 | `features/coach/knowledge-base/knowledge-base.component.html` |
| 725 | `features/coach/injury-management/injury-management.component.html` |
| 703 | `features/coach/payment-management/payment-management.component.html` |
| 670 | `features/roster/roster.component.html` |
| 653 | `features/coach/calendar/calendar-coach.component.html` |
| 635 | `features/settings/privacy-controls/privacy-controls.component.html` |
| 610 | `features/cycle-tracking/cycle-tracking.component.html` |

---

## 3. Route map

### 3.1 Composition

[app.routes.ts](angular/src/app/app.routes.ts) delegates to [feature-routes.ts](angular/src/app/core/routes/feature-routes.ts) which spreads **12 route group files** plus a `**` not-found.

### 3.2 Route count per group

| Group | Routes | File |
|---|---:|---|
| team.routes | 35 | [team.routes.ts](angular/src/app/core/routes/groups/team.routes.ts) |
| training.routes | 30 | [training.routes.ts](angular/src/app/core/routes/groups/training.routes.ts) |
| wellness.routes | 15 | [wellness.routes.ts](angular/src/app/core/routes/groups/wellness.routes.ts) |
| public.routes | 12 | [public.routes.ts](angular/src/app/core/routes/groups/public.routes.ts) |
| profile.routes | 8 | [profile.routes.ts](angular/src/app/core/routes/groups/profile.routes.ts) |
| analytics.routes | 8 | [analytics.routes.ts](angular/src/app/core/routes/groups/analytics.routes.ts) |
| game.routes | 6 | [game.routes.ts](angular/src/app/core/routes/groups/game.routes.ts) |
| social.routes | 6 | [social.routes.ts](angular/src/app/core/routes/groups/social.routes.ts) |
| staff.routes | 6 | [staff.routes.ts](angular/src/app/core/routes/groups/staff.routes.ts) |
| dashboard.routes | 5 | [dashboard.routes.ts](angular/src/app/core/routes/groups/dashboard.routes.ts) |
| superadmin.routes | 4 | [superadmin.routes.ts](angular/src/app/core/routes/groups/superadmin.routes.ts) |
| help.routes | 2 | [help.routes.ts](angular/src/app/core/routes/groups/help.routes.ts) |
| **Total (excl. `**`)** | **137** | |

### 3.3 Public (unauthenticated) routes

`""`, `login`, `register`, `reset-password`, `update-password`, `verify-email`, `auth/callback`, `onboarding`, `accept-invitation`, `terms`, `privacy`, `privacy-policy`.

### 3.4 Routing features wired in `app.config.ts`

- `withComponentInputBinding()` — route params → component `@Input()`s.
- `withPreloading(AuthAwarePreloadStrategy)` — custom preload at [auth-aware-preload.strategy.ts](angular/src/app/core/strategies/auth-aware-preload.strategy.ts).
- `withViewTransitions({ skipInitialTransition: true })` — respects `prefers-reduced-motion`. ([app.config.ts:62-75](angular/src/app/app.config.ts:62))
- All routes are lazy via `loadComponent` / `loadChildren` (verified by grep of `loadComponent` count in groups).

### 3.5 HTTP interceptor chain

Registered in [app.config.ts:84-89](angular/src/app/app.config.ts:84): `authInterceptor → retryInterceptor → cacheInterceptor → errorInterceptor` over `withFetch()`.

---

## 4. Asset inventory

### 4.1 Totals

| Path | Size |
|---|---:|
| `src/assets/fonts/` | 1,052 KB |
| `src/assets/styles/` | 236 KB |
| `src/assets/icons/` | 68 KB |
| `src/assets/legal/` | 28 KB |
| `src/assets/images/` | 4 KB |

### 4.2 Fonts (Poppins, self-hosted)

5 weights × 2 formats = 10 files. Both `.ttf` and `.woff2` present for every weight:

| Weight | woff2 | ttf |
|---|---:|---:|
| Light | 51,384 B | 161,936 B |
| Regular | 51,556 B | 160,316 B |
| Medium | 50,952 B | 158,576 B |
| SemiBold | 51,432 B | 157,312 B |
| Bold | 50,940 B | 155,996 B |

Plus PrimeIcons fonts: `primeicons.woff` (85,056 B), `primeicons.woff2` (35,148 B) at `src/assets/styles/vendor/primeicons/fonts/`.

### 4.3 `index.html`

- Inline critical CSS (~100 lines) for FOUC prevention + app-root loading spinner. [index.html](angular/src/index.html)
- Preconnect + dns-prefetch to Supabase project URL (hardcoded host: `grfjmnjpzvknmsxrwesx.supabase.co`).
- PWA: `manifest.webmanifest` linked; iOS PWA meta tags present.
- Runtime env injected via `/assets/runtime-env.js`.
- `<noscript>` fallback present.
- Viewport: `width=device-width, initial-scale=1, maximum-scale=3, user-scalable=yes, viewport-fit=cover`.

### 4.4 Service worker

`custom-sw.js` wraps NGSW with an additional `flagfit-offline-queue` Background Sync handler. Registered with `registerWhenStable:30000`. [app.config.ts:178-183](angular/src/app/app.config.ts:178)

---

## 5. Third-party dependencies

### 5.1 Runtime (`dependencies`) — 25 packages

| Package | Declared | `from "<pkg>"` imports under `src/` |
|---|---|---:|
| @angular/animations | ~21.2.2 | 1 |
| @angular/aria | ~21.2.2 | **0** |
| @angular/cdk | ~21.2.2 | 3 |
| @angular/common | ~21.2.2 | (Angular core, not measured) |
| @angular/compiler | ~21.2.2 | (build-time) |
| @angular/core | ~21.2.2 | (Angular core, not measured) |
| @angular/forms | ~21.2.2 | 94 |
| @angular/platform-browser | ~21.2.2 | (bootstrap) |
| @angular/platform-server | ~21.2.2 | (SSR bootstrap) |
| @angular/router | ~21.2.2 | 154 |
| @angular/service-worker | ~21.2.2 | (registered in `app.config.ts`) |
| @angular/ssr | ~21.2.2 | (server.ts) |
| @primeuix/themes | ^2.0.3 | 2 |
| @standard-schema/spec | ^1.0.0 | (referenced from `core/schemas/`, not measured) |
| @supabase/supabase-js | ^2.99.1 | 15 |
| chart.js | ^4.5.1 | 5 |
| date-fns | ^4.1.0 | 3 |
| express | ^5.1.0 | (server.ts) |
| **html2canvas** | ^1.4.1 | **0** |
| **jspdf** | ^4.1.0 | **0** |
| primeicons | ^7.0.0 | 0 (font/CSS-only usage) |
| primeng | ^21.1.3 | 224 |
| rxjs | ~7.8.2 | 152 |
| tslib | ^2.8.1 | 0 (used implicitly via `importHelpers: true`) |
| **zone.js** | ^0.16.0 | **0** (zoneless is enabled in `app.config.ts:55`) |

### 5.2 Dev dependencies — 28 packages

Notable: `@playwright/test`, `@axe-core/playwright`, `vitest` + `@vitest/coverage-v8` + `@vitest/ui`, `@analogjs/vite-plugin-angular` + `@analogjs/vitest-angular`, `@storybook/angular` + a11y/docs addons (`@storybook/addon-a11y`, `@storybook/addon-docs`, `@storybook/addon-links`), `angular-eslint 21.3.0`, `eslint-plugin-storybook`, `typescript ^5.9.3`, `tsx`, `jsdom`.

### 5.3 Observations from declared-vs-imported

| Finding | Evidence |
|---|---|
| `html2canvas` and `jspdf` declared but **zero `import` sites** under `src/` | grep `from "html2canvas"` / `from "jspdf"` → 0 hits |
| `zone.js` declared but app is zoneless | `provideZonelessChangeDetection()` at [app.config.ts:55](angular/src/app/app.config.ts:55); `polyfills` in [angular.json](angular/angular.json) needs verification |
| `@angular/aria` declared but **zero `import` sites** | grep `from "@angular/aria"` → 0 hits |
| `primeicons` zero imports — used via CSS/font only | woff/woff2 present at `src/assets/styles/vendor/primeicons/fonts/` |
| `Sentry` referenced 6 times in code; **no `@sentry/*` package in deps** | comment in `app.config.ts:172` mentions "Sentry integration"; needs follow-up |

These are facts; whether they are problems is for Phase 2.

---

## 6. TypeScript configuration

[tsconfig.json](angular/tsconfig.json) compiler options:

- `strict: true`
- `noImplicitAny: true`
- `noImplicitOverride: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `target: ES2022`, `module: ES2022`, `moduleResolution: bundler`
- `importHelpers: true` (requires tslib)
- `isolatedModules: true`
- Path aliases: `@core/*`, `@shared/*`, `@features/*`, `@environments/*`, `@assets/*`
- Angular compiler: `strictInjectionParameters: true`, `strictInputAccessModifiers: true`, `strictTemplates: true`, `extendedDiagnostics.defaultCategory: "error"`

[tsconfig.app.json](angular/tsconfig.app.json) sets `files: ["src/main.ts"]` and `include: ["src/**/*.d.ts"]` — relies on Angular CLI to walk the dep graph from `main.ts`.

---

## 7. Tooling and scripts

`package.json` `scripts` notable entries:

- `prebuild`: `node scripts/patch-build-dependency-warnings.mjs && npm run check:ngmodel-cva`
- `build:analyze`: bundle size check via `scripts/check-bundle-size.js`
- `audit:a11y`: `npx tsx src/scripts/accessibility-audit.ts`
- `audit:primeng-bindings`: `node scripts/audit-primeng-bindings.js`
- `check:ngmodel-cva`: `node scripts/check-no-bidirectional-ngmodel.mjs`
- `lint:css`: stylelint via the root-level `../node_modules/stylelint` and `../stylelint.config.js` (the **root** stylelint config governs Angular SCSS)
- `e2e` projects (from `npm run` list): `smoke`, `onboarding`, `critical`, `navigation`, `design-system`, `visual-regression`, `visual-regression-mobile`, `visual-regression-tablet`

`npm run lint` scope: `src/app/**/*.{ts,html}`.

---

## 8. Git activity snapshot

- Commits on `main`: **734**
- Most-recently-touched feature dirs (2026-05-12): `training`, `today`, `roster`, `ai-coach`, `acwr-dashboard`
- Most-recently-touched layers (2026-05-12): `core/`, `features/`, `shared/`, `src/scss/`
- Theme layer `src/app/theme/` last touched **2026-04-03** (oldest in `app/`)
- Pages-style SCSS in `src/styles/` last touched 2026-04-03
- Quietest features (last commit ≤ 2026-04-21): `search`, `legal`, `landing`, `playbook`, `cycle-tracking`, `exercise-library`, `sleep-debt`, `reports`, `payments`, `game-tracker`, `team-calendar`, `travel`, `achievements`
- Recent commit subjects (top 5): `Move Today protocol handling to service & cleanup` · `Remove dead inject() calls in feature components (batch 3)` · `Remove dead inject() calls in feature components (batch 2)` · `Remove dead inject() calls across services and feature components` · `Wire phase detection + prescription to spine; remove dead DI`

---

## 9. Items deferred to Phase 2 (AUDIT)

The following measurements were intentionally **not** taken in Phase 1 — they are scored/evaluative and belong in `AUDIT.md`:

- `any` / `@ts-ignore` / non-null-assertion counts
- `!important` count, nesting depth, hardcoded color/spacing magic numbers vs. tokens
- Heading hierarchy and ARIA usage in templates
- Lighthouse mobile scores, bundle sizes, Core Web Vitals
- Dead CSS, dead exports, unreachable branches
- Specific Supabase query patterns (N+1, etc.)
- `innerHTML` / `bypassSecurityTrust*` / `eval` surfaces
- Loading-state, empty-state, error-state coverage per route

---

## 10. Things to confirm before Phase 2

Three questions whose answers shape the audit; none are blockers (I will note assumptions if you don't answer):

1. **Sentry**: Code references `Sentry` 6 times and `app.config.ts:172` claims "Sentry integration", but `@sentry/*` is **not in `dependencies`**. Is Sentry intentionally removed, lazy-loaded from a CDN, or broken? I'll flag as a defect by default.
2. **Onboarding redirect target**: 137 routes for a single mobile-first PWA is high. Are some of these admin/coach surfaces meant to be a separate app, or is one-app-per-role intentional?
3. **Brand colors / "Revolut-inspired dark"**: The current theme is built on PrimeNG presets ([flagfit-preset.ts](angular/src/app/theme/flagfit-preset.ts)) with a `.dark-theme` class selector. Is dark theme currently the **default**, or opt-in? `index.html` `<html class="ds-initial-render">` (no `dark-theme`), and `@media (prefers-color-scheme: dark)` is honored in the inline critical CSS — so today it appears to follow OS preference. Confirm desired default.

---

**End of DISCOVERY.md.** No edits made. Awaiting approval to begin Phase 2 (AUDIT).
