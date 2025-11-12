# Navigation Sidebar Component

## Overview

Main navigation sidebar for the application. Includes logo, navigation links, and user section. This is an organism combining multiple molecules and atoms.

## Usage

Copy the HTML from `navigation-sidebar.html` into your page. The sidebar is typically fixed on the left side of the page.

## HTML Structure

```html
<nav class="sidebar" role="navigation" aria-label="Main navigation">
  <div class="sidebar-header">
    <!-- Logo and brand -->
  </div>
  <ul class="sidebar-nav">
    <!-- Navigation links -->
  </ul>
  <div class="sidebar-footer">
    <!-- User section -->
  </div>
</nav>
```

## CSS Classes

- `.sidebar` - Main container (fixed positioning)
- `.sidebar-header` - Logo/brand section
- `.sidebar-logo` - Logo link/button
- `.sidebar-title` - Brand name text
- `.sidebar-nav` - Navigation list container
- `.sidebar-link` - Navigation link
- `.sidebar-link.active` - Active/current page
- `.sidebar-footer` - Footer section

## Navigation Links

Each navigation link includes:

- Icon (Lucide icon)
- Text label
- `aria-current="page"` for active link

## Accessibility

- ✅ Semantic `<nav>` element
- ✅ `role="navigation"` and `aria-label`
- ✅ `aria-current="page"` for active link
- ✅ Keyboard navigation support
- ✅ Focus states visible

## Responsive Behavior

On mobile, the sidebar typically:

- Collapses to icon-only mode
- Can be toggled with a hamburger menu
- Overlays content when open

## Notes

- Sidebar is typically fixed position
- Active link should be highlighted
- Icons should be consistent size (20px)
- Ensure sufficient contrast for readability
