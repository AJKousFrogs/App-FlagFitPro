# Form Group Component

## Overview

Container component for form fields that provides consistent spacing and structure. Wraps label, input, and helper/error messages together.

## Usage

Copy the HTML from `form-group.html` into your forms. Use one form group per form field.

## HTML Structure

```html
<div class="form-group">
  <label for="input-id" class="form-label">Label</label>
  <input type="text" id="input-id" class="form-input" />
  <small class="form-hint">Helper text</small>
</div>
```

## CSS Classes

- `.form-group` - Container wrapper (required)
- `.form-label` - Label styling
- `.form-input` - Input field
- `.form-hint` - Helper text
- `.form-error` - Error message
- `.form-success` - Success message

## Benefits

- Consistent spacing between form fields
- Groups related elements (label, input, messages)
- Easier to maintain form layouts
- Consistent error handling structure

## Form Layout

```html
<form>
  <div class="form-group">
    <label for="name" class="form-label">Name</label>
    <input type="text" id="name" class="form-input" required />
  </div>

  <div class="form-group">
    <label for="email" class="form-label">Email</label>
    <input type="email" id="email" class="form-input" required />
  </div>

  <button type="submit" class="btn btn-primary btn-md">Submit</button>
</form>
```

## Notes

- One form group per form field
- Provides consistent vertical spacing
- Groups label, input, and messages together
- Makes forms easier to maintain
