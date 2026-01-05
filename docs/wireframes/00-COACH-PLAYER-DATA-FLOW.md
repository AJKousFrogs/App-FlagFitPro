# Coach → Player Data Flow Audit

**Date:** January 3, 2026  
**Purpose:** Verify every coach action has corresponding player visibility

---

## Summary

| Coach Action                   | Player View                          | Status |
| ------------------------------ | ------------------------------------ | ------ |
| Creates training program       | Sees program in Training Schedule    | ✅     |
| Assigns specific workouts      | Sees workouts in Today's Practice    | ✅     |
| Creates plays in Playbook      | Sees plays in Playbook (Player View) | ✅     |
| Tags player in Film            | Sees tags in Film Room (Player View) | ✅     |
| Assigns film to watch          | Sees assigned film with due dates    | ✅     |
| Creates team event             | Sees event in Team Calendar          | ✅     |
| Sends RSVP request             | Can RSVP in Team Calendar            | ✅     |
| Creates fee/payment            | Sees balance in My Payments          | ✅     |
| Sends announcement             | Sees in Team Chat + Notifications    | ✅     |
| Direct messages player         | Sees in Team Chat                    | ✅     |
| Starts RTP protocol for player | Sees in Return-to-Play page          | ✅     |
| Sets development goals         | Sees goals (needs verification)      | ⚠️     |
| Creates practice script        | Sees practice activities in Today    | ✅     |
| Sends tournament RSVP          | Sees in Tournaments + Calendar       | ✅     |
| Adds coach notes               | Player doesn't see (internal)        | ✅     |
| Updates depth chart            | Player sees position in Roster       | ✅     |

---

## Detailed Flow Analysis

### 1. Training Programs & Schedules

**Coach Creates:**

- Programs in `C05-PROGRAM-BUILDER.md`
- Practice sessions in `C06-PRACTICE-PLANNER.md`
- AI-generated schedules in `C11-AI-SCHEDULER.md`

**Player Sees:**

- `02-TRAINING-SCHEDULE.md` → Full calendar with scheduled sessions ✅
- `03-TODAY-PRACTICE.md` → Today's specific activities ✅
- `01-PLAYER-DASHBOARD.md` → Today's schedule preview ✅
- `33-DATA-IMPORT.md` → Can import external programs (JSON) ✅

**Data Flow:** `training_programs` → `training_sessions` → Player UI

---

### 2. Playbook

**Coach Creates:**

- Plays in `C13-PLAYBOOK-MANAGER.md`
- Play diagrams with formations
- Player-specific assignments

**Player Sees:**

- `29-PLAYBOOK-PLAYER.md` → Full play cards with diagrams ✅
- `29-PLAYBOOK-PLAYER.md` → "Your Assignment" section highlighted ✅
- `29-PLAYBOOK-PLAYER.md` → Quiz mode for memorization ✅
- `29-PLAYBOOK-PLAYER.md` → Memorization tracking ✅

**Data Flow:** `playbook_plays` → `play_assignments` → `player_playbook_progress`

---

### 3. Film & Video Analysis

**Coach Creates:**

- Film sessions in `C14-FILM-ROOM-COACH.md`
- Timestamps & tags (positive, correction)
- Assigns film to players

**Player Sees:**

- `30-FILM-ROOM-PLAYER.md` → Assigned film with due dates ✅
- `30-FILM-ROOM-PLAYER.md` → "My Tagged Moments" section ✅
- `30-FILM-ROOM-PLAYER.md` → Jump-to-timestamp feature ✅
- `30-FILM-ROOM-PLAYER.md` → Watch progress tracking ✅
- `24-NOTIFICATIONS.md` → Film assignment notification ✅

**Data Flow:** `film_sessions` → `video_timestamps` → `film_assignments` → `film_watch_progress`

---

### 4. Team Events & Calendar

**Coach Creates:**

- Events in `C15-CALENDAR-COACH.md`
- Practices, games, tournaments, meetings
- RSVP requests with deadlines

**Player Sees:**

- `31-TEAM-CALENDAR.md` → Full calendar view ✅
- `31-TEAM-CALENDAR.md` → RSVP dialog with options ✅
- `31-TEAM-CALENDAR.md` → Ride coordination ✅
- `31-TEAM-CALENDAR.md` → "Needs RSVP" section ✅
- `01-PLAYER-DASHBOARD.md` → "Coming Up" events ✅
- `24-NOTIFICATIONS.md` → Event reminders ✅

**Data Flow:** `team_events` → `event_rsvps` → Player UI

---

### 5. Payments & Fees

**Coach Creates:**

- Fees in `C16-PAYMENT-MANAGEMENT.md`
- Tournament costs, dues, equipment
- Payment reminders

**Player Sees:**

- `32-MY-PAYMENTS.md` → Current balance ✅
- `32-MY-PAYMENTS.md` → Outstanding fees with breakdown ✅
- `32-MY-PAYMENTS.md` → Payment history ✅
- `32-MY-PAYMENTS.md` → Due dates & payment methods ✅
- `24-NOTIFICATIONS.md` → Payment reminders ✅

**Data Flow:** `team_fees` → `player_balances` → `payments`

---

### 6. Communications

**Coach Creates:**

- Announcements in `C09-TEAM-COMMUNICATIONS.md`
- Direct messages to players
- Position-group messages

**Player Sees:**

- `17-TEAM-CHAT.md` → Announcements channel (read-only) ✅
- `17-TEAM-CHAT.md` → Direct messages ✅
- `17-TEAM-CHAT.md` → Position group channels ✅
- `24-NOTIFICATIONS.md` → New message alerts ✅
- `01-PLAYER-DASHBOARD.md` → (No announcements banner in current wireframe) ⚠️

**Data Flow:** Messages → Real-time push → Player notifications

---

### 7. Injury & Return-to-Play

**Coach Creates:**

- Injury records in `C08-INJURY-MANAGEMENT.md`
- RTP protocols for players
- Medical notes

**Player Sees:**

- `22-RETURN-TO-PLAY.md` → Active recovery protocol ✅
- `22-RETURN-TO-PLAY.md` → 7-stage progress ✅
- `22-RETURN-TO-PLAY.md` → Daily check-in form ✅
- `22-RETURN-TO-PLAY.md` → Allowed activities & restrictions ✅
- `04-WELLNESS-RECOVERY.md` → Injury status indicator ✅

**Data Flow:** `injury_records` → `rtp_protocols` → `rtp_daily_log`

---

### 8. Tournaments

**Coach Creates:**

- Tournament registrations in `C10-TOURNAMENT-MANAGEMENT.md`
- Lineup assignments
- RSVP requests

**Player Sees:**

- `13-TOURNAMENTS.md` → Team tournaments list ✅
- `13-TOURNAMENTS.md` → RSVP for tournaments ✅
- `31-TEAM-CALENDAR.md` → Tournament events ✅
- `32-MY-PAYMENTS.md` → Tournament fees ✅

**Data Flow:** Coach registers → Players RSVP → Payment created

---

### 9. Player Development

**Coach Creates:**

- Development goals in `C07-PLAYER-DEVELOPMENT.md`
- Skill assessments
- Position benchmarks

**Player Sees:**

- `20-PERFORMANCE-TRACKING.md` → Performance metrics ✅
- `06-ANALYTICS.md` → Gap analysis vs benchmarks ✅
- ⚠️ **Missing:** Dedicated "My Development Goals" view

---

### 10. Roster & Team

**Coach Creates:**

- Depth chart in `C02-TEAM-MANAGEMENT.md`
- Position assignments
- Player status changes

**Player Sees:**

- `14-ROSTER.md` → Full team roster ✅
- `14-ROSTER.md` → Their position assignment ✅
- `07-PROFILE.md` → Their own profile ✅

**Data Flow:** Depth chart updates → Roster display

---

## Gaps Identified

### ✅ All Gaps Fixed

| Coach Action                  | Expected Player View            | Current Status                       |
| ----------------------------- | ------------------------------- | ------------------------------------ |
| Sets development goals        | "My Goals" section in Analytics | ✅ Fixed in `06-ANALYTICS.md`        |
| Adds coach notes about player | Private (OK)                    | ✅ Intentional                       |
| Team announcement banner      | Dashboard banner                | ✅ Fixed in `01-PLAYER-DASHBOARD.md` |

### Fixes Applied

1. **"My Development Goals" added to Analytics (`06-ANALYTICS.md`)**
   - Coach-assigned goals with targets and deadlines
   - Progress bars showing % toward goal
   - Days remaining countdown
   - Coach notes/guidance
   - Empty state when no goals assigned

2. **Announcements Banner added to Player Dashboard (`01-PLAYER-DASHBOARD.md`)**
   - Pinned/important announcements from coach
   - Shows coach name and timestamp
   - Dismiss button to hide temporarily
   - Hidden when no announcements

---

## Data Tables Reference

| Coach Table         | Player Table               | Relationship            |
| ------------------- | -------------------------- | ----------------------- |
| `training_programs` | `training_sessions`        | Program → Sessions      |
| `playbook_plays`    | `player_playbook_progress` | Plays → Player progress |
| `film_sessions`     | `film_watch_progress`      | Film → Watch tracking   |
| `team_events`       | `event_rsvps`              | Events → RSVPs          |
| `team_fees`         | `player_balances`          | Fees → Balances         |
| `injury_records`    | `rtp_daily_log`            | Injuries → Daily logs   |

---

## Verification Checklist

- [x] Training programs flow to player schedule
- [x] Playbook plays visible with assignments
- [x] Film tags appear for tagged players
- [x] Calendar events with RSVP capability
- [x] Payment fees show in player balance
- [x] Announcements reach player chat
- [x] RTP protocols show for injured players
- [x] Tournaments visible with RSVP
- [x] Development goals visible to player (in Analytics)
- [x] Dashboard shows important announcements

---

## Summary

**Coverage: 100%** ✅

All coach→player data flows are properly wired. All gaps have been fixed:

- ✅ Development goals visible in Analytics page
- ✅ Announcements banner added to Player Dashboard
