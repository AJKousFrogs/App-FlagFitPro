# FlagFit Pro — Backlog

Concise, living list of un-built work. Replaces the two one-off analysis docs
(`UIUX_MODERNIZATION_AUDIT.md`, `V2_PROPOSAL.md`, both retired 2026-07-07 once
their actionable items were done or captured here). Ground truth for what's LIVE
stays in `SOURCE_OF_TRUTH.md` §4; this is only the not-yet-built.

## Already shipped (do not rebuild)

Tournament Mode V2.0–V2.4 landed: `event_games` per-game timeline + gap engine
(`tournament-plan.service.ts`), travel legs (`athlete_travel_log`/`event-travel.js`),
game-day caffeine timing, multi-tier competition calendar + global climate, QB
arm-care lane wired. From the UI/UX audit: dead viz deps removed, `standalone:true`
cleanup, shared `event.utils`, Stats "Performance" honest empty state, Today
readiness card tappable, short-viewport hero collapse. Shared chart components:
`app-acwr-trend` (was duplicated in acwr + stats) and `app-readiness-trend`
(unified, `days`/`autoLoad` inputs). Shared `app-topbar` (bell + avatar were
copy-pasted into 11 screens; left side projected, one implementation now).

## UI — bounded, safe, still worth doing

- **Coach roster heatmap grid** — roster × last-7-days band-colored cells (CSS grid,
  no libs). Data already exists on the staff-roster Cycle tab (`readinessTrend[7]`,
  `acwr` per athlete); this consolidates the two partial overviews into one. Marginal
  now that the Cycle tab already renders trend micro-bars — do it when coach density
  is revisited.
- **Chart tap-to-scrub** — the shared `app-acwr-trend` / `app-readiness-trend` are now
  single implementations (extraction shipped); the remaining un-built polish is a
  tap-to-scrub interaction to read a specific day's value off the sparkline.
- **Staff athlete-detail parity** — coach view is 2 static chips; embed the trend
  charts for consented athletes. `app-acwr-trend` is already presentational (takes
  `points`/`lastX`/`lastY`), so the ACWR half is a straight reuse; the readiness half
  needs a presentational variant (today's `app-readiness-trend` reads the logged-in
  user's `ReadinessService.history()`, not an arbitrary athlete's) plus a consent-gated
  fetch of the athlete's series (`/api/monitoring-report?athleteId=` already returns it).
- **Daily-load calendar heatmap** (Stats + coach) — month grid colored by daily AU
  from the `calc-readiness` daily-load map; answers "when did the ACWR spike," not
  just "am I safe." CSS grid + 4-step ramp.
- Touch-target axe assertions (`@axe-core/playwright` already installed); gameday
  high-contrast outdoor toggle.

## Product / engine — larger future features (from the V2 proposal)

- **Coach-tunable engine constants UI** — wire the curated-but-unwired rule tables
  (`taper_rules`, `weather_substitution_rules`, `contraindication_rules`,
  `prescription_templates`) into a staff settings screen; the engine currently uses
  hardcoded JS constants (see SOURCE_OF_TRUTH §6). `calibration_logs` shows
  estimate-vs-actual. **Highest-leverage backend win** — the data is already live.
- **Season plan builder (coach)** — reverse-periodize mesocycles from priority
  tournaments onto the live `team_season_phases` table; add event A/B/C `priority`
  column that the taper engine branches on.
- **Coach tournament day board** — team game timeline × roster readiness heat-strip,
  live body flags (realtime infra exists), one-tap game re-time, rotation/overexposure
  hints.
- **Offline outbound queue at venues (P0 for Tournament Mode trust)** — sports halls
  have poor connectivity; queue hydration/game/wellness writes with visible sync
  state, pre-cache the day plan the evening before.
- **Per-game actuals close-loop** — 30-sec post-game log (minutes/RPE/flags) → one row
  per `event_games.id`, feeding real ACWR load (keep 350 AU/game as fallback) and the
  Merlin down-regulation loop; self-tune the constant via `calibration_logs`.
- **`fueling_products` reference table** + supplement timing depth (caffeine-for-
  brackets with sleep-cutoff guard, electrolytes promoted to timeline, pack-list
  generator).
- **Knowledge base V2** — `knowledge_context_tags` for just-in-time cards on engine
  outputs (max 1/screen, dismissible), ~10-entry tournament pack, **sl-SI localization**
  (team is Slovenian — KB paragraphs + timeline strings first).
- **Calculation upgrades** — monotony/strain (Foster) surfaced beside ACWR (partly in
  `acwr.service` already); a _positive_ readiness branch (sustained high readiness +
  under-plan load → nudge volume up within phase caps — currently subtractive-only,
  and an engine change carries the periodization preserve-list); sleep-debt →
  tournament-eve card; optional pre/post weigh-in sweat-rate; per-number "basis"
  labels on the timeline (estimated vs logged).
- **Session library breadth** — flag-specific speed/agility, tempo/conditioning, plyo
  progression, hotel/no-equipment variants, micro-dosing days (all through the
  existing COMPOSE intent→exercise path; content lives in the exercise library).

## Explicit "don't build" (preserved so nobody wastes effort)

- **3D field/formation visualizers, field-overlay heatmaps (deck.gl/d3-hexbin),
  isometric spacing views** — the schema has **no positional/GPS/tracking data**;
  nothing to render. Revisit only if wearable capture is ever bought — as a data
  pipeline first, not a UI project.
- **Radar/spider charts, readiness×performance correlation matrices** — per-athlete n
  is too small; they'd render noise with authority (violates the no-fabrication laws).
- **Replacing the hand-rolled SVG micro-charts with Chart.js/ECharts** — strictly
  worse on bundle, a11y, and token theming; the SVG approach is the deliberate standard.
