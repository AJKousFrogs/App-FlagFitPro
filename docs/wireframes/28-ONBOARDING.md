# Wireframe: Onboarding

**Route:** `/onboarding`  
**Users:** New users after registration  
**Status:** ⚠️ Needs Implementation  
**Source:** Referenced in `FEATURE_DOCUMENTATION.md` §23

---

## Purpose

Guides new users through profile setup, training preferences, and initial configuration with a multi-step wizard.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                                                   │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ══════════════════════════════════════════════════════════════════════════ │  │
│  │                          PROGRESS BAR                                        │  │
│  │  ══════════════════════════════════════════════════════════════════════════ │  │
│  │                                                                                │  │
│  │  ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐              │  │
│  │  │  1  │────│  2  │────│  3  │────│  4  │────│  5  │────│  6  │              │  │
│  │  │ ✓   │    │ ◉   │    │     │    │     │    │     │    │     │              │  │
│  │  │     │    │     │    │     │    │     │    │     │    │     │              │  │
│  │  └─────┘    └─────┘    └─────┘    └─────┘    └─────┘    └─────┘              │  │
│  │  Personal   Athletic   Physical  Training  Medical    Consent                │  │
│  │    Info      Profile    Profile  Preferences  (Opt)    & Done                │  │
│  │                                                                                │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░ 33%        │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ══════════════════════════════════════════════════════════════════════════════════ │
│                            STEP 2: ATHLETIC PROFILE                                  │
│  ══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏈 Athletic Profile                                                            │  │
│  │ Tell us about your flag football experience                                   │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Primary Position                                                             │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐       │  │
│  │  │ ( ) Quarterback (QB)                                               │       │  │
│  │  │ ( ) Wide Receiver (WR)                                             │       │  │
│  │  │ ( ) Defensive Back (DB)                                            │       │  │
│  │  │ (●) Rusher / Defensive Line                                        │       │  │
│  │  │ ( ) Center                                                         │       │  │
│  │  │ ( ) Hybrid / All-around                                            │       │  │
│  │  └────────────────────────────────────────────────────────────────────┘       │  │
│  │                                                                                │  │
│  │  Secondary Positions (select all that apply)                                  │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐       │  │
│  │  │ ☐ Quarterback   ☐ Wide Receiver   ☑ Defensive Back   ☐ Center     │       │  │
│  │  └────────────────────────────────────────────────────────────────────┘       │  │
│  │                                                                                │  │
│  │  Experience Level                                                             │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐       │  │
│  │  │ How many years have you played flag football?                      │       │  │
│  │  │                                                                    │       │  │
│  │  │   ○ New (< 1 year)                                                 │       │  │
│  │  │   ● Beginner (1-2 years)                                           │       │  │
│  │  │   ○ Intermediate (3-5 years)                                       │       │  │
│  │  │   ○ Advanced (5-10 years)                                          │       │  │
│  │  │   ○ Elite (10+ years)                                              │       │  │
│  │  └────────────────────────────────────────────────────────────────────┘       │  │
│  │                                                                                │  │
│  │  Current Team (optional)                                                      │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐       │  │
│  │  │ Search for your team or enter name...                              │       │  │
│  │  └────────────────────────────────────────────────────────────────────┘       │  │
│  │                                                                                │  │
│  │  OR join a team later via invitation                                          │  │
│  │                                                                                │  │
│  │                                                                                │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │                  [← Back]                          [Continue →]        │   │  │
│  │  └────────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 💡 Why we ask: Position and experience help us personalize your training      │  │
│  │ recommendations and benchmarks.                                               │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## All Steps Overview

### Step 1: Personal Information

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ 👤 Personal Information                                                            │
│ ──────────────────────────────────────────────────────────────────────────────────│
│                                                                                    │
│  Full Name *                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐       │
│  │ Marcus Johnson                                                         │       │
│  └────────────────────────────────────────────────────────────────────────┘       │
│                                                                                    │
│  Date of Birth *                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐       │
│  │ March 15, 2001                                                    📅   │       │
│  └────────────────────────────────────────────────────────────────────────┘       │
│  Age: 24 years (Adult category)                                                   │
│                                                                                    │
│  Profile Photo (optional)                                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐       │
│  │          ┌─────────────┐                                              │       │
│  │          │    📷       │                                              │       │
│  │          │   Upload    │                                              │       │
│  │          │   Photo     │                                              │       │
│  │          └─────────────┘                                              │       │
│  │                                                                        │       │
│  │          [Upload Photo] or drag & drop                                │       │
│  └────────────────────────────────────────────────────────────────────────┘       │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Step 2: Athletic Profile (shown above)

### Step 3: Physical Profile

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ 📏 Physical Profile                                                                │
│ ──────────────────────────────────────────────────────────────────────────────────│
│                                                                                    │
│  Height *                                  Weight *                               │
│  ┌─────────────────────────────┐          ┌─────────────────────────────┐         │
│  │ 5'11" (180 cm)          ▼   │          │ 167 lbs (76 kg)         ▼   │         │
│  └─────────────────────────────┘          └─────────────────────────────┘         │
│                                                                                    │
│  Dominant Hand                            Dominant Foot                           │
│  ┌─────────────────────────────┐          ┌─────────────────────────────┐         │
│  │ (●) Right  ( ) Left         │          │ (●) Right  ( ) Left         │         │
│  └─────────────────────────────┘          └─────────────────────────────┘         │
│                                                                                    │
│  Current Fitness Level                                                            │
│  ┌────────────────────────────────────────────────────────────────────────┐       │
│  │ How would you rate your current fitness?                               │       │
│  │                                                                        │       │
│  │   ○ Just starting out - new to regular exercise                        │       │
│  │   ○ Getting back into it - returning after a break                     │       │
│  │   ● Moderately active - exercise 2-3 times per week                    │       │
│  │   ○ Very active - exercise 4-5 times per week                          │       │
│  │   ○ Highly athletic - train daily                                      │       │
│  └────────────────────────────────────────────────────────────────────────┘       │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Step 4: Training Preferences

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ ⚙️ Training Preferences                                                            │
│ ──────────────────────────────────────────────────────────────────────────────────│
│                                                                                    │
│  Available Training Days                                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐       │
│  │ Select days you're typically available to train:                       │       │
│  │                                                                        │       │
│  │ ☑ Monday    ☑ Tuesday    ☑ Wednesday    ☑ Thursday                    │       │
│  │ ☑ Friday    ☐ Saturday   ☐ Sunday                                     │       │
│  └────────────────────────────────────────────────────────────────────────┘       │
│                                                                                    │
│  Preferred Training Times                                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐       │
│  │ When do you prefer to train?                                           │       │
│  │                                                                        │       │
│  │   ○ Early morning (5-7 AM)                                             │       │
│  │   ● Morning (7-10 AM)                                                  │       │
│  │   ○ Midday (10 AM-2 PM)                                                │       │
│  │   ○ Afternoon (2-5 PM)                                                 │       │
│  │   ○ Evening (5-8 PM)                                                   │       │
│  │   ○ No preference                                                      │       │
│  └────────────────────────────────────────────────────────────────────────┘       │
│                                                                                    │
│  Training Goals (select up to 3)                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐       │
│  │ ☑ Improve speed & agility                                              │       │
│  │ ☑ Build strength & power                                               │       │
│  │ ☐ Increase endurance                                                   │       │
│  │ ☑ Injury prevention                                                    │       │
│  │ ☐ Improve flexibility                                                  │       │
│  │ ☐ Game preparation                                                     │       │
│  │ ☐ Position-specific skills                                             │       │
│  └────────────────────────────────────────────────────────────────────────┘       │
│                                                                                    │
│  Equipment Access                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐       │
│  │ What equipment do you have access to?                                  │       │
│  │                                                                        │       │
│  │ ☑ Gym with full equipment                                              │       │
│  │ ☑ Home gym (basic)                                                     │       │
│  │ ☐ Bodyweight only                                                      │       │
│  │ ☑ Access to a field                                                    │       │
│  │ ☐ Resistance bands                                                     │       │
│  └────────────────────────────────────────────────────────────────────────┘       │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Step 5: Medical/Injury History (Optional)

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ 🏥 Medical & Injury History (Optional)                                             │
│ This helps us create safer training recommendations                               │
│ ──────────────────────────────────────────────────────────────────────────────────│
│                                                                                    │
│  Previous Injuries                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐       │
│  │ Have you had any significant injuries in the past 2 years?             │       │
│  │                                                                        │       │
│  │ ☐ No previous injuries                                                 │       │
│  │                                                                        │       │
│  │ ☑ Muscle strain        Where: Hamstring       When: 6 months ago      │       │
│  │ ☐ Ligament sprain      Where: ___________     When: ___________       │       │
│  │ ☐ Fracture             Where: ___________     When: ___________       │       │
│  │ ☐ Concussion           When: ___________                               │       │
│  │ ☐ Other                Describe: _____________________________        │       │
│  └────────────────────────────────────────────────────────────────────────┘       │
│                                                                                    │
│  Current Limitations                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐       │
│  │ Do you have any current physical limitations?                          │       │
│  │                                                                        │       │
│  │ (●) None - I can train without restrictions                            │       │
│  │ ( ) Minor - Some movements need modification                           │       │
│  │ ( ) Moderate - Several exercises need modification                     │       │
│  │ ( ) Significant - Cleared by doctor with restrictions                  │       │
│  │                                                                        │       │
│  │ If any limitations, describe: ________________________________         │       │
│  └────────────────────────────────────────────────────────────────────────┘       │
│                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐       │
│  │ 💡 This information is kept private and only used to personalize       │       │
│  │ your training. You can update it anytime in Settings.                  │       │
│  │                                                                        │       │
│  │                              [Skip this step →]                        │       │
│  └────────────────────────────────────────────────────────────────────────┘       │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Step 6: Consent & Completion

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ ✅ Almost Done!                                                                    │
│ ──────────────────────────────────────────────────────────────────────────────────│
│                                                                                    │
│  Review & Consent                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐       │
│  │                                                                        │       │
│  │ ☑ I accept the Terms of Service                                        │       │
│  │   View Terms: [Terms of Service →]                                     │       │
│  │                                                                        │       │
│  │ ☑ I accept the Privacy Policy                                          │       │
│  │   View Policy: [Privacy Policy →]                                      │       │
│  │                                                                        │       │
│  │ ☑ I consent to my data being used to personalize my training           │       │
│  │   experience (required for app functionality)                          │       │
│  │                                                                        │       │
│  │ ☐ I consent to AI Coach (Merlin) providing personalized advice         │       │
│  │   based on my training and wellness data (optional)                    │       │
│  │                                                                        │       │
│  │ ☐ I want to receive email updates about new features and tips          │       │
│  │   (optional)                                                           │       │
│  │                                                                        │       │
│  └────────────────────────────────────────────────────────────────────────┘       │
│                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐       │
│  │                                                                        │       │
│  │              🎉 You're all set!                                        │       │
│  │                                                                        │       │
│  │   Your profile is ready. Let's start training!                         │       │
│  │                                                                        │       │
│  │              ┌──────────────────────────────┐                          │       │
│  │              │   🚀 Go to Dashboard         │                          │       │
│  │              └──────────────────────────────┘                          │       │
│  │                                                                        │       │
│  └────────────────────────────────────────────────────────────────────────┘       │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Age Category Assignment

```typescript
function getAgeCategory(birthDate: Date): AgeCategory {
  const age = calculateAge(birthDate);

  if (age < 18) return "junior"; // 16-17 years
  if (age < 25) return "adult-open"; // 18-24 years
  if (age < 35) return "adult-masters"; // 25-34 years
  return "adult-seniors"; // 35+ years
}

// Age category affects:
// - Training load recommendations
// - Recovery time calculations
// - Competition eligibility
// - Sleep requirements
```

---

## Features

| Feature             | Description                           |
| ------------------- | ------------------------------------- |
| Progress Tracking   | Visual progress bar, step indicators  |
| Auto-save Drafts    | Save progress, resume where left off  |
| Skip Optional Steps | Medical history is optional           |
| Validation          | Required fields marked, inline errors |
| Back Navigation     | Can go back to previous steps         |

---

## Features to Implement

| Feature                      | Status | Priority |
| ---------------------------- | ------ | -------- |
| Progress Bar                 | ❌     | HIGH     |
| Step 1: Personal Info        | ❌     | HIGH     |
| Step 2: Athletic Profile     | ❌     | HIGH     |
| Step 3: Physical Profile     | ❌     | HIGH     |
| Step 4: Training Preferences | ❌     | MEDIUM   |
| Step 5: Medical History      | ❌     | LOW      |
| Step 6: Consent              | ❌     | HIGH     |
| Auto-save Drafts             | ❌     | LOW      |
| Avatar Upload                | ❌     | MEDIUM   |
| Age Calculation              | ❌     | HIGH     |
| Team Search                  | ❌     | LOW      |

---

## Data Sources

| Data            | Service           | Table           |
| --------------- | ----------------- | --------------- |
| User profile    | `AuthService`     | `profiles`      |
| Team membership | `TeamService`     | `team_members`  |
| Settings        | `SettingsService` | `user_settings` |

---

## Navigation

| From         | To            | Trigger                  |
| ------------ | ------------- | ------------------------ |
| Registration | Onboarding    | After email verification |
| Any Step     | Previous Step | Back button              |
| Any Step     | Next Step     | Continue button          |
| Step 6       | Dashboard     | "Go to Dashboard" button |
