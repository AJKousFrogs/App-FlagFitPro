# FlagFit Pro — UX Audit Report

**Contract:** FlagFit Pro Design System Contract 2026-02-10  
**Audit Date:** 2026-02-10  
**Scope:** UX + structural audit only (no visual design changes)  
**Single source of truth:** `angular/src/scss/README.design-system.md`

---

## EXECUTIVE SUMMARY

### UX Health: **Amber** (Proceed with targeted fixes before UI polish)

The FlagFit Pro application has a mature feature set and clear user roles. Core flows (auth → onboarding → dashboard → training/wellness) are functionally complete, and state feedback patterns (loading, empty, error) are generally consistent. However, the app has **structural UX debt** that will cause confusion, drop-off, and data quality issues if UI polish proceeds without fixes.

**Key findings:**

| Area | Health | Summary |
|------|--------|---------|
| User roles & goals | Good | Athlete, Coach, Admin, Staff roles are well defined; dashboard routing works. |
| Onboarding | Good | Multi-step flow with auto-save; email verification blocking is clear. |
| Training / Wellness | Good | Today’s Practice hub, wellness check-in, ACWR dashboard are coherent. |
| Information architecture | Amber | Sidebar vs bottom-nav inconsistency; many routes orphaned from nav; terminology duplication. |
| Critical flows | Amber | Some dead ends; ACWR “View Load History” targets non-existent route. |
| Data entry & validation | Amber | Units often explicit; some inputs can silently break calculations; wellness schema mapping gaps. |
| State feedback | Good | Loading, empty, error states exist; toast constants centralized. |
| Design system contract | Amber | `:global()` and `.p-*` in component SCSS; multiple loading components. |

**UX Readiness Verdict:** **No — not ready for full UI polish.** Resolve blockers and high-impact items first so UI work does not hide or worsen structural gaps.

---

## 1) USER INTENT & PRODUCT CLARITY

### 1.1 User Roles Identified

| Role | Source | Core Goal |
|------|--------|-----------|
| **Athlete (Player)** | `common.models.ts`, dashboard routing | Track wellness, log training, view readiness/ACWR, follow protocol |
| **Coach** | `dashboard.component.ts`, `team-membership.service.ts` | Manage roster, plan practice, view team analytics, injury management |
| **Staff** | `staff-hub.component`, team roles | Nutritionist, Physiotherapist, Psychology dashboards; decision ledger |
| **Superadmin** | `superadmin.guard.ts` | Platform administration, teams, users |
| **Guardian** | `common.models.ts` | (Role defined but no dedicated flows found) |

### 1.2 “Success in 5 Minutes” (Critical Flows)

| Role | Success in 5 Minutes | Status |
|------|---------------------|--------|
| Athlete | Log wellness check-in → See readiness → Complete today’s protocol | ✅ Achievable |
| Athlete | View ACWR → Understand risk zone → See next action | ✅ Achievable |
| Coach | View roster → See player readiness/ACWR → Take action | ✅ Achievable |
| Coach | Plan practice → Publish to team | ✅ Achievable |
| Staff | Access staff hub → View discipline dashboard | ✅ Achievable |

### 1.3 Features Without Clear User Goal or Completed Flow

| Feature | Issue |
|---------|-------|
| `/help` | Route exists, no auth guard; unclear entry point from nav. |
| `/staff` (Staff Hub) | Hub exists; individual staff roles may not know they should use `/staff` first. |
| `/exercisedb` | Coach-only; not in sidebar or bottom-nav. |
| `/data-import` (`/import`) | In wellnessRoutes but no nav entry; power-user feature. |
| `load-monitoring` → `/acwr` redirect | Users may search “load monitoring” and land on ACWR; terminology split. |
| Guardian role | Defined but no dedicated dashboard or flows. |

---

## 2) INFORMATION ARCHITECTURE (STRUCTURAL UX)

### 2.1 Route vs Navigation Parity

**Routes NOT in sidebar or bottom-nav (orphaned or hard to discover):**

| Route | Location | Severity |
|-------|----------|----------|
| `/load-monitoring` | Redirects to `/acwr` | Minor (redirect works) |
| `/injury-prevention` | Redirects to `/acwr` | Minor |
| `/exercisedb` | Coach-only | Major (coach tool, no nav) |
| `/staff` | Staff hub | Major (staff may not find it) |
| `/staff/nutritionist`, `/staff/physiotherapist`, etc. | Staff dashboards | Major |
| `/superadmin/*` | Superadmin | Expected (no nav for security) |
| `/help` | Help center | Minor |
| `/import` | Data import | Minor (power user) |
| `/return-to-play` | RTP protocol | Minor |
| `/cycle-tracking` | Female athletes | Minor (guarded) |
| `/sleep-debt`, `/achievements`, `/playbook`, `/film` | Wellness/player | Minor |
| `/depth-chart`, `/equipment`, `/officials` | Team/coach | Minor |
| `/training/advanced`, `/training/periodization`, etc. | Training sub-routes | Minor |

### 2.2 Terminology Duplication / Confusion

| Concept | Duplicate Names | Recommendation |
|---------|-----------------|-----------------|
| Load monitoring | “ACWR”, “Load Monitoring”, “Injury Prevention” | Use “ACWR” as primary; “Load monitoring” as subtitle. |
| Dashboard | “Dashboard”, “Player Dashboard”, “Coach Dashboard”, “Athlete Dashboard” | Standardize labels; `athlete-dashboard` → `player-dashboard` already redirects. |
| Today | “Today’s Practice”, “Today”, “Daily Protocol” | Keep “Today’s Practice” as nav label; “Daily” for internal routes. |
| Wellness | “Wellness & Recovery”, “Quick Check-in”, “Daily Check-in” | Clarify: “Check-in” = action; “Wellness” = hub. |

### 2.3 IA Issues List

1. **Sidebar vs bottom-nav mismatch**  
   - Sidebar: 16 primary athlete items + More group; bottom-nav: 4 primary + More.  
   - Athletes on mobile see only 4 items; desktop sees many. Inconsistent mental model.

2. **Staff routes orphaned**  
   - `/staff` is a hub but not prominent for nutritionist/physio/psychology users.

3. **Duplicate privacy routes**  
   - `/privacy` and `/privacy-policy` both exist; consolidate or redirect.

4. **Settings vs Profile**  
   - `/settings` and `/settings/profile` and `/profile` overlap; clarify hierarchy.

5. **“Planning” vs “Programs” vs “Practice Planner”**  
   - Coach nav uses “Planning” → `/coach/programs`; coach sidebar has “Planning” and “Practice Planner” as separate items. Regroup.

### 2.4 Suggested Reorderings (NO visual changes)

| Area | Current | Suggested |
|------|---------|-----------|
| Athlete primary nav | Dashboard, Today, Training, Wellness, Analytics, Performance, Roster, Team Chat, … | Keep Dashboard, Today, Training, Wellness as top 4; move Analytics/Performance under “Insights” or secondary. |
| Coach primary nav | Dashboard, Roster, Team Chat, Planning, Analytics, … | Add “Staff” link for staff users; group Planning + Practice Planner under “Planning”. |
| “Me” group | Profile, Settings, Achievements | Keep; consider adding “Help” link. |

---

## 3) END-TO-END FLOW AUDIT

### 3.1 Onboarding

| Step | Discoverable? | Clear what to do? | Required data obvious? | Next step obvious? |
|------|---------------|-------------------|-------------------------|---------------------|
| 1. Personal Info | ✅ | ✅ | ✅ (required asterisk) | ✅ Next |
| 2. User Type & Role | ✅ | ✅ | ✅ | ✅ |
| 3–8. Player steps | ✅ | ✅ | ✅ | ✅ |
| Summary + Consents | ✅ | ✅ | ✅ | ✅ Complete Setup |
| Post-complete | ✅ | Redirect to `/dashboard` | — | ✅ |

**Notes:** Email verification blocks completion; “I’ve Verified” allows manual refresh. Auto-save draft and progress bar are clear.

### 3.2 Profile Setup

| Step | Discoverable? | Clear? | Required? | Next? |
|------|---------------|--------|-----------|-------|
| Profile page | ✅ Via nav | ✅ | — | Edit → Save |
| Settings | ✅ | ✅ | — | — |
| Privacy controls | ✅ `/settings/privacy` | ✅ | — | — |

**Gap:** No guided “complete your profile” flow after onboarding; Profile Completion service exists but entry points are scattered.

### 3.3 Training / Wellness / Bodyweight Entry

| Flow | Discoverable? | Clear? | Required? | Next? |
|------|---------------|--------|------------|-------|
| Today’s Practice | ✅ Primary nav | ✅ | Check-in first (phase-aware) | Protocol → Wrap-up |
| Wellness check-in | ✅ Via “Log Check-in” | ✅ | Sliders have labels | Save → Toast |
| Quick check-in | Modal/dialog | ✅ | Overall feeling, sleep, pain | Submit |
| Full wellness | `/wellness` | ✅ | Metrics optional | — |
| Bodyweight in check-in | Optional field, kg | ✅ | Optional | — |
| Training log | `/training/log` | ✅ | Session data | — |

**Gap:** `QuickWellnessCheckin` maps to `WellnessData` (sleep, energy, mood, stress, soreness); `DailyReadiness` uses different schema (pain_level, fatigue_level, sleep_quality, motivation_level, weight_kg). Two systems; ensure API expects both or unify.

### 3.4 Viewing Readiness / ACWR / Outputs

| Flow | Discoverable? | Clear? | Required? | Next? |
|------|---------------|--------|------------|-------|
| ACWR dashboard | ✅ Nav “ACWR” | ✅ | 21 days + 10 sessions for ratio | “Go to Today’s Practice” CTA |
| Insufficient data | ✅ Empty state | ✅ Progress bars (days, sessions) | — | “Log session” link |
| Risk zone alert | ✅ | ✅ 5-question contract | — | Action buttons |
| Readiness on Today | ✅ | ✅ | — | — |

**Dead end / Mismatch:** ACWR “View Load History” button calls `viewHistory()` which navigates to `/training/schedule` — that route redirects to `/training`. User expects a “load history” view; they land on the training schedule. Either: (a) add a dedicated load-history view or tab, or (b) change copy to “View Training Schedule” so expectations match.

### 3.5 Editing or Correcting Data

| Flow | Discoverable? | Clear? | Required? | Next? |
|------|---------------|--------|------------|-------|
| Edit wellness | Re-log same day? | ⚠️ Unclear if overwrite | — | — |
| Edit training session | `/training/session/:id` | ✅ | — | — |
| Edit profile | `/profile` | ✅ | — | — |

**Gap:** No explicit “Edit today’s check-in” or “Correct yesterday’s wellness” flow; users may not know they can overwrite.

### 3.6 Explicit Dead Ends / Missing Next Actions

| Screen | Issue |
|--------|-------|
| ACWR “View Load History” | Handler `viewHistory()` — verify route and copy. |
| Empty states without primary CTA | Audit `EmptyStateComponent` usage; ensure all have `actionLabel` + `actionLink` or `actionHandler`. |
| Error states | `PageErrorStateComponent` has retry; ensure retry is wired. |
| Help center | No clear “Back to app” or “Contact support” CTA in some topics. |

### 3.7 Flows That Rely on User Guessing

| Flow | Risk |
|------|------|
| Staff finding their dashboard | Staff may not know to go to `/staff` first. |
| Coach finding Exercise DB | No nav; coaches may not discover it. |
| Female athlete cycle tracking | Guarded route; needs clear “Available for you” entry when applicable. |
| Data import | Power users may not find `/import`. |

---

## 4) DATA ENTRY UX & CALCULATION TRUST

### 4.1 Units Explicit

| Input | Units | Status |
|-------|-------|--------|
| Weight (daily readiness) | kg | ✅ |
| Height (onboarding) | cm / ft-in | ✅ |
| Sleep (quick check-in) | hrs | ✅ |
| Sliders (pain, fatigue, etc.) | 0–10 scale | ✅ |
| RPE / load | AU (arbitrary units) | ✅ In ACWR context |

### 4.2 Dependencies Clear

| Calculation | Dependencies | Clear in UI? |
|-------------|--------------|--------------|
| ACWR | Acute (7d), Chronic (28d), min sessions | ✅ Data quality indicators |
| Readiness | Wellness inputs | ⚠️ Partial; Confidence Indicator helps |
| Weekly progression | Current vs previous week load | ✅ |

### 4.3 Defaults Safe and Sensible

| Input | Default | Assessment |
|-------|---------|------------|
| Sliders (pain, fatigue, etc.) | Mid-range | ✅ |
| Weight | Optional, no default | ✅ |
| Sleep hours | User input | ✅ |

### 4.4 Validation Informative

| Form | Validation | Assessment |
|------|------------|------------|
| Login | Email, password required | ✅ |
| Onboarding | Required fields marked | ✅ |
| Wellness check-in | Optional fields | ✅ |
| Quick check-in | `canSubmit()` checks | ✅ |

### 4.5 Inputs That Can Silently Break Calculations

| Input | Risk |
|-------|------|
| Weight 0 or null | Profile/body composition may show “—” or outdated; acceptable. |
| Missing sleep | Readiness still computed; confidence may drop. |
| Training session without duration × RPE | ACWR acute/chronic affected; `DataSourceBanner` and confidence indicator help. |
| Imperial height (ft/in) | Converted correctly in onboarding. |

### 4.6 Data That Should Be Required But Isn’t

| Field | Context | Recommendation |
|-------|---------|-----------------|
| Team (onboarding) | Required for players/staff | ✅ Required |
| Primary position (player) | Required | ✅ Required |
| Height/weight (player) | Required for load calcs | ✅ Required |
| Sleep (wellness) | Optional | Consider soft prompt when missing. |

---

## 5) STATE FEEDBACK & TRUST SIGNALS

### 5.1 Loading States

| Component | Usage |
|-----------|--------|
| `AppLoadingComponent` | overlay, spinner, skeleton variants |
| `LoadingStateComponent` | inline loading |
| `PageLoadingStateComponent` | full-page |
| `SpinnerComponent` | legacy |
| `SkeletonLoaderComponent` | via AppLoading |

**Issue:** Multiple loading components; no single canonical pattern. Prefer `AppLoadingComponent` for new code.

### 5.2 Empty States

| Component | Usage |
|-----------|--------|
| `EmptyStateComponent` | Generic; supports icon, title, message, action, benefits, help link |

**Assessment:** Well-structured; ensure every list/table uses it with a clear primary action.

### 5.3 Error States

| Component | Usage |
|-----------|--------|
| `PageErrorStateComponent` | Page-level errors; retry button |
| Toast (error) | Form/API errors |
| Inline validation | Form errors |

**Assessment:** Consistent; retry is available.

### 5.4 Success Confirmations

| Mechanism | Usage |
|-----------|--------|
| `ToastService.success()` | Centralized via `TOAST` constants |
| `SuccessCheckmarkComponent` | Optional visual |

**Assessment:** Toast constants reduce inconsistency; success feedback is present after saves.

### 5.5 Async Action Feedback

| Action | Feedback |
|--------|----------|
| Login | Loading → Toast success/fail |
| Onboarding save | Auto-save indicator |
| Wellness save | Loading on button → Toast |
| Training log | Toast |
| ACWR load | Skeleton → Content or error |

**Assessment:** Most async actions have feedback; audit remaining forms for loading + toast.

### 5.6 Empty States Explain What’s Missing

| Screen | Empty state quality |
|--------|----------------------|
| ACWR insufficient data | ✅ Explains 21 days + 10 sessions; progress bars; CTA |
| Wellness charts | “No sleep data yet. Start logging daily check-ins.” ✅ |
| Training log | Verify `EmptyStateComponent` with action |

### 5.7 Errors Actionable and Human-Readable

| Source | Quality |
|--------|---------|
| `TOAST.ERROR.*` | ✅ Human-readable |
| `PageErrorStateComponent` | ✅ Title + message + retry |
| API errors | Via `error.interceptor`; message may be technical; consider user-facing mapping. |

---

## 6) UX CONSISTENCY & COMPLETENESS

### 6.1 Same Action Implemented Differently

| Action | Variations |
|--------|------------|
| “Save” / “Submit” | “Save Check-in”, “Submit Check-in”, “Complete Setup” — acceptable context-based. |
| “Log session” | “Go to Today’s Practice”, “Log session” — standardize CTA copy. |
| Navigate to wellness | “Log Check-in”, “Need full check-in? →” — fine. |

### 6.2 Inconsistent Terminology

| Term | Variants |
|------|-----------|
| Check-in | “Check-in”, “Check in”, “Quick Check-in”, “Daily Check-in” |
| Dashboard | “Dashboard”, “Player Dashboard”, “Coach Dashboard” |
| Analytics | “Analytics” vs “Coach Analytics” — clear context. |

### 6.3 Screens That Feel Half-Built

| Screen | Notes |
|--------|-------|
| `/help` | Exists; content and structure need review. |
| Staff dashboards | May have sparse data; empty states critical. |
| `/community` | Verify content completeness. |
| `/playbook` (player) vs `/coach/playbook` | Two playbooks; ensure purpose is clear. |

### 6.4 Buttons or Sections with Unclear Value

| Element | Concern |
|---------|---------|
| “Export JSON” on ACWR | Power-user; keep but ensure not prominent over “Export PDF”. |
| “View Load History” | Confirm destination. |
| “Team Hub” vs “Team Management” | Overlap; clarify. |

---

## 7) DESIGN SYSTEM CONTRACT VIOLATIONS (UX-LEVEL)

**Contract:** No `::ng-deep`, no `:global()`, no PrimeNG internals in component SCSS.

### 7.1 Confirmed Violations

| File | Violation | Impact |
|------|-----------|--------|
| `enhanced-data-table.component.scss` | `:global(.p-datatable)` | DS violation |
| `game-tracker.component.scss` | `:global(input)`, `:global(select)`, etc. | DS violation |
| `physiotherapist-dashboard.component.scss` | `.p-progressbar` | PrimeNG internals in component SCSS |

### 7.2 Documented Exceptions (Comments Only)

| File | Note |
|------|------|
| `wellness-checkin.component.scss` | DS-EXC-012 ref |
| `daily-readiness.component.scss` | DS-EXC-026 ref |
| `superadmin-dashboard.component.scss` | DS-EXC-021 ref |

These reference `_exceptions.scss`; verify blocks exist and are documented.

### 7.3 Ad-Hoc Layout vs Canonical Utilities

| Pattern | Contract | Findings |
|---------|----------|----------|
| Spacing | `.p-*`, `.m-*`, `.gap-*` only | Audit found duplicates removed; `design-system-tokens.scss` is canonical. |
| Flex | `layout-system.scss` | `primitives/_layout.scss` had duplicates; deprecation noted. |
| Components | `:host` + layout; spacing via tokens | Some components use raw values; low UX impact. |

### 7.4 UX Issues from PrimeNG Usage

| Issue | Location | Fix type |
|-------|----------|----------|
| Dialog “Skip for now” vs “Save” | Daily readiness modal | Copy/order; no DS change |
| Stepper linear vs non-linear | Onboarding | `[linear]="false"` allows skip; consider for optional steps |
| InputNumber suffix “ kg” | Daily readiness | ✅ Clear |

---

## 8) PRIORITIZATION & READINESS

### 8.1 UX Issue List (Prioritized)

#### Severity: Blocker (Must-fix before UI polish)

| ID | Issue | Impact | Fix type |
|----|-------|--------|----------|
| B1 | ACWR “View Load History” → `/training/schedule` → `/training`; label promises “load history” but user gets schedule | Confusion | UX-only (copy) or Structural (add load-history view) |
| B2 | Staff routes not discoverable for staff users | Drop-off | Structural (nav/IA) |
| B3 | `:global()` and `.p-*` in component SCSS | Regressions during polish | Systemic |
| B4 | Duplicate wellness check-in schemas (Quick vs Daily) | Data quality | Structural (API/UX alignment) |

#### Severity: Major (High-impact quick wins)

| ID | Issue | Impact | Fix type |
|----|-------|--------|----------|
| M1 | Sidebar vs bottom-nav mismatch (16 vs 4 items) | Confusion | UX-only (copy, grouping) |
| M2 | Coach Exercise DB not in nav | Drop-off | Structural |
| M3 | Privacy route duplication (`/privacy` vs `/privacy-policy`) | Confusion | Structural |
| M4 | “Edit/correct yesterday’s wellness” not discoverable | Data quality | UX-only (copy, entry point) |
| M5 | Help center entry point unclear | Confusion | UX-only |

#### Severity: Minor (Can wait)

| ID | Issue | Impact | Fix type |
|----|-------|--------|----------|
| m1 | Guardian role no dedicated flows | Edge case | Structural |
| m2 | Multiple loading components | Tech debt | Systemic |
| m3 | Terminology: “Check-in” variants | Low | UX-only |
| m4 | Orphaned power-user routes (import, etc.) | Low | Structural |

### 8.2 Sort Order for Implementation

**1) Must-fix before UI polish**

- B1, B2, B3, B4

**2) High-impact quick wins**

- M1, M2, M3, M4, M5

**3) Can wait until later iterations**

- m1–m4

---

## 9) UX-TO-UI HANDOFF CHECKLIST

Use this checklist before starting UI polish so UX and design stay aligned.

### 9.1 Pre-Polish UX Sign-Off

- [x] B1: **FIXED** ACWR “View Load History” — either change copy to “View Training Schedule” or add dedicated load-history view
- [x] B2: **FIXED** Staff Hub in sidebar + bottom-nav for staff roles
- [x] B3: **FIXED** Moved to _exceptions (DS-EXC-003/004/005)
- [ ] B4: Wellness check-in schema (Quick vs Daily) documented and API aligned
- [x] M1: **FIXED** Help, Staff, Exercise DB added to nav
- [x] M2: **FIXED** In sidebar + bottom-nav More menu
- [x] M3: **FIXED** /privacy-policy redirects to /privacy
- [ ] M4: “Edit previous check-in” or equivalent discoverable
- [x] M5: **FIXED** In sidebar Me group + bottom-nav More

### 9.2 Flow Completeness

- [ ] Every primary flow has a clear “next action”
- [ ] Empty states have primary CTA
- [ ] Error states have retry or recovery path
- [ ] Success feedback (toast or equivalent) for all saves

### 9.3 Design System Compliance

- [ ] No new `::ng-deep` or `:global()` in component SCSS
- [ ] No new PrimeNG internals in component SCSS
- [ ] Spacing via `.p-*`, `.m-*`, `.gap-*` only
- [ ] Flex via `layout-system.scss`

### 9.4 Copy & IA Lock

- [ ] Terminology map: ACWR, Load monitoring, Check-in, Dashboard, etc.
- [ ] Nav labels final for athlete and coach
- [ ] Route → nav parity documented

### 9.5 Safe to Polish

- [ ] All blocker items resolved
- [ ] Major items triaged (fix now vs later)
- [ ] Handoff checklist signed off by product/UX

---

## APPENDIX: Route Inventory (Key Routes)

| Route | Auth | Nav | Notes |
|-------|------|-----|-------|
| `/` | No | — | Landing |
| `/login`, `/register` | No | — | Auth |
| `/onboarding` | No* | — | Post-reg, pre-dashboard |
| `/dashboard` | Yes | — | Redirects to role dashboard |
| `/player-dashboard` | Yes | ✅ | Athlete home |
| `/coach/dashboard` | Yes | ✅ | Coach home |
| `/todays-practice` | Yes | ✅ | Daily hub |
| `/training` | Yes | ✅ | Training hub |
| `/wellness` | Yes | ✅ | Wellness hub |
| `/acwr` | Yes | ✅ | ACWR dashboard |
| `/analytics` | Yes | ✅ | Analytics |
| `/roster` | Yes | ✅ | Roster |
| `/chat` | Yes | ✅ | Merlin AI |
| `/staff` | Yes | ✅ | Staff hub — fixed (nav for staff roles) |
| `/superadmin/*` | Yes (guard) | — | No nav intentional |
| `/help` | No | ✅ | Help — fixed (sidebar Me + bottom-nav More) |

---

*End of UX Audit Report*
