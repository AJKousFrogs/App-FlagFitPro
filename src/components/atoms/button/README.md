# Button Component

## Overview

Standard button component for all interactive actions. Supports multiple variants, sizes, and states with built-in accessibility features.

## Usage

Copy the HTML from `button.html` into your page. All buttons use the design system CSS classes.

## Variants

- **Primary** (`.btn-primary`) - Main actions, primary CTAs
- **Secondary** (`.btn-secondary`) - Supporting actions, alternative options
- **Tertiary** (`.btn-tertiary`) - Low emphasis actions, text links
- **Success** (`.btn-success`) - Success/confirmation actions
- **Warning** (`.btn-warning`) - Warning actions
- **Error** (`.btn-error`) - Destructive/dangerous actions

## Sizes

- **Extra Small** (`.btn-xs`) - 28px height, compact spaces
- **Small** (`.btn-sm`) - 36px height, secondary actions
- **Medium** (`.btn-md`) - 44px height, **default**
- **Large** (`.btn-lg`) - 52px height, primary CTAs
- **Extra Large** (`.btn-xl`) - 60px height, hero sections

## States

| State | Usage |
|-------|-------|
| Default | Normal interactive state |
| Hover | Automatic via CSS |
| Active | Automatic via CSS |
| Disabled | Add `disabled` attribute |
| Focus | Automatic focus-visible indicator |

## HTML Structure

```html
<button class="btn btn-primary btn-md">
    Button Text
</button>
```

## With Icons

```html
<button class="btn btn-primary btn-md">
    <i data-lucide="icon-name" style="width: 18px; height: 18px;"></i>
    Button Text
</button>
```

**Important:** Always set explicit width and height for icons (16px, 18px, 20px, 24px).

## CSS Classes

- `.btn` - Base button class (required)
- `.btn-primary` - Primary variant
- `.btn-secondary` - Secondary variant
- `.btn-tertiary` - Tertiary variant
- `.btn-xs` through `.btn-xl` - Size modifiers
- `.btn-success`, `.btn-warning`, `.btn-error` - Status variants

## Accessibility

- ✅ Focus indicator via `:focus-visible`
- ✅ Disabled state prevents interaction
- ✅ Minimum touch target: 44px × 44px
- ✅ Semantic `<button>` element
- ✅ Icon-only buttons require `aria-label`

## Examples

See `button-examples.html` for real-world usage examples.

## Notes

- Always use semantic `<button>` element (not `<div>` or `<a>`)
- For navigation, use `<a>` with button classes
- Icon size should match button size context
- Test focus states with keyboard (Tab key)
- Ensure sufficient color contrast (WCAG AA)

