# Card Component

## Overview

Content container component for grouping related information. Supports multiple variants and flexible structure with header, body, and footer sections.

## Usage

Copy the HTML from `card.html` into your page. Cards are flexible containers that can hold any content.

## Variants

- **Default** (`.card`) - Standard card with shadow
- **Elevated** (`.card-elevated`) - Higher shadow for emphasis, high contrast
- **Interactive** (`.card-interactive`) - Hover effects, clickable

## Structure

```html
<div class="card">
  <div class="card-header">Header</div>
  <div class="card-body">Body</div>
  <div class="card-footer">Footer</div>
</div>
```

All sections are optional. Use only what you need.

## Basic Card

```html
<div class="card">
  <div class="card-body">
    <p>Simple card with just body content.</p>
  </div>
</div>
```

## Card with Header

```html
<div class="card">
  <div class="card-header">
    <h3>Card Title</h3>
  </div>
  <div class="card-body">
    <p>Card content.</p>
  </div>
</div>
```

## Card with Footer

```html
<div class="card">
  <div class="card-body">
    <p>Card content.</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary btn-sm">Action</button>
  </div>
</div>
```

## CSS Classes

- `.card` - Base card class (required)
- `.card-elevated` - Elevated shadow variant, high contrast
- `.card-interactive` - Interactive hover effects
- `.card-header` - Header section
- `.card-body` - Body section (main content)
- `.card-footer` - Footer section

## Common Patterns

### Stat Card

```html
<div class="card">
  <div class="card-header">
    <span>Training Sessions</span>
  </div>
  <div class="card-body">
    <div style="font-size: 2rem; font-weight: 600;">24</div>
    <div style="color: var(--color-text-secondary);">+12% from last week</div>
  </div>
</div>
```

### Metric Card

```html
<div class="card">
  <div class="card-body">
    <div style="display: flex; justify-content: space-between;">
      <div>
        <div style="font-size: 0.875rem; color: var(--color-text-secondary);">
          Total Distance
        </div>
        <div style="font-size: 1.5rem; font-weight: 600;">12.5 km</div>
      </div>
      <i data-lucide="map" style="width: 32px; height: 32px;"></i>
    </div>
  </div>
</div>
```

## Accessibility

- ✅ Semantic HTML structure
- ✅ Proper heading hierarchy in headers
- ✅ Focus states for interactive cards
- ✅ Sufficient color contrast

## Notes

- Cards are flexible containers - use for any grouped content
- Header typically contains titles or actions
- Footer typically contains actions or metadata
- Use elevated variant sparingly for emphasis
- Interactive cards should be clickable or have clear affordance
