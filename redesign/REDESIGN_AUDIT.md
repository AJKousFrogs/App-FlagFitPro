# FlagFit Pro — Premium Athletic Redesign Audit

**Date:** 2026-05-16
**Scope:** Full app — 90+ user-facing pages
**Direction:** Premium athletic (Nike Training Club / WHOOP / Strava — dark, bold, high-contrast, single hero metric)
**Audience:** Ljubljana Frogs internal first → sellable SaaS to other coaches

---

## TL;DR — What you need to know in 90 seconds

Your app is structurally strong. You have a mature 900-variable token system, dark mode is wired, typography is athletic (Space Grotesk + Plus Jakarta), and several pages are already at premium polish (**ACWR Dashboard 8.5/10, Today's Practice 8.5/10, Roster 8/10, Achievements 8/10**). This is a **positioning + polish redesign**, not a rebuild.

The five problems that show up everywhere:

1. **No hero metric on most pages.** Pages open with a page header and dump into a card grid. WHOOP opens with one giant number. You should too.
2. **Massive duplication on a few high-traffic pages.** Player dashboard shows the schedule 3 times and readiness 2 times. Analytics shows ACWR 3 times. Coach dashboard shows at-risk players in 2 places.
3. **Card hierarchy is flat.** Bento grids dump cards with equal visual weight — the most important card on the page doesn't look more important.
4. **Tabs everywhere.** Tabs are corporate. Scouting, analytics, profile, settings all hide critical content behind clicks. Progressive disclosure (stacked cards) reads as more premium.
5. **Mobile is an afterthought on coach-facing pages.** Roster, dashboard, and analytics use 2-column layouts and tables that don't reflow well — but coaches use phones on the sideline.

**Brand mismatch flag:** Your logo SVG still uses indigo `#6366f1` while your app primary is `#00A85C` green. Pick one. Recommend updating the logo to match the green — it's the stronger athletic color.

---

## Priority matrix — where to invest

| Tier | Pages | Why |
|------|-------|-----|
| **P0 — Redesign now** | Landing, Player Dashboard, Coach Dashboard | First impression (sellable + daily use) |
| **P1 — Polish next** | Analytics, Performance Tracking, Scouting Reports, Tournament Management, Coach Analytics | Currently scoring 3-5/10, biggest gap |
| **P2 — Light touchups** | Roster, ACWR Dashboard, Today's Practice, Achievements, Profile, Game Day Readiness | Already 7-8.5/10, small polish only |
| **P3 — Scoped later** | Settings sub-pages, Help, Data Import, Admin pages | Low-traffic, low-impact for SaaS positioning |

---

## The new design language — premium athletic spec

You don't need new tokens. You need a stronger **pattern library** on top of the tokens you already have.

### Hero metric pattern (the most important new pattern)

Every page above the fold should show **one giant number** with context. WHOOP-style.

```
ACWR 1.42                              [ELEVATED RISK]
Elevated training load — moderate risk this week
72px bold, color-coded badge, single line of context
```

Rules:
- Number: 64-96px, Space Grotesk Bold (you already have this)
- Color: semantic (red/amber/green) — uses your existing `--danger`, `--warn`, `--accent`
- One line of plain-English context underneath
- Tap target opens the detail view

### Card hierarchy — the 3-tier rule

| Tier | Purpose | Visual treatment |
|------|---------|------------------|
| **Hero** | The thing you need to know now | Full-width, dark background, neon accent, big numbers |
| **Action** | What to do next | Mid-size cards with primary CTA, slight border emphasis |
| **Context** | Supporting data / archives | Smaller cards, muted text, scrollable if needed |

Apply this on every page. If you can't say which card is hero, the page fails the test.

### Dark mode as default for athletic surfaces

Dashboards, analytics, game tracker, film room → dark mode by default. Light mode stays for content-heavy surfaces (knowledge base, settings, onboarding).

### Density rules

- **Coach surfaces** (dashboard, analytics, roster) → dense, broadcast-graphic energy. ESPN game-center, not a Linear settings page.
- **Player surfaces** (player dashboard, today's practice, wellness) → sparse, one-thing-per-screen, like Nike Training Club workouts.

### Mobile-first audit checklist (apply to every page)

1. Hero metric visible without scrolling on a 375px screen
2. Primary CTA reachable with thumb (bottom 60% of screen)
3. Tables become cards (no horizontal scroll)
4. Multi-column grids stack to single column gracefully
5. Icon-only buttons have visible labels on first viewport

---

## Cross-cutting problems found across the app

### Problem 1: Duplicate information on the same page

The pattern: a summary card at the top of the page shows numbers, then the same numbers appear again inside detail cards below.

Examples found:
- **Player dashboard** — schedule shown 3 times (`.schedule-card`, `.tomorrow-section`, `.continuity-section`)
- **Player dashboard** — readiness shown in `.welcome-section` CTA AND in `.stat-readiness` card
- **Coach dashboard** — at-risk players in `coach-dashboard-summary-section` AND in `coach-dashboard-priority-section`
- **Analytics page** — ACWR shown 3 times (Load vs Performance chart, Current ACWR insight box, Risk Zone reference guide)
- **Playbook Manager** — team memorization % shown in summary stats AND on every play card
- **Tournament Management** — RSVP/payment status shown in card body AND in action sidebar
- **Performance Tracking** — Gap Analysis and Focus Areas say the same thing twice
- **Tournament Nutrition** — hydration target shown in 3 places

**Fix rule:** On each page, every data point appears in exactly one place. The most prominent place. Everything else is a link to that place.

### Problem 2: Missing hero sections

Pages opening with `<app-page-header>` and dumping straight into cards. No focal point.

Worst offenders: Practice Planner, Playbook Manager, Scouting Reports, Coach Analytics, Tournament Management, Performance Tracking, Enhanced Analytics, Film Room, Profile (almost — has strong header but no hero stat).

**Fix rule:** Every page gets a hero. The hero answers the question the user opened the page to ask:
- Practice Planner → "Next practice: Tuesday 5pm — Start Session"
- Playbook → "8/24 plays memorized — Review 3 problem plays"
- Scouting → "Next opponent: Phoenix Flames, Saturday 3pm — 4-1 record"
- Tournament → "Next: Phoenix Flames | 3/22 | RSVP 18/22 ✅"
- Profile → big headline stat ("Best 40-yard: 4.45s")

### Problem 3: Tabs hiding critical content

Tabs work when sections are clearly separate. They fail when the "second tab" content is something the user needs to see immediately.

Found at:
- **Scouting Reports** — 3 tabs (Reports, Opponents, Tendencies) with no clear primary
- **Enhanced Analytics** — Trends/Injury Risk/Predictions hidden in tabs when they should stack
- **Profile** — Overview/Achievements/Statistics tabs are sparse, look better as stacked cards
- **Settings** — multiple route-driven tabs all loading the same component

**Fix rule:** Use tabs only when each tab is a completely different mode. If a user might want to glance at all three tabs, use stacked cards with collapse.

### Problem 4: Form / dialog friction

Long forms presented as a wall of inputs. No quick-entry mode. Dialogs that should be inline.

Found at:
- **Scouting Reports** — 6-section essay form for what should be a quick coaching note
- **Game Tracker** — too many radios and dropdowns, should use chips
- **Data Import** — file upload AND URL import as separate steps when it should be one input with a source toggle

**Fix rule:** Default to quick mode (1-3 fields). Power mode is a click away.

### Problem 5: Coaches on the sideline need mobile

A flag football coach is rarely at a desk. They're at practice. They're at games. They're on their phone.

Mobile-broken pages: Coach Dashboard (8-column roster table), Coach Analytics (sparse 2-col grid that stacks awkwardly), Scouting Reports (wall-of-text dialog), Tournament Management (huge tournament cards eat the screen), Practice Planner (acceptable but no thumb-zone optimization).

**Fix rule:** Design coach pages mobile-first. Desktop is the bonus view.

---

## Page-by-page scorecard

### 🌐 Public / acquisition

| Page | Score | P-tier | Single biggest issue |
|------|-------|--------|----------------------|
| Landing | 6/10 | **P0** | Olympic countdown gimmick dilutes value prop; features are generic ("Powerful tools") instead of outcome-driven ("Reduce injuries by 40%") |
| Onboarding | 5/10 | P1 | Three redundant progress indicators (top bar, stepper, percentage); too many fields per screen |
| Legal / Help / Auth | n/a | P3 | Functional, not first-impression |

### 🏠 Daily dashboards (highest traffic)

| Page | Score | P-tier | Single biggest issue |
|------|-------|--------|----------------------|
| Player Dashboard | 5/10 | **P0** | Schedule shown 3 times, readiness shown 2 times, welcome card buries the most important metric |
| Coach Dashboard | 4/10 | **P0** | At-risk players duplicated, 8-column roster table breaks mobile, no urgent hero moment |
| Today's Practice | 8.5/10 | P2 | Prescription card is WHOOP-tier; only polish needed on protocol block typography |

### 📊 Analytics & performance

| Page | Score | P-tier | Single biggest issue |
|------|-------|--------|----------------------|
| Analytics (Performance Insights) | 5.5/10 | P1 | 5 charts in viewport, ACWR shown 3 times, hero metric missing |
| Enhanced Analytics | 6/10 | P1 | Tabs hide injury risk score that should be the hero |
| ACWR Dashboard | 8.5/10 | P2 | Best in class — minor: collapse Risk Zone guide into tooltip |
| Performance Tracking | 6.5/10 | P1 | Gap Analysis and Focus Areas duplicate; missing headline stat |
| Coach Analytics | 4/10 | P1 | Sparse 4-card overview wastes space, leaderboard is flat, no narrative |

### 🏈 Game-day & training

| Page | Score | P-tier | Single biggest issue |
|------|-------|--------|----------------------|
| Game Day Readiness | 8/10 | P2 | Strong — minor: swap generic Pi icons for sport-specific illustrations |
| Tournament Nutrition | 7/10 | P2 | Hydration target shown 3 times |
| Tournament Management | 3/10 | P1 | Huge cards (~400px tall), no calendar/list view, no hero for next tournament |
| Game Tracker | 6/10 | P2 | Form-heavy; recent plays table disconnected from active game |
| Live Game Tracker | 7/10 | P2 | Field SVG too small; undo/redo buried |
| Film Room (player) | 6/10 | P2 | No priority signal (overdue films should scream) |
| Film Room (coach) | 7/10 | P2 | Tag editor too complex; should be inline on card |
| Playbook (shared) | 6.5/10 | P2 | Memorized count repeated 4 times; no role-based filter |
| Playbook Manager (coach) | 7/10 | P2 | Formation diagram too small (80px); no "game-used" filter |

### 👥 Roster & player management

| Page | Score | P-tier | Single biggest issue |
|------|-------|--------|----------------------|
| Roster | 8/10 | P2 | Best-in-class structure — minor: hero stats deferred-load hurts first paint |
| Depth Chart | 6/10 | P2 | Unassigned panel weak — should be sticky sidebar |
| Attendance | 8/10 | P2 | Solid — minor: "Create Event" should default to practice |
| Injury Management | 6/10 | P1 | One-injury-per-card layout makes squad-wide scanning tedious; missing timeline view |
| Player Development | 7/10 | P2 | Spider chart colors unclear; skill assessment grades hardcoded |
| Return to Play | 8/10 | P2 | 7-stage protocol visual is excellent — minor: auto-close celebration |
| Officials | 7/10 | P2 | Payment summary duplicates assignments table |

### 🛠 Coach operations

| Page | Score | P-tier | Single biggest issue |
|------|-------|--------|----------------------|
| Practice Planner | 6/10 | P1 | No hero ("next session in X days"); attendance buried at card bottom |
| Program Builder | 7/10 | P2 | Players grid too dense (1999-style checkboxes); dialogs too modal-heavy |
| Scouting Reports | 3/10 | P1 | Tab confusion (which is primary?); 6-section essay form on mobile |
| Payment Management | 6/10 | P2 | Overview ≈ Fees tab duplication; player table hard to scan |
| Coach Inbox | 8/10 | P2 | Tabbed triage is clean — minor: "Add Note"/"Override" buttons underpowered |
| Activity Feed | 8/10 | P2 | Solid — minor: unread dot too subtle |
| Coach Calendar | 7/10 | P2 | RSVP shown in upcoming events AND in event dialog |
| AI Scheduler | 8/10 | P2 | Strong conversational flow — minor: export buttons should be sticky |
| Knowledge Base | 6/10 | P2 | "My Submissions" should be first tab; category grid at bottom is wasted space |
| Equipment | 7/10 | P2 | Summary cards duplicate the table |

### 💬 Social & communication

| Page | Score | P-tier | Single biggest issue |
|------|-------|--------|----------------------|
| Chat (team channels) | 7/10 | P2 | Message actions hidden — surface on hover |
| AI Coach (Merlin chat) | 7/10 | P2 | Return context banner verbose; condense |
| Notifications | 7/10 | P2 | Missing filter/status tabs |
| Community | 6/10 | P2 | Composition shouldn't be modal-only |
| Achievements | 8/10 | P2 | Strong bento — leaderboard preview should link to full page |

### ⚙️ Settings & utility

| Page | Score | P-tier | Single biggest issue |
|------|-------|--------|----------------------|
| Profile | 7/10 | P2 | Missing headline stat (best 40, games played, etc.) |
| Settings (all tabs) | 7/10 | P3 | Functional |
| Payments (player) | 6/10 | P2 | Payment instructions button buried |
| Help / FAQ | 7/10 | P3 | No FAQ search at top |
| Data Import | 6/10 | P3 | File + URL inputs should be one input with toggle |

---

## What "premium athletic" looks like in code

Concrete patterns to introduce into your design system. These slot on top of your existing tokens.

### New pattern: `.hero-metric`

```scss
.hero-metric {
  background: var(--text-0); // dark surface, even in light mode
  color: var(--bg-1);
  padding: var(--space-8) var(--space-6);
  border-radius: var(--radius-xl);
  display: grid;
  gap: var(--space-2);

  &__eyebrow { // "ACWR" or "TODAY'S READINESS"
    font-size: var(--text-sm);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.6;
  }
  &__number { // the big number
    font-family: var(--font-display);
    font-size: clamp(56px, 12vw, 96px);
    font-weight: 800;
    line-height: 0.95;
    letter-spacing: -0.03em;
  }
  &__badge { // [ELEVATED RISK]
    display: inline-flex;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    &--danger { background: var(--danger); }
    &--warn { background: var(--warn); color: var(--text-0); }
    &--ok { background: var(--accent); }
  }
  &__context { // one-line plain English
    font-size: var(--text-lg);
    opacity: 0.85;
  }
}
```

### New pattern: `.bento-priority`

Replaces the current bento grid where all cards are equal weight.

```
[ HERO METRIC (full-width, dark) ]
[ ACTION CARD (½) ] [ ACTION CARD (½) ]
[ CONTEXT (⅓) ] [ CONTEXT (⅓) ] [ CONTEXT (⅓) ]
```

### Removal list — things to delete from current pages

- Olympic countdown on landing
- Three of three duplicate progress indicators in onboarding
- Two of three schedule cards on player dashboard
- One of two readiness displays on player dashboard
- Two of three ACWR displays on analytics page
- Right-sidebar "Roster shortcuts" on coach dashboard (duplicates priority section)
- "Risk Zone Reference" card on ACWR dashboard (becomes tooltip)
- "Performance History" table on Performance Tracking (becomes modal)
- "Active assignments" card on Equipment (merge into table)
- Speed Development chart on Analytics (move to sub-page)
- Hardcoded "B+" skill assessment on Player Development

---

## Implementation roadmap (suggested 4 sprints)

**Sprint 1 — Foundations**
- Add `.hero-metric` pattern to the design system
- Add `.bento-priority` grid pattern
- Fix logo/brand color mismatch (indigo → green)
- Update landing page (highest leverage for SaaS positioning)

**Sprint 2 — Daily dashboards**
- Redesign Player Dashboard (kill duplicates, add hero metric, single schedule)
- Redesign Coach Dashboard (hero next-game card, dense mobile-first roster, merge duplicates)

**Sprint 3 — Analytics polish**
- Apply hero metric to Analytics, Enhanced Analytics, Performance Tracking
- Reduce chart count per page (max 2)
- Add headline number to Profile

**Sprint 4 — Coach operations sweep**
- Scouting Reports: rebuild with quick-note default
- Tournament Management: list view with expandable rows
- Practice Planner: hero next-session card
- Injury Management: add timeline view

After Sprint 4, the remaining P2/P3 pages are touchups that any junior dev can apply using the new pattern library.

---

## Mockups included with this audit

See the `mockups/` folder in the same directory. Self-contained HTML/CSS — open in browser to preview. These show how the patterns above apply to the four highest-leverage pages:

1. `mockup-landing.html` — sellable SaaS landing, athletic energy
2. `mockup-player-dashboard.html` — WHOOP-style hero, single schedule, action grid
3. `mockup-coach-dashboard.html` — broadcast-graphic energy, urgent action surface
4. `mockup-analytics.html` — hero ACWR metric, curated chart set

Use these as visual reference when reviewing PRs. They use the same tokens (`#00A85C` accent, Space Grotesk, Plus Jakarta) so they're a direct preview of the system once patterns ship.

---

## Final word

You don't have a design problem. You have an **editorial problem**. Most of your pages know what data to show — they just show too much of it, in the wrong order, with the wrong weight.

The fix is the same on almost every page:
1. Pick the one thing that matters most on this page
2. Make it the hero
3. Delete duplicates
4. Push everything else below the fold

Do that, ship the pattern library, and FlagFit Pro is sellable.
