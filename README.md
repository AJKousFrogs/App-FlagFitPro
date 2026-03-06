# 🏈 FlagFit Pro - Professional Flag Football Training Platform

[![Angular](https://img.shields.io/badge/Angular-21.1-red.svg)](https://angular.dev/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-21.0-blue.svg)](https://primeng.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

**Professional-grade training platform with AI coaching, ACWR load monitoring, and Olympic qualification tracking.**

---

## Documentation Rule

Docs describe current behavior or enforced rules. One-time audits and trackers are archived or deleted. If a doc is not referenced by [docs/DOCS_INDEX.md](docs/DOCS_INDEX.md), it should not exist. Max 1 doc per topic.

---

## 🎯 Project Status: ~85% Production Ready

| Component            | Status  | Details                                             |
| -------------------- | ------- | --------------------------------------------------- |
| **Database Schema**  | ✅ 100% | 55+ migrations, 250+ tables, RLS policies           |
| **Backend API**      | ✅ 100% | 80 Netlify Functions, rate limiting, error handling |
| **Angular Frontend** | ✅ 90%  | 28+ feature modules, 86+ services, PrimeNG UI       |
| **AI Coaching**      | ✅ 100% | Groq LLM + 3-tier safety + ACWR integration         |
| **ACWR Monitoring**  | ✅ 100% | 1,273-line service with Gabbett 2016 thresholds     |
| **Testing**          | 🔄 20%  | Unit tests in progress                              |

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

| ACWR Range  | Risk Zone      | Color     | AI Behavior                 |
| ----------- | -------------- | --------- | --------------------------- |
| < 0.80      | Under-training | 🟠 Orange | Can recommend more training |
| 0.80 - 1.30 | Sweet Spot     | 🟢 Green  | All recommendations allowed |
| 1.30 - 1.50 | Elevated       | 🟡 Yellow | Allowed with monitoring     |
| > 1.50      | Danger         | 🔴 Red    | **BLOCKS high-intensity**   |
| > 1.80      | Critical       | 🔴 Red    | **Recommends rest only**    |

### 🏆 Olympic Preparation

- **LA28 Qualification Path**: Structured progression tracking
- **Tournament Management**: Competition tracking and results
- **Performance Analytics**: Advanced metrics and visualizations
- **Position-Specific Metrics**: QB, WR, DB, LB tracking

### 💰 Payment Tracking

- **Important**: FlagFit Pro does **NOT** process payments (no Stripe/PayPal)
- **Track Only**: Monitor fees, payments, and balances
- **Player Pays Direct**: Players pay coaches via cash, Venmo, Zelle, CashApp, etc.
- **Coach Marks Received**: Coaches update payment status manually
- **Export Reports**: Generate payment history for records

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
├── core/                    # 86+ services
│   ├── services/
│   │   ├── acwr.service.ts         # 1,273 lines - ACWR calculations
│   │   ├── ai-chat.service.ts      # AI coaching with safety
│   │   ├── supabase.service.ts     # Auth + database
│   │   └── ... (80+ more)
│   ├── interceptors/        # Auth, cache, error
│   └── view-models/         # Signal-based state
├── features/                # 28+ feature modules
│   ├── acwr-dashboard/      # Load monitoring UI
│   ├── training/            # 10+ training components
│   ├── analytics/           # Performance analytics
│   └── ... (18+ more)
└── shared/                  # Reusable components
```

### Backend (Netlify Functions)

```
netlify/functions/
├── ai-chat.js              # AI coaching with ACWR safety
├── utils/
│   └── ai-safety-classifier.js # 3-tier risk classification
├── load-management.js      # ACWR, monotony, TSB
├── training-plan.js        # Periodized training
├── smart-training-recommendations.js
└── ... (80 total functions)
```

### Database (Supabase PostgreSQL)

- **55+ migration files** with comprehensive schema
- **250+ tables** covering training, nutrition, recovery, AI coaching
- **Row Level Security (RLS)** policies throughout
- **Real-time subscriptions** for live updates
- **113+ exercises** (90 plyometrics + 23 isometrics)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- npm 10+
- Supabase account (credentials in `.env`)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd flagfit-pro

# Install root dependencies
npm install

# Install Angular dependencies (uses pnpm)
cd angular
npx pnpm install
cd ..

# Start development (Netlify Dev + Angular)
npm run dev
```

> **Note:** The Angular folder uses **pnpm** as its package manager. The command `npx pnpm install` will automatically download and run pnpm if not installed globally.

### ⚠️ IMPORTANT: Local Development

**Always run via Netlify Dev** to mirror production routing and functions:

| Server                   | Port             | Purpose                                      |
| ------------------------ | ---------------- | -------------------------------------------- |
| Netlify Dev (proxy)      | `localhost:8888` | Frontend + `/api` → Netlify Functions        |
| Angular dev server       | `localhost:4200` | Dev build target for Netlify Dev (internal)  |

```bash
# ✅ CORRECT - Netlify Dev proxy + Functions
npm run dev

# ❌ WRONG - Angular only (no Functions/API)
npm run dev:angular-only
```

`npm run dev` intentionally adds Netlify's `--skip-wait-port` flag because this
Angular workspace can take longer than Netlify CLI's default framework-port
probe during the first compile. If you run `netlify dev` manually, include
`--skip-wait-port` or Netlify may give up before the Angular server is ready.

## 🧱 CSS Build Pipeline

- **SCSS entrypoints**
  - `angular/src/styles.scss` (main entrypoint that brings together `styles/`, `assets/styles/`, and `scss/tokens/` layers).
  - `angular/src/scss/tokens/design-system-tokens.scss` (isolated tokens entry used for tooling that only needs CSS variables).
  - `angular/src/scss/components/index.scss`, `angular/src/scss/pages/index.scss`, and `angular/src/scss/utilities/index.scss` (each generates a dedicated CSS file that keeps component/page/utility selectors deterministic).
- **Compiled outputs**
  - `npm run sass:compile` emits `src/css/main.css`, `src/css/tokens.css`, `src/css/components/index.css`, `src/css/pages/index.css`, and `src/css/utilities/index.css`.
  - `npm run build:css` runs `node scripts/build-css.js`, which minifies those CSS files and produces the bundle set under `dist/css/` (`main-bundle.css`, `components-bundle.css`, `pages-bundle.css`, `utilities-bundle.css`).
  - Keeping `src/css` deterministic prevents duplicate selectors and keeps the generated bundles stable for CI/deploy.
- **Script dependencies**
  - Because `build:css` reads the files output by `sass:compile`, always run `npm run sass:compile && npm run build:css` from the repo root when validating or regenerating CSS bundles; skipping the compilation step leaves `dist/css/` stale and may break deployments.
  - For local iteration, run `npm run sass:watch`: the wrapper automatically enables polling on macOS while compiling the same five entrypoints before bundling.

The app will be available at `http://localhost:8888`

### Environment Variables

Set in Netlify UI (Site Settings → Environment Variables):

| Variable                    | Description                                                   | Required | Status        |
| --------------------------- | ------------------------------------------------------------- | -------- | ------------- |
| `SUPABASE_URL`              | Supabase project URL                                          | ✅ Yes   | ✅ Configured |
| `SUPABASE_ANON_KEY`         | Supabase anon/publishable key (frontend + some functions)     | ✅ Yes   | ✅ Configured |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only, never expose client) | ✅ Yes   | ✅ Configured |
| `GROQ_API_KEY`              | Groq API key for AI                                           | ✅ Yes   | ✅ Configured |
| `USDA_API_KEY`              | USDA food database                                            | ✅ Yes   | ✅ Configured |

Legacy compatibility:
- `SUPABASE_SERVICE_KEY` is still accepted by some scripts/functions as an alias for `SUPABASE_SERVICE_ROLE_KEY`.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are legacy fallback inputs; canonical values are the `SUPABASE_*` keys above.

### External APIs

| Service                          | API Key Required | Status     | Notes                                          |
| -------------------------------- | ---------------- | ---------- | ---------------------------------------------- |
| **Groq AI**                      | Yes              | ✅ Working | FREE tier: 14,400 requests/day                 |
| **USDA Food Database**           | Yes              | ✅ Working | FREE key from fdc.nal.usda.gov                 |
| **Weather (Open-Meteo)**         | No               | ✅ Working | Default weather provider, free/no key required |
| **Angular/PrimeNG**              | No               | ✅ Working | Frameworks, not API services                   |

---

## 📁 Project Structure

```
flagfit-pro/
├── angular/                 # PRIMARY: Angular 21 + PrimeNG 21
│   ├── src/app/
│   │   ├── core/           # 86+ services, guards, interceptors
│   │   ├── features/       # Feature modules (28+)
│   │   └── shared/         # Shared components
│   └── package.json
├── netlify/functions/       # Backend API (80 functions)
├── database/               # SQL migrations (55+)
├── docs/                   # Documentation
└── supabase/              # Supabase config
```

---

## 📊 Angular Services Overview

### Core Services (86+)

| Service                                 | Lines | Purpose                     |
| --------------------------------------- | ----- | --------------------------- |
| `acwr.service.ts`                       | 1,273 | ACWR calculations with EWMA |
| `acwr-alerts.service.ts`                | 434   | Load alerts and warnings    |
| `ai-chat.service.ts`                    | 270   | AI coaching chat            |
| `wellness.service.ts`                   | 582   | Wellness tracking           |
| `nutrition.service.ts`                  | 713   | Nutrition management        |
| `training-stats-calculation.service.ts` | 363   | Training statistics         |
| `notification-state.service.ts`         | 394   | Signal-based notifications  |

### Feature Components (28+)

| Feature              | Components    | Status      |
| -------------------- | ------------- | ----------- |
| **Training**         | 10 components | ✅ Complete |
| **Analytics**        | 2 components  | ✅ Complete |
| **Dashboard**        | 3 components  | ✅ Complete |
| **ACWR Dashboard**   | 1 component   | ✅ Complete |
| **Game Tracker**     | 2 components  | ✅ Complete |
| **Wellness**         | 1 component   | ✅ Complete |
| **Auth**             | 4 components  | ✅ Complete |
| **Profile/Settings** | 2 components  | ✅ Complete |

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

**📖 [Complete Documentation Index](docs/DOCS_INDEX.md)** - Start here for all documentation

| Document                                                      | Description                           |
| ------------------------------------------------------------- | ------------------------------------- |
| [DOCS_INDEX.md](docs/DOCS_INDEX.md)                           | **Master documentation index**        |
| [LOCAL_DEVELOPMENT_SETUP.md](docs/LOCAL_DEVELOPMENT_SETUP.md) | **Start here** - Development setup    |
| [FEATURE_DOCUMENTATION.md](docs/FEATURE_DOCUMENTATION.md)     | Complete feature reference            |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)                       | System design and dependencies        |
| [API.md](docs/API.md)                                         | Complete API reference (80 endpoints) |
| [DATABASE_SETUP.md](docs/DATABASE_SETUP.md)                   | Database schema (250+ tables)         |
| [BACKEND_SETUP.md](docs/BACKEND_SETUP.md)                     | Netlify Functions setup               |
| [AUTHENTICATION_PATTERN.md](docs/AUTHENTICATION_PATTERN.md)   | Supabase Auth patterns                |
| [ANGULAR_PRIMENG_GUIDE.md](docs/ANGULAR_PRIMENG_GUIDE.md)     | Angular 21 + PrimeNG best practices   |

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

MIT License - See [LICENSE.md](LICENSE.md) for details

---

<div align="center">

**Built with ❤️ for Olympic flag football excellence**

[Live Demo](https://app-new-flag.netlify.app/) • [Documentation](docs/) • [Angular App](angular/)

</div>
