# Phase 3 - Risk Migration Complete

**Date:** January 2026  
**Priority:** 1 (Safety - CRITICAL)  
**Status:** ✅ **MIGRATED**

---

## What Was Migrated

### ✅ 1. Roster Player Card (`roster-player-card.component.ts`)

**Before:**
```typescript
<div class="risk-badge" [class]="'risk-' + enrichedPlayer().riskLevel">
  <i class="pi pi-exclamation-triangle"></i>
  {{ enrichedPlayer().riskLevel | titlecase }}
</div>
```

**After:**
```typescript
<app-semantic-meaning-renderer
  [meaning]="riskMeaning()"
  [context]="{ container: 'card', priority: getRiskPriority(), dismissible: false }"
></app-semantic-meaning-renderer>
```

**Changes:**
- ✅ Created `riskMeaning` computed signal that converts player risk level to semantic `RiskMeaning`
- ✅ Maps `PlayerRiskLevel` → `RiskMeaning["severity"]`
- ✅ Determines risk source (acwr, readiness, injury-status)
- ✅ Uses risk assessment factors and recommendations
- ✅ Removed direct risk badge HTML

### ✅ 2. ACWR Dashboard (`acwr-dashboard.component.ts`)

**Before:**
```typescript
<!-- Alert Banner -->
<div class="alert-banner" [class]="'alert-' + topAlert()!.severity">
  <!-- Risk alert content -->
</div>

<!-- Risk Zone Indicator -->
<div class="risk-zone-indicator" [style.background-color]="riskZone().color">
  <!-- Risk zone content -->
</div>
```

**After:**
```typescript
<!-- Alert Banner - Semantic Risk Meaning -->
@if (alertRiskMeaning()) {
  <app-semantic-meaning-renderer
    [meaning]="alertRiskMeaning()!"
    [context]="{ container: 'banner', priority: 'critical', dismissible: true }"
  ></app-semantic-meaning-renderer>
}

<!-- Risk Zone Indicator - Semantic Risk Meaning -->
@if (riskZoneMeaning()) {
  <app-semantic-meaning-renderer
    [meaning]="riskZoneMeaning()!"
    [context]="{ container: 'inline', priority: 'high', dismissible: false }"
  ></app-semantic-meaning-renderer>
}
```

**Changes:**
- ✅ Created `alertRiskMeaning` computed signal for risk alerts
- ✅ Created `riskZoneMeaning` computed signal for elevated/danger zones
- ✅ Maps alert severity → risk severity (warning → moderate, critical → critical)
- ✅ Maps zone level → risk severity (elevated-risk → high, danger-zone → critical)
- ✅ Only shows risk meaning for actual risks (not sweet-spot or under-training)
- ✅ Fallback alert banner for non-risk alerts (info)

### ✅ 3. Coach Dashboard (`coach-dashboard.component.ts`)

**Before:**
```typescript
@if (alert.alertType === 'high_acwr' && alert.acwr && alert.acwr > 1.3) {
  <p-tag
    value="Action Required"
    severity="warning"
    styleClass="action-required-tag"
  ></p-tag>
}
```

**After:**
```typescript
@if (alert.alertType === 'high_acwr' && alert.acwr && alert.acwr > 1.3) {
  @if (getRiskMeaningForAlert(alert)) {
    <app-semantic-meaning-renderer
      [meaning]="getRiskMeaningForAlert(alert)!"
      [context]="{ container: 'inline', priority: alert.acwr > 1.5 ? 'critical' : 'high', dismissible: false }"
    ></app-semantic-meaning-renderer>
  }
}
```

**Changes:**
- ✅ Created `getRiskMeaningForAlert()` method to convert alerts to semantic risk meanings
- ✅ Fixed semantic error: "Action Required" tag was actually showing RISK, not action required
- ✅ Maps ACWR value → risk severity (1.3-1.5 → high, >1.5 → critical)
- ✅ Provides player-specific recommendations

---

## Semantic Rules Enforced

### ✅ Risk = Red ONLY

**All risk indicators now use:**
- ✅ Red color (`var(--color-status-error)`) for ALL risk levels
- ✅ Severity handled by opacity/intensity, NOT color:
  - Low: 0.4 opacity
  - Moderate: 0.6 opacity
  - High: 0.9 opacity
  - Critical: 1.0 opacity + pulse animation

**Never Again:**
- ❌ Yellow risk (was used in player cards)
- ❌ Orange risk (was used in ACWR dashboard)
- ❌ Color swaps for severity

### ✅ Consistent Component

**All risk indicators now use:**
- ✅ `<app-semantic-meaning-renderer>` component
- ✅ Same `RiskMeaning` type structure
- ✅ Same semantic renderer service

### ✅ Consistent Placement

**Placement rules enforced:**
- ✅ Player Cards: `container: 'card'` → top-right placement
- ✅ Dashboards: `container: 'banner'` → top placement
- ✅ Inline: `container: 'inline'` → inline placement

---

## Files Modified

1. ✅ `angular/src/app/features/roster/components/roster-player-card.component.ts`
   - Added semantic meaning imports
   - Created `riskMeaning` computed signal
   - Replaced risk badge HTML with semantic renderer

2. ✅ `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts`
   - Added semantic meaning imports
   - Created `alertRiskMeaning` computed signal
   - Created `riskZoneMeaning` computed signal
   - Replaced alert banner and risk zone indicator with semantic renderers

3. ✅ `angular/src/app/features/dashboard/coach-dashboard.component.ts`
   - Added semantic meaning imports
   - Created `getRiskMeaningForAlert()` method
   - Replaced "Action Required" tag with semantic risk renderer

---

## Verification Checklist

After migration, verify:

- [ ] **Red always means risk** - All risk indicators use red color
- [ ] **Same component everywhere** - All use `<app-semantic-meaning-renderer>`
- [ ] **Same placement rules** - Cards → top-right, Dashboards → top, Inline → inline
- [ ] **Severity via intensity** - Low/moderate/high/critical use opacity, not color
- [ ] **No yellow risk** - Yellow no longer used for risk
- [ ] **No orange risk** - Orange no longer used for risk (except incomplete data)

---

## Next Steps

### Priority 2 — Coach Override (Trust)
- [ ] Migrate coach override indicators to semantic meanings
- [ ] Ensure blue color everywhere
- [ ] Ensure no silent overrides

### Priority 3 — Incomplete Data (Accuracy)
- [ ] Migrate incomplete data indicators to semantic meanings
- [ ] Ensure orange color everywhere
- [ ] Attach to affected metrics

### Priority 4 — Action Required (Flow)
- [ ] Migrate action required indicators to semantic meanings
- [ ] Ensure white surface + border everywhere
- [ ] Ensure actions are clickable

---

**Status:** ✅ **Priority 1 (Risk) Migration Complete**

All risk indicators now use semantic meanings. Risk = Red always. Severity = Intensity always.

