# SCSS Architecture Migration Guide

## Overview

This guide provides patterns for migrating inline TypeScript styles to maintainable SCSS modules, using the new design system architecture.

## Why Migrate?

**Current Problem (Inline Styles):**
- 95%+ of styles inline in TypeScript `styles: []` arrays
- Massive duplication across components
- Hard to maintain consistency
- No single source of truth for design tokens
- Large bundle size from duplication

**Solution (SCSS Architecture):**
- Centralized design tokens
- Reusable mixins and utilities
- Easier to maintain and update
- Smaller bundle size
- Better developer experience

---

## SCSS Architecture Overview

```
src/styles/
├── _variables.scss      # Design tokens (spacing, colors, typography, etc.)
├── _mixins.scss         # Reusable mixins (responsive, layouts, animations)
├── _utilities.scss      # Utility classes (margin, padding, display, etc.)
├── _components.scss     # Global component styles
└── styles.css           # Main entry (imports all SCSS + global styles)
```

---

## Using the SCSS System

### 1. Import in Component SCSS

```scss
// my-component.component.scss
@import 'src/styles/variables';
@import 'src/styles/mixins';

.my-component {
  padding: space(4);  // Use spacing scale
  border-radius: get-radius(md);
  @include card;  // Use card mixin
}
```

### 2. Using Variables

```scss
// Before (inline CSS)
.dashboard-content {
  padding: 2rem;  // Hard-coded
  margin-bottom: 24px;  // Hard-coded
}

// After (SCSS with variables)
.dashboard-content {
  padding: space(6);  // 2rem from design system
  margin-bottom: space(5);  // 24px from design system
}
```

### 3. Using Mixins

```scss
// Responsive breakpoints
.sidebar {
  display: block;

  @include respond-to(md) {
    display: none;  // Hide on tablet and below
  }
}

// Flexbox layouts
.header {
  @include flex-between;  // display: flex + space-between + align center
}

// Card styling
.card {
  @include card(space(5), get-radius(xl));
}

// Typography
.title {
  @include heading-2;  // Consistent heading style
}
```

### 4. Using Utility Classes

```html
<!-- Before -->
<div style="display: flex; justify-content: space-between; padding: 16px;">
  <span>Title</span>
  <button>Action</button>
</div>

<!-- After -->
<div class="d-flex justify-between p-4">
  <span>Title</span>
  <button>Action</button>
</div>
```

---

## Migration Patterns

### Pattern 1: Simple Component Migration

**BEFORE (Inline TypeScript):**

```typescript
@Component({
  selector: 'app-metric-card',
  template: `<div class="metric-card">...</div>`,
  styles: [`
    .metric-card {
      padding: 24px;
      background: var(--surface-primary);
      border: 1px solid var(--color-border-secondary);
      border-radius: 16px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .metric-card:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 768px) {
      .metric-card {
        padding: 16px;
      }
    }
  `]
})
```

**AFTER (SCSS File):**

```scss
// metric-card.component.scss
@import 'src/styles/variables';
@import 'src/styles/mixins';

.metric-card {
  @include card(space(5), get-radius(xl));

  @include respond-to(md) {
    padding: space(4);
  }
}
```

```typescript
@Component({
  selector: 'app-metric-card',
  template: `<div class="metric-card">...</div>`,
  styleUrls: ['./metric-card.component.scss']  // ✅ Now using SCSS file
})
```

---

### Pattern 2: Dashboard Grid Migration

**BEFORE (Duplicated across multiple components):**

```typescript
// athlete-dashboard.component.ts
styles: [`
  .metrics-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }
`]

// coach-dashboard.component.ts (duplicate!)
styles: [`
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;  // Different gap!
  }
`]
```

**AFTER (Consistent SCSS):**

```scss
// athlete-dashboard.component.scss
@import 'src/styles/variables';
@import 'src/styles/mixins';

.metrics-row {
  @include grid-responsive(250px, space(4));  // Consistent pattern
  margin-bottom: space(6);
}

// coach-dashboard.component.scss
@import 'src/styles/variables';
@import 'src/styles/mixins';

.stats-grid {
  @include grid-responsive(200px, space(3));  // Clear, reusable
}
```

---

### Pattern 3: Responsive Design Migration

**BEFORE (Inconsistent breakpoints):**

```typescript
styles: [`
  @media (max-width: 768px) { ... }  // Some use 768px
  @media (max-width: 640px) { ... }  // Others use 640px
  @media (min-width: 769px) and (max-width: 1024px) { ... }  // Complex
`]
```

**AFTER (Standardized breakpoints):**

```scss
@import 'src/styles/variables';
@import 'src/styles/mixins';

.component {
  padding: space(6);

  @include respond-to(md) {  // 768px
    padding: space(4);
  }

  @include respond-to(sm) {  // 640px
    padding: space(3);
  }

  @include respond-between(md, lg) {  // Tablet only
    // Tablet-specific styles
  }
}
```

---

### Pattern 4: Button Migration

**BEFORE:**

```typescript
styles: [`
  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: var(--ds-primary-green);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 150ms ease;
  }

  .action-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .action-btn:active {
    transform: scale(0.97);
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`]
```

**AFTER:**

```scss
@import 'src/styles/variables';
@import 'src/styles/mixins';

.action-btn {
  @include button-base;  // Handles all common button styles
  background: var(--ds-primary-green);
  color: white;
}
```

---

### Pattern 5: Form Input Migration

**BEFORE:**

```typescript
styles: [`
  input {
    width: 100%;
    height: 44px;
    padding: 12px;
    border: 1px solid var(--color-border-primary);
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 150ms ease;
  }

  input:focus {
    outline: 2px solid var(--ds-primary-green);
    outline-offset: 2px;
    border-color: var(--ds-primary-green);
  }

  input:disabled {
    background-color: var(--surface-100);
    cursor: not-allowed;
    opacity: 0.6;
  }

  input.error {
    border-color: var(--color-status-error);
  }
`]
```

**AFTER:**

```scss
@import 'src/styles/variables';
@import 'src/styles/mixins';

input {
  @include input-base;  // All input styles in one mixin
}
```

---

## Step-by-Step Migration Process

### Step 1: Create Component SCSS File

```bash
# If component has inline styles, create SCSS file
touch src/app/features/dashboard/athlete-dashboard.component.scss
```

### Step 2: Copy Styles to SCSS

```scss
// athlete-dashboard.component.scss
@import 'src/styles/variables';
@import 'src/styles/mixins';

// Paste inline styles here (temporarily)
.dashboard-content {
  padding: 2rem;
  // ... rest of styles
}
```

### Step 3: Replace Hard-coded Values

```scss
// Before
.dashboard-content {
  padding: 2rem;
  margin-bottom: 32px;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

// After
.dashboard-content {
  padding: space(6);  // 2rem → space(6)
  margin-bottom: space(6);  // 32px → space(6)
  border-radius: get-radius(xl);  // 16px → get-radius(xl)
  box-shadow: get-shadow(sm);  // → get-shadow(sm)
}
```

### Step 4: Use Mixins Where Applicable

```scss
// Before
.dashboard-content {
  padding: space(6);
  background: var(--surface-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: get-radius(xl);
  box-shadow: get-shadow(sm);
}

.dashboard-content:hover {
  box-shadow: get-shadow(md);
}

// After
.dashboard-content {
  @include card(space(6), get-radius(xl));  // One line!
}
```

### Step 5: Update Component Decorator

```typescript
// Before
@Component({
  selector: 'app-athlete-dashboard',
  template: `...`,
  styles: [`
    // All inline styles
  `]
})

// After
@Component({
  selector: 'app-athlete-dashboard',
  template: `...`,
  styleUrls: ['./athlete-dashboard.component.scss']
})
```

### Step 6: Test & Verify

```bash
# Run the app
npm start

# Verify no visual regressions
# Check responsive behavior
# Test in different browsers
```

---

## Migration Checklist

For each component:

- [ ] Create `.component.scss` file
- [ ] Import `_variables` and `_mixins`
- [ ] Copy inline styles to SCSS file
- [ ] Replace hard-coded values with design tokens
- [ ] Use mixins where applicable
- [ ] Update responsive breakpoints to use mixins
- [ ] Update component decorator to use `styleUrls`
- [ ] Remove inline `styles: []` array
- [ ] Test component visually
- [ ] Commit changes

---

## Quick Reference

### Commonly Used Functions

```scss
space($key)              // Spacing scale (1-12)
get-font-size($size)     // Font size (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl)
get-font-weight($weight) // Font weight (light, normal, medium, semibold, bold)
get-radius($size)        // Border radius (sm, md, lg, xl, 2xl, full)
get-shadow($size)        // Box shadow (sm, md, lg, xl, 2xl)
get-z-index($layer)      // Z-index (dropdown, modal, tooltip, etc.)
get-transition($speed)   // Transition duration (fast, normal, slow)
get-easing($type)        // Easing function (bounce, smooth, ease-in, etc.)
get-breakpoint($size)    // Breakpoint value (xs, sm, md, lg, xl, xxl)
```

### Commonly Used Mixins

```scss
// Responsive
@include respond-to(md)      // Max-width media query
@include respond-above(md)   // Min-width media query
@include respond-between(md, lg)  // Range media query
@include touch-device        // Touch device detection
@include hover-support       // Hover support detection

// Layout
@include flex-center         // Flexbox center
@include flex-between        // Flex space-between
@include grid-responsive($min-width, $gap)  // Responsive grid
@include container($size)    // Centered container

// Components
@include card($padding, $radius)  // Card styling
@include button-base         // Button base styles
@include input-base          // Input base styles
@include modal-backdrop      // Modal backdrop

// Typography
@include heading-1           // H1 styles
@include text-truncate       // Single line truncate
@include line-clamp($lines)  // Multi-line truncate

// Animations
@include fade-in($duration)  // Fade in animation
@include slide-up($duration) // Slide up animation
@include scale-in($duration) // Scale in animation
@include shimmer             // Shimmer loading
@include pulse($duration)    // Pulse animation

// Utilities
@include visually-hidden     // Screen reader only
@include focus-visible       // Focus styling
@include scrollbar($width)   // Custom scrollbar
@include respect-motion-preference  // Reduced motion
```

---

## Example: Complete Dashboard Migration

**File: `athlete-dashboard.component.scss`**

```scss
@import 'src/styles/variables';
@import 'src/styles/mixins';

.dashboard {
  padding: space(6);

  @include respond-to(md) {
    padding: space(4);
  }
}

.metrics-grid {
  @include grid-responsive(250px, space(4));
  margin-bottom: space(6);
}

.metric-card {
  @include card;
  @include slide-up;
  text-align: center;

  &:hover {
    transform: translateY(-2px);
  }
}

.metric-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto space(3);
  @include flex-center;
  background: var(--ds-primary-green-subtle);
  color: var(--ds-primary-green);
  border-radius: get-radius(full);
  font-size: get-font-size(2xl);
}

.metric-value {
  @include heading-2;
  color: var(--color-text-primary);
  margin-bottom: space(1);
}

.metric-label {
  @include small-text;
  color: var(--color-text-secondary);
}
```

---

## Benefits After Migration

✅ **Consistency:** All components use the same design tokens
✅ **Maintainability:** Change once in `_variables.scss`, update everywhere
✅ **Smaller Bundle:** No more duplicated styles
✅ **Better DX:** Autocomplete, type-checking (with SCSS IntelliSense)
✅ **Easier Refactoring:** Update mixins without touching components
✅ **Scalability:** Add new design tokens easily

---

## Next Steps

1. **Start with high-traffic components** (dashboards, landing pages)
2. **Migrate one module at a time** (e.g., all auth components)
3. **Document patterns as you go** (update this guide with discoveries)
4. **Run visual regression tests** after each migration
5. **Get team review** before merging large migrations

---

## Troubleshooting

### Issue: Styles not applying

**Solution:** Ensure you're importing variables and mixins:

```scss
@import 'src/styles/variables';
@import 'src/styles/mixins';
```

### Issue: Build errors with SCSS

**Solution:** Check Angular configuration in `angular.json`:

```json
{
  "stylePreprocessorOptions": {
    "includePaths": [
      "src/styles"
    ]
  }
}
```

### Issue: Variables not found

**Solution:** Use relative import path or configure `includePaths` in `angular.json`:

```scss
// Option 1: Relative path
@import '../../styles/variables';

// Option 2: After configuring includePaths
@import 'variables';
```

---

**Questions? Check with the team or update this guide!**
