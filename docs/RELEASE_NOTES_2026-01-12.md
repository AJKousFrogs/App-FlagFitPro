# Release Notes - January 12, 2026

## Summary

This release fixes multiple frontend-backend alignment issues identified through console error analysis, including Chart.js integration, API endpoint corrections, and comprehensive database schema updates.

---

## 📋 Configuration & CI/CD

### netlify.toml Updates
The `netlify.toml` configuration includes 95+ API route redirects. Key additions in January 2026:

| New Route | Function | Purpose |
|-----------|----------|---------|
| `/api/wellness-checkin` | `wellness-checkin.cjs` | Wellness check-in POST endpoint |
| `/api/exercises` | `exercises.cjs` | Unified exercise library |
| `/api/coach-alerts` | `coach-alerts.cjs` | Coach alert management |
| `/api/coach-inbox` | `coach-inbox.cjs` | Coach inbox notifications |
| `/api/micro-sessions` | `micro-sessions.cjs` | Quick training sessions |
| `/api/team-templates` | `team-templates.cjs` | Reusable training templates |
| `/api/ai-review` | `ai-review.cjs` | AI response review queue |

### CI/CD Pipeline (`.github/workflows/ci.yml`)
The CI pipeline includes:
- **Lint**: ESLint on Angular codebase
- **Type Check**: TypeScript compilation check
- **Unit Tests**: Karma/Jasmine tests with coverage
- **E2E Smoke**: Playwright smoke tests
- **Build**: Production build verification

Node.js version: **22** (latest LTS)

---

## 🐛 Bug Fixes

### 1. Chart Component Fixes
**Issue**: `t.clear is not a function` and `a.createComponent is not a function` errors appearing 40+ times in console.

**Root Cause**: PrimeNG 21's `UIChart` component export structure changed, breaking the dynamic component loading in `LazyChartComponent`.

**Fix**: Rewrote `lazy-chart.component.ts` to use Chart.js directly instead of dynamically loading PrimeNG's UIChart component.

**Files Changed**:
- `angular/src/app/shared/components/lazy-chart/lazy-chart.component.ts`

---

### 2. API Endpoint Path Corrections
**Issue**: Various 500 and 404 errors from incorrect API endpoint paths.

**Fixes**:
| Incorrect Path | Correct Path | Description |
|----------------|--------------|-------------|
| `/api/wellness/checkin` | `/api/wellness-checkin` | Wellness check-in POST endpoint |
| `/api/coach/games` | `/api/games` | Games endpoint (role-based filtering server-side) |

**Files Changed**:
- `angular/src/app/core/services/api.service.ts` - Updated `API_ENDPOINTS`
- `angular/src/app/core/services/wellness.service.ts` - Fixed direct API call
- `angular/src/app/core/services/officials.service.ts` - Fixed games endpoint

---

### 3. Smart Training Form Fix
**Issue**: `Could not find the 'equipment' column of 'training_sessions' in the schema cache`

**Root Cause**: Form was trying to insert `equipment` array into a column that doesn't exist.

**Fix**: Modified insert to store equipment info in the `notes` field instead of a non-existent column.

**Files Changed**:
- `angular/src/app/features/training/smart-training-form/smart-training-form.component.ts`

---

## 🗄️ Database Migrations

### Migration 1: `20260112_fix_missing_schema_elements.sql`

**New Columns**:
- `team_invitations.message` - Optional message from coach when sending invitation

**New Tables**:
- `recovery_protocols` - Generic recovery protocols
- `recovery_sessions` (updated with `protocol_id` FK)

---

### Migration 2: `20260112_add_missing_tables_for_frontend.sql`

**Column Additions to Existing Tables**:

| Table | New Columns |
|-------|-------------|
| `exercises` | `target_muscles TEXT[]`, `equipment_required TEXT[]` |
| `isometrics_exercises` | `target_muscles TEXT[]`, `instructions TEXT[]`, `hold_duration_seconds`, `sets`, `reps` |
| `plyometrics_exercises` | `target_muscles TEXT[]`, `coaching_cues TEXT[]` |
| `training_sessions` | `is_outdoor`, `scheduled_date`, `intensity` |

**New Tables Created (17 total)**:

| Category | Tables |
|----------|--------|
| **Coach System** | `coach_inbox_items`, `coach_alert_acknowledgments`, `team_templates`, `template_assignments` |
| **AI System** | `ai_followups`, `user_ai_preferences`, `classification_history`, `conversation_context`, `ai_review_queue` |
| **Youth Athletes** | `user_age_groups`, `youth_athlete_settings`, `parent_guardian_links`, `parent_notifications` |
| **Analytics** | `acwr_history`, `digest_history`, `micro_sessions`, `micro_session_analytics` |

All new tables include:
- ✅ UUID primary keys
- ✅ Row Level Security (RLS) enabled
- ✅ Appropriate RLS policies
- ✅ Foreign key constraints
- ✅ Performance indexes

---

## 📚 Documentation Updates

| Document | Changes |
|----------|---------|
| `API.md` | Updated to v2.2, corrected wellness/coach endpoints, added exercises endpoint |
| `DATABASE_SETUP.md` | Updated to v2.4, added new tables/columns, updated changelog |
| `ARCHITECTURE.md` | Updated to v2.3, status updated to 88% complete |
| `TROUBLESHOOTING.md` | Added database schema errors section, API endpoint errors section, Chart component fixes |

---

## 🔧 Testing Checklist

After applying these changes, verify:

- [ ] Charts render without errors on dashboard, analytics, and wellness pages
- [ ] Wellness check-in submits successfully without 500 errors
- [ ] Coach dashboard loads games without 404 errors
- [ ] Training form creates sessions without schema errors
- [ ] Team invitations work with optional message field
- [ ] Recovery sessions can be linked to recovery protocols

---

## 🚀 Deployment Steps

1. **Pull latest code**
   ```bash
   git pull origin main
   ```

2. **Apply database migrations** (if not using Supabase MCP)
   ```bash
   # Via Supabase CLI
   supabase db push
   
   # Or manually in Supabase Dashboard SQL Editor
   # Run: supabase/migrations/20260112_fix_missing_schema_elements.sql
   # Run: supabase/migrations/20260112_add_missing_tables_for_frontend.sql
   ```

3. **Rebuild Angular app**
   ```bash
   cd angular
   npm run build
   ```

4. **Deploy to Netlify**
   ```bash
   netlify deploy --prod
   ```

---

_Release prepared by: AI Assistant_  
_Date: January 12, 2026_
