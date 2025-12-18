# Toggle Switch Component

A toggle switch component for binary on/off states.

## Usage

```html
<label class="form-toggle">
  <input type="checkbox" id="toggle-1" name="toggle-1" class="toggle-input" role="switch" />
  <span class="toggle-slider"></span>
  <span class="toggle-label">Enable notifications</span>
</label>
```

## Variants

- Default: Standard size toggle
- Small: `.toggle-sm` class
- Large: `.toggle-lg` class

## States

- Default: Unchecked state
- Checked: Add `checked` attribute
- Disabled: Add `disabled` attribute to input and `.disabled` class to label
- Error: Add `.error` class to label

## Accessibility

- Uses `role="switch"` for screen readers
- Includes `aria-checked` attribute
- Supports keyboard navigation
- Focus indicator included

