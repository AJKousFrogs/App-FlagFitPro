# Badge Component

## Overview

Small status indicators, labels, and tags for displaying metadata, status, or categories.

## Usage

Copy the HTML from `badge.html` into your page. Badges are inline elements.

## Variants

- **Primary** (`.badge-primary`) - Default brand color
- **Secondary** (`.badge-secondary`) - Secondary color
- **Success** (`.badge-success`) - Success state (green)
- **Warning** (`.badge-warning`) - Warning state (yellow/amber)
- **Error** (`.badge-error`) - Error state (red)

## Sizes

- **Small** (`.badge-sm`) - Compact badge
- **Medium** (`.badge-md`) - **Default**
- **Large** (`.badge-lg`) - Larger badge

## HTML Structure

```html
<span class="badge badge-primary">Label</span>
```

## With Icon

```html
<span class="badge badge-primary">
  <i data-lucide="check" style="width: 14px; height: 14px;"></i>
  Verified
</span>
```

## CSS Classes

- `.badge` - Base badge class (required)
- `.badge-primary` - Primary variant
- `.badge-success` - Success variant
- `.badge-warning` - Warning variant
- `.badge-error` - Error variant
- `.badge-sm`, `.badge-md`, `.badge-lg` - Size modifiers

## Common Use Cases

- Status indicators (Active, Inactive, Pending)
- Categories (New, Featured, Popular)
- Counts (Notifications, Items)
- Tags (Skills, Interests)

## Accessibility

- ✅ Semantic `<span>` element
- ✅ Color is not the only indicator (includes text)
- ✅ Sufficient color contrast (WCAG AA)

## Notes

- Badges are inline elements
- Use sparingly to avoid visual clutter
- Ensure text is readable at small sizes
- Icon size should be smaller than badge text
