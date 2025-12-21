# FlagFit Pro Design System Documentation

**Version:** 2.0  
**Last Updated:** 2025  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Design Tokens](#design-tokens)
4. [Component Library](#component-library)
5. [Visual Hierarchy](#visual-hierarchy)
6. [Accessibility](#accessibility)
7. [Responsive Design](#responsive-design)
8. [Usage Guidelines](#usage-guidelines)
9. [Code Examples](#code-examples)
10. [Migration Guide](#migration-guide)
11. [Best Practices](#best-practices)

---

## Overview

The FlagFit Pro Design System is a comprehensive, production-ready design system built for athletic performance tracking applications. It provides a unified visual language, reusable components, and clear guidelines for building consistent, accessible, and performant user interfaces.

### Key Features

- **Single Source of Truth**: All design tokens defined in centralized files
- **Multi-Platform Support**: Works with HTML pages, Angular components, and PrimeNG
- **Accessibility First**: WCAG AA compliant with built-in accessibility features
- **Mobile-First**: Touch-friendly with 44px minimum touch targets
- **Type-Safe**: TypeScript definitions for Angular components
- **Performance Optimized**: Minimal CSS footprint with optimized tokens

### File Structure

```
design-system-tokens.css          # HTML pages (CSS variables)
design-system-tokens.scss         # Angular (SCSS variables)
design-tokens.ts                  # Angular (TypeScript definitions)
tailwind.config.js                # Tailwind CSS integration
```

---

## Design Philosophy

### Core Principles

1. **Consistency**: All components follow the same design patterns
2. **Clarity**: Clear visual hierarchy guides user attention
3. **Accessibility**: WCAG AA compliance is non-negotiable
4. **Performance**: Minimal CSS, optimized for fast loading
5. **Flexibility**: Tokens allow customization while maintaining consistency

### Color Rules (Strictly Enforced)

The design system enforces strict color combination rules to ensure accessibility:

#### ✅ Allowed Combinations

- **Green on White**: `--color-brand-primary` (#089949) on white backgrounds
- **White on Green**: `--color-text-on-primary` (#ffffff) on green backgrounds
- **Black on White**: `--color-text-primary` (#1a1a1a) on white backgrounds

#### ❌ Forbidden Combinations

- **Black on Green**: Never use `--color-text-primary` on green backgrounds
- **Green on Black**: Poor contrast, use white text instead

### Brand Identity

- **Primary Brand Color**: `#089949` (FlagFit Green)
- **Font Family**: Poppins (with system font fallbacks)
- **Design Language**: Clean, modern, athletic-focused

---

## Design Tokens

Design tokens are the foundation of the design system. They define colors, typography, spacing, shadows, and more.

### Color System

#### Brand Colors

```css
/* Primary Brand Color - Single Source of Truth */
--ds-primary-green: #089949;
--ds-primary-green-rgb: 8, 153, 73;
--ds-primary-green-hover: #036d35;
--ds-primary-green-light: #0ab85a;
--ds-primary-green-subtle: rgba(8, 153, 73, 0.1);
--ds-primary-green-ultra-subtle: rgba(8, 153, 73, 0.05);

/* Semantic Brand Tokens */
--color-brand-primary: var(--ds-primary-green);
--color-brand-primary-hover: var(--ds-primary-green-hover);
--color-brand-primary-light: var(--ds-primary-green-light);
--color-brand-secondary: #10c96b;
--color-brand-accent: #10c96b;
```

#### Status Colors

Status colors provide feedback for user actions and system states:

```css
/* Success - Green for positive outcomes */
--color-status-success: #63ad0e;
--color-status-success-light: rgba(99, 173, 14, 0.1);
--color-status-success-subtle: rgba(99, 173, 14, 0.05);

/* Warning - Yellow/Orange for potential problems */
--color-status-warning: #ffc000;
--color-status-warning-light: rgba(255, 192, 0, 0.1);
--color-status-warning-subtle: rgba(255, 192, 0, 0.05);

/* Error - Red for critical issues */
--color-status-error: #FF003C;
--color-status-error-light: rgba(255, 0, 60, 0.1);
--color-status-error-subtle: rgba(255, 0, 60, 0.05);

/* Info - Blue for informational messages */
--color-status-info: #0ea5e9;
--color-status-info-light: rgba(14, 165, 233, 0.1);
--color-status-info-subtle: rgba(14, 165, 233, 0.05);
```

#### Text Colors

```css
--color-text-primary: #1a1a1a;        /* Black - for white backgrounds ONLY */
--color-text-secondary: #4a4a4a;     /* Dark gray - secondary text */
--color-text-muted: #6b7280;         /* Medium gray - muted text */
--color-text-disabled: #d4d4d4;      /* Light gray - disabled text */
--color-text-on-primary: #ffffff;    /* White - for green backgrounds ONLY */
--color-text-on-white: var(--ds-primary-green); /* Green - for white backgrounds */
```

#### Surface Colors

```css
--surface-primary: #ffffff;      /* White - main backgrounds */
--surface-secondary: #f8faf9;    /* Off-white - card backgrounds */
--surface-tertiary: #e9ecef;     /* Light gray - subtle backgrounds */
--surface-elevated: #ffffff;     /* White - elevated cards/modals */
--surface-overlay: rgba(0, 0, 0, 0.5);
```

#### Neutral Grays

```css
--neutral-50: #fafafa;
--neutral-100: #f5f5f5;
--neutral-200: #e5e5e5;
--neutral-300: #d4d4d4;
--neutral-400: #a3a3a3;
--neutral-500: #737373;
--neutral-600: #525252;
--neutral-700: #404040;
--neutral-800: #262626;
--neutral-900: #171717;
```

### Typography System

#### Font Families

```css
--font-family-sans: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
--font-family-display: "Poppins", sans-serif;
--font-family-mono: "SF Mono", "Monaco", "Inconsolata", monospace;
```

#### Font Weights

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

#### Font Sizes

**Display Sizes** (Hero sections, landing pages)
```css
--font-display-2xl: 4.5rem;    /* 72px */
--font-display-xl: 3.75rem;    /* 60px */
```

**Heading Sizes** (Page titles, section headers)
```css
--font-heading-2xl: 2.5rem;    /* 40px */
--font-heading-xl: 1.875rem;   /* 30px */
--font-heading-lg: 1.5rem;     /* 24px */
--font-heading-md: 1.25rem;    /* 20px */
--font-heading-sm: 1.125rem;   /* 18px */
--font-heading-xs: 1rem;       /* 16px */
```

**Body Sizes** (Content, paragraphs)
```css
--font-body-lg: 1.125rem;      /* 18px */
--font-body-md: 1rem;          /* 16px - default */
--font-body-sm: 0.875rem;      /* 14px */
--font-body-xs: 0.75rem;       /* 12px */
```

#### Line Heights

```css
--line-height-none: 1;
--line-height-tight: 1.2;
--line-height-snug: 1.375;
--line-height-normal: 1.5;
--line-height-relaxed: 1.625;
--line-height-loose: 2;
```

#### Letter Spacing

```css
--letter-spacing-tighter: -0.05em;
--letter-spacing-tight: -0.02em;
--letter-spacing-normal: 0;
--letter-spacing-wide: 0.025em;
--letter-spacing-wider: 0.05em;
--letter-spacing-widest: 0.1em;
```

### Spacing Scale (8-Point Grid)

The design system uses an 8-point grid system for consistent spacing:

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

**Semantic Spacing Aliases:**
```css
--space-xs: var(--space-1);    /* 4px */
--space-sm: var(--space-2);    /* 8px */
--space-md: var(--space-4);    /* 16px */
--space-lg: var(--space-6);    /* 24px */
--space-xl: var(--space-8);    /* 32px */
--space-2xl: var(--space-12);  /* 48px */
--space-3xl: var(--space-16);  /* 64px */
```

### Border Radius

```css
--radius-none: 0;
--radius-sm: 0.125rem;    /* 2px */
--radius-md: 0.375rem;    /* 6px */
--radius-lg: 0.5rem;      /* 8px - default for components */
--radius-xl: 0.75rem;     /* 12px */
--radius-2xl: 1rem;       /* 16px */
--radius-3xl: 1.5rem;     /* 24px */
--radius-full: 9999px;     /* Fully rounded */
```

### Shadows & Elevation

```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 12px 48px rgba(0, 0, 0, 0.15);

/* Elevation Aliases */
--elevation-low: var(--shadow-sm);
--elevation-medium: var(--shadow-md);
--elevation-high: var(--shadow-lg);

/* Focus Shadows */
--shadow-focus: 0 0 0 0.2rem rgba(var(--ds-primary-green-rgb), 0.2);
```

### Transitions & Motion

```css
--transition-base: 0.2s ease;
--transition-fast: 0.15s ease;
--transition-slow: 0.3s ease;
--transition-slower: 0.5s ease;

--motion-duration-normal: var(--transition-base);
--motion-easing-productive: ease;
--motion-easing-expressive: cubic-bezier(0.4, 0, 0.2, 1);
```

### Z-Index System

```css
--z-index-base: 1;
--z-index-dropdown: 1000;
--z-index-sticky: 1020;
--z-index-fixed: 1030;
--z-index-modal-backdrop: 1040;
--z-index-modal: 1050;
--z-index-popover: 1060;
--z-index-tooltip: 1070;
--z-index-skiplink: 10000;
--z-index-loading: 10001;
--z-index-loading-overlay: 10002;
```

### Component-Specific Tokens

```css
/* Button Heights */
--button-height-sm: 36px;
--button-height-md: 44px;
--button-height-lg: 52px;

/* Touch Target Minimum */
--touch-target-min: 44px;
```

### Responsive Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

---

## Component Library

The design system includes a comprehensive component library organized using atomic design principles.

### Atoms (Basic Building Blocks)

#### Button

**Variants:**
- `btn-primary` - Main actions, primary CTAs
- `btn-secondary` - Supporting actions
- `btn-tertiary` - Low emphasis actions, text links
- `btn-success` - Success/confirmation actions
- `btn-warning` - Warning actions
- `btn-error` - Destructive/dangerous actions

**Sizes:**
- `btn-xs` - 28px height (compact spaces)
- `btn-sm` - 36px height (secondary actions)
- `btn-md` - 44px height (default)
- `btn-lg` - 52px height (primary CTAs)
- `btn-xl` - 60px height (hero sections)

**Usage:**
```html
<button class="btn btn-primary btn-md">Click Me</button>
<button class="btn btn-secondary btn-sm">Cancel</button>
<button class="btn btn-tertiary btn-md">Learn More</button>
```

**With Icons:**
```html
<button class="btn btn-primary btn-md">
  <i data-lucide="save" style="width: 18px; height: 18px;"></i>
  Save Changes
</button>
```

**Accessibility:**
- Focus indicator via `:focus-visible`
- Minimum touch target: 44px × 44px
- Semantic `<button>` element
- Icon-only buttons require `aria-label`

#### Input

**States:**
- Default
- Focus
- Error
- Success
- Disabled

**Usage:**
```html
<input type="text" class="form-input" placeholder="Enter text..." />
<input type="text" class="form-input error" placeholder="Error state" />
<input type="text" class="form-input" disabled placeholder="Disabled" />
```

#### Badge

**Variants:**
- `badge-primary` - Primary badge
- `badge-success` - Success badge
- `badge-warning` - Warning badge
- `badge-error` - Error badge
- `badge-info` - Info badge

**Usage:**
```html
<span class="badge badge-primary">New</span>
<span class="badge badge-success">Active</span>
```

#### Card

**Structure:**
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <p class="card-subtitle">Card subtitle</p>
  </div>
  <div class="card-body">
    <!-- Card content -->
  </div>
  <div class="card-footer">
    <!-- Footer content -->
  </div>
</div>
```

### Molecules (Combined Components)

#### Form Group

```html
<div class="form-group">
  <label class="form-label">Label</label>
  <input type="text" class="form-input" placeholder="Enter value" />
  <span class="form-error">Error message</span>
</div>
```

#### Alert

```html
<div class="alert alert-success">
  <i data-lucide="check-circle"></i>
  <span>Success message</span>
</div>
```

#### Modal

```html
<div class="modal">
  <div class="modal-backdrop"></div>
  <div class="modal-content">
    <div class="modal-header">
      <h2>Modal Title</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <!-- Modal content -->
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

### Organisms (Complex Components)

#### Navigation Sidebar

```html
<nav class="sidebar">
  <div class="sidebar-header">
    <h1>FlagFit Pro</h1>
  </div>
  <ul class="sidebar-nav">
    <li><a href="/dashboard" class="nav-item active">Dashboard</a></li>
    <li><a href="/training" class="nav-item">Training</a></li>
    <!-- More nav items -->
  </ul>
</nav>
```

#### Top Bar

```html
<header class="top-bar">
  <div class="top-bar-left">
    <button class="btn btn-icon" aria-label="Menu">
      <i data-lucide="menu"></i>
    </button>
    <h1>Page Title</h1>
  </div>
  <div class="top-bar-right">
    <button class="btn btn-icon" aria-label="Notifications">
      <i data-lucide="bell"></i>
    </button>
    <button class="btn btn-icon" aria-label="Profile">
      <i data-lucide="user"></i>
    </button>
  </div>
</header>
```

---

## Visual Hierarchy

The design system uses visual hierarchy to guide user attention and create clear information structure.

### Text Hierarchy

**Primary Text** (Highest contrast - main content)
```css
color: var(--text-hierarchy-primary); /* #1a1a1a */
```

**Secondary Text** (Medium contrast - supporting text)
```css
color: var(--text-hierarchy-secondary); /* #4a4a4a */
```

**Tertiary Text** (Lower contrast - metadata, hints)
```css
color: var(--text-hierarchy-tertiary); /* #6b7280 */
```

**Disabled Text** (Lowest contrast - disabled states)
```css
color: var(--text-hierarchy-disabled); /* #d4d4d4 */
```

### Spacing Hierarchy

**Tight Relationship** (8px)
```css
gap: var(--hierarchy-spacing-tight);
```

**Normal Relationship** (16px)
```css
gap: var(--hierarchy-spacing-normal);
```

**Relaxed Relationship** (24px)
```css
gap: var(--hierarchy-spacing-relaxed);
```

**Loose Relationship** (32px)
```css
gap: var(--hierarchy-spacing-loose);
```

**Section Separation** (48px)
```css
margin-bottom: var(--hierarchy-spacing-section);
```

### Typography Hierarchy

**Display** - Hero sections, landing pages
```html
<h1 class="text-display-2xl">Hero Title</h1>
```

**Headings** - Page titles, section headers
```html
<h2 class="text-heading-xl">Section Title</h2>
<h3 class="text-heading-lg">Subsection Title</h3>
```

**Body** - Content, paragraphs
```html
<p class="text-body-md">Regular paragraph text</p>
<p class="text-body-sm">Smaller supporting text</p>
```

---

## Accessibility

The design system is built with accessibility as a core principle, ensuring WCAG AA compliance.

### Color Contrast

All color combinations meet WCAG AA standards:
- **Normal text**: 4.5:1 contrast ratio minimum
- **Large text**: 3:1 contrast ratio minimum
- **Interactive elements**: 3:1 contrast ratio minimum

### Focus Indicators

All interactive elements include visible focus indicators:

```css
.btn:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 3px;
  box-shadow: 0 0 0 4px var(--color-brand-primary-light);
}
```

### Touch Targets

Minimum touch target size: **44px × 44px**

```css
--touch-target-min: 44px;
```

All buttons and interactive elements meet this requirement.

### Semantic HTML

- Use semantic HTML elements (`<button>`, `<nav>`, `<header>`, etc.)
- Include proper ARIA labels for icon-only buttons
- Use heading hierarchy correctly (`h1` → `h2` → `h3`)

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Focus states are clearly visible

### Screen Reader Support

- Descriptive `aria-label` attributes for icon-only buttons
- Proper `role` attributes where needed
- Semantic HTML structure

---

## Responsive Design

The design system uses a mobile-first approach with responsive breakpoints.

### Breakpoints

```css
/* Small devices (phones) */
@media (min-width: 640px) { /* --breakpoint-sm */ }

/* Medium devices (tablets) */
@media (min-width: 768px) { /* --breakpoint-md */ }

/* Large devices (desktops) */
@media (min-width: 1024px) { /* --breakpoint-lg */ }

/* Extra large devices */
@media (min-width: 1280px) { /* --breakpoint-xl */ }

/* 2X Extra large devices */
@media (min-width: 1536px) { /* --breakpoint-2xl */ }
```

### Mobile Considerations

- Touch targets minimum 44px × 44px
- Hover effects disabled on touch devices
- Responsive typography scales appropriately
- Navigation collapses on mobile

### Example: Responsive Button

```css
.btn-sm {
  min-height: 36px;
}

@media (max-width: 480px) {
  .btn-sm {
    min-height: 44px; /* Ensure touch target on mobile */
    padding: var(--space-3) var(--space-4);
  }
}
```

---

## Usage Guidelines

### When to Use Design Tokens

**✅ DO:**
- Use semantic tokens (`--color-brand-primary`) in components
- Use spacing tokens (`--space-md`) for consistent spacing
- Use typography tokens (`--font-heading-lg`) for text

**❌ DON'T:**
- Hardcode colors (`color: #089949`)
- Use arbitrary spacing values (`margin: 13px`)
- Mix different token systems

### Token Priority

1. **Semantic Tokens** (preferred)
   - `--color-brand-primary`
   - `--space-md`
   - `--font-heading-lg`

2. **Primitive Tokens** (when semantic doesn't exist)
   - `--ds-primary-green`
   - `--space-4`
   - `--font-size-lg`

3. **Legacy Tokens** (avoid, deprecated)
   - `--color-primary`
   - `--spacing-md`

### Component Usage

**✅ DO:**
- Use component classes (`btn`, `card`, `form-input`)
- Follow component structure
- Include accessibility attributes

**❌ DON'T:**
- Create custom variants without design system approval
- Override component styles unnecessarily
- Skip accessibility attributes

---

## Code Examples

### HTML Pages

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <link rel="stylesheet" href="/src/css/design-system-tokens.css">
  <link rel="stylesheet" href="/src/css/components/button.css">
</head>
<body>
  <button class="btn btn-primary btn-md">Primary Button</button>
  <button class="btn btn-secondary btn-sm">Secondary Button</button>
</body>
</html>
```

### Angular Components

```typescript
import { Component } from '@angular/core';
import { DesignTokens } from '@shared/models/design-tokens';

@Component({
  selector: 'app-example',
  template: `
    <button class="btn btn-primary btn-md">Click Me</button>
  `,
  styles: [`
    .btn {
      background-color: var(--color-brand-primary);
      color: var(--color-text-on-primary);
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius-md);
    }
  `]
})
export class ExampleComponent {
  primaryColor = DesignTokens.colors.brand.primary[700];
}
```

### SCSS Usage

```scss
@import './assets/styles/design-system-tokens.scss';

.my-component {
  background-color: var(--color-brand-primary);
  color: var(--color-text-on-primary);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  
  &:hover {
    background-color: var(--color-brand-primary-hover);
  }
}
```

### Tailwind CSS Usage

```html
<button class="bg-brand-primary text-text-on-primary px-4 py-2 rounded-md">
  Tailwind Button
</button>
```

---

## Migration Guide

### Migrating from Legacy Tokens

**Old Token → New Token**

```css
/* Colors */
--color-primary → --color-brand-primary
--brand-green → --ds-primary-green
--color-text → --color-text-primary

/* Spacing */
--spacing-md → --space-md
--spacing-lg → --space-lg

/* Typography */
--font-size-lg → --font-heading-lg
--text-lg → --font-body-lg
```

### Step-by-Step Migration

1. **Identify Legacy Tokens**
   ```bash
   # Search for legacy token usage
   grep -r "color-primary" src/
   ```

2. **Replace with Semantic Tokens**
   ```css
   /* Before */
   .component {
     color: var(--color-primary);
   }
   
   /* After */
   .component {
     color: var(--color-brand-primary);
   }
   ```

3. **Test Visual Consistency**
   - Verify colors match
   - Check spacing consistency
   - Test responsive behavior

4. **Remove Legacy Tokens**
   - After migration is complete
   - Update documentation

---

## Best Practices

### 1. Use Semantic Tokens

**✅ Good:**
```css
.button {
  background-color: var(--color-brand-primary);
  color: var(--color-text-on-primary);
}
```

**❌ Bad:**
```css
.button {
  background-color: #089949;
  color: #ffffff;
}
```

### 2. Follow Spacing Scale

**✅ Good:**
```css
.container {
  padding: var(--space-md);
  gap: var(--space-lg);
}
```

**❌ Bad:**
```css
.container {
  padding: 15px;
  gap: 23px;
}
```

### 3. Maintain Color Rules

**✅ Good:**
```css
.green-button {
  background-color: var(--color-brand-primary);
  color: var(--color-text-on-primary); /* White on green */
}
```

**❌ Bad:**
```css
.green-button {
  background-color: var(--color-brand-primary);
  color: var(--color-text-primary); /* Black on green - FORBIDDEN */
}
```

### 4. Use Component Classes

**✅ Good:**
```html
<button class="btn btn-primary btn-md">Click Me</button>
```

**❌ Bad:**
```html
<button style="background: green; color: white; padding: 10px;">Click Me</button>
```

### 5. Include Accessibility

**✅ Good:**
```html
<button class="btn btn-icon" aria-label="Close">
  <i data-lucide="x"></i>
</button>
```

**❌ Bad:**
```html
<button class="btn btn-icon">
  <i data-lucide="x"></i>
</button>
```

### 6. Test Responsive Behavior

- Test on mobile devices (320px+)
- Verify touch targets are adequate
- Check hover states don't stick on touch devices

### 7. Document Custom Components

If creating custom components:
- Document variants and props
- Include usage examples
- Note accessibility considerations
- Add to component library

---

## Resources

### Design Token Files

- **HTML Pages**: `src/css/design-system-tokens.css`
- **Angular SCSS**: `angular/src/assets/styles/design-system-tokens.scss`
- **TypeScript**: `angular/src/app/shared/models/design-tokens.ts`
- **Tailwind**: `tailwind.config.js`

### Component Documentation

- **Atoms**: `src/components/atoms/README.md`
- **Molecules**: `src/components/molecules/README.md`
- **Organisms**: `src/components/organisms/README.md`

### Related Documentation

- `VISUAL_HIERARCHY_GUIDE.md` - Visual hierarchy principles
- `ACCESSIBILITY_GUIDE.md` - Accessibility guidelines
- `COMPONENT_LIBRARY.md` - Component library reference

---

## Support & Contribution

### Questions?

- Check component README files
- Review code examples in this documentation
- Consult design token files for available tokens

### Contributing

When adding new tokens or components:
1. Follow existing naming conventions
2. Update this documentation
3. Add examples
4. Test accessibility
5. Update related files (CSS, SCSS, TypeScript)

---

**Last Updated:** 2025  
**Maintained by:** FlagFit Pro Team

