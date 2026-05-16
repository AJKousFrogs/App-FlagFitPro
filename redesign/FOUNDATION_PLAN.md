# FlagFit Pro — Design System Foundation Plan

**Date:** 2026-05-16
**Purpose:** Concrete plan for building the new design system *into* the Angular app so every page redesign that follows uses the same primitives. Before we touch any page, we ship these components and patterns.

---

## Why foundation first

If we redesign one page at a time without foundations, we'll write the hero metric pattern fifteen different ways. The whole reason for a design system is that page #15 should be 80% faster than page #1.

The mockups in `mockups/` are HTML proofs of the patterns. The plan below is how those patterns become Angular code other components can use.

---

## What lives in the design system today (already there)

Your `design-system-tokens.scss` is mature. We're **not** rebuilding it. We're adding patterns *on top of* the tokens.

Existing shared primitives (in `angular/src/app/shared/components/`):
- `button/` — solid button component
- `card-shell/` — base card
- `nav-item/`
- `status-tag/`
- `search-input/`

Existing tokens (in `styles/design-system-tokens.scss`):
- Colors (20 canonical + 200+ derived)
- Spacing scale (4pt/8pt)
- Typography (Space Grotesk + Plus Jakarta + JetBrains Mono)
- Radius scale
- Shadow scale
- Breakpoints
- Full dark mode override

What's missing: **the athletic patterns** — hero metrics, broadcast hero cards, bento priority grids, and the chart library.

---

## What we're adding (the foundation)

Six new shared components + one styles module. All under `angular/src/app/shared/components/` so any page can import them.

### 1. `<ff-hero-metric>` — the WHOOP-style hero

**Path:** `shared/components/hero-metric/hero-metric.component.ts`

**Inputs:**
```typescript
@Input() eyebrow!: string;           // "TODAY'S ACWR"
@Input() value!: string | number;    // "1.42"
@Input() unit?: string;              // "ratio" (optional small label)
@Input() context?: string;           // one-line plain English
@Input() badge?: { text: string; tone: 'ok' | 'warn' | 'danger' | 'info' };
@Input() actions?: TemplateRef<unknown>; // CTAs slot
@Input() visual?: TemplateRef<unknown>;  // optional left visual (gauge, ring)
```

**Used on:** Player dashboard, Coach dashboard, Analytics, ACWR, Performance Tracking, Profile, every page that needs a hero metric.

**Replaces:** Inline custom hero implementations across all pages.

---

### 2. `<ff-broadcast-card>` — the dark, dramatic context card

**Path:** `shared/components/broadcast-card/broadcast-card.component.ts`

The "Next Game" card on the coach dashboard mockup. Dark gradient, accent eyebrow, large headline, KPI strip, optional right-side countdown / aside.

**Inputs:**
```typescript
@Input() eyebrow!: string;
@Input() title!: string;
@Input() subtitle?: string;
@Input() kpis?: Array<{ label: string; value: string; tone?: 'ok' | 'warn' | 'danger' }>;
@Input() aside?: TemplateRef<unknown>;
```

**Used on:** Coach dashboard (next game), Practice planner (next session), Scouting (next opponent), Tournament (next event).

**Replaces:** Bespoke "next thing" cards on 4+ pages.

---

### 3. `<ff-status-strip>` — 4-tile squad/team-health row

**Path:** `shared/components/status-strip/status-strip.component.ts`

The 4-tile color-coded row from the coach dashboard mockup. Single component fed an array.

**Inputs:**
```typescript
@Input() tiles: Array<{
  label: string;
  value: string | number;
  unit?: string;
  caption?: string;
  tone: 'ok' | 'warn' | 'danger' | 'info' | 'neutral';
}> = [];
```

**Used on:** Coach dashboard, Roster overview, Analytics, Injury management.

**Replaces:** 4 different "summary stats" implementations.

---

### 4. `<ff-action-card>` — clickable primary/secondary action tile

**Path:** `shared/components/action-card/action-card.component.ts`

The 3-tile action grid from the player dashboard mockup. One primary (accent gradient), siblings ghost.

**Inputs:**
```typescript
@Input() title!: string;
@Input() subtitle?: string;
@Input() icon?: string;
@Input() variant: 'primary' | 'ghost' = 'ghost';
@Input() disabled = false;
@Output() action = new EventEmitter<void>();
```

**Used on:** Player dashboard, Today's Practice, Settings hub, anywhere with a "what to do next" grid.

---

### 5. `<ff-bento-grid>` + `[ffSpan]` directive

**Path:** `shared/components/bento-grid/bento-grid.component.ts` + `bento-grid/ff-span.directive.ts`

Drop-in replacement for the current ad-hoc grid usage. Enforces the 12-col priority grid + the auto-stack-on-mobile rule.

**Usage:**
```html
<ff-bento-grid>
  <ff-hero-metric ffSpan="12" ... />
  <ff-broadcast-card ffSpan="8" ... />
  <some-side-thing ffSpan="4" ... />
</ff-bento-grid>
```

**Replaces:** The many custom `.bento-grid` and CSS grid implementations in pages.

---

### 6. The chart library — `<ff-chart-*>` family

**Path:** `shared/components/charts/`

This is the big one. Twelve components, one per chart in `mockup-charts.html`. Each one is a thin Angular wrapper:

| Component | Implementation | LOC est. |
|-----------|---------------|----------|
| `<ff-chart-gauge>` (#01) | Pure SVG | 80 |
| `<ff-chart-sparkline>` (#02) | Pure SVG | 60 |
| `<ff-chart-workload>` (#03) | Chart.js | 120 |
| `<ff-chart-heatmap>` (#04) | D3 | 140 |
| `<ff-chart-pace>` (#05) | Chart.js | 100 |
| `<ff-chart-hr-zones>` (#06) | Pure SVG | 100 |
| `<ff-chart-sleep>` (#07) | Chart.js | 110 |
| `<ff-chart-beeswarm>` (#08) | D3 | 130 |
| `<ff-chart-field-heatmap>` (#09) | D3 + SVG | 180 |
| `<ff-chart-route-tree>` (#10) | Pure SVG | 120 |
| `<ff-chart-radar>` (#11) | Pure SVG | 110 |
| `<ff-chart-game-progression>` (#12) | Chart.js | 100 |

**Why this split:** Chart.js for proper time-series interactivity (already in `package.json`). Pure SVG for static visual primitives (no library dep). D3 (new) for spatial/distribution charts where its scales/layouts save real time.

Each chart component:
- Takes a typed `data` input
- Reads colors/tokens from CSS vars (so dark/light/theme changes Just Work)
- Emits hover/click events for interactivity
- Has a `[loading]` state and `[empty]` state baked in
- Ships with a Storybook story (you already use Storybook)

---

### 7. New SCSS module — `_athletic-patterns.scss`

**Path:** `angular/src/styles/_athletic-patterns.scss`

The CSS for the patterns above plus the dark-default rule for athletic surfaces:

```scss
// athletic surfaces — dashboards, analytics, game-tracker, film-room
[data-surface="athletic"] {
  --bg-0: #0A0B0D;
  --bg-1: #14161A;
  --text-0: #F5F6F7;
  --accent: #00E07A;
  // ... rest mirrors mockups/_tokens.css
}
```

**Used by:** Slap `data-surface="athletic"` on the route shell for any page that should default to dark.

---

## Sprint plan (4 sprints, 2 weeks each — adjust to your pace)

### Sprint 1 — Foundation primitives (the no-page-touching sprint)

**Goal:** Ship the 6 shared components + the SCSS module. No page redesigns. Storybook stories for every component.

**Deliverables:**
1. `<ff-hero-metric>` + Storybook story
2. `<ff-broadcast-card>` + story
3. `<ff-status-strip>` + story
4. `<ff-action-card>` + story
5. `<ff-bento-grid>` + `[ffSpan]` + story
6. `_athletic-patterns.scss` integrated into the global styles
7. Logo color fix: SVG indigo `#6366f1` → green `#00A85C`

**Definition of done:** A Storybook page where you can browse all 6 components in light + dark mode, with realistic data. No Angular feature page changes yet.

**Why this sprint matters:** Every later sprint is faster because of this one. Without it, the redesign degrades into 15 bespoke implementations.

---

### Sprint 2 — Chart library

**Goal:** Ship all 12 chart components.

**Deliverables:**
1. All 12 `<ff-chart-*>` components (~1500 LOC total — small, the mockups proved the markup)
2. Storybook stories with example data for each
3. Add `d3` to `package.json` (smallest scope possible — only the modules we use)
4. Wire Chart.js theme to CSS vars (so dark/light flips automatically)

**Definition of done:** A "Chart Library" Storybook section that mirrors `mockup-charts.html`. Each chart accepts typed input data and renders identically to the mockup.

---

### Sprint 3 — Foundation cleanup (the "fix-first" items from the matrix)

**Goal:** Knock down the 4 highest-impact tech debt items so the page sprints don't grind.

**Deliverables:**
1. Split `flag-football-performance-system.service.ts` (1650 lines → 4-5 focused services)
2. Consolidate 7 training services into `unified-training.service.ts`
3. Fix the two "CLEANUP REQUIRED" canonical pages (ACWR Dashboard + Training) — strip PrimeNG overrides, replace raw values with tokens
4. Verify the 4 low-backend-confidence pages (coach-analytics, scouting-reports, injury-management, ai-scheduler) — confirm or build the API

**Why before page redesigns:** Sprint 4 will touch the player dashboard. Player dashboard imports training services. If we don't split them first, we're refactoring while we redesign — twice the work, twice the risk.

---

### Sprint 4 — P0 page redesigns

**Goal:** Ship the three highest-leverage pages using the new foundation.

**Deliverables:**
1. **Landing page** (REBUILD using `mockup-landing.html`) — zero backend risk, highest SaaS-positioning value
2. **Player dashboard** (REBUILD using `mockup-player-dashboard.html`) — kill duplicates, hero readiness ring
3. **Coach dashboard** (REBUILD using `mockup-coach-dashboard.html`) — broadcast hero, status strip, mobile-first roster

Each one composed of:
- 1× `<ff-hero-metric>` or `<ff-broadcast-card>`
- 1× `<ff-status-strip>`
- N× `<ff-action-card>` and `<ff-chart-*>`
- All inside `<ff-bento-grid>`

**Definition of done:** All 3 pages live behind a feature flag. A/B-able. Mobile-tested.

---

### Sprint 5+ — Rolling redesigns (no longer foundation work)

After Sprint 4, every other page redesign is a small PR because the primitives exist. The matrix tells you what's POLISH vs REBUILD vs WIRE.

**Suggested order from the matrix:**
- Sprint 5: Analytics + ACWR Dashboard (REBUILD + POLISH)
- Sprint 6: Roster polish + Performance Tracking REBUILD
- Sprint 7: Coach Analytics WIRE + REBUILD, Scouting Reports WIRE + REBUILD
- Sprint 8: Tournament Management REBUILD, Practice Planner POLISH + WIRE
- Sprint 9-10: Polish sweep across remaining P2 pages (most fit in pairs per sprint)

---

## Concrete file layout for Sprint 1

```
angular/src/app/shared/components/
  hero-metric/
    hero-metric.component.ts
    hero-metric.component.html
    hero-metric.component.scss
    hero-metric.component.spec.ts
    hero-metric.stories.ts
    index.ts
  broadcast-card/
    ... (same shape)
  status-strip/
    ...
  action-card/
    ...
  bento-grid/
    bento-grid.component.ts
    ff-span.directive.ts
    ...
  charts/
    (added in Sprint 2)
```

Add a barrel re-export in `shared/components/index.ts` so pages import from one place:

```typescript
import { HeroMetricComponent, BroadcastCardComponent, BentoGridComponent } from '@app/shared/components';
```

---

## Risk register

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing pages have inline patterns that conflict with new components | High | Don't migrate old pages in Sprints 1-3. Foundation pages ship to Storybook only. |
| PrimeNG components in current pages override our tokens | Medium | Sprint 3 fixes the two "CLEANUP REQUIRED" pages first as the canonical example. |
| Chart library bundle size grows | Medium | Use Chart.js tree-shaking. Import only the D3 sub-modules we need (`d3-scale`, `d3-shape`, `d3-force` for beeswarm). |
| Team builds new pages off old patterns mid-sprint | Medium | Linting rule + design-review checkpoint: "Did you use `<ff-hero-metric>`? If not, why?" |
| Mobile testing reveals broken bento-grid | Low | Storybook viewport addon — test 375px, 768px, 1280px before merge. |

---

## What you should commit to before Sprint 1 starts

Three decisions that block everything:

1. **Logo color.** Indigo or green? (Recommend green — matches accent.)
2. **Dark-by-default surfaces.** Yes/no? (Recommend yes for dashboards, analytics, game-tracker. Light stays for settings, help, knowledge base.)
3. **PrimeNG retention.** Keep it or migrate away? (Recommend keep — the overrides are minor and PrimeNG handles a lot of complex interactions you'd otherwise rebuild.)

Once those are locked, Sprint 1 starts with no blockers.

---

## Definition of "the foundation is shipped"

You'll know we got it right when:

- A new page can be assembled in <100 lines of HTML by composing the shared components
- A dark/light theme flip happens via one attribute change, no per-component edits
- The next coach (yourself) building the redesigned analytics page doesn't write CSS for the hero — they use `<ff-hero-metric>`
- The charts in the new analytics page look identical to `mockup-charts.html`

When all four are true, the design system is real and the rest of the redesign is just typing.
