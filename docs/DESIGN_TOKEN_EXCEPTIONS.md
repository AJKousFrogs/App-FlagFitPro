# Design Token Exceptions Documentation

**Last Updated:** 2026-01-09  
**Purpose:** Document intentional hardcoded values that are exceptions to design token rules

## Overview

This document lists all **intentional exceptions** where hardcoded values are allowed instead of design tokens. These exceptions exist for specific technical or design reasons.

## Typography Exceptions

### iOS Zoom Prevention
**Exception:** `font-size: 16px` (hardcoded)  
**Files:**
- `angular/src/assets/styles/overrides/_exceptions.scss`
- `angular/src/styles/_mobile-touch-components.scss`
- `angular/src/styles/_mobile-responsive.scss`

**Reason:** iOS Safari automatically zooms when input fields have font-size less than 16px. This is a browser behavior that cannot be overridden with CSS variables.

**Pattern:**
```scss
// ✅ ALLOWED - iOS zoom prevention
input[type="text"],
input[type="email"],
input[type="password"] {
  font-size: 16px !important; // Prevents iOS zoom
}
```

### Very Small Text (Accessibility Exception)
**Exception:** `font-size: 9px`, `font-size: 11px`  
**Files:**
- `angular/src/assets/styles/overrides/_exceptions.scss`

**Reason:** These are used for extremely compact UI elements (like dense data tables). While not ideal, they are documented exceptions.

**Note:** Consider migrating to `--font-compact-md` (11px minimum) for accessibility compliance.

## Spacing Exceptions

### Grid Lines (1px Gap)
**Exception:** `gap: 1px`  
**Files:**
- `angular/src/app/features/coach/calendar/calendar-coach.component.scss`
- `angular/src/app/shared/components/header/header.component.scss`
- `angular/src/app/shared/components/training-heatmap/training-heatmap.component.scss`

**Reason:** Intentionally tight spacing for visual grid lines in calendars and heatmaps. This is a design pattern, not a spacing inconsistency.

**Pattern:**
```scss
// ✅ ALLOWED - Intentional grid line spacing
.calendar-grid {
  gap: 1px; /* Intentionally 1px for calendar grid lines */
}
```

### Compact Calendar Padding
**Exception:** `padding: 2px`, `padding: 4px`  
**Files:**
- `angular/src/assets/styles/primeng-theme.scss`
- `angular/src/assets/styles/overrides/_exceptions.scss`

**Reason:** Intentionally small padding for compact calendar grid cells. This is a specific UI pattern.

**Pattern:**
```scss
// ✅ ALLOWED - Compact calendar grid
.p-datepicker-calendar td {
  padding: 2px; /* Intentionally small for compact calendar grid */
}
```

## Border Radius Exceptions

### Toggle Switches (Pill Shape)
**Exception:** `border-radius: 9999px` or `border-radius: 13px`  
**Files:**
- `angular/src/app/shared/components/toggle-switch/toggle-switch.component.scss`
- `angular/src/assets/styles/primeng/_brand-overrides.scss`

**Reason:** Toggle switches require pill/circular shapes. This is an approved exception per design system rules (avatars, progress bars, toggle switches, dot indicators).

**Pattern:**
```scss
// ✅ ALLOWED - Toggle switch requires pill shape
.toggle-slider {
  border-radius: 9999px; // Required for toggle switch
}
```

### Legal Document Styling
**Exception:** `border-radius: 6px`  
**Files:**
- `angular/src/app/features/legal/legal-doc.component.scss`

**Reason:** Legal documents may have specific styling requirements that differ from standard UI components.

**Note:** Consider migrating to `var(--radius-md)` (6px) if this matches the design intent.

## Z-Index Exceptions

### Stacking Contexts (0, 1, 2)
**Exception:** `z-index: 0`, `z-index: 1`, `z-index: 2`  
**Files:** Multiple component files

**Reason:** These low values are used for creating stacking contexts within components. They don't conflict with the global z-index system.

**Pattern:**
```scss
// ✅ ALLOWED - Component-level stacking context
.component-wrapper {
  z-index: 1; // Creates stacking context for child elements
}
```

**Note:** Values above 2 should use design tokens (`var(--z-index-overlay)`, `var(--z-index-above-content)`, etc.)

## Transition Exceptions

### Reduced Motion
**Exception:** `transition-duration: 0.01ms`  
**Files:**
- `angular/src/app/features/exercise-library/exercise-library.component.scss`
- `angular/src/app/features/training/video-feed/video-feed.component.scss`
- `angular/src/app/features/auth/login/login.component.scss`

**Reason:** Used to disable animations for users who prefer reduced motion. This is an accessibility feature.

**Pattern:**
```scss
// ✅ ALLOWED - Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    transition-duration: 0.01ms; // Effectively disables animation
  }
}
```

### Animation-Specific Durations
**Exception:** Custom transition durations for specific animations  
**Files:**
- `angular/src/app/features/analytics/analytics.component.scss` (0.5s)
- `angular/src/app/features/community/community.component.scss` (0.6s)
- `angular/src/app/features/training/daily-protocol/components/la28-roadmap.component.scss` (0.5s)

**Reason:** Some animations require specific timing that doesn't match standard transition tokens. These should be documented.

**Recommendation:** Consider creating animation-specific tokens if these patterns are reused:
- `--animation-duration-slow: 500ms`
- `--animation-duration-medium: 300ms`

## Opacity Exceptions

### Context-Specific Opacity Values
**Exception:** Various opacity values (0.3, 0.4, 0.5, 0.7, 0.8, 0.9)  
**Files:** Multiple component files

**Reason:** Many opacity values are context-specific (dimmed states, loading states, overlays). These may need semantic tokens created.

**Current Tokens Available:**
- `--opacity-dimmed: 0.5` (for disabled/dimmed states)
- `--opacity-subtle: 0.7` (for subtle overlays)
- `--opacity-strong: 0.9` (for strong overlays)
- `--opacity-minimal: 0.4` (for very subtle states)

**Recommendation:** Migrate to semantic opacity tokens where applicable.

## Sizing Exceptions

### Chart Heights
**Exception:** Hardcoded chart heights (250px, 280px, 300px, etc.)  
**Files:**
- `angular/src/app/features/analytics/analytics.component.scss`

**Reason:** Charts may require specific aspect ratios that don't match standard container tokens.

**Recommendation:** Consider creating chart-specific sizing tokens:
- `--chart-height-sm: 200px`
- `--chart-height-md: 250px`
- `--chart-height-lg: 300px`

### Progress Bar Heights
**Exception:** `height: 6px`, `height: 4px`  
**Files:**
- `angular/src/app/features/analytics/analytics.component.scss`
- `angular/src/app/features/onboarding/onboarding.component.scss`

**Reason:** Progress bars have specific height requirements.

**Current Tokens Available:**
- `--progress-xs: 0.125rem` (2px)
- `--progress-sm: 0.25rem` (4px)
- `--progress-md: 0.5rem` (8px)
- `--progress-lg: 0.75rem` (12px)

**Recommendation:** Use `var(--progress-sm)` for 4px and `var(--progress-md)` for 8px. For 6px, consider adding `--progress-sm-md: 0.375rem` or use closest token.

## Animation Exceptions

### Keyframe Animations
**Exception:** Hardcoded rgba values in `@keyframes`  
**Files:**
- `angular/src/app/shared/styles/animations.scss`

**Reason:** Keyframe animations may require specific opacity values for animation effects. These are acceptable if they use RGB tokens.

**Pattern:**
```scss
// ✅ ALLOWED - Uses RGB token with specific opacity for animation
@keyframes pulseRing {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--ds-primary-green-rgb), 0.7);
  }
}
```

## Font Family Exceptions

### None Currently
All font-family declarations should use `var(--font-family-sans)`, `var(--font-family-display)`, or `var(--font-family-mono)`.

**Note:** There are 168 instances of hardcoded "Poppins" that need migration (see DESIGN_SYSTEM_RULES.md).

## How to Add New Exceptions

1. **Document the exception** in this file with:
   - The hardcoded value
   - File locations
   - Technical/design reason
   - Pattern example

2. **Add a comment** in the code:
   ```scss
   // EXCEPTION: [Reason] - See DESIGN_TOKEN_EXCEPTIONS.md
   font-size: 16px; // iOS zoom prevention
   ```

3. **Consider creating a token** if the pattern is reused:
   - If used in 3+ places, create a semantic token
   - Document the token in design-system-tokens.scss
   - Update this exceptions file

## Migration Priority

1. **High Priority:** Migrate hardcoded font-family "Poppins" to tokens
2. **Medium Priority:** Migrate opacity values to semantic tokens
3. **Low Priority:** Document remaining exceptions

## Related Documentation

- `DESIGN_SYSTEM_RULES.md` - Full design system rules
- `COMPREHENSIVE_DESIGN_AUDIT.md` - Complete audit findings
- `DESIGN_TOKEN_AUDIT_REPORT.md` - State values audit
- `.stylelintrc.cjs` - Linting rules
