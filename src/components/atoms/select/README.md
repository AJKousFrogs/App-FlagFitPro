# Select/Dropdown Component

## Overview

Dropdown select component for choosing from a list of options. Supports single and multiple selection, validation states, and option groups.

## Usage

Copy the HTML from `select.html` into your page. Always pair with a `<label>` element.

## HTML Structure

```html
<select id="select-id" name="select-name" class="form-input form-select">
  <option value="">Choose an option</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>
```

## With Label

```html
<div class="form-group">
  <label for="select-id" class="form-label">Label</label>
  <select id="select-id" name="field" class="form-input form-select">
    <option value="">Select...</option>
    <option value="option1">Option 1</option>
  </select>
</div>
```

## CSS Classes

- `.form-input` - Base input class (required)
- `.form-select` - Select-specific styling
- `.form-input.error` - Error state
- `.form-input.success` - Success state

## Multiple Selection

```html
<select
  id="select-multiple"
  name="multiple"
  class="form-input form-select"
  multiple
  size="4"
>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>
```

## Option Groups

```html
<select class="form-input form-select">
  <optgroup label="Group 1">
    <option value="option1">Option 1</option>
  </optgroup>
  <optgroup label="Group 2">
    <option value="option2">Option 2</option>
  </optgroup>
</select>
```

## Accessibility

- ✅ Always use `<label>` with matching `id`
- ✅ Error messages use `role="alert"`
- ✅ Required fields marked with `required` attribute
- ✅ Focus states visible
- ✅ Keyboard navigation supported

## Notes

- First option should be empty or placeholder
- Use `optgroup` for grouped options
- `multiple` attribute enables multi-select
- `size` attribute controls visible options
- Test with keyboard navigation
