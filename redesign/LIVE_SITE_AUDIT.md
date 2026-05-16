# FlagFit Pro — Live Site Audit (Deployed)

**Date:** 2026-05-16
**URL:** https://webflagfootballfrogs.netlify.app
**Method:** Visual walkthrough of deployed Netlify build with real account data
**Pages captured so far:** Landing, Login, Register, Today's Practice, Player Dashboard

This audit focuses on what the **deployed UI** actually looks like — issues only visible in the live build (loading states, empty states, real data quirks, theme inconsistencies). Cross-references the code audit findings.

---

## TL;DR — three new issues the code audit missed

1. **Empty-state UX is broken across the board.** Every metric on the player dashboard shows "--" or "0". A "Critical: Missing Wellness Data" red alert fires immediately on landing. New users see what looks like a broken app.
2. **Massive theme disconnect.** Landing page is gorgeous dark + green athletic. The moment you log in, everything turns light/white/plain. No visual continuity. Looks like two different products.
3. **The "Today" page is overwhelming, not actionable.** Today's session shows "11 blocks / 67 exercises / ~188 min" — that's over 3 hours of training in a single day. No human will do this. The default plan is mathematically correct but psychologically unusable.

---

## Page-by-page findings

### 1. Landing page (`/`) — Live score: 6/10 (matches code audit)

**Confirmed from code audit:**
- ✅ Dark theme is gorgeous, green accent works
- ✅ "Elevate Your Flag Football Game" hero is strong
- ✅ Olympic countdown is visually prominent
- ⚠️ Olympic countdown DOMINATES — 790 days, 13 hours, 18 mins, 23 secs takes more visual weight than the value prop. Confirmed gimmick concern.
- ⚠️ "LA28 / 5v5 / ∞" mini-stats below buttons feel like filler
- ⚠️ "Everything You Need to Excel" features section is generic ("Powerful tools designed to help you train smarter, compete better, and grow faster")
- ⚠️ Feature cards have no metrics, no proof — just vague descriptions ("Track every training session and game statistic", "Connect with players, coaches, and teams")
- ⚠️ Footer is sparse — only 6 links across 2 columns ("Quick Links" + "Resources"), brand description is one line

**New issues found in live view:**
- The "Powerful tools designed to help you train smarter" sub-headline is the 4th vague platitude in a row. Reads like template SaaS copy.
- "Merlin AI - Merlin" — the title repeats the name twice ("Merlin AI" then "Merlin"). Looks like a string-concat bug in the i18n template.
- Footer "FlagFit Pro" wordmark is lonely on the left — no trust signals (testimonials, logos, "trusted by X teams"), no contact, no social.

**Priority: P0 REBUILD** (matches existing plan — use `mockup-landing.html`).

---

### 2. Login page (`/login`) — Live score: 4/10 (worse than expected)

The code audit didn't flag this. The live view does.

**Issues:**
- **The "Sign In" button looks disabled.** Pale washed-out green, low contrast. Users will hesitate to click. Probably actually disabled until both fields are filled, but there's no visual cue that this is the reason.
- **Total visual disconnect from landing.** Landing is dark/black/neon-green athletic vibe. Login is plain white card with default browser styling on inputs. Looks like a different company.
- **No branding continuity.** Just a tiny flag icon top-left. No logo, no team identity, no "Welcome to FlagFit Pro" with the same energy as landing.
- **Form inputs use system default styling.** No focus states visible. No password visibility toggle visible (the eye icon is there but tiny and unstyled).
- **"Remember me" + "Forgot your password?" cramped** on one line with no spacing.
- **Cookie consent banner at bottom is HUGE.** "Customize / Necessary Only / Accept All" buttons take up a quarter of the screen. Mobile users will see almost nothing else.

**Priority: P0 REBUILD** — must visually match landing's premium athletic feel.

---

### 3. Register page (`/register`) — Live score: 4/10

Same issues as login. The "Create Account" button is also disabled-looking pale green.

**Specific issues:**
- The form is honest about its requirements ("Min. 8 characters — must include uppercase, lowercase, number, and special character (@ $ ! % * ? &)") — that's good UX writing.
- But the form layout is plain: stacked inputs with system styling, no visual hierarchy, no progress indicator.
- "I confirm that I am 16 years of age or older" + "I agree to the Terms of Service and Privacy Policy" checkboxes are tiny and visually weak.
- The "Or — Already have an account? Sign in" at the bottom looks like an afterthought.
- No social/SSO sign-up shown (Google/Apple) — even though `auth-callback.component` exists in the codebase suggesting OAuth is wired.

**Priority: P0 REBUILD** alongside login as a single auth surface.

---

### 4. Today's Practice (`/todays-practice`) — Live score: 5/10 (worse than the 8.5/10 code audit suggested)

The code audit called this "best in class structurally" — and it IS structurally rich. But on first paint with real data it's overwhelming.

**Critical issues:**
- **"Readiness: —"** is the first thing under the user's name. No data, dashed out. The hero metric is empty.
- **"Today's Exact Training" → "Speed session" → "11 blocks / 67 exercises / ~188 min"** — 188 minutes is over 3 hours. 67 exercises in one day is psychologically unusable. The default Baseline Program is too aggressive for someone with no logged data.
- **"Today's Status" card is text-heavy and overflows.** The text reads: *"Baseline Program Active. Daily training starts from safe flag football defaults until a coach plan, team practices, competitions, and your logged workload personalize it."* It's getting visually clipped inside its container.
- **Action buttons inside the status card are confusing.** "Start Training" + "Log Workout" are crammed into the corner of a text panel. Looks like the buttons belong to the body text, not the card.
- **"Check-in not logged yet" card** has the same issue — long text + two buttons ("2-min Check-in" + "Start Anyway") jammed in.
- **0% completion bar at the top of "Today's Practice"** combined with "0/67 Exercises" is depressing — system telling user how much they haven't done before showing them what to do.

**The right pattern (from your mockups):**
- Hero readiness ring (or "Check in to unlock readiness" prompt)
- Single action: "Start today's session"
- Realistic block count: 3-5 blocks for a 45-60 min session
- Defer the 67-exercise list to a "View full plan" link

**Priority: P0 REBUILD** — this is the daily home page, it has to be motivating, not overwhelming.

---

### 5. Player Dashboard (`/player-dashboard`) — Live score: 3/10 (much worse than 5/10 code audit)

This is where the deployed reality is dramatically worse than the code suggested. Empty-state hell.

**What I see:**
- Welcome card: "Good afternoon, AJ!" — fine, but subtitle is generic "Complete a wellness check-in and log training sessions to get personalized insights."
- Right column 4 stat cards, all empty:
  - Readiness: **--**, badge says "No data", caption "Due today · Takes 2 min"
  - ACWR: **--**, badge says "Log training sessions"
  - Day Streak: **0**
  - This Week: **0/0**
- Below: huge red alert "Critical: Missing Wellness Data — 38 days without wellness check-in"
  - With a "Why this matters" explanation
  - And bullet points on impact ("ACWR confidence reduced (missing recovery context)")

**Why this is broken:**
1. **Empty state should be welcoming, not alarming.** Showing "Critical" in red for a fresh account is a guaranteed bounce. The system is correct — wellness data is missing — but the framing is wrong.
2. **Four empty stat cards = visual broken-ness.** A new user thinks the app doesn't work. There's no skeleton state, no "Let's get you set up" overlay, no progressive onboarding.
3. **No hero metric.** The mockup shows a big readiness ring as the hero. The deployed page has no anchor at all.
4. **The blue "No data" / "Log training sessions" badges** look like the buttons themselves — they're confusingly action-shaped.
5. **The welcome card is giant and has nothing in it.** Mostly empty space + 2 CTAs.

**The right pattern (from `mockup-player-dashboard.html`):**
- If no data → big friendly onboarding hero: "Let's get your first readiness score" + 2-min check-in CTA
- If data → big readiness ring + status badge
- The 4 stats become real charts (sparklines) once data exists
- "Critical: Missing Wellness Data" becomes a soft suggestion, not a red alert, until day 14+

**Priority: P0 REBUILD + redesign empty states across every dashboard.**

---

## Cross-cutting issues only visible in the deployed build

### Theme inconsistency is the biggest unfixed problem

Landing = dark, green, dramatic, athletic.
Every logged-in page = white, flat, default browser styling.

This is not what you decided ("light by default, dark after 7pm"). Even the **light theme** should look premium and athletic — Strava's daytime mode is light but still polished. What's deployed looks like a wireframe, not a finished product.

**Fix:** the `_athletic-patterns.scss` we planned must apply in BOTH light and dark mode. Premium typography (Space Grotesk), generous spacing, big numbers, proper shadows — those don't depend on dark mode. The light mode just needs to LOOK premium.

### Empty states are systematically broken

Every page I've seen with no data shows:
- Dashes (`--`) where numbers should be
- Generic placeholder text
- Aggressive "Critical" or "No data" alerts
- Buttons that look disabled because forms are blank

This is a category of work that didn't exist in any audit. Add to the foundation plan: **a `<ff-empty-state>` component** that handles all "no data yet" cases with friendly onboarding nudges instead of red alerts.

### The PWA install prompt is still showing

Top-right of every page: green "Install" button (Chrome's install pill). Means the PWA manifest is configured correctly. ✅

### URL routing works, deep-linking works, no 404s seen yet

Login → dashboard → today's practice all loaded cleanly. No flash of unstyled content (FOUC). The Angular SSR / preload strategy is doing its job.

### Search bar at the top of every page

There's a "Search for players, teams & more   ⌘K" bar in the top app bar. Smart UX move. But: I haven't tested it — let's confirm it works on the next walkthrough.

### Sidebar navigation is clean

The deployed sidebar matches what the code audit said: Home (Today, Overview), Athlete (Training, Wellness, Stats), Team (Team, Chat, Competition), Tools (Merlin AI, Knowledge, Reports), Me (Profile, Notifications, Settings, Help, Achievements). Solid IA. The orphan-route problem (advanced training tools, ACWR, sleep-debt, cycle-tracking) is confirmed — none of those are in the sidebar.

---

## Round 2 — pages 6-12 (deep in-app surfaces)

### 6. Wellness check-in (`/wellness`) — Live score: 4/10

The most-used daily action and it looks like an unstyled HTML form.

**Issues:**
- **Sliders are not sliders.** "Sleep Hours / Sleep Quality (1-10) / Energy Level (1-10) / Muscle Soreness (1-10) / Mood / Stress / Motivation / Readiness" are all rendered as **plain text inputs with up/down spinners**. The most important daily ritual in the app uses default browser styling.
- **No visual scale.** A "1-10 muscle soreness" input is a UX classic for sliders with face icons (😀😐😣). What's deployed is "Type a number from 1 to 10."
- **All sections look the same.** Sleep & Recovery, Physical State, Mental State — three section headers with the same icon/spacing/typography. Nothing visually distinguishes mood from heart rate.
- **Captions like "1 = No soreness, 10 = Very sore" appear under inputs** — but this scale convention is inverted between fields (1 = no soreness, but 1 = relaxed, but 1 = low energy?). User has to re-read the scale every field.
- **Tooltip on the sleep field saying "Daily Wellness Check-in"** is firing strangely — looks like a stuck tooltip overlay.
- **Submit button is at the bottom** with footer copy ("Daily check-ins help optimize your training load") — fine, but no preview of "what happens next" (e.g., "We'll calculate your readiness score").

**Why this is the most damaging issue we've found:**
The dashboard says "Critical: Missing Wellness Data" → the user clicks "Check in now" → lands on this. Friction is high, polish is zero. Adoption will tank. **This page needs to feel like a 30-second ritual, not a tax form.**

**Priority: P0 REBUILD** with proper slider UI (`<ff-rating-slider>` with face/color cues).

---

### 7. Roster (`/roster`) — Live score: 3/10 (deployed reality is much worse than 8/10 code audit)

The code audit called this "best wired page" — and the SERVICE is wired. But the **deployed page is empty and the empty-state messaging is wrong**.

**Issues:**
- **Page shows "No players match your filters"** — but actually there are zero players on the roster. The empty state is blaming the filter, when the truth is the team has no roster yet.
- **No "Add your first player" CTA.** The action that should be the hero is invisible. There IS an "Add Player" button somewhere in the page somewhere — but on first paint, the user just sees confusion.
- **"Team Overview" expandable card at top is empty** — no team stats because no team data.
- **Filter bar is huge and prominent** for an empty roster. Search input, "All Positions" dropdown, "All Status" dropdown, View toggles, JUMP TO buttons — all useless when you have 0 players.
- **The filter chips repeat — "Players / Players"** — the JUMP TO Players button looks identical to the View Players toggle. Confusing.

**The right pattern for empty roster:**
- One full-width hero card: "Build your roster" + big "+ Add player" + "Bulk import CSV" + "Send invite link" buttons
- Filters/search hidden until 5+ players exist

**Priority: P0 EMPTY STATE FIX + REBUILD** — this is the page coaches sell prospects on. Empty roster looking broken kills first impressions.

---

### 8. Performance Intelligence / Analytics (`/performance/insights`) — Live score: 6/10 (better empty state pattern than other pages)

This page actually has the **best empty-state pattern in the app** — and we should propagate it everywhere.

**What's good:**
- **"Building Your Profile" amber bar with progress (4/7 days)** is exactly the right empty-state vibe. Friendly, informative, shows progress, no red alerts. ✅ This is the pattern.
- **"Source: Training & Wellness Data · Last updated: 5/16/26, 3:50 PM"** caption builds trust — user knows where the numbers come from.
- **Hero "Performance Intelligence" + "Real-time insights across fitness, readiness, and development."** is a clean opening.

**What's wrong:**
- **"Performance Hub" card with 3 sub-cards (Insights, Load Monitoring, Performance Tests)** — these are REDUNDANT. We're already ON the Insights page. The 3 sub-cards are basically a tab bar pretending to be content. They should be a real tab bar at the top.
- **"My Development Goals" → "Goals will appear here"** — empty state is OK, but the explanation is passive ("Your coach will assign development goals here. Check back soon or ask your coach to set goals for you."). No CTA to message the coach. No "Add a goal yourself" option.
- **Generic icons throughout** (chart icon, shield, target). Same problem as everywhere else — not athletic.

**Priority: P1 POLISH** — keep the empty-state pattern, fix the redundant Performance Hub, propagate the "Building Your Profile" bar to other pages with no data.

---

### 9. ACWR / Load Monitoring (`/acwr`) — Live score: 5/10 (better empty state but no value yet)

**What's good:**
- **"PREVENTION" eyebrow + "Load Monitoring" title + "Track workload trends to prevent overtraining and injury."** Clean hero, clear purpose.
- **"No Data Yet" amber badge** is the right empty-state tone (vs Player Dashboard's red "Critical").
- **Two-column layout (Current Workload Status + Weekly Progression)** has good bones for when data exists.

**What's wrong:**
- **"Insufficient Data for ACWR · We need more training sessions to calculate your chronic load."** — passive again. No "Log your first session" CTA visible.
- **"Weekly Progression: 0.0% · Within safe limits (<10%) · This Week 0 · Last Week 0"** is meaningless. Showing "0.0%" with "Within safe limits" is technically correct but confusing — it's 0% because there's no data, not because the user is safe.
- **"Insufficient Data for ACWR"** appears twice on screen (header status + main empty state).

**Priority: P1 REBUILD empty state** — "Log your first 4 sessions to unlock your ACWR" with a progress dots indicator (4 empty circles, fill as sessions logged).

---

### 10. Knowledge Base (`/knowledge`) — Live score: 3/10 + LIVE BUG

**🚨 LIVE BUG FOUND:** Top-right toast says **"Submission History Error · Could not load your submissions"**. This is a real production error firing on page load. Worth investigating before any redesign work — the API call or the error handling is broken.

**Plus a stacked toast:** "Warning · Your profile is 80% complete · Missing Team, Profile Photo. Complete it for the best experience." This profile-completion warning is firing on EVERY page (it was on the player dashboard too). It's a global notification not tied to this surface — too aggressive, should appear only on profile/settings.

**Other issues:**
- **"Knowledge Base" with subtitle "Coaching resources and team knowledge"** — title is fine, but the page has nothing on it.
- **Search input is huge** for an empty knowledge base.
- **"My Submissions" tabs (All / Pending / Approved / Rejected)** is the user's own submissions — nothing about the actual knowledge content (drills, plays, articles). Code audit said "category grid at bottom is wasted space" — appears the team may have only built the user-submission half of this feature, not the actual knowledge content.
- **"Add Resource" button top-right** is the only action — but there's no example content to learn from.

**Priority: P0 BUG FIX** for the submission history error. Then **P1 REBUILD** to surface actual content.

---

### 11. Merlin AI Chat (`/chat`) — Live score: 7/10 — the cleanest in-app surface

This is actually the **best-looking in-app page in the deployed build**.

**What's good:**
- **"Merlin AI · YOUR PERFORMANCE STRATEGIST"** hero card with green icon — clean, branded, athletic.
- **"Ready to train, AJ?" centered welcome with flag icon** — friendly, action-oriented.
- **Two preset prompt cards: "SKILLS · Improve route running" + "NUTRITION · Pre-game nutrition"** — exactly the right pattern. Lowers the cognitive cost of "what do I ask?"
- **"AI MODE · 0% confidence · Missing wellness check-ins reduce recommendation accuracy."** — honest about quality. Sets correct expectations.
- **"NEW SESSION · Merlin is ready to ground the next answer."** — micro-copy that explains what's happening.

**What's wrong:**
- **"Grounding context is loading."** stays on screen indefinitely. Either show a spinner, or state when it'll be ready.
- **Empty white card below the prompts** — purpose unclear, looks like a dead container.
- **Only 2 preset prompts.** Should be 6-8 (Practice planning, Injury risk, Game day prep, Tournament prep, Offseason, Recovery, Skill drill, Tactics).

**Priority: POLISH only.** This is the model for what other in-app surfaces should feel like.

---

### 12. Settings (`/settings`) — Live score: 6/10

Functional, plain, has redundant nav.

**Issues:**
- **Nav has 5 items but two look duplicate: "Privacy & Security" AND "Security"**. Pick one. The code audit hinted at this.
- **Form fields are plain HTML** — same problem as wellness check-in. No visual polish.
- **Date input shows European format "20. 11. 1988"** with a calendar picker — locale handling works, fine.
- **"Age: 37 years" caption under DOB** — nice computed display.
- **Position dropdown ("Center (C)")** + Jersey number 55 + height 188cm + weight 90kg — real data is loading. ✅
- **"Save Changes" button top-right is detached from the form.** When you scroll the form, the save button stays in the header — actually fine, but feels disconnected.
- **Search input "Search profile, password, theme..."** is good UX for a settings page.

**Priority: P2 POLISH.** Merge the duplicate Security nav items. Style the form inputs.

---

## Updated priority matrix (live audit overrides)

| Page | Code audit | Live score | Why the gap | Action |
|------|------------|-----------|-------------|--------|
| Landing | 6/10 | 6/10 | Match | REBUILD (planned) |
| Login | n/a | **4/10** | Visual disconnect from landing | **Add to P0 REBUILD** |
| Register | n/a | **4/10** | Same as login | **Add to P0 REBUILD** |
| Today's Practice | 8.5/10 | **5/10** | 67 exercises in 1 day is unusable | **Promote to P0 REBUILD** |
| Player Dashboard | 5/10 | **3/10** | Empty-state hell, red alert on first paint | **P0 REBUILD + empty states** |
| Wellness check-in | n/a | **4/10** | Unstyled HTML form for daily ritual | **Promote to P0 REBUILD** |
| Roster | 8/10 | **3/10** | Wrong empty-state msg, no "add player" hero | **Add empty-state fix to P0** |
| Performance Insights | 5.5/10 | 6/10 | Better than expected — has the right empty pattern | P1 POLISH |
| ACWR | 8.5/10 | 5/10 | Good empty-state badge but redundant "0.0%" stats | P1 POLISH |
| Knowledge Base | 6/10 | **3/10** + 🐛 LIVE BUG | Submission history error firing in prod | **P0 BUG FIX first** |
| Merlin AI Chat | 7/10 | **7/10** ✅ | Best-looking in-app page — model for others | POLISH only |
| Settings | 7/10 | 6/10 | Duplicate "Security" nav item | P2 POLISH |

---

## What changes in the foundation plan

Add four new shared components to Sprint 1:

7. **`<ff-empty-state>`** — handles all "no data yet" cases. Variants:
   - `building` — the amber "Building Your Profile · 4/7 days" pattern (PROMOTE this from analytics page to everywhere)
   - `welcome` — friendly first-time setup CTA
   - `nudge` — soft suggestion (not red, not aggressive)
   - `critical` — only for actually-urgent things (injury risk, abnormal ACWR)
8. **`<ff-auth-card>`** — wraps login, register, password reset, email verify. Matches landing's premium look.
9. **`<ff-rating-slider>`** — replaces the wellness form's text inputs. 1-10 with face icons + color cues. Single component used 8 times on the wellness check-in.
10. **`<ff-toast-stack>`** — properly styled global notification system. Currently the "Submission History Error" + profile-completion warnings are firing as plain stacked toasts. Needs design love.

Add to Sprint 4 (P0 page redesigns):
- **Login + Register** as a paired surface (the auth experience).
- **Today's Practice** — daily home, the deployed version is overwhelming.
- **Wellness check-in** — daily ritual, the deployed version is a tax form.
- **Roster empty-state** — first impression for any new team.

Add a **Sprint 0 (immediate)**: fix the live bug.
- Investigate the Knowledge Base "Submission History Error" — broken API call or broken error boundary.

---

## The pattern we should propagate everywhere

The "Building Your Profile · Limited Data · 4/7 days" amber bar from `/performance/insights` is **the right empty-state pattern for the whole app**. Friendly tone, tells the user what's needed, shows progress, no panic. Replace every "Critical" red alert and every "--" stat card with this pattern, and the app immediately feels welcoming instead of broken.

Same with Merlin AI's design language — small eyebrow, big friendly headline, two preset action chips, honest "0% confidence" disclaimer. That visual recipe should anchor the new design system.

---

## Final priority list — what to ship in what order

**Week 0 (right now):**
1. 🐛 Fix Knowledge Base submission history bug — it's firing on every page load
2. Stop the global profile-completion warning from appearing on every page (move to profile/settings only)

**Sprint 1 (foundation):**
1. Build the 6 + 4 shared components (hero-metric, broadcast-card, status-strip, action-card, bento-grid, empty-state, auth-card, rating-slider, toast-stack, athletic-patterns.scss)
2. Logo color: indigo → green
3. Light theme polish — premium even in daylight (Strava-day-mode polish, not wireframe)

**Sprint 2 (chart library):** All 12 chart components

**Sprint 3 (cleanup):**
- Split the 1650-line performance service
- Consolidate 7 training services
- Fix the 2 "CLEANUP REQUIRED" canonical pages
- Verify low-confidence backend wiring

**Sprint 4 (P0 page redesigns):**
- Landing
- Login + Register
- Player Dashboard (with proper empty states)
- Coach Dashboard
- Today's Practice
- Wellness Check-in
- Roster (with proper empty state)

After Sprint 4 the design system is real and every other page is just a small PR away from being on it.

---

## Round 3 — mobile view + coach dashboard (from code)

### 13. Mobile view of Today's Practice — Live score: 6/10

Captured on actual mobile viewport. Surprisingly decent structurally.

**What's good:**
- The "Today / Saturday, May 16 / Readiness: --" hero card stacks cleanly at the top.
- Big green "Log Today's Session" CTA is thumb-reachable.
- The 3 stat tiles (BLOCKS 11 / EXERCISES 67 / DURATION ~188 min) stack vertically and are scannable.
- "START WITH" → "Morning Mobility" → "Start Exact Plan" is a clear next step.
- **Bottom tab nav** (Today · Training · Wellness · Stats · More) is clean, 5-item, well-iconed. ✅
- Top app bar is compact (hamburger + brand + search icon).

**What's broken:**
- Same content problem — "67 EXERCISES / 188 min" is even more overwhelming on mobile because there's nothing else to look at.
- "Readiness: --" is the same empty-state hell as desktop.
- "Log Today's Session" vs "Start Exact Plan" — two big green buttons within scroll distance, same color, different actions. Confusing.

**Verdict:** Mobile structure is fine. The fix is the same fix as desktop — fix the content and empty states, not the layout.

---

### 14. Coach Dashboard — From code (since AJ doesn't have coach role)

I read `angular/src/app/features/dashboard/coach-dashboard.component.html` and confirmed the structure matches the code audit. Key observations:

**Section order on the page:**
1. `<app-coach-dashboard-priority-section>` — Merlin insight + risk alerts + missing-data players (the lead)
2. `<app-coach-dashboard-protocols-section>` — team continuity / active RTP protocols (deferred load)
3. `<app-coach-dashboard-summary-section>` — team overview KPIs (deferred load)
4. `<app-coach-dashboard-partial-data-notice>` — only shows if some players blocked data sharing
5. **Two-column workspace:**
   - Left: Roster table (`<app-coach-dashboard-roster-section>`)
   - Right (deferred): "Today schedule" mini-card + "Roster shortcuts" mini-card

**Confirmed problems from the code audit:**
- ✅ "Roster shortcuts" sidebar duplicates buttons that exist in the priority section (Injuries / At Risk / Performance) — **redundancy**.
- ✅ Schedule mini-card uses tiny "ev-date" + "ev-info" stacks — too compact to scan on glance.
- ✅ The roster table is rendered via a single sub-component — easy to swap for a card-based layout.
- ✅ All 3 sections (protocols, summary, schedule) are `@defer (on viewport)` with skeleton placeholders. Good lazy-load discipline.
- ✅ Page has 3 dialogs (Create Session, Send Team Message, Request Access) — all properly deferred.

**One thing the code audit missed:**
- The page uses `<app-page-error-state>` and `<app-loading variant="skeleton">` for error/loading states. These already exist as shared components — the foundation isn't starting from zero. We should reuse `<app-loading variant="skeleton">` instead of building a new loading component.

**Skeletons that already exist in shared/components — reuse, don't rebuild:**
- `<app-loading>` (skeleton + spinner variants)
- `<app-page-error-state>` (with retry action)
- `<app-card-shell>` (base card with header / footer slots)
- `<app-button>` (variant="text|outlined|primary", size="sm|md|lg", iconLeft/iconRight, fullWidth)
- `<app-dialog>` + `<app-dialog-header>` + `<app-dialog-footer>` (modal infrastructure)
- `<app-form-input>`, `<app-textarea>`, `<app-select>` (form primitives)
- `<app-main-layout>` (the page chrome)

**This changes the foundation plan slightly** — we're adding patterns ON TOP of these existing primitives, not replacing them.

---

## What to watch for as we audit more pages

Hypothesis from the data we've seen so far:
- Most in-app pages are going to look the same: white card on grey, plain inputs, dashed-out empty states.
- The pages that ARE wired to data (roster, wellness check-in form) might look better.
- Mobile view will likely have wrap issues given the desktop spacing patterns.

Will update this doc after we capture the next batch of screenshots.
