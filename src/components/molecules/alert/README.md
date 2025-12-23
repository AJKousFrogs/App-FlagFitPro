# Alert Component

## Overview

Alert component for displaying status messages, notifications, and important information. Supports multiple variants and can be dismissible.

## Usage

Copy the HTML from `alert.html` into your page. Alerts use the CSS from `src/css/components/alert.css`.

## Variants

- **Info** (`.alert-info`) - Informational messages (blue)
- **Success** (`.alert-success`) - Success messages (green)
- **Warning** (`.alert-warning`) - Warning messages (yellow/amber)
- **Error** (`.alert-error`) - Error messages (red)

## HTML Structure

```html
<div class="alert alert-info" role="alert">
  <i data-lucide="info" style="width: 20px; height: 20px;"></i>
  <div>
    <strong>Title</strong>
    <p>Message content</p>
  </div>
</div>
```

## CSS Classes

- `.alert` - Base alert class (required)
- `.alert-info` - Info variant
- `.alert-success` - Success variant
- `.alert-warning` - Warning variant
- `.alert-error` - Error variant
- `.alert-close` - Close button (optional)

## Dismissible Alerts

Add a close button for dismissible alerts:

```html
<div class="alert alert-info" role="alert">
  <div>Message content</div>
  <button
    type="button"
    class="alert-close"
    aria-label="Close alert"
    onclick="this.parentElement.remove()"
  >
    <i data-lucide="x" style="width: 18px; height: 18px;"></i>
  </button>
</div>
```

## Accessibility

- ✅ `role="alert"` for screen readers
- ✅ Icon provides visual indicator
- ✅ Close button has `aria-label`
- ✅ Sufficient color contrast

## Notes

- Alerts are typically displayed at the top of content
- Use appropriate variant for message type
- Icons are optional but recommended
- Dismissible alerts require JavaScript
