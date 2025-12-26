# 🏈 FlagFit Pro - Professional Flag Football Training Platform

[![Angular](https://img.shields.io/badge/Angular-21.0-red.svg)](https://angular.dev/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-21.0-blue.svg)](https://primeng.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

**Professional-grade training platform with AI coaching, ACWR load monitoring, and Olympic qualification tracking.**

---

## 🎯 Project Status: ~85% Production Ready

| Component | Status | Details |
|-----------|--------|---------|
| **Database Schema** | ✅ 100% | 53+ migrations, RLS policies, real-time subscriptions |
| **Backend API** | ✅ 100% | 69 Netlify Functions, rate limiting, error handling |
| **Angular Frontend** | ✅ 90% | 40+ components, signal-based state, PrimeNG UI |
| **AI Coaching** | ✅ 100% | Groq LLM + 3-tier safety + ACWR integration |
| **ACWR Monitoring** | ✅ 100% | 1,273-line service with Gabbett 2016 thresholds |
| **Testing** | 🔄 20% | Unit tests in progress |

---

## ✨ Key Features

### 🤖 AI Coaching with ACWR Safety Integration

- **Groq LLM Integration**: FREE tier with 14,400 requests/day
- **3-Tier Safety System**: Risk classification (low/medium/high) with appropriate disclaimers
- **ACWR Safety Override**: Automatically blocks high-intensity recommendations when athlete ACWR > 1.5
- **Coach Visibility Dashboard**: Coaches monitor AI recommendations to players
- **Evidence-Based Knowledge**: 120+ peer-reviewed studies integrated

### 📊 ACWR Load Monitoring (Sports Science)

Based on Gabbett (2016) research - "The training-injury prevention paradox":

| ACWR Range | Risk Zone | Color | AI Behavior |
|------------|-----------|-------|-------------|
| < 0.80 | Under-training | 🟠 Orange | Can recommend more training |
| 0.80 - 1.30 | Sweet Spot | 🟢 Green | All recommendations allowed |
| 1.30 - 1.50 | Elevated | 🟡 Yellow | Allowed with monitoring |
| > 1.50 | Danger | 🔴 Red | **BLOCKS high-intensity** |
| > 1.80 | Critical | 🔴 Red | **Recommends rest only** |

### 🏆 Olympic Preparation

- **LA28 Qualification Path**: Structured progression tracking
- **Tournament Management**: Competition tracking and results
- **Performance Analytics**: Advanced metrics and visualizations
- **Position-Specific Metrics**: QB, WR, DB, LB tracking

### 🎨 Modern UI/UX

- **PrimeNG 21**: Native CSS animations (80+ KB bundle savings)
- **Zoneless Change Detection**: No Zone.js overhead
- **Signal-Based Reactivity**: Angular 21 signals throughout
- **Responsive Design**: Mobile-first with Poppins typography

---

## 🛠 Technology Stack

### Frontend (Angular 21)

```
angular/src/app/
├── core/                    # 45+ services
│   ├── services/
│   │   ├── acwr.service.ts         # 1,273 lines - ACWR calculations
│   │   ├── ai-chat.service.ts      # AI coaching with safety
│   │   ├── supabase.service.ts     # Auth + database
│   │   └── ... (40+ more)
│   ├── interceptors/        # Auth, cache, error
│   └── view-models/         # Signal-based state
├── features/                # 25+ feature modules
│   ├── acwr-dashboard/      # Load monitoring UI
│   ├── training/            # 10+ training components
│   ├── analytics/           # Performance analytics
│   └── ... (20+ more)
└── shared/                  # Reusable components
```

### Backend (Netlify Functions)

```
netlify/functions/
├── ai-chat.cjs              # AI coaching with ACWR safety
├── ai-safety-classifier.cjs # 3-tier risk classification
├── load-management.cjs      # ACWR, monotony, TSB
├── training-plan.cjs        # Periodized training
├── smart-training-recommendations.cjs
└── ... (69 total functions)
```

### Database (Supabase PostgreSQL)

- **53+ migration files** with comprehensive schema
- **Row Level Security (RLS)** policies throughout
- **Real-time subscriptions** for live updates
- **Knowledge base** with evidence grading

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Angular CLI 21
- Supabase account

### Installation

```bash
# Clone repository
git clone <repo-url>
cd flagfit-pro

# Install Angular dependencies
cd angular
npm install

# Start development server
npm start
```

The app will be available at `http://localhost:4200`

### Environment Variables

Set in Netlify UI (Site Settings → Environment Variables):

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | ✅ Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | ✅ Yes |
| `SUPABASE_ANON_KEY` | Supabase anon key | ✅ Yes |
| `JWT_SECRET` | JWT signing secret | ✅ Yes |
| `GROQ_API_KEY` | Groq API key for AI | ⚠️ Optional |

Get your FREE Groq API key at: https://console.groq.com/

---

## 📁 Project Structure

```
flagfit-pro/
├── angular/                 # PRIMARY: Angular 21 + PrimeNG 21
│   ├── src/app/
│   │   ├── core/           # Services, guards, interceptors
│   │   ├── features/       # Feature modules (25+)
│   │   └── shared/         # Shared components
│   └── package.json
├── netlify/functions/       # Backend API (69 functions)
├── database/               # SQL migrations (53+)
├── docs/                   # Documentation
└── supabase/              # Supabase config
```

---

## 📊 Angular Services Overview

### Core Services (45+)

| Service | Lines | Purpose |
|---------|-------|---------|
| `acwr.service.ts` | 1,273 | ACWR calculations with EWMA |
| `acwr-alerts.service.ts` | 434 | Load alerts and warnings |
| `ai-chat.service.ts` | 270 | AI coaching chat |
| `wellness.service.ts` | 582 | Wellness tracking |
| `nutrition.service.ts` | 713 | Nutrition management |
| `training-stats-calculation.service.ts` | 363 | Training statistics |
| `notification-state.service.ts` | 394 | Signal-based notifications |

### Feature Components (25+)

| Feature | Components | Status |
|---------|------------|--------|
| **Training** | 10 components | ✅ Complete |
| **Analytics** | 2 components | ✅ Complete |
| **Dashboard** | 3 components | ✅ Complete |
| **ACWR Dashboard** | 1 component | ✅ Complete |
| **Game Tracker** | 2 components | ✅ Complete |
| **Wellness** | 1 component | ✅ Complete |
| **Auth** | 4 components | ✅ Complete |
| **Profile/Settings** | 2 components | ✅ Complete |

---

## 🔒 Security Features

- **Supabase Auth**: JWT token management with Angular guards
- **Row Level Security**: Database-level access control
- **CSRF Protection**: Built-in CSRF protection
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Server-side validation middleware
- **AI Safety Tiers**: Risk classification for AI responses

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and dependencies |
| [UTILITIES.md](docs/UTILITIES.md) | Angular services API reference |
| [AI_COACHING_SYSTEM_REVAMP.md](docs/AI_COACHING_SYSTEM_REVAMP.md) | AI safety system documentation |
| [angular/README.md](angular/README.md) | Angular-specific documentation |
| [ANGULAR_PRIMENG_GUIDE.md](ANGULAR_PRIMENG_GUIDE.md) | Angular 21 + PrimeNG best practices |

---

## 🧪 Development

### Build

```bash
cd angular
npm run build
```

### Test

```bash
cd angular
npm test
```

### Generate Component

```bash
cd angular
ng generate component features/my-feature
```

---

## 🤝 Contributing

1. Follow Angular 21 style guide
2. Use PrimeNG components when possible
3. Implement signal-based state management
4. Add proper TypeScript types
5. Follow the ACWR safety patterns for training recommendations

---

## 📄 License

MIT License - See [LICENSE.md](docs/LICENSE.md) for details

---

<div align="center">

**Built with ❤️ for Olympic flag football excellence**

[Live Demo](https://app-new-flag.netlify.app/) • [Documentation](docs/) • [Angular App](angular/)

</div>
