# Modern Design System Guide

## Overview

This design system is inspired by modern SaaS platforms (Linear, Notion, Superhuman) and Google Material principles, providing a crisp, professional UI with scalable primitives for both light and dark themes.

## Quick Start

### 1. Include the Design System

```html
<link rel="stylesheet" href="./src/modern-design-system.css">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### 2. Set Theme

```html
<!-- Light Theme (default) -->
<html data-theme="light">

<!-- Dark Theme -->
<html data-theme="dark">
```

## Typography

### Headings (All Bold - 700+)

```html
<h1>Heading 1 - 48px</h1>
<h2>Heading 2 - 36px</h2>
<h3>Heading 3 - 30px</h3>
<h4>Heading 4 - 24px</h4>
<h5>Heading 5 - 20px</h5>
<h6>Heading 6 - 18px</h6>
```

### Body Text

```html
<p class="body">Standard body text</p>
<p class="body-sm">Small body text</p>
<p class="body-lg">Large body text</p>
```

### Captions

```html
<span class="caption">UPPERCASE CAPTION</span>
```

### Interactive Headings

Headings with links automatically get hover effects (color change + underline):

```html
<h2><a href="#">Interactive Heading</a></h2>
```

## Cards

### Basic Card

```html
<div class="card">
  <div class="card-body">
    <h3>Card Title</h3>
    <p>Card content goes here</p>
  </div>
</div>
```

### Card with Header/Footer

```html
<div class="card">
  <div class="card-header">
    <h3>Card Header</h3>
  </div>
  <div class="card-body">
    <p>Card content</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Action</button>
  </div>
</div>
```

### Elevated Card

```html
<div class="card card-elevated">
  <div class="card-body">
    <p>Elevated card with stronger shadow</p>
  </div>
</div>
```

### Interactive Card

```html
<div class="card card-interactive">
  <div class="card-body">
    <p>Clickable card with hover lift</p>
  </div>
</div>
```

## Buttons

### Primary Button

```html
<button class="btn btn-primary">Primary Action</button>
```

### Secondary Button

```html
<button class="btn btn-secondary">Secondary Action</button>
```

### Tertiary Button

```html
<button class="btn btn-tertiary">Tertiary Action</button>
```

### Ghost Button

```html
<button class="btn btn-ghost">Ghost Button</button>
```

### Button Sizes

```html
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Default</button>
<button class="btn btn-primary btn-lg">Large</button>
```

### Disabled State

```html
<button class="btn btn-primary" disabled>Disabled</button>
```

## Search

### Search Bar

```html
<div class="search-container">
  <span class="search-icon">
    <svg>...</svg>
  </span>
  <input type="search" class="search-input" placeholder="Search...">
</div>
```

### Search with Results Dropdown

```html
<div class="search-container">
  <span class="search-icon">🔍</span>
  <input type="search" class="search-input" placeholder="Search...">
  <div class="search-results">
    <div class="search-result-item">Result 1</div>
    <div class="search-result-item selected">Result 2 (selected)</div>
    <div class="search-result-item">Result 3</div>
  </div>
</div>
```

## Tables/Lists

### Basic Table

```html
<div class="table-container">
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td>Admin</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Table with Zebra Striping

```html
<div class="table-container">
  <table class="table-zebra">
    <!-- Table content -->
  </table>
</div>
```

## Inputs

### Text Input

```html
<div class="input-group">
  <label class="input-label">Email</label>
  <input type="email" class="input" placeholder="Enter your email">
  <span class="input-help">We'll never share your email</span>
</div>
```

### Required Field

```html
<div class="input-group">
  <label class="input-label required">Password</label>
  <input type="password" class="input" required>
</div>
```

### Error State

```html
<div class="input-group">
  <label class="input-label">Email</label>
  <input type="email" class="input error" value="invalid-email">
  <span class="input-error">Please enter a valid email address</span>
</div>
```

### Success State

```html
<input type="email" class="input success" value="valid@email.com">
```

### Select

```html
<div class="input-group">
  <label class="input-label">Country</label>
  <select class="select">
    <option>United States</option>
    <option>Canada</option>
  </select>
</div>
```

### Textarea

```html
<div class="input-group">
  <label class="input-label">Message</label>
  <textarea class="textarea" rows="4"></textarea>
</div>
```

## Toggle Switch

```html
<label class="toggle-switch">
  <input type="checkbox">
  <span class="toggle-slider"></span>
</label>
```

## Alerts

```html
<div class="alert alert-success">
  <span class="icon icon-success">✓</span>
  <div>Operation completed successfully!</div>
</div>

<div class="alert alert-error">
  <span class="icon icon-error">✕</span>
  <div>An error occurred. Please try again.</div>
</div>

<div class="alert alert-warning">
  <span class="icon icon-warning">⚠</span>
  <div>Please review your input.</div>
</div>

<div class="alert alert-info">
  <span class="icon icon-info">ℹ</span>
  <div>New features are available.</div>
</div>
```

## Toasts

```html
<div class="toast-container">
  <div class="toast">
    <span class="icon icon-success">✓</span>
    <div>Changes saved successfully</div>
  </div>
</div>
```

## Modals

```html
<div class="modal-overlay">
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Modal Title</h2>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body">
      <p>Modal content goes here</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

## Loaders/Spinners

```html
<!-- Small Spinner -->
<div class="spinner"></div>

<!-- Large Spinner -->
<div class="spinner spinner-lg"></div>

<!-- Loader Container -->
<div class="loader">
  <div class="spinner spinner-lg"></div>
</div>
```

## Icons

```html
<!-- Standard Icon -->
<span class="icon">🔍</span>

<!-- Icon Sizes -->
<span class="icon icon-sm">🔍</span>
<span class="icon">🔍</span>
<span class="icon icon-lg">🔍</span>
<span class="icon icon-xl">🔍</span>

<!-- State Icons -->
<span class="icon icon-success">✓</span>
<span class="icon icon-error">✕</span>
<span class="icon icon-warning">⚠</span>
<span class="icon icon-info">ℹ</span>
```

## Layout Utilities

### Container

```html
<div class="container">
  <!-- Max width 1280px, centered -->
</div>
```

### Grid

```html
<div class="grid grid-cols-3 gap-6">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
  <div class="card">Item 3</div>
</div>
```

### Flex

```html
<div class="flex items-center justify-between gap-4">
  <div>Left</div>
  <div>Right</div>
</div>
```

## Accessibility

### Focus States

All interactive elements have visible focus states:

- Buttons: 2px solid outline with offset
- Inputs: 3px shadow ring
- Links: Underline on focus

### Screen Reader Support

```html
<button class="btn btn-primary">
  <span class="sr-only">Close dialog</span>
  <span aria-hidden="true">×</span>
</button>
```

### ARIA Labels

```html
<button class="btn btn-primary" aria-label="Save changes">
  Save
</button>
```

## Responsive Design

The design system is fully responsive with breakpoints:

- **Desktop**: Default styles
- **Tablet** (≤768px): Adjusted spacing and typography
- **Mobile** (≤480px): Single column layouts, reduced padding

## Theme Switching

### CSS Variables

All colors use CSS variables that automatically adapt to theme:

```css
/* Light Theme */
--bg-primary: #ffffff;
--text-primary: #171717;

/* Dark Theme */
--bg-primary: #0a0a0a;
--text-primary: #fafafa;
```

### JavaScript Theme Toggle

```javascript
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
```

## Best Practices

1. **Use semantic HTML** - Always use proper heading hierarchy
2. **Maintain spacing** - Use the 8px grid system consistently
3. **Color contrast** - All text meets WCAG AA standards
4. **Focus states** - Never remove focus indicators
5. **Responsive** - Test on mobile, tablet, and desktop
6. **Accessibility** - Include ARIA labels where needed

## Color System

### Primary Accent
- `--primary-500`: Main brand color (#10c96b)
- `--primary-600`: Hover states
- `--primary-700`: Active states

### Semantic Colors
- Success: Green (`--success-500`)
- Error: Red (`--error-500`)
- Warning: Amber (`--warning-500`)
- Info: Blue (`--info-500`)

### Neutral Palette
- Backgrounds: `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`
- Borders: `--border-subtle`, `--border-default`, `--border-strong`

## Spacing System (8px Grid)

- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-12`: 48px

## Shadows

- `--shadow-xs`: Subtle elevation
- `--shadow-sm`: Small elevation
- `--shadow-md`: Medium elevation (default cards)
- `--shadow-lg`: Large elevation (modals, dropdowns)
- `--shadow-xl`: Extra large elevation
- `--shadow-2xl`: Maximum elevation

## Animations

All transitions use consistent timing:
- Fast: 150ms
- Normal: 200ms
- Slow: 300ms
- Slower: 500ms

Easing functions:
- `--easing-out`: Default (cubic-bezier)
- `--easing-in-out`: Smooth transitions
- `--easing-linear`: Linear animations

