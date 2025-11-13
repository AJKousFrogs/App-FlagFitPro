# Design Token Audit Report

## Summary

This report documents the audit and fixes applied to ensure all CSS component files use consistent design tokens from the unified design system (`src/css/tokens.css`).

## Standard Design Tokens (from tokens.css)

### Spacing Tokens
- `--space-xs`: 4px
- `--space-sm`: 8px
- `--space-md`: 16px
- `--space-lg`: 24px
- `--space-xl`: 32px
- `--space-2xl`: 48px

**Aliases:**
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px (added)
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-12`: 48px
- `--space-16`: 64px

### Typography Tokens
- `--text-xs`: 12px
- `--text-sm`: 14px
- `--text-base`: 16px
- `--text-lg`: 18px
- `--text-xl`: 20px
- `--text-2xl`: 24px
- `--text-3xl`: 30px (alias)
- `--text-4xl`: 36px (alias)
- `--text-5xl`: 48px (alias)

**Font Weight Tokens:**
- `--font-weight-normal`: 400
- `--font-weight-medium`: 500
- `--font-weight-semibold`: 600
- `--font-weight-bold`: 700

**Aliases:**
- `--font-semibold`: 600
- `--font-medium`: 500
- `--font-bold`: 700

### Line Height Tokens
- `--line-height-tight`: 1.25
- `--line-height-normal`: 1.5
- `--line-height-relaxed`: 1.625

### Letter Spacing Tokens
- `--tracking-tight`: -0.02em
- `--tracking-normal`: 0
- `--tracking-wide`: 0.05em

### Border Radius Tokens
- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 12px
- `--radius-xl`: 16px (alias)
- `--radius-2xl`: 20px (alias)

### Transition Tokens
- `--transition`: 0.2s ease
- `--transition-base`: 0.2s ease (alias)
- `--transition-fast`: 0.15s ease (alias)
- `--transition-slow`: 0.3s ease (alias)

### Shadow Tokens
- `--shadow-sm`: 0 1px 3px rgba(0,0,0,0.1)
- `--shadow-md`: 0 4px 12px rgba(0,0,0,0.15)
- `--shadow-lg`: 0 8px 24px rgba(0,0,0,0.12) (alias)

### Component Spacing Tokens
- `--spacing-component-xs`: var(--space-sm) = 8px
- `--spacing-component-sm`: 12px
- `--spacing-component-md`: var(--space-md) = 16px
- `--spacing-component-lg`: var(--space-lg) = 24px
- `--spacing-component-xl`: var(--space-xl) = 32px

## Issues Found and Fixed

### card.css

**Issues Fixed:**
1. ✅ Replaced `transition: all 0.2s ease` → `transition: var(--transition)`
2. ✅ Replaced `--elevation-medium` → `--shadow-md`
3. ✅ Replaced `--elevation-high` → `--shadow-lg`
4. ✅ Replaced `--motion-duration-normal` → `--transition`
5. ✅ Replaced `--motion-easing-productive` → removed (using default ease)
6. ✅ Replaced `--spacing-component-lg` → `--space-6` (for padding)
7. ✅ Replaced `--radius-component-xl` → `--radius-xl`
8. ✅ Replaced `--radius-component-lg` → `--radius-lg`
9. ✅ Replaced `--radius-component-sm` → `--radius-sm`
10. ✅ Replaced `--font-lg` → `--text-lg`
11. ✅ Replaced `font-weight: 600` → `var(--font-weight-semibold)`
12. ✅ Replaced `--font-semibold` → `--font-weight-semibold`
13. ✅ Replaced `--font-medium` → `--font-weight-medium`
14. ✅ Replaced `--font-bold` → `--font-weight-bold`
15. ✅ Replaced `--transition-base` → `--transition`

**Status:** ✅ **FIXED** - All tokens now use standard design system tokens

### button.css

**Issues Fixed:**
1. ✅ Replaced `font-weight: 500` → `var(--font-weight-medium)`
2. ✅ Replaced `transition: all 0.2s ease` → `var(--transition)`
3. ✅ Replaced `--motion-duration-slower` → `--transition-slow`
4. ✅ Replaced `--primitive-space-6` → `--space-2` (for btn-xs padding)
5. ✅ Replaced `--primitive-space-12` → `--space-3` (for btn-xs padding)
6. ✅ Replaced `--primitive-space-8` → `--space-2` (for btn-sm padding)
7. ✅ Replaced `--primitive-space-16` → `--space-4` (for btn-sm padding)
8. ✅ Replaced `--primitive-space-20` → `--space-5` (for btn-md padding)
9. ✅ Replaced `--primitive-space-24` → `--space-6` (for btn-lg padding)
10. ✅ Replaced `--primitive-space-32` → `--space-8` (for btn-xl padding)
11. ✅ Replaced `--typography-label-sm-size` → `--text-sm`
12. ✅ Replaced `--typography-label-md-size` → `--text-base`
13. ✅ Replaced `--typography-label-lg-size` → `--text-lg`
14. ✅ Replaced `--radius-component-sm` → `--radius-sm`
15. ✅ Replaced `--radius-component-md` → `--radius-md`
16. ✅ Replaced `--radius-component-lg` → `--radius-lg`
17. ✅ Replaced `--motion-duration-normal` → `--transition`
18. ✅ Replaced `--motion-easing-productive` → removed (using default ease)

**Status:** ✅ **FIXED** - All tokens now use standard design system tokens

## Remaining Issues in Other Files

The following files still use non-standard tokens and should be updated:

### header.css
- Uses `--primitive-space-X` tokens (should use `--space-X`)
- Uses `--radius-component-X` tokens (should use `--radius-X`)
- Uses `--typography-X-size` tokens (should use `--text-X`)
- Uses `--spacing-layout-X` tokens (may need verification)

### sidebar.css
- Uses `--primitive-space-X` tokens (should use `--space-X`)
- Uses `--radius-component-X` tokens (should use `--radius-X`)
- Uses `--typography-X-size` tokens (should use `--text-X`)

### modal.css
- Uses `--radius-component-xl` (should use `--radius-xl`)
- Uses `--primitive-space-12` (should use `--space-3`)

### form.css
- Uses `--primitive-space-X` tokens (should use `--space-X`)
- Uses `--radius-component-xl` (should use `--radius-xl`)
- Uses `--typography-X-size` tokens (should use `--text-X`)

### badge.css
- Uses `--radius-component-sm` (should use `--radius-sm`)
- Uses `--primitive-space-X` tokens (should use `--space-X`)

### alert.css
- Uses `--radius-component-md` (should use `--radius-md`)
- Uses `--primitive-space-12` (should use `--space-3`)

### community.css
- Uses `--primitive-space-X` tokens (should use `--space-X`)
- Uses `--radius-component-X` tokens (should use `--radius-X`)
- Uses `--spacing-layout-lg` (may need verification)

## Token Mapping Reference

### Primitive Space → Standard Space
- `--primitive-space-2` → `--space-1` (4px)
- `--primitive-space-4` → `--space-2` (8px)
- `--primitive-space-6` → `--space-2` (8px) or `--space-3` (12px) depending on context
- `--primitive-space-8` → `--space-2` (8px)
- `--primitive-space-12` → `--space-3` (12px)
- `--primitive-space-16` → `--space-4` (16px)
- `--primitive-space-20` → `--space-5` (20px)
- `--primitive-space-24` → `--space-6` (24px)
- `--primitive-space-32` → `--space-8` (32px)
- `--primitive-space-40` → `--space-xl` (32px) or custom
- `--primitive-space-48` → `--space-12` (48px)

### Typography → Text Size
- `--typography-label-sm-size` → `--text-sm` (14px)
- `--typography-label-md-size` → `--text-base` (16px)
- `--typography-label-lg-size` → `--text-lg` (18px)
- `--typography-body-sm-size` → `--text-sm` (14px)
- `--typography-body-md-size` → `--text-base` (16px)
- `--typography-heading-sm-size` → `--text-lg` (18px)
- `--typography-heading-md-size` → `--text-xl` (20px)
- `--typography-heading-lg-size` → `--text-2xl` (24px)
- `--typography-caption-size` → `--text-xs` (12px)

### Radius Component → Radius
- `--radius-component-sm` → `--radius-sm` (4px)
- `--radius-component-md` → `--radius-md` (8px)
- `--radius-component-lg` → `--radius-lg` (12px)
- `--radius-component-xl` → `--radius-xl` (16px)

## Recommendations

1. **Complete Migration**: Update all remaining component CSS files to use standard tokens
2. **Documentation**: Update DESIGN_SYSTEM_DOCUMENTATION.md to reflect the standard token naming
3. **Linting**: Consider adding CSS linting rules to prevent use of non-standard tokens
4. **Token Verification**: Verify that `--spacing-layout-X` tokens are defined or replace with standard tokens
5. **Consistency Check**: Run periodic audits to ensure new code uses standard tokens

## Files Updated

✅ `src/css/components/card.css` - Fully migrated to standard tokens
✅ `src/css/components/button.css` - Fully migrated to standard tokens
✅ `src/css/tokens.css` - Added `--space-5` alias

## Next Steps

1. Update remaining component CSS files (header, sidebar, modal, form, badge, alert, community)
2. Verify all HTML files load `tokens.css` before component CSS files
3. Test visual consistency after token migration
4. Update component documentation with correct token usage examples

