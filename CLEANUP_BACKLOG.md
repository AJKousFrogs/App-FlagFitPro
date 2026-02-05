# Cleanup Backlog (FlagFit Pro)

Notes:
- Items are prioritized by impact vs effort, highest impact/lowest effort first.
- Each item includes scope and verification steps; some require discovery to confirm usage.

## Top 20 (Prioritized)

1. Consolidate remaining inline endpoints in `server.js` into modular route files.
Description: Move any remaining inline route handlers (ex: Player Stats TODO block) into dedicated `routes/*.routes.js` files and keep `server.js` as composition-only.
Rationale: `server.js` is still a monolith and already documents a move to modular routes; keeping mixed patterns increases maintenance risk.
Files: `server.js`, `routes/*.routes.js`.
Risk: Medium.
Verification: `npm test`, run API smoke checks for migrated endpoints, validate `/api/*` routes respond with expected status codes.

2. Standardize backend error responses on `sendError/sendSuccess` utilities.
Description: Replace ad-hoc `res.status(...).json(...)` patterns in routes with `sendError`, `sendSuccess`, and `sendValidationError` from `routes/utils/validation.js`.
Rationale: Inconsistent error shapes complicate clients and make logging/observability uneven.
Files: `routes/**/*.routes.js`, `server.js`, `routes/utils/validation.js`.
Risk: Medium.
Verification: `npm test`, verify error response schema for common failures (bad inputs, auth failure, DB errors).

3. Centralize Supabase-availability checks into middleware.
Description: Replace repeated `if (!supabase)` guards with a shared middleware that returns a consistent error early.
Rationale: Reduces duplicated logic and ensures consistent error handling across all routes.
Files: `routes/**/*.routes.js`, `routes/utils/database.js`, `routes/middleware/*.js`.
Risk: Medium.
Verification: `npm test`, verify routes fail with consistent error when Supabase is unavailable.

4. Align frontend HTTP usage to Angular HttpClient + interceptors.
Description: Replace ad-hoc `fetch` calls with HttpClient or a shared API service so interceptors (auth, error, retry) apply consistently.
Rationale: Current mix of HttpClient, Supabase client, and `fetch` bypasses interceptors and leads to inconsistent auth/telemetry/error handling.
Files: `angular/src/app/features/auth/register/register.component.ts`, `angular/src/app/shared/components/offline-banner/offline-banner.component.ts`, `angular/src/app/core/services/instagram-video.service.ts`, `angular/src/app/core/services/offline-queue.service.ts`, `angular/src/app/core/services/image-compression.service.ts`.
Risk: Medium.
Verification: `npm test`, validate registration leak-check, offline banner health check, and any fetch-backed services still work in-browser.
Status: In progress (2026-02-04). Audit found no direct `fetch()` usage in Angular app code; remaining work focuses on Supabase client usage consolidation.

5. Move direct Supabase client calls out of components into services.
Description: Components in training, video, and roster features directly use `SupabaseService.client`; move that logic into feature services and keep components thin.
Rationale: Duplicated data access logic across components complicates caching/error handling and makes tests harder.
Files: `angular/src/app/features/training/**/*.ts`, `angular/src/app/features/roster/roster.service.ts`, `angular/src/app/features/training/video-*/*.ts`.
Risk: High.
Verification: `npm test`, spot-check data flows (training schedule, roster, video feed).
Status: In progress (2026-02-04). Component-level `SupabaseService` usage removed; remaining Supabase usage is within feature services.

6. Tighten `any` usage across critical feature components.
Description: Replace `any` with specific interfaces or narrow `unknown` with type guards in high-traffic components.
Rationale: `any` masks data shape issues and makes refactors risky.
Files: `angular/src/app/features/today/today.component.ts`, `angular/src/app/features/wellness/wellness.component.ts`, `angular/src/app/features/ai-coach/ai-coach-chat.component.ts`, `angular/src/app/features/playbook/playbook.component.ts`, `angular/src/app/features/data-import/data-import.component.ts`.
Risk: Medium.
Verification: `npm test`, run flows in Today, Wellness, AI Coach, and Playbook screens.

7. Normalize error extraction into a shared Angular utility.
Description: Replace repeated error parsing patterns (especially `unknown` handling) with a shared helper used by services and components.
Rationale: Multiple, slightly different error extraction patterns lead to inconsistent messaging.
Files: `angular/src/app/features/roster/roster.service.ts`, `angular/src/app/core/services/*.ts`, `angular/src/app/shared/utils/*`.
Risk: Low.
Verification: `npm test`, verify error banners/toasts still display expected messages.

8. Consolidate duplicate request logging middleware.
Description: Merge `request-logger.middleware.js` and `enhanced-request-logger.middleware.js` into a single implementation or clearly separate responsibilities.
Rationale: Two similar loggers increase confusion and risk of inconsistent logging across routes.
Files: `routes/middleware/request-logger.middleware.js`, `routes/middleware/enhanced-request-logger.middleware.js`.
Risk: Medium.
Verification: `npm test`, confirm logs still include request ids and timings.

9. Remove or archive unused server entrypoints.
Description: Validate whether `server-supabase.js` and `simple-server.js` are used; remove or move to an `archive/` folder if not.
Rationale: Multiple server entrypoints increase confusion and accidental drift.
Files: `server-supabase.js`, `simple-server.js`, `package.json` scripts.
Risk: Low.
Verification: `npm test`, confirm `npm run dev:api` and `npm run start:api` still work.
Status: Completed on 2026-02-04 (moved to `docs/legacy/`).

10. Untrack generated build artifacts committed to the repo.
Description: Remove tracked files in `src/css`, `dist`, `playwright-report`, and `test-results`, and keep them ignored.
Rationale: These are build/test outputs already in `.gitignore`; keeping them in git makes diffs noisy.
Files: `src/css/**`, `dist/**`, `playwright-report/**`, `test-results/**`, `.gitignore` (confirm entries).
Risk: Low.
Verification: `npm test`, run `npm run build` to ensure outputs regenerate as expected.
Status: Verified `.gitignore` coverage and no tracked artifacts as of 2026-02-04.

11. De-duplicate PWA manifest files.
Description: Choose one of `manifest.json` or `manifest.webmanifest` in `angular/src` and remove the duplicate, updating references accordingly.
Rationale: Two manifests can drift and cause subtle PWA install issues.
Files: `angular/src/manifest.json`, `angular/src/manifest.webmanifest`, `angular/src/index.html`.
Risk: Low.
Verification: `npm test`, check PWA installability in a browser.
Status: Completed on 2026-02-04 using `manifest.webmanifest` as canonical.

12. Reduce CSS overrides by migrating styles into tokens/mixins.
Description: Audit `angular/src/assets/styles/overrides/_exceptions.scss` and migrate recurring rules to tokens or shared mixins.
Rationale: Large exceptions file is a maintenance hotspot and leads to visual regressions.
Files: `angular/src/assets/styles/overrides/_exceptions.scss`, `angular/src/scss/tokens/design-system-tokens.scss`, `angular/src/styles.scss`.
Risk: High.
Verification: `npm test`, visual smoke test key pages and Storybook (if used).

13. Retire deprecated design tokens and update consumers.
Description: Replace deprecated token usage with current tokens to reduce CSS bloat and simplify the design system.
Rationale: Deprecated tokens indicate technical debt and increase cognitive load.
Files: `angular/src/scss/tokens/design-system-tokens.scss`, `angular/src/**/*.scss`.
Risk: Medium.
Verification: `npm test`, run visual checks on high-traffic screens.

14. Consolidate route-level data helpers into shared utilities.
Description: Identify duplicated logic for pagination, validation, and query parsing in routes and move to shared helpers.
Rationale: Reduces inconsistencies and makes API behavior predictable.
Files: `routes/**/*.routes.js`, `routes/utils/query-helper.js`, `routes/utils/validation.js`.
Risk: Medium.
Verification: `npm test`, validate pagination and filters for key endpoints (attendance, roster, training).

15. Normalize caching strategy between backend and frontend.
Description: Audit backend caching (`routes/utils/cache.js`, HTTP headers) and frontend caching interceptor to avoid double-caching or stale data.
Rationale: Inconsistent caching can create stale UI or unexpected refresh behavior.
Files: `routes/utils/cache.js`, `angular/src/app/core/interceptors/cache.interceptor.ts`.
Risk: Medium.
Verification: `npm test`, validate data refresh behavior with cache enabled/disabled.

16. Remove or consolidate unused “today” folder under `angular/src/app`.
Description: Confirm whether `angular/src/app/today/**` is referenced; remove or move to `features/today` if legacy.
Rationale: Orphaned folders increase navigation friction and confusion.
Files: `angular/src/app/today/**`, `angular/src/app/app.routes.ts`.
Risk: Low.
Verification: `npm test`, navigate to Today feature and verify routing still works.

17. Consolidate duplicate country metadata.
Description: Centralize country name/code lists used in settings and roster into a shared constants file.
Rationale: Duplicate lists easily drift (example: `settings.component.ts` and `roster-utils.ts`).
Files: `angular/src/app/features/settings/settings.component.ts`, `angular/src/app/features/roster/roster-utils.ts`, `angular/src/app/shared/constants/*`.
Risk: Low.
Verification: `npm test`, verify country dropdowns render correctly.

18. Ensure consistent response schema in `server.js` legacy endpoints.
Description: Align legacy endpoints still in `server.js` to the same success/error shapes used in modular routes.
Rationale: Mixed response schemas make client handling brittle.
Files: `server.js`, `routes/utils/validation.js`.
Risk: Medium.
Verification: `npm test`, validate response shapes via API calls.

19. Review and remove unused exports in shared Angular utilities.
Description: Use tooling (tsc, lint, or `madge`) to identify unused exports in `angular/src/app/shared` and prune.
Rationale: Dead exports slow down refactors and increase bundle surface area.
Files: `angular/src/app/shared/**`.
Risk: Low.
Verification: `npm test`, ensure shared components still compile and render.

20. Generate and commit real Supabase types or remove the empty file.
Description: Either generate type definitions into `supabase-types.ts` or remove the empty placeholder file.
Rationale: Empty type files create false confidence and add noise.
Files: `supabase-types.ts`, `scripts/*` (type generation).
Risk: Low.
Verification: `npm test`, ensure build passes and Supabase types are available if used.

## Quick Wins (<= 2 hours)

1. Remove or archive unused server entrypoints: `server-supabase.js`, `simple-server.js`.
2. Untrack generated build artifacts committed to the repo: `src/css/**`, `dist/**`, `playwright-report/**`, `test-results/**`.
3. De-duplicate PWA manifests: keep only `angular/src/manifest.webmanifest` or `angular/src/manifest.json`.
4. Remove empty `supabase-types.ts` or generate proper types.
5. Consolidate duplicate country lists into a single shared constant.

## High Risk (Requires Extra Care)

1. Moving direct Supabase client usage out of components into services.
2. Reducing or refactoring CSS overrides in `angular/src/assets/styles/overrides/_exceptions.scss`.
3. Standardizing backend error responses across all routes and legacy endpoints.
4. Consolidating remaining inline endpoints from `server.js` into modular routes.
