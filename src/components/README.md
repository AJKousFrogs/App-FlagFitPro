# FlagFit Pro Component Library

## Overview

This is the complete component library for FlagFit Pro, organized using Atomic Design principles. All components are HTML-based and use the design system CSS classes from `src/css/main.css`.

## Structure

```
src/components/
├── atoms/              # Basic building blocks
│   ├── button/
│   ├── input/
│   ├── badge/
│   └── icon/
├── molecules/          # Combinations of atoms
│   ├── form-input/
│   ├── card/
│   ├── search-bar/
│   └── form-group/
├── organisms/          # Complex components
│   ├── navigation-sidebar/
│   ├── dashboard-header/
│   ├── performance-chart/
│   └── roster-table/
└── templates/          # Full page layouts
    ├── dashboard-layout.html
    ├── auth-layout.html
    └── admin-layout.html
```

## Atomic Design Principles

### Atoms

Basic building blocks that cannot be broken down further:

- **Button** - Interactive button element
- **Input** - Text input field
- **Badge** - Status indicator
- **Icon** - Lucide icon component

### Molecules

Combinations of atoms that form functional units:

- **Form Input** - Input with label and validation
- **Card** - Content container
- **Search Bar** - Search input with icon
- **Form Group** - Form field container

### Organisms

Complex components combining molecules and atoms:

- **Navigation Sidebar** - Main navigation
- **Dashboard Header** - Page header with actions
- **Performance Chart** - Data visualization
- **Roster Table** - Data table with actions

### Templates

Full page layouts combining organisms:

- **Dashboard Layout** - Main app layout
- **Auth Layout** - Login/register pages
- **Admin Layout** - Admin panel layout

## How to Use

### 1. Copy Component HTML

Each component has an HTML file with the markup:

```html
<!-- Copy from src/components/atoms/button/button.html -->
<button class="btn btn-primary btn-md">Click Me</button>
```

### 2. Include Required CSS

All components use the design system CSS:

```html
<link rel="stylesheet" href="./src/css/main.css" />
```

### 3. Initialize Icons

For components with icons, initialize Lucide:

```html
<script src="https://unpkg.com/lucide@latest"></script>
<script src="./src/icon-helper.js"></script>
```

### 4. Read Documentation

Each component has a README.md with:

- Usage examples
- CSS classes
- Accessibility notes
- Variants and states

## Component Showcase

View all components in action at `component-library.html` - a living documentation page that displays all components with code snippets.

## Design System Integration

All components use:

- **Design Tokens** - CSS variables from `src/css/tokens.css`
- **Component Styles** - CSS from `src/css/components/`
- **Utility Classes** - Helpers from `src/css/utilities.css`
- **Theme Support** - Light/dark themes from `src/css/themes/`

## Naming Conventions

- **CSS Classes** - Use design system classes (`.btn`, `.card`, etc.)
- **Component Files** - `component-name.html`
- **Documentation** - `README.md` in each component folder
- **Examples** - `component-name-examples.html` (optional)

## Accessibility

All components include:

- ✅ Semantic HTML elements
- ✅ ARIA attributes where needed
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Screen reader support

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Custom Properties support required
- JavaScript for interactive features

## Contributing

When adding new components:

1. Follow Atomic Design principles
2. Use design system CSS classes
3. Include HTML markup file
4. Add README.md documentation
5. Update component-library.html showcase
6. Test accessibility features

## Quick Reference

### Common Components

**Button:**

```html
<button class="btn btn-primary btn-md">Action</button>
```

**Card:**

```html
<div class="card">
  <div class="card-body">Content</div>
</div>
```

**Form Input:**

```html
<div class="form-group">
  <label for="input" class="form-label">Label</label>
  <input type="text" id="input" class="form-input" />
</div>
```

**Badge:**

```html
<span class="badge badge-primary">Status</span>
```

## Resources

- **Design System:** `DESIGN_SYSTEM_DOCUMENTATION.md`
- **CSS Architecture:** `CSS_ARCHITECTURE_GUIDE.md`
- **Component Showcase:** `component-library.html`
