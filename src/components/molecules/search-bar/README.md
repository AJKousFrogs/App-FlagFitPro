# Search Bar Component

## Overview

Search input component with icon. Combines input atom with search icon for a complete search experience.

## Usage

Copy the HTML from `search-bar.html` into your page. The search bar includes an icon and input field.

## HTML Structure

```html
<div class="search-bar">
  <i data-lucide="search" style="width: 20px; height: 20px;"></i>
  <input type="search" class="search-input" placeholder="Search..." />
</div>
```

## CSS Classes

- `.search-bar` - Container wrapper (required)
- `.search-input` - Input field styling

## With Clear Button

```html
<div class="search-bar" style="position: relative;">
  <i data-lucide="search" style="width: 20px; height: 20px;"></i>
  <input
    type="search"
    class="search-input"
    placeholder="Search..."
    id="search-input"
  />
  <button type="button" class="search-clear" aria-label="Clear search">
    <i data-lucide="x" style="width: 18px; height: 18px;"></i>
  </button>
</div>
```

## Accessibility

- ✅ Use `type="search"` for proper mobile keyboard
- ✅ Include placeholder text
- ✅ Clear button requires `aria-label`
- ✅ Focus states visible

## Notes

- Icon size: 20px recommended
- Use `type="search"` for mobile keyboard optimization
- Clear button should appear when input has value
- Consider adding debounce for search functionality
