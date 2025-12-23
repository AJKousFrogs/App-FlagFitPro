# Date Picker Component

A date picker component for selecting dates.

## Usage

```html
<div class="form-group">
  <label for="date-1" class="form-label">Date</label>
  <div class="date-picker-wrapper">
    <input
      type="date"
      id="date-1"
      name="date-1"
      class="form-input date-picker"
    />
    <button type="button" class="date-picker-icon" aria-label="Open calendar">
      <i data-lucide="calendar"></i>
    </button>
  </div>
</div>
```

## Features

- Native HTML5 date input
- Calendar icon button
- Quick action buttons (Today, Tomorrow, Next Week)
- Min/max date constraints
- Validation states
- Disabled state

## Accessibility

- Uses native date input for keyboard navigation
- Includes aria-label for icon button
- Supports aria-describedby for help text
- Error states use aria-invalid
