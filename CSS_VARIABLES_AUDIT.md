# CSS Variables Audit Report

## Summary
This document identifies redundant, legacy, and unused CSS variables in the codebase.

## 🔴 CRITICAL: Unused Files

### `src/css/tokens-simplified.css`
- **Status**: ❌ **NOT IMPORTED ANYWHERE**
- **Action**: Should be deleted - it's a duplicate token system that's never used
- The main `tokens.css` is imported via `main.css`, but `tokens-simplified.css` is never referenced

## 🟡 Redundant/Legacy Variables

### Duplicate Typography Variables
These variables are defined but have duplicates or are rarely used:

1. **`--font-xs`, `--font-sm`, `--font-base`, `--font-lg`, `--font-xl`, `--font-2xl`, `--font-3xl`**
   - **Status**: Legacy aliases for `--text-*` variables
   - **Usage**: Only `--font-xs`, `--font-sm`, `--font-base`, `--font-lg` found in `base.css` (4 uses)
   - **Recommendation**: Keep only if needed for backward compatibility, otherwise remove

2. **`--text-3xl`, `--text-4xl`, `--text-5xl`**
   - **Status**: Defined but usage unclear
   - **Recommendation**: Verify usage before keeping

### Duplicate Color Variables

1. **`--text-primary`** vs **`--color-text-primary`**
   - Both exist and point to same value
   - `--text-primary` is legacy alias
   - **Usage**: `--text-primary` found in 2 files, `--color-text-primary` widely used
   - **Recommendation**: Migrate to `--color-text-primary` and remove `--text-primary`

2. **`--text-secondary`** vs **`--color-text-secondary`**
   - Both exist
   - **Usage**: `--text-secondary` found in 2 files, `--color-text-secondary` widely used
   - **Recommendation**: Migrate to `--color-text-secondary` and remove `--text-secondary`

3. **`--text-muted`** vs **`--color-text-muted`**
   - Both exist
   - **Usage**: `--text-muted` found in 2 files, `--color-text-muted` widely used
   - **Recommendation**: Migrate to `--color-text-muted` and remove `--text-muted`

4. **`--border-strong`** vs **`--border-medium`**
   - Both point to `--color-border`
   - **Usage**: `--border-strong` - 0 uses, `--border-medium` - 0 uses
   - **Recommendation**: Remove both (unused)

5. **`--border-subtle`**
   - Points to `--color-border`
   - **Usage**: Found in 2 files (`card.css`, `button.css`)
   - **Status**: Used but could be replaced with `--color-border-subtle` or `--color-border-secondary`
   - **Recommendation**: Keep for now, but consider consolidation

### Unused Status Color Variants

1. **`--color-status-success-light`**, **`--color-status-success-subtle`**
   - **Status**: ✅ USED (in `state.css`, `form.css`, `badge.css`, `alert.css`, `field-error.css`)
   - **Recommendation**: Keep

2. **`--color-status-warning-light`**, **`--color-status-warning-subtle`**
   - **Status**: ✅ USED (in `state.css`, `badge.css`, `alert.css`)
   - **Recommendation**: Keep

3. **`--color-status-error-light`**, **`--color-status-error-subtle`**
   - **Status**: ✅ USED (in `state.css`, `form.css`, `badge.css`, `alert.css`, `field-error.css`)
   - **Recommendation**: Keep

### Unused Text-on-Color Variables

1. **`--color-text-on-success`**, **`--color-text-on-warning`**, **`--color-text-on-error`**
   - **Status**: ❌ NOT USED (only defined, never referenced)
   - **Recommendation**: Remove if not needed

2. **`--color-text-on-surface`**
   - **Status**: ✅ USED (in multiple files)
   - **Recommendation**: Keep

3. **`--color-text-on-primary`**
   - **Status**: ✅ USED (widely used across many files)
   - **Recommendation**: Keep

### Duplicate Letter Spacing Variables

1. **`--tracking-tight`**, **`--tracking-normal`**, **`--tracking-wide`**
   - **Status**: ✅ USED (in `chat.css`, `header.css`, `form.css`, `card.css`, `badge.css`, `components-modern.css`)
   - **Recommendation**: Keep

2. **`--letter-spacing-wide`**
   - **Status**: ✅ USED (in `header.css`)
   - **Note**: Duplicate of `--tracking-wide` (both are 0.05em)
   - **Recommendation**: Consolidate to use only `--tracking-wide`

### Typography System Variables

1. **`--typography-display-md-*`** (size, weight, line-height, letter-spacing)
   - **Status**: ✅ USED (in `base.css`)
   - **Recommendation**: Keep

2. **`--typography-heading-xs-*`** (size, weight, line-height, letter-spacing)
   - **Status**: ✅ USED (in `base.css`)
   - **Recommendation**: Keep

3. **`--typography-body-md-*`**, **`--typography-body-sm-*`**
   - **Status**: ✅ USED (widely used across many files)
   - **Recommendation**: Keep

4. **`--typography-label-sm-*`**, **`--typography-caption-*`**
   - **Status**: ✅ USED (in `chat.css`, `header.css`, `community.css`, `base.css`)
   - **Recommendation**: Keep

### Unused Primitive Color Variables

1. **`--primitive-emerald-700`**, **`--primitive-amber-700`**, **`--primitive-red-700`**
   - **Status**: ❌ NOT USED (only defined, never referenced)
   - **Recommendation**: Remove

### Unused Interactive Color Variables

1. **`--color-interactive-primary-active`**
   - **Status**: ❌ NOT USED (only `--color-interactive-primary` and `--color-interactive-primary-hover` are used)
   - **Recommendation**: Remove or keep for future use

### Duplicate Font Weight Variables

1. **`--font-weight-regular`** vs **`--font-weight-normal`**
   - Both point to same value (400)
   - **Usage**: `--font-weight-normal` is standard, `--font-weight-regular` is alias
   - **Recommendation**: Keep `--font-weight-normal`, remove `--font-weight-regular` if not used

2. **`--font-normal`**, **`--font-medium`**, **`--font-semibold`**, **`--font-bold`**
   - These are aliases for `--font-weight-*` variables
   - **Status**: ✅ USED (found in `tokens-simplified.css` and potentially used)
   - **Recommendation**: Keep for backward compatibility, but prefer `--font-weight-*` naming

### Motion Variables

1. **`--motion-duration-normal`**
   - Points to `--transition`
   - **Status**: ✅ USED (widely used across many files for animations and transitions)
   - **Recommendation**: Keep

2. **`--motion-easing-productive`**
   - Set to `ease`
   - **Status**: ✅ USED (widely used across many files for animations and transitions)
   - **Recommendation**: Keep

3. **`--motion-duration-fast`**, **`--motion-easing-entrance`**, **`--motion-easing-exit`**, **`--motion-easing-expressive`**
   - **Status**: ⚠️ **USED BUT NOT DEFINED** (found in `animations.css`, `component-library.css`)
   - **Problem**: These variables are referenced but don't exist in `tokens.css`
   - **Recommendation**: **ADD THESE DEFINITIONS** to `tokens.css` or replace with existing variables

### Unused Component Radius Variables

1. **`--radius-component-sm`**, **`--radius-component-md`**, **`--radius-component-lg`**, **`--radius-component-xl`**
   - **Status**: ✅ USED (widely used across many files)
   - **Recommendation**: Keep

## 🟢 Variables That Are Used (Keep These)

- `--color-primary`, `--color-primary-600`, `--color-primary-dark`
- `--color-success`, `--color-warning`, `--color-error`
- `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
- `--color-text-tertiary` (used in multiple files)
- `--color-border-primary` (used in multiple files)
- `--color-border-secondary`
- `--surface-primary`, `--surface-secondary`, `--surface-tertiary`
- `--color-brand-primary`, `--color-brand-secondary`
- `--color-brand-primary-light`, `--color-brand-primary-subtle`
- `--primitive-primary-500`, `--primitive-primary-600`
- `--primitive-primary-rgb`, `--primitive-primary-600-rgb` (used for rgba())
- `--color-interactive-primary`, `--color-interactive-primary-hover`
- `--color-dark-surface`, `--border-color-dark`
- `--gradient-primary`, `--gradient-card`, `--gradient-dark-card`
- All spacing variables (`--space-*`, `--spacing-component-*`)
- All radius variables (`--radius-*`, `--radius-component-*`)
- All z-index variables
- Typography variables that are actually used

## 📋 Recommended Actions

### Immediate Actions (Safe to Remove)

1. **Delete `src/css/tokens-simplified.css`** - Not imported anywhere
2. **Remove `--text-primary`**, **`--text-secondary`**, **`--text-muted`** - Replace with `--color-text-*` variants
3. **Remove `--border-strong`**, **`--border-medium`** - Unused
4. **Remove `--color-text-on-success`**, **`--color-text-on-warning`**, **`--color-text-on-error`** - Unused
5. **Remove `--primitive-emerald-700`**, **`--primitive-amber-700`**, **`--primitive-red-700`** - Unused
6. **Remove `--color-interactive-primary-active`** - Unused (or keep for future)
7. **Consolidate `--letter-spacing-wide`** - Use `--tracking-wide` instead

### Further Investigation Needed

1. ✅ **COMPLETED**: `--typography-*` variables are used - keep them
2. Check usage of `--font-*` aliases vs `--text-*` variables (some `--font-*` are used in `base.css`)
3. ✅ **COMPLETED**: `--font-weight-regular` is NOT used - safe to remove
4. ✅ **COMPLETED**: `--motion-*` variables are used - keep them
5. ⚠️ **ISSUE FOUND**: `--motion-duration-fast`, `--motion-easing-entrance`, `--motion-easing-exit`, `--motion-easing-expressive` are **USED but NOT DEFINED** in tokens.css - **NEEDS FIXING**

### Migration Tasks

1. Replace `--text-primary` → `--color-text-primary`
2. Replace `--text-secondary` → `--color-text-secondary`
3. Replace `--text-muted` → `--color-text-muted`
4. Replace `--letter-spacing-wide` → `--tracking-wide`

