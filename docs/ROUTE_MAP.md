# FlagFit Pro Route Map

This document maps frontend routes to their primary data sources and backend API
endpoints. The canonical API endpoint list lives in:
`angular/src/app/core/services/api.service.ts` (`API_ENDPOINTS`).

_Version 3.4 | Last Updated: March 2026_

This route map reflects the consolidated `2.1` product surface.
Several older routes still exist as compatibility redirects, but they are not
the canonical destinations users should be sent to.

Use this together with:
- `docs/CODEBASE_MAP.md` for feature/domain ownership
- `docs/SINGLE_SOURCE_OF_TRUTH.md` for canonical write authority
- `docs/DRIFT_REGISTER.md` for known route/workflow ambiguity hotspots

### Frontend Entry + Routing
- FE entry: `angular/src/main.ts`
- Route config: `angular/src/app/app.routes.ts`
- Route groups: `angular/src/app/core/routes/feature-routes.ts`

### Backend Entry + Routing
- BE entry: Netlify Functions under `netlify/functions/`
- API routing: Netlify redirects (`netlify.toml`) map `/api/*` → functions

### Core Flows (E2E Critical)
1. Auth
   - Routes: `/login`, `/register`, `/reset-password`, `/update-password`,
     `/verify-email`, `/auth/callback`
   - Data source: Supabase auth via `SupabaseService`
   - API endpoints: `API_ENDPOINTS.auth.me` (token verification)
   - Models: Supabase session + user profile (frontend services)

2. Dashboard (Player + Coach)
   - Routes: `/dashboard`, `/player-dashboard`, `/coach/dashboard`,
     `/todays-practice`
   - Data source: `PlayerDashboardDataService`, `CoachDashboardComponent`,
     `TeamStatisticsService`, `PerformanceDataService`, `WellnessService`
   - API endpoints:
     - `API_ENDPOINTS.dashboard.*`
     - `API_ENDPOINTS.coach.*`
     - `API_ENDPOINTS.training.sessions`
     - `API_ENDPOINTS.analytics.injuryRisk`
     - `API_ENDPOINTS.games.*`
   - Models: `TeamOverviewStats`, `RiskAlert`,
     `TrainingSession`, `UpcomingGame`

3. Athlete/Player Data Entry (Performance + Wellness)
   - Routes: `/performance/tests`, `/wellness`
   - Data source:
     - `PerformanceTrackingDataService` (Supabase table `performance_records`)
     - `WellnessService` + `PerformanceDataService`
   - API endpoints:
     - `API_ENDPOINTS.performance.*`
     - `API_ENDPOINTS.performanceData.*`
     - `API_ENDPOINTS.wellness.*`
   - Models: `PerformanceRecordRow`, wellness check-in models

4. Training + Recovery Suggestions
   - Routes: `/training`, `/training/log`, `/training/safety`,
     `/training/advanced`, `/training/periodization`, `/training/qb`,
     `/training/workspace`
   - Data source: `TrainingDataService`, `TrainingSafetyService`,
     `LoadMonitoringService`, `RecoveryService`
   - API endpoints:
     - `API_ENDPOINTS.training.*`
     - `API_ENDPOINTS.loadManagement.*`
     - `API_ENDPOINTS.recovery.*`
   - Models: training session models, load monitoring summaries

5. Analytics + Trends
   - Routes: `/performance/insights`, `/performance/load`
   - Data source: `AnalyticsDataService`
   - API endpoints: `API_ENDPOINTS.analytics.*`, `API_ENDPOINTS.trends.*`
   - Models: analytics summary + chart datasets

### Other Route Groups (Feature-Routes)
The following canonical routes are registered in `feature-routes.ts` and use
shared services backed by `API_ENDPOINTS` and/or Supabase tables where
applicable.

- Training:
  `/training/builder`, `/training/ai-scheduler`, `/training/smart-form`,
  `/training/session/:id`, `/training/videos`,
  `/training/videos/suggest`, `/training/load-analysis`,
  `/training/goal-planner`, `/training/microcycle`, `/training/import`

- Team / Coach:
  `/roster`, `/team/workspace`, `/coach`, `/coach/dashboard`,
  `/coach/analytics`, `/coach/planning`, `/coach/team`, `/coach/tournaments`,
  `/coach/knowledge`, `/attendance`

- Game & Competition:
  `/game/readiness`, `/tournaments`

- Wellness & Health:
  `/performance/load`, `/return-to-play`, `/cycle-tracking`, `/sleep-debt`,
  `/achievements`, `/playbook`, `/film`, `/calendar`, `/payments`, `/import`

- Social & Community:
  `/chat`, `/team-chat`

- Staff:
  `/staff`, `/staff/nutritionist`, `/staff/physiotherapist`,
  `/staff/psychology`, `/staff/decisions`, `/staff/decisions/:id`

- Profile & Settings:
  `/profile`, `/settings`, `/settings/profile`, `/settings/privacy`

- Superadmin:
  `/superadmin`, `/superadmin/settings`, `/superadmin/teams`,
  `/superadmin/users`

- Help:
  `/help`, `/help/:topic`

- Wildcard:
  `**` → Not Found

## Compatibility Redirects

The following routes still exist for backward compatibility but should be
treated as deprecated aliases rather than primary product destinations:

- `/analytics`, `/analytics/enhanced` → `Performance`
- `/performance-tracking` → `/performance/tests`
- `/acwr` → `/performance/load`
- `/community` → `/team-chat`
- `/travel/recovery`, `/game/nutrition` → `/wellness`
- `/game-tracker`, `/game-tracker/live` → `/tournaments`
- `/depth-chart`, `/equipment`, `/officials`, `/coach/payments`,
  `/team/create` → `/team/workspace`
- `/coach/programs`, `/coach/program-builder`, `/coach/ai-scheduler`,
  `/coach/playbook`, `/coach/scouting`, `/coach/film` → `/coach/planning`
- `/coach/development`, `/coach/player-development`,
  `/coach/injuries`, `/coach/injury-management` → `/coach/analytics`
