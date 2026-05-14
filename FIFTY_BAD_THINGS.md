# 50 Things That Are Really Badly Done — FlagFit Pro

Brutal punch list. One line each, file:line citations where it helps. Sourced from `AUDIT.md`, `UI_UX_AUDIT.md`, and four targeted reads of `features/`, `core/navigation/`, `core/routes/`, `scss/`, `shared/components/`.

---

## Information architecture (1–10)

1. **~97 routes have no nav entry.** 46 feature dirs × 136 route definitions, but `app-navigation.config.ts` exposes only 39. The user can reach roughly 15 % of the app only by typing a URL.
2. **`/travel` and `/game-tracker` are feature directories with no routes at all.** Code shipped, unreachable in any way. (`features/travel/`, `features/game-tracker/`)
3. **`/cycle-tracking`, `/sleep-debt`, `/acwr`, `/return-to-play` are routable but invisible.** Wellness sub‑features users will never find. (`wellness.routes.ts:50,55,28,41`)
4. **Five overlapping "performance" surfaces.** Stats (`/performance/insights`), Performance (`/coach/analytics`), Analytics (subroutes), Insights, Reports (`/reports`). Same mental model, four different labels.
5. **"Training" nav label hides 12+ destinations.** `/training`, `/training/advanced`, `/training/qb`, `/training/ai-scheduler`, `/workout`, `/exercise-library`, `/exercisedb`, plus load‑analysis, microcycle, periodization. One label, twelve doors.
6. **Coach "More" menu = 19 items behind a single tap.** Competition, Merlin AI, Knowledge Base, Reports, Inbox, Activity, Programs, Injuries, Film Room, Staff Hub, Team Chat, Team Settings, Payments, Profile, Notifications, Settings, Help, Achievements. That's not a menu — that's a second screen.
7. **Player Dashboard is a porch in front of Today's front door.** Its primary CTA ("Start Training", `player-dashboard.component.html:31`) routes straight to `/todays-practice`. Two routes, one job.
8. **`/depth-chart`, `/equipment`, `/officials` redirect to `/team/workspace` with no breadcrumb back.** Users land somewhere they didn't ask for, with no signpost. (`team.routes.ts:280,286,292`)
9. **`/film` and `/playbook` have player variants the player can never reach.** Nav only surfaces the coach versions (`/coach/film`, `/coach/program-builder`). (`wellness.routes.ts:77,86`)
10. **`core/services/` is 111 files / 52,477 LOC** with four "`*.data.ts`" *data dictionaries* (5,317 LOC) misclassified as services. They should be feature‑local lazy imports. (`AUDIT.md §A.1`)

## UX flow (11–22)

11. **"Back to Merlin" link appears twice on Today** — once in the entry‑context banner, once again 50 lines later as `merlin-return-link`. (`today.component.html:84‑93` + `136‑146`)
12. **"Start Training" and "View Full Day" on Player Dashboard both route to `/todays-practice`.** Two CTAs, same destination, different cards. (`player-dashboard.component.html:31` + `:161`)
13. **Roster has View toggles AND Jump‑to buttons.** Two navigations for the same goal. (`roster.component.html:81‑144`)
14. **Coach Dashboard "Open Performance" exists as a tab action and again as a quick‑command.** (`coach-dashboard.component.html:83` + `:195`)
15. **Onboarding's "Step 3 of 8" counter lies.** Hidden role‑conditional steps mean the player and the staff member see the same counter but a different number of actual screens. (`onboarding.component.ts:97‑120`)
16. **Email verification has two redundant pathways** (resend vs refresh) inside the personal‑info step, both buried. (`personal-info.component.ts:259‑309`)
17. **Today opens with four hero blocks before the first exercise.** entry‑context banner → schedule banner → prescription card → summary header. (`today.component.html:76‑200`)
18. **Settings puts "Save Changes" at the top‑right, content forms below.** On mobile the user edits, scrolls back up to save, often forgets. (`settings.component.html:25‑31` vs `:78+`)
19. **Roster player‑details modal duplicates metrics already shown on the card behind it** — readiness, ACWR, performance score rendered twice in two viewports. (`roster.component.html:339‑386`)
20. **Celebration modal on Today locks scroll with no Escape handler.** Backdrop click and keydown are bound but Escape isn't. (`today.component.html:5‑49`)
21. **Quick checkin modal can fire before the page finishes loading**, because it's deferred independently of the protocol. (`today.component.html:215‑233`)
22. **Onboarding sticky footer CTA overlaps content on short screens** — no safe content padding under the fixed CTA bar. (`onboarding.component.ts:136‑144`)

## Mobile interaction (23–34)

23. **Bottom nav dies at 640 px.** Tablet portrait (768 px) inherits the desktop sidebar — too much chrome for a touch device. (`bottom-nav.component.scss:43‑47`)
24. **No center FAB.** Quick Actions FAB is *completely hidden* on mobile (`quick-actions-fab.scss:279‑282`) — the role‑specific quick actions vanish instead of becoming the primary verb in the bar.
25. **Bottom nav never hides on scroll.** ~10 % of viewport permanently occupied by chrome on long pages.
26. **Mobile header isn't sticky.** Title and hamburger scroll away on long pages, the user loses orientation. (`mobile-header.component.scss:3‑66`)
27. **Zero gesture support across the entire app.** No swipe, no pan, no pull‑to‑refresh, no drag‑to‑dismiss. `grep -rn "touchstart\|touchend\|swipe\|pan\|hammer" src/app --include="*.ts"` → 0 functional hits.
28. **416 dialog instances, exactly one bottom‑sheet adoption.** The `.mobile-bottom-sheet` CSS variant exists (`_mobile-responsive.scss:422‑427`) and only the "More" menu uses it.
29. **No segmented controls anywhere.** Choice filtering done with radio arrays and PrimeNG dropdowns. The reference apps' "Week / Month" or "Resistance Day A / B" pattern is absent.
30. **`interactiveWidget=resizes-content` is not set.** Android virtual keyboard pushes the layout instead of resizing the viewport. (`index.html:6‑9`)
31. **Coach Dashboard, Chat, Settings, Roster, Profile all use two‑column desktop layouts that don't collapse to one column on mobile.** Confirmed in flow audit. Caused by desktop‑first parent grid declarations that mobile rules don't override.
32. **Training Schedule's inline datepicker has `touchUI=false`** — the touch‑optimized PrimeNG calendar mode is explicitly disabled on the most calendar‑heavy screen. (`training-schedule.component.html:93`)
33. **Channel sidebar in Team Chat consumes ~40 % of viewport on mobile.** Side‑by‑side layout, doesn't reflow. (`chat.component.html:88‑406`)
34. **Roster filter and bulk‑action confirmation are separate full‑screen dialogs.** On phones a bottom sheet would handle both. (`roster.component.html:623‑661`)

## Visual design & SCSS (35–43)

35. **Desktop‑first SCSS dialect.** 78 `max‑width` vs 18 `min‑width` queries globally; **232 `respond‑to(max‑width)` vs 8 mobile‑first** inside `features/`. Every feature is shrink‑down, not design‑up. (`AUDIT.md §C.1`)
36. **`today.component.scss` is 1,074 lines for a single page.** Mobile and desktop rules braided through the same file, hard to reason about. (`features/today/today.component.scss`)
37. **PrimeNG override files total 5,376 lines.** `primeng-theme.scss` 3,265 + `_brand-overrides.scss` 1,515 + `_token-mapping.scss` 606 + `_theme-overlays-panels.scss` 590 = we are fighting PrimeNG, not partnering with it.
38. **Plus `_component-overrides.scss` at 3,026 lines** — the second‑largest single SCSS file in the repo. (`assets/styles/overrides/_component-overrides.scss`)
39. **227 hardcoded `linear-gradient` strings** across feature SCSS for position colors (QB blue, WR teal, RB amber), role colors, medal tints, social brands — only 10 gradient *tokens* defined. Dark mode shifts the brand; these don't follow.
40. **20 distinct `.card*` class shapes in use.** `.card`, `.card-shell`, `.card-surface`, `.card-bento`, `.card-grid` + 8 modifiers (`--compact`, `--spacious`, `--outlined`, `--elevated`, `--floating`, `--interactive`, `--metric`, `--wide`). No primitive consolidation.
41. **58 raw hex literals outside the token‑allowed files**, concentrated in `features/reports/reports-hub.component.scss` (18), `features/notifications/notifications.component.scss` (18), `scss/components/notifications.scss` (9). (`AUDIT.md §C.2`)
42. **18 templates over 500 lines.** `travel-recovery.component.html` 897, `game-tracker.component.html` 847, `exercisedb-manager.component.html` 784. Dense screens that should be child components. (`AUDIT.md §A.2`)
43. **No `<app-hero>`, no `<app-kpi-strip>`, no `<app-list-row>`, no `<app-day-picker>`, no `<app-bottom-sheet>` primitive.** Every dashboard reinvents the hero‑plus‑KPI pattern badly.

## Tech debt that bleeds into UX (44–47)

44. **`jspdf` (^4.1.0) + `html2canvas` (^1.4.1) declared in `dependencies` with 0 import sites.** `jspdf` is the single **critical** npm‑audit finding. Removing the lines kills the critical finding for free. (`AUDIT.md §E.1, §G.1`)
45. **Poppins shipped as `.ttf` AND `.woff2` for all 5 weights** — ~795 KB of dead asset weight per page load. (`AUDIT.md §E.4`)
46. **Sentry is wired in code but never loaded.** `error-tracking.service.ts:166` calls `Sentry.init` only if `window.Sentry` exists; there's no `<script src=sentry>` in `index.html` and `@sentry/*` isn't in `dependencies`. Production crashes go nowhere. (`AUDIT.md §E.6, §G.3`)
47. **`p-progressSpinner`:`p-skeleton` ratio is 100:21.** Spinner‑dominant UI loses CLS and feels slower than skeleton‑dominant. Today, Training Schedule, Player Dashboard all spinner‑first.

## A11y / semantics (48–50)

48. **14 `<h1>` tags across 137 routes.** Most pages have no `<h1>` at all, or use `<h4>` for visual sizing. 239 `<h4>` vs 26 `<h2>` — heading levels used for type scale, not semantics. (`AUDIT.md §B.1`)
49. **Only two `<nav>` landmarks across the entire `src/`.** Screen‑reader users get one navigation landmark regardless of which surface (sidebar vs bottom nav vs in‑page tabs) they're on. (`AUDIT.md §B.2`)
50. **Three icon‑only native `<button>` elements without `aria-label`.** Bookmark + share on `video-feed.component.html` and `clear-read-btn` on `notifications-panel.component.html` (the latter has a tooltip, but tooltip ≠ accessible name). (`AUDIT.md §B.3`)

---

## What this list isn't

It isn't a bug list. None of these will throw at runtime. They're **quality‑of‑build** problems — the kind that make a real user say "this is a lot" or "where do I find X" or "why did I just see four loading bars" without being able to point at why.

The fix shape is in `UI_UX_AUDIT.md §7`:
- **Phase 0.5** addresses items 1–10 (IA collapse).
- **Phase 2** addresses items 23–26, 28, 30.
- **Phase 1** primitives address item 43, and as those primitives ship, items 11–14, 17–19, 31–34 fall out naturally.
- **Phase 5 cleanup** addresses items 35–42.
- Items 44–47 are 4 separate small PRs you can run in parallel any time (`REVAMP.md` already has 44 and 46 written up).
- Items 48–50 are an a11y sweep, ~2 hours.
