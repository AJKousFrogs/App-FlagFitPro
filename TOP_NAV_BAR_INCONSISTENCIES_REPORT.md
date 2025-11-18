# Top Navigation Bar Inconsistencies Report

## Overview

This report documents inconsistencies found across different pages' top navigation bar implementations compared to the standard template (`src/components/organisms/top-bar/top-bar.html`).

---

## 1. Mobile Menu Toggle Button

### Issue

The mobile menu toggle button is missing on several pages.

### Standard Template

```html
<button
  id="mobile-menu-toggle"
  class="mobile-menu-toggle"
  type="button"
  aria-label="Open menu"
  aria-expanded="false"
  aria-controls="sidebar"
  onclick="openMenu()"
>
  <i data-lucide="menu" class="icon-20"></i>
</button>
```

### Pages WITH mobile menu toggle:

- ✅ `dashboard.html` (line 189-199)
- ✅ `wellness.html` (line 138-148)
- ✅ `training.html` (line 197-207)
- ✅ `top-bar.html` template (line 13-23)

### Pages MISSING mobile menu toggle:

- ❌ `roster.html` - Missing entirely
- ❌ `analytics.html` - Missing entirely
- ❌ `settings.html` - Missing entirely
- ❌ `community.html` - Missing entirely
- ❌ `chat.html` - Missing entirely

### Inconsistency Details:

- **dashboard.html**: Uses `onclick="toggleSidebar()"` instead of `onclick="openMenu()"`
- **dashboard.html**: Has duplicate `aria-label` attributes (line 193, 196)
- **wellness.html**: Uses `onclick="toggleSidebar()"` instead of `onclick="openMenu()"`
- **training.html**: Uses `onclick="toggleSidebar()"` instead of `onclick="openMenu()"`

---

## 2. Search Box Implementation

### Issue

Different pages have different search box implementations or no search box at all.

### Standard Template

```html
<div class="search-box">
  <label for="global-search" class="sr-only"
    >Search for players, teams and more</label
  >
  <span class="search-icon" aria-hidden="true">
    <i data-lucide="search" class="icon-16"></i>
  </span>
  <input
    id="global-search"
    class="search-input"
    type="text"
    placeholder="Search for players, teams & more"
    role="combobox"
    aria-autocomplete="list"
    aria-haspopup="listbox"
    aria-expanded="false"
    aria-owns="search-results"
    aria-controls="search-results"
    aria-activedescendant=""
    autocomplete="off"
    inputmode="search"
  />
  <div id="search-status" class="sr-only" aria-live="polite"></div>
  <div id="search-results" class="search-results" role="listbox" hidden></div>
</div>
```

### Pages WITH search box:

- ✅ `dashboard.html` - Standard implementation
- ✅ `settings.html` - Standard implementation
- ✅ `community.html` - Standard implementation
- ✅ `chat.html` - Standard implementation
- ✅ `wellness.html` - **Different placeholder**: "Search recovery tips, nutrition guides..."
- ✅ `training.html` - **Different placeholder**: "Search workouts, exercises, videos..."

### Pages WITHOUT search box (using page title instead):

- ❌ `roster.html` - Uses `page-title-section` instead
- ❌ `analytics.html` - Uses `page-title-section` instead

### Inconsistency Details:

- **Placeholder text variations**:
  - Standard: "Search for players, teams & more"
  - `wellness.html`: "Search recovery tips, nutrition guides..."
  - `training.html`: "Search workouts, exercises, videos..."
- **Missing search results div**: `wellness.html` doesn't include the `search-results` div
- **Missing aria attributes**: `wellness.html` missing `aria-owns`, `aria-controls`, `aria-activedescendant`

---

## 3. User Menu Dropdown

### Issue

The user menu dropdown is missing on most pages. Only the template has the full dropdown implementation.

### Standard Template

```html
<div class="user-menu-wrapper">
  <button id="user-menu-button" class="user-menu" type="button" ...>
    <div class="user-avatar" id="user-avatar" aria-hidden="true">U</div>
  </button>
  <!-- User Menu Dropdown -->
  <ul id="user-menu" class="user-menu-dropdown" role="menu" hidden>
    <li role="menuitem">
      <a href="/profile" class="user-menu-item">...</a>
    </li>
    <li role="menuitem">
      <a href="/settings" class="user-menu-item">...</a>
    </li>
    <li role="separator" class="user-menu-separator"></li>
    <li role="menuitem">
      <a href="/logout" class="user-menu-item user-menu-item-danger">...</a>
    </li>
  </ul>
</div>
```

### Pages WITH dropdown menu:

- ✅ `top-bar.html` template (line 108-143)

### Pages WITHOUT dropdown menu (button only):

- ❌ `dashboard.html` - Button only, no dropdown
- ❌ `roster.html` - Button only, no dropdown
- ❌ `analytics.html` - Button only, no dropdown
- ❌ `settings.html` - Button only, no dropdown
- ❌ `community.html` - Button only, no dropdown
- ❌ `chat.html` - Button only, no dropdown
- ❌ `wellness.html` - Button only, no dropdown
- ❌ `training.html` - Button only, no dropdown

### Additional Inconsistencies:

- **User avatar wrapper**: Template uses `<div class="user-menu-wrapper">`, but other pages don't wrap the button
- **User avatar initials**:
  - Template: "U"
  - `dashboard.html`: "JD"
  - `wellness.html`: "JD"
  - Other pages: "U"

---

## 4. Theme Toggle Implementation

### Issue

Different theme toggle implementations across pages.

### Standard Template

```html
<div class="theme-toggle-container" aria-label="Theme toggle">
  <label class="theme-toggle-label" title="Toggle theme">
    <input
      type="checkbox"
      id="header-theme-toggle"
      class="theme-toggle-input"
      aria-label="Toggle theme"
    />
    <span class="theme-toggle-slider">
      <span class="theme-toggle-dot" id="theme-toggle-dot"></span>
    </span>
    <span class="theme-toggle-text">🌙 Dark</span>
  </label>
</div>
```

### Pages WITH full theme toggle:

- ✅ `top-bar.html` template (line 92-105)
- ✅ `dashboard.html` (line 262-274) - **Different**: Uses "Light" instead of "🌙 Dark", different ID

### Pages WITH fallback button only:

- ❌ `roster.html` - Fallback button (hidden)
- ❌ `analytics.html` - Fallback button (hidden)
- ❌ `settings.html` - Fallback button (hidden)
- ❌ `community.html` - Fallback button (hidden)
- ❌ `chat.html` - Fallback button (hidden)
- ❌ `wellness.html` - Fallback button (hidden)
- ❌ `training.html` - Fallback button (hidden)

### Inconsistency Details:

- **dashboard.html**: Uses `id="theme-toggle"` instead of `id="header-theme-toggle"`
- **dashboard.html**: Uses `for="theme-toggle"` on label instead of no `for` attribute
- **dashboard.html**: Text says "Light" instead of "🌙 Dark"
- **dashboard.html**: Missing `id="theme-toggle-dot"` on the dot span

---

## 5. Notification Badge Values

### Issue

Different default notification badge values across pages.

### Standard Template

```html
<span id="notification-badge" class="badge" hidden>3</span>
```

### Notification Badge Values:

- `top-bar.html` template: **3**
- `dashboard.html`: **3**
- `roster.html`: **3**
- `analytics.html`: **3**
- `settings.html`: **3**
- `community.html`: **3**
- `chat.html`: **3**
- `wellness.html`: **2** ⚠️
- `training.html`: **2** ⚠️

---

## 6. Settings Button

### Issue

Settings button implementation is consistent, but may have different click handlers.

### Standard Template

```html
<button class="header-icon" type="button" aria-label="Settings">
  <i data-lucide="settings" class="icon-18"></i>
</button>
```

### Status:

- ✅ All pages have consistent settings button implementation
- ⚠️ No click handlers or links defined (may need functionality added)

---

## 7. Notification Button Wrapper

### Issue

Inconsistent use of `header-icon-wrap` wrapper.

### Standard Template

```html
<div class="header-icon-wrap">
  <button id="notification-bell" class="header-icon" ...>...</button>
  <span id="notification-live" class="sr-only" aria-live="polite"></span>
</div>
```

### Pages WITH wrapper:

- ✅ `top-bar.html` template
- ✅ `dashboard.html`
- ✅ `roster.html`
- ✅ `analytics.html`
- ✅ `settings.html`
- ✅ `community.html`
- ✅ `chat.html`
- ✅ `wellness.html`
- ✅ `training.html`

### Status:

- ✅ Consistent across all pages

---

## 8. Special Case: game-tracker.html

### Issue

Uses a custom component instead of standard HTML.

### Implementation:

```html
<top-bar></top-bar>
```

### Status:

- ⚠️ Uses web component - needs verification that it matches standard template

---

## Summary of Critical Issues

### High Priority:

1. **Missing mobile menu toggle** on 5+ pages (roster, analytics, settings, community, chat)
2. **Missing user menu dropdown** on all pages except template
3. **Inconsistent theme toggle** - most pages only have hidden fallback button

### Medium Priority:

4. **Inconsistent search placeholder text** across pages
5. **Missing search box** on roster and analytics pages (replaced with page title)
6. **Different notification badge defaults** (2 vs 3)

### Low Priority:

7. **Different user avatar initials** (U vs JD)
8. **Inconsistent function names** (`openMenu()` vs `toggleSidebar()`)

---

## Recommendations

1. **Standardize mobile menu toggle**: Add to all pages missing it, use consistent function name
2. **Add user menu dropdown**: Implement dropdown menu on all pages
3. **Standardize theme toggle**: Use full toggle implementation on all pages
4. **Standardize search**: Either use search box or page title consistently per page type
5. **Standardize notification badge**: Use consistent default value (3)
6. **Create shared component**: Consider creating a reusable component to avoid future inconsistencies
