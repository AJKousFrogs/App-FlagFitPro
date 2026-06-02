# Phase B — Wireframes & UX (athlete-first)

Static, lo-fi wireframes + the data/UX contract behind them. **No color/styling
here** — structure, hierarchy, content, copy, CTA placement, and the exact data
wiring. Visual language is locked separately in Phase C (`tokens.css` + gallery).

**`UX_RULES.md`** — the cross-cutting design laws (answer-first, one winning card,
metric literacy, nutrition-as-food, back-nav, honest states). Read first; they
govern every screen.

Read in this order:

1. **`IA_AND_PAGE_INVENTORY.md`** — the full page audit (every route), the
   proposed athlete-first sitemap, and keep / cut / merge decisions.
2. **`ENGINE_MESSAGING_AND_WIRING.md`** — for every athlete-facing surface: which
   CTA calls which endpoint/RPC, which table it saves to, and **what the engine
   actually says to the athlete** (ACWR bands + copy, readiness, today's
   prescription, safety overrides, empty states). This is the single source for
   "what to wire and how to save real data."
3. **`COMPONENT_INVENTORY.md`** — the component list the Phase C gallery must
   contain (every screen is assembled only from these).
4. **`WEATHER_LOGIC.md`** — weather as a constraint layer on the prescription
   (wet grass → no sprints; heat → no outdoor plyo; lightning → stop), the
   threshold matrix, the heat→ACWR/RPE coupling, and the engine change.
6. **`SUPPLEMENTS_LOGIC.md`** — evidence-based supplements as a daily log (in the
   Wellness check-in) + an engine context layer: recommend proportional to load,
   flag the caffeine→RPE confound, never silently rewrite ACWR.
5. **`SEASON_LOGIC.md`** — per-athlete macro periodization (off/pre/in-season +
   transition months drive the baseline emphasis; off-season = strength &
   conditioning), how it combines with the spine's event micro-phases, storage on
   `athlete_training_config.season_calendar`, and the engine change.
4. **`wireframes/`** — browsable lo-fi HTML. Open `wireframes/index.html`.

## Scope of this cut

Core athlete journey first (per the rebuild order): **shell → onboarding → today
→ overview → wellness check-in → training → stats → profile/settings.** The full
inventory below maps every remaining screen so nothing is lost; secondary screens
are wireframed after the core journey is approved.

## Hard rules carried from the plan

- One component vocabulary — screens use only gallery components (Phase C).
- Every CTA in a wireframe is annotated with its real endpoint + table. If a CTA
  has no backend write path, it's flagged **⚠ NO-WIRE** (see broken paths).
- The engine is canonical (server). The UI shows server ACWR/readiness, never
  re-derives them. Missing data → explicit empty state, never a fake number.
- Club context: **male athletes 16+**. No youth/women/parent surfaces.
