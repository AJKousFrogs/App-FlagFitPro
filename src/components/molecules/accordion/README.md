# Accordion Component

## Overview

Collapsible content component for organizing information into expandable sections. Includes full keyboard navigation and ARIA support.

## Usage

Copy the HTML from `accordion.html` into your page. Includes JavaScript for functionality.

## HTML Structure

```html
<div class="accordion" data-accordion="unique-id">
  <div class="accordion-item">
    <button
      class="accordion-trigger"
      aria-expanded="false"
      aria-controls="panel-1"
      id="trigger-1"
    >
      <span>Section Title</span>
      <i data-lucide="chevron-down" class="accordion-icon"></i>
    </button>
    <div
      class="accordion-panel"
      role="region"
      aria-labelledby="trigger-1"
      id="panel-1"
    >
      <div class="accordion-content">Content here</div>
    </div>
  </div>
</div>
```

## CSS Classes

- `.accordion` - Container (required)
- `.accordion-item` - Individual accordion item
- `.accordion-trigger` - Toggle button
- `.accordion-panel` - Collapsible panel
- `.accordion-panel.accordion-open` - Open state
- `.accordion-content` - Content wrapper
- `.accordion-icon` - Chevron icon

## Keyboard Navigation

- **Enter** - Toggle panel
- **Space** - Toggle panel
- **Tab** - Focus management

## Accessibility

- ✅ `aria-expanded` for state
- ✅ `aria-controls` links trigger to panel
- ✅ `aria-labelledby` links panel to trigger
- ✅ `role="region"` for panels
- ✅ Keyboard navigation support
- ✅ Focus management

## Behavior

- Multiple panels can be open simultaneously
- Icon rotates when panel opens/closes
- Smooth animation for expand/collapse
- Content is hidden when closed

## Use Cases

- FAQ sections
- Content organization
- Settings panels
- Information disclosure

## Notes

- Each accordion instance needs unique `data-accordion` value
- Icon rotation handled by JavaScript
- Max-height transition for smooth animation
- Test with keyboard navigation
