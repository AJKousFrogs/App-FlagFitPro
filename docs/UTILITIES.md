# FlagFit Pro - Utilities & Services API Reference

**Version:** 2.0.0  
**Last Updated:** 29. December 2025  
**Status:** ✅ Production Ready

## Table of Contents

1. [Overview](#overview)
2. [Angular Services Architecture](#angular-services-architecture)
3. [ACWR Service](#acwr-service)
4. [AI Chat Service](#ai-chat-service)
5. [State Management](#state-management)
6. [Error Handling](#error-handling)
7. [Validation Services](#validation-services)
8. [Legacy Utilities](#legacy-utilities)

---

## Overview

FlagFit Pro uses a modern Angular 21 architecture with signal-based state management. This document covers both the Angular services and legacy vanilla JS utilities.

### Architecture Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **State Management** | Angular Signals + Computed | Reactive UI state |
| **Data Fetching** | RxJS Observables | API calls, real-time subscriptions |
| **Backend** | Netlify Functions | Serverless API endpoints |
| **Database** | Supabase PostgreSQL | Data persistence, RLS security |
| **AI** | Groq LLM (FREE tier) | AI coaching with safety tiers |

---

## Angular Services Architecture

### Core Services Location

```
angular/src/app/core/services/
├── acwr.service.ts              # ACWR calculations (1,273 lines)
├── acwr-alerts.service.ts       # ACWR alert management
├── ai-chat.service.ts           # AI coaching chat
├── api.service.ts               # Centralized HTTP client
├── auth.service.ts              # Authentication
├── evidence-config.service.ts   # Evidence-based configuration
├── load-monitoring.service.ts   # Training load tracking
├── notification-state.service.ts # Notification state (signals)
├── realtime.service.ts          # Supabase realtime subscriptions
├── supabase.service.ts          # Supabase client
├── toast.service.ts             # Toast notifications
├── validation.service.ts        # Data validation
└── wellness.service.ts          # Wellness tracking
```

### View Models Pattern

```
angular/src/app/core/view-models/
├── base.view-model.ts           # Base class with signals
├── reactive.view-model.ts       # RxJS integration
├── dashboard.view-model.ts      # Dashboard state
└── analytics.view-model.ts      # Analytics state
```

---

## ACWR Service

**File:** `angular/src/app/core/services/acwr.service.ts`  
**Lines:** 1,273  
**Status:** ✅ Production Ready

The ACWR (Acute:Chronic Workload Ratio) service implements evidence-based injury prevention using the EWMA (Exponentially Weighted Moving Average) model.

### Key Features

- **Evidence-Based Thresholds**: Based on Gabbett (2016) research
- **EWMA Calculation**: More accurate than rolling averages
- **Data Quality Assessment**: Warns when insufficient data
- **Tolerance Detection**: Identifies athletes who train above thresholds without issues
- **Real-time Updates**: Supabase realtime subscriptions

### Risk Zones (Gabbett 2016)

| ACWR Range | Zone | Color | Injury Risk |
|------------|------|-------|-------------|
| < 0.80 | Under-training | Orange | Detraining risk |
| 0.80 - 1.30 | Sweet Spot | Green | Lowest risk |
| 1.30 - 1.50 | Elevated | Yellow | Monitor closely |
| > 1.50 | Danger Zone | Red | High injury risk |

### Usage

```typescript
import { AcwrService } from '@core/services/acwr.service';

@Component({...})
export class DashboardComponent {
  private acwrService = inject(AcwrService);
  
  // Reactive signals
  acwrRatio = this.acwrService.acwrRatio;
  riskZone = this.acwrService.riskZone;
  dataQuality = this.acwrService.dataQuality;
  
  // Check if high-intensity training is safe
  canTrainHard = computed(() => 
    this.acwrRatio() <= 1.5 && this.riskZone().level !== 'danger-zone'
  );
}
```

### Configuration

```typescript
interface ACWRConfig {
  acuteWindowDays: number;      // Default: 7
  chronicWindowDays: number;    // Default: 28
  acuteLambda: number;          // Default: 0.2 (EWMA decay)
  chronicLambda: number;        // Default: 0.05
  thresholds: {
    sweetSpotLow: number;       // Default: 0.8
    sweetSpotHigh: number;      // Default: 1.3
    dangerHigh: number;         // Default: 1.5
    maxWeeklyIncreasePercent: number; // Default: 10%
  };
  minChronicLoad: number;       // Default: 50 AU
  minDaysForChronic: number;    // Default: 21 days
  minSessionsForChronic: number; // Default: 12 sessions
}
```

### Methods

#### `calculateACWR(sessions: TrainingSession[]): ACWRData`

Calculates ACWR from training sessions.

```typescript
const acwrData = this.acwrService.calculateACWR(sessions);
// Returns: { acute, chronic, ratio, riskZone, weeklyProgression, dataQuality }
```

#### `getRecommendation(): LoadRecommendation`

Gets training load recommendation based on current ACWR.

```typescript
const recommendation = this.acwrService.getRecommendation();
// Returns: { action: 'maintain' | 'increase' | 'decrease', reason, suggestedLoad }
```

#### `shouldBlockHighIntensity(): boolean`

Checks if high-intensity training should be blocked.

```typescript
if (this.acwrService.shouldBlockHighIntensity()) {
  this.showRecoveryRecommendations();
}
```

---

## AI Chat Service

**File:** `angular/src/app/core/services/ai-chat.service.ts`  
**Status:** ✅ Production Ready with ACWR Safety Integration

### Safety Tier System

| Tier | Risk Level | Example Topics | AI Behavior |
|------|------------|----------------|-------------|
| 1 | Low | Technique, warm-ups, drills | Full guidance |
| 2 | Medium | Injury prevention, recovery | With disclaimers |
| 3 | High | Supplements, medical dosing | Strong disclaimers, no dosing |
| **ACWR Override** | High | High-intensity when ACWR > 1.5 | **Blocks recommendation** |

### Usage

```typescript
import { AiChatService } from '@core/services/ai-chat.service';

@Component({...})
export class ChatComponent {
  private chatService = inject(AiChatService);
  
  loading = this.chatService.loading;
  messages = this.chatService.messages;
  
  sendMessage(text: string) {
    this.chatService.sendMessage({
      message: text,
      session_id: this.sessionId,
    }).subscribe(response => {
      // Check if ACWR blocked the recommendation
      if (response.acwr_safety?.blocked) {
        this.showSafetyWarning(response.acwr_safety.reason);
      }
    });
  }
}
```

### Response Interface

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  riskLevel?: 'low' | 'medium' | 'high';
  disclaimer?: string;
  citations?: Citation[];
  suggestedActions?: SuggestedAction[];
  metadata?: {
    source?: string;
    model?: string;
    acwr?: {
      ratio: number;
      riskZone: string;
      canRecommendHighIntensity: boolean;
    };
  };
}
```

---

## State Management

FlagFit Pro uses **Angular Signals** for state management, NOT NgRx. This is a deliberate architectural choice for simplicity and performance.

### Signal-Based Services

#### NotificationStateService

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationStateService {
  // State signals
  private readonly notifications = signal<Notification[]>([]);
  private readonly loading = signal<boolean>(false);
  private readonly error = signal<string | null>(null);
  
  // Computed signals (derived state)
  readonly unreadCount = computed(() => 
    this.notifications().filter(n => !n.read).length
  );
  
  readonly unreadNotifications = computed(() =>
    this.notifications().filter(n => !n.read)
  );
  
  // Combined state for components
  readonly state = computed<NotificationState>(() => ({
    notifications: this.notifications(),
    unreadCount: this.unreadCount(),
    loading: this.loading(),
    error: this.error(),
  }));
}
```

#### SupabaseService (Auth State)

```typescript
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  // UI State: Signals instead of BehaviorSubject
  private readonly _currentUser = signal<User | null>(null);
  private readonly _session = signal<Session | null>(null);
  
  // Public readonly signals
  readonly currentUser = this._currentUser.asReadonly();
  readonly session = this._session.asReadonly();
  
  // Computed signals for derived state
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userId = computed(() => this._currentUser()?.id ?? null);
}
```

### ViewModel Pattern

For complex components, use the ViewModel pattern:

```typescript
@Injectable()
export abstract class BaseViewModel {
  protected destroyRef = inject(DestroyRef);
  protected logger = inject(LoggerService);
  
  // Common state signals
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Subscribe helper with automatic cleanup
  protected subscribe<T>(
    observable: Observable<T>,
    callbacks: {
      next?: (value: T) => void;
      error?: (error: unknown) => void;
    }
  ): void {
    observable.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(callbacks);
  }
  
  // Consistent error handling
  protected handleError(error: unknown): void {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An error occurred';
    this.error.set(errorMessage);
    this.logger.error('[ViewModel Error]', error);
  }
}
```

---

## Error Handling

### HTTP Error Interceptor

**File:** `angular/src/app/core/interceptors/error.interceptor.ts`

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout().subscribe();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        router.navigate(['/dashboard']);
      }
      return throwError(() => error);
    })
  );
};
```

### API Service Error Handling

```typescript
private handleError = (error: unknown): Observable<never> => {
  let errorMessage = 'An unknown error occurred';

  if (error instanceof ErrorEvent) {
    errorMessage = `Error: ${error.message}`;
  } else if (error && typeof error === 'object' && 'error' in error) {
    const httpError = error as HttpErrorResponse;
    errorMessage = httpError.error?.error 
      || httpError.error?.message 
      || `Error Code: ${httpError.status}`;
  }

  this.logger.error(`[ApiService] API request failed: ${errorMessage}`);
  return throwError(() => new Error(errorMessage));
};
```

### Form Submit Handler

**File:** `angular/src/app/shared/utils/form-submit.utils.ts`

```typescript
export class FormSubmitHandler {
  private _isSubmitting = signal(false);
  readonly isSubmitting = this._isSubmitting.asReadonly();

  async handle<T>(options: FormSubmitOptions<T>): Promise<T | undefined> {
    const { form, apiCall, successMessage, errorMessage, onSuccess, onError } = options;

    if (form.invalid) {
      this.markFormGroupTouched(form);
      return undefined;
    }

    this._isSubmitting.set(true);

    try {
      const result = await firstValueFrom(apiCall());
      
      if (successMessage) {
        this.toastService.success(successMessage);
      }
      
      onSuccess?.(result);
      return result;
    } catch (error) {
      const message = errorMessage || this.extractErrorMessage(error);
      this.toastService.error(message);
      onError?.(error as Error);
      return undefined;
    } finally {
      this._isSubmitting.set(false);
    }
  }
}
```

---

## Validation Services

### Angular ValidationService

**File:** `angular/src/app/core/services/validation.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class ValidationService {
  /**
   * Physical measurements validation with medical guidelines
   */
  validateWeight(weight: number): ValidationResult {
    if (weight < 40) {
      return {
        valid: false,
        message: 'Weight below viable minimum (40kg). Medical evaluation needed.',
      };
    }
    // ... more validation
  }

  validateBodyFat(percentage: number): ValidationResult {
    if (percentage < 3) {
      return {
        valid: false,
        message: 'Body fat below minimum viable level (3%). Medical evaluation needed.',
      };
    }
    // ... more validation
  }
}
```

---

## Legacy Utilities

The following utilities are from the original vanilla JS implementation and are maintained for reference. **For new development, use Angular services.**

### Sanitization Utilities

**File:** `src/js/utils/sanitize.js`

#### `escapeHtml(str)`

Escapes HTML special characters to prevent XSS attacks.

```javascript
import { escapeHtml } from './utils/sanitize.js';

const userInput = '<script>alert("XSS")</script>';
const safe = escapeHtml(userInput);
// Result: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
```

#### `sanitizeUrl(url)`

Sanitizes URLs to prevent XSS via href/src attributes.

```javascript
import { sanitizeUrl } from './utils/sanitize.js';

const safe = sanitizeUrl('https://example.com'); // Allowed
const blocked = sanitizeUrl('javascript:alert(1)'); // Returns ''
```

**Allowed Protocols:** `https://`, `http://`, `mailto:`, `tel:`, `sms:`

### CSRF Protection

**File:** `src/js/security/csrf-protection.js`

```javascript
import csrfProtection from './security/csrf-protection.js';

// Get token for API calls
const headers = {
  'Content-Type': 'application/json',
  ...csrfProtection.getHeaders(),
};

fetch('/api/data', { method: 'POST', headers, body: JSON.stringify(data) });
```

### Cache Service

**File:** `src/js/services/cache-service.js`

```javascript
import cacheService from './services/cache-service.js';
import { NETWORK } from './config/app-constants.js';

// Set with TTL
cacheService.set('api_response', data, {
  ttl: NETWORK.CACHE_DURATION_SHORT, // 5 minutes
});

// Get (returns null if expired)
const cached = cacheService.get('api_response');

// Invalidate pattern
cacheService.invalidatePattern(/^user_/);
```

### Application Constants

**File:** `src/js/config/app-constants.js`

```javascript
export const NETWORK = {
  API_TIMEOUT: 30000,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CACHE_DURATION_SHORT: 5 * 60 * 1000,   // 5 minutes
  CACHE_DURATION_MEDIUM: 15 * 60 * 1000, // 15 minutes
  CACHE_DURATION_LONG: 60 * 60 * 1000,   // 1 hour
};

export const WELLNESS = {
  MIN_RATING: 1,
  MAX_RATING: 10,
  RECOMMENDED_SLEEP_MIN: 7,
  RECOMMENDED_SLEEP_MAX: 9,
  LOW_ENERGY_THRESHOLD: 3,
  HIGH_STRESS_THRESHOLD: 7,
};
```

---

## API Endpoints Reference

### Training & Load Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/training-stats` | GET | Training statistics |
| `/api/training-stats-enhanced` | GET | Enhanced stats with ACWR |
| `/api/load-management/acwr` | GET | ACWR calculation |
| `/api/load-management/monotony` | GET | Training monotony |
| `/api/load-management/tsb` | GET | Training stress balance |
| `/api/load-management/injury-risk` | GET | Combined injury risk score |
| `/api/calc-readiness` | GET | Readiness score |

### AI Coaching

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/chat` | POST | Send message to AI coach |
| `/api/ai/chat/session/:id` | GET | Load chat session |
| `/api/ai/feedback` | POST | Submit AI feedback |

### Smart Recommendations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/smart-training-recommendations` | GET | AI-powered training plan |
| `/api/training-plan` | GET | Periodized training plan |

---

## Version History

**2.0.0** (December 26, 2025)
- Added ACWR safety integration to AI coaching
- Updated documentation to reflect Angular 21 architecture
- Added signal-based state management documentation
- Documented ViewModel pattern

**1.0.0** (November 2025)
- Initial release
- Legacy utilities documented

---

## Support

For questions or issues:

- [Developer Guide](./DEVELOPMENT.md)
- [Security Documentation](./SECURITY.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [AI Coaching System](./AI_COACHING_SYSTEM_REVAMP.md)

---

**Last Updated:** 29. December 2025
