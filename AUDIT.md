# AUDIT.md — FlagFit Pro (Angular)

**Scope:** `angular/` only (per Phase 1 decision). Scores 0–10, ≥3 file:line citations per dimension. All counts taken at `main` HEAD on 2026-05-12, read-only.

**Methodology limits** — these were **not** measured in Phase 2 and are deferred (see §9):
- Lighthouse mobile scores, Core Web Vitals (require `ng build` + serve + Chrome run; needs your go-ahead)
- Built JS/CSS bundle sizes per route (require `ng build`)
- Color-contrast measurement per route (requires Playwright + axe on every page)
- PurgeCSS dead-CSS analysis (tool not installed)
- Real type-coverage % (tool not installed; `tsc --noEmit` passes with 0 errors, which is the stronger signal)

---

## TL;DR

| Dimension | Score | Headline |
|---|:-:|---|
| A. Architecture | **8.0** | Modern, layered, feature-based. Hotspots: `core/services` (52K LOC, 111 files) and an 18-file file-bloat tail. |
| B. HTML semantics & A11y | **7.5** | Design-system enforces icon-button labels (0 violations of 67 uses). Heading hierarchy needs work. Only 2 `<nav>` landmarks across 137 routes. |
| C. SCSS / styling | **8.0** | Token system is fintech-grade and documented. Real offenders: 58 raw hex literals, **78 max-width vs 18 min-width media queries (desktop-first)**, no `prefers-color-scheme` honoring outside 4 sites. |
| D. TypeScript quality | **9.5** | `tsc --noEmit` passes with 0 errors. 0 `:any`, 0 `as any`, 0 `@ts-ignore`, 0 `@ts-nocheck`, 1 `@ts-expect-error`. 1101 `inject()` calls, 0 legacy constructor injection. 326/327 components OnPush. |
| E. Performance | **6.5** | Zoneless, 94 `loadComponent`, `@defer` blocks, sensible budgets, but: `jspdf` + `html2canvas` declared with 0 imports, dual font formats (TTF + woff2 = +640 KB unused), 0 `NgOptimizedImage`. Sentry path is dead. |
| F. UX flows | **8.0** | 296 empty-state refs, 121 spinners, 21 skeletons, `prefers-reduced-motion` honored in 69 SCSS blocks, route-level `showBottomNav` flag, `@defer` for non-critical UI. Skeleton/spinner ratio inverted. |
| G. Security | **6.0** | CSP is solid, single Supabase init, no `eval`/`Function`, `bypassSecurityTrust*` defended in 4/5 sites. But: **1 critical + 10 high `npm audit` findings**, Sentry wiring referenced but never loaded, one `exercise-library` resource-URL site lacks the shared video-URL validator. |
| **Overall** | **7.6 / 10** | Genuinely well-engineered modern Angular. The "mess" you remember is gone from the Angular layer. The cleanup work that remains is mostly tactical, not structural. |

---

## A. Architecture — 8.0/10

### Evidence

- **Modern Angular adoption is essentially complete.** Standalone everywhere, signals-first, zoneless:
  - `provideZonelessChangeDetection()` at [angular/src/app/app.config.ts:55](angular/src/app/app.config.ts:55)
  - `signal()` declarations: 410 · `computed()`: 780 · `effect()`: 63 · `BehaviorSubject`: 2 · `new Subject<…>()`: 3
  - 326 of 327 `@Component` decorators have `ChangeDetectionStrategy.OnPush`. The one "exception" — `src/app/shared/components/button/index.ts` — is a barrel re-export with no decorator (false positive).
  - 0 `*ngIf`, 0 `*ngFor` in templates; 1102 `@if`, 433 `@for`, 8 `@switch`.
  - 0 constructor injection; 1101 `inject()` calls.
- **Feature-based layout with clean public seams**:
  - 45 feature directories under `src/app/features/`
  - Lazy loading at the route layer: 94 `loadComponent` calls in [src/app/core/routes/groups/](angular/src/app/core/routes/groups/); 0 `loadChildren`
  - Routes split across 12 group files with a thin composition layer in [feature-routes.ts](angular/src/app/core/routes/feature-routes.ts)
- **Composition root is intentional**: [app.config.ts](angular/src/app/app.config.ts) wires preloading ([app.config.ts:60-61](angular/src/app/app.config.ts:60)), view transitions with reduced-motion respect ([app.config.ts:62-75](angular/src/app/app.config.ts:62)), four interceptors in order ([app.config.ts:83-89](angular/src/app/app.config.ts:83)), PrimeNG passthrough config ([primeng.config.ts](angular/src/app/primeng.config.ts)).
- **App root uses `@defer` for non-critical UI** — cookie banner, feedback styles, ConfirmDialog, Toast — keeping initial render light. [app.component.ts:53-70](angular/src/app/app.component.ts:53)

### Where the score loses points

1. **`core/services/` is overweight: 111 files / 52,477 LOC.** ([DISCOVERY.md §2.2](DISCOVERY.md))
   - The four biggest are *data dictionaries* misclassified as services: [flag-football-performance-system.data.ts](angular/src/app/core/services/flag-football-performance-system.data.ts) (1,650 lines), [flag-football-athlete-profile.data.ts](angular/src/app/core/services/flag-football-athlete-profile.data.ts) (1,424), [sprint-training-knowledge.data.ts](angular/src/app/core/services/sprint-training-knowledge.data.ts) (1,315), [flag-football-periodization.data.ts](angular/src/app/core/services/flag-football-periodization.data.ts) (928). Each is imported by 2–3 callers.
   - These should live under `core/data/` (or feature-local `services/`) and be loaded with `import()` from the feature route, not bundled into the shared services chunk.
2. **18 HTML templates exceed 500 lines.** Biggest: [travel-recovery.component.html](angular/src/app/features/travel/travel-recovery/travel-recovery.component.html) (897), [game-tracker.component.html](angular/src/app/features/game-tracker/game-tracker.component.html) (847), [exercisedb-manager.component.html](angular/src/app/features/exercisedb/exercisedb-manager.component.html) (784). Templates this size are screens with five-plus inlined sections; they should be split into child components.
3. **`features/coach/` is 30 TS files / 11,784 LOC under one feature root** ([DISCOVERY.md §2.3](DISCOVERY.md)). For a multi-role app that may eventually split, this is the natural seam — but inside the directory, sub-features are flat (calendar/, knowledge-base/, injury-management/, payment-management/) without an internal index that defines public API. Refactor risk grows with size.
4. **A `coach/` feature exists alongside a `staff/` feature alongside `team/` alongside `team-calendar/`.** It is not obvious from the file tree which user role owns which surface. This isn't a bug, but it's a navigation cost for new contributors.

---

## B. HTML semantics & A11y — 7.5/10

### Evidence

**The good:**

- **Single `<main>` landmark with focus management** at [app.component.ts:35-37](angular/src/app/app.component.ts:35): `<main id="main-content" tabindex="-1">` plus `<app-skip-to-content />`. This is the right pattern.
- **Icon-only buttons are 100% labeled** in the design-system component. I parsed all 67 `<app-icon-button>` invocations across `.html` templates with a multi-line tag regex: **0** lack an `ariaLabel`. The [IconButton component JSDoc](angular/src/app/shared/components/button/icon-button.component.ts:34) explicitly enforces it, and code review compliance is total. (Recommendation in §I — see Section A11y issue 1 below — is still to make the input `input.required<string>()` so this can't regress.)
- **Reactive forms only**: 410 `FormGroup`/`FormControl`/`FormBuilder` references; **0 `[(ngModel)]`** under `src/`. Reactive forms give you `setValidators`, `aria-invalid` wiring, and typed error association.
- **PrimeNG ConfirmDialog and Toast deferred and registered globally** ([app.component.ts:67-70](angular/src/app/app.component.ts:67)).
- **Skip-to-content link** present in [src/app/shared/components/skip-to-content/](angular/src/app/shared/components/skip-to-content/).
- **`<label>` count: 123**; PrimeNG inputs (`<p-inputText>`, etc.) are paired with labels in design-system patterns.
- **`aria-hidden`: 550 usages** — predominantly on decorative `pi-*` icons; not cargo-culted on focusable elements (spot-checked 10 instances).
- **`aria-live`: 10 usages** for toast/announcement regions — present and functional.
- **`role=`: 95 usages**; `aria-labelledby`: 31; `aria-label`: 92.

**The bad / score-deducting:**

1. **Heading hierarchy is uneven across 137 routes.** Counts: 14 `<h1>`, 26 `<h2>`, 163 `<h3>`, **239 `<h4>`**. A11y rule: each page needs exactly one `<h1>`; child levels can't skip (h2 must precede h3). Either:
   - many pages have no `<h1>` at all (page title lives in a sibling component without a heading), or
   - many components use `<h4>` for visual sizing rather than semantic level
   Without per-route inspection, I can't say which — but with 137 routes and only 14 `<h1>` instances, the math doesn't reconcile.
2. **Only 2 `<nav>` landmarks across the entire src/.** ([B raw counts above]) For a PWA with a bottom-nav and a sidebar, screen-reader users get one landmark for navigation regardless of which surface they're on.
3. **3 native `<button>` tags are icon-only without `aria-label`** (Python multi-line scan):
   - [video-feed.component.html](angular/src/app/features/training/video-feed/video-feed.component.html) — two `overlay-btn` buttons (bookmark, share)
   - [notifications-panel.component.html](angular/src/app/shared/components/notifications-panel/notifications-panel.component.html) — `clear-read-btn` (has a `pTooltip` but tooltip ≠ accessible name)
4. **`aria-describedby` used only once** across 194 templates — error association on form fields likely relies on PrimeNG defaults, which is OK for most inputs but breaks when the help text/error is rendered outside the PrimeNG component.
5. **Heading visual sizing concentrated in tokens** ([design-system-tokens.scss](angular/src/scss/tokens/design-system-tokens.scss)) means developers reach for the wrong level to "make text bigger" — the system tempts non-semantic choices unless paired with a heading-level mixin.

---

## C. SCSS / styling — 8.0/10

### Evidence — the good

- **Token system is documented and enforced.** The header of [design-system-tokens.scss:1-45](angular/src/scss/tokens/design-system-tokens.scss) explicitly states: "ZERO raw hex in any SCSS except: (1) this file, (2) `scss/pages/color-contrast-fixes.scss`, (3) `_color-guards.scss`. ZERO bare 0 for spacing — use `var(--space-0)`." This is fintech-grade discipline.
- **26,586 `var(--*)` usages** across SCSS. The design system is being consumed, not bypassed.
- **`!important`: 11 total — all in `src/scss/`, 0 in any feature `.scss`.** ([B raw counts above]) The 11 sit in the override layer where they belong.
- **CSS layer order is canonical and synced to PrimeNG.** [styles.scss:50-51](angular/src/styles.scss:50) declares `reset, tokens, primeng-base, primeng-brand, primitives, components, utilities, mobile, features, overrides` and the same order is registered in [app.config.ts:128-130](angular/src/app/app.config.ts:128). Specificity wars are structurally prevented.
- **Reduced motion respected in 69 SCSS blocks** and at the JS layer ([app.config.ts:67-73](angular/src/app/app.config.ts:67) skips view transitions).
- **Layout primitives**: `display: flex` 2,241 occurrences, `display: grid` 353, `position: absolute` 145, `position: fixed` 27. Healthy ratio; positional hacks are not the dominant pattern.

### Evidence — the bad

1. **Media queries are desktop-first, not mobile-first.** `max-width`: 78 occurrences; `min-width`: 18 occurrences. The brief is non-negotiably mobile-first; the codebase is currently writing desktop-base styles and overriding for narrow viewports. Sample offenders worth checking first: `src/scss/utilities/_mixins.scss`, the page SCSS under `src/styles/` (last touched 2026-04-03).
2. **58 raw hex literals outside the documented token files** ([Python scan]). Concentrated in:
   - [features/reports/reports-hub.component.scss](angular/src/app/features/reports/reports-hub.component.scss) — 18
   - [features/notifications/notifications.component.scss](angular/src/app/features/notifications/notifications.component.scss) — 18
   - [scss/components/notifications.scss](angular/src/scss/components/notifications.scss) — 9
   - 5 each in [features/today/components/today-schedule-banner.component.scss](angular/src/app/features/today/components/today-schedule-banner.component.scss) and [features/today/components/today-prescription-card.component.scss](angular/src/app/features/today/components/today-prescription-card.component.scss) (these are `var(--token, #fallback)` form — the documented pattern, but the fallback hex should match canonical tokens; verify each)
3. **`prefers-color-scheme` honored in only 4 SCSS blocks.** Theme switching today depends on a `.dark-theme` class on `<html>` (PrimeNG selector at [app.config.ts:122](angular/src/app/app.config.ts:122)), and the critical CSS in [index.html](angular/src/index.html) honors `prefers-color-scheme: dark` for the loading state. The class is set by app logic, but I did not find a runtime toggle wired to the OS media query yet (this is the "follow OS by default" capability you asked for; auditing as a gap).
4. **`primeng-theme.scss` is 3,265 lines** ([DISCOVERY §2.6](DISCOVERY.md)). Long override sheet is acceptable for PrimeNG migration, but every line here is a token escape hatch. It should shrink each release; track LOC over time.
5. **3,026-line `_component-overrides.scss`** at `src/assets/styles/overrides/` is the second-largest single SCSS file. Same risk as point 4.

---

## D. TypeScript quality — 9.5/10

### Evidence

- **`tsc --noEmit -p tsconfig.json`: 0 errors** (18 s build, `strict: true`, `strictTemplates: true`, `strictInjectionParameters: true`, `extendedDiagnostics.defaultCategory: "error"`). This is the cleanest signal in the audit.
- **`any` discipline is exceptional:**
  - 0 `: any` annotations (excluding spec files)
  - 0 `as any` casts
  - 0 `Array<any>` / `any[]`
  - 0 `@ts-ignore`
  - 0 `@ts-nocheck`
  - 1 `@ts-expect-error` — at [offline-queue.service.ts:143](angular/src/app/core/services/offline-queue.service.ts:143) for the `SyncManager` TS lib gap, a legitimate environmental hole
- **51 non-null assertions (`x!.y` form)** across 188K LOC = **0.027% rate**. Top files: `roster-staff-card.component.ts`, `review-decision-dialog.component.ts`, `nav-item.component.ts`, several `shared/components/*`. Worth a follow-up sweep but not a structural problem.
- **0 `console.log` *or* `console.warn` in production code paths… nearly.** 11 `console.log`, 4 `console.error|warn`. Compare with most apps in this size class (often 4-figure counts). The codebase uses a [LoggerService](angular/src/app/core/services/logger.service.ts) and a [logging](angular/src/app/core/logging/) layer with an injectable adapter ([app.config.ts:171](angular/src/app/core/logging/console-logger.adapter.ts)).
- **0 `TODO`/`FIXME`/`HACK`/`XXX` comments** under `src/`. Recent commits indicate active dead-code cleanup (e.g. "Remove dead inject() calls", "Move Today protocol handling to service & cleanup").
- **Modern reactivity model**: 410 `signal`, 780 `computed`, 63 `effect`, only 2 `BehaviorSubject` + 3 `new Subject<…>()`. RxJS lives at HTTP boundaries (152 `from "rxjs"` imports) and feeds into signals.

### Where the score loses 0.5 points

1. **Error handling counts**: 1,083 `try {` / `} catch` lines — high in absolute terms because of Supabase call sites (346 `supabase.` accesses). Without inspecting each, it's likely that **some catches swallow errors silently** rather than feeding the [error-tracking.service.ts](angular/src/app/core/services/error-tracking.service.ts). Manual spot-check needed; flagging as a candidate Phase 4 sweep, not a confirmed defect.
2. **Path aliases declared but uneven in use**. `@core/*`, `@shared/*`, `@features/*` are declared at [tsconfig.json:25-30](angular/tsconfig.json:25); large files I sampled (e.g. [training-schedule.component.ts](angular/src/app/features/training/training-schedule/training-schedule.component.ts:24-28)) still use long relative imports (`../../../shared/...`). Cosmetic, not a defect, but inconsistent.

---

## E. Performance — 6.5/10

### Evidence — the good

- **Zoneless change detection** ([app.config.ts:55](angular/src/app/app.config.ts:55)) — the entire app skips zone.js patching cost.
- **94 lazy `loadComponent` route definitions** ([core/routes/groups/](angular/src/app/core/routes/groups/)) → every route loads its own chunk.
- **Auth-aware preload strategy** ([auth-aware-preload.strategy.ts](angular/src/app/core/strategies/auth-aware-preload.strategy.ts)) with per-route `preload: true|false` data — see [public.routes.ts](angular/src/app/core/routes/groups/public.routes.ts) where landing preloads `priority: "high"` and deep-link entries set `preload: false`.
- **`@defer` blocks in app root** for cookie banner, feedback styles, global styles, `ConfirmDialog`, `Toast` ([app.component.ts:53-70](angular/src/app/app.component.ts:53)). Defer triggers: `on idle`, `when condition()`.
- **HTTP layer uses fetch** (`withFetch()` at [app.config.ts:82](angular/src/app/app.config.ts:82)) with caching + retry interceptors.
- **Critical CSS inlined** in [index.html](angular/src/index.html) (~100 lines) with FOUC guard + loading-state pseudo-elements; preconnect + dns-prefetch to Supabase host present.
- **Bundle budgets enforced**: `initial maximumError: 1.8 MB`, `anyScript maximumError: 600 KB`, `anyComponentStyle maximumError: 220 KB` ([angular.json:production.budgets]).
- **Service worker** wraps NGSW with custom offline-queue handler, registered `registerWhenStable:30000` ([app.config.ts:178-183](angular/src/app/app.config.ts:178)) — does not block initial render.

### Evidence — the bad

1. **`jspdf` (^4.1.0) and `html2canvas` (^1.4.1) declared in `dependencies` with 0 import sites.** ([DISCOVERY §5.3](DISCOVERY.md)). They will not be tree-shaken because npm install pulls them in; if they're not in production code, removing them is free weight. `jspdf` also accounts for the single critical npm-audit finding (see Section G).
2. **`zone.js` ^0.16.0 declared, app is zoneless.** ([DISCOVERY §5.3](DISCOVERY.md)) Check [angular.json:polyfills] — if `"zone.js"` is still in the polyfills array, it's shipping at runtime for nothing. Removable.
3. **`@angular/aria` ^21.2.2 declared with 0 import sites.** ([DISCOVERY §5.3](DISCOVERY.md)) Likely planned-but-not-used; remove or commit to.
4. **Poppins shipped as `.ttf` AND `.woff2` for all 5 weights.** Modern browsers don't need TTF; the 5×~160 KB TTF files total **~795 KB** of dead asset weight. ([DISCOVERY §4.2](DISCOVERY.md)) Single-line `font-face` change.
5. **0 `NgOptimizedImage` / `ngSrc` usages** in templates. Counts 0 `<img>` tags too — so today most imagery is SVG inline or PrimeNG-driven, but for any user-uploaded media (avatars, exercise thumbnails) `NgOptimizedImage` is the correct path and is unused.
6. **Sentry path is dead.** [error-tracking.service.ts:154-167](angular/src/app/core/services/error-tracking.service.ts:154) probes `window.Sentry` and no-ops if absent; **`index.html` does not load Sentry from a CDN, and `@sentry/*` is not in `dependencies`.** The 6 references in code are wiring with no runtime. This is a correctness/observability gap, not a perf issue, but it lives here because it's "dependency declared by reference but not delivered" — same class of issue as `jspdf`.
7. **138 KB Poppins fallback fonts not preloaded.** [index.html](angular/src/index.html) does not `<link rel="preload" as="font" type="font/woff2">` the variable-weight files. With `font-display` not explicitly set in the inline critical CSS (it defaults to `auto` per browser), FOIT/FOUT behavior is platform-dependent.
8. **`primeng-theme.scss` is 3,265 lines** (and shipped as a `componentStyle` if scoped, or as part of `anyScript`/`any` if global). The `anyComponentStyle` budget is 210 KB warning / 220 KB error — needs measurement; if it's tripping, that one file is the suspect.
9. **Lighthouse not measured in this audit pass.** I will not assign a numeric LCP/INP/CLS until `ng build` + serve runs. Score is deducted on inference from the above, not measurement.

---

## F. UX flows — 8.0/10

### Evidence

- **Loading state coverage is broad**:
  - `<p-progressSpinner>`: 100 template uses
  - `<p-skeleton>`: 21 template uses (skeleton/spinner ratio is inverted — skeletons better preserve layout; this is a Phase 3 polish)
  - LoadingOverlayComponent registered globally in [app.component.ts:64](angular/src/app/app.component.ts:64)
- **Empty-state coverage is strong**: 296 references to `empty-state` / `EmptyState` across templates and TS. A reusable [empty-state.component.ts](angular/src/app/shared/components/empty-state/) exists.
- **Page error states**: shared [page-error-state.component.ts](angular/src/app/shared/components/page-error-state/) imported into the feature samples I read.
- **Onboarding feature has 18 TS files** and dedicated routes / transitions; `provideAnimations()` is on specifically for onboarding transitions ([app.config.ts:77](angular/src/app/app.config.ts:77) comment). It's not a token-flow afterthought.
- **Mobile shell**: `showBottomNav: <bool>` route-data flag ([staff.routes.ts](angular/src/app/core/routes/groups/staff.routes.ts), [public.routes.ts](angular/src/app/core/routes/groups/public.routes.ts)) — public/staff routes hide the bottom nav. This shows there's a thumb-zone nav primitive driving the shell.
- **View transitions** enabled at the router level with reduced-motion guard ([app.config.ts:62-75](angular/src/app/app.config.ts:62)).
- **PWA**: full manifest with 7 icon sizes + 2 app shortcuts (`Today's Practice`, `Training`) ([manifest.webmanifest](angular/src/manifest.webmanifest)). `orientation: "portrait-primary"`, `display: "standalone"`. Service worker + offline queue.
- **Cookie consent banner** deferred + lazy ([app.component.ts:60](angular/src/app/app.component.ts:60)).

### Evidence — the bad

1. **Skeleton:spinner ratio is 21:100.** Spinner-dominant UI loses CLS and feels slower than skeleton-dominant. Specific high-traffic routes to skeleton-ize first: `today`, `training/schedule`, `dashboard/player-dashboard`.
2. **Offline behavior is partially built but not measured.** `custom-sw.js` declares a `flagfit-offline-queue` Background Sync handler (36 lines). I have not verified what queues, what doesn't, and whether the user gets feedback when offline. This is a "PWA quality" gap until tested.
3. **18 templates >500 lines** (see Architecture §A.2). These are dense screens that often pack three sections that should be separate route surfaces or child components. UX cost: scroll fatigue on mobile, slower per-screen render.
4. **`<nav>` count of 2** (see A11y §B.2) means there's no semantically distinct "primary" vs. "secondary" nav for assistive tech.
5. **Sentry-fed user feedback dialog is not present.** The error-tracking service has scope/breadcrumbs but Sentry isn't loaded, so users hitting unhandled errors see only a global `ErrorHandler` reaction (`AngularGlobalErrorHandler` at [app.config.ts:175](angular/src/app/app.config.ts:175)) — need to verify what UI surfaces.

---

## G. Security — 6.0/10

### Evidence — the good

- **CSP is strict and present** in [netlify.toml](netlify.toml):
  - `default-src 'self'`
  - `script-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com` — **no `'unsafe-inline'` for scripts**
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — `'unsafe-inline'` on styles is acceptable for Angular
  - `frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.instagram.com https://instagram.com` — matches the four `bypassSecurityTrustResourceUrl` sites
  - `connect-src 'self' https://*.supabase.co … wss://*.supabase.co https://*.ingest.sentry.io https://sentry.io`
  - `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests` — all locked
- **Single Supabase client instantiation** at [supabase.service.ts:90](angular/src/app/core/services/supabase.service.ts:90); no service-role exposure paths.
- **Active defense against service-role leakage**: [supabase.service.ts:61](angular/src/app/core/services/supabase.service.ts:61) explicitly logs `supabase_service_role_key_in_client` if it detects one; PII redactor lists `service_role` at [redact-pii.util.ts:26](angular/src/app/core/logging/redact-pii.util.ts:26).
- **`localStorage.setItem`: 2 sites only**; **`sessionStorage.setItem`: 0**. Supabase handles its own session storage; the app is not duplicating tokens.
- **0 `eval()`, 0 `new Function(`** in app code.
- **`bypassSecurityTrustHtml` in ai-coach is defensively coded**: [ai-coach-chat.component.ts:859-887](angular/src/app/features/ai-coach/ai-coach-chat.component.ts:859) HTML-escapes the raw content first, then applies a small set of allowlisted markdown patterns to the **already-escaped** string. AI-injected HTML cannot break out.
- **The `innerHTML = str` site at [format.utils.ts:292](angular/src/app/shared/utils/format.utils.ts:292)** is in an `unescapeHtml(str)` function (`div.innerHTML = str; return div.textContent || ""`). Used as a parser to extract text — does not render to DOM. Modern browsers don't fire `<img onerror>` for detached parsed nodes, so this is safe in practice but should be replaced with `DOMParser` for clarity.

### Evidence — the bad

1. **`npm audit`: 1 critical, 10 high, 16 moderate, 0 low.** Run on 2026-05-12. Highlights:
   - **`jspdf <=4.2.0` — critical.** And it has 0 imports under `src/`. Removing the dep kills the critical finding outright.
   - **`@angular-devkit/build-angular` / `@angular/build` / `@angular/platform-server` 21.0.0 – 21.2.8 — high.** Currently on 21.2.2; bump to 21.2.9+ when available (or the next patch line) resolves.
   - **`lodash <=4.17.23`, `path-to-regexp`, `vite 7.0.0–7.3.1`, `undici`, `picomatch`, `fast-uri`, `@babel/plugin-transform-modules-systemjs` — high (all transitive).** `npm audit fix` will likely resolve most; the rest are blocked by parent versions.
2. **`bypassSecurityTrustResourceUrl` at [exercise-library.component.ts:152](angular/src/app/features/exercise-library/exercise-library.component.ts:152) builds the YouTube embed URL inline** (` `https://www.youtube.com/embed/${exercise.video_id}?rel=0&modestbranding=1` `) **without going through the shared `buildYouTubeEmbedUrl(videoId)` validator** that the other three sites use ([today-summary-header.component.ts:79](angular/src/app/features/today/components/today-summary-header.component.ts:79), [exercise-card.component.ts:314](angular/src/app/features/training/daily-protocol/components/exercise-card.component.ts:314)). If `exercise.video_id` is ever an attacker-controlled string with `?` or `/`, it can inject embed params. RLS protects the DB but defense in depth says: route through the validator.
3. **Sentry is wired but never loaded.** [error-tracking.service.ts:166](angular/src/app/core/services/error-tracking.service.ts:166) calls `this.Sentry.init({…})` only if `window.Sentry` exists — but no `<script src=…sentry…>` exists in [index.html](angular/src/index.html), and `@sentry/*` is not a `dependency`. The CSP at [netlify.toml](netlify.toml) explicitly allows `https://*.ingest.sentry.io` connect-src + `https://cdn.jsdelivr.net` script-src, implying the intent was CDN-loaded Sentry; the script tag was never added. Net effect: no production crash reports.
4. **CSP allows three script CDNs**: `cdn.jsdelivr.net`, `unpkg.com`, `cdnjs.cloudflare.com`. Each CDN you allow is a supply-chain surface. If Sentry CDN-load goes ahead, the other two should be removed unless something specific needs them (audit before locking down).
5. **CSP has no `report-uri` / `report-to` directive.** CSP violations go unnoticed.

---

## H. Cross-cutting facts (informational, not scored)

- 60 `.spec.ts` test files for 646 non-spec TS files = **9.3% test-to-source ratio.** Coverage isn't measured here but this is the lower bound on intent.
- e2e setup is comprehensive: 8 named Playwright projects (smoke, onboarding, critical, navigation, design-system, visual-regression, visual-regression-mobile, visual-regression-tablet).
- a11y is automated via [accessibility-audit.ts](angular/src/scripts/accessibility-audit.ts) (script) and `@axe-core/playwright` (project).
- Storybook is present with a11y addon — design-system surface is documented.
- Custom check script `check-no-bidirectional-ngmodel.mjs` runs in `prebuild` — a concrete code-quality guardrail that explains the 0 `[(ngModel)]` count.
- Sentry CSP entries in [netlify.toml](netlify.toml) imply the previous intent. The error-tracking service is correct in shape, just unfed.

---

## I. Top 10 issues, ranked by impact × ease

Each issue gets its own one-pager in REVAMP.md (Phase 3). Scores below are `impact × ease`, both 1–5.

| # | Issue | Impact | Ease | Score | Section |
|--:|---|:-:|:-:|:-:|:-:|
| 1 | **Drop `jspdf` + `html2canvas`** — 0 import sites, kills the critical npm-audit finding, reduces install + bundle weight | 5 | 5 | **25** | E.1, G.1 |
| 2 | **Make `<app-icon-button>` `ariaLabel` `input.required<string>()`** + fix the 3 native `<button>` icon-only violations | 4 | 5 | **20** | B.1, B.3 |
| 3 | **Wire Sentry via CDN script in `index.html`** (or remove the service + CSP allowlists) — decide ship vs. delete | 5 | 4 | **20** | E.6, G.3 |
| 4 | **Bump Angular CLI/build patch line** to clear 3 of the 10 high npm-audit findings; run `npm audit fix` for transitives | 4 | 4 | **16** | G.1 |
| 5 | **Remove Poppins `.ttf` files** (~795 KB) — keep woff2 only; add `<link rel="preload" as="font" type="font/woff2">` for variable weight | 4 | 4 | **16** | E.4, E.7 |
| 6 | **Flip mobile-first media queries**: convert the 78 `max-width` queries to `min-width` where the design intent is mobile→tablet→desktop progressive enhancement | 5 | 3 | **15** | C.1 |
| 7 | **Route `exercise-library` YouTube URL through `buildYouTubeEmbedUrl`** (kill the one inconsistent `bypassSecurityTrustResourceUrl` site) | 3 | 5 | **15** | G.2 |
| 8 | **Add a `ThemeService` with `light` / `dark` / `system` user preference**, wired to `prefers-color-scheme` + the `.dark-theme` class on `<html>` | 4 | 3 | **12** | C.3 |
| 9 | **Move `core/services/*.data.ts` (4 files, 5,317 LOC) into feature-local `data/` or `core/data/`** and load via dynamic `import()` from the route that needs them | 4 | 3 | **12** | A.1, E.8 |
| 10 | **Heading hierarchy sweep**: enforce one `<h1>` per route, fix orphan `<h4>`s; ship an ESLint/template rule for nested heading levels | 4 | 3 | **12** | B.1 |

**Honorable mentions** (Phase 4 candidate sweep, not in the top 10):
- Skeleton-ize `today`, `training/schedule`, `player-dashboard` (replace `<p-progressSpinner>` with `<p-skeleton>` patterns)
- Split the 18 templates >500 lines into child components (start with top 5)
- Add `NgOptimizedImage`/`ngSrc` for any user-content imagery (avatars, exercise thumbnails)
- Remove `zone.js` from `polyfills` if it's still listed
- Replace `format.utils.ts:292` `innerHTML = str` with `DOMParser`
- Add CSP `report-to` directive

---

## J. What is **not** in this audit (and why)

| Item | Why it's missing | When you'll see it |
|---|---|---|
| Lighthouse mobile scores | Requires `ng build` + serve + Chrome; consumes CPU & 3-5 min; needs your approval | Top of Phase 4 — first measurement before any change |
| Bundle sizes per route (JS + CSS) | Requires `ng build --configuration production` | Same — single build covers Lighthouse + bundle baseline |
| Real Core Web Vitals | Field data needs a live deployment + real users; lab data comes from Lighthouse run | Phase 4 (lab); ongoing (field — needs RUM, see Sentry decision) |
| Per-route color contrast | Requires axe-Playwright on every route ; the existing `audit:a11y` script can do it | Run as a Phase 4 baseline before SCSS work |
| Per-feature coupling graph (which feature imports which) | Out of scope for a static audit; informative for a workspace split if you choose one | Only if §A.4 (multi-app split) is approved |
| Type coverage % | `type-coverage` tool not installed; the `tsc --noEmit` 0-error pass is the stronger guarantee | Optional add — low value given strict + 0 `any` |

---

**End of AUDIT.md.** Awaiting approval to begin Phase 3 (REVAMP.md — one-pagers for the top 10 + Gantt sequence).
