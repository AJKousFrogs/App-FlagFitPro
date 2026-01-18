# Comprehensive Design Token Audit Report

**Date:** 2026-01-09  
**Scope:** Complete audit of hardcoded design values (fonts, spacing, sizing, states, etc.)

## Executive Summary

This audit identified **hundreds of hardcoded design values** across the codebase that should use design tokens. The most critical areas are:

1. **Typography** (Font sizes, weights, line heights) - ~100+ instances
2. **Spacing** (Padding, margin, gap) - ~50+ instances  
3. **Sizing** (Width, height, min/max dimensions) - ~100+ instances
4. **Z-index** - ~30+ instances
5. **Opacity** - ~30+ instances
6. **Transitions** - ~30+ instances
7. **Border radius** - ~10+ instances

## Critical Findings

### 1. Typography Violations (HIGH PRIORITY)

#### Font Sizes
**Issue:** Hardcoded font sizes instead of typography tokens

**Examples Found:**
- `font-size: 1.75rem` (28px) - Should use `var(--font-h2-size)` or appropriate token
- `font-size: 1.5rem` (24px) - Should use `var(--font-h2-size)`
- `font-size: 16px` - Should use `var(--font-body-size)` (though 16px is acceptable for iOS zoom prevention)
- `font-size: 0.625rem` (10px) - Too small, should use `var(--font-caption-size)` minimum
- `font-size: 0.875em` - Should use `var(--font-body-sm-size)`

**Files Affected:**
- `angular/src/app/features/training/advanced-training/advanced-training.component.scss`
- `angular/src/app/features/ai-coach/ai-coach-chat.component.scss`
- `angular/src/app/shared/components/quick-actions-fab/quick-actions-fab.component.scss`
- `angular/src/assets/styles/primeng-theme.scss`
- `angular/src/assets/styles/primeng/_brand-overrides.scss`

#### Font Weights
**Issue:** Hardcoded numeric font weights instead of semantic tokens

**Examples Found:**
- `font-weight: 600` - Should use `var(--font-weight-semibold)`
- `font-weight: 400` - Should use `var(--font-weight-normal)` or `var(--font-weight-regular)`
- `font-weight: 700` - Should use `var(--font-weight-bold)`
- `font-weight: 500` - Should use `var(--font-weight-medium)`
- `font-weight: normal` - Should use `var(--font-weight-normal)`

**Files Affected:**
- `angular/src/app/features/settings/settings.component.scss` (multiple instances)
- `angular/src/styles.scss` (multiple instances)
- `angular/src/assets/styles/typography-system.scss`
- `angular/src/assets/styles/primeng-integration.scss`

#### Line Heights
**Issue:** Hardcoded line-height values instead of tokens

**Examples Found:**
- `line-height: 1.3` - Should use `var(--line-height-snug)` or `var(--font-h3-line-height)`
- `line-height: 1.5` - Should use `var(--line-height-base)` or `var(--font-body-line-height)`
- `line-height: 1.6` - Should use `var(--line-height-relaxed)` or `var(--line-height-jp)`
- `line-height: 1.7` - No matching token, consider adding or using closest
- `line-height: 1.2` - Should use `var(--line-height-tight)` or `var(--font-h1-line-height)`

**Files Affected:**
- `angular/src/app/features/analytics/analytics.component.scss`
- `angular/src/app/features/profile/profile.component.scss`
- `angular/src/app/features/community/community.component.scss`
- `angular/src/app/features/exercise-library/exercise-library.component.scss`
- Many more component files

### 2. Spacing Violations (MEDIUM PRIORITY)

**Issue:** Hardcoded padding/margin/gap values

**Examples Found:**
- `padding: 4px var(--space-1)` - Should use `var(--space-1)` for 4px
- `gap: 1px` - Intentionally tight for grid lines (acceptable)
- `padding: 2px` - Intentionally small for compact calendar (acceptable)

**Files Affected:**
- `angular/src/assets/styles/overrides/_exceptions.scss`
- `angular/src/assets/styles/primeng-theme.scss`

### 3. Sizing Violations (MEDIUM PRIORITY)

**Issue:** Hardcoded width/height values

**Examples Found:**
- `height: 6px` - Progress bars, should use `var(--progress-xs)` or `var(--progress-sm)`
- `height: 250px` - Chart heights, should use `var(--chart-min-height-md)` or similar
- `max-width: 240px` - Should use `var(--input-min-width-lg)` or container tokens
- `width: 64px`, `height: 64px` - Avatar sizes, should use `var(--avatar-md)` or `var(--avatar-lg)`
- `min-height: 520px` - Should use appropriate container token

**Files Affected:**
- `angular/src/app/features/analytics/analytics.component.scss` (many instances)
- `angular/src/app/features/onboarding/onboarding.component.scss`
- Many component files

### 4. Z-Index Violations (LOW PRIORITY)

**Issue:** Hardcoded z-index values instead of z-index tokens

**Examples Found:**
- `z-index: 1` - Should use `var(--z-index-base)` or appropriate level
- `z-index: 2` - Should use appropriate semantic token
- `z-index: 0` - Acceptable for stacking contexts
- `z-index: 10000` - Should use `var(--z-index-dropdown)` or appropriate token

**Files Affected:**
- `angular/src/app/features/analytics/analytics.component.scss`
- `angular/src/app/features/community/community.component.scss`
- `angular/src/styles.scss`
- Many component files

**Current Z-Index Tokens Available:**
- `--z-index-base: 1`
- `--z-index-dropdown: 1000`
- `--z-index-sticky: 1020`
- `--z-index-fixed: 1030`
- `--z-index-modal-backdrop: 1040`
- `--z-index-modal: 1050`
- `--z-index-popover: 1060`
- `--z-index-tooltip: 1070`
- `--z-index-notification: 1080`

### 5. Opacity Violations (LOW PRIORITY)

**Issue:** Hardcoded opacity values

**Examples Found:**
- `opacity: 0.5` - Should use semantic token if available
- `opacity: 0.7` - Should use semantic token
- `opacity: 0.9` - Should use semantic token

**Note:** Many opacity values are context-specific (dimmed states, loading states) and may need semantic tokens created.

**Files Affected:**
- `angular/src/app/features/analytics/analytics.component.scss`
- `angular/src/app/features/profile/profile.component.scss`
- `angular/src/app/features/dashboard/player-dashboard.component.scss`
- Many component files

**Current Opacity Tokens Available:**
- `--state-disabled-opacity: 0.38`
- `--state-hover-opacity: 0.08`
- `--state-focus-opacity: 0.12`
- `--state-active-opacity: 0.16`

### 6. Transition Violations (LOW PRIORITY)

**Issue:** Hardcoded transition durations

**Examples Found:**
- `transition: width 0.5s ease-out` - Should use `var(--transition-slow)` or `var(--transition-slower)`
- `transition: transform 0.25s` - Should use `var(--transition-base)` or `var(--transition-slow)`
- `transition: background 0.2s` - Should use `var(--transition-base)`
- `transition: width 0.3s ease` - Should use `var(--transition-slow)`
- `transition-duration: 0.01ms` - Reduced motion (acceptable)

**Files Affected:**
- `angular/src/app/features/analytics/analytics.component.scss`
- `angular/src/app/features/community/community.component.scss`
- `angular/src/app/features/profile/profile.component.scss`
- Many component files

**Current Transition Tokens Available:**
- `--transition-fast: 150ms`
- `--transition-base: 200ms`
- `--transition-slow: 300ms`
- `--transition-slower: 500ms`

### 7. Border Radius Violations (LOW PRIORITY)

**Issue:** Hardcoded border-radius values

**Examples Found:**
- `border-radius: 6px` - Should use `var(--radius-md)` (6px)
- `border-radius: 4px` - Should use `var(--radius-sm)` (2px) or `var(--radius-md)` (6px)
- `border-radius: 9999px` - Should use `var(--radius-full)` (acceptable for specific use cases)
- `border-radius: 13px` - Toggle switch specific (may be acceptable)

**Files Affected:**
- `angular/src/app/features/legal/legal-doc.component.scss`
- `angular/src/assets/styles/index.scss`
- `angular/src/assets/styles/_layers.scss`
- `angular/src/app/shared/components/toggle-switch/toggle-switch.component.scss`

## Recommendations

### Priority 1 (Critical - Typography)
1. ✅ **Replace all hardcoded font sizes** with typography tokens
2. ✅ **Replace all hardcoded font weights** with weight tokens
3. ✅ **Replace all hardcoded line heights** with line-height tokens

### Priority 2 (Important - Spacing & Sizing)
4. Replace hardcoded spacing values with spacing tokens
5. Replace hardcoded width/height values with sizing tokens where applicable

### Priority 3 (Nice to Have)
6. Replace hardcoded z-index values with z-index tokens
7. Create semantic opacity tokens for common use cases
8. Replace hardcoded transition durations with transition tokens
9. Replace hardcoded border-radius values with radius tokens

## Missing Design Tokens Needed

Consider creating these tokens:

1. **Opacity Tokens:**
   - `--opacity-dimmed: 0.5` (for disabled/dimmed states)
   - `--opacity-subtle: 0.7` (for subtle overlays)
   - `--opacity-strong: 0.9` (for strong overlays)

2. **Z-Index Tokens:**
   - `--z-index-overlay: 1` (for simple overlays)
   - `--z-index-above-content: 2` (for elements above content)

3. **Line Height Tokens:**
   - `--line-height-relaxed-reading: 1.6` (for long-form content)
   - `--line-height-loose: 1.7` (for very loose spacing)

## Files Requiring Updates

### High Priority (Typography)
1. `angular/src/app/features/settings/settings.component.scss`
2. `angular/src/styles.scss`
3. `angular/src/assets/styles/typography-system.scss`
4. `angular/src/app/features/profile/profile.component.scss`
5. `angular/src/app/features/analytics/analytics.component.scss`
6. `angular/src/app/features/community/community.component.scss`

### Medium Priority (Sizing)
7. `angular/src/app/features/analytics/analytics.component.scss`
8. `angular/src/app/features/onboarding/onboarding.component.scss`

### Low Priority (Other)
9. All component files with z-index, opacity, or transition violations

## Next Steps

1. **Start with typography fixes** - Highest impact on design consistency
2. **Create missing tokens** if needed (opacity, additional z-index levels)
3. **Systematically replace hardcoded values** file by file
4. **Add linting rules** to prevent future hardcoded values
5. **Update component documentation** to emphasize token usage

## Notes

- Some hardcoded values are **intentionally specific** (e.g., `gap: 1px` for grid lines, `font-size: 16px` for iOS zoom prevention)
- **Animation-specific values** (like `transition-duration: 0.01ms` for reduced motion) are acceptable
- **Component-specific values** (like toggle switch border-radius) may be acceptable if documented
- Focus on **semantic consistency** - use tokens that match the intent, not just the value
