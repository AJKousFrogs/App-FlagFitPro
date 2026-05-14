# Mobile‑First Redesign Proposal — FlagFit Pro

**Status:** Proposal only. No code changed.
**Target inspiration:** MLS app, Microsoft Copilot, Equinox+, Singtel Active Club (dark‑mode, gradient hero, card‑stack body, prominent center FAB in bottom tab bar, oversized stat numerals, image‑rich list rows).
**Working branch:** `claude/mobile-first-redesign-7v7hZ`

---

## 1. What I found in the current codebase

### 1.1 Architecture is already good — the styling is the problem
- Standalone Angular, signals‑first, zoneless, OnPush everywhere (`app.config.ts:55`, 326/327 OnPush per `AUDIT.md`). We do **not** need to rewrite logic; we need to rewrite the surface.
- Existing layout shell is solid: `MainLayoutComponent` already swaps `<app-header>` / `<app-mobile-header>` and renders `<app-bottom-nav>` (`main-layout.component.ts:53‑88`). It triggers a viewport flip at `max-width: 40rem` (`main-layout.component.ts:163`).
- `BottomNavComponent` exists with role‑aware items, a "More" menu, and badge support (`bottom-nav.component.ts:34‑96`). It's only visible below `40rem` (`bottom-nav.component.scss:43‑47`).
- Design tokens are mature: spacing (`--space-*` 8‑pt scale), surfaces, touch targets (`--touch-target-md = 44px`, `--touch-target-lg = 52px`), safe‑area envs, layout maxes (`design-system-tokens.scss:632‑1479`).

### 1.2 The styling is desktop‑first — that is the core problem
- AUDIT.md: **78 `max-width` vs 18 `min-width`** media queries — desktop‑first dialect.
- In `angular/src/app/features/**/*.scss`: **232 `@include respond-to(...)` (max‑width) vs 8 `respond-min/above`**.
- Pattern in `today.component.scss:124‑148` is representative: 3‑col grid declared at the top, then `respond-to(lg)` collapses to 2‑col, then `respond-to(sm)` to 1‑col. Every feature does this.
- Result: mobile is what's left after desktop is shrunk, not what's designed first.

### 1.3 The bottom nav looks fine but doesn't match the reference
- It's a flat 5‑item bar with a "More" sheet. No center FAB, no gradient/glass treatment, no badge dots, no hide‑on‑scroll.
- Touch hit areas come from `--touch-target-md` (44 px). The reference shots use ~64–72 px tall bars with a 56 px protruding center button. Our `--bottom-nav-height = var(--space-16) = 64px` is close but we don't use the protruding FAB pattern.
- It's only mounted at `≤ 40rem`. The reference dark mobile apps keep the same bottom nav up through tablet portrait.

### 1.4 No "hero" pattern on mobile
- Today and dashboards open with a Bento grid, not a gradient hero + headline + KPI strip. The MLS / Equinox screens lead with a tinted/gradient header, a giant number, a small label, then scroll content. None of our pages do that on mobile today.

### 1.5 Other concrete issues I'd fix as part of this
- `today.component.scss` is **1,074 lines** — single‑file blow‑ups are common (`primitives/_dashboard.scss` = 869, `_forms.scss` = 791, `_dialogs.scss` = 718, `_brand-overrides.scss` = 1,515). Mobile rules are scattered.
- `_mobile-responsive.scss`, `_mobile-touch-components.scss`, `_responsive-utilities.scss` and `_mixins.scss` all overlap in scope — we have 3+ places where mobile rules can live, so they live everywhere.
- Bottom nav backdrop‑blur runs at `var(--premium-glass-blur-xl)` on every mobile page — keep, but verify on iOS Safari where heavy blur is a known scroll‑jank source.

---

## 2. Design language for the new look

Aligning with the reference screenshots without inventing a new brand:

| Aspect | Direction |
|---|---|
| Theme | Dark by default on hub/internal routes. Keep `prefers-color-scheme` honoring (we already only honor it in 4 sites; expand). |
| Header | Gradient (brand → surface) hero on top section, 200–280 px tall on mobile, collapsing to a sticky compact bar after scroll. |
| Typography | Display sans (we already alias SF Pro on landing) for hero headlines. Body stays Inter/system. Use **display sizes 2.25rem → 3rem** for the big KPI number. |
| Cards | Rounded `--radius-2xl` (≥ 20 px), darker than page background, 1 px hairline border, soft shadow. Match the MLS match‑card silhouette. |
| Lists | Image‑led 64 px row (thumb left, title + subline + tertiary). |
| Bottom nav | 5 items, dark glass, **center protruding FAB** for the primary action per role (Athlete → Start Today's Practice, Coach → New Session). Hide on scroll‑down, reveal on scroll‑up. |
| Color accents | Keep `--ds-primary-green` as accent; add a brand gradient token (`--gradient-hero-athlete`, `--gradient-hero-coach`). |
| Motion | Reduced‑motion respected (already honored in 69 SCSS blocks). View Transitions API already wired (`_view-transitions.scss`) — use for tab changes. |

These translate to **new tokens**, not new components from scratch. Concretely:

```
--hero-height-mobile: 16rem;
--hero-height-tablet: 20rem;
--card-radius-mobile: var(--radius-2xl);
--bottom-nav-height-mobile: 4.25rem;  /* 68px */
--bottom-nav-fab-size: 3.5rem;        /* 56px */
--gradient-hero-athlete: linear-gradient(180deg, rgba(20, 60, 40, 1) 0%, var(--surface-ground) 70%);
--gradient-hero-coach: linear-gradient(180deg, rgba(60, 20, 40, 1) 0%, var(--surface-ground) 70%);
--kpi-number-size: clamp(2.25rem, 8vw, 3rem);
```

---

## 3. Mobile‑first methodology change (this is the foundation)

The biggest fix is structural: **invert the breakpoint dialect** so mobile is the default and tablet/desktop are progressive enhancements.

**Before (current pattern, 232 occurrences):**
```scss
.today-page.bento-grid {
  grid-template-columns: repeat(3, 1fr);   // desktop default
  @include respond-to(lg) { grid-template-columns: repeat(2, 1fr); }
  @include respond-to(sm) { grid-template-columns: 1fr; }
}
```

**After (mobile‑first):**
```scss
.today-page {
  display: flex;                            // mobile default: vertical stack
  flex-direction: column;
  gap: var(--space-4);
  padding-inline: var(--space-4);

  @include respond-min(md) {                // tablet ≥ 768
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-5);
  }
  @include respond-min(lg) {                // desktop ≥ 1024
    grid-template-columns: repeat(3, 1fr);
  }
}
```

I'll add a `mobile-first-stack($cols-tablet, $cols-desktop)` mixin so feature SCSS is one line.

---

## 4. Phased plan

Each phase is a separate PR, lands behind a feature flag where user‑visible, and ships with Playwright visual‑regression baselines (we already have `e2e:visual:mobile`/`tablet`/desktop projects in `package.json`).

### Phase 0 — Inventory & visual baseline (no behavior change)
**Deliverables**
- Run `npm run e2e:visual:all:update` against `main` to lock the current look.
- Add a redesign tracking board in `MOBILE_FIRST_REDESIGN.md` (this file).
- Tag the 18 highest‑traffic routes (`today`, `player-dashboard`, `coach-dashboard`, `training`, `wellness`, `roster`, `team-chat`, `tournaments`, `performance/insights`, `chat`, `profile`, `settings`, `onboarding`, `landing`, `auth/*`, `reports`).

**Exit:** baseline screenshots committed; route hit‑list approved.

---

### Phase 1 — Tokens & primitives (foundation, no visual diff yet)
**Deliverables**
- Add new tokens to `scss/tokens/design-system-tokens.scss`:
  hero gradients, KPI number size, mobile bottom‑nav height/FAB, card radius mobile.
- Add **two mixins** to `scss/utilities/_mixins.scss`:
  - `@mixin mobile-first-grid($mobile, $tablet, $desktop)` — defaults to 1‑col, expands.
  - `@mixin hero-surface($variant)` — applies gradient, padding, safe‑area top.
- Add new primitives in `scss/components/primitives/`:
  - `_hero.scss` — `<app-page-hero>` (title, eyebrow, KPIs row, action slot).
  - `_kpi.scss` — big‑number stat (matches Active Club "32 KM / 612 MINUTES").
  - `_list-row.scss` — thumb‑led row (matches Equinox class list).
- Stylelint rule: discourage new `respond-to(...)` (max‑width) — warning, not error.

**Exit:** `ng build` passes, visual regression diffs = 0 (nothing consumes the primitives yet).

---

### Phase 2 — Shell: bottom nav + mobile header
**Deliverables**
- New `BottomNavComponent` template & SCSS:
  - 5 slots: 2 left, **center FAB**, 2 right.
  - Center FAB is a role‑aware action (Athlete: pulses to "Start Today's Practice"; Coach: "New Session"; falls back to brand crest like MLS).
  - Hide‑on‑scroll using IntersectionObserver on a sentinel in `main-layout`.
  - Bring nav up through `≤ md` (768 px) — current cutoff `≤ sm` (40 rem) drops the bar too early on tablets in portrait.
- New `MobileHeaderComponent`:
  - Title left, settings/filter icon right, sticky.
  - Optional **hero variant** that the page can opt into via input (`[hero]="true"` + `[gradient]="'athlete' | 'coach'"`).
- `app-shell__page` gets `padding-block-end: calc(var(--bottom-nav-height-mobile) + var(--safe-area-bottom) + var(--space-6))` so content clears the bar (currently relies on each page).
- Sidebar stays for ≥ md tablet landscape and desktop. Add an **icon‑rail collapsed sidebar** for tablet portrait (≥ md and < lg).

**Exit:** Playwright `e2e:visual:mobile` baselines re‑recorded; manual run on iOS Safari + Android Chrome; tab‑bar focus order and `aria-current` checked.

---

### Phase 3 — Convert top 5 routes to mobile‑first
Order by traffic; one route per PR.

1. **Today** (`features/today/`) — hero with today's date + completion %, KPI strip (Exercises / Streak / Recovery), card stack of training blocks, full‑width Start FAB.
2. **Player Dashboard** — hero with athlete name, KPI strip (KM / Minutes / Sessions / Medals — direct Active Club parallel), recent activity feed.
3. **Coach Dashboard** — hero with team name, KPI strip (Practices this week / Avg attendance / Wellness flags), upcoming game card, roster snapshot row.
4. **Training schedule** — sticky day picker (matches MLS "Sunday, Mar 30"), match‑card list per session, segmented control for Week/Month.
5. **Roster** — image‑led row pattern, filter sheet that slides up from bottom (no full‑screen modal).

**Per route:**
- Convert SCSS to mobile‑first using the Phase 1 mixins.
- Replace bespoke bento for the mobile breakpoint with `<app-page-hero>` + vertical stack; keep bento ≥ lg.
- Verify with `e2e:visual:mobile` and `e2e:visual:tablet`.

**Exit:** these 5 routes are the new look on phones, tablets, and desktop.

---

### Phase 4 — Remaining hub routes (8 routes)
Wellness, Chat, Merlin AI, Tournaments, Performance Insights, Reports, Profile, Settings.
Each one is the same recipe as Phase 3 with a per‑PR visual diff.

---

### Phase 5 — Cleanup
- Remove the legacy `_mobile-touch-components.scss` and `_mobile-responsive.scss` duplication; everything mobile lives in `scss/utilities/mobile-first/` after this phase.
- Promote the stylelint warning from Phase 1 to an **error**: new code may not introduce `respond-to(max-width)` for layout (allow it only for hover/pointer media queries).
- Delete dead bento overrides that no longer apply at mobile.
- Re‑measure: target `< 40 max‑width media queries vs > 60 min‑width media queries` after this phase (today: 78 vs 18).

---

## 5. Risk register

| Risk | Mitigation |
|---|---|
| Visual regressions on desktop while we mobile‑first the SCSS | Each phase locks both `e2e:visual` (desktop) and `e2e:visual:mobile` snapshots; PR must show diffs and explain them. |
| Center FAB conflicts with iOS gesture bar | Use `--safe-area-bottom` padding + Playwright check on iPhone 14 viewport. |
| Heavy backdrop‑blur in bottom nav hurts scroll FPS on older iOS | Tune `--premium-glass-blur-xl` down on `.platform-ios.platform-mobile`, or use `@supports not (backdrop-filter: blur(10px))` fallback to a solid surface. |
| 232 desktop‑first rules in features take time to convert | Don't block on a single mega‑PR. Phases 3 and 4 are 13 separate PRs by route. |
| Bottom‑nav extends to ≤ md — sidebar UX changes for tablet | Tablet portrait now has icon‑rail sidebar + bottom nav; tablet landscape uses full sidebar (no bottom nav). Validate on iPad in Playwright. |

---

## 6. What I recommend you say "go" to

Smallest useful starting wedge is **Phase 0 + Phase 1**: it gives us tokens, primitives, and a visual baseline without any user‑visible change, and then Phase 2 (the new shell) is the first visible delivery.

If you want, I can start Phase 1 now on `claude/mobile-first-redesign-7v7hZ` — token additions and the three new primitive SCSS partials, no consumers yet, zero visual diff. Reply **"go phase 1"** and I'll open the PR.
