# Frontend Legacy, Deprecated & Bug Audit (Revised)

**Audit Date:** February 11, 2026  
**Last Run:** Post-fix verification  
**Scope:** Dark theme, search bar, navigation, deprecated code, potential bugs, obsolete patterns  
**Framework:** Angular 21 + PrimeNG 21

---

## Executive Summary

Following comprehensive fixes, the frontend is in **good shape**. Remaining items are intentional backward-compatibility shims or deferred work with clear documentation.

| Category | Status |
|----------|--------|
| Dark Theme | ✅ Fixed – simplified ThemeService, addEventListener + cleanup |
| Deprecated Tokens | ✅ Fixed – removed unused font tokens |
| Legacy Code | ✅ Fixed – roster-utils, SearchService, error.utils |
| Potential Bugs | ✅ Fixed – TODOs resolved, coach nav, cycle export, audit log |
| Search / Nav | ✅ No issues |

---

## 1. Dark Theme

### 1.1 ThemeService (Fixed)

- **updatePrimeNGTheme()**: Removed no-ops; only essential overrides remain
- **Media query**: Uses `addEventListener` only; `ngOnDestroy` cleans up listener
- **Selectors**: `[data-theme]`, `.dark-theme`, `body.dark-theme` used consistently

---

## 2. Deprecated Font Tokens (Fixed)

Removed from `design-system-tokens.scss`:
- `--font-display-*`, `--font-heading-*`, `--font-body-*`
- `--font-compact-sm`, `--font-compact-xs`

Kept: `--font-compact-lg`, `--font-compact-md` (in use)

---

## 3. Legacy & Obsolete Code

### 3.1 Resolved

| Item | Fix |
|------|-----|
| roster-utils getCountryFlag/getCountryCode | Removed re-export; imports use `@core/constants` |
| SearchService.getSuggestions | Removed (unused; callers use getInstantSuggestions) |
| error.utils ErrorHandlerUtil comment | Removed obsolete reference |

### 3.2 Intentional (kept for compatibility)

| Item | Notes |
|------|-------|
| TrainingSession.date, type, duration, intensity | Aliases for API compatibility; canonical fields preferred |
| today-state.resolver availability | Inline comment documents deprecation; no code change |

---

## 4. TODOs Resolved

| Location | Resolution |
|----------|------------|
| privacy-controls showAuditLog | Implemented audit log dialog via AccountDeletionService.getAuditLog() |
| coach-override askCoach | Navigates to `/team-chat` |
| cycle-tracking exportData | Implemented CSV export from cycleHistory |
| superadmin edit/view user, view team | Toast “coming soon” feedback |
| today CTAs | Navigate to training, film-room, return-to-play, team-chat, advanced |
| player-dashboard training days | Comment clarified; uses stats when available |
| design-tokens full radius | Comment updated; prefer --radius-button for buttons |
| calendar-coach RSVP | Comment clarified |
| privacy-settings guardian email | Comment clarified; needs email integration |
| logger error tracking | Comment clarified |

### Remaining (all resolved)

| Location | Resolution |
|----------|------------|
| evidence-config.service.spec | Fixed: mock SupabaseService + AuthService in TestBed; tests run |
| SearchService.getSuggestions | Removed (unused; callers use getInstantSuggestions) |

---

## 5. Search Bar & Navigation

- **Header**: OK
- **SearchPanel**: Uses `getInstantSuggestions`; no issues
- **Sidebar**: OK; role-based nav
- **HeaderService**: OK

---

## 6. Files Touched (This Audit)

| Area | Files |
|------|-------|
| Theme | theme.service.ts |
| Search | search.service.ts |
| Roster | roster-utils.ts, roster.component.ts, roster-player-card, tournaments |
| Tokens | design-system-tokens.scss, design-tokens.ts |
| Privacy | privacy-controls.component.ts |
| Coach override | coach-override-notification.component.ts |
| Cycle tracking | cycle-tracking.component.ts |
| Superadmin | superadmin-users, superadmin-teams |
| Today | today.component.ts |
| Other | player-dashboard, calendar-coach, privacy-settings, logger.service |

---

## 7. Verification

- **Build**: ✅ `npm run build` passes
- **Type check**: ✅ `tsc --noEmit` passes

---

*Audit revised after fixes — February 11, 2026*
