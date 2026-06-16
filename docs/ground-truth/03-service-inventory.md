# Service Inventory (angular/src/app/core/services)

Last verified: 2026-06-12

**Count: 29 services** (excludes `*.spec.ts` and `*.mock.ts`; `logger.service.ts` is a re-export barrel for `@core/logging/logger.service`).

Grouped into: auth/identity, training/load/ACWR/readiness, wellness/recovery/injury, schedule, communication/realtime, and infra/logging/telemetry.

---

## Auth / Identity

### auth-flow-data.service.ts
- **Responsibility:** Auth flow plumbing — current user/session, sign-out, code↔session exchange, onboarding status, redirect/verification/password-recovery intent persistence.
- **Talks to:** Supabase auth (via SupabaseService) + table `.from("users")` (onboarding status). No `/api`.
- **Key methods:** `getCurrentUser`, `getCurrentSession`, `exchangeCodeForSession`, `getUserOnboardingStatus`, `signOut`, `storePostOnboardingRedirect`, `buildAppUrl`.
- **Notes:** Guards a `usersTableUnavailable` flag (RLS/availability fallback).

### identity.service.ts
- **Responsibility:** Single source for the signed-in athlete's display identity (name, initials, avatar, jersey, position, team).
- **Talks to:** SupabaseService (auth user_metadata) + TeamMembershipService (jersey/position/team). No direct tables/api.
- **Key signals:** `displayName`, `firstName`, `initials`, `avatarUrl`, `jersey`, `position`, `teamName`.

### team-membership.service.ts
- **Responsibility:** Loads the athlete's active team membership + role/permission gates (coach/admin/player, canManageRoster, canViewHealthData).
- **Talks to:** table `.from("team_members")` (load, coach lookups, role checks). No `/api`.
- **Key signals/methods:** `membership`, `teamId`, `role`, `isCoach`, `isAdmin`, `canViewHealthData`, `loadMembership`, `getTeamCoach`, `getTeamCoaches`, `isUserCoachForTeam`.

### home-route.service.ts
- **Responsibility:** Resolves the post-login landing route from the user's role (superadmin / coach / player).
- **Talks to:** SupabaseService (current user). No tables/api.
- **Key methods:** `getHomeRoute`, `getHomeRouteForUser`, `getHomeRouteForRole`.

### privacy-settings.service.ts
- **Responsibility:** GDPR privacy preferences — AI-processing opt-out (Art. 22), research opt-in, emergency-sharing level, team data sharing, parental consent; gates consent-aware health reads.
- **Talks to:**
  - Tables: `.from("privacy_settings")`, `.from("team_sharing_settings")`, `.from("parental_consent")`, `.from("team_members")`, `.from("users")`, **`.from("v_load_monitoring_consent")`**, **`.from("v_workout_logs_consent")`** (consent views).
  - RPCs: `require_ai_consent`, `get_coached_teams`, plus dynamic-name RPC calls for consent status.
- **Key signals/methods:** `settings`, `aiProcessingEnabled`, `emergencySharingLevel`, `hasParentalConsent`, `loadSettings`, `updateAiProcessing`, `canProcessWithAi`, `requireAiConsent`, `getConsentAwareLoadMonitoring`, `getConsentAwareWorkoutLogs`.
- **Notes:** The two consent views are named after dropped tables (`v_load_monitoring_consent`, `v_workout_logs_consent`) — verify these views still exist in the live schema.

---

## Training / Load / ACWR / Readiness / Periodization

### acwr.service.ts
- **Responsibility:** Evidence-based Acute:Chronic Workload Ratio (EWMA) engine — risk zones, data-quality/sufficiency, tolerance detection, weekly-load-cap safeguards.
- **Talks to:** table `.from("training_sessions")` (canonical completed-session read) + **realtime subscription on `training_sessions`** via `.channel("training_sessions:${userId}")`.
- **Key signals/methods:** `sufficientDataForACWR`, `toleranceStatus`, plus risk/progression/data-quality computeds; load-from-sessions + realtime resubscribe.
- **Notes:** Comments document `workout_logs` was MERGED into `training_sessions` (Phase 9b, 2026-05-29). No live `.from("workout_logs")` — only legacy log-keys (`acwr_workout_logs_load_failed`, `acwr_no_workout_logs`) remain as label strings.

### acwr-spike-detection.service.ts
- **Responsibility:** Detects ACWR spikes (>1.5) and writes automatic load caps for upcoming sessions.
- **Talks to:** table `.from("load_caps")` (read/insert/update/decrement).
- **Key methods:** `checkAndCapLoad`, `getActiveLoadCap`, `decrementLoadCap`.
- **Notes:** `loadCapsUnavailable = true` hard-codes the service OFF — `load_caps` is backend-managed and not browser-safe against current schema/policies, so all methods early-return. Effectively dormant.

### periodization.service.ts
- **Responsibility:** Daily prescription engine — combines schedule phase + ACWR + readiness + injury guard + weather into `today`/`weekAhead` prescriptions and nutrition targets.
- **Talks to:** `/api/weather`, `/api/player-settings` (settings/weather); composes AcwrService, ReadinessService, ScheduleService, InjuryService, SupabaseService.
- **Key signals/methods:** `today` (DailyPrescription), `seasonCalendar`, `teamTrainingDays`, `weather`, `weekAhead`, `refreshSettings`.

### readiness.service.ts
- **Responsibility:** Thin read-through client for server-canonical readiness scoring.
- **Talks to:** `/api/calc-readiness` (POST), `/api/readiness-history` (GET), `/api/calibration-logs` (calibration outcome).
- **Key signals/methods:** `current`, `history`, `loading`, `calculateToday`, `getHistory`.
- **Notes:** Display-helper recompute logic was removed in v11 — clients read `current().level/suggestion/calibrationNote` straight off the server response.

### ai.service.ts
- **Responsibility:** Merlin AI coach client — chat, natural-command parsing, context-insight analysis, response feedback.
- **Talks to:** `/api/ai/chat` (POST), `/api/ai/process-command` (POST), `/api/ai/analyze-context` (POST), `/api/response-feedback` (POST). Pulls privacy gate from PrivacySettingsService.
- **Key methods:** `sendMessage`, `processNaturalCommand`, `analyzeContext`.

### training-video.service.ts
- **Responsibility:** Team training-video library (YouTube), filtered by category / position / prescription intent.
- **Talks to:** table `.from("training_videos")` (read + insert).
- **Key signals/methods:** `videos`, `loaded`, `load`, `byCategory`, `forIntent`, `add`, `parseYouTubeId` (exported helper).

### evidence-config.service.ts
- **Responsibility:** Active evidence preset (ACWR / readiness / tapering config bundles) + usage tracking.
- **Talks to:** table `.from("user_activity_logs")` (insert preset-usage log).
- **Key signals/methods:** `availablePresets`, `getActivePreset`, `setActivePreset`, `getACWRConfig`, `getReadinessConfig`, `getTaperingConfig`.

---

## Wellness / Recovery / Injury

### wellness.service.ts
- **Responsibility:** Daily wellness check-ins, derived wellness score/status/trends, and client-side ACWR calc via RPC.
- **Talks to:**
  - Table: `.from("daily_wellness_checkin")` (canonical read).
  - RPCs: `calculate_acwr`, `upsert_wellness_checkin`.
  - **Realtime: broadcast channel `wellness:${userId}`** listening for `wellness_change` broadcast events (NOT postgres_changes).
- **Key signals/methods:** `wellnessData`, `latestWellnessEntry`, `getWellnessData`, `calculateAcwr`, `getWellnessScore`, `getWellnessStatus`, `getRecommendations`, `getWellnessTrends`.

### recovery.service.ts
- **Responsibility:** Recovery-modality recommender; builds today's recovery context from prescription + ACWR/readiness + tightness, gated by owned equipment (equipment gate is a hard rule).
- **Talks to:** `/api/player-settings` (owned equipment). Composes PeriodizationService, InjuryService, ReadinessService, ScheduleService.
- **Key signals/methods:** `ownedEquipment`, `context`, `recommendations`, `loadEquipment`.

### injury.service.ts
- **Responsibility:** Active injuries + self-reported tightness; feeds injury precedence into the periodization engine (down-regulates affected work).
- **Talks to:** `/api/athlete-injuries` (GET list, POST report). Canonical store noted as `athlete_injuries`.
- **Key signals/methods:** `active`, `restrictions`, `load`, `report`.

---

## Schedule

### schedule.service.ts
- **Responsibility:** Canonical read API for the v11 schedule "spine" — next/last event, phase, game density; single source for Today/training/nutrition/recovery/readiness.
- **Talks to:** `/api/schedule` (reads server-side from view `v_athlete_schedule`). Uses SupabaseService for userId.
- **Key signals/methods:** `snapshot`, `nextEvent`, `lastEvent`, `upcoming`, `currentPhase`, `density7d/14d/28d`, `daysToNextEvent`, `refresh`, `eventsInWindow`, `phaseFor`, `gameDensity`.

### athlete-events.service.ts
- **Responsibility:** CRUD for athlete-entered schedule events (personal / domestic / national-team); refreshes ScheduleService on every write.
- **Talks to:** `/api/athlete-events` (GET/POST/PUT/DELETE).
- **Key signals/methods:** `events`, `upcoming`, `loading`, `load`, `create`, `update`, `remove`.

---

## Communication / Realtime

### realtime.service.ts
- **Responsibility:** Centralized manager for all postgres_changes realtime subscriptions — dedup, tracking, app-level cleanup, auto-unsub on logout.
- **Talks to (realtime postgres_changes, schema `public`):** owns subscriptions on tables **`training_sessions`, `games`, `daily_wellness_checkin`** (subscribeToWellness), **`performance_metrics`, `readiness_scores`, `team_members`** (subscribeToTeamUpdates), **`messages`, `chat_messages`, `notifications`, `coach_activity_log`, `channels`**.
- **Key methods:** `subscribe`, `subscribeToTrainingSessions`, `subscribeToGames`, `subscribeToWellness`, `subscribeToPerformance`, `subscribeToReadiness`, `subscribeToTeamUpdates`, `subscribeToMessages`, `subscribeToChannelMessages`, `subscribeToNotifications`, `subscribeToCoachActivity`, `subscribeToChannels`, `unsubscribe`, `unsubscribeAll`, `getStats`.

### channel.service.ts
- **Responsibility:** Team communication channels (announcements/general/coaches/position/game-day/DM) with role-based permissions, messages, reads/receipts, pins.
- **Talks to:**
  - Tables: `.from("channels")`, `.from("channel_members")`, `.from("chat_messages")`, `.from("team_members")`, `.from("users")`, `.from("message_read_receipts")`, `.from("announcement_reads")`.
  - RPCs: `increment_reply_count`, plus one more RPC for channel data.
  - Realtime: delegates to `RealtimeService.subscribe(...)` for `chat_messages` (no direct `.channel`).
- **Key methods:** `loadChannels`, `createChannel`, `archiveChannel`, `sendMessage`, `togglePinMessage`, `editMessage`, `deleteMessage`, `markMessageRead`, `acknowledgeAnnouncement`, `selectChannel`, `getUnreadCount`, `getChannelMembers`, `subscribeToChannelMessages`.

---

## Infra / Logging / Telemetry

### supabase.service.ts
- **Responsibility:** Wraps the Supabase client — auth state signals, sign-in/out, token/session refresh, and generic realtime channel factories.
- **Talks to:** Supabase auth + provides realtime helpers. **Realtime postgres_changes** on `coach_inbox_items` (`subscribeToCoachInbox`) and `daily_wellness_checkin` (`subscribeToAthleteDailyState`).
- **Key signals/methods:** `currentUser`, `session`, `isInitialized`, `waitForInit`, `signIn`, `signOut`, `getToken`, `refreshSessionForHttpRetry`, `subscribeToCoachInbox`, `subscribeToAthleteDailyState`, `unsubscribe`.

### api.service.ts
- **Responsibility:** HTTP client wrapper for the Netlify-functions REST backend — URL building, schema validation, error normalization, and the canonical `API_ENDPOINTS` registry.
- **Talks to:** all `/api/...` routes (the exhaustive endpoint catalog lives here: dashboard, training, performance, analytics, coach, community, tournaments, wellness, recovery, load-management, readiness, games, attendance, depth-chart, equipment, officials, push, staff-*, scouting, film-room, playbook, etc.).
- **Key methods:** `get/post/put/delete` (typical), `buildUrl`, exported `API_ENDPOINTS`.

### logger.service.ts
- **Responsibility:** Barrel re-export of `LoggerService` + `toLogContext` from `@core/logging/logger.service`. (Not a standalone implementation.)

### error-tracking.service.ts
- **Responsibility:** Sentry integration — exception/message capture, breadcrumbs, user context, navigation tracking (gated on VITE_ENABLE_SENTRY/DSN).
- **Talks to:** Sentry SDK only.
- **Key methods:** `init`, `captureException`, `captureMessage`, `addBreadcrumb`, `setUser`/`clearUser`, `trackUserAction`, `trackNavigation`, `isSentryEnabled`.

### angular-global-error-handler.service.ts
- **Responsibility:** Angular `ErrorHandler` impl — routes uncaught errors to LoggerService, suppresses expected HTTP auth/client errors (400/401/403/404 on `/api/`).
- **Talks to:** nothing external.
- **Key methods:** `handleError`.

### remote-telemetry.service.ts
- **Responsibility:** Persists client-side telemetry to `public.frontend_logs` (insert-only RLS); fails silently, never throws/blocks.
- **Talks to:** table `.from("frontend_logs")` (insert). Uses CorrelationContextService for trace IDs.
- **Key methods:** `error`, `warn`, `info`.

### correlation-context.service.ts
- **Responsibility:** Holds a stack of correlation/trace IDs for nested ops; HTTP layer sends `X-Correlation-Id`.
- **Talks to:** nothing external.
- **Key methods:** `startTrace`, `endTrace`, `traceId`, `getOrCreateForRequest`.

### platform.service.ts
- **Responsibility:** SSR-safe wrapper for browser-only APIs (localStorage/sessionStorage, window/document, clipboard, viewport, navigation).
- **Talks to:** nothing external.
- **Key methods:** `isBrowser`, `getLocalStorage`/`setLocalStorage`, `getWindow`, `scrollToTop`, `copyToClipboard`, `getViewportWidth/Height`, `navigateToUrl`.

### toast.service.ts
- **Responsibility:** Signal-based toast notifications (PrimeNG-free); holds an internal `messages` signal with dedup + max-visible behaviour.
- **Talks to:** nothing external.
- **Key signals/methods:** `messages`, `success`, `error`, `warn`, `info`, `show`, `clear`, `clearByKey`.

---

## Legacy / dead-table flags

- **`load_caps`** (acwr-spike-detection.service.ts): service hard-disabled via `loadCapsUnavailable = true`; effectively dead client-side code.
- **`workout_logs`** (acwr.service.ts): table dropped/merged into `training_sessions` (Phase 9b). Only residual label strings remain; no live query.
- **`v_load_monitoring_consent` / `v_workout_logs_consent`** (privacy-settings.service.ts): consent VIEWS named after dropped `load_monitoring` / `workout_logs` tables — confirm they still exist in the live schema.
- No live `.from(...)` references to `load_monitoring`, `wellness_logs`, `injuries`, `fixtures`, `tournaments`, or a bare `sessions` table were found in any service. (`/api/fixtures` and `/api/tournaments` REST routes still exist in `API_ENDPOINTS` but are server-side endpoints, not client tables.)
