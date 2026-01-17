# TypeScript Inline Styles Audit

**Date:** 2026-01-09  
**Status:** ⚠️ Requires Manual Review

## Overview

This document tracks hardcoded design values in TypeScript component files (inline styles). These are harder to migrate than SCSS files because they require code changes, not just CSS token replacements.

## Files with Inline Style Violations

### Staff Decision Components

**File:** `angular/src/app/features/staff/decisions/review-decision-dialog.component.ts`
- **Line 215:** `font-weight: 600` → Should use `DesignTokens.typography.fontWeight.semibold`
- **Line 226:** `font-weight: 600` → Should use `DesignTokens.typography.fontWeight.semibold`
- **Line 260:** `font-weight: 600` → Should use `DesignTokens.typography.fontWeight.semibold`

**File:** `angular/src/app/features/staff/decisions/decision-ledger-dashboard.component.ts`
- **Line 280:** `font-weight: 700` → Should use `DesignTokens.typography.fontWeight.bold`
- **Line 312:** `font-weight: 600` → Should use `DesignTokens.typography.fontWeight.semibold`

**File:** `angular/src/app/features/staff/decisions/decision-detail.component.ts`
- **Line 377:** `font-weight: 600` → Should use `DesignTokens.typography.fontWeight.semibold`
- **Line 434:** `font-weight: 600` → Should use `DesignTokens.typography.fontWeight.semibold`

**File:** `angular/src/app/features/staff/decisions/decision-card.component.ts`
- **Line 125:** `font-weight: 600` → Should use `DesignTokens.typography.fontWeight.semibold`

**File:** `angular/src/app/features/staff/decisions/create-decision-dialog.component.ts`
- **Line 314:** `font-weight: 600` → Should use `DesignTokens.typography.fontWeight.semibold`
- **Line 372:** `font-weight: 600` → Should use `DesignTokens.typography.fontWeight.semibold`

### Training Components

**File:** `angular/src/app/features/training/daily-training/daily-training.component.ts`
- **Line 684:** `line-height: 1.4` → Should use `DesignTokens.typography.unified.bodySm.lineHeight`
- **Line 842:** `transition: all 0.3s` → Should use transition tokens (note: "all" is forbidden per Decision 19)
- **Line 998:** `line-height: 1.6` → Should use `DesignTokens.typography.lineHeight.relaxed`

## Migration Strategy

### Option 1: Use DesignTokens Object (Recommended)

```typescript
import { DesignTokens } from '@shared/models/design-tokens';

// Instead of:
fontWeight: '600'

// Use:
fontWeight: DesignTokens.typography.fontWeight.semibold.toString()
```

### Option 2: Use CSS Variables in Inline Styles

```typescript
// Instead of:
fontWeight: '600'

// Use:
fontWeight: 'var(--font-weight-semibold)'
```

### Option 3: Move to SCSS (Best Practice)

For complex styling, consider moving inline styles to component SCSS files where design tokens are easier to use.

## Priority

**Medium Priority:** These violations are in TypeScript files and require code changes. They don't affect CSS consistency as much as SCSS violations, but should be addressed for complete design token compliance.

## Notes

- Inline styles in TypeScript are less common than SCSS violations
- Some inline styles may be dynamic (computed values) which is acceptable
- Consider creating a utility function to map numeric font weights to tokens
- The `transition: all` violation should be fixed (Decision 19)
