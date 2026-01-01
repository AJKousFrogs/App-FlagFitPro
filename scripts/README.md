# Scripts Directory

This directory contains utility scripts for the FlagFit Pro application.

## Database Seeding Scripts

Run these via npm commands from the project root:

| Command                               | Description                                           |
| ------------------------------------- | ----------------------------------------------------- |
| `npm run seed:isometrics`             | Seed isometric training exercises database            |
| `npm run seed:plyometrics`            | Seed plyometrics research (Verkhoshansky methodology) |
| `npm run seed:hydration`              | Seed hydration research studies                       |
| `npm run seed:supplements`            | Seed supplement research data                         |
| `npm run seed:competition`            | Seed competition protocols (European Championships)   |
| `npm run seed:nutrition`              | Seed nutrition system data                            |
| `npm run seed:recovery`               | Seed recovery protocols                               |
| `npm run seed:wada`                   | Seed WADA prohibited substances list                  |
| `npm run seed:training`               | Seed enhanced training categories                     |
| `npm run seed:weather`                | Seed weather-based training protocols                 |
| `npm run seed:communication`          | Seed communication training data                      |
| `npm run seed:research`               | Seed evidence-based research database                 |
| `npm run seed:research:advanced`      | Seed advanced 2025 research data                      |
| `npm run seed:research:comprehensive` | Seed comprehensive research database                  |
| `npm run seed:heat-travel`            | Seed heat treatment & travel recovery protocols       |
| `npm run seed:dashboard`              | Seed dashboard sample data                            |
| `npm run seed:all`                    | Run all core seeding scripts                          |

## Database Utilities

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `npm run db:audit`  | Run database audit            |
| `npm run db:tables` | List all Supabase tables      |
| `npm run verify:db` | Verify database objects exist |

## Diagnostics & Health Checks

| Command                        | Description                |
| ------------------------------ | -------------------------- |
| `npm run diagnostics`          | Run diagnostic system      |
| `npm run diagnostics:health`   | Comprehensive health check |
| `npm run diagnostics:features` | Validate features          |
| `npm run health:check`         | Run health check           |

## Testing Scripts

| Command                 | Description                  |
| ----------------------- | ---------------------------- |
| `npm run test`          | Run Angular unit tests       |
| `npm run test:e2e`      | Run Playwright E2E tests     |
| `npm run test:privacy`  | Run privacy safety tests     |
| `npm run perf:validate` | Performance validation       |
| `npm run check:consent` | Check for consent violations |

## Build & Development

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `npm run dev`      | Start Angular development server   |
| `npm run dev:full` | Start both API and Angular servers |
| `npm run build`    | Build for production               |
| `npm run lint`     | Run ESLint                         |
| `npm run lint:fix` | Fix linting issues                 |

## Direct Script Files

### Validation & Auditing

- `verify-db-objects.cjs` - Verify database objects
- `check-consent-violations.cjs` - Check GDPR consent violations
- `performance-validation.cjs` - Performance benchmarks
- `validate-design-system.cjs` - Design system validation
- `database-audit.js` - Database audit utility
- `comprehensiveDatabaseAudit.cjs` - Comprehensive DB audit
- `check-acwr-consistency.js` - ACWR (Acute:Chronic Workload Ratio) consistency

### Testing

- `test-automation.js` - Automated testing suite
- `test-all-api-endpoints.js` - API endpoint tests
- `test-dashboard.js` - Dashboard tests
- `test-charts.js` - Chart rendering tests
- `test-login.js` - Login flow tests
- `test-responsive-pages.js` - Responsive design tests
- `test-hydration-system.js` - Hydration system tests
- `test-supabase-connection.js` - Supabase connection test

### Build Tools

- `build.js` - Main build script
- `build-js.js` - JavaScript bundling
- `build-css.js` - CSS processing
- `build-angular.sh` - Angular build script
- `inject-env-into-html.js` - Environment injection

### Utilities

- `update-packages.js` - Package update helper
- `fix-jws-vulnerability.js` - JWS security fix (runs on postinstall)
- `clear-service-worker.js` - Clear service worker cache
- `setup-local-env.js` - Local environment setup
- `migrate-to-unified-storage.js` - Storage migration utility

### Code Quality

- `fix-console-logs.js` - Clean up console logs
- `fix-duplicate-imports.js` - Fix duplicate imports
- `fix-innerhtml.js` - Fix innerHTML security issues
- `fix-module-scripts.js` - Fix module script issues
- `add-security-headers.js` - Add security headers

### Wireframe Processing

- `process-wireframes.js` - Process wireframe files
- `process-wireframes-simple.js` - Simplified wireframe processing
- `process-knowledge-base.js` - Knowledge base processing

### Component Updates

- `update-footer-component.js` - Footer component updates
- `update-sidebar-component.js` - Sidebar component updates
- `update-topbar-component.js` - Topbar component updates

## Archive Directory

The `archive/` directory contains deprecated or superseded scripts that are kept for reference:

- Duplicate `.js` versions of `.cjs` scripts
- Older versions of seed scripts (e.g., non-corrected versions)
- Theme/styling scripts that have been integrated elsewhere

## Environment Requirements

Most scripts require:

- `DATABASE_URL` - PostgreSQL connection string (Supabase)
- Node.js 20+
- npm 10+

## Usage Examples

```bash
# Seed all core databases
npm run seed:all

# Run a single seed script
npm run seed:hydration

# Verify database is properly set up
npm run verify:db

# Run comprehensive health check
npm run diagnostics:health
```
