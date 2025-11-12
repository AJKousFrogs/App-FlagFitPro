# Tabs Component

## Overview

Tabbed interface component for organizing content into sections. Includes full keyboard navigation and ARIA support for accessibility.

## Usage

Copy the HTML from `tabs.html` into your page. Includes JavaScript for functionality.

## HTML Structure

```html
<div class="tabs" data-tabs="unique-id">
    <div class="tabs-list" role="tablist">
        <button class="tabs-trigger tabs-active" role="tab" aria-selected="true" aria-controls="panel-1" id="trigger-1">
            Tab 1
        </button>
        <button class="tabs-trigger" role="tab" aria-selected="false" aria-controls="panel-2" id="trigger-2">
            Tab 2
        </button>
    </div>
    
    <div class="tabs-content">
        <div class="tabs-panel tabs-active" role="tabpanel" aria-labelledby="trigger-1" id="panel-1">
            Content 1
        </div>
        <div class="tabs-panel" role="tabpanel" aria-labelledby="trigger-2" id="panel-2">
            Content 2
        </div>
    </div>
</div>
```

## CSS Classes

- `.tabs` - Container (required)
- `.tabs-list` - Tab button container
- `.tabs-trigger` - Individual tab button
- `.tabs-trigger.tabs-active` - Active tab
- `.tabs-content` - Content container
- `.tabs-panel` - Individual panel
- `.tabs-panel.tabs-active` - Active panel

## Keyboard Navigation

- **Arrow Right** - Next tab
- **Arrow Left** - Previous tab
- **Home** - First tab
- **End** - Last tab
- **Tab** - Focus management

## Accessibility

- ✅ `role="tablist"` and `role="tab"`
- ✅ `role="tabpanel"` for content
- ✅ `aria-selected` for active state
- ✅ `aria-controls` links trigger to panel
- ✅ `aria-labelledby` links panel to trigger
- ✅ Keyboard navigation support
- ✅ Focus management

## With Icons

```html
<button class="tabs-trigger">
    <i data-lucide="home" style="width: 18px; height: 18px;"></i>
    <span>Home</span>
</button>
```

## JavaScript

The component includes JavaScript for:
- Tab switching
- Keyboard navigation
- ARIA attribute updates
- Focus management

## Notes

- Each tabs instance needs unique `data-tabs` value
- Active tab has `.tabs-active` class
- Panels are hidden by default
- Only active panel is visible
- Test with keyboard navigation

