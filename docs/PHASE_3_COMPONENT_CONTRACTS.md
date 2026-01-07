# Phase 3 — Unified Component Contracts

**Generated:** January 2026  
**Purpose:** Define standardized usage rules for unified UI components  
**Status:** ✅ Components Created

---

## Overview

This document defines the contracts for the four unified components created to resolve visual contradictions identified in Phase 3 audit:

1. **Risk Badge** (`app-risk-badge`)
2. **Incomplete Data Badge** (`app-incomplete-data-badge`)
3. **Action Required Badge** (`app-action-required-badge`)
4. **Coach Override Badge** (`app-coach-override-badge`)

---

## Component Contract Rules

### Rule 1: Same Component
**Every meaning MUST use the same component across all contexts.**

- ✅ Risk → Always use `app-risk-badge`
- ✅ Incomplete Data → Always use `app-incomplete-data-badge`
- ✅ Action Required → Always use `app-action-required-badge`
- ✅ Coach Override → Always use `app-coach-override-badge`

### Rule 2: Same Color
**Every meaning MUST use the same color scale across all contexts.**

#### Risk Color Scale
- **Low**: `var(--color-status-success)` (Green)
- **Moderate**: `var(--color-status-warning)` (Yellow)
- **High**: `var(--ds-primary-orange)` (Orange) - **NEW STANDARD**
- **Critical**: `var(--color-status-error)` (Red)

#### Incomplete Data Color Scale
- **Warning** (1-2 days): `var(--color-status-warning)` (Yellow)
- **Critical** (3+ days): `var(--color-status-error)` (Red)

#### Action Required Color Scale
- **Low**: `var(--color-status-info-subtle)` (Blue, subtle)
- **Medium**: `var(--color-status-warning-subtle)` (Yellow, subtle)
- **High**: `var(--ds-primary-orange)` (Orange)
- **Critical**: `var(--color-status-error)` (Red)

#### Coach Override Color Scale
- **All**: `var(--color-status-info)` (Blue) - Consistent across all contexts

### Rule 3: Same Placement
**Every meaning MUST use consistent placement rules across contexts.**

#### Risk Placement Rules
- **Player Cards**: `placement="top-right"` (absolute positioned)
- **Dashboards**: `placement="inline"` (within content flow)
- **Alert Banners**: `placement="banner"` (full-width, centered)

#### Incomplete Data Placement Rules
- **Player Cards**: `placement="top-right"` (absolute positioned)
- **Dashboards**: `placement="inline"` (within content flow)
- **Cards**: `placement="card"` (full-width within card)

#### Action Required Placement Rules
- **Top of Sections**: `placement="top"` (full-width, centered)
- **Inline with Content**: `placement="inline"` (within content flow)
- **Alert Banners**: `placement="banner"` (full-width, left-aligned)
- **As Button**: `placement="button"` (renders as button with route)

#### Coach Override Placement Rules
- **Player Dashboard**: `placement="top-right"` (absolute positioned)
- **Coach Roster**: `placement="inline"` (within table row)
- **Cards**: `placement="card"` (full-width within card)

---

## Component Usage Examples

### Risk Badge

```typescript
// Player Card - Top Right
<app-risk-badge 
  [level]="'high'" 
  [placement]="'top-right'"
  [showIcon]="true">
</app-risk-badge>

// ACWR Dashboard - Inline
<app-risk-badge 
  [level]="riskZone().level === 'danger-zone' ? 'critical' : 'high'" 
  [placement]="'inline'"
  [showIcon]="true">
</app-risk-badge>

// Alert Banner - Full Width
<app-risk-badge 
  [level]="'critical'" 
  [placement]="'banner'"
  [showIcon]="true">
</app-risk-badge>
```

### Incomplete Data Badge

```typescript
// Player Card - Top Right
<app-incomplete-data-badge 
  [severity]="missingStatus()!.severity"
  [dataType]="'wellness'"
  [daysMissing]="missingStatus()!.daysMissing"
  [placement]="'top-right'">
</app-incomplete-data-badge>

// Dashboard - Inline
<app-incomplete-data-badge 
  [severity]="'warning'"
  [dataType]="'training'"
  [daysMissing]="2"
  [placement]="'inline'">
</app-incomplete-data-badge>
```

### Action Required Badge

```typescript
// Top of Section
<app-action-required-badge 
  [actionType]="'complete-profile'"
  [urgency]="'high'"
  [placement]="'top'"
  [actionRoute]="['/profile']">
</app-action-required-badge>

// As Button
<app-action-required-badge 
  [actionType]="'modify-session'"
  [urgency]="'critical'"
  [placement]="'button'"
  [actionRoute]="['/training/log']">
</app-action-required-badge>
```

### Coach Override Badge

```typescript
// Player Dashboard - Top Right
<app-coach-override-badge 
  [overrideType]="'load-adjustment'"
  [placement]="'top-right'"
  [showTimestamp]="true"
  [timestamp]="override().createdAt">
</app-coach-override-badge>

// Coach Roster - Inline
<app-coach-override-badge 
  [overrideType]="'plan-change'"
  [placement]="'inline'"
  [showTag]="true">
</app-coach-override-badge>
```

---

## Migration Checklist

### Phase 1: Risk Indicators (CRITICAL)
- [ ] Replace `risk-badge` in `roster-player-card.component.ts`
- [ ] Replace `risk-zone-indicator` in `acwr-dashboard.component.ts`
- [ ] Replace alert banner risk indicators in `acwr-dashboard.component.ts`
- [ ] Replace `action-required-tag` for risk in `coach-dashboard.component.ts`
- [ ] Update all SCSS files to remove risk-specific styling

### Phase 2: Incomplete Data (HIGH)
- [ ] Replace `MissingDataExplanationComponent` card with badge in `player-dashboard.component.ts`
- [ ] Replace `missing-data-strip` with badges in `coach-dashboard.component.ts`
- [ ] Replace `ConfidenceIndicatorComponent` badge with `incomplete-data-badge` in `acwr-dashboard.component.ts`
- [ ] Replace inline missing data text in `ai-mode-explanation.component.ts`

### Phase 3: Action Required (HIGH)
- [ ] Replace `checklist-action-needed` in `player-dashboard.component.ts`
- [ ] Replace `action-required-tag` in `coach-dashboard.component.ts`
- [ ] Replace action buttons in `acwr-dashboard.component.ts` alert contract
- [ ] Replace "Action Required" text in `ownership-transition-badge.component.ts`

### Phase 4: Coach Override (MEDIUM)
- [ ] Replace `CoachOverrideNotificationComponent` badge with `coach-override-badge` in `player-dashboard.component.ts`
- [ ] Replace `override-badge` tag in `coach-dashboard.component.ts`
- [ ] Add badge to override notification header in `coach-override-notification.component.ts`

---

## Design Token Updates

### New Design Tokens Required

Add to `design-system-tokens.scss`:

```scss
/* Orange for High Risk (standardized) */
--ds-primary-orange: #f97316;
--ds-primary-orange-subtle: rgba(249, 115, 22, 0.1);
```

### Color Mapping Verification

Ensure these mappings are consistent:

```scss
/* Risk Levels */
--risk-low-color: var(--color-status-success);
--risk-moderate-color: var(--color-status-warning);
--risk-high-color: var(--ds-primary-orange);
--risk-critical-color: var(--color-status-error);

/* Incomplete Data */
--incomplete-warning-color: var(--color-status-warning);
--incomplete-critical-color: var(--color-status-error);

/* Action Required */
--action-low-color: var(--color-status-info-subtle);
--action-medium-color: var(--color-status-warning-subtle);
--action-high-color: var(--ds-primary-orange);
--action-critical-color: var(--color-status-error);

/* Coach Override */
--coach-override-color: var(--color-status-info);
```

---

## Testing Checklist

For each component, verify:

1. **Component Consistency**
   - ✅ Same component used across all contexts
   - ✅ Same props/inputs accepted
   - ✅ Same visual appearance

2. **Color Consistency**
   - ✅ Same color for same meaning
   - ✅ Color contrast meets WCAG AA (4.5:1)
   - ✅ Colors match design tokens

3. **Placement Consistency**
   - ✅ Same placement for same context
   - ✅ Responsive behavior correct
   - ✅ Z-index handling correct

4. **Accessibility**
   - ✅ Tooltips provide context
   - ✅ ARIA labels present
   - ✅ Keyboard navigation works
   - ✅ Screen reader announcements correct

---

## Breaking Changes

### Before Phase 3
- Risk indicators used 4 different components
- Incomplete data used 4 different components
- Action required used 4 different components
- Coach override used 3 different components

### After Phase 3
- **All** risk indicators use `app-risk-badge`
- **All** incomplete data indicators use `app-incomplete-data-badge`
- **All** action required indicators use `app-action-required-badge`
- **All** coach override indicators use `app-coach-override-badge`

---

## Status

✅ **Components Created**
- ✅ Risk Badge Component
- ✅ Incomplete Data Badge Component
- ✅ Action Required Badge Component
- ✅ Coach Override Badge Component

⏳ **Next Steps**
- Replace all instances with unified components
- Update design tokens
- Verify consistency across all contexts
- Update documentation

---

**This contract ensures visual consistency and eliminates UI contradictions identified in Phase 3 audit.**

