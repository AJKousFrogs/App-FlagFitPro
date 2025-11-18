# Navigation Sidebar Component

## Overview

Main navigation sidebar for the application. Includes logo, navigation links grouped by section, and user section. This is an organism combining multiple molecules and atoms.

## Usage

Copy the HTML from `navigation-sidebar.html` into your page. The sidebar is typically fixed on the left side of the page.

## HTML Structure

```html
<div
  class="sidebar"
  id="sidebar"
  role="navigation"
  aria-label="Main navigation"
>
  <!-- Logo/Brand -->
  <div
    class="sidebar-logo"
    onclick="window.location.href='/dashboard.html'"
    title="FlagFit Pro"
    aria-label="Go to dashboard"
  >
    <i data-lucide="activity" class="icon-20 icon-inline"></i>
  </div>

  <!-- Navigation Sections -->
  <nav class="nav-section" aria-label="Dashboard navigation">
    <a
      href="/dashboard.html"
      class="nav-item"
      aria-label="Dashboard Overview"
      id="nav-dashboard"
    >
      <span class="nav-item-icon">
        <i data-lucide="layout-dashboard" class="icon-24"></i>
      </span>
      <span class="nav-item-label">Overview</span>
    </a>
  </nav>

  <!-- More nav sections... -->
</div>
```

## CSS Classes

### Container

- `.sidebar` - Main container (fixed positioning)
- `.menu-scrim` - Mobile overlay/scrim for closing sidebar

### Logo

- `.sidebar-logo` - Logo container (clickable div)

### Navigation Sections

- `.nav-section` - Navigation group container (semantic `<nav>`)
- `.nav-item` - Navigation link
- `.nav-item.active` - Active/current page state
- `.nav-item-icon` - Icon wrapper span
- `.nav-item-label` - Text label span

### Icon Utilities

- `.icon-20` - 20px icon size (logo)
- `.icon-24` - 24px icon size (navigation items)
- `.icon-inline` - Icon display utility

## Navigation Structure

The sidebar uses semantic navigation sections:

1. **Dashboard Navigation** - Overview, Analytics
2. **Team Navigation** - Roster, Training, Tournaments
3. **Community Navigation** - Community, Chat
4. **Personal Navigation** - Settings, Profile

## Navigation Links

Each navigation link includes:

- Icon (Lucide icon) wrapped in `<span class="nav-item-icon">`
- Text label wrapped in `<span class="nav-item-label">`
- `aria-label` for accessibility
- `id` attribute for JavaScript navigation highlighting (e.g., `id="nav-dashboard"`)

## Icon Guidelines

- **Logo**: Uses `icon-20` (20px) with `icon-inline` class
- **Nav Items**: Use `icon-24` (24px) for prominent actions
- Icons inherit color from parent context (no hardcoded colors)
- All icons use Lucide icon library (`data-lucide` attribute)

## Accessibility

- ✅ Semantic `<nav>` elements for navigation groups
- ✅ `role="navigation"` and `aria-label` on main container
- ✅ `aria-label` on each navigation section
- ✅ `aria-label` on individual links
- ✅ Proper ID attributes for JavaScript navigation highlighting
- ✅ Keyboard navigation support
- ✅ Focus states visible
- ✅ Minimum 44px touch targets

## Responsive Behavior

On mobile, the sidebar typically:

- Collapses to icon-only mode
- Can be toggled with a hamburger menu (via top-bar component)
- Overlays content when open
- Uses `.menu-scrim` overlay for closing on mobile

## Active State

To mark a navigation item as active, add the `.active` class:

```html
<a href="/dashboard.html" class="nav-item active" id="nav-dashboard"></a>
```

## Notes

- Sidebar is typically fixed position
- Active link should be highlighted with `.active` class
- Icons use CSS utility classes (not inline styles)
- Logo uses `onclick` pattern for navigation
- All links include `.html` extension in hrefs
- Ensure sufficient contrast for readability
