# Routes and Data Connection Audit

**Generated:** January 3, 2026  
**Status:** Implementation Review

---

## Executive Summary

This audit examines the Angular frontend routes, their corresponding backend API connections, and database table coverage. The app has **70+ routes** configured with a mix of real backend integration, service-based data fetching, and demo data placeholders.

---

## 1. Route Categories Overview

### ✅ **Public Routes** (No Auth Required)
| Route | Component | Data Status |
|-------|-----------|-------------|
| `/` | `LandingComponent` | ✅ Static |
| `/login` | `LoginComponent` | ✅ Supabase Auth |
| `/register` | `RegisterComponent` | ✅ Supabase Auth |
| `/reset-password` | `ResetPasswordComponent` | ✅ Supabase Auth |
| `/update-password` | `UpdatePasswordComponent` | ✅ Supabase Auth |
| `/verify-email` | `VerifyEmailComponent` | ✅ Supabase Auth |
| `/auth/callback` | `AuthCallbackComponent` | ✅ Supabase Auth |
| `/onboarding` | `OnboardingComponent` | ✅ Local Storage + Supabase |
| `/accept-invitation` | `AcceptInvitationComponent` | ✅ Netlify Function |
| `/parent` | `ParentDashboardComponent` | ⚠️ Demo Data |

### ✅ **Dashboard Routes** (High Priority)
| Route | Component | Data Status | Backend |
|-------|-----------|-------------|---------|
| `/todays-practice` | `TodayComponent` | ✅ Real + Demo | `daily-protocol.cjs`, `training-sessions.cjs` |
| `/dashboard` | `DashboardComponent` | ✅ Real | `dashboard.cjs` |
| `/player-dashboard` | `PlayerDashboardComponent` | ✅ Real + Partial | `TrainingStatsCalculationService` |

### ✅ **Training Routes**
| Route | Component | Data Status | Backend |
|-------|-----------|-------------|---------|
| `/training` | `TrainingScheduleComponent` | ✅ Real | `training-sessions.cjs`, `training-programs.cjs` |
| `/workout` | `WorkoutComponent` | ✅ Real | `training-complete.cjs` |
| `/exercise-library` | `ExerciseLibraryComponent` | ✅ Real | `exercisedb.cjs` |
| `/exercisedb` | `ExerciseDBManagerComponent` | ✅ Real | `exercisedb.cjs` |
| `/training/qb` | `QbHubComponent` | ✅ Real | `qb-throwing.cjs` |
| `/training/ai-scheduler` | `AiTrainingSchedulerComponent` | ⚠️ Demo Data | - |
| `/training/log` | `TrainingLogComponent` | ✅ Real | `training-sessions.cjs` |
| `/training/videos` | `VideoFeedComponent` | ✅ Real | `training_videos` table |
| `/training/periodization` | `PeriodizationDashboardComponent` | ✅ Real | `training-programs.cjs` |

### ✅ **Analytics Routes**
| Route | Component | Data Status | Backend |
|-------|-----------|-------------|---------|
| `/analytics` | `AnalyticsComponent` | ✅ Real | `analytics.cjs`, `TrainingStatsService` |
| `/performance-tracking` | `PerformanceTrackingComponent` | ✅ Real | `performance-metrics.cjs` |

### ✅ **Wellness Routes**
| Route | Component | Data Status | Backend |
|-------|-----------|-------------|---------|
| `/wellness` | `WellnessComponent` | ✅ Real | `wellness.cjs`, `wellness-checkin.cjs` |
| `/acwr` | `AcwrDashboardComponent` | ✅ Real | `LoadMonitoringService`, `AcwrService` |
| `/return-to-play` | `ReturnToPlayComponent` | ⚠️ Demo Data | - |
| `/cycle-tracking` | `CycleTrackingComponent` | ⚠️ Demo Data | - |
| `/sleep-debt` | `SleepDebtComponent` | ⚠️ Demo Data | - |
| `/achievements` | `AchievementsComponent` | ✅ Real | `achievements.cjs` |

### ✅ **Game Routes**
| Route | Component | Data Status | Backend |
|-------|-----------|-------------|---------|
| `/game/readiness` | `GameDayReadinessComponent` | ✅ Real + Partial | `calc-readiness.cjs`, `weather.cjs` |
| `/game/nutrition` | `TournamentNutritionComponent` | ✅ Real + Partial | `nutrition.cjs` |
| `/travel/recovery` | `TravelRecoveryComponent` | ✅ Real | `travel_protocols` table |
| `/game-tracker` | `GameTrackerComponent` | ✅ Real | `games.cjs` |
| `/tournaments` | `TournamentsComponent` | ✅ Real | `tournaments.cjs` |

### ✅ **Team/Coach Routes**
| Route | Component | Data Status | Backend |
|-------|-----------|-------------|---------|
| `/roster` | `RosterComponent` | ✅ Real | `team_members`, `users` tables |
| `/coach/dashboard` | `CoachDashboardComponent` | ✅ Real | `coach.cjs` |
| `/coach/activity` | `CoachActivityFeedComponent` | ✅ Real | `coach-activity.cjs` |
| `/coach/analytics` | `CoachAnalyticsComponent` | ✅ Real | `coach-analytics.cjs` |
| `/coach/inbox` | `CoachInboxComponent` | ✅ Real | `coach-inbox.cjs` |
| `/coach/team` | `TeamManagementComponent` | ⚠️ Demo Data | - |
| `/coach/programs` | `ProgramBuilderComponent` | ⚠️ Demo Data | - |
| `/coach/practice` | `PracticePlannerComponent` | ⚠️ Demo Data | - |
| `/coach/injuries` | `InjuryManagementComponent` | ⚠️ Demo Data | - |
| `/coach/playbook` | `PlaybookManagerComponent` | ⚠️ Demo Data | - |
| `/coach/development` | `PlayerDevelopmentComponent` | ⚠️ Demo Data | - |
| `/coach/tournaments` | `TournamentManagementComponent` | ⚠️ Demo Data | - |
| `/coach/payments` | `PaymentManagementComponent` | ⚠️ Demo Data | - |
| `/coach/ai-scheduler` | `AiSchedulerComponent` | ⚠️ Demo Data | - |
| `/coach/knowledge` | `KnowledgeBaseComponent` | ✅ Real | `knowledge-search.cjs` |
| `/coach/film` | `FilmRoomCoachComponent` | ⚠️ Demo Data | - |
| `/coach/calendar` | `CalendarCoachComponent` | ⚠️ Demo Data | - |
| `/coach/scouting` | `ScoutingReportsComponent` | ⚠️ Demo Data | **NEEDS BACKEND** |

### ⚠️ **Staff Routes** (NEW - Need Backend)
| Route | Component | Data Status | Backend Needed |
|-------|-----------|-------------|----------------|
| `/staff/nutritionist` | `NutritionistDashboardComponent` | ⚠️ Demo Data | **NEEDS:** `staff-nutritionist.cjs` |
| `/staff/physiotherapist` | `PhysiotherapistDashboardComponent` | ⚠️ Demo Data | **NEEDS:** `staff-physiotherapist.cjs` |
| `/staff/psychology` | `PsychologyReportsComponent` | ⚠️ Demo Data | **NEEDS:** `staff-psychology.cjs` |

### ✅ **Social Routes**
| Route | Component | Data Status | Backend |
|-------|-----------|-------------|---------|
| `/community` | `CommunityComponent` | ✅ Real | `community.cjs` |
| `/chat` | `AiCoachChatComponent` | ✅ Real | `ai-chat.cjs` |
| `/team-chat` | `ChatComponent` | ✅ Real | `chat.cjs` |

### ✅ **Profile Routes**
| Route | Component | Data Status | Backend |
|-------|-----------|-------------|---------|
| `/profile` | `ProfileComponent` | ✅ Real | `user-profile.cjs` |
| `/settings` | `SettingsComponent` | ✅ Real | `player-settings.cjs` |
| `/settings/privacy` | `PrivacyControlsComponent` | ✅ Real | `privacy-settings.cjs` |

### ✅ **Player Feature Routes**
| Route | Component | Data Status | Backend |
|-------|-----------|-------------|---------|
| `/playbook` | `PlaybookComponent` | ⚠️ Demo Data | - |
| `/film` | `FilmRoomComponent` | ⚠️ Demo Data | - |
| `/calendar` | `TeamCalendarComponent` | ⚠️ Demo Data | - |
| `/payments` | `PaymentsComponent` | ⚠️ Demo Data | - |
| `/import` | `DataImportComponent` | ⚠️ Demo Data | - |

---

## 2. Backend Function Coverage

### ✅ **Existing Netlify Functions (91 total)**
The following backend functions exist and are connected:

#### Core APIs
- `auth-me.cjs` - Authentication verification
- `dashboard.cjs` - Dashboard data
- `wellness.cjs`, `wellness-checkin.cjs` - Wellness tracking
- `training-stats.cjs`, `training-sessions.cjs` - Training data
- `analytics.cjs` - Performance analytics
- `games.cjs` - Game tracking
- `tournaments.cjs` - Tournament management
- `community.cjs` - Social features
- `ai-chat.cjs` - AI Coach Merlin

#### Coach APIs
- `coach.cjs` - Coach dashboard
- `coach-analytics.cjs` - Team analytics
- `coach-inbox.cjs` - Coach inbox
- `coach-activity.cjs` - Activity feed

#### Specialized APIs
- `load-management.cjs` - ACWR calculations
- `nutrition.cjs` - Nutrition tracking
- `recovery.cjs` - Recovery protocols
- `achievements.cjs` - Achievement system
- `push.cjs` - Push notifications

### ⚠️ **Missing Backend Functions**

The following components use `loadDemoData()` and need backend APIs:

| Component | Needed Endpoint | Priority |
|-----------|-----------------|----------|
| `NutritionistDashboardComponent` | `/api/staff/nutritionist/*` | High |
| `PhysiotherapistDashboardComponent` | `/api/staff/physiotherapist/*` | High |
| `PsychologyReportsComponent` | `/api/staff/psychology/*` | High |
| `ScoutingReportsComponent` | `/api/coach/scouting/*` | Medium |
| `TeamManagementComponent` | `/api/coach/team/*` | Medium |
| `ProgramBuilderComponent` | `/api/coach/programs/*` | Medium |
| `PracticePlannerComponent` | `/api/coach/practice/*` | Medium |
| `InjuryManagementComponent` | `/api/coach/injuries/*` | Medium |
| `PlaybookManagerComponent` | `/api/coach/playbook/*` | Medium |
| `PaymentManagementComponent` | `/api/coach/payments/*` | Low |
| `ReturnToPlayComponent` | `/api/wellness/return-to-play/*` | Medium |
| `CycleTrackingComponent` | `/api/wellness/cycle/*` | Medium |
| `SleepDebtComponent` | `/api/wellness/sleep-debt/*` | Low |
| `CalendarCoachComponent` | `/api/coach/calendar/*` | Low |
| `FilmRoomCoachComponent` | `/api/coach/film/*` | Low |

---

## 3. Database Table Coverage

### ✅ **Tables with Frontend Integration**
- `users` - User profiles ✅
- `teams`, `team_members` - Team management ✅
- `training_sessions`, `training_programs` - Training ✅
- `wellness_logs`, `wellness_entries` - Wellness ✅
- `games`, `game_plays`, `game_events` - Games ✅
- `tournaments` - Tournaments ✅
- `exercisedb_exercises` - Exercise library ✅
- `notifications` - Notifications ✅
- `ai_chat_sessions`, `ai_messages` - AI Chat ✅
- `achievements`, `player_achievements` - Achievements ✅
- `attendance_records` - Attendance ✅
- `load_daily` - Load monitoring ✅

### ⚠️ **Tables Exist but No API Connection**
These database tables exist but are not exposed via APIs:

- `athlete_nutrition_profiles` - For nutritionist dashboard
- `athlete_injuries`, `injuries` - For physiotherapist dashboard
- `psychological_assessments`, `mental_performance_logs` - For psychology reports
- `playbook_entries` - For playbook features
- `video_clips`, `video_assignments` - For film room

### 📋 **Tables Needed for New Features**

For full staff dashboard functionality, consider adding:

```sql
-- Scouting Reports
CREATE TABLE scouting_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  opponent_name VARCHAR(255) NOT NULL,
  opponent_profile JSONB,
  offensive_notes TEXT,
  defensive_notes TEXT,
  key_players JSONB,
  tendencies JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Assignments (role-based access)
-- Already exists: staff_roles table
```

---

## 4. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Angular Frontend                        │
├─────────────────────────────────────────────────────────────┤
│  Components → Services → ApiService → HTTP Client           │
│                  ↓                                          │
│  - TrainingStatsService      baseUrl: localhost:4000 (dev)  │
│  - AcwrService               baseUrl: *.netlify.app (prod)  │
│  - PlayerStatisticsService                                  │
│  - SupabaseService (direct)                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Netlify Functions                         │
├─────────────────────────────────────────────────────────────┤
│  /api/*  →  netlify/functions/*.cjs                         │
│                  ↓                                          │
│  - supabase-client.cjs (shared)                             │
│  - Validation, business logic, error handling               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase                                │
├─────────────────────────────────────────────────────────────┤
│  - PostgreSQL database (270+ tables)                        │
│  - Row Level Security (RLS)                                 │
│  - Real-time subscriptions                                  │
│  - Authentication                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Recommendations

### Immediate (High Priority)
1. **Create Staff API Endpoints:**
   - `staff-nutritionist.cjs` - Athlete nutrition data aggregation
   - `staff-physiotherapist.cjs` - Injury and RTP tracking
   - `staff-psychology.cjs` - Mental wellness reports

2. **Connect Coach Features to Existing Tables:**
   - `InjuryManagementComponent` → `athlete_injuries` table
   - `PlaybookManagerComponent` → `playbook_entries` table

### Short-term (Medium Priority)
3. **Create Scouting API:**
   - New `scouting_reports` table
   - `scouting.cjs` function for CRUD operations

4. **Connect Film Room:**
   - Utilize existing `video_clips`, `video_assignments` tables
   - Create `film-room.cjs` function

### Long-term (Low Priority)
5. **Advanced Features:**
   - Payment integration (Stripe webhooks)
   - Calendar sync (Google Calendar API)
   - Sleep debt tracking (wearable integration)

---

## 6. Components Using Demo Data

The following components currently use `loadDemoData()` and should be prioritized for backend integration:

| Component | File | Lines |
|-----------|------|-------|
| `NutritionistDashboardComponent` | `staff/nutritionist/nutritionist-dashboard.component.ts` | 950-1000 |
| `PhysiotherapistDashboardComponent` | `staff/physiotherapist/physiotherapist-dashboard.component.ts` | 1029-1100 |
| `PsychologyReportsComponent` | `staff/psychology/psychology-reports.component.ts` | (loadData) |
| `ScoutingReportsComponent` | `coach/scouting/scouting-reports.component.ts` | 1080-1150 |
| `TeamManagementComponent` | `coach/team-management/team-management.component.ts` | (loadDemoData) |
| `ProgramBuilderComponent` | `coach/program-builder/program-builder.component.ts` | (loadDemoData) |
| `PaymentManagementComponent` | `coach/payment-management/payment-management.component.ts` | (loadDemoData) |

---

## 7. API_ENDPOINTS Coverage Check

Current `API_ENDPOINTS` in `api.service.ts` covers:
- ✅ Dashboard endpoints
- ✅ Training endpoints
- ✅ Performance endpoints
- ✅ Analytics endpoints
- ✅ Coach endpoints
- ✅ Community endpoints
- ✅ Tournament endpoints
- ✅ Wellness endpoints
- ✅ Load management endpoints
- ✅ Games endpoints
- ✅ Attendance endpoints
- ✅ Equipment endpoints
- ✅ Officials endpoints
- ✅ Push notifications

**Missing from API_ENDPOINTS:**
- ❌ Staff endpoints (nutritionist, physio, psychology)
- ❌ Scouting endpoints
- ❌ Film room endpoints
- ❌ Playbook endpoints (coach side)
- ❌ Calendar endpoints (coach side)

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total Routes | 70+ |
| Routes with Real Data | 45 (~64%) |
| Routes with Demo Data | 25 (~36%) |
| Netlify Functions | 91 |
| Database Tables | 270+ |
| Components Needing Backend | 15 |

