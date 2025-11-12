# Atoms

## Overview

Atoms are the basic building blocks of the design system. They cannot be broken down further and represent the smallest functional units.

## Components

### Button

Interactive button element with multiple variants and sizes.

**File:** `button/button.html`  
**Documentation:** `button/README.md`

**Quick Example:**

```html
<button class="btn btn-primary btn-md">Click Me</button>
```

### Input

Text input field with states (default, error, success, disabled).

**File:** `input/input.html`  
**Documentation:** `input/README.md`

**Quick Example:**

```html
<input type="text" class="form-input" placeholder="Enter text..." />
```

### Badge

Status indicator, label, or tag for displaying metadata.

**File:** `badge/badge.html`  
**Documentation:** `badge/README.md`

**Quick Example:**

```html
<span class="badge badge-primary">New</span>
```

### Icon

Lucide icon component with size and color options.

**File:** `icon/icon.html`  
**Documentation:** `icon/README.md`

**Quick Example:**

```html
<i data-lucide="home" style="width: 24px; height: 24px;"></i>
```

## Usage

Atoms are typically combined into molecules, but can be used standalone:

```html
<!-- Standalone button -->
<button class="btn btn-primary btn-md">Save</button>

<!-- Button in a form group (molecule) -->
<div class="form-group">
  <button type="submit" class="btn btn-primary btn-md">Submit</button>
</div>
```

## Design Principles

- **Single Responsibility** - Each atom does one thing
- **Reusable** - Can be used in multiple contexts
- **Consistent** - Follow design system tokens
- **Accessible** - Include proper semantics and ARIA

## CSS Classes

All atoms use design system CSS classes:

- `.btn` - Button base class
- `.form-input` - Input base class
- `.badge` - Badge base class
- Icons use `data-lucide` attribute

## Notes

- Atoms are the foundation - keep them simple
- Don't add complex logic to atoms
- Use design tokens for styling
- Ensure accessibility from the start
