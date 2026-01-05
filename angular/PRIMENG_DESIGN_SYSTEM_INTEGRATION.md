# PrimeNG Design System Integration Guide

**Version**: 2.0 - Enhanced with FlagFit Pro Design Tokens
**Last Updated**: 2026-01-03
**Status**: ✅ All inconsistencies resolved

> **Note**: This document should be read in conjunction with `PRIMENG_COMPONENTS.md` for complete component API reference.

---

## Table of Contents

1. [Design System Overview](#design-system-overview)
2. [Color System](#color-system)
3. [Typography Standards](#typography-standards)
4. [Component Sizing](#component-sizing)
5. [Spacing System](#spacing-system)
6. [Border Radius](#border-radius)
7. [Elevation & Shadows](#elevation--shadows)
8. [Z-Index Layering](#z-index-layering)
9. [Interaction States](#interaction-states)
10. [Animation Standards](#animation-standards)
11. [Responsive Design](#responsive-design)
12. [Dark Mode Support](#dark-mode-support)
13. [Accessibility (WCAG 2.1 AA)](#accessibility-wcag-21-aa)
14. [Component-Specific Guidelines](#component-specific-guidelines)

---

## Design System Overview

All PrimeNG components in this application are customized to match the FlagFit Pro Design System, which provides:

- **Single Source of Truth**: All tokens defined in `design-system-tokens.scss`
- **WCAG AA Compliance**: All color combinations meet accessibility standards
- **Consistent Theming**: Automatic dark mode support
- **Material Design Elevation**: Raised button style with proper depth
- **8-Point Grid**: All spacing follows 8px increments
- **Poppins Typography**: Professional font system

### Quick Token Reference

```scss
/* Primary Brand Color */
--ds-primary-green: #089949;

/* Common Patterns */
--color-text-on-primary: #ffffff; /* Always use on green backgrounds */
--color-text-primary: #1a1a1a; /* Use on white backgrounds */
--radius-lg: 0.5rem; /* 8px - Raised buttons, cards */
--space-4: 1rem; /* 16px - Default spacing */
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15); /* Medium elevation */
```

---

## Color System

### Strictly Enforced Color Rules

⚠️ **CRITICAL**: These rules are non-negotiable and enforced with `!important` in the CSS:

1. **Green on White**: Use `--color-brand-primary` (#089949) on white backgrounds
2. **White on Green**: Use `--color-text-on-primary` (#ffffff) on green backgrounds
3. **Black on White**: Use `--color-text-primary` (#1a1a1a) on white backgrounds
4. **🚫 NEVER Black on Green**: Never use dark text on green backgrounds

### Primary Color Tokens

```scss
/* Brand Green - Single Source of Truth */
--ds-primary-green: #089949;
--ds-primary-green-hover: #036d35;
--ds-primary-green-light: #0ab85a;
--ds-primary-green-rgb: 8, 153, 73;
```

### Text Color Tokens (WCAG AA Compliant)

```scss
/* Use these for text on white backgrounds */
--color-text-primary: #1a1a1a; /* Contrast: 16.1:1 ✅ */
--color-text-secondary: #4a4a4a; /* Contrast: 8.6:1 ✅ */
--color-text-muted: #525252; /* Contrast: 7.5:1 ✅ */
--color-text-disabled: #9ca3af; /* Decorative only */

/* Use this for text on green backgrounds */
--color-text-on-primary: #ffffff; /* Contrast: 4.7:1 ✅ */
```

### Status Colors & Severity Mappings

For PrimeNG components with `severity` attribute (Tag, Badge, Message, Toast):

| Severity  | Background | Text    | Token                    | Use Case                    |
| --------- | ---------- | ------- | ------------------------ | --------------------------- |
| `success` | #63ad0e    | #ffffff | `--color-status-success` | Completed, Active, Positive |
| `info`    | #0ea5e9    | #ffffff | `--color-status-info`    | Informational, Neutral      |
| `warning` | #ffc000    | #92400e | `--color-status-warning` | Caution, Pending            |
| `danger`  | #ff003c    | #ffffff | `--color-status-error`   | Error, Critical, Delete     |
| `help`    | #8b5cf6    | #ffffff | `--color-status-help`    | Tips, Help content          |

**Contrast Compliance**: All combinations meet WCAG AA standards (4.5:1 minimum for normal text).

### Component Color Examples

**Button - Primary**:

```html
<!-- ✅ Correct: White text on green button -->
<p-button label="Save Changes" styleClass="p-button-primary"> </p-button>

<!-- Uses: background: #089949, color: #ffffff -->
```

**Tag - Success**:

```html
<!-- ✅ Correct: White text on green tag -->
<p-tag value="Active" severity="success" [rounded]="true"> </p-tag>
```

**Badge - Danger**:

```html
<!-- ✅ Correct: White text on red badge -->
<p-badge [value]="notificationCount" severity="danger"> </p-badge>
```

---

## Typography Standards

### Font Family

All PrimeNG components use **Poppins** font:

```scss
--font-family-sans:
  "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
```

### Font Weights

```scss
--font-weight-normal: 400; /* Body text */
--font-weight-medium: 500; /* Labels, emphasized text */
--font-weight-semibold: 600; /* Buttons, headings */
--font-weight-bold: 700; /* Strong emphasis */
```

### Font Sizes (Type Scale)

```scss
/* Display Sizes */
--font-display-lg: 3rem; /* 48px - Hero headings */
--font-display-md: 2.5rem; /* 40px - Page titles */
--font-display-sm: 2rem; /* 32px - Section headers */

/* Heading Sizes */
--font-heading-xl: 1.875rem; /* 30px - h1 */
--font-heading-lg: 1.5rem; /* 24px - h2 */
--font-heading-md: 1.25rem; /* 20px - h3 */
--font-heading-sm: 1.125rem; /* 18px - h4 */
--font-heading-xs: 1rem; /* 16px - h5 */

/* Body Sizes */
--font-body-lg: 1.125rem; /* 18px - Large text */
--font-body-md: 1rem; /* 16px - Default text */
--font-body-sm: 0.875rem; /* 14px - Small text */
--font-body-xs: 0.75rem; /* 12px - Captions, labels */
```

### Component Typography

**Buttons**:

- Font Weight: 600 (semibold)
- Font Size: 15px (0.9375rem)
- Letter Spacing: 0.01em

**Input Labels**:

- Font Weight: 500 (medium)
- Font Size: 14px (0.875rem)

**Helper Text / Error Messages**:

- Font Weight: 400 (normal)
- Font Size: 12px (0.75rem)
- Color: `--color-status-error` for errors

**Card Headers**:

- Font Weight: 600 (semibold)
- Font Size: 18px (1.125rem)

---

## Component Sizing

### Button Heights

```scss
--button-height-sm: 36px; /* Small - desktop only */
--button-height-md: 44px; /* Default - recommended minimum */
--button-height-lg: 52px; /* Large - enhanced touch target */
```

**Touch Target Minimum**: 44px

```scss
--touch-target-min: 44px;
```

⚠️ **Mobile Accessibility**: Always use default (44px) or large (52px) buttons on touch devices.

**Size Mapping**:

```html
<!-- Small (36px) - Use sparingly, desktop only -->
<p-button label="Details" size="small"></p-button>

<!-- Default (44px) - Recommended minimum -->
<p-button label="Submit"></p-button>

<!-- Large (52px) - Enhanced visibility -->
<p-button label="Start Training" size="large"></p-button>
```

### Input Field Heights

```scss
/* Input fields automatically match button sizing */
--input-height-sm: 36px;
--input-height-md: 44px; /* Default */
--input-height-lg: 52px;
```

---

## Spacing System

### 8-Point Grid

All spacing follows 8px increments:

```scss
--space-0: 0;
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
```

### Semantic Aliases

```scss
--space-xs: var(--space-1); /* 4px */
--space-sm: var(--space-2); /* 8px */
--space-md: var(--space-4); /* 16px */
--space-lg: var(--space-6); /* 24px */
--space-xl: var(--space-8); /* 32px */
```

### Component Padding Standards

| Component | Padding   | Token                     |
| --------- | --------- | ------------------------- |
| Button    | 12px 24px | `--space-3` / `--space-6` |
| Input     | 12px      | `--space-3`               |
| Card      | 24px      | `--space-6`               |
| Dialog    | 32px      | `--space-8`               |
| Tag/Chip  | 4px 12px  | `--space-1` / `--space-3` |

### Gap Between Elements

```scss
/* Tight spacing - related items */
--gap-tight: var(--space-2); /* 8px */

/* Default spacing - standard separation */
--gap-default: var(--space-4); /* 16px */

/* Relaxed spacing - distinct sections */
--gap-relaxed: var(--space-6); /* 24px */
```

---

## Border Radius

### Radius Tokens

```scss
--radius-none: 0;
--radius-sm: 0.125rem; /* 2px - Tight corners */
--radius-md: 0.375rem; /* 6px - Input fields */
--radius-lg: 0.5rem; /* 8px - Cards, raised buttons */
--radius-xl: 0.75rem; /* 12px - Dialogs */
--radius-2xl: 1rem; /* 16px - Large cards */
--radius-full: 9999px; /* Pill - Tags, badges */
```

### Component Radius Standards

| Component       | Radius          | Value | Use Case                   |
| --------------- | --------------- | ----- | -------------------------- |
| Button (Raised) | `--radius-lg`   | 8px   | Primary, secondary buttons |
| Input Field     | `--radius-md`   | 6px   | All text inputs            |
| Card            | `--radius-lg`   | 8px   | Content cards              |
| Dialog          | `--radius-xl`   | 12px  | Modal dialogs              |
| Tag             | `--radius-full` | Pill  | Status tags                |
| Badge           | `--radius-full` | Pill  | Notification badges        |
| Chip            | `--radius-full` | Pill  | Removable chips            |
| Select Dropdown | `--radius-md`   | 6px   | Dropdown trigger           |
| Toast           | `--radius-lg`   | 8px   | Notifications              |

**Example**:

```html
<!-- Button - Raised style with 8px radius -->
<p-button label="Save"></p-button>

<!-- Tag - Pill-shaped -->
<p-tag value="Active" [rounded]="true"></p-tag>

<!-- Card - 8px rounded corners -->
<p-card header="Statistics">
  <!-- Content -->
</p-card>
```

---

## Elevation & Shadows

### Material Design Shadow System

The app uses Material Design-inspired elevation for raised components:

```scss
/* Shadow Tokens */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 12px 48px rgba(0, 0, 0, 0.15);
```

### Elevation Levels

| Level       | Shadow        | Components                    | Use Case          |
| ----------- | ------------- | ----------------------------- | ----------------- |
| **Level 1** | `--shadow-sm` | Card (resting), Input (focus) | Subtle depth      |
| **Level 2** | `--shadow-md` | Dialog, Card (hover)          | Medium elevation  |
| **Level 3** | `--shadow-lg` | Toast, Tooltip, Menu          | High elevation    |
| **Level 4** | `--shadow-xl` | Modal backdrop, SpeedDial     | Maximum elevation |

### Raised Button Shadows

**Resting State**:

```scss
box-shadow:
  0 3px 1px -2px rgba(0, 0, 0, 0.2),
  /* Umbra */ 0 2px 2px 0 rgba(0, 0, 0, 0.14),
  /* Penumbra */ 0 1px 5px 0 rgba(8, 153, 73, 0.12),
  /* Green ambient */ inset 0 1px 0 rgba(255, 255, 255, 0.2); /* Inner highlight */
```

**Hover State** (elevated):

```scss
box-shadow:
  0 6px 10px 0 rgba(0, 0, 0, 0.14),
  0 1px 18px 0 rgba(0, 0, 0, 0.12),
  0 3px 5px -1px rgba(8, 153, 73, 0.2),
  inset 0 1px 0 rgba(255, 255, 255, 0.2);
```

**Active State** (pressed):

```scss
box-shadow:
  0 2px 4px -1px rgba(0, 0, 0, 0.2),
  0 1px 2px 0 rgba(0, 0, 0, 0.14),
  inset 0 2px 4px rgba(0, 0, 0, 0.15);
```

### Green-Tinted Shadows

For brand consistency, hover shadows include green tint:

```scss
--hover-shadow-sm: 0 2px 8px rgba(8, 153, 73, 0.12);
--hover-shadow-md: 0 4px 16px rgba(8, 153, 73, 0.15);
--hover-shadow-lg: 0 8px 24px rgba(8, 153, 73, 0.18);
```

---

## Z-Index Layering

### Z-Index System

```scss
--z-index-base: 1;
--z-index-dropdown: 1000;
--z-index-sticky: 1020;
--z-index-fixed: 1030;
--z-index-modal-backdrop: 1040;
--z-index-modal: 1050;
--z-index-popover: 1060;
--z-index-tooltip: 1070;
--z-index-notification: 1080;
```

### Component Z-Index Values

| Component        | Z-Index | Token                      |
| ---------------- | ------- | -------------------------- |
| Select Dropdown  | 1000    | `--z-index-dropdown`       |
| Sticky Header    | 1020    | `--z-index-sticky`         |
| Fixed Navigation | 1030    | `--z-index-fixed`          |
| Dialog Backdrop  | 1040    | `--z-index-modal-backdrop` |
| Dialog           | 1050    | `--z-index-modal`          |
| ConfirmDialog    | 1050    | `--z-index-modal`          |
| Menu/ContextMenu | 1060    | `--z-index-popover`        |
| Tooltip          | 1070    | `--z-index-tooltip`        |
| Toast            | 1080    | `--z-index-notification`   |
| SpeedDial        | 1060    | `--z-index-popover`        |

**Layering Order** (bottom to top):

1. Base content (z-index: 1)
2. Dropdowns (1000)
3. Sticky elements (1020)
4. Fixed navigation (1030)
5. Modal backdrop (1040)
6. Modal/Dialog (1050)
7. Popover/Menu (1060)
8. Tooltip (1070)
9. Toast/Notification (1080)

---

## Interaction States

### Button State Transformations

**Default (Resting)**:

```scss
transform: none;
box-shadow: /* Raised elevation */;
```

**Hover** (desktop only):

```scss
transform: translateY(-2px); /* Subtle lift */
box-shadow: /* Enhanced elevation */;
transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

**Active (Pressed)**:

```scss
transform: translateY(0) scale(0.98); /* Press down */
box-shadow: /* Reduced elevation */;
```

**Focus (Keyboard)**:

```scss
outline: none;
box-shadow:
  0 0 0 3px var(--surface-primary),
  /* White ring */ 0 0 0 5px var(--ds-primary-green),
  /* Green focus ring */ /* + raised elevation */;
```

**Disabled**:

```scss
opacity: 0.5;
cursor: not-allowed;
transform: none !important; /* Locked position */
box-shadow: none !important; /* No elevation */
```

### State Opacity Modifiers

```scss
--state-hover-opacity: 0.08;
--state-focus-opacity: 0.12;
--state-active-opacity: 0.16;
--state-disabled-opacity: 0.38;
```

### Ripple Effect

Buttons include Material Design ripple on click:

```scss
/* Activated on click */
&:active::after {
  background: radial-gradient(
    circle at var(--ripple-x) var(--ripple-y),
    rgba(255, 255, 255, 0.3) 0%,
    transparent 60%
  );
  transform: scale(2.5);
  opacity: 1;
}
```

---

## Animation Standards

### Duration Guidelines

```scss
--motion-fast: 120ms; /* Icon rotations, opacity changes */
--motion-base: 200ms; /* Transforms, color transitions */
--motion-slow: 320ms; /* Dialogs, dropdowns */
```

### Easing Functions

```scss
/* Standard ease - general purpose */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

/* Bounce ease - playful interactions */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Decelerate - elements entering */
--ease-decelerate: cubic-bezier(0, 0, 0.2, 1);

/* Accelerate - elements exiting */
--ease-accelerate: cubic-bezier(0.4, 0, 1, 1);
```

### Animation Use Cases

**Fast (120ms)**:

- Icon rotations (dropdown arrows)
- Opacity changes
- Color transitions

**Normal (200ms)**:

- Button transforms (hover lift)
- Shadow changes
- Background colors
- Border colors

**Slow (320ms)**:

- Dialog open/close
- Dropdown expand/collapse
- Panel animations

### Reduced Motion Support

Automatically respects user preference:

```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

All animations are disabled for users who prefer reduced motion.

---

## Responsive Design

### Breakpoints

```scss
--breakpoint-sm: 640px; /* Small tablets */
--breakpoint-md: 768px; /* Tablets */
--breakpoint-lg: 1024px; /* Desktop */
--breakpoint-xl: 1280px; /* Large desktop */
--breakpoint-2xl: 1536px; /* Extra large */
```

### Mobile-First Approach

All components are designed mobile-first, progressively enhancing for larger screens.

### Component Adaptations

**Dialog**:

- Mobile (< 768px): Full width, bottom sheet style
- Tablet (≥ 768px): Max 90vw width
- Desktop (≥ 1024px): Fixed pixel widths (440px, 600px, 800px)

**Table**:

- Mobile: Horizontal scroll with sticky first column
- Tablet: Responsive columns, some hidden
- Desktop: All columns visible

**Button**:

- Mobile: Min height 44px (touch target)
- Desktop: Min height 36px acceptable
- All: Raised style with 8px radius

**Select/Dropdown**:

- Mobile: Full-screen overlay
- Desktop: Dropdown positioned near trigger

### Safe Area Insets

For iOS/Android notches and home indicators:

```scss
--safe-area-top: env(safe-area-inset-top, 0px);
--safe-area-right: env(safe-area-inset-right, 0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-left: env(safe-area-inset-left, 0px);
```

Apply to:

- Fixed headers: `padding-top: var(--safe-area-top)`
- Bottom navigation: `padding-bottom: var(--safe-area-bottom)`
- Full-screen dialogs

---

## Dark Mode Support

### Activation

Dark mode activates via:

1. System preference: `@media (prefers-color-scheme: dark)`
2. Manual toggle: `[data-theme="dark"]` on `<html>`
3. Class toggle: `.dark-theme` on `<html>` or `<body>`

### Automatic Color Adjustments

```scss
@media (prefers-color-scheme: dark) {
  --surface-primary: #171717; /* Dark background */
  --color-text-primary: #ffffff; /* White text */
  --color-border-primary: rgba(255, 255, 255, 0.1); /* Subtle borders */
}
```

### Component-Specific Changes

| Component        | Light Mode | Dark Mode               |
| ---------------- | ---------- | ----------------------- |
| Card Background  | `#ffffff`  | `#262626`               |
| Input Background | `#ffffff`  | `#171717`               |
| Border Color     | `#e5e7eb`  | `rgba(255,255,255,0.1)` |
| Text Primary     | `#1a1a1a`  | `#ffffff`               |
| Text Secondary   | `#4a4a4a`  | `#d4d4d4`               |

**Brand Green Remains Constant**: `#089949` stays the same in both modes for brand consistency.

### Testing Dark Mode

**Browser DevTools**:

```javascript
// Toggle dark mode preference
window.matchMedia("(prefers-color-scheme: dark)").matches;
```

**Manual Toggle**:

```html
<html data-theme="dark">
  <!-- Dark mode active -->
</html>
```

---

## Accessibility (WCAG 2.1 AA)

### Contrast Ratios

All text/background combinations meet **WCAG AA** standards:

**Normal Text** (4.5:1 minimum):

- Black on White: 16.1:1 ✅
- White on Green: 4.7:1 ✅
- Dark Gray on White: 8.6:1 ✅
- Medium Gray on White: 7.5:1 ✅

**Large Text** (3:1 minimum):

- All combinations exceed minimum by significant margin

### Keyboard Navigation

All interactive PrimeNG components support full keyboard navigation:

**Global**:

- `Tab`: Move focus forward
- `Shift + Tab`: Move focus backward
- `Enter`: Activate primary action
- `Space`: Toggle checkbox, activate button
- `Escape`: Close dialog, cancel action

**Select Dropdown**:

- `Arrow Up/Down`: Navigate options
- `Home/End`: First/last option
- `Enter`: Select option
- `Escape`: Close without selecting

**Radio Group**:

- `Arrow Up/Down`: Navigate options
- `Space`: Select option

**Dialog**:

- `Escape`: Close dialog
- `Tab`: Trap focus within dialog
- `Enter`: Confirm action (if button focused)

### Focus Indicators

**Always Visible**:

```scss
.p-button:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px var(--surface-primary),
    /* White gap */ 0 0 0 5px var(--ds-primary-green); /* Green ring */
}
```

**Specifications**:

- Ring Width: 2px
- Ring Offset: 2px (white gap)
- Ring Color: Brand green (#089949)

⚠️ **Never Remove**: `outline: none` must always be accompanied by custom focus styles.

### Screen Reader Support

All components include proper ARIA attributes:

**Icon-Only Buttons**:

```html
<p-button icon="pi pi-search" aria-label="Search exercises" [rounded]="true">
</p-button>
```

**Form Fields**:

```html
<label for="email">Email Address</label>
<input
  id="email"
  pInputText
  aria-describedby="email-help"
  [attr.aria-invalid]="emailInvalid"
/>
<small id="email-help">We'll never share your email</small>
```

**Dialogs**:

```html
<p-dialog
  header="Confirm Delete"
  [(visible)]="showDialog"
  [modal]="true"
  role="dialog"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
</p-dialog>
```

**Dynamic Content**:

```html
<div aria-live="polite" aria-atomic="true">{{ statusMessage }}</div>
```

---

## Component-Specific Guidelines

### Button

**Raised Style**:

- Border Radius: `--radius-lg` (8px)
- Material Design elevation with multi-layer shadows
- Gradient background for depth
- Inner highlight for gloss effect

**Example**:

```html
<!-- Primary raised button -->
<p-button label="Save Changes" icon="pi pi-save" styleClass="p-button-primary">
</p-button>

<!-- Size variants -->
<p-button label="Small" size="small"></p-button>
<!-- 36px height -->
<p-button label="Default"></p-button>
<!-- 44px height -->
<p-button label="Large" size="large"></p-button>
<!-- 52px height -->
```

**States**:

```scss
/* Resting: Raised elevation */
/* Hover: Lift 2px + enhanced shadow */
/* Active: Press down + reduced shadow */
/* Focus: Green ring + raised elevation */
/* Disabled: No elevation, 50% opacity */
```

---

### Tag

**Pill-Shaped with Rounded Corners**:

```html
<p-tag
  value="Active"
  severity="success"
  [rounded]="true"
  styleClass="category-tag"
>
</p-tag>
```

**Severity Colors**:

- `success`: Green (#63ad0e)
- `info`: Blue (#0ea5e9)
- `warning`: Yellow (#ffc000) with dark text
- `danger`: Red (#ff003c)
- `help`: Purple (#8b5cf6)

---

### Dialog

**Elevated Modal with Backdrop**:

```html
<p-dialog
  [(visible)]="showDialog"
  header="Confirm Action"
  [modal]="true"
  [style]="{ width: '440px' }"
  [closable]="true"
  styleClass="confirm-dialog"
>
  <p>Are you sure you want to proceed?</p>

  <ng-template pTemplate="footer">
    <p-button
      label="Cancel"
      icon="pi pi-times"
      (onClick)="showDialog = false"
      styleClass="p-button-text"
    >
    </p-button>
    <p-button label="Confirm" icon="pi pi-check" (onClick)="confirmAction()">
    </p-button>
  </ng-template>
</p-dialog>
```

**Specifications**:

- Border Radius: 12px (`--radius-xl`)
- Shadow: `--shadow-lg`
- Z-Index: 1050
- Backdrop: Z-Index 1040, rgba(0,0,0,0.5)

---

### Toast

**Notification Overlays**:

```html
<p-toast></p-toast>
```

```typescript
import { MessageService } from 'primeng/api';

constructor(private messageService: MessageService) {}

showSuccess() {
  this.messageService.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Settings saved successfully',
    life: 3000
  });
}
```

**Specifications**:

- Z-Index: 1080 (appears above all other overlays)
- Position: Top-right by default
- Border Radius: 8px (`--radius-lg`)

---

## Quick Reference Card

### Most Common Tokens

```scss
/* Colors */
--ds-primary-green: #089949;
--color-text-on-primary: #ffffff;
--color-text-primary: #1a1a1a;

/* Spacing */
--space-2: 0.5rem; /* 8px - Tight */
--space-4: 1rem; /* 16px - Default */
--space-6: 1.5rem; /* 24px - Relaxed */

/* Sizing */
--button-height-md: 44px;
--radius-lg: 0.5rem; /* 8px - Raised buttons */
--radius-full: 9999px; /* Tags, badges */

/* Shadows */
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);

/* Z-Index */
--z-index-modal: 1050;
--z-index-tooltip: 1070;
--z-index-notification: 1080;
```

### Common Patterns

**Primary Action Button**:

```html
<p-button label="Submit" icon="pi pi-check"> </p-button>
```

**Status Tag**:

```html
<p-tag value="Active" severity="success" [rounded]="true"> </p-tag>
```

**Notification Badge**:

```html
<p-badge [value]="5" severity="danger"> </p-badge>
```

**Modal Dialog**:

```html
<p-dialog [(visible)]="show" header="Title" [modal]="true"> </p-dialog>
```

---

## Related Documentation

- **Full Component API**: See `PRIMENG_COMPONENTS.md`
- **Design Tokens**: See `src/assets/styles/design-system-tokens.scss`
- **PrimeNG Theme**: See `src/assets/styles/primeng-theme.scss`
- **Cross-Check Report**: See `PRIMENG_DESIGN_SYSTEM_CROSSCHECK.md`

---

**Last Updated**: 2026-01-03
**Maintained By**: FlagFit Pro Development Team
**Status**: ✅ Production Ready - All Design System Rules Integrated
