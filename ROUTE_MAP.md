## FlagFit Pro Route Map

This document maps frontend routes to their primary data sources and backend API
endpoints. The canonical API endpoint list lives in:
`angular/src/app/core/services/api.service.ts` (`API_ENDPOINTS`).

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
   - Data source: `DashboardDataService`, `TeamStatisticsService`,
     `PerformanceDataService`, `WellnessService`
   - API endpoints:
     - `API_ENDPOINTS.dashboard.*`
     - `API_ENDPOINTS.coach.*`
     - `API_ENDPOINTS.training.sessions`
     - `API_ENDPOINTS.analytics.injuryRisk`
     - `API_ENDPOINTS.games.*`
   - Models: `DashboardData`, `TeamOverviewStats`, `RiskAlert`,
     `TrainingSession`, `UpcomingGame`

3. Athlete/Player Data Entry (Performance + Wellness)
   - Routes: `/performance-tracking`, `/wellness`
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
     `/travel/recovery`
   - Data source: `TrainingDataService`, `TrainingSafetyService`,
     `LoadMonitoringService`, `RecoveryService`
   - API endpoints:
     - `API_ENDPOINTS.training.*`
     - `API_ENDPOINTS.loadManagement.*`
     - `API_ENDPOINTS.recovery.*`
   - Models: training session models, load monitoring summaries

5. Analytics + Trends
   - Routes: `/analytics`, `/analytics/enhanced`
   - Data source: `AnalyticsDataService`
   - API endpoints: `API_ENDPOINTS.analytics.*`, `API_ENDPOINTS.trends.*`
   - Models: analytics summary + chart datasets

### Other Route Groups (Feature-Routes)
The following routes are registered in `feature-routes.ts` and use shared
services backed by `API_ENDPOINTS` and/or Supabase tables where applicable.

- Training:
  `/training/builder`, `/training/ai-scheduler`, `/training/smart-form`,
  `/training/session/:id`, `/training/videos`, `/training/videos/curation`,
  `/training/videos/suggest`, `/training/load-analysis`,
  `/training/goal-planner`, `/training/microcycle`, `/training/import`

- Team / Coach:
  `/roster`, `/team/workspace`, `/coach`, `/coach/activity`, `/coach/analytics`,
  `/coach/inbox`, `/coach/team`, `/coach/programs`, `/coach/practice`,
  `/coach/injuries`, `/coach/playbook`, `/coach/development`,
  `/coach/tournaments`, `/coach/payments`, `/coach/ai-scheduler`,
  `/coach/knowledge`, `/coach/film`, `/coach/calendar`, `/coach/scouting`,
  `/team/create`, `/attendance`, `/depth-chart`, `/equipment`, `/officials`

- Game & Competition:
  `/game/readiness`, `/game/nutrition`, `/game-tracker`,
  `/game-tracker/live`, `/tournaments`

- Wellness & Health:
  `/acwr`, `/return-to-play`, `/cycle-tracking`, `/sleep-debt`,
  `/achievements`, `/playbook`, `/film`, `/calendar`, `/payments`, `/import`

- Social & Community:
  `/community`, `/chat`, `/team-chat`

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
