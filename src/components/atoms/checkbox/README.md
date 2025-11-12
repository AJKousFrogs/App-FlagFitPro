# Checkbox Component

## Overview

Checkbox input component for binary choices and multiple selections. Supports checked, unchecked, disabled, and indeterminate states.

## Usage

Copy the HTML from `checkbox.html` into your page. Always pair with a `<label>` element.

## HTML Structure

```html
<label class="form-checkbox">
    <input type="checkbox" id="checkbox-id" name="checkbox-name">
    <span>Label text</span>
</label>
```

## With Form Group

```html
<div class="form-group">
    <label class="form-checkbox">
        <input type="checkbox" id="checkbox-id" name="checkbox-name">
        <span>I agree</span>
    </label>
</div>
```

## Checkbox Group

Use `<fieldset>` and `<legend>` for groups:

```html
<fieldset class="form-group">
    <legend class="form-label">Select options</legend>
    <div class="checkbox-group">
        <label class="form-checkbox">
            <input type="checkbox" id="option1" name="options" value="option1">
            <span>Option 1</span>
        </label>
        <label class="form-checkbox">
            <input type="checkbox" id="option2" name="options" value="option2">
            <span>Option 2</span>
        </label>
    </div>
</fieldset>
```

## CSS Classes

- `.form-checkbox` - Checkbox label wrapper (required)
- `.form-checkbox.error` - Error state
- `.checkbox-group` - Container for multiple checkboxes

## States

| State | Attribute | Usage |
|-------|-----------|-------|
| Unchecked | (none) | Default state |
| Checked | `checked` | Selected state |
| Disabled | `disabled` | Non-interactive |
| Indeterminate | JavaScript | Partial selection |

## Accessibility

- ✅ Always use `<label>` wrapping input
- ✅ Use `<fieldset>` and `<legend>` for groups
- ✅ Error state includes `aria-invalid="true"`
- ✅ Error messages use `role="alert"`
- ✅ Keyboard navigation supported

## Indeterminate State

Set via JavaScript:

```javascript
document.getElementById('checkbox-id').indeterminate = true;
```

## Notes

- Checkbox label wraps the input
- Use for multiple selections
- Group related checkboxes with fieldset
- Indeterminate state requires JavaScript
- Test with keyboard navigation

