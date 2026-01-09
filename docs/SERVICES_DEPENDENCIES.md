# FlagFit Pro - Service Dependencies Documentation

**Generated:** January 9, 2026  
**Last Updated:** January 9, 2026  
**Purpose:** Document service dependencies, responsibilities, and dependency chains

---

## Table of Contents

1. [Overview](#overview)
2. [Dependency Levels](#dependency-levels)
3. [Core Services (Level 0)](#core-services-level-0)
4. [Level 1 Dependencies](#level-1-dependencies)
5. [Level 2 Dependencies](#level-2-dependencies)
6. [Level 3+ Dependencies](#level-3-dependencies)
7. [Service Responsibilities](#service-responsibilities)
8. [Circular Dependencies](#circular-dependencies)
9. [Dependency Graph](#dependency-graph)
10. [Best Practices](#best-practices)

---

## Overview

FlagFit Pro uses **86+ Angular services** organized in a layered dependency architecture. This document maps all service dependencies to help with:

- Understanding service relationships
- Identifying refactoring opportunities
- Preventing circular dependencies
- Planning service updates
- Onboarding new developers

### Dependency Architecture

```
Level 0: Foundation Services (No dependencies)
  ↓
Level 1: Core Business Logic Services
  ↓
Level 2: Feature-Specific Services
  ↓
Level 3+: Composite/Facade Services
```

---

## Dependency Levels

### Level 0: Foundation Services

These services have **no service dependencies** (only Angular core dependencies like `HttpClient`, `Router`).

### Level 1: Core Business Logic

Services that depend only on Level 0 services.

### Level 2: Feature Services

Services that depend on Level 0 and Level 1 services.

### Level 3+: Composite Services

Services that aggregate multiple lower-level services (facade pattern).

---

## Core Services (Level 0)

### Foundation Services (No Dependencies)

| Service | Purpose | Dependencies | Lines |
|---------|---------|--------------|-------|
| `LoggerService` | Centralized logging | None (Angular core only) | ~200 |
| `SupabaseService` | Supabase client wrapper | `LoggerService` | ~350 |
| `ApiService` | HTTP client wrapper | `HttpClient`, `LoggerService` | ~185 |
| `ResourceService` | Angular 21 resource API | `HttpClient`, `LoggerService` | ~260 |
| `ThemeService` | Theme management | None | ~150 |
| `PlatformService` | Platform detection | None | ~300 |
| `NetworkStatusService` | Network connectivity | None | ~200 |
| `ToastService` | Toast notifications | None | ~150 |
| `LoadingService` | Loading state management | None | ~100 |

**Note:** `SupabaseService` depends on `LoggerService`, but `LoggerService` has no dependencies, so `SupabaseService` is still considered Level 0.

---

## Level 1 Dependencies

### Core Business Logic Services

| Service | Purpose | Dependencies | Lines |
|---------|---------|--------------|-------|
| `AuthService` | Authentication | `SupabaseService`, `Router` | ~250 |
| `ContextService` | User context | `SupabaseService`, `Router`, `LoggerService` | ~530 |
| `EvidenceConfigService` | Evidence-based config | None (Level 0) | ~220 |
| `PrivacySettingsService` | Privacy controls | `SupabaseService` | ~890 |
| `ErrorTrackingService` | Error tracking | `LoggerService` | ~375 |
| `UnitManagerService` | Unit conversion | None (Level 0) | ~335 |

### Data Access Services

| Service | Purpose | Dependencies | Lines |
|---------|---------|--------------|-------|
| `DirectSupabaseApiService` | Direct Supabase queries | `SupabaseService`, `LoggerService` | ~570 |
| `TrainingDataService` | Training data access | `SupabaseService`, `ApiService` | ~700 |
| `PerformanceDataService` | Performance metrics | `SupabaseService`, `ApiService` | ~500 |
| `WellnessService` | Wellness data | `SupabaseService`, `ApiService` | ~620 |
| `ChannelService` | Team chat channels | `SupabaseService`, `RealtimeService` | ~1,270 |
| `RealtimeService` | Real-time subscriptions | `SupabaseService` | ~400 |

---

## Level 2 Dependencies

### ACWR & Load Monitoring

| Service | Purpose | Dependencies | Lines |
|---------|---------|--------------|-------|
| `AcwrService` | ACWR calculations | `EvidenceConfigService`, `SupabaseService`, `LoggerService`, `AcwrSpikeDetectionService` | ~1,275 |
| `AcwrSpikeDetectionService` | Spike detection | `SupabaseService`, `LoggerService` | ~200 |
| `AcwrAlertsService` | Load alerts | `AcwrService` | ~435 |
| `LoadMonitoringService` | Load monitoring | `AcwrService`, `SupabaseService` | ~540 |

### Wellness & Readiness

| Service | Purpose | Dependencies | Lines |
|---------|---------|--------------|-------|
| `ReadinessService` | Readiness calculations | `ApiService`, `EvidenceConfigService`, `LoggerService` | ~370 |
| `WellnessRecoveryService` | Wellness tracking | `SupabaseService`, `RecoveryService`, `ReadinessService` | ~600 |
| `RecoveryService` | Recovery protocols | `SupabaseService` | ~400 |
| `SleepDebtService` | Sleep debt tracking | `SupabaseService` | ~770 |
| `GameDayRecoveryService` | Game day recovery | `SupabaseService` | ~300 |
| `TravelRecoveryService` | Travel recovery | `SupabaseService` | ~250 |
| `AgeAdjustedRecoveryService` | Age-adjusted recovery | `LoggerService` | ~300 |

### AI & Intelligence

| Service | Purpose | Dependencies | Lines |
|---------|---------|--------------|-------|
| `AiService` | AI/LLM integration | `ApiService`, `PrivacySettingsService`, `LoggerService` | ~400 |
| `AiChatService` | AI Coach chat | `ApiService` | ~290 |
| `FlagFootballEvidenceService` | Evidence knowledge | None (Level 0) | ~200 |
| `EvidenceKnowledgeBaseService` | Knowledge base | `SupabaseService` | ~200 |
| `SprintTrainingKnowledgeService` | Sprint knowledge | `SupabaseService` | ~1,770 |

### Training & Performance

| Service | Purpose | Dependencies | Lines |
|---------|---------|--------------|-------|
| `TrainingPlanService` | Training plans | `SupabaseService`, `ApiService` | ~500 |
| `TrainingProgramService` | Training programs | `SupabaseService` | ~400 |
| `TrainingMetricsService` | Training metrics | `SupabaseService` | ~300 |
| `TrainingStatsCalculationService` | Stats calculations | `SupabaseService` | ~400 |
| `TrainingSafetyService` | Safety checks | `AcwrService`, `ReadinessService` | ~300 |
| `PlayerStatisticsService` | Player stats | `SupabaseService`, `ApiService` | ~500 |
| `StatisticsCalculationService` | Statistical calculations | `SupabaseService` | ~400 |
| `PerformanceMonitorService` | Performance monitoring | `LoggerService` | ~200 |

### Analytics & Data

| Service | Purpose | Dependencies | Lines |
|---------|---------|--------------|-------|
| `AnalyticsDataService` | Analytics data | `SupabaseService`, `ApiService` | ~600 |
| `TrendsService` | Trend analysis | `SupabaseService` | ~400 |
| `DashboardDataService` | Dashboard data | `SupabaseService`, `ApiService` | ~500 |
| `DataSourceService` | Data source abstraction | `SupabaseService` | ~300 |

### Team & Social

| Service | Purpose | Dependencies | Lines |
|---------|---------|--------------|-------|
| `TeamMembershipService` | Team membership | `SupabaseService`, `LoggerService` | ~470 |
| `TeamStatisticsService` | Team stats | `SupabaseService` | ~400 |
| `TeamNotificationService` | Team notifications | `SupabaseService` | ~300 |
| `PresenceService` | User presence | `SupabaseService`, `RealtimeService` | ~300 |
| `SharedInsightFeedService` | Community feed | `SupabaseService` | ~400 |

### Other Feature Services

| Service | Purpose | Dependencies | Lines |
|---------|---------|--------------|-------|
| `NutritionService` | Nutrition tracking | `SupabaseService`, `ApiService` | ~600 |
| `ExerciseDBService` | Exercise database | `HttpClient`, `LoggerService` | ~445 |
| `GameStatsService` | Game statistics | `SupabaseService`, `ApiService` | ~500 |
| `TournamentService` | Tournament management | `SupabaseService` | ~400 |
| `RosterService` | Roster management | `SupabaseService` | ~400 |
| `DepthChartService` | Depth chart | `SupabaseService` | ~300 |
| `AttendanceService` | Attendance tracking | `ApiService`, `AuthService`, `LoggerService` | ~300 |
| `EquipmentService` | Equipment management | `SupabaseService` | ~300 |
| `OfficialsService` | Officials management | `SupabaseService` | ~300 |
| `ReturnToPlayService` | RTP protocols | `SupabaseService` | ~400 |
| `WeatherService` | Weather integration | `HttpClient` | ~200 |
| `DataExportService` | Data export | `SupabaseService` | ~400 |

---

## Level 3+ Dependencies

### Composite/Facade Services

| Service | Purpose | Dependencies | Lines |
|---------|---------|--------------|-------|
| `UnifiedTrainingService` | Training facade | `AcwrService`, `ReadinessService`, `TrainingDataService`, `PerformanceDataService`, `WellnessService`, `ApiService`, `AuthService`, `LoggerService`, `PlayerProgramService`, `SupabaseService` | ~1,350 |
| `ContinuityIndicatorsService` | Continuity metrics | `SupabaseService`, `LoggerService`, `GameDayRecoveryService`, `AcwrSpikeDetectionService` | ~300 |
| `DataConfidenceService` | Data quality | `SupabaseService`, `LoggerService` | ~200 |
| `MissingDataDetectionService` | Missing data detection | `SupabaseService` | ~300 |
| `CalibrationLoggingService` | Calibration logging | `ApiService`, `LoggerService` | ~200 |

### Specialized Services

| Service | Purpose | Dependencies | Lines |
|---------|---------|--------------|-------|
| `SuperadminService` | Superadmin operations | `SupabaseService` | ~400 |
| `AdminService` | Admin operations | `SupabaseService` | ~300 |
| `AccountDeletionService` | Account deletion | `SupabaseService`, `AuthService`, `LoggerService`, `ToastService`, `Router` | ~300 |
| `ProfileCompletionService` | Profile completion | `SupabaseService` | ~300 |
| `SearchService` | Global search | `SupabaseService`, `ApiService` | ~590 |
| `AchievementsService` | Achievements | `HttpClient`, `LoggerService`, `ToastService` | ~400 |
| `BodyWeightLoadService` | Body weight tracking | `LoggerService` | ~300 |
| `DecisionLedgerService` | Decision tracking | `SupabaseService` | ~300 |
| `PlayerProgramService` | Player programs | `SupabaseService` | ~400 |
| `TournamentModeService` | Tournament mode | `SupabaseService` | ~300 |
| `TournamentRecoveryService` | Tournament recovery | `SupabaseService` | ~300 |

---

## Service Responsibilities

### Core Responsibilities by Category

#### Authentication & Authorization
- **`AuthService`**: User authentication, session management
- **`ContextService`**: User context, team context, role management
- **`PrivacySettingsService`**: Privacy controls, consent management

#### Data Access
- **`SupabaseService`**: Base Supabase client, auth state
- **`ApiService`**: HTTP client wrapper, API base URL management
- **`DirectSupabaseApiService`**: Direct database queries
- **`ResourceService`**: Angular 21 resource API for reactive data fetching

#### Training & Performance
- **`AcwrService`**: ACWR calculations (1,275 lines - core service)
- **`TrainingDataService`**: Training session data
- **`TrainingPlanService`**: Training plan management
- **`TrainingProgramService`**: Training program management
- **`UnifiedTrainingService`**: Facade for training operations

#### Wellness & Recovery
- **`ReadinessService`**: Readiness score calculations
- **`WellnessService`**: Wellness data management
- **`WellnessRecoveryService`**: Wellness tracking and recovery
- **`RecoveryService`**: Recovery protocols
- **`SleepDebtService`**: Sleep debt calculations

#### Analytics & Intelligence
- **`AnalyticsDataService`**: Analytics data aggregation
- **`TrendsService`**: Trend analysis
- **`DashboardDataService`**: Dashboard data aggregation
- **`AiService`**: AI/LLM integration
- **`AiChatService`**: AI Coach chat interface

#### Team Management
- **`TeamMembershipService`**: Team membership management
- **`TeamStatisticsService`**: Team statistics
- **`ChannelService`**: Team chat channels (1,270 lines)
- **`RosterService`**: Roster management
- **`DepthChartService`**: Depth chart management

---

## Circular Dependencies

### Analysis Status

**Status:** ✅ **ANALYZED - NO CIRCULAR DEPENDENCIES FOUND**

**Date Analyzed:** January 9, 2026

**Analysis Method:**
```bash
# Using madge tool
npx madge --circular angular/src/app/core/services/

# Result: ✔ No circular dependency found!
```

### Analysis Results

✅ **No circular dependencies detected** in the service layer.

All services follow a clean dependency hierarchy:
- Level 0 services have no dependencies
- Level 1 services depend only on Level 0
- Level 2 services depend on Level 0-1
- Level 3+ services aggregate lower-level services

### Services with Most Dependencies

Based on dependency analysis:

| Service | Dependencies | Level |
|---------|--------------|-------|
| `UnifiedTrainingService` | 14 services | Level 3+ |
| `AcwrAlertsService` | 9 services | Level 2 |
| `ChannelService` | 5 services | Level 2 |
| `EvidenceConfigService` | 5 services | Level 1 |
| `NotificationStateService` | 5 services | Level 2 |

### Dependency Health Metrics

- **Total Services Analyzed:** 141 files
- **Circular Dependencies:** 0 ✅
- **Average Dependencies per Service:** ~2-3
- **Max Dependencies:** 14 (`UnifiedTrainingService` - acceptable for facade pattern)
- **Services with 0 Dependencies:** ~10 (Level 0 foundation services)

### Best Practices Maintained

✅ **Clean Architecture:** Services follow dependency injection best practices  
✅ **No Circular Dependencies:** All dependencies flow in one direction  
✅ **Facade Pattern:** `UnifiedTrainingService` correctly aggregates multiple services  
✅ **Separation of Concerns:** Services have clear responsibilities

---

## Dependency Graph

### Visual Representation

```
┌─────────────────────────────────────────────────────────────┐
│                    Level 0: Foundation                      │
│  LoggerService, SupabaseService, ApiService, ThemeService  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Level 1: Core Business Logic                  │
│  AuthService, ContextService, EvidenceConfigService, etc.  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Level 2: Feature Services                     │
│  AcwrService, ReadinessService, TrainingDataService, etc.   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Level 3+: Composite Services                    │
│  UnifiedTrainingService, ContinuityIndicatorsService, etc. │
└─────────────────────────────────────────────────────────────┘
```

### Key Dependency Chains

#### ACWR Calculation Chain
```
EvidenceConfigService (Level 0)
  ↓
AcwrSpikeDetectionService (Level 1)
  ↓
AcwrService (Level 2)
  ↓
AcwrAlertsService (Level 2)
LoadMonitoringService (Level 2)
UnifiedTrainingService (Level 3)
```

#### Wellness Chain
```
SupabaseService (Level 0)
  ↓
WellnessService (Level 1)
RecoveryService (Level 1)
  ↓
ReadinessService (Level 2)
  ↓
WellnessRecoveryService (Level 2)
  ↓
UnifiedTrainingService (Level 3)
```

#### AI Coach Chain
```
ApiService (Level 0)
PrivacySettingsService (Level 1)
  ↓
AiService (Level 2)
  ↓
AiChatService (Level 2)
```

---

## Best Practices

### 1. Dependency Injection

✅ **DO:**
- Use `inject()` function for dependencies
- Keep dependencies explicit in constructor or `inject()` calls
- Document dependencies in JSDoc comments

```typescript
@Injectable({
  providedIn: "root",
})
export class MyService {
  private supabase = inject(SupabaseService);
  private logger = inject(LoggerService);
  
  // ...
}
```

❌ **DON'T:**
- Create circular dependencies
- Inject services that aren't needed
- Use global singletons unnecessarily

### 2. Service Organization

✅ **DO:**
- Keep services focused on single responsibility
- Use facade services (`UnifiedTrainingService`) to aggregate related services
- Document service purpose and dependencies

❌ **DON'T:**
- Create god services (services that do everything)
- Duplicate functionality across services
- Create unnecessary abstraction layers

### 3. Dependency Management

✅ **DO:**
- Keep dependency chains shallow (prefer Level 0-2)
- Use dependency injection for testability
- Document service dependencies

❌ **DON'T:**
- Create deep dependency chains (Level 4+)
- Create circular dependencies
- Hard-code service dependencies

### 4. Testing

✅ **DO:**
- Mock dependencies in unit tests
- Test services in isolation
- Use Angular testing utilities

❌ **DON'T:**
- Test multiple services together (use integration tests for that)
- Create real service instances in unit tests
- Skip dependency mocking

---

## Service Usage Patterns

### Pattern 1: Facade Service

`UnifiedTrainingService` aggregates multiple services:

```typescript
export class UnifiedTrainingService {
  private acwrService = inject(AcwrService);
  private readinessService = inject(ReadinessService);
  private trainingDataService = inject(TrainingDataService);
  // ... more services
  
  // Expose unified API
  readonly acwrRatio = this.acwrService.acwrRatio;
  readonly readinessScore = this.readinessService.readinessScore;
}
```

**Use Case:** When components need data from multiple related services.

### Pattern 2: Direct Service Access

Components inject services directly:

```typescript
export class DashboardComponent {
  private acwrService = inject(AcwrService);
  private readinessService = inject(ReadinessService);
}
```

**Use Case:** When components need specific service functionality.

### Pattern 3: Service Composition

Services compose other services:

```typescript
export class AcwrService {
  private evidenceConfigService = inject(EvidenceConfigService);
  private acwrSpikeDetection = inject(AcwrSpikeDetectionService);
  
  // Use composed services
  calculateACWR() {
    const config = this.evidenceConfigService.getACWRConfig();
    // ...
  }
}
```

**Use Case:** When services need functionality from other services.

---

## Maintenance Guidelines

### Adding a New Service

1. **Determine Dependency Level**
   - Level 0: No service dependencies
   - Level 1: Depends only on Level 0
   - Level 2: Depends on Level 0-1
   - Level 3+: Aggregates multiple services

2. **Document Dependencies**
   - List all injected services
   - Document service purpose
   - Add to this document

3. **Check for Circular Dependencies**
   - Run `madge --circular` after adding service
   - Refactor if circular dependencies found

4. **Update Tests**
   - Create unit tests with mocked dependencies
   - Test service in isolation

### Refactoring Services

1. **Identify Dependencies**
   - List all service dependencies
   - Check dependency levels
   - Identify circular dependencies

2. **Plan Refactoring**
   - Break circular dependencies
   - Extract shared functionality
   - Consolidate duplicate services

3. **Update Documentation**
   - Update this document
   - Update service JSDoc comments
   - Update component documentation

---

## Related Documentation

- [Audits Summary](./AUDITS.md) - Consolidated audit reports summary
- [Feature Documentation](./FEATURE_DOCUMENTATION.md) - Complete feature reference
- [API Documentation](./API.md) - API endpoint documentation
- [Feature Documentation](./FEATURE_DOCUMENTATION.md) - Feature business logic

---

## Tools for Dependency Analysis

### madge

```bash
# Install
npm install -g madge

# Check circular dependencies
madge --circular angular/src/app/core/services/

# Generate dependency graph
madge --image services-graph.png angular/src/app/core/services/

# Generate JSON output
madge --json angular/src/app/core/services/ > services-deps.json
```

### Angular Dependency Injection

```bash
# Find all inject() calls
grep -r "inject(" angular/src/app/core/services/

# Find all constructor dependencies
grep -r "constructor" angular/src/app/core/services/ | grep -v "//"
```

---

## Dependency Analysis Results

### Analysis Date: January 9, 2026

**Tools Used:**
- `madge` - Dependency analysis tool
- Command: `npx madge --circular angular/src/app/core/services/`

**Results:**
- ✅ **No circular dependencies found**
- ✅ **141 service files analyzed**
- ✅ **Dependency JSON generated:** `docs/services-deps.json`

**Top Services by Dependency Count:**
1. `UnifiedTrainingService` - 14 dependencies (Level 3+ facade)
2. `AcwrAlertsService` - 9 dependencies (Level 2)
3. `ChannelService` - 5 dependencies (Level 2)
4. `EvidenceConfigService` - 5 dependencies (Level 1)
5. `NotificationStateService` - 5 dependencies (Level 2)

**Health Metrics:**
- Average dependencies per service: ~2-3
- Services with 0 dependencies: ~10 (Level 0 foundation)
- Max dependencies: 14 (acceptable for facade pattern)
- Circular dependencies: 0 ✅

---

**Last Updated:** January 9, 2026  
**Next Review:** February 9, 2026  
**Maintainer:** Development Team
