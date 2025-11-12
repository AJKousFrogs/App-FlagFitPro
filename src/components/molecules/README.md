# Molecules

## Overview

Molecules are combinations of atoms that form functional units. They represent simple groups of UI elements functioning together as a unit.

## Components

### Form Input
Complete form input with label, input field, helper text, and error handling.

**File:** `form-input/form-input.html`  
**Documentation:** `form-input/README.md`

**Quick Example:**
```html
<div class="form-group">
    <label for="email" class="form-label">Email</label>
    <input type="email" id="email" class="form-input">
</div>
```

### Card
Content container component with header, body, and footer sections.

**File:** `card/card.html`  
**Documentation:** `card/README.md`

**Quick Example:**
```html
<div class="card">
    <div class="card-header">Title</div>
    <div class="card-body">Content</div>
</div>
```

### Search Bar
Search input component with icon and clear functionality.

**File:** `search-bar/search-bar.html`  
**Documentation:** `search-bar/README.md`

**Quick Example:**
```html
<div class="search-bar">
    <i data-lucide="search" style="width: 20px; height: 20px;"></i>
    <input type="search" class="search-input" placeholder="Search...">
</div>
```

### Form Group
Container component for form fields with consistent spacing.

**File:** `form-group/form-group.html`  
**Documentation:** `form-group/README.md`

**Quick Example:**
```html
<div class="form-group">
    <label for="field" class="form-label">Label</label>
    <input type="text" id="field" class="form-input">
</div>
```

## Usage

Molecules combine atoms into functional units:

```html
<!-- Form Input molecule combines label + input atoms -->
<div class="form-group">
    <label for="email" class="form-label">Email</label>
    <input type="email" id="email" class="form-input">
    <small class="form-hint">Helper text</small>
</div>
```

## Design Principles

- **Functional Units** - Molecules serve a specific purpose
- **Composable** - Built from atoms
- **Reusable** - Can be used across pages
- **Consistent** - Follow design patterns

## Common Patterns

### Form Fields
Form inputs with labels and validation:

```html
<div class="form-group">
    <label for="input" class="form-label">Label</label>
    <input type="text" id="input" class="form-input">
    <div class="form-error" role="alert">Error message</div>
</div>
```

### Content Cards
Cards for displaying grouped content:

```html
<div class="card">
    <div class="card-header">
        <h3>Title</h3>
    </div>
    <div class="card-body">
        <p>Content</p>
    </div>
    <div class="card-footer">
        <button class="btn btn-primary btn-sm">Action</button>
    </div>
</div>
```

## Notes

- Molecules are more complex than atoms
- They combine multiple atoms
- They serve specific functional purposes
- They can be used in organisms or standalone

