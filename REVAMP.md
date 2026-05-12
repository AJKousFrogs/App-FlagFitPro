# REVAMP.md — FlagFit Pro (Angular)

**Gate:** This document is read-only until you reply "go phase 4". No code is touched here.

**Execution contract:**
- One issue per branch (`refactor/<short-name>`)
- One atomic commit per fix (conventional commit format)
- `tsc --noEmit` + full Vitest suite + Playwright smoke must pass before opening PR
- PR description includes before/after metrics
- Your approval required before each next issue begins

---

## Issue 1 — Remove `jspdf` + `html2canvas`

**Problem.** Two packages are declared in `dependencies` with zero import sites and one is the source of the only **critical** `npm audit` vulnerability.

**Evidence.**
- `jspdf ^4.1.0` — 0 `from "jspdf"` imports under `src/`. `npm audit` reports `jspdf <=4.2.0 [critical]`. ([AUDIT.md §G.1](AUDIT.md))
- `html2canvas ^1.4.1` — 0 `from "html2canvas"` imports under `src/`.
- `zone.js ^0.16.0` — `polyfills: []` in [angular.json](angular/angular.json) confirms it is not shipped; removing from `dependencies` eliminates dead install weight.
- `@angular/aria ~21.2.2` — 0 import sites under `src/`.

**Proposed fix.**
```
npm uninstall jspdf html2canvas zone.js @angular/aria
```
Then verify: `npm audit` critical count drops to 0; `ng build` still passes budget.

**Effort.** S — 15 minutes.

**Risk.** Near-zero. If a future PDF-export feature is added, `jspdf` will be re-installed at that point (at a patched version). The only risk is if there is an indirect runtime load (e.g. a dynamic `import('jspdf')` string that grep missed). Mitigation: run `grep -r "jspdf\|html2canvas" src/` after removal to confirm zero references.

**Validation.**
1. `npm audit` — critical count = 0.
2. `ng build --configuration production` — 0 errors, budgets pass.
3. `npx tsc --noEmit` — 0 errors.
4. `vitest run` — 0 failures.
5. `playwright test e2e/smoke.spec.ts` — passes.

**Rollback.** `git revert <sha>` then `npm install`. No user-visible behavior changes.

---

## Issue 2 — Enforce `ariaLabel` required on `<app-icon-button>` + fix 3 native `<button>` violations

**Problem.** The `<app-icon-button>` component's JSDoc says "Enforces accessibility by requiring ariaLabel" but the `input()` signal is not `input.required<string>()`. A future developer can omit it and ship an empty accessible name with no compile error. Three native `<button>` elements are currently icon-only without an accessible name.

**Evidence.**
- [icon-button.component.ts](angular/src/app/shared/components/button/icon-button.component.ts) — `ariaLabel` is declared as an optional `input()`, not `input.required<string>()`. The template binds `[attr.aria-label]="ariaLabel()"` at lines 65 and 80.
- [video-feed.component.html:115](angular/src/app/features/training/video-feed/video-feed.component.html:115) — `<button class="overlay-btn bookmark-btn">` — no aria-label.
- [video-feed.component.html:129](angular/src/app/features/training/video-feed/video-feed.component.html:129) — `<button class="overlay-btn share-btn">` — no aria-label.
- [notifications-panel.component.html:52](angular/src/app/shared/components/notifications-panel/notifications-panel.component.html:52) — `<button class="clear-read-btn">` has `pTooltip` but tooltip ≠ accessible name.

**Proposed fix.**

Part A — make the input required (one line change):
```ts
// icon-button.component.ts — change:
ariaLabel = input<string>('');
// to:
ariaLabel = input.required<string>();
```
`strictTemplates: true` will then produce a compile error at every call site that omits it. Current compliance is 100% (0/67 invocations omit it), so there will be 0 new compile errors.

Part B — add `aria-label` to the 3 native `<button>` violations:
```html
<!-- video-feed.component.html:115 -->
<button class="overlay-btn bookmark-btn"
        [attr.aria-label]="isBookmarked(video) ? 'Remove bookmark' : 'Bookmark video'">

<!-- video-feed.component.html:129 -->
<button class="overlay-btn share-btn"
        aria-label="Share video"
        (click)="shareVideo($event, video)">

<!-- notifications-panel.component.html:52 -->
<button class="clear-read-btn"
        aria-label="Clear read notifications"
        pTooltip="Clear read notifications"
        (click)="clearAllRead()">
```

**Effort.** S — 30 minutes (including running axe-playwright after).

**Risk.** Low. `input.required<string>()` is a compile-time gate; if any future invocation forgets it, the build breaks (desired). The aria-label additions are additive — no visual change.

**Validation.**
1. `npx tsc --noEmit` — 0 errors (confirms no new call-site violations).
2. `npm run audit:a11y` — axe violation count for "Buttons must have discernible text" = 0.
3. `playwright test e2e/smoke.spec.ts` — passes.

**Rollback.** `git revert <sha>`.

---

## Issue 3 — Wire Sentry CDN or delete the service

**Problem.** `error-tracking.service.ts` is registered as the global `ErrorHandler` via `AngularGlobalErrorHandler` ([app.config.ts:175](angular/src/app/app.config.ts:175)) and contains correct Sentry wiring — but `window.Sentry` is never set because no Sentry script tag exists in `index.html`. Production crashes go unobserved.

**Evidence.**
- [error-tracking.service.ts:154-167](angular/src/app/core/services/error-tracking.service.ts:154) — probes `window.Sentry`; if absent, silently skips init.
- [index.html](angular/src/index.html) — no `<script src="…sentry…">` present.
- [netlify.toml](netlify.toml) — CSP already allows `https://cdn.jsdelivr.net` in `script-src` and `https://*.ingest.sentry.io` in `connect-src`. The plumbing for CDN-loaded Sentry is there.
- `@sentry/*` absent from `dependencies` — intent was CDN load.

**Decision you need to make (before Phase 4 begins):** Wire it (2A) or delete it (2B).

**Proposed fix 2A — Wire Sentry via CDN (recommended).**

Step 1: Add `VITE_SENTRY_DSN` to [`.env.local`](.env.local) and [`.env.example`](.env.example) (already in the comment at `error-tracking.service.ts:7`).

Step 2: Inject the DSN into `runtime-env.js` at deploy time via a Netlify build plugin or inline in `netlify.toml` (same pattern as `SUPABASE_URL`). The service already reads it from `window._env.VITE_SENTRY_DSN` ([error-tracking.service.ts:170-171](angular/src/app/core/services/error-tracking.service.ts:170)).

Step 3: Add to `index.html` `<head>` before `</head>`:
```html
<!-- Error monitoring — loaded only when VITE_ENABLE_SENTRY=true -->
<!-- The script is read from window._env at runtime; if absent, error-tracking.service.ts no-ops -->
<script
  src="https://cdn.jsdelivr.net/npm/@sentry/browser@8/build/bundle.min.js"
  crossorigin="anonymous"
  defer>
</script>
```

Step 4: Add integrity attribute once the exact version is pinned (SRI hash from jsdelivr.com/package/npm/@sentry/browser).

**Proposed fix 2B — Delete (if you don't want crash reporting).**

```
git rm src/app/core/services/error-tracking.service.ts
```
Then remove it from `AngularGlobalErrorHandler` and clean up the CSP `connect-src` sentry entries in [netlify.toml](netlify.toml). Also remove `cdn.jsdelivr.net` + `unpkg.com` + `cdnjs.cloudflare.com` from `script-src` unless another feature uses them (audit first).

**Effort.** S (2A: 1 hour including DSN env wiring) / S (2B: 30 minutes).

**Risk.** 2A: the CDN script adds ~90 KB to the initial parse on first load; `defer` mitigates this. SRI prevents supply-chain risk. 2B: no risk to app function; you lose production crash visibility permanently.

**Validation (2A).**
1. Deploy to Netlify preview. Open DevTools → Network. Confirm Sentry bundle loads.
2. Trigger a deliberate error: open browser console, run `window.dispatchEvent(new ErrorEvent('error', {error: new Error('test-sentry')}))`. Confirm event appears in Sentry dashboard.
3. `npm audit` — no new findings from Sentry dep (CDN, not npm dep).
4. Lighthouse → Performance — confirm score does not drop >2 points (defer prevents blocking).

**Rollback.** Remove the `<script>` tag from `index.html`. Zero app-behavior impact.

---

## Issue 4 — Bump Angular 21.2.x to 21.2.12

**Problem.** `@angular/platform-server 21.0.0-21.2.8` and `@angular-devkit/build-angular <=21.2.8` carry high-severity `npm audit` findings. Latest patch is 21.2.12 / 21.2.10.

**Evidence.**
- `npm outdated`: `@angular/core` current `21.2.4` → wanted `21.2.12`. `@angular-devkit/build-angular` current `21.2.2` → wanted `21.2.10`. (`npm outdated` run 2026-05-12)
- `npm audit` [high]: `@angular-devkit/build-angular <=21.2.8`, `@angular/build <=21.2.6`, `@angular/platform-server 21.0.0-21.2.8`.

**Proposed fix.**
```bash
npm install \
  @angular/animations@~21.2.12 \
  @angular/common@~21.2.12 \
  @angular/compiler@~21.2.12 \
  @angular/core@~21.2.12 \
  @angular/forms@~21.2.12 \
  @angular/platform-browser@~21.2.12 \
  @angular/platform-server@~21.2.12 \
  @angular/router@~21.2.12 \
  @angular/service-worker@~21.2.12 \
  @angular/ssr@~21.2.10 \
  @angular/cdk@~21.2.12 \
  @angular/aria@~21.2.12

npm install -D \
  @angular/build@~21.2.10 \
  @angular/cli@~21.2.10 \
  @angular/compiler-cli@~21.2.12 \
  @angular-devkit/build-angular@~21.2.10 \
  @angular/platform-browser-dynamic@~21.2.12

npm audit fix   # resolve remaining transitives
```
Then run `npm audit` — high findings from Angular packages should be gone.

**Effort.** S — 30 minutes (mostly CI wait time).

**Risk.** Low — this is a patch version bump within the same minor. Angular follows semver strictly for patches. No API changes. Risk is a regression in framework behavior, caught by the full test suite.

**Validation.**
1. `npx tsc --noEmit` — 0 errors.
2. `vitest run` — 0 failures.
3. `playwright test` (full suite) — 0 failures.
4. `npm audit` — 0 high/critical from Angular packages.
5. `ng build --configuration production` — passes budgets.

**Rollback.** `git revert <sha>`; `npm install` restores prior lock file.

---

## Issue 5 — Delete Poppins `.ttf` files + add font preload

**Problem.** Five Poppins `.ttf` files (~795 KB total) sit on disk but are **never referenced** in any CSS or `@font-face` declaration. `poppins.scss` already only declares woff2 sources with `font-display: swap`. They ship as static assets on every deploy, wasting Netlify bandwidth and CDN cache slots. Additionally, the two most-used font weights (Regular, Medium) are not preloaded, leaving FOIT/FOUT timing to browser default.

**Evidence.**
- [poppins.scss](angular/src/assets/fonts/poppins.scss) — all five `@font-face` blocks reference `.woff2` only; no `.ttf` source.
- `src/assets/fonts/` directory listing: `Poppins-Light.ttf` (161,936 B), `Poppins-Regular.ttf` (160,316 B), `Poppins-Medium.ttf` (158,576 B), `Poppins-SemiBold.ttf` (157,312 B), `Poppins-Bold.ttf` (155,996 B) — total **793,136 B** dead weight. ([DISCOVERY §4.2](DISCOVERY.md))
- [index.html](angular/src/index.html) — `grep 'preload'` returns only preconnect; no font preload links.

**Proposed fix.**

Part A — delete dead files:
```bash
git rm src/assets/fonts/Poppins-Light.ttf \
       src/assets/fonts/Poppins-Regular.ttf \
       src/assets/fonts/Poppins-Medium.ttf \
       src/assets/fonts/Poppins-SemiBold.ttf \
       src/assets/fonts/Poppins-Bold.ttf
```

Part B — add preload for the two critical-path weights (Regular and Medium used for body text and labels):
```html
<!-- index.html — add inside <head>, before the <style> block -->
<link
  rel="preload"
  href="/assets/fonts/Poppins-Regular.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
<link
  rel="preload"
  href="/assets/fonts/Poppins-Medium.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```
Preloading all 5 weights would waste bandwidth; Regular (body text) and Medium (headings/labels) cover the critical above-the-fold render.

**Effort.** S — 15 minutes.

**Risk.** Near-zero. TTF files are unreferenced in code. Preload links are additive; if the path is wrong, the font falls back to system font with no error. Confirm paths match [angular.json](angular/angular.json) `assets` configuration.

**Validation.**
1. `grep -r "\.ttf" src/` → 0 results.
2. `ng build --configuration production` — 0 errors. Confirm no asset errors in build output.
3. Lighthouse → Performance → "Ensure text remains visible during webfont load" — preloaded fonts should appear as "Passed" audits.
4. Network tab: confirm `Poppins-Regular.woff2` loads with `initiatorType: "link"` (preload) and not as late-discovered resource.

**Rollback.** `git revert <sha>`. TTF files restored to repo. Preload links removed.

---

## Issue 6 — Convert desktop-first media queries to mobile-first

**Problem.** 78 `max-width` media queries vs. 18 `min-width` queries mean the codebase writes desktop-base styles and overrides downward for mobile. The project brief is non-negotiably mobile-first (375×667 is the default test target).

**Evidence.**
- `grep -rE '@media[^{]*max-width' src --include='*.scss'` → 78 occurrences.
- `grep -rE '@media[^{]*min-width' src --include='*.scss'` → 18 occurrences.
- Top offending files by LOC (highest SCSS files after excluded global token/override files): [training feature SCSS](angular/src/app/features/training/) (9,851 lines, 46 SCSS files), [coach feature SCSS](angular/src/app/features/coach/) (6,803 lines, 19 SCSS files).
- [src/styles/](angular/src/styles/) — contains `_mobile-responsive.scss`, `_responsive-utilities.scss` — last touched 2026-04-03; these are the intended mixin home for responsive patterns.

**Proposed fix.**

This is the one issue that **cannot be a single atomic commit** — 78 files means 78 individual decisions. The execution plan is:

1. **Establish the breakpoint mixin contracts** (already in `_mixins.scss`; verify or add):
   ```scss
   // Mobile-first: base styles = mobile, then enhance upward
   @mixin tablet-up { @media (min-width: 768px) { @content; } }
   @mixin desktop-up { @media (min-width: 1024px) { @content; } }
   @mixin wide-up { @media (min-width: 1280px) { @content; } }
   ```
   (Replace any `max-width: 767px` overrides with `tablet-up` blocks for the enhanced version.)

2. **Start with global SCSS** (`src/styles/`, `src/scss/`) — 18 `max-width` references, no user-visible component risk.

3. **Feature order** (most-used, most-visible first): `today` → `training/schedule` → `dashboard` → `coach` → `staff` → remaining.

4. **Pattern per file:**
   - Identify the base styles (currently for desktop)
   - Move them inside a `@include desktop-up { }` wrapper
   - The mobile styles (currently in `max-width` overrides) become the base

5. **Each feature file is one atomic commit** on the same branch. PR merges when all features in one session are done.

**Effort.** L — 8–12 hours spread across 3–4 sessions. This is the largest single piece of work.

**Risk.** High for visual regression — every layout change touches mobile, tablet, desktop simultaneously. **Mitigation:** use the existing visual-regression Playwright projects (`.e2e:visual:mobile`, `.e2e:visual:tablet`) to generate before/after snapshots. Run `npm run e2e:visual:all:update` only after human review of each feature.

**Validation (per feature file batch).**
1. Manual smoke: open the affected route at 375px width, confirm layout is correct.
2. `npm run e2e:visual:mobile` — compare against stored snapshots. New snapshots accepted only after visual review.
3. `npm run e2e:visual:tablet` — same.
4. No max-width queries remaining in the changed files.

**Rollback.** Feature-branch; revert individual file commits cleanly. The branch is not merged until visual sign-off.

---

## Issue 7 — Route `exercise-library` YouTube URL through shared validator

**Problem.** One `bypassSecurityTrustResourceUrl` site in [exercise-library.component.ts:151](angular/src/app/features/exercise-library/exercise-library.component.ts:151) builds the YouTube embed URL inline instead of calling the shared `buildYouTubeEmbedUrl()` utility used by the other three identical sites. If `exercise.video_id` from the database contains unexpected characters, the embed URL is not validated before being trusted.

**Evidence.**
- [exercise-library.component.ts:148-152](angular/src/app/features/exercise-library/exercise-library.component.ts:148):
  ```ts
  const url = `https://www.youtube.com/embed/${exercise.video_id}?rel=0&modestbranding=1`;
  return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  ```
- [youtube-video.utils.ts:77-83](angular/src/app/shared/utils/youtube-video.utils.ts:77) — `buildYouTubeEmbedUrl(videoId)` builds the identical URL string but returns `null` for falsy input (defensive).
- Three compliant sites: [today-summary-header.component.ts:77](angular/src/app/features/today/components/today-summary-header.component.ts:77), [exercise-card.component.ts:311](angular/src/app/features/training/daily-protocol/components/exercise-card.component.ts:311).

**Proposed fix.**

```ts
// exercise-library.component.ts — replace lines 148-152:
videoEmbedUrl = computed((): SafeResourceUrl | null => {
  const exercise = this.selectedExercise();
  if (!exercise?.video_id) return null;
  const url = buildYouTubeEmbedUrl(exercise.video_id);
  if (!url) return null;
  return this.sanitizer.bypassSecurityTrustResourceUrl(url);
});
```

Add the import at the top of the file:
```ts
import { buildYouTubeEmbedUrl } from '@shared/utils/youtube-video.utils';
```

**Effort.** S — 10 minutes.

**Risk.** Near-zero. Functional output is identical (same URL template). The only change is that `null` is returned if `buildYouTubeEmbedUrl` returns `null` (it only does so for falsy `videoId`, which already had an early-return guard). No exercise with a valid video_id will be affected.

**Validation.**
1. `npx tsc --noEmit` — 0 errors.
2. Navigate to `/exercise-library`, select an exercise with a video — confirm embed renders.
3. Select an exercise without a video — confirm no error, no broken iframe.

**Rollback.** `git revert <sha>`.

---

## Issue 8 — Add "Auto" option to the Settings theme selector

**Problem.** `ThemeService` already supports `ThemeMode = "light" | "dark" | "auto"`, where "auto" follows the OS `prefers-color-scheme`. The header toggle already cycles through all three modes. But the **Settings page `themeOptions` array only exposes "Light" and "Dark"** — users cannot set "Auto" from Settings.

**Evidence.**
- [settings.component.ts:187-190](angular/src/app/features/settings/settings.component.ts:187):
  ```ts
  themeOptions = [
    { label: "Light", value: "light", icon: "pi pi-sun" },
    { label: "Dark", value: "dark", icon: "pi pi-moon" },
  ];
  ```
- [theme.service.ts:28](angular/src/app/core/services/theme.service.ts:28) — `ThemeMode = "light" | "dark" | "auto"` (already typed).
- [theme.service.ts:100-105](angular/src/app/core/services/theme.service.ts:100) — `cycleMode()` already handles all three.
- [header-actions.component.ts:44-53](angular/src/app/shared/components/header/header-actions.component.ts:44) — `themeIcon` computed only handles `dark` / not-dark; does not distinguish "auto" from "light".

**Proposed fix.**

Part A — `settings.component.ts`:
```ts
themeOptions = [
  { label: "Light",  value: "light", icon: "pi pi-sun" },
  { label: "Auto",   value: "auto",  icon: "pi pi-desktop" },
  { label: "Dark",   value: "dark",  icon: "pi pi-moon" },
];
```

Part B — `header-actions.component.ts` (optional UX polish, same commit):
```ts
readonly themeIcon = computed(() => {
  const mode = this.themeService.mode();
  if (mode === "dark") return "pi pi-moon";
  if (mode === "auto") return "pi pi-desktop";
  return "pi pi-sun";
});

readonly themeTooltip = computed(() => {
  const mode = this.themeService.mode();
  if (mode === "light") return "Switch to Auto mode";
  if (mode === "auto") return "Switch to Dark mode";
  return "Switch to Light mode";
});
```

**Effort.** S — 20 minutes.

**Risk.** Near-zero — ThemeService already handles "auto" mode correctly. The settings save path calls `this.themeService.setMode(theme)` which persists to localStorage + Supabase ([settings-save-settings.service.ts:67](angular/src/app/features/settings/services/settings-save-settings.service.ts:67)).

**Validation.**
1. Open Settings → Preferences → Theme. Confirm three options: Light, Auto, Dark.
2. Select "Auto". Close Settings. Confirm the app follows OS theme.
3. Toggle OS to dark mode. Confirm app switches.
4. Select "Dark" explicitly. Toggle OS to light. Confirm app stays dark (explicit wins).
5. Refresh page. Confirm selection persists.
6. `vitest run` — 0 failures.

**Rollback.** `git revert <sha>`.

---

## Issue 9 — Move `*.data.ts` files out of `core/services/`

**Problem.** Eight large data-dictionary files sit inside `core/services/`, a `providedIn: 'root'` injection scope. Services in root scope are instantiated at app startup and eagerly import their `.data.ts` dependencies, meaning all 5,000+ lines of flag-football domain knowledge are in the **initial bundle chunk**, not the lazy feature chunk where they're used.

**Evidence.**
- `core/services/` contains 8 `*.data.ts` files, four of which are >900 lines: [flag-football-performance-system.data.ts](angular/src/app/core/services/flag-football-performance-system.data.ts) (1,650), [flag-football-athlete-profile.data.ts](angular/src/app/core/services/flag-football-athlete-profile.data.ts) (1,424), [sprint-training-knowledge.data.ts](angular/src/app/core/services/sprint-training-knowledge.data.ts) (1,315), [flag-football-periodization.data.ts](angular/src/app/core/services/flag-football-periodization.data.ts) (928).
- Each is imported directly (static `import`) into its matching service, which is `providedIn: 'root'`.
- `flag-football-performance-system.data.ts` is additionally imported directly by [goal-based-planner.component.ts](angular/src/app/features/training/goal-based-planner.component.ts), which is inside the lazy `training` chunk — but the data file is still dragged into root scope via the service.

**Proposed fix.**

Phase 9A — **move files** (organizational, no functional change):
```
src/app/core/services/*.data.ts
→ src/app/core/data/*.data.ts
```
Update all import paths. Rename `car-travel.data.ts`, `flag-football-*.data.ts`, `sprint-training-knowledge.data.ts`, `training-plan-templates.data.ts`, `travel-recovery.data.ts`, `weather-cancellation.data.ts`.

Phase 9B — **lazy-load in services** that only need the data after a user action (not startup):
```ts
// flag-football-athlete-profile.service.ts — replace static import:
// import { ATHLETE_PROFILE_DATA } from '../data/flag-football-athlete-profile.data';
// with a method-level dynamic import:
private async loadProfileData() {
  const { ATHLETE_PROFILE_DATA } = await import('../data/flag-football-athlete-profile.data');
  return ATHLETE_PROFILE_DATA;
}
```
This defers the 1,424-line data dictionary to the first call site, keeping it out of the root chunk.

**Effort.** M — 3–4 hours (9A: 1 hour of mechanical path updates; 9B: 2–3 hours of async refactor per service, with test updates).

**Risk.** Medium for 9B — converting sync getters to async changes calling code. Each service call that currently reads data synchronously must become `async`/`await` or signal-based with `rxjs/toSignal`. **9A alone** (just moving files, keeping static imports) is low-risk and delivers organizational clarity without behavioral change.

**Recommendation:** Ship 9A in Phase 4. Defer 9B until after Lighthouse baseline confirms the initial bundle is actually over budget.

**Validation.**
1. `npx tsc --noEmit` — 0 errors (all import paths updated).
2. `vitest run` — 0 failures.
3. `ng build --configuration production` — budgets pass.
4. (9B only) `playwright test` — 0 failures; Lighthouse initial-bundle size decreases.

**Rollback.** `git revert <sha>`. Mechanical — no logic changes in 9A.

---

## Issue 10 — Heading hierarchy sweep + ESLint rule

**Problem.** 137 routes, 14 `<h1>` tags — most pages have no level-1 heading for screen readers and search engines. 239 `<h4>` elements vs. 163 `<h3>` elements suggests many `<h4>`s appear without a parent `<h3>` (invalid hierarchy). Developers likely pick heading levels for visual size, not semantic level.

**Evidence.**
- Template-wide counts: `<h1>` 14, `<h2>` 26, `<h3>` 163, `<h4>` 239. ([AUDIT.md §B](AUDIT.md))
- 137 routes: with only 14 `<h1>` tags, at most 14 routes have a page-level heading. The rest rely on visually styled `<div>` or PrimeNG card headers.
- [accessibility.spec.ts](angular/src/app/accessibility.spec.ts) — 21,526 bytes; axe rules may already catch heading order; confirm which rules are enabled.

**Proposed fix.**

Step 1 — **Audit-first commit**: run `npm run audit:a11y` with axe `heading-order` rule enabled and dump the per-route violation list to a file. This becomes the evidence backlog.

Step 2 — **Add `<h1>` to page-level components.** Convention:
```html
<!-- Pattern: page title as h1, visually styled via token, not hardcoded size -->
<h1 class="ds-page-title">{{ pageTitle }}</h1>
```
Add the `.ds-page-title` token to `design-system-tokens.scss` if it doesn't exist (maps to current visual heading style; no visual change).

Step 3 — **Fix orphan `<h4>` instances** — wherever a `<h4>` appears without a preceding `<h3>` in the same section, either promote it to `<h3>` or demote the parent to `<h3>`.

Step 4 — **ESLint template rule** (`angular-eslint/no-invalid-heading-level` or a custom rule):
```js
// angular-eslint already ships with template accessibility rules.
// Add to eslint.config.mjs under @angular-eslint/template:
'@angular-eslint/template/accessibility-elements-content': 'error',
```
And optionally add a custom rule that flags `<h4>` when no `<h3>` precedes it in the same template.

**Effort.** M — 4–6 hours. Most time is in Step 2 (touching ~120 page components).

**Risk.** Low for visual regression (headings are text-level elements; adding an `<h1>` doesn't change layout). Medium risk of test regression in tests that assert specific DOM structure. Run `vitest run` and `playwright test` after each batch.

**Validation.**
1. `npm run audit:a11y` — "Heading levels should only increase by one" violations = 0.
2. `npm run audit:a11y` — "Page must contain a level-one heading" violations = 0 on all scanned routes.
3. `npx tsc --noEmit` — 0 errors.
4. `vitest run` — 0 failures.

**Rollback.** The heading changes are purely additive. `git revert <sha>` per feature batch.

---

## Execution order (Gantt-style)

This respects the layered principle: **dependencies → structure → styling → interactions → tests**.

```
PHASE 4 EXECUTION SEQUENCE
══════════════════════════════════════════════════════════════

 LAYER 0 — DEPENDENCIES (no user-visible risk, highest ROI first)
 ┌─────────────────────────────────────────────────────────────┐
 │ Issue 1   Remove jspdf/html2canvas/zone.js/@angular/aria   │ S  15m
 │ Issue 4   Bump Angular 21.2.12                             │ S  30m
 │           └─ npm audit fix (transitives)                   │
 │ Issue 5   Delete Poppins TTF + add font preload            │ S  15m
 └─────────────────────────────────────────────────────────────┘
 ↓ APPROVAL GATE — run Lighthouse before/after baseline here

 LAYER 1 — SECURITY / OBSERVABILITY
 ┌─────────────────────────────────────────────────────────────┐
 │ Issue 3   Wire Sentry OR delete service (your decision)    │ S  30-60m
 │ Issue 7   exercise-library YouTube URL → shared validator  │ S  10m
 └─────────────────────────────────────────────────────────────┘
 ↓ APPROVAL GATE

 LAYER 2 — STRUCTURE + A11Y
 ┌─────────────────────────────────────────────────────────────┐
 │ Issue 2   icon-button input.required + 3 button aria fixes  │ S  30m
 │ Issue 10  Heading hierarchy sweep (batch by feature group)  │ M  4-6h
 └─────────────────────────────────────────────────────────────┘
 ↓ APPROVAL GATE — run full axe audit after Issue 10

 LAYER 3 — UX / FEATURE
 ┌─────────────────────────────────────────────────────────────┐
 │ Issue 8   "Auto" theme option in Settings                  │ S  20m
 └─────────────────────────────────────────────────────────────┘
 ↓ APPROVAL GATE

 LAYER 4 — ARCHITECTURE / SCSS (highest risk, last)
 ┌─────────────────────────────────────────────────────────────┐
 │ Issue 9A  Move *.data.ts to core/data/ (path rename only)  │ M  1h
 │ Issue 6   Mobile-first MQ conversion (one feature per PR)  │ L  8-12h
 └─────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════
TOTAL estimated effort: ~17–22 hours across 8–12 sessions
Issues 1–5 (Layers 0–1): can be done in one focused day
Issues 6, 9, 10: require 3–4 separate sessions
══════════════════════════════════════════════════════════════
```

### Before Phase 4 starts — Lighthouse baseline

Run once before touching any code:
```bash
ng build --configuration production
npx serve dist/flagfit-pro/browser -l 4200 &
npx lighthouse http://localhost:4200 --preset=perf --emulated-form-factor=mobile --output=json > lighthouse-baseline.json
```
Record Performance, A11y, Best-Practices, SEO scores. All subsequent PRs must not regress these scores.

---

**End of REVAMP.md.** Awaiting your "go phase 4" to begin execution, starting with Issue 1.
