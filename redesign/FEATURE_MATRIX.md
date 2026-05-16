# FlagFit Pro — Feature Status Matrix

**Date:** 2026-05-16
**Purpose:** Single source of truth for what's built, what works, and what to do next. Cross-references all four audits (UX, backend wiring, implementation, code quality, navigation).

---

## The numbers up front

- **Total user-facing pages:** ~90
- **Backend-wired (real Supabase / API):** ~75 (83%)
- **UI shells with hardcoded data:** ~5
- **TODO/FIXME markers in codebase:** ~0 (cleaner than expected)
- **"CLEANUP REQUIRED" canonical-page debt:** 2 pages (ACWR, Training)
- **God-class services (>1000 lines):** 9
- **Mega-components (>900 lines .ts):** 10
- **Mega templates (>500 lines .html):** 10
- **Hardcoded hex colors in components:** 0 (✓)
- **`!important` declarations:** 11 (in 2 files)
- **Orphan routes (no nav link):** 41

**Bottom line:** This is a **mature, mostly-working codebase**. The redesign is not about fixing broken features — it's about (a) polishing visual hierarchy, (b) breaking down 1000+ line monoliths, and (c) consolidating duplicate services. The data layer is solid for 80%+ of pages.

---

## Decision matrix — read this first

The "Action" column is the only thing that matters when planning sprints. Definitions:

- **POLISH** — UX/visual fix only. Backend works, code is fine. Apply new design patterns. (low risk)
- **REFACTOR** — Backend works but code needs cleanup before redesign (split component, extract service). (medium risk)
- **WIRE** — UI is built but backend is hardcoded/missing. Build the service before redesigning. (medium-high effort)
- **REBUILD** — UX is bad enough that we rewrite the page on the new design system. (high effort, high reward)
- **KILL** — Feature exists but doesn't justify itself. Remove or hide. (low risk, frees attention)
- **KEEP** — Already great. Don't touch.

---

## 🌐 Public / acquisition

| Page | UX | Backend | Implementation | Tech debt | Action | Notes |
|------|----|---------|----|------|--------|-------|
| Landing | 6/10 | n/a (static) | ✅ Complete | SCSS 932 lines | **REBUILD** | Use the new mockup. Static page = zero backend risk. Highest leverage for SaaS positioning. |
| Login | n/a | ✅ Wired | ✅ Complete | clean | KEEP | Works. Touch only if onboarding redesign demands it. |
| Register | n/a | ✅ Wired | ✅ Complete | clean | KEEP | Works. |
| Verify email / Reset password | n/a | ✅ Wired | ✅ Complete | clean | KEEP | Deep-link only, fine. |

---

## 🏠 Daily dashboards (highest traffic — P0)

| Page | UX | Backend | Implementation | Tech debt | Action | Notes |
|------|----|---------|----|------|--------|-------|
| **Player Dashboard** | 5/10 | ✅ Wired | ✅ Complete | .ts 962 lines | **REBUILD** | Worst-offender for duplication (3× schedule, 2× readiness). Use mockup. Component split needed. |
| **Coach Dashboard** | 4/10 | ✅ Wired (multi-service) | ✅ Complete | .ts 973 lines | **REBUILD** | Same — use mockup. 8-col roster table must die. |
| Today's Practice | 8.5/10 | ✅ Wired (UnifiedTraining) | ✅ Complete | .ts 1119 lines, SCSS 1074 lines | REFACTOR | Best in class structurally. But the mega-files need splitting before any change. |

---

## 📊 Analytics & performance

| Page | UX | Backend | Implementation | Tech debt | Action | Notes |
|------|----|---------|----|------|--------|-------|
| Analytics (Performance Insights) | 5.5/10 | ✅ Wired | ⚠️ Fragile chart lifecycle | .ts 1175 lines | **REBUILD** | Apply hero ACWR pattern + new chart library. Fragile defensive chart guards suggest bugs we're not seeing. |
| Enhanced Analytics | 6/10 | ✅ Wired (Supabase) | ✅ Complete | normal | POLISH | Replace tabs with stacked cards. Use new chart components. |
| ACWR Dashboard | 8.5/10 | ✅ Wired | ⚠️ "CLEANUP REQUIRED" | acwr.service 1360 lines | POLISH | UX is best in class. Fix the canonical-page debt (PrimeNG overrides + raw spacing) first. |
| Performance Tracking | 6.5/10 | ✅ Wired | ✅ Complete | .ts 975 lines | **REBUILD** | Hero stat missing. Merge Focus Areas + Gap Analysis. |
| **Coach Analytics** | 4/10 | ❌ **NOT WIRED** | ❌ Pure UI shell | normal | **WIRE first, then REBUILD** | No service injection visible — only static signals. Build the backend before redesigning. |

---

## 🏈 Game-day & training

| Page | UX | Backend | Implementation | Tech debt | Action | Notes |
|------|----|---------|----|------|--------|-------|
| Game Day Readiness | 8/10 | ✅ Wired | ✅ Complete | clean | POLISH | Swap generic icons for sport-specific. |
| Tournament Nutrition | 7/10 | ✅ Wired | ✅ Complete | SCSS 1497 lines (largest!) | REFACTOR | SCSS monster blocks design token migration. Fix first. |
| **Tournament Management** | 3/10 | ✅ Wired | ✅ Complete | .ts 1181 lines | **REBUILD** | Worst UX in coach ops. Huge cards, no calendar view. Component split required. |
| Game Tracker | 6/10 | ✅ Wired (realtime) | ⚠️ Optimistic queue, no retry | .ts 1206 lines, HTML 847 lines | REFACTOR + POLISH | Biggest .ts file in the app. Split into sub-components, then polish. |
| Live Game Tracker | 7/10 | ✅ Wired (realtime) | ✅ Complete | shared w/ game-tracker | POLISH | Enlarge field SVG, surface undo/redo. |
| Film Room (player) | 6/10 | ✅ Wired | ✅ Complete | normal | POLISH | Add overdue badge, simplify cards. |
| Film Room (coach) | 7/10 | ✅ Wired | ✅ Complete | normal | POLISH | Inline tagging on card. |
| Playbook (shared) | 6.5/10 | ✅ Wired | ✅ Complete | normal | POLISH | Add role-based filter. |
| Playbook Manager (coach) | 7/10 | ✅ Wired | ✅ Complete | normal | POLISH | Enlarge formation diagram. |
| Playbook Quiz | n/a | ⚠️ Partial (static questions) | ⚠️ Local state only | normal | **WIRE** | Questions are hardcoded. Build content service. |

---

## 👥 Roster & player management

| Page | UX | Backend | Implementation | Tech debt | Action | Notes |
|------|----|---------|----|------|--------|-------|
| **Roster** | 8/10 | ✅ Wired (full CRUD) | ✅ Complete | HTML 670 lines | POLISH | Best wired page in app. Defer-load on hero stats hurts first paint — fix that. |
| Depth Chart | 6/10 | ✅ Wired | ✅ Complete | normal | POLISH | Sticky unassigned sidebar. |
| Attendance | 8/10 | ✅ Wired | ✅ Complete | clean | KEEP | Works well. |
| Injury Management | 6/10 | ⚠️ Low confidence (ApiService only) | ✅ Complete | HTML 725 lines | **WIRE + REBUILD** | Confirm backend endpoint exists. Add timeline view. |
| Player Development | 7/10 | ✅ Wired | ⚠️ Hardcoded "B+" grade | normal | POLISH + WIRE | Make skill assessments dynamic. |
| Return to Play | 8/10 | ✅ Wired | ✅ Complete | normal | KEEP | Excellent 7-stage protocol. |
| Officials | 7/10 | ✅ Wired | ✅ Complete | normal | POLISH | Merge payment summary into assignments table. |

---

## 🛠 Coach operations

| Page | UX | Backend | Implementation | Tech debt | Action | Notes |
|------|----|---------|----|------|--------|-------|
| Practice Planner | 6/10 | ✅ Wired (CRU) | ⚠️ Missing Delete | normal | POLISH + WIRE | Add deletePractice / cancelPractice methods. Add hero card. |
| Program Builder | 7/10 | ✅ Wired | ✅ Complete | normal | POLISH | Less dense players grid. |
| **Scouting Reports** | 3/10 | ⚠️ Low confidence (ApiService only) | ✅ Complete | normal | **WIRE + REBUILD** | Confirm backend. Replace 6-section essay form with quick-note mode. |
| Payment Management | 6/10 | ✅ Wired (Stripe) | ✅ Complete | HTML 703 lines | POLISH | Consolidate Overview/Fees tabs. |
| Coach Inbox | 8/10 | ✅ Wired | ✅ Complete | clean | POLISH | Strong already. Surface action buttons. |
| Activity Feed | 8/10 | ✅ Wired | ✅ Complete | clean | KEEP | Works. |
| Coach Calendar | 7/10 | ✅ Wired | ✅ Complete | HTML 653 lines | POLISH | Sticky legend; remove RSVP duplication. |
| **AI Scheduler** | 8/10 | ⚠️ Low confidence (external AI) | ⚠️ Service unclear | normal | **WIRE** | Verify AI backend integration. Strong UX already. |
| Knowledge Base | 6/10 | ✅ Wired | ✅ Complete | HTML 755 lines | POLISH | Reorder tabs (My Submissions first). |
| Equipment | 7/10 | ✅ Wired | ✅ Complete | normal | POLISH | Merge summary cards into table. |

---

## 💬 Social & communication

| Page | UX | Backend | Implementation | Tech debt | Action | Notes |
|------|----|---------|----|------|--------|-------|
| Chat (team channels) | 7/10 | ✅ Wired (realtime) | ✅ Complete | channel.service 1347 lines | POLISH + REFACTOR | Service is god-class. Split before any redesign work. |
| AI Coach (Merlin chat) | 7/10 | ✅ Wired | ✅ Complete | .ts 1131 lines, SCSS 1345 lines | REFACTOR + POLISH | Mega component + mega SCSS. Split first. |
| Notifications | 7/10 | ✅ Wired | ✅ Complete | notification-state 1001 lines | POLISH | Add filter tabs. |
| Community | 6/10 | ✅ Wired | ⚠️ Pending media not cleared on error | SCSS 989 lines | POLISH | Fix error handler. |
| Achievements | 8/10 | ✅ Wired | ✅ Complete | clean | KEEP | Strong bento. Just link leaderboard preview to full page. |

---

## 🏋️ Training & wellness (orphan-route heavy)

| Page | UX | Backend | Implementation | Tech debt | Action | Notes |
|------|----|---------|----|------|--------|-------|
| Training Schedule | n/a | ✅ Wired | ✅ Complete | training.component "CLEANUP REQUIRED" | REFACTOR | Canonical page with design debt. Fix tokens before reusing as pattern. |
| Wellness | n/a | ✅ Wired (CRUD) | ✅ Complete | wellness.service 819 lines | KEEP | Solid. Group into Wellness Hub (nav recommendation below). |
| Cycle Tracking | 7/10 | ✅ Wired | ✅ Complete | normal | POLISH | Currently orphan-route. Add to Wellness Hub for visibility. |
| Sleep Debt | n/a | ✅ Wired | ✅ Complete | normal | POLISH | Currently orphan-route. Add to Wellness Hub. |
| Exercise Library | 8/10 | ✅ Wired | ✅ Complete | normal | POLISH | Sticky pagination control. |
| Advanced Training tools (qb-hub, periodization, microcycle, goal-planner, load-analysis, ai-scheduler, training-log, video-feed) | n/a | ✅ Wired (most) | ✅ Mostly complete | varies | **NAV FIX** | All orphan-routes hidden behind "Advanced Training" hub. Need primary nav exposure. |

---

## ⚙️ Settings, profile, utility

| Page | UX | Backend | Implementation | Tech debt | Action | Notes |
|------|----|---------|----|------|--------|-------|
| Profile | 7/10 | ✅ Wired | ✅ Complete | .ts 955 lines | POLISH | Add headline stat. Split component. |
| Settings (all tabs) | 7/10 | ✅ Wired | ✅ Complete | normal | KEEP | Functional. |
| Payments (player) | 6/10 | ✅ Wired | ✅ Complete | normal | POLISH | Discoverable quick-pay CTA. |
| Help / FAQ | 7/10 | n/a | ✅ Complete | normal | POLISH | Add FAQ search. |
| Data Import | 6/10 | ✅ Wired | ✅ Complete | normal | POLISH | Single input with source toggle. |

---

## 🔐 Admin

| Page | UX | Backend | Implementation | Tech debt | Action | Notes |
|------|----|---------|----|------|--------|-------|
| Superadmin Dashboard | n/a | ✅ Wired | ✅ Complete | normal | KEEP | Out of scope for premium-athletic redesign. |
| Superadmin Settings / Teams / Users | n/a | ✅ Wired | ✅ Complete | normal | KEEP | Internal tools. |

---

## 🩺 Staff (specialist roles)

| Page | UX | Backend | Implementation | Tech debt | Action | Notes |
|------|----|---------|----|------|--------|-------|
| Staff Hub | n/a | ✅ Wired | ✅ Complete | normal | POLISH | Add breadcrumb on detail pages. |
| Nutritionist / Physio / Psychology Dashboards | n/a | ✅ Wired | ✅ Complete | normal | KEEP | Functional. Polish after coach surfaces ship. |
| Decision Ledger | n/a | ⚠️ Orphan service (decision-ledger.service) | ⚠️ Service exists, unclear coverage | normal | **WIRE / VERIFY** | Service exists but may be under-used. Verify it's actually loading data. |

---

## 🔥 Top 10 "fix-first" items (blockers for the redesign)

These are the ones the code-quality and implementation audits flagged as **blocking** for the design system rollout. Numbered in order of impact:

1. **Split `flag-football-performance-system.service.ts`** — 1650 lines, god-class. Blocks any performance UI work.
2. **Consolidate 7 training services** — `unified-training.service.ts` is supposed to be canonical. Merge `training-data`, `training-plan`, `training-stats-calculation`, `training-safety`, `training-metrics` into it.
3. **Fix the two "CLEANUP REQUIRED" canonical pages** — ACWR Dashboard and Training. They have hardcoded values + PrimeNG overrides that other pages will copy.
4. **Consolidate 4 statistics services** — `statistics-calculation` vs `training-stats-calculation` vs `team-statistics` vs `player-statistics`. Clarify boundaries.
5. **Extract `.data.ts` knowledge bases** — 3 files at 1300+ lines each (`flag-football-performance-system.data.ts`, `flag-football-athlete-profile.data.ts`, `sprint-training-knowledge.data.ts`). Move to separate lazy-loaded modules.
6. **Standardize DI pattern** — pick one of `inject()` vs constructor injection. Currently 31% inject(), 69% constructor.
7. **Split top 3 mega-components** — game-tracker (1206), tournaments (1181), analytics (1175). Each needs to become 5-6 sub-components.
8. **Refactor mega SCSS files** — tournament-nutrition (1497 lines), ai-coach-chat (1345), travel-recovery (1094), today (1074). Extract shared mixins.
9. **Verify low-confidence backend wiring** — coach-analytics (no service), scouting-reports, injury-management, ai-scheduler. Confirm or build the API endpoints.
10. **Remove 11 `!important` declarations** — concentrated in `_onboarding.scss` and `_cards.scss`. They'll fight the new design tokens.

---

## Navigation gaps to fix during redesign (from nav audit)

1. **Expose Advanced Training in primary nav** — 7 valuable tools currently orphan-routes (periodization, microcycle, goal-planner, load-analysis, ai-scheduler, qb-hub, training-log).
2. **Create a Wellness Hub** — currently `/acwr`, `/cycle-tracking`, `/sleep-debt`, `/return-to-play` are all orphan-routes. Group them under `/wellness`.
3. **Unify "Performance" vs "Stats" naming** — coach sees "Performance", player sees "Stats". Same content. Pick one.
4. **Fix mobile bottom-nav "More" menu discoverability** — add badge/icon when items are inside.
5. **Add breadcrumbs to Staff sub-pages** — no return path from detail to hub.

---

## What the audit did NOT find (the good news)

- ✅ Zero hardcoded hex colors in component SCSS (tokens are respected)
- ✅ Zero TODO/FIXME comment debt
- ✅ Zero broken `routerLink` targets
- ✅ Zero orphan templates (every `.component.html` has a matching `.component.ts`)
- ✅ Consistent OnPush change detection (200+ instances)
- ✅ Consistent RxJS subscription cleanup via `takeUntilDestroyed`
- ✅ Mature Supabase + ApiService dual-pattern (clean separation of concerns)
- ✅ Form validation present on all user input pages

You don't have a broken app. You have a **big, mostly-working app** with a few monolithic files that will hurt during the redesign if not addressed first.
