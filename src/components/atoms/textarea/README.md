# Textarea Component

## Overview

Multi-line text input component for longer text content. Supports validation states and resizing.

## Usage

Copy the HTML from `textarea.html` into your page. Always pair with a `<label>` element.

## HTML Structure

```html
<textarea 
    id="textarea-id" 
    name="textarea-name"
    class="form-input form-textarea"
    rows="4"
    placeholder="Enter text..."
></textarea>
```

## With Label

```html
<div class="form-group">
    <label for="textarea-id" class="form-label">Description</label>
    <textarea 
        id="textarea-id" 
        name="description"
        class="form-input form-textarea"
        rows="4"
    ></textarea>
</div>
```

## CSS Classes

- `.form-input` - Base input class (required)
- `.form-textarea` - Textarea-specific styling
- `.form-input.error` - Error state
- `.form-input.success` - Success state

## Attributes

- `rows` - Number of visible rows (default: 4)
- `cols` - Number of visible columns (optional)
- `maxlength` - Maximum character count
- `minlength` - Minimum character count
- `disabled` - Disable input
- `readonly` - Read-only input

## Resizing

Textarea can be resized:

```html
<textarea class="form-input form-textarea" style="resize: vertical;"></textarea>
```

Options:
- `resize: vertical` - Only vertical resize
- `resize: horizontal` - Only horizontal resize
- `resize: both` - Both directions
- `resize: none` - No resize

## Accessibility

- ✅ Always use `<label>` with matching `id`
- ✅ Error messages use `role="alert"`
- ✅ Required fields marked with `required` attribute
- ✅ Focus states visible

## Notes

- Use for multi-line text input
- Set appropriate `rows` attribute
- Consider `maxlength` for long content
- Test with screen readers

