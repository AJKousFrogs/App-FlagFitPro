# Claude.md - FlagFit Pro Codebase Guide

**Last Updated:** May 12, 2026  
**Project Version:** 4.0.0  
**Applies To:** All AI assistants working on this codebase

---

## 📌 Quick Start for AI Assistants

### What This Project Is

FlagFit Pro is a **flag football performance, wellness, and team-operations platform** built with:
- **Frontend**: Angular 21 + TypeScript + PrimeNG 21 + SCSS
- **Backend**: Netlify Functions (80 serverless functions)
- **Database**: Supabase PostgreSQL with Row-Level Security (RLS)
- **Testing**: Playwright (E2E), Vitest (unit), comprehensive integration tests

**Repository structure:** Monorepo with `/angular` (frontend), `/netlify/functions` (backend), `/database` (migrations), `/docs` (canonical documentation), `/tests` (test suites), `/scripts` (tooling).

### Critical Rules Before You Code

1. **Read the docs index first**: `docs/DOCS_INDEX.md` is the single source of truth for architecture and feature documentation
2. **Understand ownership**: Check `docs/SINGLE_SOURCE_OF_TRUTH.md` to know who owns what and which docs are authoritative
3. **Follow established patterns**: This codebase has strong conventions for Angular components, services, and backend functions
4. **Preserve type safety**: TypeScript is strict; generated types in `supabase-types.ts` are authoritative
5. **Test before claiming done**: Components need unit tests, features need E2E tests, sensitive code needs integration tests

### Local Development

```bash
# Setup (first time)
npm install
cd angular && npm install && cd ..

# Run with full backend parity
npm run dev

# Run Angular-only (isolated UI work)
cd angular && npm start

# Run tests
npm run test                 # Unit tests
npm run test:e2e            # E2E tests
npm run test:e2e:smoke      # Smoke tests
npm run test:backend        # Backend integration tests

# Type checking and linting
npm run type-check
npm run lint
npm run lint:fix
```

**Development Server**: Netlify Dev at `localhost:8888` (proxies Angular at 4200)

---

## 🏗️ Codebase Structure

```
App-FlagFitPro/
├── angular/                    # Angular 21 frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Singleton services, guards, interceptors, utilities
│   │   │   │   ├── services/   # 86+ injectable services (auth, api, acwr, wellness, etc.)
│   │   │   │   ├── guards/     # Route protection (auth, roles)
│   │   │   │   ├── interceptors/ # HTTP and caching
│   │   │   │   └── view-models/ # Signal-based state management
│   │   │   ├── features/       # Feature domains (training, dashboard, wellness, etc.)
│   │   │   └── shared/         # Reusable components, directives, pipes, utilities
│   │   ├── scss/               # Design tokens, foundations, utilities, component styles
│   │   ├── styles.scss         # Main stylesheet
│   │   ├── main.ts             # Entry point (bootstraps app and services)
│   │   └── environments/        # Environment configuration (dev, prod)
│   ├── test/                   # Unit test helpers and mock data
│   ├── e2e/                    # Playwright end-to-end tests
│   ├── angular.json            # Angular workspace configuration
│   └── README.md               # Angular workspace guide
│
├── netlify/functions/          # Serverless backend (80 functions)
│   ├── auth-*.js               # Authentication functions (login, signup, reset)
│   ├── ai-*.js                 # AI coaching and chat functions
│   ├── training-*.js           # Training and prescription functions
│   ├── wellness-*.js           # Wellness tracking functions
│   ├── analytics-*.js          # Performance analytics functions
│   ├── admin.js                # Admin operations
│   └── ...                     # 70+ more specialized functions
│
├── database/
│   ├── migrations/             # 55+ SQL migration files
│   ├── scripts/                # Database utilities and seeding
│   ├── archive/                # Archived schemas and migrations
│   └── README.md               # Database setup guide
│
├── docs/                       # CANONICAL DOCUMENTATION (must read!)
│   ├── DOCS_INDEX.md           # START HERE - Entry point for all docs
│   ├── ARCHITECTURE.md         # System architecture (v4.0 baseline)
│   ├── ARCHITECTURE_v10.md     # Next-gen architecture (in progress)
│   ├── SINGLE_SOURCE_OF_TRUTH.md # Ownership and authority rules
│   ├── CODEBASE_MAP.md         # File-by-file guide
│   ├── REPO_DISCOVERY_GUIDE.md # How to find things
│   ├── FEATURE_DOCUMENTATION.md # Product behavior and features
│   ├── ANGULAR_PRIMENG_GUIDE.md # Frontend patterns and best practices
│   ├── DESIGN_SYSTEM_RULES.md  # UI/UX design tokens and conventions
│   ├── API.md                  # Backend function contracts
│   ├── BACKEND_SETUP.md        # Netlify Functions setup
│   ├── LOCAL_DEVELOPMENT_SETUP.md # Full local dev instructions
│   ├── PRIVACY_CONTROLS_SPEC.md # Privacy and data handling
│   ├── CALCULATION_SPEC.md     # ACWR and metrics calculations
│   └── ...                     # 20+ more specialized docs
│
├── tests/
│   ├── integration/            # Backend API tests (vitest)
│   ├── privacy-safety/         # Privacy and security tests
│   ├── logic/                  # Algorithm and calculation tests
│   ├── contracts/              # API response shape validation
│   └── load/                   # Performance and load testing
│
├── scripts/                    # Node.js tooling and automation
│   ├── audit-*.js              # Code audits (RLS, routes, duplications, etc.)
│   ├── diagnostic-system.js    # Health checks
│   ├── verify-*.js             # Verification scripts
│   └── ...                     # 30+ utility scripts
│
├── .github/                    # GitHub Actions and CI/CD
├── supabase/                   # Supabase configuration
├── .env.example                # Environment template
├── package.json                # Root dependencies and scripts
├── netlify.toml                # Netlify configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Project overview
```

---

## 🛠️ Development Conventions

### TypeScript & Code Quality

- **Strict mode enabled**: All code must pass TypeScript strict checking
- **No any types**: Use proper typing or generics instead
- **Functional dependencies**: Use `inject()` in services/components, not constructor injection
- **No comments for obvious code**: Only comment the "why," not the "what"
- **Consistent naming**: Use descriptive names (services end in `.service.ts`, guards in `.guard.ts`, etc.)

### Angular Components

**Standard structure for all components:**

```typescript
import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { signal, computed } from '@angular/core';

@Component({
  selector: 'app-my-feature',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  template: `...`,
  styleUrls: ['./my-feature.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyFeatureComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  
  // Use signals for reactive state
  protected readonly items = signal<Item[]>([]);
  protected readonly isLoading = signal(false);
  
  // Use computed for derived state
  protected readonly isEmpty = computed(() => this.items().length === 0);
  
  ngOnInit() {
    // Load data or trigger observables
  }
}
```

**Key requirements:**
- `standalone: true` - No NgModules
- `changeDetection: ChangeDetectionStrategy.OnPush` - Opt-in change detection only
- Use `signal()` and `computed()` for state management (not RxJS Subject)
- Inject dependencies using `inject()` function
- All component methods/properties marked with `protected` or `private`
- Template binding to signal values: `{{ signal() }}` (calling the signal)

### Services

All services are **singleton injectable** services in `/core/services/`.

```typescript
import { Injectable, inject } from '@angular/core';
import { signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MyService {
  private readonly apiService = inject(ApiService);
  
  // State as signals
  readonly data = signal<Data | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  
  // Expose computed selectors
  readonly isReady = computed(() => this.data() !== null && !this.isLoading());
  
  loadData(id: string) {
    this.isLoading.set(true);
    this.apiService.fetchData(id).subscribe({
      next: (data) => { this.data.set(data); },
      error: (err) => { this.error.set(err.message); },
      complete: () => { this.isLoading.set(false); }
    });
  }
}
```

### Backend Functions (Netlify)

All functions follow strict patterns:

```javascript
// Standard function structure
export default async (req, context) => {
  // 1. Validate request method
  if (req.method !== 'POST') return { statusCode: 405 };
  
  // 2. Parse and validate input
  let body;
  try {
    body = JSON.parse(req.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }
  
  // 3. Authenticate and authorize
  const auth = context.clientContext.user;
  if (!auth) return { statusCode: 401 };
  
  // 4. Execute business logic
  try {
    const result = await doSomething(body);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
```

**Requirements:**
- Always validate input
- Always authenticate and authorize
- Always catch and log errors
- Always return proper HTTP status codes
- Use environment variables for configuration
- Functions should be under 2000 lines (split if larger)

### Database & Migrations

- **Migrations**: All schema changes go in `/database/migrations/` as numbered SQL files
- **RLS Policies**: Row-level security must protect user data (checked in `docs/PRIVACY_CONTROLS_SPEC.md`)
- **Types**: Generated `supabase-types.ts` is authoritative for table schemas
- **Indexes**: Create indexes for queries in RLS policies (check `verify_indexes.sql`)

### Testing

- **Unit tests**: `angular/test/` for components and services (Jasmine/Karma)
- **E2E tests**: `angular/e2e/` for user workflows (Playwright)
- **Integration tests**: `tests/integration/` for backend functions (Vitest)
- **Privacy tests**: `tests/privacy-safety/` for data handling

**Before submitting changes:**
```bash
npm run type-check  # Must pass
npm run lint        # Must have no errors
npm run test        # Run unit tests
npm run test:e2e    # Run E2E for affected routes
```

---

## 🔑 Key Architecture Decisions

### Why Signals, Not RxJS?

Angular 21 introduced signals for granular reactivity. This codebase uses signals because:
- Fine-grained change detection (replace zone.js overhead)
- Clearer state management (`signal()` is a value, not a stream)
- Simpler subscriptions (no unsubscribe hell)
- Better performance with OnPush detection

**Pattern**: Components use signals + computed; services expose signal-based APIs.

### Why Supabase?

Supabase provides:
- Real-time PostgreSQL subscriptions (no polling)
- Row-level security for multi-tenant safety
- Built-in auth with OAuth
- PostgREST API (auto-generated REST endpoints)
- Edge Functions for custom logic

**Data access**: Always use Supabase RLS policies, never bypass with service role keys in user-facing code.

### Why Netlify Functions?

- Cheap and scalable (serverless)
- Cold start penalties are acceptable for this workload
- Integrates directly with Netlify hosting
- Can invoke from frontend or scheduled tasks

### Design System

All colors, spacing, typography, and component tokens live in:
- **SCSS tokens**: `angular/src/scss/tokens/design-system-tokens.scss`
- **TS bridge**: `angular/src/app/core/utils/design-tokens.util.ts`
- **Rules**: `docs/DESIGN_SYSTEM_RULES.md`

Never hardcode colors or spacing; always use design tokens.

---

## ⚡ Quick Reference: Where To Find Things

| Need | Location |
|------|----------|
| Feature routes | `docs/ROUTE_MAP.md` or search `/angular/src/app/core/routes/` |
| API endpoints | `docs/API.md` and `netlify/functions/*.js` |
| Calculations (ACWR, etc.) | `docs/CALCULATION_SPEC.md` and `angular/src/app/core/services/acwr.service.ts` |
| Database schema | `supabase-types.ts` (generated from migrations) |
| RLS policies | `database/migrations/` (SQL files) and `docs/PRIVACY_CONTROLS_SPEC.md` |
| Design tokens | `angular/src/scss/tokens/design-system-tokens.scss` |
| Feature documentation | `docs/FEATURE_DOCUMENTATION.md` |
| Component patterns | `docs/ANGULAR_PRIMENG_GUIDE.md` |
| Test data | `angular/test/mock-data/` |
| Common utilities | `angular/src/app/shared/utils/` and `angular/src/app/core/utils/` |

---

## 🔍 When You Need To Understand Something

### "How is feature X implemented?"

1. Check `docs/FEATURE_DOCUMENTATION.md` for product behavior
2. Find the route in `docs/ROUTE_MAP.md`
3. Look at the component in `/angular/src/app/features/`
4. Trace the API calls to `netlify/functions/`
5. Check database migrations if there's a new table

### "What changed in the last release?"

Look at `docs/RELEASE_NOTES_X.X.X.md` for the most recent version.

### "Why does this exist?"

Check:
1. Git history: `git log --oneline <file>`
2. Related PR or issue comments
3. The codebase map: `docs/CODEBASE_MAP.md`
4. Domain knowledge: `docs/FLAG_FOOTBALL_TRAINING_SCIENCE.md`

### "Can I change this?"

Check `docs/SINGLE_SOURCE_OF_TRUTH.md` to see if it's owned by a specific domain or decision.

---

## 🚨 Common Pitfalls & How To Avoid Them

| Pitfall | Solution |
|---------|----------|
| Breaking type safety | Run `npm run type-check` before committing |
| Forgetting OnPush detection | Copy component template from existing ones |
| Not using signals for state | Import signal from core, never use Subject in components |
| Hardcoding colors/spacing | Use design tokens from `design-system-tokens.scss` |
| Bypassing RLS for convenience | Never use service role key on frontend; filter in RLS |
| Unvalidated API inputs | Always validate request body and authenticate in functions |
| Missing tests | Add unit tests for services, E2E for routes, integration for APIs |
| Not running lint before push | Set up pre-commit hooks or run `npm run lint:fix` |
| Changing database without migration | All schema changes must be in numbered migration files |
| Ignoring error handling | Always catch errors and return proper HTTP status codes |

---

## 📋 Development Workflow

### Starting a new task

1. **Read the docs**: Check `docs/DOCS_INDEX.md` and related docs
2. **Understand the codebase**: Run `npm run health:check` to verify setup
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Run tests**: Ensure all tests pass before you start
5. **Make changes**: Follow the patterns established in the codebase

### Before committing

```bash
npm run type-check     # TypeScript must pass
npm run lint:fix       # Auto-fix linting issues
npm run test           # Unit tests must pass
npm run test:e2e       # E2E tests for affected routes (if UI changes)
```

### Before pushing

- Squash related commits into logical units
- Write clear commit messages: `feat: add ACWR alert for load management`
- Reference any related issues: `Closes #123`
- If backend changed, run `npm run test:backend`
- If database changed, verify migrations apply cleanly

---

## 🎓 Learning Resources

### For new team members

1. **Architecture**: Read `docs/ARCHITECTURE.md` (30 min)
2. **Frontend patterns**: Read `docs/ANGULAR_PRIMENG_GUIDE.md` (20 min)
3. **Features**: Skim `docs/FEATURE_DOCUMENTATION.md` (scan only)
4. **Design system**: Review `docs/DESIGN_SYSTEM_RULES.md` (20 min)
5. **Code along**: Pick a simple component in features, trace to API, examine tests

### For understanding calculations

- `docs/CALCULATION_SPEC.md` — Definitions (ACWR, monotony, TSB, etc.)
- `docs/FLAG_FOOTBALL_TRAINING_SCIENCE.md` — Research backing
- `angular/src/app/core/services/acwr.service.ts` — Implementation

### For understanding privacy & security

- `docs/PRIVACY_CONTROLS_SPEC.md` — Data handling rules
- `docs/ROLE_AUTHORIZATION_MODEL.md` — Who can do what
- `database/migrations/` — RLS policies in SQL

---

## 🔧 Useful Commands Reference

```bash
# Development
npm run dev                    # Full stack dev (Netlify + Angular)
cd angular && npm start        # Angular-only dev

# Building
npm run build                  # Full build
cd angular && npm run build    # Angular build only

# Testing
npm run test                   # Unit tests
npm run test:e2e              # E2E tests
npm run test:backend          # Backend integration tests
npm run test:all              # Everything
npm run test:e2e:smoke        # Quick smoke test

# Code quality
npm run lint                   # Lint check (no fix)
npm run lint:fix              # Auto-fix linting issues
npm run type-check            # TypeScript strict check
npm run format                # Auto-format with Prettier

# Audits & health checks
npm run health:check          # Comprehensive health check
npm run diagnostics           # System diagnostics
npm run audit:rls-boundaries  # Check RLS policies
npm run audit:routes          # Audit route definitions

# Database & backend
npm run verify:supabase       # Verify Supabase setup
npm run db:audit              # Audit database
npm run seed:all              # Seed all reference data

# Deployment
npm run build && npm run deploy # Build and deploy to Netlify
```

---

## 🤝 Communication & Questions

### For ambiguous requirements

Ask: "Which docs should I check for the source of truth on this?"
Then check those docs before asking for clarification.

### For tricky bugs

1. Check if it's in `docs/DRIFT_REGISTER.md` (known issues)
2. Search git history: `git log --grep="keyword" --oneline`
3. Look for existing tests: `grep -r "issue description" tests/`
4. Ask with context: Show which service, which test, which docs you've read

### For architectural decisions

Check `docs/SINGLE_SOURCE_OF_TRUTH.md` to see who owns that area, then ask in context of documented patterns.

---

## 📚 File Links

- Main README: [README.md](./README.md)
- Documentation index: [docs/DOCS_INDEX.md](./docs/DOCS_INDEX.md)
- Architecture: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- Angular guide: [docs/ANGULAR_PRIMENG_GUIDE.md](./docs/ANGULAR_PRIMENG_GUIDE.md)
- Design system: [docs/DESIGN_SYSTEM_RULES.md](./docs/DESIGN_SYSTEM_RULES.md)
- Local setup: [docs/LOCAL_DEVELOPMENT_SETUP.md](./docs/LOCAL_DEVELOPMENT_SETUP.md)
- Angular workspace: [angular/README.md](./angular/README.md)
- Database setup: [database/README.md](./database/README.md)

---

**Last verified:** May 12, 2026  
**Version:** 1.0 (Initial creation)  
**Maintainer**: FlagFit Pro Development Team
