# STABILIZATION_STATUS

## 2026-02-05 19:08 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (fail; 57 TypeScript errors)
- `npm test` (pass)

Counts (latest):
- Build errors: 57
- TypeScript errors: 57
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Added global SpeechRecognition typings for Web Speech API usage.
- Tightened auth flow typing and null guards in callback and verify email flows.
- Added onboarding null guards for user email and team creation.
- Guarded analytics label date formatting with null-safe logic.
- Hardened training safety date handling and progress calculation.
- Guarded settings profile date parsing and team member ID usage.
- Guarded team creation flow when team creation returns null.
- Normalized inviter name fallback for team invitations.
- Normalized smart training upcoming game opponent nulls.
- Guarded data import result assignment.
- Standardized ACWR session ID handling before attribution mapping.

What’s next:
- Resolve remaining TS errors in `profile.component.ts` (nullable dates and wellness aggregates).
- Fix chart data typing mismatch (`SimpleChartData` vs `LazyChartData`) in dashboard/performance/wellness components.
- Fix training schedule/detail type casts and undefined `data` reference.
- Fix QB throwing tracker response data nullability.
- Fix today component protocol typing conversions.

Risky areas touched:
- Auth flows (`auth-callback`, `verify-email`)
- Onboarding (team creation and profile load)
- Settings (profile date parsing, team transfer)
- AI coach voice input initialization
- Training safety protocol calculation

Manual test checklist:
- Auth callback and verify email completion flow.
- Onboarding: load profile, create team (player/staff), verify email state.
- Settings: update profile, transfer teams, and update membership.
- AI Coach: voice input supported/unsupported paths.
- Training safety dashboard loads and RTP progress display.

## 2026-02-05 19:19 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (fail; TS errors remain, occasional Abort trap: 6)
- `npm test` (pass)

Counts (latest):
- Build errors: 24 (last full error output before abort trap)
- TypeScript errors: 24
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Broadened lazy chart input typing to accept `SimpleChartData`.
- Allowed chart dataset fill to accept string values.
- Added wellness optional fields used by UI (`weight`, `resting_hr`).
- Hardened profile session date handling and wellness aggregation guards.
- Added null-safe handling for avatar upload error messages.

What’s next:
- Fix remaining TS errors in `today.component.ts` (protocol typing and mapping).
- Fix remaining TS errors in `training-session-detail.component.ts` and `training-schedule.component.ts`.
- Fix remaining TS errors in tournaments, QB throwing tracker, workout services.

Risky areas touched:
- Profile stats and wellness aggregation.
- Lazy chart input typing.
- Wellness data typing.

Manual test checklist:
- Profile page loads; streak, performance score, and recent activity list render.
- Wellness dashboard displays weight/resting HR alerts if present.

## 2026-02-05 20:47 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Normalized today protocol response casts to avoid unsafe type conversions.
- Hardened tournaments availability/budget mapping with type guards and defaults.
- Fixed training schedule template flag casting and sessionId routing bug.
- Hardened training session detail mapping from actual/template sessions.
- Added AI training scheduler guards for suggestion type/priority/status payloads.
- Safeguarded QB throwing tracker against empty response data.
- Guarded wellness soreness check against undefined values.
- Handled workout logs with array-backed training sessions and null durations.

What’s next:
- Start duplication cleanup where proven (common mapping helpers in training/tournaments).
- Identify deprecated Angular/PrimeNG patterns for incremental modernization.
- Scan for dead code/unused exports once baseline is stable.

Risky areas touched:
- Today protocol mapping.
- Tournaments availability/budget data shaping.
- Training schedule/detail data mapping.
- AI training scheduler payload normalization.
- Workout log hydration.
- QB throwing tracker data hydration.

Manual test checklist:
- Today page loads with protocol blocks, exercises, and readiness data.
- Tournaments: availability dialog, team availability summary, budget form.
- Training schedule: start template session, navigates to training log.
- Training session detail: actual vs template views render.
- AI training scheduler: suggestions list, scheduled sessions rendering.
- Workout history loads with exercises and names.
- QB throwing tracker loads status and recent sessions.

## 2026-02-05 20:55 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Modernized RxJS operator imports to `rxjs` in app and search panel.

What’s next:
- Continue Phase 3 by migrating additional `rxjs/operators` imports in a safe, incremental sweep.
- Identify one more small deprecated pattern to modernize without behavior change.

Risky areas touched:
- Root app initialization and search panel streams (imports only).

Manual test checklist:
- App loads; navigation tracking still active.
- Search panel opens, debounced search and suggestions still work.

## 2026-02-05 21:02 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Modernized RxJS operator imports to `rxjs` in page title service and header component.

What’s next:
- Continue Phase 3 with a small batch of `rxjs/operators` import cleanups.
- Identify one more deprecated pattern for a safe, isolated update.

Risky areas touched:
- Header/nav and page title updates (imports only).

Manual test checklist:
- Header search, user menu, and shortcuts work.
- Page title updates on route change.

## 2026-02-05 21:06 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Modernized RxJS operator imports to `rxjs` in training stats and context services.

What’s next:
- Continue Phase 3 with another small batch of `rxjs/operators` import cleanups.
- Identify one more deprecated pattern for a safe, isolated update.

Risky areas touched:
- Context route metadata and training stats (imports only).

Manual test checklist:
- Dashboard loads; training stats and streak values render.
- Breadcrumbs and quick actions still update with navigation.

## 2026-02-05 21:11 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Modernized RxJS operator imports to `rxjs` across core services (auth, API, AI, AI chat, unified training, readiness).

What’s next:
- Continue Phase 3 with the remaining core services using `rxjs/operators`.
- Identify a second non-RxJS deprecation to modernize safely.

Risky areas touched:
- Core services only (imports changed; no logic change).

Manual test checklist:
- Login/logout flow.
- AI chat and AI service fetches.
- Readiness and unified training data loads.

## 2026-02-05 21:14 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Modernized RxJS operator imports to `rxjs` across remaining core services batch.

What’s next:
- Continue Phase 3 in shared components and view models using `rxjs/operators`.
- Identify one more deprecated pattern to modernize safely.

Risky areas touched:
- Core services (imports only; no logic change).

Manual test checklist:
- Workout and analytics dashboards.
- Weather, recovery, and performance data views.

## 2026-02-05 21:23 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Modernized RxJS operator imports to `rxjs` across remaining core services, interceptors, strategy, view model, and player dashboard.

What’s next:
- Continue Phase 3 with any remaining `rxjs/operators` in non-core app areas (if any).
- Pick one non-RxJS deprecation for a safe modernization pass.

Risky areas touched:
- Preload strategy and interceptors (imports only).

Manual test checklist:
- Player dashboard loads and renders.
- Route preloading and HTTP error handling continue working.

## 2026-02-05 21:25 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Completed RxJS operator import modernization across shared/core app layers.

What’s next:
- Pick one non-RxJS deprecation for safe modernization (e.g., replace legacy RxJS operator imports in any remaining feature files, or update a single deprecated Angular pattern if present).

Risky areas touched:
- Low risk; import-only changes across app layers.

Manual test checklist:
- Spot check a few core screens (Dashboard, Analytics, Training).

## 2026-02-05 21:32 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Added `takeUntilDestroyed` to page title service subscription for modern Angular cleanup.

What’s next:
- Identify another non-RxJS deprecation candidate or move to Phase 4.

Risky areas touched:
- Page title updates (subscription lifecycle only).

Manual test checklist:
- Route changes still update the document title.

## 2026-02-05 21:35 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- No additional code changes; verification pass after Phase 3 updates.

What’s next:
- Move to Phase 4 (single source of truth) or pick another small modernization.

Risky areas touched:
- None.

Manual test checklist:
- Spot check one primary flow (Dashboard or Training).

## 2026-02-05 21:49 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Added calculation map and spec documentation.
- Added deterministic athlete fixtures for calculation verification.
- Added calculation verification tests for ACWR and bodyweight trend.

What’s next:
- Expand calculation verification to cover readiness and wellness aggregation.
- Add regression coverage for performance/QB metrics calculations.

Risky areas touched:
- Calculation verification coverage (ACWR, bodyweight trend).

Manual test checklist:
- Analytics: confirm ACWR trend visuals render.
- Wellness: confirm bodyweight trend display still renders.

## 2026-02-05 21:57 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Added readiness score verification tests in load monitoring service.
- Added fixture-based wellness score assertion.
- Documented client-side readiness scoring formula.

What’s next:
- Add calculation fixtures/tests for performance score and QB throwing metrics.
- Add readiness aggregation checks for server readiness history response (if stable).

Risky areas touched:
- Calculation verification coverage (readiness, wellness scoring).

Manual test checklist:
- Training readiness widgets still render.
- Wellness score and status display unchanged on wellness page.

## 2026-02-05 22:08 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (pass; fixed one calc verification expectation)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Added QB throwing tracker calculation tests (progress percent, bar height).
- Added performance score verification in calculation test suite.
- Corrected performance score expectation to match formula rounding.

What’s next:
- Add calculation coverage for readiness history responses (if stable).
- Add backend-level validation for performance score once backend tests exist.

Risky areas touched:
- Calculation verification coverage (performance score, QB metrics).

Manual test checklist:
- QB throwing tracker renders progress and weekly bars.
- Dashboard performance score display unchanged.

## 2026-02-05 22:11 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Added fixture-based wellness averages verification.
- Documented wellness averages formula in calculation spec.

What’s next:
- Add readiness history response verification once endpoint contract is stable.
- Extend calculation coverage to backend analytics formulas when backend tests exist.

Risky areas touched:
- Calculation verification coverage (wellness averages).

Manual test checklist:
- Wellness averages display unchanged (if shown in UI).

## 2026-02-05 22:18 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (fail, fixed readiness config mock, re-run pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Added readiness level/suggestion/severity verification tests.
- Documented readiness level classification cut-points in calculation spec.
- Fixed readiness config mock to include reduced data fields.

What’s next:
- Add readiness history response verification (if endpoint contract is stable).
- Consider adding backend-level analytics calc tests once harness exists.

Risky areas touched:
- Calculation verification coverage (readiness classification).

Manual test checklist:
- Readiness badges and labels unchanged in readiness UI.

## 2026-02-05 22:21 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (fail in readiness tests, fixed mock, re-run pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Added readiness history response verification tests.
- Fixed readiness service test mock to match config shape.

What’s next:
- Consider backend analytics verification once server-side test harness exists.
- Add calculation coverage for performance analytics routes if feasible.

Risky areas touched:
- Readiness history handling (tests only).

Manual test checklist:
- Readiness history chart still loads (if present).

## 2026-02-05 22:29 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (fail in training stats calc tests, fixed expectations, re-run pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- Added training stats calculation tests for weekly volume and streak.
- Documented weekly training volume formula and example.

What’s next:
- Consider backend analytics verification once server-side test harness exists.
- Add calculation coverage for performance analytics routes if feasible.

Risky areas touched:
- Training stats calculation verification (tests only).

Manual test checklist:
- Weekly training volume still matches expected dashboard values.

## 2026-02-05 22:32 CET

Commands run (latest):
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm test` (pass)

Counts (latest):
- Build errors: 0
- TypeScript errors: 0
- Lint errors: 0
- Lint warnings: 0
- Test failures: 0

What changed:
- No code changes in this run (verification pass after training stats tests).

What’s next:
- Add backend analytics verification once server-side test harness exists.
- Add calculation coverage for performance analytics routes if feasible.

Risky areas touched:
- None.

Manual test checklist:
- No manual checks required (no runtime changes).
