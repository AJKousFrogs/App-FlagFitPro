# FlagFit Pro — UI/UX Modernization Audit

**Date:** 2026-07-06 · **Auditor:** Claude Code (senior product-design-engineer lens: Catapult / Zone7 / Whoop-class sports-performance UI)
**Verified against:** live codebase on `main` (Angular 21.2 zoneless + signals), `docs/SOURCE_OF_TRUTH.md`, live Supabase schema (project `grfjmnjpzvknmsxrwesx`).

---

## 0. Corrections to the audit brief (read first)

The brief assumed a stack this repo does not have. Every recommendation below is fitted to the **real** stack:

| Brief assumed                                             | Reality (verified)                                                                                                                                                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tailwind v4                                               | Custom SCSS token design system (`scss/tokens/_tokens.scss`, 8px spacing scale, locked dark-default palette, WCAG-AA e2e contrast tests)                                                                                        |
| Spartan/ui components                                     | House components (`app-skeleton`, `app-avatar`, `app-yt-video`, cards/bands/chips in `scss/system/_system.scss`)                                                                                                                |
| NgRx SignalStore                                          | Plain Angular signals + services. No store library, and none needed at this app's size                                                                                                                                          |
| React surfaces (visx)                                     | None. Angular-only                                                                                                                                                                                                              |
| "Angular v22 upgrade blockers: Storybook, lucide-angular" | On Angular **21.2**. Storybook `10.4.6` and `lucide-angular ^1.0.0` are present — treat as **peer-dep watch items at upgrade time**, not current blockers (future peer ranges can't be verified today)                          |
| Charts presumably library-based                           | **Chart.js 4.5.1 is installed but has zero imports anywhere in the repo** — all charts are hand-rolled inline SVG. `html2canvas` and `jspdf` are also zero-reference production deps                                            |
| Fabricated readiness/ACWR data surfacing as authoritative | Largely already solved: server-canonical engine (SOT Spec Law 6/7), honest empty states ("null ≠ low — we never show a fake under-training"), guarded 21-day ACWR build-up messaging. Remaining gaps are small and listed in §4 |

One structural fact that decides the whole 3D/heatmap conversation: **the 187-table schema contains no positional, GPS, or tracking data of any kind** (`movement_pattern` is a text label on exercises). Field-position heatmaps, route-concentration overlays, coverage-gap views, and 3D formation visualizers have **no data to feed them** and would require building a data-capture pipeline first. They are out of scope until that exists (see §6).

---

## 1. Executive summary — top 5 by (decision impact × implementation cost)

1. **Coach roster heatmap grid** (M) — The staff roster renders per-athlete readiness/ACWR as text chips in a vertical list; the Training Cycle tab already fetches a 7-day `readinessTrend` array per athlete and renders it as micro bar charts. Generalize that into a **roster × last-7-days grid of band-colored cells** (CSS grid, zero libraries): athletes as rows, days as columns, cell color = readiness band, today's ACWR band as the trailing column. A coach scans 20 athletes for the outlier in ~3 seconds instead of reading 40 chips. This is the single highest-leverage change in the app.
2. **Staff athlete-detail parity** (S) — The coach view of an athlete (`staff/athlete-detail`, coach case) shows exactly two static chips (readiness band, ACWR band) — _less_ information than the athlete's own Today screen. Embed the already-existing trend components (`app-readiness-trend` SVG + the ACWR sweet-spot chart) for consented athletes. Data and components both exist; this is wiring.
3. **Extract one shared `app-trend-chart` component** (S) — The ACWR sweet-spot SVG block is duplicated verbatim in `acwr.component.html:43-78` and `stats.component.html:36-77`; the readiness line SVG is duplicated between `stats.component.html:107-145` and `readiness-trend.component.ts`. Four hand-maintained copies of the same chart. One component (inputs: points, reference lines/band, color token) kills the drift risk and gives a single place to add tap-to-inspect (see #4 in §4).
4. **Daily-load calendar heatmap** (M) — ACWR is a ratio; it answers "am I safe," not "**when** did the spike happen." A month-grid calendar colored by daily AU from `training_sessions` (data already server-side, incl. injected game loads) answers the question coaches actually ask when the band goes amber. Pure CSS grid + a 4-step color ramp from existing band tokens. Athlete Stats screen first; coach per-athlete view second.
5. **Remove dead viz dependencies & lock the chart strategy** (S) — Uninstall `chart.js`, `html2canvas`, `jspdf` (zero references; pure supply-chain/audit surface). Adopt the hand-rolled-SVG approach as the _deliberate_ standard: it is zoneless-native, token-styled, ~0 KB, and already better-suited to glanceable micro-charts than any library default. Libraries re-enter only if a genuinely new chart class appears (see §7).

---

## 2. Per-screen findings

Screens read in full: Today, Stats, ACWR, Wellness*, Training*, staff Roster, staff Athlete-detail, Shell, routes. (\* = structure verified via SOT ledger + spot-checks; the house pattern — cards/bands/chips, skeleton loaders, guarded empty states — is uniform.)

| Screen                                                                                                                            | Primary user | Finding                                                                                                                                                                        | Recommendation                                                                                                                                                               | Effort |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **Today**                                                                                                                         | Athlete      | Answer-first ordering is right (prescription hero → fuel → diagnostics). Heavy inline `style=""` blocks (lines 36–41, 117–123, 131–147…) bypass the design-system lint surface | Move inline styles into component SCSS; no visual change                                                                                                                     | S      |
| **Today**                                                                                                                         | Athlete      | Readiness card "not logged today" state: only the small "breakdown →" link navigates                                                                                           | Make the whole card tappable → `/wellness` (one-handed, gloved use)                                                                                                          | S      |
| **Stats**                                                                                                                         | Athlete      | "Performance" section is a **permanent dead-end empty state** — "Log a combine test…" with no logging affordance anywhere in the app                                           | Either wire a minimal combine-test log form (→ `performance_metrics`, table is LIVE) or drop the section until the feature exists. A CTA that can't be acted on erodes trust | M / S  |
| **Stats, ACWR**                                                                                                                   | Athlete      | Decorative `screen-hero` JPGs push the actual answer below the fold on small phones                                                                                            | Collapse/hide hero images under a viewport-height media query (`@media (max-height: 700px)`)                                                                                 | S      |
| **ACWR**                                                                                                                          | Athlete      | Strong screen: ratio + band + verdict + monotony/strain + honest disclaimer. Chart is duplicated from Stats (see §1-3)                                                         | Consolidate into shared component; add daily-load calendar below the ratio (§1-4)                                                                                            | S–M    |
| **staff/Roster (Athletes tab)**                                                                                                   | Coach        | Chip-list scanning: 2 text bands per athlete × 20 athletes                                                                                                                     | Roster heatmap grid (§1-1). Keep the list as the accessible fallback / screen-reader table semantics                                                                         | M      |
| **staff/Roster (Injuries tab)**                                                                                                   | Coach/Physio | Good: snapshot chips + per-injury rows with today's soreness/readiness                                                                                                         | Sort severe-first (verify), add days-since-report; no redesign needed                                                                                                        | S      |
| **staff/Roster (Cycle tab)**                                                                                                      | Coach        | Already has per-athlete 7-day trend micro-bars — the germ of §1-1                                                                                                              | Fold into the heatmap grid so there is one roster overview, not two partial ones                                                                                             | M      |
| **staff/Athlete-detail (coach)**                                                                                                  | Coach        | Two static chips; no trend, no history                                                                                                                                         | Embed existing readiness-trend + ACWR chart components (§1-2)                                                                                                                | S      |
| **staff/Athlete-detail (physio/psych/nutrition)**                                                                                 | Staff        | Solid inline write flows (RTP slider, injury log, assessment). Chip-buttons used as selectors — verify ≥44px touch targets                                                     | Add a touch-target assertion to the existing axe/Playwright suite                                                                                                            | S      |
| **Wellness**                                                                                                                      | Athlete      | 433-line check-in form; prefill law (SOT §5b) implemented                                                                                                                      | No structural change. Ensure slider thumbs meet 44px; test one-handed reach on the region selector                                                                           | S      |
| **Shell**                                                                                                                         | Both         | 5-tab bottom nav + FAB (phone), sidebar (desktop) — correct pattern. Topbar (bell + avatar) is copy-pasted into every screen template                                          | Extract `app-topbar`; one place for future coach-mode affordances                                                                                                            | S      |
| **Gameday**                                                                                                                       | Athlete      | Trackside screen — the one place sunlight legibility matters most                                                                                                              | Consider a high-contrast variant of band colors on this screen only (tokens already support it); test outdoors before investing more                                         | S–M    |
| **Chat (Merlin), Knowledge, Schedule, Competition, Supplements, Settings, Profile, Achievements, Notifications, RTP, Sleep-debt** | Athlete      | Consistent house style; no data-viz surface; no findings that outrank the top 5                                                                                                | —                                                                                                                                                                            | —      |

---

## 3. Visualization redesign specs

### 3.1 Roster readiness heatmap grid (coach) — **build**

- **Data:** already returned to the Cycle tab (`athleteName`, `readinessTrend[7]`, `acwr`, `latestReadiness`); consent-gated server-side (blocked set already enforced in `coach-core.js`).
- **Decision supported:** "who do I pull aside before practice tonight" in one glance.
- **Layout:**
  ```
  Athlete      M  T  W  T  F  S  S   ACWR
  Kovač #7     ▓  ▓  ▓  ▒  ░  ░  ░   ⚠ high
  Novak #12    ▓  ▓  ▓  ▓  ▓  ▓  ▓   ✓ good
  …            (cell = readiness band color; empty cell = not logged, rendered
                as a hollow cell — never a fabricated mid-tone)
  ```
- **Approach:** CSS grid + existing band tokens (`--good/--caution/--danger` + soft variants). No library. Tap a row → athlete detail. Cells get `aria-label="Tue: readiness 82, high"`.
- **Effort:** M (mostly the responsive collapse: on narrow phones show last 3 days + ACWR).

### 3.2 Shared `app-trend-chart` (athlete + staff) — **refactor, then extend**

- Consolidate the 4 SVG copies. Inputs: `points`, `referenceBands` (e.g. sweet-spot rect), `referenceLines` (55/75 or 1.5), `colorToken`.
- Then add **tap-to-scrub**: pointer-down shows a vertical rule + value/date bubble (pure signal state, no library). This is the single biggest micro-UX gap versus Whoop-class apps — current charts are look-only.
- **Effort:** S for extraction, +S for scrub.

### 3.3 Daily-load calendar heatmap (athlete Stats, coach athlete-detail) — **build**

- **Data:** `training_sessions` daily AU (the `calc-readiness` daily-load map already merges logged + estimated game loads server-side — expose it via the existing readiness/ACWR read path rather than recomputing).
- **Decision supported:** locate the spike/gap that moved the ACWR; spot congestion patterns before tournaments.
- **Layout:** standard month grid, 4-step ramp (rest → light → moderate → heavy) from band tokens; competition days get a dot marker. Empty day = hollow, consistent with the no-fabrication law.
- **Approach:** CSS grid; color stepping is a 5-line function — `d3-scale` not even needed.
- **Effort:** M.

### 3.4 Roster sparkline column — **fold into 3.1**, don't build separately.

---

## 4. Interaction & micro-UX

1. **Trust surfaces are already good** — keep the "null ≠ low", "building · need ~21 days", and "not shared" patterns exactly as they are; they are the app's best differentiator. The two residual gaps: the Stats "Performance" dead-end CTA (§2) and making unlogged-state cards fully tappable into the fix-it flow.
2. **Tap-to-inspect on charts** (§3.2) — glanceable is right for the hero; but when a coach _does_ lean in, the chart should answer "what was that dip." Look-only charts stop one question short.
3. **Touch targets:** chips-as-buttons (physio grade selector, psych phase chips, RTP phases) need a verified ≥44×44px hit area; `@axe-core/playwright` is already installed — add the assertion rather than eyeballing.
4. **Optimistic UI:** current busy()/disabled pattern is honest and fine for this write volume. Do **not** add optimistic writes to engine-feeding forms (wellness, session log) — a rolled-back optimistic write that already showed a recalculated plan would violate the server-canonical law.
5. **Coach vs athlete mode:** the split is real (separate shells, guards, routes) but the coach lane is information-_poorer_ than the athlete lane (§1-1/1-2). Fix by raising coach density, not by restyling.
6. **Inline `style=""` debt:** dozens of inline blocks across templates (Today is the worst). They use tokens, so no visual drift — but they're invisible to `stylelint`/design-system checks. Mechanical migration, low risk.

---

## 5. Technical constraints check

- **Zoneless:** hand-rolled SVG bound to signals is the ideal-case pattern — zero change-detection risk. If a library is ever justified: Chart.js works zoneless (zone-agnostic canvas + explicit `update()`), and `d3-scale`/`d3-shape`/`d3-array` are pure functions (safe, tiny). Avoid ngx-charts (historically Zone-coupled) and anything advertising "Angular bindings" without a zoneless story.
- **Bundle budget:** initial 1.75 MB warn / 1.8 MB error; `anyScript` 600 KB error. Everything recommended above adds **0 KB** of vendor code. Three.js (~170 KB gz) or deck.gl (~250 KB+ gz) would fit numerically and still be wrong (§6).
- **Upgrade path:** keep the viz-dependency count at zero so the eventual Angular 22 bump only negotiates Storybook + lucide-angular peer ranges. Removing chart.js/html2canvas/jspdf (§1-5) _shrinks_ that surface today.
- **PWA/offline:** SVG-in-template charts render from cached data with no runtime fetch of chart code — better trackside than any lazy-loaded canvas lib.

---

## 6. Explicit "don't do" list

| Temptation                                            | Why not — specifically here                                                                                                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **3D field / formation visualizer** (Three.js/WebGL)  | No positional data exists in the schema — nothing to render. Flag football with a ~20-man roster; play design happens on a whiteboard. Pure demo-ware plus a permanent 170 KB+ tax and a zoneless integration to babysit |
| **Field-overlay heatmaps** (deck.gl, d3-hexbin)       | Same: no route/coverage/xy data. deck.gl is geo-scale tooling; there is no geo. If positional capture is ever _bought_ (wearables), revisit — as a data-pipeline project first, not a UI project                         |
| **Isometric "field tightness / spacing" view**        | No spacing data. And the honest 2D-vs-3D answer is moot when the dataset is empty                                                                                                                                        |
| **Radar/spider charts for athlete profiles**          | The Performance section is an empty state today — there are not 5 reliable axes per athlete to plot. Radar area distorts perception even with good data; small-multiples beat it when the data eventually exists         |
| **Correlation matrices (readiness × performance)**    | Per-athlete n is a few dozen observations; a matrix would render statistical noise with authority — the exact "fabricated confidence" failure the house rules forbid                                                     |
| **Replacing SVG micro-charts with Chart.js/ECharts**  | Strictly worse: +bundle, canvas a11y regressions vs current `role="img"` + labels, token theming via JS config instead of CSS vars, and a second charting idiom to maintain                                              |
| **Calendar heatmap via a library** (cal-heatmap etc.) | It's a CSS grid with a 4-color ramp. A dependency here is negative value                                                                                                                                                 |

---

## 7. Sequencing

1. **PR 1 (S):** remove dead deps (`chart.js`, `html2canvas`, `jspdf`); extract `app-topbar`; inline-style migration on Today.
2. **PR 2 (S):** extract `app-trend-chart`, swap all four call sites, snapshot-test parity (visual-regression baselines exist).
3. **PR 3 (S):** staff athlete-detail parity — embed trend components in the coach case.
4. **PR 4 (M):** roster heatmap grid (replaces Athletes-tab chip scan; folds in Cycle-tab trend bars).
5. **PR 5 (M):** daily-load calendar heatmap on Stats + coach athlete view; add tap-to-scrub to `app-trend-chart`.
6. **PR 6 (S/M):** Stats "Performance" decision — wire combine-test logging or remove the section; touch-target axe assertions; short-viewport hero collapse.

Each PR must update the SOT §4 Ledger per `docs/SOURCE_OF_TRUTH.md` §8.
