# UX-READY / UI-READY CRITERIA

**Audit Date:** 2026-02-10  
**Scope:** FlagFit Pro Angular 21 Application  
**Type:** Gate Audit — Determines readiness for UI Polish Phase

---

## 1) VERDICT

# UI-READY: **YES — with conditions**

The app is **structurally ready** for UI polishing. UX flows are complete, design system exists and is enforced, and most screens follow canonical patterns. **Conditional YES** because a subset of screens lack page-level error handling; polishing those specific screens without fixing that gap would risk masking broken UX.

---

## 2) IF NO — REASONS (Conditional items)

The following **SOFT BLOCKERS** should be addressed before polishing the affected screens. Polish can proceed on all other screens.

### Screens Missing Page-Level Error State

| Screen | Route | Issue | Status |
|--------|-------|-------|--------|
| Game Tracker | `/game-tracker` | No `app-page-error-state`. API failure would show "No Games Scheduled" empty state, misleading users. | ✅ **FIXED** (2026-02-10) |
| Community | `/community` | Has `isLoadingMore` for infinite scroll; no page-level error for initial load. | ✅ **FIXED** (2026-02-10) |
| Settings | `/settings`, `/settings/*` | No visible page-level error state for initial load. | Deferred (multi-source form; low risk) |
| Legal (Terms/Privacy) | `/terms`, `/privacy` | — | Already has loading + error state |
| Not Found | `/**` | Intentional minimal page; no data load. | N/A |

### Screens Using Custom Loading (Acceptable but Inconsistent)

These screens use `isLoading` with custom skeletons or inline UI instead of canonical `app-loading` + `app-page-error-state`. UX is functional; polish can standardize later:

- Training Schedule (inline skeleton/error in card)
- Today / Daily Protocol (protocol-specific loading)
- Superadmin suite (custom loading display)
- Onboarding (multi-step, custom loading)
- Various coach/staff dashboards (custom skeletons)

**Risk:** Low. These screens handle loading; they diverge from the canonical Loading → Error → Content pattern but do not hide failures.

---

## 3) IF YES — ASSUMPTIONS AND CONSTRAINTS

### Assumptions UI Polish Can Safely Make

1. **Layout structure is stable**
   - `app-main-layout` wraps authenticated content.
   - `app-page-header` (title, subtitle, icon, actions) is the standard header pattern.
   - Content uses `.section-stack`, `app-card` / `p-card` / `app-card-shell` for grouping.

2. **Design system is the source of truth**
   - Tokens live in `design-system-tokens.scss`.
   - Spacing: `var(--space-*)`, typography: `var(--ds-font-*)`, colors: `var(--color-*)`, `var(--ds-primary-green)`, etc.
   - PrimeNG variables mapped in `primeng-integration.scss` and `_token-mapping.scss`.

3. **Semantic states use structure + copy**
   - Status: `app-status-tag` with `severity` (not color alone).
   - Semantic meanings use `MEANING_VISUAL_GRAMMAR` (color + icon + copy).
   - Risk = red + warning icon; incomplete data = amber + hourglass; etc.

4. **Dark mode is token-driven**
   - `[data-theme="dark"]` and `.dark-theme` selectors exist.
   - Theme service sets `data-theme` on `<html>` and `<body>`.
   - No hardcoded light assumptions; tokens resolve for both themes.

### What Must NOT Change During Polish

1. **No UX flow changes**
   - Do not add, remove, or reorder screens or primary actions.
   - Do not change conditional rendering logic (e.g., `needsProgramAssignment()`, role-based visibility).
   - Do not introduce new navigation patterns.

2. **No masking of missing states**
   - Do not add visual polish to screens that lack loading/error/empty handling without adding those states first.
   - Do not restyle error states to look like empty states.

3. **No layout or structure redesign**
   - Do not change page hierarchy (header, sections, content order).
   - Do not replace `app-main-layout` or `app-page-header` with custom patterns.

4. **No new PrimeNG adoption for polish only**
   - Do not introduce PrimeNG components solely for aesthetics.
   - Existing PrimeNG usage can be styled; swap only where structure already supports it.

---

## 4) CHECKLIST — UI POLISH IS ALLOWED WHEN ALL THESE ARE TRUE

For **each screen** being polished:

- [ ] **Loading state** — Either canonical `app-loading` or a documented custom loading pattern (e.g. dashboard skeleton).
- [ ] **Error state** — Page-level `app-page-error-state` with retry for data-dependent screens.
- [ ] **Empty state** — `app-empty-state` (or equivalent) when list/data is legitimately empty.
- [ ] **Primary action** — Clear and reachable.
- [ ] **Exit path** — Back, cancel, or navigation to another screen.
- [ ] **Uses tokens** — No new hex colors, raw px, or hardcoded radius/shadow outside design system.
- [ ] **Dark mode safe** — No reliance on light-only contrast; semantic hierarchy preserved.

For **Game Tracker** specifically:

- [ ] Add `app-page-error-state` for games API failure before polishing.
- [ ] Add `app-loading` (or equivalent) for initial games fetch.

---

## 5) HANDOFF NOTE — UI Polish Phase

### PrimeNG Usage

- **Allowed:** Style existing PrimeNG components via `styleClass`, global token mapping, or documented overrides in `_exceptions.scss`.
- **Prohibited:** Introducing PrimeNG components only for visual polish.
- **Reference:** `primeng/_token-mapping.scss`, `primeng-integration.scss`, `docs/DESIGN_SYSTEM_RULES.md` — PrimeNG tokens, overlay tokens.

### Design System Usage

- **Canonical tokens:** `angular/src/scss/tokens/design-system-tokens.scss`
- **Spacing utilities:** `.p-*`, `.m-*`, `.gap-*` from design-system-tokens (single source of truth).
- **Layout utilities:** `.flex`, `.flex-row`, etc. from `layout-system.scss`.
- **Rules:** `docs/DESIGN_SYSTEM_RULES.md`, `angular/src/scss/README.design-system.md`.

### Dark Mode Rules

1. Use tokens only — no fixed light/dark assumptions.
2. Status/meaning: structure + copy first; color supports, not replaces.
3. Overlays: `--surface-elevated`, `--surface-border`, `--shadow-lg` for dialogs, dropdowns, tooltips.
4. Contrast: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted` for hierarchy.

### Canonical State Components

| State | Component | Usage |
|-------|-----------|-------|
| Loading | `app-loading` | Page overlay with `variant="skeleton"` or spinner |
| Error | `app-page-error-state` | `title`, `message`, `(retry)` for recoverable errors |
| Empty | `app-empty-state` | `title`/`heading`, `message`/`description`, optional `actionLabel` + `actionHandler` |

### Reference Screens (Do Not Redesign)

- **Player Dashboard** — `player-dashboard.component.ts` — Design system exemplar; copy patterns from here.
- **Roster** — `roster.component.ts` — Full Loading / Error / Empty pattern.
- **Wellness** — `wellness.component.ts` — Dense form + cards with proper states.
