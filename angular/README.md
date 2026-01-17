# FlagFit Pro - Angular 21 Application

**Version:** 2.0  
**Last Updated:** 29. December 2025  
**Status:** ✅ ~90% Production Ready

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Angular CLI 21

### Installation

```bash
# Install Angular CLI globally
npm install -g @angular/cli@21

# Navigate to angular directory
cd angular

# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:4200`

---

## 📊 Project Statistics

| Metric                       | Count       |
| ---------------------------- | ----------- |
| **Core Services**            | 45+         |
| **Feature Components**       | 25+         |
| **Shared Components**        | 15+         |
| **Lines of Code (Services)** | 10,000+     |
| **ACWR Service**             | 1,273 lines |

---

## 📁 Project Structure

```
angular/src/app/
├── core/                           # Singleton services & utilities
│   ├── services/                   # 45+ injectable services
│   │   ├── acwr.service.ts         # 1,273 lines - ACWR calculations
│   │   ├── acwr-alerts.service.ts  # Load alert management
│   │   ├── ai-chat.service.ts      # AI coaching chat
│   │   ├── api.service.ts          # HTTP client + 335 lines
│   │   ├── auth.service.ts         # Authentication
│   │   ├── supabase.service.ts     # Supabase client
│   │   ├── notification-state.service.ts  # Signal-based state
│   │   ├── wellness.service.ts     # 582 lines
│   │   ├── nutrition.service.ts    # 713 lines
│   │   └── ... (35+ more)
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── role.guard.ts
│   ├── interceptors/
│   │   ├── auth.interceptor.ts
│   │   ├── cache.interceptor.ts
│   │   └── error.interceptor.ts
│   ├── view-models/
│   │   ├── base.view-model.ts
│   │   ├── reactive.view-model.ts
│   │   ├── dashboard.view-model.ts
│   │   └── analytics.view-model.ts
│   └── models/
│       ├── acwr.models.ts
│       └── ...
├── features/                       # Feature modules (25+)
│   ├── acwr-dashboard/             # ✅ ACWR monitoring UI
│   ├── training/                   # ✅ 10 training components
│   │   ├── training.component.ts
│   │   ├── ai-training-scheduler/
│   │   ├── smart-training-form/
│   │   ├── qb-throwing-tracker/
│   │   ├── goal-based-planner.component.ts
│   │   └── ...
│   ├── analytics/                  # ✅ Performance analytics
│   │   ├── analytics.component.ts
│   │   └── enhanced-analytics/
│   ├── dashboard/                  # ✅ Dashboard variants
│   │   ├── dashboard.component.ts
│   │   ├── athlete-dashboard.component.ts
│   │   └── coach-dashboard.component.ts
│   ├── wellness/                   # ✅ Wellness tracking
│   ├── game-tracker/               # ✅ Game statistics
│   │   ├── game-tracker.component.ts
│   │   └── live-game-tracker.component.ts
│   ├── tournaments/                # ✅ Tournament management
│   ├── auth/                       # ✅ Authentication
│   │   ├── login/
│   │   ├── register/
│   │   ├── reset-password/
│   │   └── verify-email/
│   ├── profile/                    # ✅ User profile
│   ├── settings/                   # ✅ Settings
│   ├── chat/                       # ✅ AI chat
│   ├── coach/                      # ✅ Coach features
│   ├── community/                  # ✅ Community
│   ├── roster/                     # ✅ Team roster
│   ├── team/                       # ✅ Team management
│   ├── onboarding/                 # ✅ User onboarding
│   ├── exercise-library/           # ✅ Exercise library
│   ├── performance-tracking/       # ✅ Performance
│   ├── workout/                    # ✅ Workouts
│   └── landing/                    # ✅ Landing page
└── shared/                         # Shared components
    ├── components/
    │   ├── ai-coach-visibility/    # Coach AI monitoring
    │   ├── ai-feedback/            # AI feedback UI
    │   ├── traffic-light-risk/     # ACWR visualization
    │   ├── progressive-stats/      # Stats display
    │   ├── nutrition-dashboard/
    │   ├── recovery-dashboard/
    │   ├── performance-dashboard/
    │   ├── training-builder/
    │   ├── header/
    │   ├── sidebar/
    │   └── ...
    ├── utils/
    │   ├── form.utils.ts
    │   ├── form-submit.utils.ts
    │   └── status.utils.ts
    └── models/
        └── design-tokens.ts
```

---

## 🔧 Key Services

### ACWR Service (1,273 lines)

Evidence-based injury prevention using EWMA model:

```typescript
import { AcwrService } from '@core/services/acwr.service';

@Component({...})
export class MyComponent {
  private acwrService = inject(AcwrService);

  // Reactive signals
  acwrRatio = this.acwrService.acwrRatio;
  riskZone = this.acwrService.riskZone;
  dataQuality = this.acwrService.dataQuality;

  // Check if training is safe
  canTrainHard = computed(() =>
    this.acwrRatio() <= 1.5 && this.riskZone().level !== 'danger-zone'
  );
}
```

### AI Chat Service

AI coaching with safety tiers:

```typescript
import { AiChatService } from '@core/services/ai-chat.service';

@Component({...})
export class ChatComponent {
  private chatService = inject(AiChatService);

  loading = this.chatService.loading;
  messages = this.chatService.messages;

  sendMessage(text: string) {
    this.chatService.sendMessage({ message: text })
      .subscribe(response => {
        if (response.acwr_safety?.blocked) {
          // High-intensity blocked due to ACWR
          this.showSafetyWarning(response.acwr_safety.reason);
        }
      });
  }
}
```

### Notification State Service (Signal-Based)

```typescript
import { NotificationStateService } from '@core/services/notification-state.service';

@Component({...})
export class HeaderComponent {
  private notificationState = inject(NotificationStateService);

  // Reactive signals
  unreadCount = this.notificationState.unreadCount;
  notifications = this.notificationState.notifications;
  loading = this.notificationState.loading;
}
```

---

## 🎨 Design System

### Design Tokens

Located in `src/app/shared/models/design-tokens.ts`:

```typescript
export const DESIGN_TOKENS = {
  colors: {
    brand: {
      primary: "#089949",
      secondary: "#10c96b",
    },
    status: {
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
    },
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
  },
};
```

### CSS Custom Properties

```scss
:root {
  --color-primary: #089949;
  --color-secondary: #10c96b;
  --spacing-8: 8px;
  --spacing-16: 16px;
  --font-family: "Poppins", sans-serif;
}
```

---

## ⚡ Angular 21 Features Used

### Zoneless Change Detection

```typescript
// app.config.ts
provideZonelessChangeDetection();
```

### Signals Throughout

```typescript
// State
stats = signal<Stat[]>([]);
loading = signal(false);

// Computed
totalStats = computed(() => this.stats().reduce((sum, s) => sum + s.value, 0));

// Effects
effect(() => console.log("Stats changed:", this.stats()));
```

### Modern Control Flow

```html
@if (loading()) {
<p-progressSpinner />
} @else { @for (item of items(); track item.id) {
<app-item [data]="item" />
} }
```

### Standalone Components

All components use `standalone: true`:

```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, ButtonModule],
})
```

---

## 🔍 Angular DevTools

### Setup

1. Install [Angular DevTools browser extension](https://chromewebstore.google.com/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh)
2. Open app in development mode
3. Open browser DevTools (F12) → "Angular" tab

### Features

- 🔍 Visual Signal Graph Explorer
- ⚡ Real-time Change Detection Tracing
- 🔄 Component-level Load-Time Analysis
- 🧭 Router Event Inspector

---

## 🛠️ Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Generate Component

```bash
ng generate component features/my-feature
```

### Generate Service

```bash
ng generate service core/services/my-service
```

---

## 📦 PrimeNG 21

### Key Points

- **No `provideAnimations()`** - PrimeNG 21 uses CSS animations
- **80+ KB bundle savings**
- **Individual imports** for tree-shaking

### Common Components

```typescript
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { ChartModule } from "primeng/chart";
import { ToastModule } from "primeng/toast";
import { DialogModule } from "primeng/dialog";
```

---

## 📚 Documentation

| Document                                                       | Description         |
| -------------------------------------------------------------- | ------------------- |
| [BUILD_WARNINGS.md](./BUILD_WARNINGS.md)                       | Build warnings log  |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md)                             | Coding standards    |
| [ANGULAR_DEVTOOLS_SETUP.md](./ANGULAR_DEVTOOLS_SETUP.md)       | DevTools setup      |
| [ACWR_IMPLEMENTATION_GUIDE.md](./ACWR_IMPLEMENTATION_GUIDE.md) | ACWR service docs   |
| [../ANGULAR_PRIMENG_GUIDE.md](../ANGULAR_PRIMENG_GUIDE.md)     | Best practices      |
| [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)             | System architecture |
| [../docs/UTILITIES.md](../docs/UTILITIES.md)                   | Services API        |

---

## ✅ Feature Status

| Feature              | Status      | Components         |
| -------------------- | ----------- | ------------------ |
| **Authentication**   | ✅ Complete | 4 components       |
| **Dashboard**        | ✅ Complete | 3 variants         |
| **Training**         | ✅ Complete | 10 components      |
| **ACWR Monitoring**  | ✅ Complete | Dashboard + alerts |
| **Analytics**        | ✅ Complete | 2 components       |
| **Wellness**         | ✅ Complete | 1 component        |
| **Game Tracker**     | ✅ Complete | 2 components       |
| **AI Chat**          | ✅ Complete | With safety tiers  |
| **Tournaments**      | ✅ Complete | 1 component        |
| **Community**        | ✅ Complete | 1 component        |
| **Profile/Settings** | ✅ Complete | 2 components       |
| **Coach Features**   | ✅ Complete | 2 components       |

---

## 🤝 Contributing

1. Follow Angular 21 patterns (signals, standalone, OnPush)
2. Use PrimeNG components
3. Follow design tokens
4. Add TypeScript types
5. Use signal-based state management

---

**Last Updated:** 29. December 2025
