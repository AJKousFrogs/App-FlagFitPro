# Migration Guide - CSS Architecture

## Overview

This guide provides step-by-step instructions for migrating existing pages to the new modular CSS architecture.

## Prerequisites

- All HTML files currently using the old CSS imports
- Understanding of the new naming conventions
- Access to test environment

## Step-by-Step Migration

### Step 1: Update CSS Imports

**Before:**

```html
<link rel="stylesheet" href="./src/comprehensive-design-system.css" />
<link rel="stylesheet" href="./src/spacing-system.css" />
<link rel="stylesheet" href="./src/modern-dashboard-redesign.css" />
<link rel="stylesheet" href="./src/hover-effects.css" />
```

**After:**

```html
<link rel="stylesheet" href="./src/css/main.css" />
<!-- Legacy styles for backward compatibility (remove after full migration) -->
<link rel="stylesheet" href="./src/modern-dashboard-redesign.css" />
<link rel="stylesheet" href="./src/hover-effects.css" />
```

### Step 2: Update Layout Classes (Optional but Recommended)

**Before:**

```html
<div class="container">
  <div class="grid">
    <!-- content -->
  </div>
</div>
```

**After:**

```html
<div class="l-container">
  <div class="l-grid l-grid-auto">
    <!-- content -->
  </div>
</div>
```

**Migration Map:**

- `.container` → `.l-container`
- `.grid` → `.l-grid` or `.l-grid-auto`
- `.grid-2` → `.l-grid-2`
- `.grid-3` → `.l-grid-3`
- `.grid-4` → `.l-grid-4`

### Step 3: Update Utility Classes (Optional)

**Before:**

```html
<div class="spacing-md padding-lg">
  <p class="text-primary">Content</p>
</div>
```

**After:**

```html
<div class="u-margin-16 u-padding-24">
  <p class="u-text-primary">Content</p>
</div>
```

**Migration Map:**

- `.spacing-md` → `.u-margin-16`
- `.padding-lg` → `.u-padding-24`
- `.text-primary` → `.u-text-primary`
- `.text-secondary` → `.u-text-secondary`

### Step 4: Add State Classes Where Needed

**Before:**

```html
<button class="btn btn-primary" disabled>Submit</button>
<div class="error-message">Error text</div>
```

**After:**

```html
<button class="btn btn-primary is-disabled">Submit</button>
<div class="alert alert-error has-error">Error text</div>
```

### Step 5: Add JavaScript Hooks

**Before:**

```html
<button class="btn btn-primary" onclick="openModal()">Open</button>
```

**After:**

```html
<button class="btn btn-primary js-modal-trigger" data-modal="example">
  Open
</button>
```

### Step 6: Test Thoroughly

1. **Visual Testing**
   - Check all pages render correctly
   - Verify spacing and layout
   - Test responsive breakpoints

2. **Functionality Testing**
   - Test all interactive elements
   - Verify JavaScript hooks work
   - Check form validation states

3. **Theme Testing**
   - Test light theme
   - Test dark theme
   - Test high-contrast theme
   - Verify theme switching works

4. **Accessibility Testing**
   - Test keyboard navigation
   - Verify focus indicators
   - Check screen reader compatibility
   - Test reduced motion preferences

## Common Migration Patterns

### Pattern 1: Card Layouts

**Before:**

```html
<div class="card">
  <div class="card-header">Title</div>
  <div class="card-body">Content</div>
</div>
```

**After:** (No change - component classes remain the same)

```html
<div class="card">
  <div class="card-header">Title</div>
  <div class="card-body">Content</div>
</div>
```

### Pattern 2: Forms

**Before:**

```html
<div class="form-group">
  <label class="form-label">Name</label>
  <input type="text" class="form-input" />
</div>
```

**After:** (No change - component classes remain the same)

```html
<div class="form-group">
  <label class="form-label">Name</label>
  <input type="text" class="form-input" />
</div>
```

### Pattern 3: Buttons

**Before:**

```html
<button class="btn btn-primary btn-lg">Click</button>
```

**After:** (No change - component classes remain the same)

```html
<button class="btn btn-primary btn-lg">Click</button>
```

## Migration Checklist

- [ ] Update CSS imports in HTML files
- [ ] Test page renders correctly
- [ ] Update layout classes (`.container` → `.l-container`)
- [ ] Update utility classes (optional)
- [ ] Add state classes where needed
- [ ] Add JavaScript hooks for interactivity
- [ ] Test responsive breakpoints
- [ ] Test theme switching
- [ ] Test accessibility features
- [ ] Remove legacy CSS imports after verification

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback:**

   ```html
   <!-- Revert to old imports -->
   <link rel="stylesheet" href="./src/comprehensive-design-system.css" />
   <link rel="stylesheet" href="./src/spacing-system.css" />
   ```

2. **Partial Migration:**
   - Keep both old and new imports temporarily
   - Gradually migrate components
   - Remove old imports once stable

## Post-Migration

After successful migration:

1. Remove legacy CSS file imports
2. Update component documentation
3. Train team on new naming conventions
4. Update style guide with new patterns

## Getting Help

- See `TROUBLESHOOTING.md` for common issues
- Check `README.md` for API reference
- Review component examples in documentation
