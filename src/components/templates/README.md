# Template Layouts

## Overview

Full page layout templates that combine organisms, molecules, and atoms into complete page structures. Use these as starting points for new pages.

## Available Templates

### Dashboard Layout
**File:** `dashboard-layout.html`

Complete dashboard page structure with:
- Navigation sidebar
- Dashboard header
- Stats grid
- Charts section
- Main content area

**Usage:** Copy for dashboard, analytics, and main app pages.

### Auth Layout
**File:** `auth-layout.html`

Centered authentication page structure with:
- Logo and branding
- Auth form card
- Footer links

**Usage:** Copy for login, register, and password reset pages.

### Admin Layout
**File:** `admin-layout.html`

Admin panel structure with:
- Admin navigation sidebar
- Admin header
- Content area for admin features

**Usage:** Copy for admin pages and management interfaces.

## How to Use

1. Copy the template HTML file
2. Replace placeholder content with your actual content
3. Include component snippets from `src/components/` as needed
4. Customize CSS classes to match your needs

## Layout Structure

All templates follow this general structure:

```html
<div class="[layout]-container">
    <!-- Navigation/Sidebar -->
    <nav class="sidebar">...</nav>
    
    <!-- Main Content -->
    <main class="main-content">
        <header class="dashboard-header">...</header>
        <div class="content-area">...</div>
    </main>
</div>
```

## Customization

- Modify CSS classes to match your design
- Add or remove sections as needed
- Include additional components from the component library
- Adjust responsive breakpoints for mobile

## Notes

- Templates use design system CSS classes
- All components are included via HTML snippets
- JavaScript initialization is included
- Accessibility features are built-in

