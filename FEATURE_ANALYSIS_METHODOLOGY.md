# Feature Analysis Methodology Guide

## 🎯 Recommended Approach: **Hybrid Strategy**

For analyzing features and functionalities in FlagFit Pro, use a **two-phase hybrid approach**:

1. **Phase 1: Comprehensive Overview** (Big Picture First)
2. **Phase 2: Deep-Dive Feature-by-Feature** (Detailed Analysis)

---

## Phase 1: Comprehensive Overview (Start Here)

### Purpose

Understand the **entire system architecture**, feature relationships, dependencies, and data flow before diving into individual features.

### What to Map

#### 1. **Feature Inventory**

Create a master list of all features:

```typescript
// Based on app.routes.ts analysis:
Features:
├── Auth (Login, Register, Reset Password)
├── Dashboard (Athlete & Coach views)
├── Training (Main training module)
│   ├── AI Training Companion
│   ├── Flag Load Component
│   ├── Goal-Based Planner
│   ├── Microcycle Planner
│   └── Smart Training Form
├── Analytics
├── Performance Tracking
├── ACWR Dashboard (Load Monitoring)
├── Game Tracker
├── Roster
├── Tournaments
├── Community
├── Chat
├── Coach
├── Wellness
├── Exercise Library
├── Workout
├── Profile
└── Settings
```

#### 2. **Service Dependencies Map**

Identify which services each feature uses:

```bash
# Key Services to analyze:
core/services/
├── auth.service.ts          # Used by: All authenticated routes
├── api.service.ts           # Used by: All features
├── acwr.service.ts          # Used by: ACWR Dashboard, Training
├── analytics-data.service.ts # Used by: Analytics, Dashboard
├── game-stats.service.ts    # Used by: Game Tracker, Analytics
├── performance-data.service.ts # Used by: Performance Tracking, Analytics
├── training-plan.service.ts # Used by: Training, Dashboard
├── wellness.service.ts      # Used by: Wellness, Dashboard
└── ... (20+ more services)
```

#### 3. **Data Flow Analysis**

- Where does data originate? (API endpoints, database)
- How does data flow between features?
- What shared state exists?

#### 4. **Component Hierarchy**

- Shared components vs feature-specific components
- Component reusability patterns

### Tools for Phase 1

```bash
# 1. Generate feature dependency graph
cd angular
find src/app/features -name "*.ts" -type f | xargs grep -l "import.*service" | sort

# 2. List all API endpoints used
grep -r "api\." src/app --include="*.ts" | grep -o "api\.[a-zA-Z]*" | sort | uniq

# 3. Map route-to-component relationships
cat src/app/app.routes.ts | grep -E "path:|loadComponent:"
```

---

## Phase 2: Deep-Dive Feature-by-Feature

### Purpose

Understand **detailed functionality**, user flows, edge cases, and implementation specifics for each feature.

### Analysis Template (Use for Each Feature)

#### Feature: `[Feature Name]`

**1. Entry Points**

- Route: `/feature-name`
- Component: `FeatureComponent`
- Guards: `[authGuard, headerConfigGuard]`
- Resolvers: `[prefetchResolver]` (if any)

**2. Component Structure**

```
features/[feature-name]/
├── [feature-name].component.ts    # Main component
├── [feature-name].component.html  # Template
├── [feature-name].component.scss  # Styles
└── [sub-components]/              # Child components
```

**3. Dependencies**

- **Services Used**: List all services imported
- **Shared Components**: List reusable components
- **Models/Interfaces**: Data structures used

**4. Functionality Breakdown**

- **Primary Functions**: What does this feature do?
- **User Actions**: What can users do here?
- **Data Operations**: CRUD operations performed
- **API Calls**: Endpoints called
- **State Management**: How state is managed (Signals, RxJS, etc.)

**5. User Flows**

```
User Flow 1: [Description]
1. User action →
2. Component method →
3. Service call →
4. API request →
5. Response handling →
6. UI update
```

**6. Edge Cases & Error Handling**

- What happens on API failures?
- Validation rules
- Loading states
- Empty states

**7. Integration Points**

- Which other features does this connect to?
- Shared data or state?

**8. Legacy Code Mapping**

- Corresponding HTML file: `[feature-name].html`
- Legacy JS files: `src/js/pages/[feature-name].js`
- Migration status: ✅ Complete / 🚧 In Progress / ❌ Not Started

---

## 🎯 Feature Prioritization: 3D Decision Matrix

Use this matrix to prioritize feature analysis based on **Impact** and **Dependency**:

```
┌────────────────────────────────────────────────────────────┐
│  HIGH IMPACT                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🔴 CRITICAL: Analyze FIRST (blocks others or core UX)│  │
│  │                                                      │  │
│  │ HIGH DEPENDENCY (blocks/is blocked by others):      │  │
│  │ • Auth Service          → Blocks ALL features       │  │
│  │ • API Service           → Blocks ALL features       │  │
│  │ • Dashboard             → Aggregates ALL data       │  │
│  │ • ACWR Service          → Blocks Training/Analytics │  │
│  │ • Missing PrimeNG       → Blocks 9 components      │  │
│  │                                                      │  │
│  │ LOW DEPENDENCY (can analyze in isolation):          │  │
│  │ • Auth failures         → Affects all users         │  │
│  │ • ACWR calculations      → Invalidates training      │  │
│  │ • Error handling gaps   → 18+ backend functions     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🟡 IMPORTANT: Analyze SECOND (improves core flow)    │  │
│  │                                                      │  │
│  │ HIGH DEPENDENCY:                                     │  │
│  │ • Training             → Uses ACWR, Analytics        │  │
│  │ • Analytics            → Used by Dashboard/Training  │  │
│  │ • Performance Tracking → Used by Analytics/Dashboard │  │
│  │ • Game Tracker         → Uses Analytics, Stats      │  │
│  │                                                      │  │
│  │ LOW DEPENDENCY:                                      │  │
│  │ • Training plan persistence → BUG                    │  │
│  │ • Notification badge count  → BUG                   │  │
│  │ • Security fixes (remaining) → Improves reliability  │  │
│  └──────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│  LOW IMPACT                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🟢 NICE-TO-HAVE: Defer (low user cost)              │  │
│  │                                                      │  │
│  │ HIGH DEPENDENCY:                                    │  │
│  │ • Community          → Social features               │  │
│  │ • Chat               → Communication                │  │
│  │ • Tournaments        → Event management             │  │
│  │                                                      │  │
│  │ LOW DEPENDENCY:                                     │  │
│  │ • HTML inconsistencies → 1094+ inline styles        │  │
│  │ • getTimeAgo() display → Cosmetic bug               │  │
│  │ • Loading spinners    → UX polish                   │  │
│  │ • Font family mixing  → Design consistency          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
         LOW DEPENDENCY              HIGH DEPENDENCY
    (Can analyze in isolation)   (Blocks or is blocked by others)
```

---

## Recommended Analysis Order (Based on 3D Matrix)

### 🔴 CRITICAL Priority (Analyze FIRST)

**HIGH IMPACT + HIGH DEPENDENCY:**

1. **Auth Service** → Blocks ALL features
   - Impact: All users affected
   - Dependency: Used by 15+ routes
   - Issues: Auth failures, token management

2. **API Service** → Blocks ALL features
   - Impact: All API calls fail if broken
   - Dependency: Used by every feature
   - Issues: Error handling incomplete (18+ functions)

3. **Dashboard** → Central hub
   - Impact: Primary user entry point
   - Dependency: Aggregates data from 10+ features
   - Issues: Data aggregation, performance

4. **ACWR Service** → Blocks Training/Analytics
   - Impact: Invalidates training if wrong
   - Dependency: Used by Training, Dashboard, Analytics
   - Issues: Calculation accuracy critical

**HIGH IMPACT + LOW DEPENDENCY:** 5. **Missing PrimeNG Modules** → Blocks 9 components

- Impact: Components won't compile
- Dependency: Can fix in isolation
- Issues: `dropdown`, `tabview`, `calendar`, etc.

### 🟡 IMPORTANT Priority (Analyze SECOND)

**HIGH IMPACT + HIGH DEPENDENCY:** 6. **Training** → Core feature

- Impact: Primary training functionality
- Dependency: Uses ACWR, Analytics, Performance Data
- Issues: Plan persistence, complex logic

7. **Analytics** → Data visualization
   - Impact: Critical for insights
   - Dependency: Used by Dashboard, Training
   - Issues: Data accuracy, performance

8. **Performance Tracking** → Metrics
   - Impact: Core metrics display
   - Dependency: Used by Analytics, Dashboard
   - Issues: Statistics calculations

9. **Game Tracker** → Real-time tracking
   - Impact: Game data critical
   - Dependency: Uses Analytics, Stats services
   - Issues: Real-time sync, data accuracy

**HIGH IMPACT + LOW DEPENDENCY:** 10. **Error Handling** → Reliability - Impact: Improves app stability - Dependency: Can fix incrementally - Issues: 18+ backend functions incomplete

11. **Security Fixes** → Security hardening
    - Impact: Security vulnerabilities
    - Dependency: Can fix in isolation
    - Issues: SQL injection, input validation

### 🟢 NICE-TO-HAVE Priority (Defer)

**LOW IMPACT + HIGH DEPENDENCY:** 12. **Community** → Social features 13. **Chat** → Communication 14. **Tournaments** → Event management 15. **Roster** → Team management 16. **Wellness** → Health tracking 17. **Exercise Library** → Reference data 18. **Workout** → Session management 19. **Coach** → Coaching tools 20. **Profile/Settings** → User management

**LOW IMPACT + LOW DEPENDENCY:** 21. **HTML Inconsistencies** → 1094+ inline styles 22. **Design System** → Font mixing, class naming 23. **UX Polish** → Loading spinners, time displays

---

## Analysis Tools & Commands

### Quick Feature Overview

```bash
# See all features at once
cd angular/src/app/features
ls -la

# Count components per feature
for dir in */; do echo "$dir: $(find "$dir" -name "*.component.ts" | wc -l) components"; done
```

### Service Usage Analysis

```bash
# Find which features use a specific service
grep -r "AcwrService" angular/src/app/features --include="*.ts"

# Find all services used by a feature
grep -r "import.*Service" angular/src/app/features/training --include="*.ts"
```

### API Endpoint Mapping

```bash
# Find all API calls in a feature
grep -r "api\." angular/src/app/features/training --include="*.ts" | grep -o "api\.[a-zA-Z]*" | sort | uniq
```

### Component Dependencies

```bash
# See component imports
grep -r "import.*Component" angular/src/app/features/training --include="*.ts"
```

---

## Documentation Template

For each feature, create a markdown file:

````markdown
# Feature: [Feature Name]

## Overview

[Brief description]

## Entry Points

- Route: `/feature-name`
- Component: `FeatureComponent`
- Guards: `[list]`

## Dependencies

### Services

- `ServiceName` - [purpose]

### Components

- `ComponentName` - [purpose]

## Functionality

### Primary Functions

1. [Function 1]
2. [Function 2]

### User Flows

[Flow descriptions]

## API Endpoints

- `GET /api/endpoint` - [purpose]
- `POST /api/endpoint` - [purpose]

## Data Models

```typescript
interface FeatureData {
  // structure
}
```
````

## Integration Points

- Connects to: [other features]
- Shared state: [description]

## Legacy Mapping

- HTML: `[file].html`
- JS: `src/js/pages/[file].js`
- Status: [migration status]

```

---

## Why This Hybrid Approach?

### ✅ Benefits of Comprehensive First
- Understand dependencies before deep-diving
- Identify shared patterns early
- See the big picture architecture
- Avoid missing integration points

### ✅ Benefits of Feature-by-Feature Deep-Dive
- Detailed understanding of each feature
- Easier to document incrementally
- Can prioritize based on business needs
- Easier to assign to team members

### ⚠️ Avoid These Mistakes
- ❌ Starting deep-dive without overview → Missing dependencies
- ❌ Only doing overview → No detailed understanding
- ❌ Random order → Missing context
- ❌ Skipping legacy code → Missing functionality

---

## Feature-by-Feature Matrix Mapping

### 🔴 CRITICAL Features (Start Here)

| Feature | Impact | Dependency | Priority | Why Critical |
|---------|--------|------------|----------|-------------|
| **Auth Service** | HIGH | HIGH | 🔴 CRITICAL | Blocks ALL features - no auth = no app |
| **API Service** | HIGH | HIGH | 🔴 CRITICAL | All features depend on API calls |
| **Dashboard** | HIGH | HIGH | 🔴 CRITICAL | Central hub, aggregates all data |
| **ACWR Service** | HIGH | HIGH | 🔴 CRITICAL | Wrong calculations = invalid training |
| **PrimeNG Modules** | HIGH | LOW | 🔴 CRITICAL | Blocks 9 components from compiling |

### 🟡 IMPORTANT Features (Second Wave)

| Feature | Impact | Dependency | Priority | Why Important |
|---------|--------|------------|----------|---------------|
| **Training** | HIGH | HIGH | 🟡 IMPORTANT | Core feature, uses ACWR/Analytics |
| **Analytics** | HIGH | HIGH | 🟡 IMPORTANT | Used by Dashboard/Training |
| **Performance Tracking** | HIGH | HIGH | 🟡 IMPORTANT | Metrics feed Analytics/Dashboard |
| **Game Tracker** | HIGH | HIGH | 🟡 IMPORTANT | Real-time data, uses Analytics |
| **Error Handling** | HIGH | LOW | 🟡 IMPORTANT | 18+ functions incomplete |
| **Security Fixes** | HIGH | LOW | 🟡 IMPORTANT | SQL injection, validation gaps |

### 🟢 NICE-TO-HAVE Features (Defer)

| Feature | Impact | Dependency | Priority | Notes |
|---------|--------|------------|----------|-------|
| **Community** | LOW | HIGH | 🟢 DEFER | Social features, not core |
| **Chat** | LOW | HIGH | 🟢 DEFER | Communication, isolated |
| **Tournaments** | LOW | HIGH | 🟢 DEFER | Event management |
| **Roster** | LOW | MEDIUM | 🟢 DEFER | Team management |
| **Wellness** | LOW | MEDIUM | 🟢 DEFER | Health tracking |
| **Exercise Library** | LOW | LOW | 🟢 DEFER | Reference data |
| **Workout** | LOW | MEDIUM | 🟢 DEFER | Session management |
| **Coach** | LOW | MEDIUM | 🟢 DEFER | Coaching tools |
| **Profile/Settings** | LOW | LOW | 🟢 DEFER | User management |

---

## Quick Start Checklist (Updated with Matrix)

### Phase 1: Comprehensive Overview
- [ ] Create feature inventory
- [ ] Map service dependencies
- [ ] Identify data flow patterns
- [ ] **Classify each feature in 3D matrix**

### Phase 2: CRITICAL Features (🔴)
- [ ] Analyze Auth Service (blocks all)
- [ ] Analyze API Service (blocks all)
- [ ] Analyze Dashboard (central hub)
- [ ] Analyze ACWR Service (invalidates training)
- [ ] Fix PrimeNG modules (blocks 9 components)

### Phase 3: IMPORTANT Features (🟡)
- [ ] Analyze Training (core feature)
- [ ] Analyze Analytics (data visualization)
- [ ] Analyze Performance Tracking (metrics)
- [ ] Analyze Game Tracker (real-time)
- [ ] Complete Error Handling (18+ functions)
- [ ] Apply Security Fixes (vulnerabilities)

### Phase 4: NICE-TO-HAVE Features (🟢)
- [ ] Analyze remaining features as needed
- [ ] Fix HTML inconsistencies
- [ ] Polish UX elements

### Documentation
- [ ] Document findings as you go
- [ ] Create feature documentation files
- [ ] Update matrix as you discover issues

---

## How to Use the 3D Matrix

### Step 1: Determine IMPACT (HIGH vs LOW)

**HIGH IMPACT** if:
- ✅ Affects all users or core functionality
- ✅ Blocks other features from working
- ✅ Causes data loss or incorrect calculations
- ✅ Security vulnerabilities
- ✅ Breaks authentication/authorization
- ✅ Invalidates critical business logic (e.g., ACWR calculations)

**LOW IMPACT** if:
- ✅ Cosmetic issues (styling, fonts)
- ✅ Nice-to-have features (social, chat)
- ✅ UX polish (loading spinners, time displays)
- ✅ Non-critical bugs (badge counts, display formatting)

### Step 2: Determine DEPENDENCY (HIGH vs LOW)

**HIGH DEPENDENCY** if:
- ✅ Used by 3+ other features
- ✅ Required for other features to work
- ✅ Shared service/component
- ✅ Core infrastructure (Auth, API, Dashboard)

**LOW DEPENDENCY** if:
- ✅ Can be fixed/analyzed in isolation
- ✅ Used by 1-2 features only
- ✅ Self-contained feature
- ✅ No blocking relationships

### Step 3: Assign Priority

```

HIGH IMPACT + HIGH DEPENDENCY → 🔴 CRITICAL (Fix FIRST)
HIGH IMPACT + LOW DEPENDENCY → 🔴 CRITICAL (Fix FIRST)
LOW IMPACT + HIGH DEPENDENCY → 🟡 IMPORTANT (Fix SECOND)
LOW IMPACT + LOW DEPENDENCY → 🟢 NICE-TO-HAVE (Defer)

```

### Example: Analyzing "Training" Feature

**Step 1: Impact Assessment**
- ✅ Core feature (users train daily)
- ✅ Complex planning logic
- ✅ Uses ACWR calculations (critical)
- **Result: HIGH IMPACT**

**Step 2: Dependency Assessment**
- ✅ Uses: ACWR Service, Analytics Service, Performance Data Service
- ✅ Used by: Dashboard (shows training stats)
- ✅ 3+ service dependencies
- **Result: HIGH DEPENDENCY**

**Step 3: Priority Assignment**
- HIGH IMPACT + HIGH DEPENDENCY = **🟡 IMPORTANT**
- **Reason**: Critical feature but depends on CRITICAL services (ACWR, API)
- **Order**: Analyze AFTER ACWR Service (which it depends on)

---

## Practical Analysis Workflow

### For Each Feature:

1. **Quick Assessment** (5 min)
   - Read component file
   - List imported services
   - Check route guards/resolvers
   - Identify known issues from codebase search

2. **Impact Analysis** (10 min)
   - How many users affected?
   - What breaks if this fails?
   - Is it core functionality?
   - **Score: HIGH or LOW**

3. **Dependency Analysis** (10 min)
   - Count service dependencies
   - List features that use this
   - Check shared components
   - **Score: HIGH or LOW**

4. **Matrix Placement** (1 min)
   - Place in appropriate quadrant
   - Assign priority level
   - Add to analysis queue

5. **Deep Dive** (30-60 min)
   - Follow Phase 2 analysis template
   - Document functionality
   - Map user flows
   - Identify issues

---

---

## 🚀 Concrete Implementation Plan

Based on the 3D Decision Matrix, here's a phased approach to fixing critical issues and stabilizing the system:

### Phase 1: Fix Critical Blockers (Week 1-2)

**Goal**: Restore reliability in core paths. Low effort, high ROI.

| Priority | Issue | Why First | Fix Effort | Impact |
|----------|-------|-----------|------------|--------|
| 🔴 P0 | Notifications don't persist (bugs #1, #2) | Read status lost on reload—users see stale data | 2-3 hrs | **HIGH**: Affects all users every session |
| 🔴 P0 | Badge count always 0 (bug #3) | Users can't see unread count—defeats purpose | 1-2 hrs | **HIGH**: Core UX signal broken |
| 🔴 P0 | ACWR thresholds not evidence-based | Periodization is guessing without science | 4-5 hrs | **CRITICAL**: Invalidates training logic |
| 🟡 P1 | No bulk "mark all as read" endpoint (bug #4) | Slow UX if many notifications | 2-3 hrs | **MEDIUM**: Efficiency issue |
| 🟡 P1 | Error handling missing in persist calls (bug #6) | Silent failures = users frustrated | 1-2 hrs | **MEDIUM**: Debugging nightmare |

**Why this order:**
- Notification persistence affects every user, every day
- ACWR is foundational—wrong thresholds = wrong training
- Badge count is the only visual signal that notifications exist
- All three are low-dependency: fixing them doesn't require changes elsewhere

**Total Phase 1 effort**: ~10-15 hours
**Expected payoff**: Core system reliability restored; users trust the app again

#### Quick Wins Sequence (Do First in Phase 1):

```

Hour 1-2: Fix markNotificationAsRead() to call API
↓ (Quick because notifications.cjs endpoint exists)

Hour 3-4: Fix markAllAsRead() to call API (or add bulk endpoint)
↓ (Unblock UI layer)

Hour 5-6: Implement getNotificationCount() in top-bar.js
↓ (Connect to API endpoint you just verified works)

Result: Users see notifications persist, badge shows real count

```

**Why this sequencing**: Each step is 1-2 hours, and completing one unblocks the next—you get fast feedback and momentum.

#### Then Move to ACWR:

```

Hour 7-10: Add EvidenceConfig to acwr.service.ts
↓ (Makes thresholds explicit; no logic changes yet)

Hour 11-14: Add minChronicLoad guardrail & data quality flags
↓ (Defensive; catches edge cases)

Hour 15-17: Align readiness.service.ts weighting with literature

Result: System is still behaving the same, but now defensible

```

---

### Phase 2: Stabilize Foundational Services (Week 3-4)

**Goal**: Make core services reliable so higher-level features can trust them.

| Priority | Task | Why Second | Effort | Impact |
|----------|------|------------|--------|--------|
| 🟡 P2 | Audit & fix `acwr.service.ts` with evidence config | ACWR is used by Training, Dashboard, Load Monitoring | 6-8 hrs | **HIGH**: Unblocks periodization fixes |
| 🟡 P2 | Audit & fix `readiness.service.ts` with weighted scoring | Readiness used by Training, AI Scheduler, Alerts | 4-6 hrs | **HIGH**: Affects all training decisions |
| 🟡 P2 | Implement TrainingPlanService persistence layer | Currently likely brittle; blocks training reliability | 8-10 hrs | **MEDIUM**: Stabilizes core workflow |
| 🟢 P3 | Centralize notification state management | Lay foundation for real-time updates later | 4-6 hrs | **MEDIUM**: Cleans up notification spaghetti |

**Why this order:**
- Fixes in Phase 1 revealed which services have deep issues
- ACWR and readiness are used by everything—fixing them unblocks multiple downstream features
- Training plan persistence is a hidden blocker—users don't see it fail, but coaches will

**Total Phase 2 effort**: ~22-30 hours
**Expected payoff**: Services become reliable foundations; subsequent features have fewer surprises

---

### Phase 3: Enhance & Document (Week 5+)

**Goal**: Add UX polish, tests, and documentation so the system scales.

| Priority | Task | Why Third | Effort | Impact |
|----------|------|-----------|--------|--------|
| 🟡 P3 | Add loading states & empty states across panels | Polish UX; users understand what's happening | 4-6 hrs | **MEDIUM**: UX quality |
| 🟡 P3 | Add click-outside handlers for notification panel | Align with nav patterns; small but expected | 1-2 hrs | **LOW**: UX consistency |
| 🟡 P3 | Fix getTimeAgo() to show minutes | Nice UX detail; low cost | 1 hr | **LOW**: Polish |
| 🟢 P4 | Write integration tests for notification flow | Catch regressions early; enable confident refactors | 6-8 hrs | **MEDIUM**: Long-term stability |
| 🟢 P4 | Document ACWR config, readiness scoring, taper logic | New coaches/devs can understand the system | 4-6 hrs | **MEDIUM**: Onboarding & maintenance |

**Why this order:**
- Phases 1–2 have fixed the underlying problems
- Now you add tests and docs so Phase 1–2 fixes don't regress
- Users notice UX polish, but it's less critical than "does it work?"

**Total Phase 3 effort**: ~16-22 hours
**Expected payoff**: System is reliable, tested, and documented

---

## 📊 Impact × Effort Decision Matrix

Use this quadrant for your team's next planning meeting:

```

         LOW EFFORT ← → HIGH EFFORT
                ↑
          HIGH      │  ✅ DO FIRST    │  ⚠️  DO LATER
         IMPACT     │  (Quick wins)   │  (Big wins, more risk)
                    │  ─────────────  │  ─────────────
          LOW       │  🟢 DO LAST    │  ❌ DEFER
         IMPACT     │  (Polish)      │  (Low ROI)
                ↓

```

**For FlagFit Pro:**

- ✅ **Notifications bug fixes** = LOW EFFORT + HIGH IMPACT → DO FIRST
- ✅ **ACWR evidence audit** = MEDIUM EFFORT + CRITICAL IMPACT → DO SECOND
- 🟢 **Notification polish** (click-outside, spinners) = LOW EFFORT + LOW IMPACT → DO THIRD
- ❌ **Full redesign of training scheduler** = HIGH EFFORT + MEDIUM IMPACT → DEFER

---

## 🎯 Your Concrete Next Steps (Monday Morning)

### ✅ Do This Week (6-8 hours, very high ROI):

**Fix the three notification bugs (Phase 1, hours 1-6):**
1. Add API calls to `markNotificationAsRead()` and `markAllAsRead()`
2. Implement `getNotificationCount()` calling `GET /api/notifications/count`
3. Add error handling and toast messages

**Audit ACWR for evidence alignment (Phase 1, hours 7-10):**
1. Run through the "Strengthen ACWR and load logic" section
2. Add `EvidenceConfig` with citations
3. No logic changes; just make it explicit

**Expected result**: Users see that notifications work. ACWR is defensible. Team confidence up.

### 🔄 Do Next (10-15 hours):

**Refactor notification state (Phase 2, hours 11-20):**
1. Centralize into a store; make it source-of-truth
2. Add tests that verify persistence across reloads

**Stabilize readiness + periodization (Phase 2, hours 21-30):**
1. Apply the same evidence-config pattern
2. Document assumptions

---

## 📋 Summary Table: Quick Reference

| What | When | Why | Effort |
|------|------|-----|--------|
| Fix notification persistence bugs | This week | Users frustrated if reads don't save | 3 hrs |
| Fix badge count | This week | Only signal that notifications exist | 2 hrs |
| Add bulk endpoint | This week | Efficiency; unblock second wave of fixes | 2 hrs |
| Audit + harden ACWR | Next week | Core to training logic; prevents wrong decisions | 8 hrs |
| Refactor notification state | Week 3 | Foundation for real-time updates + tests | 10 hrs |
| Polish UX (spinners, click-outside) | Week 4 | Nice-to-have; low user cost if deferred | 4 hrs |
| Document + test | Week 5+ | Prevents regressions; unblocks team scaling | 10 hrs |

**Bottom line**: Bigger functionality second + fix errors first = maximum impact, lowest risk, fastest ROI. Start with the notification bugs (2–3 hours each), then move to ACWR defensibility, then refactor under stable ground.

---

## Next Steps

1. **Start with Phase 1** - Fix critical blockers (notifications + ACWR)
2. **Classify features** - Use 3D matrix to prioritize remaining work
3. **Analyze CRITICAL first** - Auth → API → Dashboard → ACWR → PrimeNG
4. **Then IMPORTANT** - Training → Analytics → Performance → Game Tracker
5. **Document as you go** - Create markdown files for each feature
6. **Iterate** - Refine understanding as you discover more

Would you like me to help you:
- Generate the feature inventory with matrix classifications?
- Start analyzing a specific CRITICAL feature?
- Create dependency graphs showing relationships?
- Begin implementing Phase 1 fixes (notifications + ACWR)?

```
