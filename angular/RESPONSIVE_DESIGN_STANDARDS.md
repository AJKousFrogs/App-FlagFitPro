# FlagFit Pro - Responsive Design Standards

**Version:** 1.0
**Last Updated:** December 30, 2024
**Status:** ✅ Standard

---

## Overview

This document establishes the responsive design standards for FlagFit Pro Angular frontend. All components must follow these standards to ensure a consistent, accessible experience across all devices.

---

## Standard Breakpoints

### Desktop-First Approach

We use a **mobile-first** approach with these standard breakpoints:

```scss
$breakpoints: (
  xs: 374px,   // Extra small mobile (iPhone SE, small Android)
  sm: 640px,   // Mobile phones (iPhone 12/13/14, standard Android)
  md: 768px,   // Tablets portrait (iPad Mini, Galaxy Tab)
  lg: 1024px,  // Tablets landscape / Small desktops
  xl: 1280px,  // Desktop (laptop screens)
  xxl: 1536px, // Large desktop (1080p+ monitors)
);
```

### Breakpoint Usage Matrix

| Breakpoint | Device Type | Viewport Width | Primary Use Case |
|-----------|-------------|----------------|------------------|
| **xs** | Extra small phones | < 374px | iPhone SE, older Android |
| **sm** | Mobile phones | 375px - 639px | iPhone 12/13/14, most phones |
| **md** | Tablets (portrait) | 640px - 767px | iPad Mini, small tablets |
| **lg** | Tablets (landscape) | 768px - 1023px | iPad, Galaxy Tab |
| **xl** | Desktop | 1024px - 1279px | Laptops, small monitors |
| **xxl** | Large desktop | 1280px+ | 1080p+ monitors |

---

## Using Breakpoints

### In SCSS (Recommended)

```scss
@import 'src/styles/variables';
@import 'src/styles/mixins';

.component {
  // Desktop first (default)
  padding: space(6);
  display: grid;
  grid-template-columns: repeat(4, 1fr);

  // Tablet landscape
  @include respond-to(lg) {
    grid-template-columns: repeat(2, 1fr);
    padding: space(4);
  }

  // Tablet portrait / Mobile
  @include respond-to(md) {
    grid-template-columns: 1fr;
    padding: space(3);
  }

  // Small mobile
  @include respond-to(xs) {
    padding: space(2);
  }
}
```

### Available Mixins

```scss
// Max-width (mobile-first approach)
@include respond-to(md) { /* max-width: 768px */ }

// Min-width (desktop-first approach)
@include respond-above(md) { /* min-width: 769px */ }

// Between two breakpoints
@include respond-between(md, lg) { /* 768px - 1024px */ }

// Touch devices
@include touch-device { /* (hover: none) and (pointer: coarse) */ }

// Hover support
@include hover-support { /* (hover: hover) and (pointer: fine) */ }

// Landscape orientation
@include landscape { /* orientation: landscape */ }
```

---

## Component Patterns

### 1. Grid Layouts

**Desktop:** Multi-column grid
**Tablet:** 2-3 columns
**Mobile:** Single column

```scss
.grid {
  @include grid-responsive(250px, space(4));

  @include respond-to(lg) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include respond-to(md) {
    grid-template-columns: 1fr;
  }
}
```

**Real Example:**
```scss
// Dashboard metrics grid
.metrics-row {
  @include grid-responsive(250px, space(4)); // Auto-fit columns, min 250px

  @include respond-to(md) {
    grid-template-columns: 1fr; // Single column on mobile
  }
}
```

---

### 2. Padding & Spacing

**Desktop:** Generous spacing
**Tablet:** Moderate spacing
**Mobile:** Compact spacing

```scss
.container {
  padding: space(6); // 32px desktop

  @include respond-to(lg) {
    padding: space(5); // 24px tablet
  }

  @include respond-to(md) {
    padding: space(4); // 16px mobile
  }

  @include respond-to(xs) {
    padding: space(3); // 12px small mobile
  }
}
```

**Standard Spacing Scale:**
```scss
space(3) = 12px  // Small mobile
space(4) = 16px  // Mobile
space(5) = 24px  // Tablet
space(6) = 32px  // Desktop
```

---

### 3. Typography

**Desktop:** Larger text
**Tablet:** Medium text
**Mobile:** Smaller, readable text

```scss
.heading {
  @include heading-1; // 36px desktop

  @include respond-to(md) {
    @include heading-2; // 30px mobile
  }
}

.body-text {
  @include text-style(base, normal, normal); // 16px

  @include respond-to(md) {
    @include text-style(sm, normal, normal); // 14px mobile
  }
}
```

---

### 4. Navigation

**Desktop:** Sidebar navigation
**Tablet:** Collapsible sidebar
**Mobile:** Bottom navigation

```scss
.sidebar {
  display: block;
  width: 250px;

  @include respond-to(lg) {
    position: fixed;
    transform: translateX(-100%);
    transition: transform get-transition(normal);

    &.open {
      transform: translateX(0);
    }
  }

  @include respond-to(md) {
    display: none; // Hide on mobile, show bottom nav instead
  }
}

.bottom-nav {
  display: none;

  @include respond-to(md) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
  }
}
```

---

### 5. Data Tables

**Desktop:** Full table
**Tablet:** Horizontal scroll
**Mobile:** Card layout

```scss
// Desktop table
.table-wrapper {
  overflow-x: auto;

  @include respond-to(md) {
    display: none; // Hide table on mobile
  }
}

// Mobile card view
.mobile-cards {
  display: none;

  @include respond-to(md) {
    display: block;
  }
}

.mobile-card {
  @include card(space(4), get-radius(lg));
  margin-bottom: space(3);

  .row {
    @include flex-between;
    padding: space(2) 0;
    border-bottom: 1px solid var(--color-border-secondary);

    &:last-child {
      border-bottom: none;
    }
  }

  .label {
    @include text-style(sm, semibold);
    color: var(--text-secondary);
  }

  .value {
    @include text-style(base, normal);
    color: var(--text-primary);
  }
}
```

---

### 6. Modals / Dialogs

**Desktop:** Fixed width (400px - 1140px)
**Tablet:** Adaptive width (90vw)
**Mobile:** Full width with padding

```scss
.modal {
  width: 560px;
  max-width: 95vw;

  @include respond-to(md) {
    width: 95vw;
    max-height: calc(100vh - space(8));
    margin: space(4);
  }

  @include respond-to(xs) {
    width: 100vw;
    height: 100vh;
    margin: 0;
    border-radius: 0;
  }
}

// Modal footer buttons
.modal-footer {
  @include flex-between;

  @include respond-to(md) {
    flex-direction: column-reverse;
    gap: space(2);

    button {
      width: 100%;
    }
  }
}
```

---

### 7. Forms

**Desktop:** Multi-column layout
**Tablet:** 2 columns
**Mobile:** Single column

```scss
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: space(4);

  @include respond-to(md) {
    grid-template-columns: 1fr;
    gap: space(3);
  }
}

.form-field {
  input, textarea, select {
    width: 100%;
    padding: space(3);
    font-size: get-font-size(base);

    @include touch-device {
      // Larger touch targets on mobile
      min-height: 44px;
      font-size: get-font-size(base); // 16px prevents zoom on iOS
    }
  }
}
```

---

### 8. Buttons

**Desktop:** Normal size
**Mobile:** Full width + larger touch targets

```scss
.button-group {
  display: flex;
  gap: space(3);

  @include respond-to(md) {
    flex-direction: column;
    gap: space(2);

    button {
      width: 100%;
    }
  }
}

button {
  @include button-base;
  min-width: 100px;

  @include touch-device {
    @include tap-target(44px); // Accessible touch target
  }
}
```

---

## Touch Device Optimizations

### Tap Targets

**Minimum size:** 44x44px (Apple HIG) / 48x48px (Material Design)

```scss
.clickable {
  @include tap-target(44px);

  @include touch-device {
    padding: space(3);
    min-height: 44px;
    min-width: 44px;
  }
}
```

### Hover States

**Desktop:** Show hover effects
**Touch:** No hover, focus on active state

```scss
.interactive {
  transition: background-color get-transition(fast);

  // Only apply hover on devices with hover support
  @include hover-support {
    &:hover {
      background-color: var(--surface-hover);
    }
  }

  // Active state for touch devices
  &:active {
    transform: scale(0.97);
  }
}
```

### Swipe Gestures

```scss
.swipeable {
  @include touch-device {
    touch-action: pan-y; // Allow vertical scroll, enable horizontal swipe
    user-select: none;
  }
}
```

---

## Testing Checklist

### Breakpoint Testing

Test each component at these key widths:

- [ ] **320px** - Smallest phones (iPhone SE)
- [ ] **375px** - Standard small phones (iPhone 12 Mini)
- [ ] **390px** - Standard phones (iPhone 13/14)
- [ ] **768px** - Tablets portrait (iPad)
- [ ] **1024px** - Tablets landscape
- [ ] **1280px** - Desktop
- [ ] **1920px** - Large desktop

### Device Testing

- [ ] **iOS Safari** (iPhone 12/13/14)
- [ ] **Android Chrome** (Pixel, Samsung)
- [ ] **iPad Safari** (Portrait & Landscape)
- [ ] **Desktop Chrome** (1080p, 1440p, 4K)
- [ ] **Desktop Firefox**
- [ ] **Desktop Safari**

### Interaction Testing

- [ ] Touch targets are 44x44px minimum
- [ ] Forms don't trigger zoom on iOS (16px font size minimum)
- [ ] Swipe gestures work naturally
- [ ] No hover-only interactions (must work on touch)
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes

---

## Common Responsive Patterns

### Pattern 1: Hide/Show Elements

```scss
// Hide on mobile, show on desktop
.desktop-only {
  display: block;

  @include respond-to(md) {
    display: none;
  }
}

// Show on mobile, hide on desktop
.mobile-only {
  display: none;

  @include respond-to(md) {
    display: block;
  }
}
```

### Pattern 2: Flex Direction Swap

```scss
.flex-container {
  display: flex;
  flex-direction: row;
  gap: space(4);

  @include respond-to(md) {
    flex-direction: column;
    gap: space(3);
  }
}
```

### Pattern 3: Conditional Padding

```scss
.section {
  padding: space(8) space(6);

  @include respond-to(lg) {
    padding: space(6) space(4);
  }

  @include respond-to(md) {
    padding: space(4) space(3);
  }
}
```

### Pattern 4: Font Size Scaling

```scss
.hero-title {
  @include text-style(5xl, bold, tight); // 48px

  @include respond-to(lg) {
    @include text-style(4xl, bold, tight); // 36px
  }

  @include respond-to(md) {
    @include text-style(3xl, bold, tight); // 30px
  }
}
```

---

## Performance Considerations

### 1. Use Media Query Mixins

**Good:**
```scss
@include respond-to(md) { /* styles */ }
```

**Bad:**
```scss
@media (max-width: 768px) { /* styles */ }
@media (max-width: 767px) { /* duplicate */ }
```

### 2. Mobile-First CSS

**Good:**
```scss
.element {
  font-size: get-font-size(sm); // Mobile default

  @include respond-above(md) {
    font-size: get-font-size(base); // Desktop override
  }
}
```

**Bad:**
```scss
.element {
  font-size: get-font-size(base); // Desktop default

  @include respond-to(md) {
    font-size: get-font-size(sm); // Mobile override (overrides more)
  }
}
```

### 3. Minimize Repaints

```scss
// Use transform instead of position changes
.slide-in {
  transform: translateX(0);
  transition: transform get-transition(normal);

  &.hidden {
    transform: translateX(-100%);
  }
}
```

---

## Accessibility & Responsive Design

### 1. Respect User Preferences

```scss
// Reduced motion
@include respect-motion-preference;

// High contrast
@include high-contrast {
  border-width: 2px;
}

// Dark mode
:host-context([data-theme="dark"]) {
  background: var(--surface-dark);
}
```

### 2. Keyboard Navigation

```scss
.nav-item {
  @include focus-visible; // Clear focus indicators

  // Ensure focus works on all breakpoints
  @include respond-to(md) {
    &:focus-visible {
      outline-offset: 4px; // More visible on small screens
    }
  }
}
```

### 3. Screen Reader Announcements

```html
<!-- Announce responsive changes -->
<div role="status" aria-live="polite" class="sr-only">
  {{ isMobile ? 'Mobile view active' : 'Desktop view active' }}
</div>
```

---

## Migration Checklist

When migrating a component to responsive standards:

- [ ] Replace hard-coded breakpoints with mixins
- [ ] Use spacing scale (`space()`) instead of hard-coded values
- [ ] Test at all key breakpoints (320px, 375px, 768px, 1024px, 1280px)
- [ ] Ensure touch targets are 44x44px minimum on mobile
- [ ] Remove hover-only interactions, ensure touch works
- [ ] Verify keyboard navigation at all breakpoints
- [ ] Test with screen reader
- [ ] Check for text zoom (200%) accessibility
- [ ] Verify no horizontal scroll on small screens
- [ ] Test in both portrait and landscape orientations

---

## Examples

See these components for reference:
- `athlete-dashboard.component.scss` - Full responsive dashboard
- `modal.component.scss` - Responsive modal sizing
- `main-layout.component.scss` - Responsive navigation

---

## Questions & Support

**Found a responsive issue?**
1. Document it with screenshots at each breakpoint
2. Reference this standard for the fix
3. Test fix at all breakpoints before committing

**Adding a new breakpoint?**
1. Update `_variables.scss`
2. Update this document
3. Notify the team
4. Update all existing responsive components

---

**Last Updated:** December 30, 2024
**Maintained By:** Development Team
