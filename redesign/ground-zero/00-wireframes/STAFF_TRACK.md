# Staff track — coach / physiotherapist / nutritionist / psychologist

Built on the SAME locked design system (tokens + `scss/system` vocabulary) as the
athlete app — no new visual language. The athlete app stays untouched; staff get a
parallel routed shell, chosen by the signed-in user's **team role**.

## Role → experience (TeamMembershipService.role())
`TeamRole`: owner · admin · head_coach · coach · offense/defense_coordinator ·
assistant_coach · strength_conditioning_coach · **physiotherapist** ·
**nutritionist** · **psychologist** · player · manager.

- **player** → the existing athlete app (today/training/wellness/stats/more).
- **coach-family** (head_coach/coach/coordinators/assistant/S&C/owner/admin/manager)
  → Coach dashboard.
- **physiotherapist** → Physio view. **nutritionist** → Nutrition view.
  **psychologist** → Psychology view.

A signed-in user with no staff role lands on the athlete app. `/staff` routes are
guarded by `isStaff` (anything other than `player`/no-team → staff).

## Shell
`StaffShellComponent` — same frame as the athlete shell, but role-aware bottom nav:
- **Coach**: Roster · Alerts · Schedule · More
- **Physio**: Roster · Injuries · More
- **Nutrition**: Roster · Plans · More
- **Psychology**: Roster · Check-ins · More

Top bar shows team name + role chip. The FAB is hidden (staff don't self-log).

## Screens (assembled from the locked vocabulary)

### Roster (shared, role-tinted) — `GET /api/roster/players?teamId=`
List of athletes (`avatar/initials · name · #jersey · position`). Each row shows a
role-appropriate **summary chip** AND respects consent:
- Coach: readiness band + ACWR band — or "not shared" when `performance_sharing` off.
- Physio/Psych: health flag (injury/RTP/low-wellness) — or "not shared" when
  `health_sharing` off.
- Nutrition: plan status — or "not shared".
Tapping a row → Athlete detail.

### Athlete detail (role-aware) — `/staff/athlete/:id`
Header (name/jersey/position) + role sections, each consent-gated with an explicit
**"Athlete hasn't shared this with staff"** empty state (privacy-first; default OFF):
- **Coach**: load/ACWR trend, readiness history, recent sessions, event load.
  (`/api/coach`, `/api/coach-analytics`.)
- **Physio**: active injuries + history, return-to-play protocol/stage.
  (`/api/staff-physiotherapist`.)
- **Nutrition**: nutrition profile + active plan + adherence.
  (`/api/staff-nutritionist`.)
- **Psychology**: mental-wellness check-ins / reports, mood/stress trend.
  (`/api/staff-psychology`.)

### Alerts (coach) — `GET /api/coach-alerts`
ACWR danger / elevated, injury blocks, low-readiness, missed check-ins — each links
to the athlete. Acknowledge → `POST /api/coach-alerts` (ack).

### Schedule (coach) — the shared spine (`/api/schedule`) at team scope; here a coach
can also set an event's **game format** (`minutes_per_game`) so competition load is
honest team-wide (ties to the 2x12/2x20/2x40 fix).

## Consent (privacy-first — enforced server-side, surfaced in UI)
The backend RLS + `check_performance_sharing` / `check_health_sharing` gate every
read; **default is OFF**. The staff UI never fabricates — when a value is gated it
shows the explicit "not shared" state, so staff see *who* opted in vs not. AI/mental
data additionally needs `ai_processing` / health consent.

## Build order
1. role detection + `StaffShellComponent` + `/staff` routing + `isStaff` guard.
2. Roster + Athlete-detail (role-aware sections) wired with consent empty states.
3. Coach Alerts; coach event-format editor on Schedule.
