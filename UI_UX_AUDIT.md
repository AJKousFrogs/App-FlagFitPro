# FlagFit Pro — UI/UX Audit & Honest Take

**Scope:** UI design coherence, UX flow quality, information architecture, navigation, mobile interaction. **Excludes** the items already covered in `AUDIT.md` (architecture, a11y, perf, security, TypeScript) — read that first; this builds on it.

**Method:** Four parallel reads of `features/`, `shared/components/`, `core/navigation/`, `core/routes/`, `scss/tokens/`, `scss/components/primeng/`. Counts and file:line citations below.

**Verdict up front:** The codebase isn't broken. It's **bloated and undiscoverable**. The mobile-first redesign I proposed in `MOBILE_FIRST_REDESIGN.md` is necessary but **secondary to an IA collapse**. If we ship a new visual skin over today's information architecture, we'll just have a prettier maze. Phase plan needs a Phase 0.5 inserted before tokens.

---

## 1. The headline numbers

| Metric | Value | Why it matters |
|---|---:|---|
| Feature directories | 46 | App surface area |
| Route definitions | ~136 | Including legacy redirects |
| Nav items (athlete + coach combined unique) | 39 | What users can find from UI |
| **Reachable‑but‑undiscoverable routes** | **~97** | URL works, no nav entry |
| Templates > 500 lines | 18 | `travel-recovery.html` 897, `game-tracker.html` 847, `exercisedb-manager.html` 784 |
| Distinct `.card*` class shapes in use | 20+ | `.card`, `.card-shell`, `.card-surface`, `.card-bento`, `.card-grid` + 8 modifiers |
| Hardcoded `linear-gradient` occurrences | 227 | Position/role/medal/social — fragmented |
| PrimeNG override SCSS | 2,743 lines across 4 files | `_brand-overrides.scss` alone = 1,515 lines |
| `p-dialog`/`p-sidebar`/custom dialog instances | 416 | Modal‑heavy UX |
| `mobile-bottom-sheet` actual uses | ~1 | Variant exists, isn't adopted |
| Touch event handlers anywhere in `src/` | **0** | No swipe, no drag, no pull‑to‑refresh |

The most damning of these is **97 routes with no nav entry**.

---

## 2. Information architecture — this is the real problem

### 2.1 Names that overlap in users' heads

| Pair | What route A actually does | What route B actually does | Why it's confusing |
|---|---|---|---|
| **Today** (`/todays-practice`) | Single‑day training schedule | **Overview** (`/player-dashboard`) — "season summary" | Player dashboard's primary CTA is *"Start Training"* which sends you to Today. The dashboard is a porch the user has to cross to reach the front door. |
| **Stats** (`/performance/insights`) | Athlete metrics, tests | **Performance** (`/coach/analytics`), **Reports** (`/reports`), **Analytics** subroutes | Five surfaces, four labels, one mental model: "How am I/are we doing?" |
| **Roster** (`/roster`) | Player directory, roles | **Team Workspace** (`/team/workspace`) | "Team" in the nav points at roster; the *actual* team operations hub isn't labelled. |
| **Training** (`/training`) | Schedule + calendar | `/training/advanced`, `/training/qb`, `/training/ai-scheduler`, `/workout`, `/exercise-library`, `/exercisedb` | One nav label hides **12+ destinations**. |
| **Chat** | Merlin AI (1‑user) | **Team Chat** (`/team-chat`) — channels | Mild; labels do disambiguate. |
| **Coach** vs **Staff** | `/coach/*` for the head coach role | `/staff` for specialists (nutritionist, physio, psych) | Both are "people who work with the team." Namespace doesn't communicate role boundaries. |

### 2.2 Features that exist but the user can't find

These routes are live and code is shipped, but **no entry in either sidebar or bottom nav** for any role:

- `/cycle-tracking` — female athlete tracking
- `/sleep-debt` — recovery metrics
- `/acwr` — acute:chronic workload ratio
- `/return-to-play` — injury return timeline
- `/film` (player variant) — only `/coach/film` is in nav
- `/playbook` (player variant) — only `/coach/program-builder` is in nav
- `/depth-chart`, `/equipment`, `/officials` — redirect to `/team/workspace`, no breadcrumb back
- `/travel`, `/game-tracker` — **feature directories exist with no route at all**

If a user knows the URL, the feature works. If they don't, it's invisible. We are shipping ~15% of the app as orphan code.

### 2.3 The "More" menu is doing too much

`getMobileMoreNavigationItems()` (`app-navigation.config.ts`) for coaches puts **19 items behind a single "More" tap**: Competition, Merlin AI, Knowledge Base, Reports, Inbox, Activity, Programs, Injuries, Film Room, Staff Hub, Team Chat, Team Settings, Payments, Profile, Notifications, Settings, Help, Achievements. That's not a "more" menu — that's a second screen.

**My take:** the IA was built by adding routes when features shipped, not by deciding what the user's mental model is. Before any visual redesign, we should answer **"what are the 5–6 verbs an athlete does in this app?"** and **"what are the 5–6 verbs a coach does?"** and let the IA fall out of that.

---

## 3. UX flows — repeated friction patterns

The flow audit covered 8 routes. The same anti‑patterns appear on most of them. Listing the patterns, not re‑listing every flow:

### 3.1 Multiple hero sections per page
- **Today** opens with: entry context banner → schedule banner → prescription card → summary header → then content. Four heroes before the user sees a single exercise (`today.component.html:76‑200`).
- **Player Dashboard** opens with welcome (lines 19‑44), Merlin insight (lines 26‑40), status stack (lines 77‑87), stats card. Three banners before the data.
- **Training Schedule** has page header → Merlin return link → Related Tools card → Calendar → Weather alert → Substitute workout — six bands before "Upcoming Sessions."

**Pattern:** every screen tries to be a landing page. The reference shots (MLS, Equinox) do the opposite: one hero, one KPI row, then content.

### 3.2 Duplicate CTAs to the same destination
- "Back to Merlin" appears **twice** on Today (`today.component.html:84‑93` and `136‑146`).
- "Start Training" on Player Dashboard (line 31) and "View Full Day" (line 161) both route to `/todays-practice`.
- Roster has both **View toggles** (All/Invites/Staff/Players) and **Jump‑to buttons** — two ways to do the same nav (`roster.component.html:81‑144`).
- Pinned messages reachable via header button (line 42) and via modal (line 421) — two data fetches.
- Coach Dashboard: "Open Performance" appears as a tab action and again as a quick‑command (lines 83 & 195).

### 3.3 Two‑column desktop layouts that don't collapse to one column on phones
Confirmed in: **Coach Dashboard** (`workspace-main` / `workspace-side`), **Chat** (channels sidebar + messages), **Settings** (settings nav + content), **Roster** (overview + grid), **Profile** (avatar + stats span‑2).

This is what the desktop‑first SCSS dialect causes — the 232 `respond-to(max-width)` rules in features rewrite *some* mobile properties but leave parent `grid-template-columns` untouched.

### 3.4 Wizard hides its real length
**Onboarding** has 8 visible steps but **branches based on role** (`onboarding.component.ts:97‑120`) — staff vs player see different hidden steps. The "Step 3 of 8" counter is a lie. Worse: email verification gates step advance (`personal-info:444‑449`), and step 0 has no Back button but **doesn't reclaim the space**, so the layout shifts as the user advances.

### 3.5 Save state is far from edit state
**Settings** puts the "Save Changes" button at top‑right (lines 25‑31). The forms are deferred sections below. On mobile the user edits, scrolls up, saves. Edit‑and‑forget bug bait.

### 3.6 Modal‑heavy UX
416 dialog instances. **Player details on Roster** is a 297‑line modal that re‑renders the same metrics shown on the card behind it (`roster.component.html:339‑386` vs card summaries). Add Player / Edit Player are the same dialog with a mode flag (line 265). Settings has 13 deferred dialog placeholders. On mobile, a centred modal with backdrop is heavier than a bottom sheet.

The `mobile-bottom-sheet` class exists (`_mobile-responsive.scss:422‑427`) but **only the bottom‑nav More menu uses it**. We have the right primitive, deployed once.

---

## 4. Visual design — coherent system, fragmented application

### 4.1 What's actually good (do not touch)
- **Token system is fintech‑grade.** 740+ CSS vars, 26,586 `var(--*)` usages in SCSS. The system is being consumed.
- **Dark mode is deliberate**, not bolted on. Separate token blocks at `design-system-tokens.scss:168` (dark) and `:176` (light) plus theme service.
- **Touch targets enforced.** `--touch-target-md = 44px` applied via `_mobile-touch-components.scss:38‑87` universally.
- **Forms on mobile are correct.** 44px inputs, 1rem font (no iOS zoom), single column, label margin, gap‑separated groups.
- **Offline UX is thoughtful.** Four states (online/offline/slow/syncing), Network Information API with API‑health fallback, auto‑dismiss on recovery (`offline-banner.component.ts:188‑226`).
- **Reactive forms only, 0 `[(ngModel)]`.** ARIA discipline strong.

### 4.2 What's fragmented
- **20 card class shapes in use.** `.card`, `.card-shell`, `.card-surface`, `.card-bento`, `.card-grid`, plus 8 modifiers (`--compact`, `--spacious`, `--outlined`, `--elevated`, `--floating`, `--interactive`, `--metric`, `--wide`). No primitive for **hero + KPI strip** or **image‑led list row**. Every feature solves these two patterns ad‑hoc.
- **227 hardcoded gradients.** Position colors (QB blue, WR teal, RB amber…), role colors (coaching purple, medical red), medal gradients (gold/silver/bronze), social brand gradients. 10 tokens cover the system; ~217 inline strings live in feature SCSS. When dark mode shifts the brand, these don't follow.
- **PrimeNG isn't a partner, it's an adversary.** `_brand-overrides.scss` is 1,515 lines, `_token-mapping.scss` 606, `_theme-overlays-panels.scss` 590, `primeng-theme.scss` 3,265. We override structure, padding, min‑height, border‑radius, and shadow on most components. Each override is a place future PrimeNG upgrades will fight us.
- **Display sizes used inconsistently.** `--ds-font-size-3rem` and `--ds-font-size-4xl` exist; they're used in celebration overlays and dashboard metrics, but the dashboard hero KPIs lean on `--font-metric-md/lg` which is smaller. The reference apps (Equinox "3 Active Days", Active Club "32 KM / 612 MINUTES") lead with display sizes; we don't.

### 4.3 What's missing as a primitive
None of these exist as a `<app-*>` component or as an SCSS placeholder:
- **Hero block** (gradient surface, eyebrow, title, optional KPI strip, action slot).
- **KPI strip** (3–4 big numbers in a row, label below each).
- **Image‑led list row** (64px thumb, title + subline, optional badge, optional CTA).
- **Bottom sheet host** (the CSS variant exists; no Angular component wraps it).
- **Day picker** (the MLS "Sunday, Mar 30" sticky strip).

So every feature reinvents at least one of those, badly.

---

## 5. Mobile interaction — clean foundation, no surface polish

### 5.1 Strong foundation
- `viewport-fit=cover` set in `index.html:6‑9` — notches handled.
- iOS PWA tags present; manifest has 7 icons + 2 shortcuts (`Today's Practice`, `Training`).
- Safe‑area envs respected in bottom nav, FAB, dialogs.
- Quick Actions FAB explicitly hidden on mobile (`quick-actions-fab.scss:279‑282`), bottom nav takes over.
- Service worker + offline queue wired.

### 5.2 Shell decisions worth revisiting
- **Bottom nav cuts off at `max-width: 40rem`** (640 px). iPad mini portrait (768 px) and most tablets get the desktop sidebar — too much chrome for a touch device.
- **No center FAB.** "More" is an icon among 5 equals. The reference apps all use a protruding center button as the primary verb.
- **Bottom nav never hides on scroll.** On a long Training Schedule, the user loses ~10% of screen to a chrome they're not interacting with.
- **Mobile header isn't sticky.** It scrolls away — the user loses the page title and the menu toggle on long pages.
- **Quick Actions FAB is hidden on mobile, not redeployed.** The role‑specific quick actions (Coach: Chat, Roster, Analytics, Program Builder, Team Workspace) are useful and disappear instead of becoming the center FAB.

### 5.3 What's not there at all
- **Zero swipe / pan / pull‑to‑refresh / drag‑to‑dismiss.** No `touchstart`/`touchend` listeners, no Hammer.js, no `@angular/cdk/drag-drop` (CDK is imported but for list reorder elsewhere — verify).
- **No segmented controls.** Choice filtering on mobile is done with radio arrays or PrimeNG dropdowns. The MLS "Regular Season" pills and Equinox "Resistance Day A/B" rows imply segmented + tabs.
- **No `interactiveWidget=resizes-content`.** Android virtual keyboard pushes the viewport instead of resizing it. Most modern mobile webapps set this.
- **Dialogs default to centred (95vw) on mobile.** The bottom‑sheet variant exists and isn't adopted. Bottom sheets are the correct primitive on phones for any non‑destructive secondary action.

---

## 6. My take, plainly

**1. The visual redesign without IA work is lipstick.**  
Build the new shell on top of 97 orphan routes, 5 overlapping "performance" surfaces, and 12 training sub‑routes hiding under one label, and we'll have a beautiful app that's still hard to use. The IA is the load‑bearing problem.

**2. The token system is the asset; the components are the liability.**  
Don't rebuild the design system — it's the best part. Rebuild what consumes it: kill 17 of the 20 card class shapes, replace 217 hardcoded gradients with 6 brand gradient tokens, retire half of `_brand-overrides.scss` by accepting PrimeNG defaults where the override is cosmetic.

**3. The bottom nav and the Quick Actions FAB should merge.**  
The FAB role mapping is good (it knows Coach vs Athlete actions). Move it into the center of the bottom nav as the primary verb. Hide the bar on scroll‑down so content gets the screen. Extend the bar to `max-width: 48rem` so tablet portrait gets it.

**4. Bottom sheets, not modals, for ~80% of secondary actions on mobile.**  
The CSS exists. Build the `<app-bottom-sheet>` component once. Convert the heaviest 5 modals (Player Details, Add Player, Filters, Pinned, Members) as a sweep.

**5. Hero + KPI + Image‑row + Day‑picker are missing primitives.**  
Build them once in Phase 1. Use them in Phase 3 — and stop having every dashboard reinvent the hero.

**6. Onboarding needs honest step counting.**  
Either pre‑compute the step list per role and show "Step 3 of 6", or drop the counter. The "8 steps but some are hidden depending on role" lie is worse than no progress indicator.

**7. Save buttons go at the bottom on mobile.**  
Settings is the worst offender. Below‑the‑fold edits with above‑the‑fold save is mobile UX malpractice.

---

## 7. Revised phase plan

Keep the structure from `MOBILE_FIRST_REDESIGN.md` but **insert Phase 0.5 (IA collapse) before Phase 1 (tokens)**, and revise Phase 3's route list.

### Phase 0 — Baseline (unchanged)
Lock visual regressions; audit DOM; freeze the existing look.

### **Phase 0.5 — Information architecture collapse (NEW, blocks everything else)**
This is content design, not styling. Output is a new `app-navigation.config.ts` and route consolidation list. No SCSS work.

**Collapse rules I'd propose:**
- **One "Insights" surface per role**, replacing Stats/Performance/Analytics/Reports/Insights. Tabs inside: *Me / Team / Reports / Load*. Routes redirect to anchored tabs.
- **One "Training" surface** with tabs *Today / Schedule / Library / Programs* — fold `/workout`, `/exercise-library`, `/exercisedb`, `/training/advanced`, `/training/qb`, `/training/ai-scheduler` under it.
- **Surface the orphans**: `/cycle-tracking`, `/sleep-debt`, `/acwr`, `/return-to-play` go under a Wellness sub‑nav. `/film` and `/playbook` (player) get nav entries. `/travel` and `/game-tracker` either ship a nav entry or get deleted.
- **Kill duplicate CTAs** by deciding which page owns which action. Player Dashboard either *is* Today's container or doesn't exist as a separate route. Pick one.
- **5 verbs per role for bottom nav.** Athlete: *Today, Train, Recover (wellness+cycle+sleep), Insights, Team*. Coach: *Today (dashboard), Roster, Plan (planning+programs), Insights (analytics+reports), Team*. Center FAB = role's primary verb.

**Exit:** revised nav config PR'd separately. Reviewable in 30 minutes. No styling change.

### Phase 1 — Tokens & primitives (mostly unchanged from prior proposal)
Add the missing primitives: `<app-hero>`, `<app-kpi-strip>`, `<app-list-row>`, `<app-day-picker>`, `<app-bottom-sheet>`. Add gradient tokens to replace 217 hardcoded uses. Add `mobile-first-grid` mixin.

### Phase 2 — Shell (unchanged in shape, expanded in scope)
- New bottom nav with **center FAB merged from Quick Actions FAB**.
- Hide‑on‑scroll bottom nav.
- Sticky mobile header with optional hero variant.
- Extend bottom nav to `≤ md` (768 px).
- Add `interactiveWidget=resizes-content` to viewport meta.

### Phase 3 — Top 5 routes converted (route list updated for new IA)
1. **Today** — single hero, KPI strip, exercise list.
2. **Train** (renamed from Training Schedule) — sticky day picker, list rows.
3. **Insights** (athlete) — single surface with tabs replacing Stats/Performance/Reports.
4. **Coach Dashboard** — single hero, KPI strip, role grid.
5. **Roster** — image‑led row, bottom‑sheet filters, bottom‑sheet player details.

### Phase 4 — Remaining hub routes (~8 routes after collapse)
Wellness (with cycle/sleep/acwr surfaced as tabs), Chat, Merlin AI, Plan (coach), Tournaments, Profile, Settings.

### Phase 5 — Cleanup
Retire `_brand-overrides.scss` lines that fight PrimeNG cosmetically (target: shrink by ≥ 40 %). Delete 17 of 20 card class shapes. Replace 200+ hardcoded gradients with the 6 new gradient tokens. Promote stylelint mobile‑first rule from warn to error.

---

## 8. The decision I need from you

The original proposal had me starting Phase 1 (tokens) next. After this audit I'd start **Phase 0.5** (IA collapse) next instead, because Phase 1's `<app-hero>` and `<app-kpi-strip>` only make sense if we already know which routes survive consolidation.

Phase 0.5 is **content design + Angular route config**, no SCSS, no visual diff. ~1‑2 days of work. Output is a single PR that:
- Updates `app-navigation.config.ts` with 5‑verb mobile nav per role.
- Adds redirects from retired routes to the new anchored tabs.
- Adds nav entries for orphan features.

Reply **"go phase 0.5"** to start there, or **"go phase 1"** to keep the original order and accept that some primitives might need rework when IA changes later.
