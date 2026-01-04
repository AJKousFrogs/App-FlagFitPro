# 🏗️ FlagFit Pro - System Architecture

**Version:** 2.2  
**Last Updated:** 29. December 2025  
**Last Verified Against Codebase:** 2025-12-28  
**Status:** ✅ Production Ready (~85% Complete)

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Angular Frontend Architecture](#angular-frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Database Architecture](#database-architecture)
6. [AI Safety Architecture](#ai-safety-architecture)
7. [State Management](#state-management)
8. [Security Architecture](#security-architecture)
9. [Deployment Architecture](#deployment-architecture)

---

## 🎯 System Overview

### Mission Statement

A comprehensive flag football training platform that prioritizes **athlete safety**, **performance tracking**, and **AI-powered coaching** through modern web technologies and sports science research.

### Core Principles

- **Safety First**: ACWR monitoring, AI safety tiers, injury prevention
- **Evidence-Based**: 120+ peer-reviewed studies integrated
- **Real-Time**: Supabase subscriptions for live updates
- **Modern Stack**: Angular 21 signals, zoneless change detection
- **Scalable**: Serverless backend, managed database

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Angular 21 Frontend                                     │   │
│  │  ├── 28+ Feature Components (standalone)                 │   │
│  │  ├── 86+ Core Services (signal-based)                    │   │
│  │  ├── PrimeNG 21 UI Components                           │   │
│  │  ├── Zoneless Change Detection                          │   │
│  │  └── SCSS Design System                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Netlify Functions (80 serverless functions)             │   │
│  │  ├── AI Chat with ACWR Safety Integration               │   │
│  │  ├── Load Management (ACWR, Monotony, TSB)              │   │
│  │  ├── Smart Training Recommendations                      │   │
│  │  ├── Authentication & Authorization                      │   │
│  │  └── Rate Limiting & Error Handling                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Supabase PostgreSQL                                     │   │
│  │  ├── 55+ Migration Files                                │   │
│  │  ├── Row Level Security (RLS) Policies                  │   │
│  │  ├── Real-time Subscriptions                            │   │
│  │  ├── Knowledge Base with Evidence Grading               │   │
│  │  └── AI Chat Sessions & Recommendations                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                             │
│  ├── Groq LLM (FREE 14,400 req/day)                            │
│  ├── Open-Meteo Weather API (FREE, no key required)            │
│  └── Supabase Auth (OAuth providers)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🅰️ Angular Frontend Architecture

### Directory Structure

```
angular/src/app/
├── core/                           # Singleton services & utilities
│   ├── services/                   # 86+ injectable services
│   │   ├── acwr.service.ts         # 1,273 lines - ACWR calculations
│   │   ├── acwr-alerts.service.ts  # Load alert management
│   │   ├── ai-chat.service.ts      # AI coaching chat
│   │   ├── api.service.ts          # HTTP client + endpoints
│   │   ├── auth.service.ts         # Authentication
│   │   ├── supabase.service.ts     # Supabase client
│   │   ├── notification-state.service.ts  # Signal-based state
│   │   ├── wellness.service.ts     # Wellness tracking
│   │   └── ... (75+ more)
│   ├── guards/                     # Route guards
│   │   ├── auth.guard.ts
│   │   └── role.guard.ts
│   ├── interceptors/               # HTTP interceptors
│   │   ├── auth.interceptor.ts
│   │   ├── cache.interceptor.ts
│   │   └── error.interceptor.ts
│   ├── view-models/                # Signal-based ViewModels
│   │   ├── base.view-model.ts
│   │   ├── reactive.view-model.ts
│   │   ├── dashboard.view-model.ts
│   │   └── analytics.view-model.ts
│   └── models/                     # TypeScript interfaces
│       ├── acwr.models.ts
│       └── ...
├── features/                       # Feature modules (28+)
│   ├── acwr-dashboard/             # ACWR monitoring UI
│   ├── training/                   # 10 training components
│   │   ├── training.component.ts
│   │   ├── ai-training-scheduler/
│   │   ├── smart-training-form/
│   │   ├── qb-throwing-tracker/
│   │   └── ...
│   ├── analytics/                  # Performance analytics
│   ├── dashboard/                  # Dashboard variants
│   ├── wellness/                   # Wellness tracking
│   ├── game-tracker/               # Game statistics
│   ├── tournaments/                # Tournament management
│   ├── auth/                       # Authentication
│   └── ... (18+ more)
└── shared/                         # Shared components
    ├── components/
    │   ├── ai-coach-visibility/    # Coach AI monitoring
    │   ├── ai-feedback/            # AI feedback UI
    │   ├── traffic-light-risk/     # ACWR visualization
    │   ├── progressive-stats/      # Stats display
    │   └── ...
    └── utils/
        ├── form.utils.ts
        ├── form-submit.utils.ts
        └── status.utils.ts
```

### Key Services

| Service                                 | Lines | Purpose                                                       |
| --------------------------------------- | ----- | ------------------------------------------------------------- |
| `acwr.service.ts`                       | 1,273 | EWMA-based ACWR calculations, risk zones, tolerance detection |
| `acwr-alerts.service.ts`                | 434   | Alert generation, danger zone detection                       |
| `ai-chat.service.ts`                    | 270   | AI coaching with safety tiers                                 |
| `wellness.service.ts`                   | 582   | Sleep, mood, stress tracking                                  |
| `nutrition.service.ts`                  | 713   | Macro/micro tracking, meal plans                              |
| `notification-state.service.ts`         | 394   | Signal-based notification state                               |
| `training-stats-calculation.service.ts` | 363   | Volume, intensity, ACWR calculations                          |

### Component Architecture

All components use:

- **Standalone**: `standalone: true` (no NgModules)
- **OnPush**: `changeDetection: ChangeDetectionStrategy.OnPush`
- **Signals**: `signal()`, `computed()`, `effect()`
- **inject()**: Functional dependency injection

```typescript
@Component({
  selector: 'app-acwr-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, ChartModule, ...],
  template: `...`
})
export class AcwrDashboardComponent {
  private acwrService = inject(AcwrService);

  // Reactive signals
  acwrRatio = this.acwrService.acwrRatio;
  riskZone = this.acwrService.riskZone;

  // Computed signals
  canTrainHard = computed(() =>
    this.acwrRatio() <= 1.5 && this.riskZone().level !== 'danger-zone'
  );
}
```

---

## ⚙️ Backend Architecture

### Netlify Functions Structure

```
netlify/functions/
├── ai-chat.cjs                     # AI coaching with ACWR safety
├── utils/
│   ├── ai-safety-classifier.cjs    # 3-tier risk classification
│   ├── groq-client.cjs             # Groq LLM integration
│   ├── base-handler.cjs            # Standardized handler pattern
│   └── error-handler.cjs           # Error response utilities
├── load-management.cjs             # ACWR, monotony, TSB
├── training-plan.cjs               # Periodized training
├── smart-training-recommendations.cjs
├── calc-readiness.cjs              # Readiness score
├── training-stats-enhanced.cjs     # Enhanced statistics
├── coach.cjs                       # Coach endpoints
├── knowledge-search.cjs            # Knowledge base search
└── ... (80 total functions)
```

### Base Handler Pattern

All functions use standardized `baseHandler`:

```javascript
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "ai-chat",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      // Function logic
    },
  });
};
```

### API Endpoints

| Category            | Endpoints                                        | Description         |
| ------------------- | ------------------------------------------------ | ------------------- |
| **AI Coaching**     | `/api/ai/chat`, `/api/ai/feedback`               | AI chat with safety |
| **Load Management** | `/api/load-management/acwr`, `/monotony`, `/tsb` | ACWR calculations   |
| **Training**        | `/api/training-stats`, `/training-plan`          | Training data       |
| **Readiness**       | `/api/calc-readiness`, `/readiness-history`      | Readiness scores    |
| **Recommendations** | `/api/smart-training-recommendations`            | AI recommendations  |

---

## 🗄️ Database Architecture

### Supabase PostgreSQL Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                     CORE TABLES                                 │
├─────────────────────────────────────────────────────────────────┤
│  users                    │  User accounts & profiles           │
│  user_profiles            │  Extended profile data              │
│  teams                    │  Team management                    │
│  team_members             │  Team membership                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   TRAINING TABLES                               │
├─────────────────────────────────────────────────────────────────┤
│  training_sessions        │  Session logs with RPE              │
│  training_programs        │  Periodized programs                │
│  training_phases          │  Mesocycle phases                   │
│  training_weeks           │  Weekly planning                    │
│  exercises                │  Exercise library                   │
│  workout_logs             │  Detailed workout data              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  AI COACHING TABLES                             │
├─────────────────────────────────────────────────────────────────┤
│  ai_chat_sessions         │  Chat session management            │
│  ai_messages              │  Chat messages with metadata        │
│  ai_recommendations       │  AI recommendation tracking         │
│  ai_feedback              │  User feedback on AI                │
│  ai_coach_visibility      │  Coach monitoring of AI             │
│  knowledge_base_entries   │  Curated knowledge with evidence    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   ANALYTICS TABLES                              │
├─────────────────────────────────────────────────────────────────┤
│  load_monitoring          │  Daily load tracking                │
│  wellness_entries         │  Sleep, mood, stress                │
│  injuries                 │  Injury tracking                    │
│  game_stats               │  Game performance                   │
│  position_specific_metrics│  Position-based metrics             │
└─────────────────────────────────────────────────────────────────┘
```

### Row Level Security (RLS)

All tables have RLS policies:

```sql
-- Users can only access their own data
CREATE POLICY "Users can view own data" ON training_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Coaches can view team member data
CREATE POLICY "Coaches can view team data" ON training_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = training_sessions.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'coach'
    )
  );
```

---

## 🛡️ AI Safety Architecture

### Safety Tier Classification

```
┌─────────────────────────────────────────────────────────────────┐
│                 AI SAFETY PIPELINE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. KEYWORD CLASSIFICATION                                      │
│     ├── Tier 1 (Low): technique, warm-up, drills               │
│     ├── Tier 2 (Medium): injury, recovery, pain                │
│     └── Tier 3 (High): supplements, dosage, medical            │
│                                                                 │
│  2. ACWR SAFETY OVERRIDE (NEW in v2.0)                         │
│     ├── Calculate user's current ACWR                          │
│     ├── Detect high-intensity keywords in query                │
│     └── Block if ACWR > 1.5 AND high-intensity query           │
│                                                                 │
│  3. RESPONSE GENERATION                                         │
│     ├── Groq LLM (Llama 3.1 70B)                               │
│     ├── Knowledge base fallback                                │
│     └── Safety-filtered content                                │
│                                                                 │
│  4. DISCLAIMER INJECTION                                        │
│     ├── Low: None                                              │
│     ├── Medium: "Consult healthcare professional"              │
│     └── High: Full medical disclaimer                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### ACWR Thresholds (Gabbett 2016)

| ACWR Range  | Risk Zone      | AI Behavior                       |
| ----------- | -------------- | --------------------------------- |
| < 0.80      | Under-training | ✅ Can recommend more training    |
| 0.80 - 1.30 | Sweet Spot     | ✅ All recommendations allowed    |
| 1.30 - 1.50 | Elevated       | ✅ Allowed with monitoring advice |
| > 1.50      | Danger         | ⛔ **BLOCKS high-intensity**      |
| > 1.80      | Critical       | ⛔ **Recommends rest only**       |

### High-Intensity Keywords Detected

```javascript
const HIGH_INTENSITY_KEYWORDS = [
  "sprint",
  "explosive",
  "plyometric",
  "max effort",
  "high intensity",
  "hiit",
  "power",
  "speed work",
  "all out",
  "100%",
  "full speed",
  "intense",
  "heavy",
  "max weight",
  "1rm",
  "pr attempt",
];
```

---

## 📊 State Management

### Signal-Based Architecture

FlagFit Pro uses **Angular Signals** (not NgRx):

```typescript
// Service with signals
@Injectable({ providedIn: "root" })
export class NotificationStateService {
  // State signals
  private readonly notifications = signal<Notification[]>([]);
  private readonly loading = signal<boolean>(false);

  // Computed signals (derived state)
  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.read).length,
  );

  // Combined state
  readonly state = computed<NotificationState>(() => ({
    notifications: this.notifications(),
    unreadCount: this.unreadCount(),
    loading: this.loading(),
  }));
}
```

### ViewModel Pattern

```typescript
@Injectable()
export abstract class BaseViewModel {
  protected destroyRef = inject(DestroyRef);

  // Common state
  loading = signal(false);
  error = signal<string | null>(null);

  // RxJS → Signal bridge
  protected subscribe<T>(
    observable: Observable<T>,
    callbacks: { next?: (v: T) => void; error?: (e: unknown) => void },
  ): void {
    observable.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(callbacks);
  }
}
```

---

## 🔒 Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTEND                                                       │
│  ├── Angular Guards (auth.guard, role.guard)                   │
│  ├── HTTP Interceptors (auth, error)                           │
│  └── Input sanitization                                        │
│                                                                 │
│  BACKEND                                                        │
│  ├── JWT verification                                          │
│  ├── Rate limiting (5-10 req/5min for algorithms)              │
│  ├── Input validation middleware                               │
│  └── Error handling with request IDs                           │
│                                                                 │
│  DATABASE                                                       │
│  ├── Row Level Security (RLS) policies                         │
│  ├── Supabase Auth integration                                 │
│  └── Encrypted connections (SSL/TLS)                           │
│                                                                 │
│  AI SAFETY                                                      │
│  ├── 3-tier risk classification                                │
│  ├── ACWR safety override                                      │
│  └── Content filtering                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NETLIFY                                      │
│  ├── Angular SPA (dist/)                                       │
│  ├── Serverless Functions (netlify/functions/)                 │
│  ├── Edge Functions (optional)                                 │
│  └── CDN Distribution                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE                                      │
│  ├── PostgreSQL Database                                       │
│  ├── Auth Service                                              │
│  ├── Real-time Subscriptions                                   │
│  └── Storage (optional)                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL APIS                                  │
│  ├── Groq LLM (FREE 14,400 req/day)                            │
│  └── Open-Meteo (FREE, no API key required)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📚 Related Documentation

- [FEATURE_DOCUMENTATION.md](./FEATURE_DOCUMENTATION.md) - Complete feature & business logic guide
- [ANGULAR_PRIMENG_GUIDE.md](./ANGULAR_PRIMENG_GUIDE.md) - Angular 21 + PrimeNG 21 patterns
- [API.md](./API.md) - API reference
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database schema
- [SECURITY.md](./SECURITY.md) - Security architecture
- [AI_GOVERNANCE.md](./AI_GOVERNANCE.md) - AI safety documentation

---

**Last Updated:** January 2026
