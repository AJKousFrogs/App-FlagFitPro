# Single Source Of Truth

**Application release:** 4.0.0  
**Purpose:** Define where truth lives across the FlagFit Pro codebase so future product, UI, and backend work does not reintroduce drift.

## Rule

Each important domain must have:
- one canonical write authority
- one preferred read model
- explicit projection layers when duplication is unavoidable

If a feature reads from a projection, that projection must not silently become the write authority.

## Canonical Domains

### Identity And Profile

- Canonical authority: `users`
- Primary fields: identity, profile, contact, body data
- Key code:
  - `angular/src/app/features/settings/services/settings-data.service.ts`
  - `angular/src/app/features/onboarding/services/onboarding-data.service.ts`
  - `angular/src/app/features/roster/roster.service.ts`

Rules:
- `user_id` is the canonical identity key.
- Do not use `email` as the only join key for continuity-critical writes.
- Profile edits should update `users` first, then sync any required projections.

### Team Membership And Role

- Canonical authority: `team_members`
- Primary fields: team membership, team role, active/inactive membership state
- Key code:
  - `angular/src/app/core/services/team-membership.service.ts`
  - `netlify/functions/utils/role-sets.js`
  - `docs/ROLE_AUTHORIZATION_MODEL.md`

Rules:
- Team role and active team membership come from `team_members`.
- Frontend guards, navigation, and backend authorization must align to the same role sets.
- Any user-wide role lookup that ignores active membership is a drift risk.

### Roster Projection

- Canonical write authority: `users` + `team_members`
- Projection layer: `team_players`
- Primary consumer: roster and player-list surfaces
- Key code:
  - `angular/src/app/features/roster/roster.service.ts`
  - `angular/src/app/features/settings/services/settings-save-settings.service.ts`
  - `angular/src/app/features/team/services/team-invitation-data.service.ts`

Rules:
- `team_players` is a roster-facing projection, not the primary identity authority.
- When a player joins, switches teams, or updates profile data, roster projections must sync from canonical sources.
- If both `team_members` and `team_players` exist, merge using `user_id`.

### Training Preferences

- Canonical authority: `athlete_training_config` and `/api/player-settings`
- Supporting preference layer: `user_preferences`
- Key code:
  - `angular/src/app/features/onboarding/onboarding.component.ts`
  - `angular/src/app/features/training/daily-protocol/components/player-settings-dialog.component.ts`
  - `netlify/functions/player-settings.js`

Rules:
- Onboarding can seed defaults, but in-app settings must converge on the player-settings contract.
- `user_preferences` can store preference metadata, but daily training behavior should read from player-settings or training config.

### Continuity Signals

- Canonical authority: persisted continuity tables and services
- Current shared read model: `ContinuityIndicatorsService`
- Key code:
  - `angular/src/app/core/services/continuity-indicators.service.ts`
  - `angular/src/app/features/today/today.component.ts`
  - `angular/src/app/features/dashboard/player-dashboard.component.ts`
  - `docs/DATA_CONTINUITY_MODEL.md`

Rules:
- Dashboard, Today, and coach continuity surfaces should consume one continuity model.
- Travel, recovery, and readiness warnings must not be recomputed differently by route.

### Readiness, Wellness & Load

- **Canonical authority: the server.** `netlify/functions/calc-readiness.js` is the
  only place readiness is scored, cut-points applied, suggestion chosen, and the
  calibration note written. ACWR (acute:chronic load) used for prescription is
  also server-canonical (game-proximity aware).
- **Preferred read model:** `ReadinessService` (`core/services/readiness.service.ts`)
  — a thin read-through to `/api/calc-readiness` + `/api/readiness-history`.
  Clients read `current().score / level / suggestion / acwr / calibrationNote`
  directly off the server response and never recompute them.
- **Not competing scores (verified 2026-05-29):**
  - `wellness.service.getWellnessScore()` is a labelled *wellness average* (a
    sub-signal), and already defers to `ReadinessService` for the real score.
  - `next-gen-metrics.service` *fetches* a server preview (no client scoring).
- **Drift watch:** `load-monitoring.service` computes load/ACWR **client-side**
  (`calculateInternalLoad` / `calculateExternalLoad` / `calculateWellnessFactor`).
  This must stay an in-session aid only and must not become a second readiness/ACWR
  authority. Consolidate or clearly fence it when its screens are rebuilt.

Rules:
- One readiness/ACWR authority: the server. Clients are read-through.
- No route may recompute a readiness score or ACWR for display; read the server values.

### Travel Recovery

- Canonical authority: `athlete_travel_log`
- Local interaction layer: `TravelRecoveryService` signals
- Key code:
  - `angular/src/app/core/services/travel-recovery.service.ts`
  - `angular/src/app/features/travel/travel-recovery/travel-recovery.component.ts`

Rules:
- Local signal state is UI state only.
- Active travel recovery used elsewhere in the app must be restored from persisted travel data.

### Tournament Day State

- Canonical authority: `tournament_day_plans`
- Supporting persisted telemetry: hydration/tournament nutrition logs
- Key code:
  - `angular/src/app/features/game/tournament-nutrition/tournament-nutrition-state.service.ts`
  - `angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.ts`
  - `database/migrations/20260314103000_create_tournament_day_plans.sql`

Rules:
- Browser `localStorage` can be a migration or offline fallback, not the long-term authority.
- Tournament state must be keyed by real user/team/tournament context.

### Notifications And Coach Inbox

- Canonical authority: backend notification/inbox endpoints
- Read surfaces: coach dashboard, coach inbox, activity feed
- Key code:
  - `angular/src/app/features/coach/coach-inbox/coach-inbox.component.ts`
  - `angular/src/app/features/dashboard/coach-dashboard.component.ts`
  - `netlify/functions/coach.js`

Rules:
- UI toasts alone are not workflow completion.
- Coach messaging, access requests, and inbox actions should terminate in persisted backend state.

### Authorization

- Canonical authority: shared backend role sets plus active membership checks
- Frontend enforcement: route guards and team membership service
- Key code:
  - `netlify/functions/utils/role-sets.js`
  - `netlify/functions/utils/authorization-guard.js`
  - `angular/src/app/core/guards/team-role.guard.ts`
  - `docs/ROLE_AUTHORIZATION_MODEL.md`

Rules:
- Backend is the final enforcement layer.
- Frontend should mirror capability rules to avoid misleading access.
- Coarse generic role models must not override the team role model.

### Design Tokens

> **Being rebuilt (static-first).** The previous SCSS token system and UI design
> docs were removed in the front-end demolition. The new single source is being
> authored statically as one `redesign/ground-zero/_shared/tokens.css` + a
> component gallery, then promoted to `angular/src/scss/tokens/` during the port
> (Phase C/E). Until then, `angular/src/styles.scss` holds only the cascade
> layer order + a dark canvas.

- Canonical authority (target): one `tokens.css` design system, no competing families
- Key code (current): `angular/src/styles.scss`, `angular/src/app/theme/flagfit-preset.ts`

Rules (carry forward into the rebuild):
- Semantic UI decisions flow from tokenized design rules, not one-off component overrides.
- One canonical token per concept — no parallel or duplicate token families.
- PrimeNG theme and wrappers consume the same token system rather than inventing parallel palettes or spacing scales; theme via tokens + the `pt` API, no `::ng-deep`.

## Drift Register

### High Risk

- `users`, `team_members`, and `team_players` still coexist across roster-related reads.
- Some coach and staff flows still rely on handoff conventions instead of fully shared context contracts.

### Medium Risk

- Some feature modules still use local placeholder success states for export/share flows.
- Team-context routing is more consistent now, but query-param conventions are not centrally documented in code.

### Low Risk

- Docs index and route map exist, but discovery still depends on knowing the repo layout already.

## Enforcement Checklist

Before adding or changing a feature:

1. Identify the canonical write authority.
2. Identify the preferred read model.
3. Decide whether any projection layer is required.
4. Document cross-surface dependencies if the domain affects multiple routes.
5. Avoid adding a second authority just to simplify one component.

## Related Docs

- `docs/DATA_CONTINUITY_MODEL.md`
- `docs/ROLE_AUTHORIZATION_MODEL.md`
- `docs/REPO_DISCOVERY_GUIDE.md`
