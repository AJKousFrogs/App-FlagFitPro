# Radio Component

## Overview

Radio button component for single selection from a group of options. All radios in a group must share the same `name` attribute.

## Usage

Copy the HTML from `radio.html` into your page. Always use `<fieldset>` and `<legend>` for radio groups.

## HTML Structure

```html
<label class="form-radio">
  <input type="radio" id="radio-id" name="group-name" value="value" />
  <span>Label text</span>
</label>
```

## Radio Group

**Important:** All radios in a group must have the same `name`:

```html
<fieldset class="form-group">
  <legend class="form-label">Select option</legend>
  <div class="radio-group">
    <label class="form-radio">
      <input type="radio" id="option1" name="choice" value="option1" />
      <span>Option 1</span>
    </label>
    <label class="form-radio">
      <input type="radio" id="option2" name="choice" value="option2" />
      <span>Option 2</span>
    </label>
  </div>
</fieldset>
```

## CSS Classes

- `.form-radio` - Radio label wrapper (required)
- `.radio-group` - Container for multiple radios
- `.radio-group.error` - Error state

## States

| State     | Attribute  | Usage           |
| --------- | ---------- | --------------- |
| Unchecked | (none)     | Default state   |
| Checked   | `checked`  | Selected state  |
| Disabled  | `disabled` | Non-interactive |

## Layout Options

### Vertical (Default)

```html
<div class="radio-group">
  <!-- Radios stack vertically -->
</div>
```

### Horizontal

```html
<div
  class="radio-group"
  style="display: flex; gap: var(--spacing-component-md);"
>
  <!-- Radios display horizontally -->
</div>
```

## Accessibility

- ✅ Always use `<label>` wrapping input
- ✅ Use `<fieldset>` and `<legend>` for groups
- ✅ All radios in group share same `name`
- ✅ Error state includes `aria-invalid="true"`
- ✅ Error messages use `role="alert"`
- ✅ Keyboard navigation supported

## Notes

- Radio buttons are for single selection
- All radios in group must have same `name`
- Use fieldset/legend for groups
- Only one radio can be selected per group
- Test with keyboard navigation
