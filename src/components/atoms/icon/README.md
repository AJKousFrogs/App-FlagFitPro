# Icon Component

## Overview

Icons using Lucide icon library. Icons are initialized automatically via `icon-helper.js`.

## Usage

Copy the HTML from `icon.html` into your page. Always set explicit width and height.

## HTML Structure

```html
<i data-lucide="icon-name" style="width: 24px; height: 24px;"></i>
```

## Icon Sizes

Common sizes:

- **16px** - Small icons, inline with text
- **18px** - Button icons
- **20px** - Medium icons, navigation
- **24px** - Large icons, headers
- **32px** - Extra large icons, hero sections

## With Color

```html
<i
  data-lucide="activity"
  style="width: 24px; height: 24px; color: var(--color-brand-primary);"
></i>
```

Use CSS variables for colors:

- `var(--color-brand-primary)` - Primary brand color
- `var(--color-text-primary)` - Primary text color
- `var(--color-text-secondary)` - Secondary text color

## Common Icons

- `home` - Home/Dashboard
- `user` - User profile
- `settings` - Settings
- `bell` - Notifications
- `search` - Search
- `menu` - Menu/Hamburger
- `x` - Close
- `play` - Play/Start
- `activity` - Activity/Training
- `trophy` - Achievements
- `calendar` - Schedule
- `bar-chart-3` - Analytics

## In Buttons

```html
<button class="btn btn-primary btn-md">
  <i data-lucide="play" style="width: 18px; height: 18px;"></i>
  Start Training
</button>
```

## Icon-only Buttons

```html
<button class="btn btn-tertiary btn-sm" aria-label="Settings">
  <i data-lucide="settings" style="width: 18px; height: 18px;"></i>
</button>
```

**Important:** Always include `aria-label` for icon-only buttons.

## Initialization

Icons are automatically initialized when the page loads via `icon-helper.js`. If you add icons dynamically, call:

```javascript
if (typeof lucide !== "undefined") {
  lucide.createIcons();
}
```

## Accessibility

- ✅ Icon-only buttons require `aria-label`
- ✅ Decorative icons should be hidden from screen readers
- ✅ Functional icons should have descriptive text or labels

## Notes

- Always set explicit width and height (required)
- Use consistent sizes within the same context
- Icons inherit color from parent element
- Lucide icons are SVG-based and scale well
- See [Lucide Icons](https://lucide.dev/icons/) for full icon list
