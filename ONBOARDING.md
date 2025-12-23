# User Onboarding System

## FlagFit Pro - Onboarding Flows & State Management

**Version**: 2.0
**Last Updated**: December 21, 2024
**Owner**: Product Team
**Technical Owner**: Frontend Team
**Review Frequency**: Quarterly or after onboarding UX changes

---

## Table of Contents

1. [Overview](#overview)
2. [Onboarding Flow](#onboarding-flow)
3. [State Management](#state-management)
4. [Role-Based Onboarding](#role-based-onboarding)
5. [Data Collection](#data-collection)
6. [Progress Persistence](#progress-persistence)
7. [Completion Criteria](#completion-criteria)
8. [Edge Cases](#edge-cases)
9. [Role Change Handling](#role-change-handling)
10. [UX Guidelines](#ux-guidelines)

---

## Overview

### Purpose

The onboarding system guides new users through initial setup, collecting necessary information for personalized training recommendations.

### Design Principles

1. **Optional but Encouraged**: Users can skip onboarding
2. **Restartable**: Users can restart onboarding at any time
3. **Progressive**: Save progress at each step
4. **Role-Specific**: Different flows for players and coaches
5. **Single Source of Truth**: `user_metadata.onboarding_completed` is authoritative

### Onboarding Triggers

| Trigger                      | Condition                        | Action                         |
| ---------------------------- | -------------------------------- | ------------------------------ |
| First Login (Email/Password) | Email verified + No onboarding   | Redirect to /onboarding.html   |
| First Login (OAuth)          | OAuth success + No onboarding    | Redirect to /onboarding.html   |
| Manual Restart               | User clicks "Restart Onboarding" | Clear progress + Redirect      |
| Role Upgrade                 | Player → Coach                   | Show coach-specific onboarding |

---

## Onboarding Flow

### Player Onboarding Flow

```
┌─────────────────────────┐
│  Welcome Screen         │
│  - Introduction         │
│  - Value proposition    │
│  [Skip] [Get Started]   │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  Step 1: Personal Info  │
│  - Position             │
│  - Experience level     │
│  - Goals                │
│  [Back] [Next]          │
└───────────┬─────────────┘
            ↓
       Save to localStorage
       + user_metadata (temp)
            ↓
┌─────────────────────────┐
│  Step 2: Training Prefs │
│  - Weekly availability  │
│  - Preferred times      │
│  - Equipment access     │
│  [Back] [Next]          │
└───────────┬─────────────┘
            ↓
       Save progress
            ↓
┌─────────────────────────┐
│  Step 3: Measurements   │
│  - Height/Weight        │
│  - Fitness baseline     │
│  - Injury history       │
│  [Back] [Next]          │
└───────────┬─────────────┘
            ↓
       Save progress
            ↓
┌─────────────────────────┐
│  Step 4: Notifications  │
│  - Email preferences    │
│  - Push notifications   │
│  - Reminder settings    │
│  [Back] [Finish]        │
└───────────┬─────────────┘
            ↓
       Mark Complete
       Update user_metadata
            ↓
┌─────────────────────────┐
│  Redirect to Dashboard  │
└─────────────────────────┘
```

### Coach Onboarding Flow

```
┌─────────────────────────┐
│  Welcome Screen         │
│  (Coach-specific)       │
│  [Skip] [Get Started]   │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  Step 1: Coach Profile  │
│  - Coaching experience  │
│  - Certifications       │
│  - Specializations      │
│  [Back] [Next]          │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  Step 2: Team Setup     │
│  - Team name            │
│  - Team size            │
│  - Season schedule      │
│  [Back] [Next]          │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  Step 3: Coaching Goals │
│  - Team objectives      │
│  - Training focus       │
│  - Measurement strategy │
│  [Back] [Finish]        │
└───────────┬─────────────┘
            ↓
       Mark Complete
       Redirect to Coach Dashboard
```

---

## State Management

### Dual Source of Truth (Current Issue)

**⚠️ Gap Identified**: Onboarding completion stored in two places

| Storage                              | Purpose           | Scope                 | Reliability       |
| ------------------------------------ | ----------------- | --------------------- | ----------------- |
| `user_metadata.onboarding_completed` | Server-side truth | Global (all devices)  | ✅ Reliable       |
| `localStorage.onboardingCompleted`   | Client-side cache | Local (single device) | ⚠️ Can be cleared |

**Problem**:

- User completes onboarding on Device A
- Logs in on Device B
- Device B shows onboarding again (localStorage empty)

### ✅ Recommended Fix: Single Source of Truth

**Implementation**:

```javascript
// src/auth-manager.js (lines 1112-1114)
// CURRENT (Incorrect):
const onboardingCompleted =
  user?.user_metadata?.onboarding_completed ||
  storageService.get("onboardingCompleted");

// FIXED (Correct):
async function isOnboardingCompleted() {
  // 1. Always check user_metadata first (authoritative source)
  if (this.user?.user_metadata?.onboarding_completed) {
    // Sync to localStorage for offline access
    localStorage.setItem("onboardingCompleted", "true");
    return true;
  }

  // 2. If not in user_metadata, onboarding is NOT completed
  // Clear any stale localStorage data
  localStorage.removeItem("onboardingCompleted");
  return false;
}
```

**Rule**: `user_metadata.onboarding_completed` is the **single source of truth**.

### Step Progress Tracking

**Purpose**: Allow users to resume onboarding from where they left off.

**Storage Strategy**:

| Data              | Storage       | Lifetime         | Synced to Server  |
| ----------------- | ------------- | ---------------- | ----------------- |
| Completion status | user_metadata | Permanent        | ✅ Yes            |
| Current step      | localStorage  | Until completion | ❌ No (temporary) |
| Step data         | localStorage  | Until completion | ❌ No (temporary) |

**Implementation**:

```javascript
// Onboarding page (onboarding.html or React component)
class OnboardingManager {
  constructor() {
    this.currentStep = this.loadCurrentStep();
    this.stepData = this.loadStepData();
  }

  loadCurrentStep() {
    // Temporary storage - only for current session
    return parseInt(localStorage.getItem("onboarding_current_step") || "1");
  }

  loadStepData() {
    // Load saved data for in-progress steps
    const saved = localStorage.getItem("onboarding_step_data");
    return saved ? JSON.parse(saved) : {};
  }

  async saveStepProgress(step, data) {
    // Save step number
    localStorage.setItem("onboarding_current_step", step);

    // Save step data
    this.stepData[step] = data;
    localStorage.setItem("onboarding_step_data", JSON.stringify(this.stepData));

    // Optionally, save to user_metadata for resilience
    await this.syncToUserMetadata(step, data);
  }

  async syncToUserMetadata(step, data) {
    // Save partial progress to user_metadata (optional enhancement)
    await supabase.auth.updateUser({
      data: {
        onboarding_progress: {
          current_step: step,
          last_updated: new Date().toISOString(),
          data: this.stepData,
        },
      },
    });
  }

  async completeOnboarding() {
    // 1. Save all onboarding data to database
    await this.saveOnboardingData(this.stepData);

    // 2. Mark onboarding as completed in user_metadata
    await supabase.auth.updateUser({
      data: {
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      },
    });

    // 3. Clear temporary storage
    localStorage.removeItem("onboarding_current_step");
    localStorage.removeItem("onboarding_step_data");

    // 4. Set completion flag in localStorage (cache)
    localStorage.setItem("onboardingCompleted", "true");

    // 5. Redirect to dashboard
    window.location.href = "/dashboard.html";
  }
}
```

---

## Role-Based Onboarding

### Player Onboarding Steps

**Step 1: Personal Information**

- Position (QB, RB, WR, TE, etc.)
- Experience level (Beginner, Intermediate, Advanced)
- Primary goals (Skill improvement, Fitness, Competition)

**Step 2: Training Preferences**

- Weekly availability (days + times)
- Training location (Indoor, Outdoor, Both)
- Equipment access (Full gym, Limited, None)

**Step 3: Physical Measurements**

- Height / Weight
- Fitness baseline (self-assessment)
- Injury history (optional)

**Step 4: Notification Preferences**

- Email notifications (Training reminders, Performance updates)
- Push notifications (Mobile app)
- SMS reminders (optional)

### Coach Onboarding Steps

**Step 1: Coach Profile**

- Years of coaching experience
- Certifications (AFCA, NFHS, etc.)
- Specializations (Offense, Defense, Special Teams)

**Step 2: Team Setup**

- Team name
- Team size (roster count)
- Season schedule (start/end dates)

**Step 3: Coaching Goals**

- Team objectives (Skill development, Win championship, etc.)
- Training focus areas
- Measurement strategy (KPIs to track)

---

## Data Collection

### Collected Data

**Player Data**:

```javascript
{
  "personal": {
    "position": "QB",
    "experience": "Intermediate",
    "goals": ["skill_improvement", "fitness"]
  },
  "training": {
    "weekly_availability": ["monday", "wednesday", "friday"],
    "preferred_times": ["evening"],
    "equipment_access": "full_gym"
  },
  "measurements": {
    "height_cm": 180,
    "weight_kg": 75,
    "fitness_level": 7,
    "injury_history": []
  },
  "preferences": {
    "email_notifications": true,
    "push_notifications": true,
    "sms_reminders": false
  }
}
```

**Coach Data**:

```javascript
{
  "profile": {
    "years_experience": 5,
    "certifications": ["AFCA"],
    "specializations": ["offense", "special_teams"]
  },
  "team": {
    "team_name": "Ljubljana Frogs",
    "roster_size": 25,
    "season_start": "2025-03-01",
    "season_end": "2025-10-31"
  },
  "goals": {
    "objectives": ["skill_development", "competition"],
    "focus_areas": ["passing", "route_running"],
    "kpis": ["completion_percentage", "yards_per_game"]
  }
}
```

### Data Storage

**Database Schema** (Suggested):

```sql
-- Player onboarding data
CREATE TABLE player_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  position VARCHAR(50),
  experience_level VARCHAR(20),
  goals JSONB,
  weekly_availability JSONB,
  preferred_times JSONB,
  equipment_access VARCHAR(50),
  height_cm INTEGER,
  weight_kg INTEGER,
  fitness_level INTEGER,
  injury_history JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Coach onboarding data
CREATE TABLE coach_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  years_experience INTEGER,
  certifications VARCHAR[],
  specializations VARCHAR[],
  team_name VARCHAR(100),
  roster_size INTEGER,
  season_start DATE,
  season_end DATE,
  coaching_goals JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**RLS Policies**:

```sql
-- Players can only view/edit their own profile
CREATE POLICY "Players can view own profile"
ON player_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Players can update own profile"
ON player_profiles FOR UPDATE
USING (auth.uid() = id);

-- Coaches can view own profile and their team's players
CREATE POLICY "Coaches can view team profiles"
ON player_profiles FOR SELECT
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM coach_team_members
    WHERE coach_id = auth.uid()
    AND player_id = player_profiles.id
  )
);
```

---

## Progress Persistence

### Saving Progress

**On Each Step**:

```javascript
async function saveStep(stepNumber, stepData) {
  // 1. Validate step data
  const validation = validateStepData(stepNumber, stepData);
  if (!validation.valid) {
    showErrors(validation.errors);
    return;
  }

  // 2. Save to localStorage (temporary)
  localStorage.setItem(
    `onboarding_step_${stepNumber}`,
    JSON.stringify(stepData),
  );

  // 3. Optionally sync to user_metadata (for cross-device support)
  await supabase.auth.updateUser({
    data: {
      onboarding_progress: {
        step: stepNumber,
        data: stepData,
        updated_at: new Date().toISOString(),
      },
    },
  });

  // 4. Navigate to next step
  goToStep(stepNumber + 1);
}
```

### Resuming Progress

**On Page Load**:

```javascript
async function initializeOnboarding() {
  // 1. Check if already completed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.user_metadata?.onboarding_completed) {
    // Already completed, redirect to dashboard
    window.location.href = "/dashboard.html";
    return;
  }

  // 2. Check for saved progress
  const savedProgress = user?.user_metadata?.onboarding_progress;

  if (savedProgress) {
    // Resume from saved step
    const currentStep = savedProgress.step;
    const savedData = savedProgress.data;

    // Pre-fill form with saved data
    populateFormData(savedData);

    // Navigate to saved step
    goToStep(currentStep);
  } else {
    // Start from beginning
    goToStep(1);
  }
}
```

### Handling Interruptions

**Scenario 1: Browser Closes Mid-Onboarding**

**Behavior**:

1. User fills out Step 2, clicks "Next"
2. `saveStep(2, data)` saves to localStorage + user_metadata
3. User closes browser
4. User returns later
5. `initializeOnboarding()` detects saved progress
6. User resumes at Step 3

**Scenario 2: Token Expires During Onboarding**

**Behavior**:

1. User completes Step 3, clicks "Next"
2. Token is expired (Supabase auto-refreshes)
3. If refresh fails → Show re-login modal
4. User re-authenticates
5. Saved progress is restored from user_metadata
6. User resumes at Step 4

**Implementation**:

```javascript
async function saveStep(stepNumber, stepData) {
  try {
    // Check if session is valid
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      // Session expired, show re-login modal
      showReLoginModal({
        onSuccess: () => {
          // Retry save after re-login
          this.saveStep(stepNumber, stepData);
        },
      });
      return;
    }

    // Save progress
    await supabase.auth.updateUser({
      data: {
        onboarding_progress: { step: stepNumber, data: stepData },
      },
    });

    goToStep(stepNumber + 1);
  } catch (error) {
    // Handle network errors
    showError("Failed to save progress. Please try again.");
    logger.error("[Onboarding] Save failed:", error);
  }
}
```

---

## Completion Criteria

### Marking Onboarding as Complete

**Required Conditions**:

1. ✅ All mandatory steps completed
2. ✅ All required fields filled
3. ✅ Data validated and saved to database
4. ✅ `user_metadata.onboarding_completed = true`

**Implementation**:

```javascript
async function completeOnboarding(finalStepData) {
  // 1. Save final step data
  await saveOnboardingDataToDatabase(finalStepData);

  // 2. Mark as completed in user_metadata
  const { error } = await supabase.auth.updateUser({
    data: {
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    },
  });

  if (error) {
    showError("Failed to complete onboarding. Please try again.");
    return;
  }

  // 3. Clear temporary storage
  localStorage.removeItem("onboarding_current_step");
  localStorage.removeItem("onboarding_step_data");

  // 4. Set completion flag (cache)
  localStorage.setItem("onboardingCompleted", "true");

  // 5. Show success message
  showSuccess("Welcome to FlagFit Pro! 🎉");

  // 6. Redirect to dashboard
  setTimeout(() => {
    window.location.href = "/dashboard.html";
  }, 1500);
}
```

### Skipping Onboarding

**Behavior**:

- User can skip onboarding at any time
- `user_metadata.onboarding_completed` is **not** set
- User is redirected to dashboard
- Onboarding can be restarted later from Settings

**Implementation**:

```javascript
function skipOnboarding() {
  // 1. Clear any saved progress
  localStorage.removeItem("onboarding_current_step");
  localStorage.removeItem("onboarding_step_data");

  // 2. DO NOT mark as completed
  // (onboarding_completed remains false)

  // 3. Redirect to dashboard
  window.location.href = "/dashboard.html";

  // 4. Show reminder in dashboard
  showInfo("You can complete onboarding anytime from Settings.");
}
```

---

## Edge Cases

### Edge Case 1: User Completes Onboarding Then Role Changes

**Scenario**: User is a Player, completes onboarding, then upgrades to Coach.

**Current Status**: ⚠️ Not explicitly handled

**Recommended Behavior**:

| Role Change    | Action                   | Onboarding Status   | User Experience                    |
| -------------- | ------------------------ | ------------------- | ---------------------------------- |
| Player → Coach | Trigger coach onboarding | Reset to incomplete | Show "Complete coach setup" banner |
| Coach → Player | No action                | Remain completed    | No change                          |
| Player → Admin | No onboarding            | Remain completed    | Admin dashboard (no onboarding)    |

**Implementation**:

```javascript
async function handleRoleChange(oldRole, newRole) {
  if (oldRole === "player" && newRole === "coach") {
    // Reset onboarding for coach-specific setup
    await supabase.auth.updateUser({
      data: {
        onboarding_completed: false,
        previous_onboarding_role: oldRole,
        role_changed_at: new Date().toISOString(),
      },
    });

    // Clear local cache
    localStorage.removeItem("onboardingCompleted");

    // Redirect to coach onboarding
    window.location.href = "/onboarding.html?role=coach";
  }
}
```

### Edge Case 2: User Restarts Onboarding Mid-Way

**Scenario**: User is on Step 3, clicks "Restart Onboarding" in Settings.

**Behavior**:

1. Confirm with user: "This will clear your current progress. Continue?"
2. Clear all temporary storage
3. Clear `onboarding_progress` from user_metadata
4. Redirect to Step 1

**Implementation**:

```javascript
async function restartOnboarding() {
  if (!confirm("This will clear your current progress. Continue?")) {
    return;
  }

  // 1. Clear localStorage
  localStorage.removeItem("onboarding_current_step");
  localStorage.removeItem("onboarding_step_data");
  localStorage.removeItem("onboardingCompleted");

  // 2. Clear user_metadata
  await supabase.auth.updateUser({
    data: {
      onboarding_completed: false,
      onboarding_progress: null,
      onboarding_restarted_at: new Date().toISOString(),
    },
  });

  // 3. Redirect to onboarding start
  window.location.href = "/onboarding.html";
}
```

### Edge Case 3: Onboarding on Multiple Devices Simultaneously

**Scenario**: User starts onboarding on Phone, switches to Laptop mid-way.

**Current Behavior** (with user_metadata sync):

- Phone saves Step 1 → synced to user_metadata
- Laptop loads onboarding → resumes from Step 1 (synced)
- Phone saves Step 2 → synced to user_metadata
- Laptop refreshes → shows Step 2 (latest)

**Potential Issue**: Race condition if both devices save simultaneously.

**Mitigation**:

- Use `onboarding_progress.updated_at` timestamp
- Always load latest progress on page load
- Show warning if progress is stale: "Your progress may be out of date. Reload?"

---

## Role Change Handling

### Player to Coach Upgrade

**Trigger**:

- Admin manually updates role in database
- User purchases coach subscription

**Flow**:

```
1. Detect role change (via auth state listener)
   ↓
2. Check if coach onboarding completed
   ↓
3. If NOT completed:
   - Show banner: "Welcome, Coach! Complete your setup."
   - Redirect to coach onboarding
   ↓
4. If completed:
   - Grant coach permissions
   - Redirect to coach dashboard
```

**Implementation**:

```javascript
// In auth-manager.js auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'USER_UPDATED' && session) {
    const oldRole = this.user?.role;
    const newRole = session.user.user_metadata?.role;

    if (oldRole !== newRole && newRole === 'coach') {
      // Role upgraded to coach
      this.handleCoachUpgrade();
    }
  }
});

async handleCoachUpgrade() {
  const coachOnboardingCompleted = this.user?.user_metadata?.coach_onboarding_completed;

  if (!coachOnboardingCompleted) {
    showBanner('Welcome, Coach! Please complete your coach setup.');
    setTimeout(() => {
      window.location.href = '/onboarding.html?role=coach';
    }, 2000);
  } else {
    showSuccess('Your account has been upgraded to Coach!');
    setTimeout(() => {
      window.location.href = '/coach-dashboard.html';
    }, 1500);
  }
}
```

### Separate Onboarding Flags

**Recommendation**: Track onboarding completion per role.

```javascript
// user_metadata structure
{
  "onboarding_completed": true,        // Legacy (player onboarding)
  "player_onboarding_completed": true,
  "coach_onboarding_completed": false,
  "role": "coach"
}
```

---

## UX Guidelines

### Visual Progress Indicator

**Show Progress Bar**:

```html
<div class="progress-container">
  <div class="progress-bar" style="width: 50%"></div>
  <span class="progress-text">Step 2 of 4</span>
</div>
```

### Save Feedback

**Indicate Saving**:

```javascript
async function saveStep(step, data) {
  showSavingIndicator(); // "Saving..."

  await saveToDatabase(data);

  showSavedIndicator(); // "Saved ✓"

  setTimeout(hideSavedIndicator, 2000);
}
```

### Validation Feedback

**Inline Validation**:

```html
<input
  type="text"
  id="team-name"
  onblur="validateTeamName()"
  aria-invalid="false"
  aria-describedby="team-name-error"
/>
<span id="team-name-error" class="error-message" aria-live="polite"></span>
```

### Accessibility

**WCAG Compliance**:

- ✅ Keyboard navigation (Tab, Enter)
- ✅ Screen reader support (ARIA labels)
- ✅ Focus management (focus first field on step change)
- ✅ Error announcements (aria-live regions)

**Implementation**:

```javascript
function goToStep(stepNumber) {
  // Update UI
  showStep(stepNumber);

  // Set focus to first input
  const firstInput = document.querySelector(
    `#step-${stepNumber} input, #step-${stepNumber} select`,
  );
  if (firstInput) {
    firstInput.focus();
  }

  // Announce step change
  announceToScreenReader(`Step ${stepNumber} of 4`);
}
```

---

## Summary

### Key Decisions

1. **Single Source of Truth**: `user_metadata.onboarding_completed` is authoritative
2. **Progress Persistence**: Save to localStorage + user_metadata for resilience
3. **Role-Specific**: Separate onboarding flows for players and coaches
4. **Optional**: Users can skip and complete later
5. **Restartable**: Users can restart from Settings

### Implementation Checklist

- [x] Onboarding flows defined
- [x] State management clarified
- [ ] Implement `isOnboardingCompleted()` fix (single source of truth)
- [ ] Add role change detection
- [ ] Implement coach onboarding flow
- [ ] Add progress sync to user_metadata
- [ ] Test cross-device onboarding resumption
- [ ] Add "Restart Onboarding" in Settings
- [ ] Implement "Skip Onboarding" button
- [ ] Add progress bar UI
- [ ] Accessibility testing

---

**Related Documentation**:

- [AUTHENTICATION.md](./AUTHENTICATION.md) - Core authentication flows
- [SESSION_AND_SECURITY.md](./SESSION_AND_SECURITY.md) - Security details
