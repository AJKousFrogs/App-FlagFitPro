# Form Input Component

## Overview

Complete form input component with label, input field, helper text, and error handling. This is a molecule combining the input atom with label and messaging.

## Usage

Copy the HTML from `form-input.html` into your forms. Always include a `<label>` element with matching `id`.

## Structure

```html
<div class="form-group">
    <label for="input-id" class="form-label">Label</label>
    <input type="text" id="input-id" class="form-input">
    <small class="form-hint">Helper text</small>
</div>
```

## CSS Classes

- `.form-group` - Container wrapper (required)
- `.form-label` - Label styling
- `.form-input` - Input field styling
- `.form-input.error` - Error state
- `.form-input.success` - Success state
- `.form-hint` - Helper text (small gray text)
- `.form-error` - Error message (red text)
- `.form-success` - Success message (green text)
- `.required` - Required field indicator

## States

| State | Class | Usage |
|-------|-------|-------|
| Default | (none) | Normal input |
| Error | `.error` | Validation failed |
| Success | `.success` | Validation passed |
| Disabled | `disabled` attribute | Cannot edit |
| Focus | (automatic) | Keyboard/mouse interaction |

## Required Fields

```html
<label for="name" class="form-label required">
    <span>Athlete Name</span>
    <span class="required-indicator" aria-label="required">*</span>
</label>
```

## Error Handling

```html
<div class="form-group">
    <label for="password" class="form-label required">Password</label>
    <input 
        type="password" 
        id="password" 
        name="password"
        class="form-input error"
    >
    <div class="form-error" role="alert">
        Password must be at least 8 characters
    </div>
</div>
```

**Important:** Error messages use `role="alert"` for screen readers.

## Helper Text

```html
<div class="form-group">
    <label for="email" class="form-label">Email</label>
    <input type="email" id="email" class="form-input">
    <small class="form-hint">We'll never share your email</small>
</div>
```

## Input with Icon

```html
<div class="form-group">
    <label for="search" class="form-label">Search</label>
    <div style="position: relative;">
        <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; color: var(--color-text-secondary);"></i>
        <input 
            type="search" 
            id="search" 
            class="form-input"
            style="padding-left: 40px;"
        >
    </div>
</div>
```

## Accessibility

- ✅ Always use `<label>` with matching `id`
- ✅ 16px font size (prevents iOS zoom)
- ✅ Error messages use `role="alert"`
- ✅ Required fields marked with `required` attribute and visual indicator
- ✅ Focus states visible for keyboard navigation

## Notes

- Always use `<label>` elements (not just placeholder)
- Include helper text or error messages for clarity
- Test focus states with keyboard (Tab key)
- Test on mobile to ensure 16px font size is honored
- Use appropriate `type` attribute for better mobile keyboards

