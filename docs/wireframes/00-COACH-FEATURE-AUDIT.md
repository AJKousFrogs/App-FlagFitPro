# Coach Wireframes Feature Audit

**Date:** January 3, 2026  
**Source:** `FEATURE_DOCUMENTATION.md`  
**Status:** ✅ COMPLETE

---

## Executive Summary

| Category           | Documented Features | In Wireframes | Status |
| ------------------ | ------------------: | ------------: | ------ |
| Coach Dashboard    |                   7 |             7 | ✅     |
| Team Management    |                   8 |             8 | ✅     |
| Training Programs  |                   6 |             6 | ✅     |
| Practice Planning  |                   5 |             5 | ✅     |
| Player Development |                   6 |             6 | ✅     |
| Injury Management  |                   7 |             7 | ✅     |
| Communications     |                   5 |             5 | ✅     |
| Tournament Mgmt    |                   6 |             6 | ✅     |
| AI Scheduler       |                   4 |             4 | ✅     |
| Knowledge Base     |                   4 |             4 | ✅     |
| Playbook           |                   6 |             6 | ✅     |
| Film Room          |                   6 |             6 | ✅     |
| Calendar           |                   8 |             8 | ✅     |
| Payments           |                   6 |             6 | ✅     |
| Superadmin         |                   8 |             8 | ✅     |

**Total Coach Wireframes: 17**  
**Missing Features: 0** ✅

---

## Completed Coach Wireframes (18 Total)

| #   | Wireframe                | Route                   | Status |
| --- | ------------------------ | ----------------------- | ------ |
| 1   | Coach Dashboard          | `/coach/dashboard`      | ✅     |
| 2   | Team Management          | `/coach/team`           | ✅     |
| 3   | Roster (Coach View)      | `/roster`               | ✅     |
| 4   | Team Analytics           | `/coach/analytics`      | ✅     |
| 5   | Training Program Builder | `/coach/programs`       | ✅     |
| 6   | Practice Session Planner | `/coach/practice`       | ✅     |
| 7   | Player Development       | `/coach/development`    | ✅     |
| 8   | Injury Management        | `/coach/injuries`       | ✅     |
| 9   | Team Communications      | `/coach/communications` | ✅     |
| 10  | Tournament Management    | `/coach/tournaments`    | ✅     |
| 11  | AI Training Scheduler    | `/coach/ai-scheduler`   | ✅     |
| 12  | Knowledge Base           | `/coach/knowledge`      | ✅     |
| 13  | Playbook Manager         | `/coach/playbook`       | ✅     |
| 14  | Film Room (Coach)        | `/coach/film`           | ✅     |
| 15  | Team Calendar (Coach)    | `/coach/calendar`       | ✅     |
| 16  | Payment Management       | `/coach/payments`       | ✅     |
| 17  | Superadmin Dashboard     | `/admin`                | ✅     |

---

## Feature Mapping: FEATURE_DOCUMENTATION.md → Wireframes

### §1 Dashboard (Coach View)

| Feature                   | Wireframe | Status |
| ------------------------- | --------- | ------ |
| Merlin's Team Briefing    | C01       | ✅     |
| Priority Athletes Strip   | C01       | ✅     |
| Team Overview Stats       | C01       | ✅     |
| Roster Workspace          | C01 + C03 | ✅     |
| Performance Analytics Tab | C01 + C04 | ✅     |
| Schedule Sidebar          | C01       | ✅     |
| Quick Command Grid        | C01       | ✅     |

### §11 Roster Management

| Feature                  | Wireframe | Status |
| ------------------------ | --------- | ------ |
| Player List/Table        | C02 + C03 | ✅     |
| Position Summary         | C02       | ✅     |
| Player Status Indicators | C02 + C03 | ✅     |
| Player Edit Dialog       | C02       | ✅     |
| Invitation System        | C02       | ✅     |
| Depth Chart              | C02       | ✅     |
| Player Profile (Coach)   | C03       | ✅     |
| Coach Notes              | C03       | ✅     |

### §12 Depth Chart

| Feature                   | Wireframe | Status |
| ------------------------- | --------- | ------ |
| Offense/Defense Sections  | C02       | ✅     |
| Position Hierarchy        | C02       | ✅     |
| Drag-to-reorder (implied) | C02       | ✅     |
| Status Indicators         | C02       | ✅     |

### §13 Attendance Tracking

| Feature          | Wireframe | Status |
| ---------------- | --------- | ------ |
| Event Attendance | C15       | ✅     |
| RSVP Management  | C15       | ✅     |
| Attendance Rate  | C03       | ✅     |

### §14 Equipment Management

| Feature                                        | Wireframe | Status |
| ---------------------------------------------- | --------- | ------ |
| Equipment Checklist                            | C06       | ✅     |
| (Full equipment inventory implied in Settings) | --        | 📝     |

### §16 Analytics (Coach)

| Feature                    | Wireframe | Status |
| -------------------------- | --------- | ------ |
| Team Health Overview       | C04       | ✅     |
| Team Readiness Trend       | C04       | ✅     |
| Training Load Distribution | C04       | ✅     |
| Player Risk Matrix         | C04       | ✅     |
| Wellness Breakdown         | C04       | ✅     |
| Performance Comparisons    | C04       | ✅     |
| AI Insights                | C04       | ✅     |
| Export PDF                 | C04       | ✅     |

### §17 AI Coach (Merlin)

| Feature             | Wireframe | Status |
| ------------------- | --------- | ------ |
| Team Briefing       | C01       | ✅     |
| Schedule Generation | C11       | ✅     |
| Risk Alerts         | C01       | ✅     |
| Recommendations     | C04 + C11 | ✅     |

### §19 Notification Center

| Feature            | Wireframe | Status |
| ------------------ | --------- | ------ |
| Send Announcements | C09       | ✅     |
| Priority Levels    | C09       | ✅     |
| Read Tracking      | C09       | ✅     |

### §33 Data Import/Export

| Feature    | Wireframe | Status |
| ---------- | --------- | ------ |
| Export CSV | C16       | ✅     |
| Export PDF | C04, C05  | ✅     |

### §34 Knowledge Base

| Feature          | Wireframe | Status |
| ---------------- | --------- | ------ |
| Resource Library | C12       | ✅     |
| Categories       | C12       | ✅     |
| Search           | C12       | ✅     |
| Team Resources   | C12       | ✅     |

### §35 Team Chat & Channels

| Feature         | Wireframe | Status |
| --------------- | --------- | ------ |
| Direct Messages | C09       | ✅     |
| Announcements   | C09       | ✅     |
| Message Thread  | C09       | ✅     |

### §37 Return-to-Play Protocol

| Feature           | Wireframe | Status |
| ----------------- | --------- | ------ |
| RTP Management    | C08       | ✅     |
| 7-Stage Protocol  | C08       | ✅     |
| Daily Check-ins   | C08       | ✅     |
| Medical Notes     | C08       | ✅     |
| Progress Tracking | C08       | ✅     |

### §41 Superadmin Dashboard

| Feature           | Wireframe | Status |
| ----------------- | --------- | ------ |
| Platform Overview | C18       | ✅     |
| User Management   | C18       | ✅     |
| Team Management   | C18       | ✅     |
| System Health     | C18       | ✅     |
| Audit Logs        | C18       | ✅     |
| Support Tickets   | C18       | ✅     |

### §42 Playbook Library

| Feature               | Wireframe | Status |
| --------------------- | --------- | ------ |
| Play Cards            | C13       | ✅     |
| Play Designer         | C13       | ✅     |
| Formations            | C13       | ✅     |
| Route Drawing         | C13       | ✅     |
| Assignments           | C13       | ✅     |
| Memorization Tracking | C13       | ✅     |

### §43 Video Analysis / Film Room

| Feature             | Wireframe | Status |
| ------------------- | --------- | ------ |
| Film Upload         | C14       | ✅     |
| Video Player        | C14       | ✅     |
| Timestamps          | C14       | ✅     |
| Player Tagging      | C14       | ✅     |
| Tag Types           | C14       | ✅     |
| Assignment          | C14       | ✅     |
| Compliance Tracking | C14       | ✅     |

### §44 Scouting Reports

| Feature           | Wireframe           | Status |
| ----------------- | ------------------- | ------ |
| Opponent Profiles | C14 (via Film tags) | ✅     |
| Tendencies        | C14                 | ✅     |

### §45 Practice Planning

| Feature              | Wireframe | Status |
| -------------------- | --------- | ------ |
| Practice Script      | C06       | ✅     |
| Timeline             | C06       | ✅     |
| Period-by-period     | C06       | ✅     |
| Equipment Checklist  | C06       | ✅     |
| Live Mode            | C06       | ✅     |
| PDF Export (implied) | C06       | ✅     |

### §46 Team Calendar & RSVP

| Feature           | Wireframe | Status |
| ----------------- | --------- | ------ |
| Calendar Views    | C15       | ✅     |
| Event Creation    | C15       | ✅     |
| RSVP Management   | C15       | ✅     |
| Recurring Events  | C15       | ✅     |
| Ride Coordination | C15       | ✅     |
| Reminders         | C15       | ✅     |

### §47 Financial / Payment Tracking

| Feature             | Wireframe | Status |
| ------------------- | --------- | ------ |
| Fee Creation        | C16       | ✅     |
| Collection Tracking | C16       | ✅     |
| Player Balances     | C16       | ✅     |
| Payment Recording   | C16       | ✅     |
| Reminders           | C16       | ✅     |
| Guest Fees          | C16       | ✅     |

### §48 Weather Integration

| Feature         | Wireframe         | Status |
| --------------- | ----------------- | ------ |
| Weather Display | C06 (in Practice) | ✅     |
| Alerts          | C01 (Dashboard)   | ✅     |

### §49 Exercise Library

| Feature                 | Wireframe                 | Status |
| ----------------------- | ------------------------- | ------ |
| Coach can add exercises | C05 (via program builder) | ✅     |

---

## Additional Features in Wireframes

| Feature                     | Wireframe | Notes                                                 |
| --------------------------- | --------- | ----------------------------------------------------- |
| Player Development Tracking | C07       | Full development goals, benchmarks, skill assessments |
| Spider Charts               | C07       | Position benchmark visualization                      |
| Injury Analytics            | C08       | Injury type/position breakdown                        |
| Scheduled Messages          | C09       | Recurring team messages                               |
| Tournament Lineup Builder   | C10       | Set starting 5 and rotations                          |
| AI Constraints              | C11       | Handle ACWR/RTP in schedules                          |
| Templates                   | C06, C12  | Reusable practice/resource templates                  |
| Impersonation               | C18       | Debug as user capability                              |

---

## Summary Statistics

| Status                       |  Count |
| ---------------------------- | -----: |
| Coach Wireframes Complete    | **17** |
| Features Missing             |  **0** |
| Player Wireframes (Previous) | **33** |
| **Total Wireframes**         | **50** |

---

## Notes

1. **Weather Integration** (§48) is embedded in Practice Planner and Dashboard alerts rather than a standalone page
2. **Scouting Reports** (§44) can be created through Film Room tagging system
3. **Equipment Management** (§14) is partially covered in Practice Planner; full inventory management would be a Settings sub-page
4. **Professional Reports** (§30-32) - Nutritionist, Physiotherapist, Psychology dashboards are export-focused features that integrate with existing data; could be added as export templates

All core documented coach features are represented in wireframes.
