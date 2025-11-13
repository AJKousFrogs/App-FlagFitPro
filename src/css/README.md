# CSS Architecture - FlagFit Pro

## Overview

Production-grade, modular CSS architecture following SMACSS principles with CSS Cascade Layers for explicit specificity control.

## Architecture Principles

1. **Separation of Concerns**: Layout, components, state, and utilities are separate
2. **Cascade Layers**: Explicit control over style precedence
3. **Design Tokens**: Single source of truth for design values
4. **Naming Conventions**: Clear prefixes for different concerns
5. **Accessibility First**: Built-in a11y features and high-contrast support

## Directory Structure

```
src/css/
├── main.css                    # Entry point with @layer declarations
├── tokens.css                  # Design tokens (CSS variables)
├── breakpoints.css             # Centralized breakpoint definitions
├── base.css                    # Resets, base styles, accessibility
├── layout.css                  # Page structure (.l-*)
├── utilities.css               # Helper classes (.u-*)
├── state.css                   # Dynamic states (.is-*, .has-*)
├── animations.css              # Keyframes & transitions
├── hooks.css                   # JavaScript hooks (.js-*)
├── components/                 # Component-specific styles
│   ├── button.css
│   ├── card.css
│   ├── badge.css
│   ├── form.css
│   ├── modal.css
│   └── alert.css
├── themes/                     # Theme overrides
│   ├── light.css
│   ├── dark.css
│   └── high-contrast.css
├── README.md                   # This file
├── MIGRATION.md                # Migration guide
└── TROUBLESHOOTING.md          # Common issues & solutions
```

## Naming Conventions

### Layout (`.l-*`)

Page-wide structural positioning:

- `.l-header`, `.l-main`, `.l-sidebar`, `.l-footer`
- `.l-container`, `.l-grid`, `.l-flex`
- `.l-page`, `.l-page-sidebar`, `.l-page-centered`

### Components (no prefix)

Reusable UI components:

- `.btn`, `.card`, `.form-input`, `.modal`
- `.badge`, `.alert`

### State (`.is-*`, `.has-*`)

Dynamic states controlled by JavaScript:

- `.is-active`, `.is-disabled`, `.is-loading`
- `.has-error`, `.has-warning`, `.has-success`

### Utilities (`.u-*`)

Single-purpose helper classes:

- `.u-margin-16`, `.u-padding-24`
- `.u-text-heading-lg`, `.u-text-primary`
- `.u-display-flex`, `.u-justify-between`

### JavaScript Hooks (`.js-*`)

Non-styled classes for JS targeting:

- `.js-modal-trigger`, `.js-dropdown-menu`
- `.js-theme-toggle`, `.js-animation-trigger`

## Cascade Layers

The architecture uses CSS `@layer` for explicit specificity control:

```css
@layer reset, base, tokens, breakpoints, theme, layout, components, state, animations, utilities, hooks;
```

**Layer Priority** (lowest to highest):

1. `reset` - CSS resets
2. `base` - Base element styles
3. `tokens` - Design tokens
4. `breakpoints` - Breakpoint definitions
5. `theme` - Theme overrides
6. `layout` - Page structure
7. `components` - Component styles
8. `state` - Dynamic states
9. `animations` - Motion utilities
10. `utilities` - Helper classes (highest specificity)
11. `hooks` - JavaScript hooks (no styles)

## Usage

### Basic Setup

```html
<link rel="stylesheet" href="./src/css/main.css" />
```

### Design Tokens

All design values are available as CSS custom properties:

```css
.my-component {
  color: var(--color-brand-primary);
  padding: var(--spacing-component-md);
  border-radius: var(--radius-component-lg);
  font-size: var(--typography-heading-md-size);
}
```

### Layout Classes

```html
<div class="l-page-sidebar">
  <aside class="l-sidebar">Sidebar</aside>
  <main class="l-main">
    <div class="l-container">
      <div class="l-grid l-grid-3">
        <!-- content -->
      </div>
    </div>
  </main>
</div>
```

### Component Classes

```html
<!-- Button -->
<button class="btn btn-primary btn-lg">Click me</button>

<!-- Card -->
<div class="card">
  <div class="card-header">Header</div>
  <div class="card-body">Body</div>
</div>

<!-- Form -->
<div class="form-group">
  <label class="form-label">Name</label>
  <input type="text" class="form-input" />
</div>
```

### State Classes

```html
<button class="btn btn-primary is-active">Active</button>
<div class="form-group has-error">
  <input type="text" class="form-input" />
</div>
```

### Utility Classes

```html
<div class="u-margin-24 u-padding-16 u-bg-secondary">
  <h2 class="u-text-heading-lg u-text-primary">Title</h2>
  <p class="u-text-body-md u-text-secondary">Content</p>
</div>
```

### JavaScript Hooks

```html
<button class="btn btn-primary js-modal-trigger" data-modal="example">
  Open Modal
</button>
```

```javascript
document.querySelectorAll(".js-modal-trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const modalId = trigger.dataset.modal;
    // Open modal logic
  });
});
```

## Component API Reference

### Button

**Markup:**

```html
<button class="btn btn-primary btn-lg">Click</button>
```

**Variants:**

- `.btn-primary` - Primary action
- `.btn-secondary` - Secondary action
- `.btn-tertiary` - Tertiary action
- `.btn-success` - Success state
- `.btn-warning` - Warning state
- `.btn-error` - Error state

**Sizes:**

- `.btn-xs` - Extra small (28px)
- `.btn-sm` - Small (36px)
- `.btn-md` - Medium (44px)
- `.btn-lg` - Large (52px)
- `.btn-xl` - Extra large (60px)

### Card

**Markup:**

```html
<div class="card">
  <div class="card-header">Header</div>
  <div class="card-body">Body</div>
  <div class="card-footer">Footer</div>
</div>
```

**Variants:**

- `.card` - Standard card
- `.card-elevated` - Elevated shadow, high contrast
- `.card-interactive` - Interactive with gradient accent

### Form

**Markup:**

```html
<div class="form-group">
  <label class="form-label required">Name</label>
  <input type="text" class="form-input" />
  <span class="form-help">Helper text</span>
  <span class="form-error">Error message</span>
</div>
```

**Input Types:**

- `.form-input` - Text input
- `.form-textarea` - Textarea
- `.form-select` - Select dropdown

**States:**

- `.form-input.error` - Error state
- `.form-input:disabled` - Disabled state

### Modal

**Markup:**

```html
<div class="modal-overlay">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Title</h3>
      <button class="js-modal-close">×</button>
    </div>
    <div class="modal-body">Content</div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

**JavaScript:**

```javascript
// Toggle modal
modalOverlay.classList.toggle("open");
```

### Alert

**Markup:**

```html
<div class="alert alert-success">
  <span>Success message</span>
</div>
```

**Variants:**

- `.alert-info` - Info message
- `.alert-success` - Success message
- `.alert-warning` - Warning message
- `.alert-error` - Error message

### Badge

**Markup:**

```html
<span class="badge badge-primary">New</span>
```

**Variants:**

- `.badge-primary` - Primary badge
- `.badge-secondary` - Secondary badge
- `.badge-success` - Success badge
- `.badge-warning` - Warning badge
- `.badge-error` - Error badge
- `.badge-info` - Info badge

## Breakpoints

Content-based breakpoints (not device-specific):

```css
--bp-mobile: 320px;
--bp-mobile-lg: 480px;
--bp-tablet: 768px;
--bp-tablet-lg: 1024px;
--bp-desktop: 1280px;
--bp-wide: 1440px;
--bp-ultrawide: 1920px;
```

**Usage:**

```css
@media (min-width: var(--bp-tablet)) {
  /* Tablet and up */
}
```

## Themes

### Light Theme (Default)

```html
<html data-theme="light">
  <!-- or -->
  <html class="light"></html>
</html>
```

### Dark Theme

```html
<html data-theme="dark">
  <!-- or -->
  <html class="dark"></html>
</html>
```

### High Contrast Theme

```html
<html data-theme="high-contrast"></html>
```

**System Preference:**
Themes automatically respect `prefers-color-scheme` when no manual theme is set.

## Accessibility

### Built-in Features

1. **Focus Management**
   - Visible focus indicators
   - Keyboard navigation support
   - Skip links

2. **Reduced Motion**
   - Respects `prefers-reduced-motion`
   - Animations disabled when requested

3. **High Contrast**
   - High contrast theme
   - Supports `prefers-contrast: high`
   - Windows High Contrast mode support

4. **ARIA Support**
   - ARIA attribute styling
   - Screen reader support
   - Semantic HTML

### Screen Reader Only

```html
<span class="sr-only">Hidden from visual display</span>
<a href="#main" class="skip-link">Skip to main content</a>
```

## Animations

### Animation Classes

```html
<div class="u-animate-fade-in">Fade in</div>
<div class="u-animate-slide-in-up">Slide in</div>
<div class="u-animate-pulse">Pulse</div>
```

### Transition Classes

```html
<div class="u-transition-colors">Color transitions</div>
<div class="u-transition-all">All transitions</div>
```

### Custom Animations

```css
@keyframes customAnimation {
  from {
    /* ... */
  }
  to {
    /* ... */
  }
}
```

## Performance

### Best Practices

1. **Single Import**: Use `main.css` only
2. **Critical CSS**: Inline above-the-fold styles
3. **Minification**: Minify for production
4. **Caching**: Set appropriate cache headers

### File Size

- `main.css`: ~50KB (unminified)
- Minified: ~35KB
- Gzipped: ~8KB

## Browser Support

- Chrome 99+
- Firefox 97+
- Safari 15.4+
- Edge 99+

**Required Features:**

- CSS Custom Properties
- CSS Cascade Layers (`@layer`)
- CSS Grid
- Flexbox

## Testing Checklist

- [ ] Visual rendering in all browsers
- [ ] Responsive breakpoints work
- [ ] Theme switching functions
- [ ] JavaScript hooks work
- [ ] State classes toggle correctly
- [ ] Animations play smoothly
- [ ] Reduced motion respected
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators visible
- [ ] High contrast mode works

## Migration

See `MIGRATION.md` for step-by-step migration guide.

## Troubleshooting

See `TROUBLESHOOTING.md` for common issues and solutions.

## Contributing

### Adding a Component

1. Create `components/new-component.css`
2. Import in `main.css` within `components` layer
3. Document in this README
4. Add examples

### Adding a Utility

1. Add to `utilities.css` within `utilities` layer
2. Follow `.u-` prefix convention
3. Document in this README
4. Use design tokens

### Modifying Tokens

1. Edit `tokens.css`
2. Changes propagate automatically
3. Test theme switching
4. Update documentation

## Resources

- [SMACSS Documentation](http://smacss.com/)
- [CSS Cascade Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [Design Tokens](https://www.designtokens.org/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## License

Internal use only - FlagFit Pro
