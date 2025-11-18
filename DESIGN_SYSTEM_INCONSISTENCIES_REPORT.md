# Design System Inconsistencies Report

_Generated: December 2025_

## Executive Summary

This report documents inconsistencies between the DESIGN_SYSTEM_DOCUMENTATION.md specifications and the actual implementation across HTML pages and CSS files.

---

## 1. Typography - Font Family Inconsistency ⚠️ **CRITICAL**

### Issue

The design system documentation specifies **Poppins** as the primary font family, but the implementation uses **Inter** inconsistently.

### Design System Specification

```scss
// DESIGN_SYSTEM_DOCUMENTATION.md (Lines 390-392)
- Primary: 'Poppins' - Used for all text elements including UI text, headings, and body content
- Monospace: 'SF Mono' - Code snippets and data tables
```

### Current Implementation

#### tokens.css (Lines 49, 240-241)

```css
--font-family: "Inter", sans-serif;
--primitive-font-sans:
  "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
--primitive-font-display:
  "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
```

#### HTML Pages - Inconsistent Font Loading

- ✅ **training.html** (Line 14): Loads Poppins
- ✅ **analytics.html** (Line 14): Loads Poppins
- ❌ **login.html** (Line 14): Loads both Inter AND Poppins
- ❌ **dashboard.html**: No explicit font loading (relies on CSS)

#### base.css (Line 50)

```css
font-family: var(--primitive-font-sans); /* Uses Inter from tokens */
```

### Impact

- Visual inconsistency across pages
- Brand identity mismatch
- Typography hierarchy not matching design system

### Recommendation

1. Update `tokens.css` to use Poppins as primary font
2. Standardize font loading in all HTML pages
3. Remove Inter references from design tokens

---

## 2. Color System - Primary Brand Color Inconsistency ⚠️ **HIGH**

### Issue

The design system specifies `#089949` as the primary brand color, but tokens use `#10c96b` as `--color-primary`.

### Design System Specification

```scss
// DESIGN_SYSTEM_DOCUMENTATION.md (Lines 208-210)
--color-brand-primary: #089949;
--color-brand-primary-hover: #036d35;
--color-brand-secondary: #10c96b;
```

### Current Implementation

#### tokens.css (Lines 13-15)

```css
--color-primary: #10c96b; /* Should be #089949 */
--color-primary-600: #0ab85a;
--color-primary-dark: #089949; /* This is actually the primary */
```

#### Hardcoded Colors Found

Multiple CSS files hardcode colors instead of using tokens:

**dashboard.css** (Lines 231, 278, 1085, 1102, 1268, 1464, 2444, 2450, 2451, 5426, 5436):

```css
color: #10c96b; /* Should use --color-brand-primary */
background: #10c96b; /* Should use --color-brand-primary */
```

**training-schedule.css** (Line 30):

```css
background: linear-gradient(135deg, #089949 0%, #067a3c 100%) !important;
/* Should use design tokens */
```

### Impact

- Color values don't match design system
- Difficult to maintain consistent theming
- Hardcoded values prevent theme switching

### Recommendation

1. Align `--color-primary` with design system (`#089949`)
2. Replace all hardcoded color values with design tokens
3. Update color aliases to match design system hierarchy

---

## 3. Typography Scale - Missing Design System Tokens ⚠️ **MEDIUM**

### Issue

Design system specifies specific typography scale variables, but CSS uses different naming conventions.

### Design System Specification

```scss
// DESIGN_SYSTEM_DOCUMENTATION.md (Lines 399-409)
--font-display-2xl: 4.5rem; // 72px
--font-display-xl: 3.75rem; // 60px
--font-heading-2xl: 2.5rem; // 40px
--font-heading-xl: 1.875rem; // 30px
--font-heading-lg: 1.5rem; // 24px
--font-heading-md: 1.25rem; // 20px
--font-body-lg: 1.125rem; // 18px
--font-body-md: 1rem; // 16px
--font-body-sm: 0.875rem; // 14px
--font-caption: 0.75rem; // 12px
```

### Current Implementation

#### tokens.css (Lines 34-40, 194-237)

Uses different naming:

```css
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;

--typography-display-md-size: 48px; /* Different from design system */
--typography-heading-lg-size: 32px; /* Different from design system */
```

### Impact

- Typography scale doesn't match design system
- Inconsistent heading sizes
- Missing display font sizes

### Recommendation

1. Add design system typography tokens to `tokens.css`
2. Map existing tokens to design system tokens
3. Update base.css to use design system typography variables

---

## 4. Spacing System - Token Naming Inconsistency ⚠️ **LOW**

### Issue

Design system uses `--space-X` naming, but implementation has both `--space-X` and `--spacing-component-X`.

### Design System Specification

```scss
// DESIGN_SYSTEM_DOCUMENTATION.md (Lines 575-586)
--space-1: 0.25rem; // 4px
--space-2: 0.5rem; // 8px
--space-3: 0.75rem; // 12px
--space-4: 1rem; // 16px
--space-5: 1.25rem; // 20px
--space-6: 1.5rem; // 24px
--space-8: 2rem; // 32px
--space-10: 2.5rem; // 40px
--space-12: 3rem; // 48px
--space-16: 4rem; // 64px
```

### Current Implementation

#### tokens.css (Lines 26-32, 59-68)

Has both naming conventions:

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;

/* Aliases */
--space-1: var(--space-xs);
--space-2: var(--space-sm);
--space-4: var(--space-md);
--space-6: var(--space-lg);
--space-8: var(--space-xl);
--space-12: var(--space-2xl);

/* Component spacing */
--spacing-component-xs: var(--space-sm);
--spacing-component-sm: 12px;
--spacing-component-md: var(--space-md);
--spacing-component-lg: var(--space-lg);
--spacing-component-xl: var(--space-xl);
```

### Impact

- Multiple spacing systems create confusion
- Inconsistent spacing usage across components
- Difficult to maintain spacing consistency

### Recommendation

1. Standardize on design system `--space-X` naming
2. Remove redundant spacing tokens
3. Update all CSS files to use standardized spacing tokens

---

## 5. Component Usage - Missing PrimeNG Components ⚠️ **INFO**

### Issue

Design system documentation focuses on Angular + PrimeNG, but HTML pages use vanilla HTML/CSS.

### Design System Specification

```typescript
// DESIGN_SYSTEM_DOCUMENTATION.md specifies PrimeNG components
<p-button label="Start Training" icon="pi pi-play"></p-button>
<p-card>...</p-card>
<p-dialog>...</p-dialog>
```

### Current Implementation

HTML pages use vanilla HTML:

```html
<button class="btn btn-primary">Start Training</button>
<div class="card">...</div>
```

### Impact

- Documentation doesn't match implementation
- HTML pages can't use PrimeNG components (not Angular)
- Need separate documentation for vanilla HTML implementation

### Recommendation

1. Create separate design system documentation for vanilla HTML pages
2. Or migrate HTML pages to Angular components
3. Update documentation to reflect actual implementation

---

## 6. Status Colors - Inconsistent Values ⚠️ **MEDIUM**

### Issue

Design system specifies status colors, but implementation uses different values.

### Design System Specification

```scss
// DESIGN_SYSTEM_DOCUMENTATION.md (Lines 225-227)
--color-success: #f1c40f; /* Yellow */
--color-warning: #ef4444; /* Red */
--color-info: #089949; /* Green */
```

### Current Implementation

#### tokens.css (Lines 16-18)

```css
--color-success: #22c55e; /* Green - Different! */
--color-warning: #f59e0b; /* Amber - Different! */
--color-error: #ef4444; /* Red - Matches warning in design system */
```

### Impact

- Success color is green instead of yellow
- Warning color is amber instead of red
- Color semantics don't match design system

### Recommendation

1. Align status colors with design system
2. Update all status color usages
3. Consider accessibility implications of color changes

---

## 7. Border Radius - Token Naming ⚠️ **LOW**

### Issue

Design system specifies border radius tokens, but implementation uses different names.

### Design System Specification

```scss
// DESIGN_SYSTEM_DOCUMENTATION.md (Lines 371-379)
borderRadius: {
  none: "0",
  sm: "0.125rem", // 2px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  "3xl": "1.5rem", // 24px
  full: "9999px",
}
```

### Current Implementation

#### tokens.css (Lines 43-45, 80-81, 290-293)

```css
--radius-sm: 4px; /* Design system: 2px */
--radius-md: 8px; /* Design system: 6px */
--radius-lg: 12px; /* Design system: 8px */
--radius-xl: 16px;
--radius-2xl: 20px;
--radius-component-sm: var(--radius-sm);
--radius-component-md: var(--radius-md);
--radius-component-lg: var(--radius-lg);
--radius-component-xl: var(--radius-xl);
```

### Impact

- Border radius values don't match design system
- Inconsistent rounded corners across components
- Missing design system radius values

### Recommendation

1. Update radius tokens to match design system
2. Add missing radius sizes (none, 3xl, full)
3. Update component styles to use correct radius values

---

## 8. HTML Pages - Missing Design System CSS ⚠️ **MEDIUM**

### Issue

Some HTML pages don't consistently load design system CSS files.

### Pages Missing tokens.css

- ❌ **dashboard.html**: Loads main.css (which imports tokens), but no explicit tokens reference
- ❌ **login.html**: Loads main.css, but uses inline styles
- ✅ **training.html**: Loads main.css correctly
- ✅ **analytics.html**: Loads main.css correctly

### Impact

- Inconsistent styling across pages
- Some pages may not have access to design tokens
- Harder to maintain consistent design

### Recommendation

1. Ensure all HTML pages load `main.css` which includes tokens
2. Remove inline styles in favor of design tokens
3. Create a standard HTML template with required CSS imports

---

## 9. CSS Custom Properties - Inconsistent Usage ⚠️ **MEDIUM**

### Issue

Some CSS files use hardcoded values instead of design tokens.

### Examples

#### dashboard.css

- Line 231: `color: #10c96b;` → Should use `var(--color-brand-primary)`
- Line 278: `color: #10c96b;` → Should use `var(--color-brand-primary)`
- Line 1268: `background: #10c96b;` → Should use `var(--color-brand-primary)`

#### training-schedule.css

- Line 30: Hardcoded gradient → Should use `var(--gradient-primary)`

### Impact

- Difficult to maintain consistent colors
- Theme switching won't work properly
- Design system tokens are underutilized

### Recommendation

1. Audit all CSS files for hardcoded values
2. Replace with design token references
3. Create linting rules to prevent hardcoded values

---

## 10. Typography - Heading Styles ⚠️ **MEDIUM**

### Issue

Design system specifies heading styles, but base.css uses different typography tokens.

### Design System Specification

```scss
// DESIGN_SYSTEM_DOCUMENTATION.md (Lines 411-469)
h1 {
  font-family: "Poppins", sans-serif;
  font-size: var(--font-heading-2xl); /* 2.5rem / 40px */
  font-weight: 700;
}

h2 {
  font-family: "Poppins", sans-serif;
  font-size: var(--font-heading-xl); /* 1.875rem / 30px */
  font-weight: 600;
}
```

### Current Implementation

#### base.css (Lines 68-127)

```css
h1 {
  font-size: var(--typography-display-md-size); /* 48px - Different! */
  font-weight: var(--typography-display-md-weight); /* 700 - Matches */
}

h2 {
  font-size: var(--typography-heading-lg-size); /* 32px - Different! */
  font-weight: var(--typography-heading-lg-weight); /* 600 - Matches */
}
```

### Impact

- Heading sizes don't match design system
- Typography hierarchy is inconsistent
- Visual design doesn't match specifications

### Recommendation

1. Update base.css heading styles to match design system
2. Add design system typography tokens to tokens.css
3. Update all heading usages across HTML pages

---

## Summary of Critical Issues

### 🔴 **CRITICAL** (Must Fix)

1. **Font Family**: Poppins vs Inter inconsistency
2. **Primary Brand Color**: #089949 vs #10c96b mismatch

### 🟡 **HIGH** (Should Fix Soon)

3. **Hardcoded Colors**: Multiple CSS files use hardcoded color values
4. **Typography Scale**: Missing design system typography tokens
5. **Status Colors**: Success/warning colors don't match design system

### 🟢 **MEDIUM** (Nice to Have)

6. **Spacing Tokens**: Multiple naming conventions
7. **Border Radius**: Values don't match design system
8. **HTML Pages**: Inconsistent CSS loading
9. **CSS Custom Properties**: Underutilized design tokens

### 🔵 **INFO** (Documentation)

10. **Component Usage**: Documentation focuses on Angular/PrimeNG but HTML is vanilla

---

## Recommended Action Plan

### Phase 1: Critical Fixes (Week 1)

1. ✅ Update `tokens.css` to use Poppins as primary font
2. ✅ Align `--color-primary` with design system (#089949)
3. ✅ Update all HTML pages to load Poppins font consistently

### Phase 2: High Priority (Week 2)

4. ✅ Replace hardcoded colors with design tokens
5. ✅ Add design system typography tokens
6. ✅ Fix status color values

### Phase 3: Medium Priority (Week 3)

7. ✅ Standardize spacing token naming
8. ✅ Update border radius tokens
9. ✅ Audit and fix CSS custom property usage

### Phase 4: Documentation (Week 4)

10. ✅ Create separate design system docs for vanilla HTML
11. ✅ Update component usage examples
12. ✅ Add linting rules for design token usage

---

## Files Requiring Updates

### Critical Updates

- `src/css/tokens.css` - Font family, colors, typography
- `src/css/base.css` - Typography, heading styles
- All HTML pages - Font loading consistency

### High Priority Updates

- `src/css/pages/dashboard.css` - Remove hardcoded colors
- `src/css/pages/training-schedule.css` - Use design tokens
- `src/css/components/sidebar.css` - Use design tokens

### Medium Priority Updates

- All CSS files - Replace hardcoded values with tokens
- HTML pages - Standardize CSS imports

---

_Report generated by analyzing DESIGN_SYSTEM_DOCUMENTATION.md against actual implementation files._
