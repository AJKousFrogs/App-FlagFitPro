# Top Bar Component

Accessible, standardized top navigation bar for all FlagFit Pro pages.

## Features

✅ **Accessibility First**

- Proper ARIA attributes (combobox, listbox, live regions)
- Keyboard navigation (↑/↓/Enter/Esc)
- Screen reader support
- Focus management
- WCAG 2.2 compliant

✅ **Semantic HTML**

- Real `<button>` elements (not divs)
- Proper roles and labels
- Hidden attribute for conditional display

✅ **Mobile Optimized**

- 44×44px tap targets
- Responsive layout
- Touch-friendly interactions

✅ **Performance**

- Debounced search (250ms)
- Event delegation
- No inline handlers (CSP compliant)

✅ **Design System**

- Uses design tokens
- Consistent styling
- Reduced motion support

## Usage

### HTML Structure

Copy the HTML from `top-bar.html` into your page's `<main>` element:

```html
<div class="top-bar" role="banner">
  <!-- Search combobox -->
  <!-- Notifications, Settings, Theme, User menu -->
</div>
```

### JavaScript

Include the JavaScript file in your HTML `<head>` or before closing `</body>`:

```html
<script src="./src/components/organisms/top-bar/top-bar.js"></script>
```

### CSS

The styles are automatically included via `src/css/main.css` which imports `src/css/components/header.css`.

## Search Combobox

The search uses the ARIA combobox pattern:

- **Keyboard Navigation:**
  - `↓` - Open listbox, move to first result
  - `↑/↓` - Navigate results
  - `Enter` - Select highlighted result
  - `Esc` - Close listbox

- **Live Announcements:**
  - "X results found" or "No matches found"
  - Announced via `aria-live="polite"`

- **Integration:**
  - Calls `performGlobalSearch(query)` if available
  - Expects array of `{label, value, url?}` objects
  - Falls back to stub results if function not found

## Notifications

- Button with `aria-expanded` toggle
- Badge count with live announcements
- Calls `toggleNotifications()` if available
- Badge hidden when count is 0

## User Menu

- Button with `aria-haspopup="menu"`
- Toggles `aria-expanded`
- Closes on Escape or click outside
- Focus returns to button on close

## Customization

### Page Title Instead of Search

For pages like Analytics, replace the search box with:

```html
<div class="page-title-section">
  <h1 class="page-title">Page Title</h1>
  <p class="page-subtitle">Page subtitle</p>
</div>
```

### Theme Toggle Fallback

If JavaScript fails, the fallback button appears:

```html
<button class="theme-toggle-fallback" type="button" data-theme-toggle>
  Theme
</button>
```

## Accessibility Checklist

- ✅ All interactive elements are buttons
- ✅ Proper ARIA roles and properties
- ✅ Keyboard navigation support
- ✅ Screen reader announcements
- ✅ Focus management
- ✅ 44×44px minimum tap targets
- ✅ Reduced motion support
- ✅ Color contrast compliance

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript for full functionality
- Graceful degradation with fallbacks
