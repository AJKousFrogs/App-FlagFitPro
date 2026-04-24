---
name: Recurring Bug and UX Patterns
description: Patterns that appear repeatedly across the codebase and should be checked in every review
type: feedback
---

1. **Non-signal plain booleans used as dialog/UI state in OnPush components** — found in `coach-dashboard.component.ts` (showCreateSessionDialog, showTeamMessageDialog, showRequestAccessDialog, teamMessageContent, requestAccessMessage) and `attendance.component.ts` (showCreateEventDialog, showAttendanceDialog, newEvent plain object). These will not trigger change detection when mutated directly.
   **Why:** OnPush only re-renders on signal changes, input changes, or explicit markForCheck. Plain property mutations are invisible to the CD system.
   **How to apply:** Flag any `public booleanProp = false` or plain object mutation in an OnPush component.

2. **`onboarding_completed === false` strict equality misses null/undefined** — new users whose row does not exist yet get `data: null` from `getUserOnboardingStatus`, so `onboarding_completed` is `undefined`, not `false`. They are not redirected to onboarding after first login.
   **Why:** Strict equality `=== false` is intentional but depends on the row existing. If the insert fails or hasn't happened yet, users skip onboarding.
   **How to apply:** Suggest `!userData?.onboarding_completed` or explicit `userData === null` branch.

3. **Password policy mismatch between register and update-password** — `register.component.ts` requires special character via `Validators.pattern`; `update-password.component.ts` does not. Users who reset their password can set one that would fail registration.

4. **isLoading signal set but not consumed in onboarding template** — `onboarding.component.ts` has `isLoading = signal(true)` that is set in `loadUserProfile()`, but the onboarding HTML never reads `isLoading()`. Steps render immediately while profile data is still loading.

5. **Attendance dialog never rendered** — `showAttendanceDialog` is set to `true` in `openAttendanceDialog()` but the attendance template has no `<app-dialog [(visible)]="showAttendanceDialog">` block, making the attendance-recording feature completely inaccessible via the UI.

6. **Double-slice in attendance events list** — `filteredEvents()` already applies `.slice(0, 10)` via computed; the template also calls `.slice(0, 5)`. Only 5 events show. The computed cap of 10 is misleading.

7. **`createSession()` in coach dashboard is a stub** — logs success toast and resets form without calling any API. No actual session is created.

8. **p-table in attendance has no empty state template** — when `playerStats()` is empty, PrimeNG renders an empty table with headers and no rows and no message.
