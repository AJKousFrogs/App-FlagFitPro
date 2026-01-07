# Canonical Pages — Design System Exemplars

**Status:** ✅ **FROZEN**  
**Effective Date:** January 2026  
**Purpose:** Establish design system exemplars that all future refactors will reference  
**Rule:** Future refactors copy **FROM** canonical pages, never **INTO** them.

---

## 🎯 Purpose

These pages serve as the **single source of truth** for correct design system implementation. They are:

1. **Frozen** — No refactoring allowed without explicit approval
2. **Exemplars** — All new pages must follow their patterns
3. **Reference** — Future refactors copy FROM these pages, never INTO them
4. **Protected** — Changes require design system curator approval

---

## 📋 Canonical Pages List

### 1. Player Dashboard ⭐ **PRIMARY EXEMPLAR**

**Route:** `/player-dashboard`  
**Component:** `PlayerDashboardComponent`  
**File:** `angular/src/app/features/dashboard/player-dashboard.component.ts`  
**Status:** ✅ **CANONICAL**

**Why Selected:**
- Most heavily used page (primary entry point for all players)
- Represents core player workflow (daily check-in, readiness, training overview)
- Already demonstrates good design system usage:
  - Uses design tokens (`var(--space-*)`, `var(--ds-*)`)
  - Minimal PrimeNG overrides (only via styleClass bindings)
  - No `!important` declarations
  - No raw colors or spacing values
  - Uses semantic meaning components (Phase 3)
- Can be cleaned without blocking business logic
- Comprehensive example of dashboard patterns

**Core Patterns Demonstrated:**
- ✅ Stat cards with icon + text layout (left-aligned icons)
- ✅ Card headers with custom styling
- ✅ Timeline components
- ✅ Progress indicators
- ✅ Empty states
- ✅ Loading states
- ✅ Responsive grid layouts
- ✅ Semantic meaning badges (risk, incomplete data, action required)

**Design System Compliance:**
- ✅ All spacing uses tokens (`var(--space-*)`)
- ✅ All colors use tokens (`var(--ds-*)`, `var(--color-*)`)
- ✅ No PrimeNG overrides in component SCSS
- ✅ No `!important` declarations
- ✅ No `[rounded]="true"` usage
- ✅ Proper use of semantic components

---

### 2. Coach Dashboard

**Route:** `/coach/dashboard`  
**Component:** `CoachDashboardComponent`  
**File:** `angular/src/app/features/dashboard/coach-dashboard.component.ts`  
**Status:** ✅ **CANONICAL**

**Why Selected:**
- Core coach workflow (team overview, player monitoring, risk alerts)
- Heavily used by all coaches
- Represents team management patterns
- Can be cleaned without blocking business logic

**Core Patterns Demonstrated:**
- ✅ Team overview statistics
- ✅ Player roster table
- ✅ Risk alerts and priority athletes
- ✅ Charts and data visualization
- ✅ Filter and search patterns
- ✅ Action buttons and CTAs

**Design System Compliance:**
- ⚠️ **Needs cleanup:** Contains some PrimeNG overrides and raw values
- ✅ Will be cleaned to full compliance before canonical freeze

---

### 3. Roster Management

**Route:** `/roster`  
**Component:** `RosterComponent`  
**File:** `angular/src/app/features/roster/roster.component.ts`  
**Status:** ✅ **CANONICAL**

**Why Selected:**
- Core team management workflow
- Heavily used by coaches and admins
- Represents data table patterns
- Represents CRUD operations (create, read, update, delete)
- Can be cleaned without blocking business logic

**Core Patterns Demonstrated:**
- ✅ Data tables with sorting/filtering
- ✅ Player cards with metrics
- ✅ Form dialogs (add/edit)
- ✅ Search and filter UI
- ✅ Status badges and tags
- ✅ Bulk actions

**Design System Compliance:**
- ⚠️ **Needs cleanup:** Contains some violations
- ✅ Will be cleaned to full compliance before canonical freeze

---

### 4. ACWR Dashboard

**Route:** `/acwr-dashboard`  
**Component:** `AcwrDashboardComponent`  
**File:** `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts`  
**Status:** ✅ **CANONICAL**

**Why Selected:**
- Key injury prevention workflow
- Represents data visualization patterns
- Represents risk assessment UI
- Used by both players and coaches
- Can be cleaned without blocking business logic

**Core Patterns Demonstrated:**
- ✅ Chart visualizations
- ✅ Risk zone indicators
- ✅ Data confidence indicators
- ✅ Alert banners
- ✅ Progress tracking
- ✅ Metric displays

**Design System Compliance:**
- ⚠️ **Needs cleanup:** Contains `!important` declarations
- ✅ Will be cleaned to full compliance before canonical freeze

---

### 5. Training Schedule

**Route:** `/training`  
**Component:** `TrainingComponent`  
**File:** `angular/src/app/features/training/training.component.ts`  
**Status:** ✅ **CANONICAL**

**Why Selected:**
- Core training workflow
- Represents calendar/schedule patterns
- Used by all players
- Can be cleaned without blocking business logic

**Core Patterns Demonstrated:**
- ✅ Calendar views
- ✅ Schedule lists
- ✅ Session cards
- ✅ Date navigation
- ✅ Filter patterns

**Design System Compliance:**
- ⚠️ **Needs cleanup:** Contains violations
- ✅ Will be cleaned to full compliance before canonical freeze

---

## 🔒 Freeze Rules

### Rule 1: Copy FROM, Never INTO

**✅ CORRECT:**
```typescript
// New component copying FROM canonical page
import { PlayerDashboardComponent } from '@features/dashboard/player-dashboard.component';

// Copy the stat card pattern
const statCardPattern = {
  display: 'flex',
  gap: 'var(--space-4)',
  // ... copied from player-dashboard
};
```

**❌ FORBIDDEN:**
```typescript
// Modifying canonical page to match new component
// NEVER do this - canonical pages are frozen
```

### Rule 2: Approval Required for Changes

Any changes to canonical pages require:
1. Design system curator approval
2. Documentation update
3. Impact assessment
4. Migration plan (if breaking)

### Rule 3: Reference in All Refactors

When refactoring any page:
1. Check canonical pages first
2. Copy patterns FROM canonical pages
3. Document deviations (with approval)

---

## 📊 Cleanup Status

| Page | Current Status | Cleanup Required | Target Date |
|------|---------------|------------------|-------------|
| **Player Dashboard** | ✅ Compliant | None | N/A |
| **Coach Dashboard** | ⚠️ Needs cleanup | PrimeNG overrides, raw values | 2026-Q1 |
| **Roster** | ⚠️ Needs cleanup | PrimeNG overrides, raw colors | 2026-Q1 |
| **ACWR Dashboard** | ⚠️ Needs cleanup | `!important`, raw values | 2026-Q1 |
| **Training Schedule** | ⚠️ Needs cleanup | Raw spacing, colors | 2026-Q1 |

---

## 🎯 Usage Guidelines

### For New Pages

1. **Start with a canonical page** as your template
2. **Copy patterns** (spacing, colors, components)
3. **Follow the same structure** (sections, cards, layouts)
4. **Use the same tokens** (no raw values)

### For Refactoring Existing Pages

1. **Compare** your page to canonical pages
2. **Identify differences** (what's different and why)
3. **Align with canonical patterns** (copy FROM canonical)
4. **Document deviations** (if approved)

### For Component Development

1. **Check canonical pages** for component usage examples
2. **Follow the same patterns** (props, styling, behavior)
3. **Use the same tokens** (spacing, colors, typography)

---

## 📝 Documentation Updates

When canonical pages are updated (with approval):

1. Update this document with change log
2. Notify all developers of pattern changes
3. Update design system documentation
4. Update component library examples

---

## 🔍 Verification Checklist

Before marking a page as canonical, verify:

- [ ] Page is heavily used (high traffic/importance)
- [ ] Page represents core workflow
- [ ] Page can be cleaned without blocking business logic
- [ ] Page demonstrates correct design system usage:
  - [ ] All spacing uses tokens (`var(--space-*)`)
  - [ ] All colors use tokens (`var(--ds-*)`, `var(--color-*)`)
  - [ ] No PrimeNG overrides in component SCSS
  - [ ] No `!important` declarations (or documented exceptions)
  - [ ] No `[rounded]="true"` usage
  - [ ] No raw spacing values (px/rem)
  - [ ] No raw colors (hex/rgb)
  - [ ] Proper use of semantic components
- [ ] Page is well-documented
- [ ] Page has been reviewed by design system curator

---

## 🚨 Violations Found

### Player Dashboard
- ✅ **No violations** — Fully compliant

### Coach Dashboard
- ⚠️ PrimeNG overrides in component SCSS
- ⚠️ Raw spacing values
- ⚠️ Raw colors

### Roster
- ⚠️ PrimeNG overrides in component SCSS
- ⚠️ Raw colors

### ACWR Dashboard
- ⚠️ `!important` declarations (33 instances)
- ⚠️ PrimeNG overrides
- ⚠️ Raw spacing values

### Training Schedule
- ⚠️ Raw spacing values
- ⚠️ Raw colors

---

## 📅 Timeline

1. **Phase 1: Freeze Player Dashboard** ✅ **COMPLETE**
   - Player Dashboard is already compliant
   - Marked as canonical exemplar

2. **Phase 2: Cleanup Other Canonical Pages** ⏳ **IN PROGRESS**
   - Clean Coach Dashboard (2026-Q1)
   - Clean Roster (2026-Q1)
   - Clean ACWR Dashboard (2026-Q1)
   - Clean Training Schedule (2026-Q1)

3. **Phase 3: Documentation** ⏳ **IN PROGRESS**
   - Document all patterns
   - Create usage examples
   - Update component library

4. **Phase 4: Enforcement** ⏳ **PENDING**
   - Add linting rules
   - Add code review checks
   - Add CI/CD validation

---

## 📚 Related Documents

- [Design System Rules](./DESIGN_SYSTEM_RULES.md)
- [Phase 4 Audit](./PHASE_4_UI_TO_DESIGN_SYSTEM_AUDIT.md)
- [Component Contracts](./PHASE_3_COMPONENT_CONTRACTS.md)

---

**Last Updated:** January 2026  
**Next Review:** 2026-Q2  
**Maintained By:** Design System Curator

