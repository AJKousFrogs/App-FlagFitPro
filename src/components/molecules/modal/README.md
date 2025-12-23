# Modal Component

## Overview

Modal dialog component for displaying content in an overlay. Supports headers, body content, and footers with action buttons. CSS exists in `src/css/components/modal.css`.

## Usage

Copy the HTML from `modal.html` into your page. Modals require JavaScript to toggle the `.open` class.

## HTML Structure

```html
<div class="modal-overlay" id="modal-id" role="dialog" aria-modal="true">
  <div class="modal-content">
    <div class="modal-header">
      <h2 class="modal-title">Title</h2>
      <button type="button" class="modal-close">×</button>
    </div>
    <div class="modal-body">Content here</div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

## Opening a Modal

Add the `.open` class to the `.modal-overlay`:

```javascript
document.getElementById("modal-id").classList.add("open");
```

## Closing a Modal

Remove the `.open` class:

```javascript
document.getElementById("modal-id").classList.remove("open");
```

## CSS Classes

- `.modal-overlay` - Overlay container (required)
- `.modal-overlay.open` - Active state
- `.modal-content` - Modal content box
- `.modal-header` - Header section
- `.modal-body` - Body section
- `.modal-footer` - Footer section
- `.modal-title` - Title heading
- `.modal-close` - Close button

## Accessibility

- ✅ `role="dialog"` for screen readers
- ✅ `aria-modal="true"` indicates modal
- ✅ `aria-labelledby` links to title
- ✅ Close button has `aria-label`
- ✅ Escape key closes modal
- ✅ Focus trap (should be implemented)

## JavaScript Requirements

Include the modal initialization script from `modal.html`:

- Close on overlay click
- Close on Escape key
- Focus management (recommended)

## Notes

- Modal overlay is fixed position
- Content is centered
- Max width: 90vw, Max height: 90vh
- Backdrop blur effect included
- All sections are optional
