# Input Component

## Overview

Standard text input component for forms. Supports multiple states (default, focus, error, success, disabled) and includes proper accessibility features.

## Usage

Copy the HTML from `input.html` into your page. Always pair with a `<label>` element.

## States

| State | Class | Usage |
|-------|-------|-------|
| Default | (none) | Normal input state |
| Error | `.error` | Validation error (red border) |
| Success | `.success` | Valid input (green border) |
| Disabled | `disabled` attribute | Non-interactive state |
| Focus | (automatic) | Keyboard/mouse interaction |

## HTML Structure

```html
<input 
    type="text" 
    id="input-id" 
    name="input-name"
    class="form-input"
    placeholder="Enter text..."
>
```

## With Label (Required)

```html
<label for="input-id" class="form-label">Label Text</label>
<input 
    type="text" 
    id="input-id" 
    name="input-name"
    class="form-input"
    placeholder="Enter text..."
>
```

## CSS Classes

- `.form-input` - Base input class (required)
- `.form-input.error` - Error state
- `.form-input.success` - Success state

## Input Types

All standard HTML5 input types are supported:
- `text` - Text input
- `email` - Email address
- `password` - Password (masked)
- `number` - Numeric input
- `tel` - Phone number
- `url` - URL input
- `search` - Search input
- `date`, `time`, `datetime-local` - Date/time pickers

## Accessibility

- ✅ Always use `<label>` with matching `id`
- ✅ 16px font size (prevents iOS automatic zoom)
- ✅ Error messages use `role="alert"`
- ✅ Required fields marked with `required` attribute
- ✅ Focus states visible for keyboard navigation

## Error Handling

```html
<div class="form-group">
    <label for="password" class="form-label">Password</label>
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

## Notes

- Always use `<label>` elements (not just placeholder)
- Include helper text or error messages for clarity
- Test focus states with keyboard (Tab key)
- Test on mobile to ensure 16px font size is honored
- Use appropriate `type` attribute for better mobile keyboards

