# Visual Hierarchy System - FlagFit Pro

**Enhanced typography, spacing, and contrast for clear information hierarchy**

## Overview

The Visual Hierarchy System provides a comprehensive set of utilities and tokens to create clear, accessible, and visually appealing information hierarchy throughout the FlagFit Pro application. This system enhances readability, guides user attention, and improves overall user experience.

## Key Principles

1. **Size Differentiation**: Clear size differences between heading levels
2. **Weight Variation**: Strategic use of font weights to emphasize importance
3. **Color Contrast**: Text color hierarchy for different content types
4. **Spacing Rhythm**: Consistent spacing creates visual relationships
5. **Line Height**: Optimized line heights for readability

## Typography Scale

### Display Text (Hero Sections, Landing Pages)

```css
.text-display-2xl  /* 72px - Largest display text */
.text-display-xl   /* 60px - Large display text */
```

### Headings

```css
.text-heading-2xl  /* 40px - Page titles */
.text-heading-xl   /* 30px - Section titles */
.text-heading-lg   /* 24px - Subsection titles */
.text-heading-md   /* 20px - Card titles */
.text-heading-sm   /* 18px - Small headings */
```

### Body Text

```css
.text-body-lg      /* 18px - Lead paragraphs */
.text-body-md      /* 16px - Standard body text */
.text-body-sm      /* 14px - Supporting text */
.text-body-xs      /* 12px - Captions, metadata */
```

## Font Weights

```css
.font-light      /* 300 - Light weight */
.font-normal     /* 400 - Normal weight */
.font-medium     /* 500 - Medium weight */
.font-semibold   /* 600 - Semibold weight */
.font-bold       /* 700 - Bold weight */
```

## Text Color Hierarchy

Use these classes to create visual hierarchy through color:

```css
.text-primary      /* Highest contrast - main content */
.text-secondary    /* Medium contrast - supporting text */
.text-tertiary     /* Lower contrast - metadata, hints */
.text-muted        /* Alias for tertiary */
.text-disabled     /* Lowest contrast - disabled states */
```

### Color Values

- **Primary**: `#1a1a1a` - Main text content
- **Secondary**: `#4a4a4a` - Supporting information
- **Tertiary**: `#6b7280` - Metadata, hints, less important info
- **Disabled**: `#d4d4d4` - Disabled or inactive states

## Line Heights

```css
.leading-none      /* 1 - Tightest, for large display text */
.leading-tight      /* 1.2 - Tight, for headings */
.leading-snug      /* 1.375 - Snug, for subheadings */
.leading-normal    /* 1.5 - Normal, for body text */
.leading-relaxed   /* 1.625 - Relaxed, for long-form content */
.leading-loose      /* 2 - Loose, for special cases */
```

## Letter Spacing

```css
.tracking-tighter  /* -0.05em - Tighter spacing */
.tracking-tight    /* -0.02em - Tight spacing */
.tracking-normal   /* 0 - Normal spacing */
.tracking-wide     /* 0.025em - Wide spacing */
.tracking-wider    /* 0.05em - Wider spacing */
.tracking-widest   /* 0.1em - Widest spacing */
```

## Spacing Hierarchy

Vertical spacing between elements creates visual relationships:

```css
.space-tight      /* 8px - Tight relationship */
.space-normal     /* 16px - Normal relationship */
.space-relaxed    /* 24px - Relaxed relationship */
.space-loose      /* 32px - Loose relationship */
.space-section    /* 48px - Section separation */
.space-none       /* 0 - No spacing */
```

## Visual Emphasis Utilities

### Emphasize Important Text

```css
.text-emphasis         /* Semibold + primary color */
.text-emphasis-strong  /* Bold + primary color */
```

### De-emphasize Less Important Text

```css
.text-deemphasize         /* Normal weight + secondary color */
.text-deemphasize-strong  /* Normal weight + tertiary color */
```

## Section Hierarchy Classes

Pre-built classes for common section patterns:

```css
.section-title       /* Large section heading */
.section-subtitle    /* Medium section subheading */
.section-description /* Section description text */
```

## Card Hierarchy Classes

Pre-built classes for card components:

```css
.card-title       /* Card heading */
.card-subtitle    /* Card subheading */
.card-text        /* Card body text */
.card-text-muted  /* Card muted text */
```

## Usage Examples

### Page Title

```html
<h1 class="text-heading-2xl text-primary leading-tight tracking-tight">
  Performance Dashboard
</h1>
```

### Section with Description

```html
<section>
  <h2 class="section-title">Training Progress</h2>
  <p class="section-description">
    Track your athletes' training sessions and performance metrics.
  </p>
</section>
```

### Card with Hierarchy

```html
<div class="card">
  <h3 class="card-title">Weekly Stats</h3>
  <p class="card-subtitle">Last 7 days</p>
  <p class="card-text">
    Your athletes completed 24 training sessions this week.
  </p>
  <p class="card-text-muted">Updated 2 hours ago</p>
</div>
```

### Text with Emphasis

```html
<p class="text-body-md">
  Your team has completed
  <span class="text-emphasis-strong">85%</span>
  of scheduled training sessions.
</p>
```

### Paragraph Variants

```html
<!-- Lead paragraph -->
<p class="lead">This is a lead paragraph that stands out.</p>

<!-- Standard paragraph -->
<p>This is standard body text.</p>

<!-- Small text -->
<p class="small">This is smaller supporting text.</p>

<!-- Muted text -->
<p class="muted">This is muted, less important text.</p>
```

## Heading Styles

All heading elements (`h1` through `h6`) are automatically styled with proper hierarchy:

```html
<h1>Page Title</h1>
<!-- 40px, bold, tight spacing -->
<h2>Section Title</h2>
<!-- 30px, semibold -->
<h3>Subsection</h3>
<!-- 24px, semibold -->
<h4>Card Title</h4>
<!-- 20px, semibold -->
<h5>Small Heading</h5>
<!-- 18px, semibold -->
<h6>Label Heading</h6>
<!-- 14px, semibold, uppercase -->
```

## Responsive Behavior

The visual hierarchy system automatically adjusts on mobile devices:

- **Mobile (< 768px)**: Heading sizes are reduced for better fit
  - `h1`: 30px (instead of 40px)
  - `h2`: 24px (instead of 30px)
  - `h3`: 20px (instead of 24px)

## Best Practices

### ✅ Do

- Use semantic HTML (`h1`, `h2`, `h3`, etc.) for headings
- Apply color hierarchy classes to create visual distinction
- Use spacing utilities to create clear relationships between elements
- Combine size, weight, and color for maximum hierarchy clarity
- Use `.text-emphasis` for important inline text

### ❌ Don't

- Don't skip heading levels (e.g., `h1` → `h3`)
- Don't use color alone to convey importance (accessibility)
- Don't use too many different font sizes on one page
- Don't use `.text-disabled` for non-disabled content
- Don't override heading styles without good reason

## Accessibility

The visual hierarchy system is designed with accessibility in mind:

- **Color Contrast**: All text colors meet WCAG AA contrast requirements
- **Semantic HTML**: Proper use of heading elements for screen readers
- **Size Relationships**: Clear size differences aid visual scanning
- **Weight Variation**: Font weights provide additional hierarchy cues

## Design Tokens

All visual hierarchy values are defined as CSS custom properties in `design-system-tokens.css`:

```css
/* Typography */
--font-display-2xl: 4.5rem;
--font-heading-2xl: 2.5rem;
--font-heading-xl: 1.875rem;
/* ... */

/* Line Heights */
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.625;
/* ... */

/* Letter Spacing */
--letter-spacing-tight: -0.02em;
--letter-spacing-normal: 0;
--letter-spacing-wide: 0.025em;
/* ... */

/* Text Colors */
--text-hierarchy-primary: #1a1a1a;
--text-hierarchy-secondary: #4a4a4a;
--text-hierarchy-tertiary: #6b7280;
--text-hierarchy-disabled: #d4d4d4;

/* Spacing */
--hierarchy-spacing-tight: 8px;
--hierarchy-spacing-normal: 16px;
--hierarchy-spacing-relaxed: 24px;
--hierarchy-spacing-loose: 32px;
--hierarchy-spacing-section: 48px;
```

## Migration Guide

If you're updating existing code to use the new visual hierarchy system:

1. **Replace custom heading styles** with semantic HTML and utility classes
2. **Update text colors** to use hierarchy classes (`.text-primary`, `.text-secondary`, etc.)
3. **Replace hardcoded spacing** with hierarchy spacing utilities
4. **Review font weights** and use standard weight classes
5. **Test accessibility** to ensure proper contrast and hierarchy

## Examples

### Before (Old System)

```html
<div
  style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;"
>
  Section Title
</div>
<p style="font-size: 16px; color: #4a4a4a; margin-bottom: 24px;">
  Section description
</p>
```

### After (Visual Hierarchy System)

```html
<h2 class="section-title">Section Title</h2>
<p class="section-description">Section description</p>
```

Or with utility classes:

```html
<h2 class="text-heading-xl text-primary leading-snug space-normal">
  Section Title
</h2>
<p class="text-body-md text-secondary leading-relaxed space-relaxed">
  Section description
</p>
```

## Related Documentation

- [Design System Documentation](./DESIGN_SYSTEM_DOCUMENTATION.md)
- [Typography System](./DESIGN_SYSTEM_DOCUMENTATION.md#typography-system)
- [Spacing & Layout](./DESIGN_SYSTEM_DOCUMENTATION.md#spacing--layout)

---

**Last Updated**: December 2025  
**Version**: 1.0
