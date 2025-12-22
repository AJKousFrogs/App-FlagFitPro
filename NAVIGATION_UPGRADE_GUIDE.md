# Navigation Bar Upgrade Guide

## Overview

The navigation bar has been upgraded with modern features including collapsible sections, user profile card, enhanced animations, and improved accessibility.

## What's New

### 1. **Enhanced Sidebar Structure**
- **Brand Header**: Logo with app name and tagline
- **Grouped Navigation**: Organized into logical sections
  - Quick Actions (Overview, Analytics)
  - Training & Performance (collapsible)
  - Team & Community (collapsible)
- **User Profile Card**: Bottom section with user info and menu

### 2. **Collapsible Sections**
- Click section headers to expand/collapse
- Smooth animations
- Keyboard accessible (Enter/Space to toggle)
- State persists during session

### 3. **User Menu**
- Profile card at bottom of sidebar
- Dropdown menu with:
  - Profile
  - Settings
  - Sign Out
- Keyboard navigation support

### 4. **Visual Enhancements**
- Smooth animations and transitions
- Icon hover effects
- Active state indicators
- Badge support for notifications
- Improved mobile responsiveness

## Integration

### Automatic Integration

The enhanced navigation is automatically loaded when using the sidebar loader:

```html
<!-- Sidebar container -->
<div data-sidebar-container></div>

<!-- Sidebar loader script -->
<script type="module" src="./src/js/components/sidebar-loader.js"></script>
```

The sidebar loader will:
1. Load the sidebar HTML component
2. Initialize Lucide icons
3. Set active page state
4. Load and initialize enhanced sidebar navigation features

### Manual Integration

If you need to manually initialize:

```javascript
import { EnhancedSidebarNav } from './src/js/components/enhanced-sidebar-nav.js';

// Auto-initializes, but you can access the instance
const nav = window.enhancedSidebarNav;

// Update user info
nav.updateUserInfo('John Doe', 'Player');

// Collapse/expand all sections
nav.collapseAllSections();
nav.expandAllSections();
```

## User Info Integration

The sidebar automatically loads user info from `localStorage`:

```javascript
// Store user data
localStorage.setItem('userData', JSON.stringify({
  name: 'John Doe',
  role: 'Player'
}));

// Or update programmatically
if (window.enhancedSidebarNav) {
  window.enhancedSidebarNav.updateUserInfo('John Doe', 'Player');
}
```

## Logout Integration

The logout handler integrates with your existing AuthManager:

```javascript
// Uses AuthManager if available
window.handleLogout();

// Or define custom handler
window.handleLogout = function() {
  // Your custom logout logic
  if (window.authManager) {
    window.authManager.logout();
  }
};
```

## Keyboard Navigation

### Collapsible Sections
- **Enter** or **Space**: Toggle section
- **Tab**: Navigate between sections

### User Menu
- **Escape**: Close menu
- **Arrow Up/Down**: Navigate menu items
- **Home/End**: Jump to first/last item
- **Enter**: Activate menu item

### General Navigation
- **Tab**: Navigate through nav items
- **Enter**: Activate nav item
- **Escape**: Close mobile sidebar (if open)

## Customization

### Badges

Add badges to navigation items:

```html
<a href="/analytics.html" class="nav-item">
  <span class="nav-item-icon">
    <i data-lucide="bar-chart-3" class="icon-24"></i>
  </span>
  <span class="nav-item-label">Analytics</span>
  <span class="nav-item-badge">3</span>
</a>
```

### Collapsible Sections

Sections are collapsible by default. To change default state:

```html
<button
  class="nav-section-header"
  aria-expanded="false"
  aria-controls="nav-section-training"
>
  <span class="nav-section-title">Training & Performance</span>
  <i data-lucide="chevron-down" class="nav-section-chevron"></i>
</button>
```

Set `aria-expanded="false"` to start collapsed.

## CSS Customization

All styles are in `src/css/components/sidebar.css`. Key classes:

- `.sidebar-header` - Brand header section
- `.nav-section-wrapper` - Section container
- `.nav-section-header` - Collapsible section header
- `.nav-section-collapsible` - Collapsible content
- `.sidebar-user-card` - User profile card
- `.sidebar-user-menu` - User dropdown menu

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Fallback CSS for browsers without `:has()` support
- Progressive enhancement approach
- Mobile-first responsive design

## Accessibility

- ✅ ARIA attributes for screen readers
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Screen reader announcements
- ✅ High contrast mode support
- ✅ Reduced motion support

## Troubleshooting

### Icons Not Showing
Ensure Lucide icons are loaded:
```html
<script src="https://unpkg.com/lucide@latest"></script>
```

### User Info Not Loading
Check localStorage:
```javascript
console.log(localStorage.getItem('userData'));
```

### Collapsible Sections Not Working
Ensure enhanced sidebar nav is loaded:
```javascript
console.log(window.enhancedSidebarNav);
```

### Mobile Menu Not Working
Ensure universal mobile nav is initialized:
```javascript
console.log(window.universalMobileNav);
```

## Files Modified

1. `src/components/organisms/sidebar-navigation.html` - Updated HTML structure
2. `src/css/components/sidebar.css` - Enhanced styles
3. `src/js/components/enhanced-sidebar-nav.js` - New JavaScript functionality
4. `src/js/components/sidebar-loader.js` - Updated to load enhanced features
5. `src/js/main.js` - Updated to register enhanced nav component

## Migration Notes

The upgrade is backward compatible. Existing pages using the sidebar loader will automatically get the enhanced features. No changes needed to existing HTML files.

