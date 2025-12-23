# FlagFit Pro Design System - Quick Start Guide

**Get up and running in 15 minutes!**

This guide will help you quickly integrate the FlagFit Pro design system into your Angular 19 project.

---

## ⚡ 15-Minute Setup

### Step 1: Copy Files (2 minutes)

```bash
# Navigate to your Angular project
cd angular

# Ensure assets/styles directory exists
mkdir -p src/assets/styles

# Copy design system files (they should already be in place)
# design-tokens.scss → src/assets/styles/design-tokens.scss
# component-styles.scss → src/assets/styles/component-styles.scss
```

### Step 2: Import Styles (1 minute)

Open `src/styles.scss` and add:

```scss
// Import design tokens first
@import "./assets/styles/design-tokens.scss";

// Import component styles
@import "./assets/styles/component-styles.scss";

// Import PrimeNG theme (if using PrimeNG)
@import "primeng/resources/themes/lara-light-green/theme.css";
@import "primeng/resources/primeng.css";
@import "primeicons/primeicons.css";
```

### Step 3: Verify Setup (2 minutes)

```bash
# Start dev server
ng serve

# Open browser to http://localhost:4200
# Check browser console for any CSS errors
```

### Step 4: Test Design Tokens (5 minutes)

Create a test component to verify tokens work:

```typescript
// src/app/test-design-system/test-design-system.component.ts
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-test-design-system",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" style="padding: var(--space-6);">
      <h1 style="color: var(--color-brand-primary);">Design System Test</h1>

      <button class="btn btn-primary">Primary Button</button>
      <button class="btn btn-secondary">Secondary Button</button>

      <div class="card card-elevated" style="margin-top: var(--space-6);">
        <div class="card-body">
          <p>Card content here</p>
        </div>
      </div>
    </div>
  `,
})
export class TestDesignSystemComponent {}
```

Add to your app:

```typescript
// app.component.ts
import { TestDesignSystemComponent } from './test-design-system/test-design-system.component';

@Component({
  template: '<app-test-design-system></app-test-design-system>'
})
```

### Step 5: Run Migration (5 minutes)

Follow the [Migration Guide](./migration-guide.md) to update existing code:

```bash
# Quick migration for one file (example)
sed -i '' 's/--dark-text-primary/--color-text-primary/g' src/app/**/*.component.scss
```

---

## 🎨 Color Palette Quick Reference

### Primary Colors

```scss
/* Use these semantic tokens */
--color-brand-primary        /* #089949 - Main green */
--color-brand-primary-hover   /* #0ab85a - Hover state */
--color-brand-primary-active  /* #036d35 - Active/pressed */

/* Text colors */
--color-text-primary         /* #171717 - Main text */
--color-text-secondary       /* #737373 - Secondary text */
--color-text-on-primary      /* #ffffff - White on green */
```

### Status Colors

```scss
--color-status-success       /* #f1c40f - Yellow */
--color-status-warning       /* #ef4444 - Red */
--color-status-error         /* #ef4444 - Red */
```

### Surface Colors

```scss
--surface-primary            /* #ffffff - White backgrounds */
--surface-secondary          /* #f8faf9 - Card backgrounds */
--surface-tertiary           /* #e9ecef - Subtle backgrounds */
```

---

## 📏 Spacing System (8-Point Grid)

```scss
--space-0: 0;
--space-1: 4px; /* 0.25rem */
--space-2: 8px; /* 0.5rem */
--space-3: 12px; /* 0.75rem */
--space-4: 16px; /* 1rem */
--space-6: 24px; /* 1.5rem */
--space-8: 32px; /* 2rem */
--space-12: 48px; /* 3rem */
```

**Usage:**

```scss
.my-component {
  padding: var(--space-4); /* 16px */
  margin-bottom: var(--space-6); /* 24px */
  gap: var(--space-2); /* 8px */
}
```

---

## 🔤 Typography System

### Font Families

```scss
--font-family-sans    /* Poppins - Default */
--font-family-display  /* Poppins - Headings */
--font-family-mono     /* SF Mono - Code */
```

### Font Sizes

```scss
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
```

### Font Weights

```scss
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

**Usage:**

```scss
.heading {
  font-family: var(--font-family-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
```

---

## 🔘 Button Variants

### 6 Standard Button Types

```html
<!-- Primary - Green BG + White Text -->
<button class="btn btn-primary">Save</button>

<!-- Secondary - White BG + Green Text -->
<button class="btn btn-secondary">Cancel</button>

<!-- Outlined - Green Border + Green Text -->
<button class="btn btn-outlined">Learn More</button>

<!-- Text - No Background + Green Text -->
<button class="btn btn-text">View Details</button>

<!-- Danger - Red BG + White Text -->
<button class="btn btn-danger">Delete</button>

<!-- Success - Yellow BG + Black Text -->
<button class="btn btn-success">Approve</button>
```

### Button Sizes

```html
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Default</button>
<button class="btn btn-primary btn-lg">Large</button>
```

---

## 🃏 Card Components

```html
<!-- Default Card -->
<div class="card">
  <div class="card-body">Content here</div>
</div>

<!-- Elevated Card -->
<div class="card card-elevated">
  <div class="card-header">
    <h3 class="card-title">Title</h3>
  </div>
  <div class="card-body">Content here</div>
  <div class="card-footer">Footer content</div>
</div>

<!-- Outlined Card -->
<div class="card card-outlined">
  <div class="card-body">Content here</div>
</div>
```

---

## 📝 Form Components

### Text Input

```html
<div class="form-group">
  <label for="email">Email Address</label>
  <input
    id="email"
    type="email"
    class="form-control"
    placeholder="Enter your email"
  />
  <div class="form-help">We'll never share your email</div>
</div>
```

### Select Dropdown

```html
<div class="form-group">
  <label for="position">Position</label>
  <select id="position" class="form-control">
    <option value="">Select position</option>
    <option value="qb">Quarterback</option>
    <option value="wr">Wide Receiver</option>
  </select>
</div>
```

### Checkbox

```html
<div class="form-check">
  <input type="checkbox" id="agree" />
  <label for="agree">I agree to the terms</label>
</div>
```

---

## 🌓 Dark Mode

### Automatic Dark Mode

Dark mode activates automatically based on system preference:

```css
/* Automatically handled in design-tokens.scss */
@media (prefers-color-scheme: dark) {
  /* Colors switch automatically */
}
```

### Manual Dark Mode Toggle

```typescript
// Toggle dark mode
toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
}
```

```html
<button (click)="toggleDarkMode()">Toggle Theme</button>
```

---

## 🎯 Common Patterns

### Container with Grid

```html
<div class="container">
  <div class="grid grid-cols-3">
    <div class="card">Card 1</div>
    <div class="card">Card 2</div>
    <div class="card">Card 3</div>
  </div>
</div>
```

### Flex Layout

```html
<div class="flex items-center justify-between">
  <h2>Title</h2>
  <button class="btn btn-primary">Action</button>
</div>
```

### Spacing Utilities

```html
<!-- Padding -->
<div class="p-4">Padding 16px</div>
<div class="p-6">Padding 24px</div>

<!-- Margin -->
<div class="m-4">Margin 16px</div>
<div class="m-6">Margin 24px</div>

<!-- Gap (for flex/grid) -->
<div class="flex gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## ✅ Color Combinations (Enforced)

### ✅ Allowed Combinations

- **Green BG + White Text** - Primary buttons, headers
- **White BG + Green Text** - Secondary buttons, links
- **Black BG + White Text** - Dark headers
- **Yellow BG + Black Text** - Success messages

### ❌ Forbidden Combinations

- **Green BG + Black Text** - Fails accessibility (contrast ratio < 4.5:1)
- **Black BG + Green Text** - Fails accessibility
- **Yellow BG + White Text** - Poor contrast

**Always test contrast ratios!**

---

## 🔍 Finding the Right Token

### Need a color?

1. Check `design-tokens.scss` comments
2. Look for semantic name: `--color-*`, `--surface-*`
3. Use primitive only if semantic doesn't exist

### Need spacing?

1. Use 8-point grid: `--space-1` through `--space-24`
2. Prefer semantic: `--space-xs`, `--space-md`, `--space-lg`

### Need typography?

1. Use semantic sizes: `--text-xs` through `--text-5xl`
2. Use heading sizes: `--font-heading-*`
3. Use body sizes: `--font-body-*`

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't Hardcode Colors

```scss
/* BAD */
.my-component {
  color: #089949;
}

/* GOOD */
.my-component {
  color: var(--color-brand-primary);
}
```

### ❌ Don't Use Legacy Variables

```scss
/* BAD */
.my-component {
  color: var(--dark-text-primary);
}

/* GOOD */
.my-component {
  color: var(--color-text-primary);
}
```

### ❌ Don't Mix Spacing Systems

```scss
/* BAD */
.my-component {
  padding: 15px; /* Not on 8-point grid */
}

/* GOOD */
.my-component {
  padding: var(--space-4); /* 16px - on grid */
}
```

---

## 📚 Next Steps

1. **Read Migration Guide** - Fix existing code
2. **Check Angular Components** - See component examples
3. **Review Reference Card** - Quick visual reference
4. **Read Full Documentation** - Complete design system docs

---

## 🆘 Quick Troubleshooting

### Colors not showing?

```bash
# Check if tokens are imported
grep -r "@import.*design-tokens" src/styles.scss

# Verify tokens file exists
ls -la src/assets/styles/design-tokens.scss
```

### Dark mode not working?

```typescript
// Check if data-theme attribute is set
console.log(document.documentElement.getAttribute("data-theme"));

// Manually set dark mode
document.documentElement.setAttribute("data-theme", "dark");
```

### Build errors?

```bash
# Check for syntax errors
ng build --configuration development

# Verify SCSS compilation
ng serve
```

---

## ✨ You're Ready!

You now have everything you need to start using the FlagFit Pro design system. Remember:

- ✅ Always use design tokens
- ✅ Follow the 8-point spacing grid
- ✅ Test color contrast ratios
- ✅ Support dark mode
- ✅ Use semantic variable names

**Happy coding! 🎉**
