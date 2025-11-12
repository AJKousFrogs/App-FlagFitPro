# Dashboard Header Component

## Overview

Page header component for dashboard and other pages. Includes page title, search bar, notifications, and user menu. This is an organism combining multiple molecules.

## Usage

Copy the HTML from `dashboard-header.html` into your page. Typically placed at the top of the main content area.

## HTML Structure

```html
<header class="dashboard-header">
    <div class="header-left">
        <h1 class="page-title">Page Title</h1>
        <p class="page-subtitle">Subtitle</p>
    </div>
    <div class="header-right">
        <!-- Actions, search, user menu -->
    </div>
</header>
```

## Components Included

- **Page Title** - Main heading and subtitle
- **Search Bar** - Search functionality
- **Notifications** - Notification bell with badge
- **User Menu** - User avatar and dropdown menu

## CSS Classes

- `.dashboard-header` - Main container
- `.header-left` - Left section
- `.header-right` - Right section
- `.page-title` - Main heading
- `.page-subtitle` - Subheading
- `.user-menu` - User menu container
- `.user-menu-trigger` - Menu button
- `.user-avatar` - Avatar image
- `.user-menu-dropdown` - Dropdown menu

## Accessibility

- ✅ Semantic `<header>` element
- ✅ Proper heading hierarchy
- ✅ `aria-label` for icon buttons
- ✅ `aria-expanded` for dropdowns
- ✅ `role="menu"` for dropdown menus

## Responsive Behavior

On mobile:
- Search bar may collapse to icon-only
- User menu may simplify
- Actions may move to overflow menu

## Notes

- Header is typically sticky/fixed at top
- Search bar is optional
- Notification badge shows count
- User menu requires JavaScript for dropdown

