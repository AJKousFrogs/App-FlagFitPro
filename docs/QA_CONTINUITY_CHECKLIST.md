# QA Continuity Checklist

**Last Updated:** March 2026  
**Status:** Active

---

## Purpose

Manual verification checklist for end-to-end data continuity across onboarding, settings, roster, Today, travel recovery, tournament nutrition, and coach views.

Use this after changes to:
- onboarding
- settings
- team invitations
- roster
- Today or dashboard continuity
- travel recovery
- tournament nutrition
- team membership resolution

---

## Preconditions

- Test user account exists
- At least one approved team exists
- At least one player invitation flow is available
- App and backend are running against the intended environment

---

## Scenario 1: Onboarding To Training Continuity

1. Register or complete onboarding as a player.
2. Select a team.
3. Enter profile data:
   - name
   - position
   - jersey number
   - date of birth
   - height
   - weight
4. Enter training preferences:
   - practice days
   - sessions per week
   - equipment
   - current injuries
5. Finish onboarding.
6. Verify:
   - dashboard loads successfully
   - Today loads successfully
   - player settings dialog reflects the onboarding values
   - roster shows the player under the selected team

Pass condition:
- no missing player record
- no stale default training settings after onboarding

---

## Scenario 2: Settings To Roster Continuity

1. Open Settings as an onboarded player.
2. Change:
   - display name
   - phone
   - country
   - position
   - jersey number
3. Save settings.
4. Open roster.
5. Verify:
   - roster reflects updated profile/team fields
   - no duplicate player appears
   - player detail shows updated profile values

Pass condition:
- `users`, `team_members`, and roster-facing projection stay aligned in UI

---

## Scenario 3: Invitation Acceptance Continuity

1. Create a player invitation for a team.
2. Accept the invitation as the invited player.
3. Open roster.
4. Verify:
   - player appears on the team roster
   - roster data includes the invited player identity
   - no orphan team membership without roster visibility

Pass condition:
- accepted invitation creates both membership continuity and roster continuity

---

## Scenario 4: Team Switch Continuity

1. Start as a player already assigned to Team A.
2. In Settings, switch to Team B.
3. Save.
4. Verify:
   - roster no longer shows the player under Team A
   - roster shows the player under Team B
   - tournaments/team-scoped views resolve Team B as active

Pass condition:
- player record moves cleanly rather than duplicating across teams

---

## Scenario 5: Travel Recovery Continuity

1. Create a travel recovery plan.
2. Reload the app.
3. Open travel recovery again.
4. Open Today and dashboard.
5. Verify:
   - travel plan restores after reload
   - Today shows continuity warning/banner when travel recovery is active
   - dashboard also reflects the same continuity state

Pass condition:
- travel continuity survives reload and appears consistently across surfaces

---

## Scenario 6: Tournament Nutrition Continuity

1. Create a tournament schedule.
2. Generate nutrition windows.
3. Log hydration.
4. Reload the app.
5. Verify:
   - tournament schedule restores
   - nutrition window completion state restores
   - hydration logs restore
6. If legacy local state exists, verify it migrates into persisted state on first load.

Pass condition:
- tournament-day state is not lost on reload or device/session change

---

## Scenario 7: Today And Dashboard Alignment

1. Ensure the player has one active continuity condition:
   - game day recovery
   - ACWR load cap
   - travel recovery
   - return-to-play
2. Open dashboard and Today.
3. Verify:
   - both surfaces reflect the active continuity state
   - no surface treats the player as fully clear while another shows restrictions

Pass condition:
- continuity signals are aligned across both primary player surfaces

---

## Regression Notes

If a scenario fails, capture:
- user role
- team context
- exact route
- whether data appeared after refresh only
- whether duplicate records were created
- whether local-only cached data was involved

