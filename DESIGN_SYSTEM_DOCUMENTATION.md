# FlagFit Pro - Comprehensive Design System Documentation

## Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Design Token Architecture](#design-token-architecture)
4. [Typography System](#typography-system)
5. [Color System](#color-system)
6. [Spacing & Layout](#spacing--layout)
7. [Component Library](#component-library)
8. [Component Composition Patterns](#component-composition-patterns)
9. [Icon System](#icon-system)
10. [Motion & Animation](#motion--animation)
11. [Accessibility](#accessibility)
12. [Component Testing Guidelines](#component-testing-guidelines)
13. [Error Handling & Validation](#error-handling--validation)
14. [Implementation Guide](#implementation-guide)
15. [Performance Guidelines](#performance-guidelines)
16. [Versioning & Changelog](#versioning--changelog)
17. [Governance](#governance)
18. [Browser Compatibility Matrix](#browser-compatibility-matrix)
19. [Writing Guidelines](#writing-guidelines)
20. [Roadmap](#roadmap)

## Overview

The FlagFit Pro Design System is a comprehensive, semantic token-based design framework built for Olympic-level flag football training applications. It provides a scalable, accessible, and maintainable foundation for creating consistent user experiences across all touchpoints.

### Key Features

- **Semantic Token Architecture**: Two-tier system with primitive and semantic tokens
- **Complete Component Library**: 20+ production-ready components with multiple variants
- **Flexible Layout System**: Both uniform grids and bento grid layouts for different use cases
- **Accessibility-First**: WCAG 2.1 AA compliant with comprehensive accessibility features
- **Theme Toggle Switch**: Manual light/dark mode toggle with system preference detection
- **Green Theme Palette**: Consistent green color scheme across all pages
- **Lucide Icons**: Modern icon library replacing emoji icons
- **Responsive Design**: Comprehensive mobile, tablet, and desktop breakpoints
- **Performance Optimized**: Minimal CSS footprint with efficient loading strategies

## Design Principles

Our design system is built on four foundational principles:

### 1. **Clarity & Simplicity**

- Information hierarchy is immediately apparent
- Visual noise is minimized to focus on essential content
- Complex data is broken down into digestible components

### 2. **Accessibility & Inclusion**

- Meets WCAG 2.1 AA standards across all components
- Supports assistive technologies and diverse user needs
- Color-blind friendly with redundant indicators

### 3. **Athletic Performance Focus**

- Data visualization emphasizes performance metrics
- Quick recognition of status and progress indicators
- Optimized for rapid decision-making during training

### 4. **Scalable Architecture**

- Component-based approach enables rapid development
- Semantic tokens allow global theming changes
- Modular system grows with product needs

## Design Token Architecture

Our token system uses a two-tier architecture for maximum flexibility and maintainability.

### Primitive Tokens (Global Values)

```css
/* Color Primitives - Green Theme */
--primitive-primary-500: #10c96b;
--primitive-primary-600: #0ab85a;
--primitive-primary-700: #089949;
--primitive-secondary-500: #89c300;
--primitive-tertiary-500: #cc9610;
--primitive-neutral-300: #d0d0d0;

/* Typography Primitives */
--primitive-font-size-16: 1rem;
--primitive-font-weight-600: 600;

/* Spacing Primitives (8-point grid) */
--primitive-space-16: 1rem;
--primitive-space-24: 1.5rem;
```

### Semantic Tokens (Contextual Values)

```css
/* Brand Colors - Green Theme */
--color-brand-primary: var(--primitive-primary-500); /* #10c96b */
--color-brand-primary-hover: var(--primitive-primary-600); /* #0ab85a */
--color-brand-secondary: var(--primitive-secondary-500); /* #89c300 */
--color-brand-tertiary: var(--primitive-tertiary-500); /* #cc9610 */

/* Surface Colors */
--surface-primary: #ffffff;
--surface-secondary: var(--primitive-gray-50);

/* Interactive Colors */
--color-interactive-primary: var(--color-brand-primary);
--color-interactive-primary-disabled: var(--primitive-gray-300);
```

### Benefits of This Architecture

- **Maintainability**: Change primitive values to update entire themes
- **Consistency**: Semantic tokens ensure appropriate color usage
- **Scalability**: Easy to add new themes or modify existing ones
- **Developer Experience**: Clear naming conventions reduce decision fatigue

### Design Tokens Export

Design tokens are available as JavaScript/JSON exports for use in other tools (Figma, React, Vue, etc.).

#### JavaScript Export

```javascript
// design-tokens.js
export const tokens = {
  colors: {
    // Brand Colors - Green Theme
    brand: {
      primary: {
        50: "#f0f9f7",
        100: "#d0f0eb",
        200: "#a0e4d7",
        300: "#70d8c3",
        400: "#40ccaf",
        500: "#10c96b", // Main brand color
        600: "#0ab85a",
        700: "#089949",
        800: "#089949",
        900: "#036d35",
      },
      secondary: {
        500: "#89c300", // Lime green
        600: "#6fa600",
        700: "#558400",
      },
      tertiary: {
        500: "#cc9610", // Gold/warm
        600: "#b37700",
        700: "#9a5800",
      },
    },
    // Semantic Colors
    status: {
      success: {
        50: "#f0fdf4",
        500: "#22c55e",
        600: "#16a34a",
        700: "#15803d",
      },
      error: {
        50: "#fef2f2",
        500: "#ef4444",
        600: "#dc2626",
        700: "#b91c1c",
      },
      warning: {
        50: "#fffbeb",
        500: "#f59e0b",
        600: "#d97706",
        700: "#b45309",
      },
      info: {
        50: "#f0f9ff",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
      },
    },
    // Neutral Colors
    neutral: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#f0f0f0",
      300: "#e5e5e5",
      400: "#d4d4d4",
      500: "#a3a3a3",
      600: "#737373",
      700: "#404040",
      800: "#262626",
      900: "#171717",
      950: "#0a0a0a",
    },
  },
  spacing: {
    0: "0",
    1: "0.25rem", // 4px
    2: "0.5rem", // 8px
    3: "0.75rem", // 12px
    4: "1rem", // 16px
    5: "1.25rem", // 20px
    6: "1.5rem", // 24px
    8: "2rem", // 32px
    10: "2.5rem", // 40px
    12: "3rem", // 48px
    16: "4rem", // 64px
    20: "5rem", // 80px
    24: "6rem", // 96px
  },
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      display: "'Poppins', 'Inter', sans-serif",
      mono: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
    },
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem", // 48px
      "6xl": "3.75rem", // 60px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },
  shadows: {
    xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  },
  borderRadius: {
    none: "0",
    sm: "0.125rem", // 2px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    "2xl": "1rem", // 16px
    "3xl": "1.5rem", // 24px
    full: "9999px",
  },
  motion: {
    duration: {
      instant: "75ms",
      fast: "150ms",
      normal: "200ms",
      slow: "300ms",
    },
    easing: {
      entrance: "cubic-bezier(0, 0, 0.2, 1)",
      exit: "cubic-bezier(0.4, 0, 1, 1)",
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
  breakpoints: {
    sm: "480px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
};

// CSS Custom Properties export
export const cssVariables = {
  "--color-brand-primary": tokens.colors.brand.primary[500],
  "--color-brand-primary-hover": tokens.colors.brand.primary[600],
  "--spacing-4": tokens.spacing[4],
  "--spacing-6": tokens.spacing[6],
  // ... all semantic tokens
};

// Usage in React/Vue
export const useDesignTokens = () => tokens;
```

#### JSON Export

```json
{
  "colors": {
    "brand": {
      "primary": {
        "500": "#10c96b",
        "600": "#0ab85a",
        "700": "#089949"
      }
    }
  },
  "spacing": {
    "1": "0.25rem",
    "2": "0.5rem",
    "4": "1rem"
  }
}
```

#### Figma Plugin Integration

```javascript
// figma-tokens.js
// Import tokens and sync to Figma
import { tokens } from "./design-tokens.js";

// Sync colors to Figma
Object.entries(tokens.colors.brand.primary).forEach(([shade, value]) => {
  figma.createPaintStyle({
    name: `Brand/Primary/${shade}`,
    paints: [{ type: "SOLID", color: hexToRgb(value) }],
  });
});
```

#### Usage Examples

**React:**

```javascript
import { tokens } from "./design-tokens.js";

const Button = ({ children }) => (
  <button
    style={{
      backgroundColor: tokens.colors.brand.primary[500],
      padding: tokens.spacing[4],
      borderRadius: tokens.borderRadius.lg,
    }}
  >
    {children}
  </button>
);
```

**Vue:**

```vue
<template>
  <button :style="buttonStyle">{{ label }}</button>
</template>

<script>
import { tokens } from "./design-tokens.js";

export default {
  computed: {
    buttonStyle() {
      return {
        backgroundColor: tokens.colors.brand.primary[500],
        padding: tokens.spacing[4],
      };
    },
  },
};
</script>
```

### Complete Token Reference

Quick reference table of all available design tokens:

| Category            | Token                         | Value            | Usage                           |
| ------------------- | ----------------------------- | ---------------- | ------------------------------- |
| **Colors - Brand**  | `--color-brand-primary`       | `#10c96b`        | Primary buttons, links, accents |
|                     | `--color-brand-primary-hover` | `#0ab85a`        | Hover states                    |
|                     | `--color-brand-secondary`     | `#89c300`        | Secondary actions               |
|                     | `--color-brand-tertiary`      | `#cc9610`        | Tertiary accents                |
| **Colors - Status** | `--color-status-success`      | `#22c55e`        | Success states                  |
|                     | `--color-status-error`        | `#ef4444`        | Error states                    |
|                     | `--color-status-warning`      | `#f59e0b`        | Warning states                  |
|                     | `--color-status-info`         | `#3b82f6`        | Info states                     |
| **Spacing**         | `--space-1`                   | `4px`            | Tight spacing                   |
|                     | `--space-2`                   | `8px`            | Small spacing                   |
|                     | `--space-4`                   | `16px`           | Standard spacing                |
|                     | `--space-6`                   | `24px`           | Medium spacing                  |
|                     | `--space-8`                   | `32px`           | Large spacing                   |
| **Typography**      | `--font-size-base`            | `16px`           | Body text                       |
|                     | `--font-size-lg`              | `18px`           | Large body                      |
|                     | `--font-size-xl`              | `20px`           | Small headings                  |
|                     | `--font-weight-semibold`      | `600`            | Headings                        |
| **Shadows**         | `--shadow-sm`                 | `0 1px 3px...`   | Subtle elevation                |
|                     | `--shadow-md`                 | `0 4px 6px...`   | Standard elevation              |
|                     | `--shadow-lg`                 | `0 10px 15px...` | High elevation                  |
| **Border Radius**   | `--radius-sm`                 | `6px`            | Small radius                    |
|                     | `--radius-lg`                 | `12px`           | Standard radius                 |
|                     | `--radius-xl`                 | `16px`           | Large radius                    |

_See Design Tokens Export section for complete token list._

## Typography System

### Font Families

- **Primary**: `'Inter'` - Optimized for UI text, excellent readability at small sizes
- **Display**: `'Poppins'` - Used for headings and hero text
- **Monospace**: `'SF Mono'` - Code snippets and data tables

### Typography Scale

Our typography system uses semantic sizing that adapts to context:

| Size          | Use Case           | Font Size | Line Height |
| ------------- | ------------------ | --------- | ----------- |
| `display-2xl` | Hero sections      | 72px      | 1.0         |
| `display-xl`  | Page headers       | 60px      | 1.0         |
| `heading-xl`  | Section headers    | 30px      | 1.25        |
| `heading-lg`  | Subsection headers | 24px      | 1.25        |
| `heading-md`  | Component titles   | 20px      | 1.375       |
| `body-lg`     | Large body text    | 18px      | 1.625       |
| `body-md`     | Standard body text | 16px      | 1.5         |
| `body-sm`     | Supporting text    | 14px      | 1.5         |
| `caption`     | Small details      | 12px      | 1.375       |

### Usage Guidelines

```html
<!-- Page Hero -->
<h1 class="text-display-xl">Performance Analytics</h1>

<!-- Section Header -->
<h2 class="text-heading-lg">Training Progress</h2>

<!-- Body Content -->
<p class="text-body-md">Your performance has improved by 15% this week.</p>

<!-- Supporting Detail -->
<span class="text-caption">Last updated 2 minutes ago</span>
```

## Color System

### Color Philosophy

Our color system uses a **green theme palette** that balances brand identity with functional clarity, using color to convey meaning and establish hierarchy without overwhelming users.

### Primary Palette - Green Theme

- **Primary Green** (`#10c96b`): Main brand color, used for interactive elements, buttons, links
- **Secondary Lime** (`#89c300`): Supporting actions, secondary accents
- **Tertiary Gold** (`#cc9610`): Warm accents, highlights, achievements
- **Success Green**: Success states, positive metrics
- **Error Red**: Error states, warnings, critical actions
- **Warning Amber**: Warning states, attention indicators
- **Neutral Gray**: Text, borders, neutral backgrounds

### Semantic Color Mapping

```css
/* Status Colors */
--color-status-success: var(--primitive-success-600);
--color-status-warning: var(--primitive-warning-600);
--color-status-error: var(--primitive-error-600);
--color-status-info: var(--primitive-primary-500); /* Green theme */

/* Text Colors */
--color-text-primary: var(--primitive-gray-900);
--color-text-secondary: var(--primitive-gray-700);
--color-text-disabled: var(--primitive-gray-400);
```

### Accessibility Standards

- **AA Compliance**: 4.5:1 contrast ratio for normal text
- **AAA Support**: 7:1 contrast ratio available for critical elements
- **Color Independence**: Never rely solely on color to convey meaning

## Spacing & Layout

### Spacing Scale System

The design system uses a comprehensive spacing scale based on a 4px base unit for fine-grained control:

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px */
}
```

### Primitive Spacing Tokens (8-Point Grid)

For backward compatibility and semantic usage, primitive tokens are also available:

```css
--primitive-space-8: 0.5rem; /* 8px */
--primitive-space-16: 1rem; /* 16px */
--primitive-space-24: 1.5rem; /* 24px */
--primitive-space-32: 2rem; /* 32px */
--primitive-space-48: 3rem; /* 48px */
```

### Semantic Spacing Tokens

Semantic tokens provide context-aware spacing for components and layouts:

```css
/* Component Spacing */
--spacing-component-xs: var(--primitive-space-12); /* 12px */
--spacing-component-sm: var(--primitive-space-16); /* 16px */
--spacing-component-md: var(--primitive-space-24); /* 24px */
--spacing-component-lg: var(--primitive-space-32); /* 32px */
--spacing-component-xl: var(--primitive-space-40); /* 40px */

/* Layout Spacing */
--spacing-layout-xs: var(--primitive-space-24); /* 24px */
--spacing-layout-sm: var(--primitive-space-32); /* 32px */
--spacing-layout-md: var(--primitive-space-40); /* 40px */
--spacing-layout-lg: var(--primitive-space-56); /* 56px */
--spacing-layout-xl: var(--primitive-space-64); /* 64px */
```

### Layout Components

#### Layout Container

Use `.layout-container` for consistent page-level spacing:

```css
.layout-container {
  display: grid;
  gap: var(--space-6); /* 24px gap */
  padding: var(--space-6); /* 24px padding */
}
```

#### Dashboard Grid

Responsive grid layout for dashboard components:

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-6); /* 24px gap between cards */
}
```

#### Bento Grid Layout

A modern asymmetric grid layout inspired by bento boxes, allowing cards to span multiple columns/rows for visual hierarchy and better space utilization:

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr); /* 12-column grid */
  gap: var(--space-6); /* 24px gap */
  grid-auto-rows: minmax(200px, auto); /* Minimum row height */
}

/* Card span utilities */
.bento-card-span-4 {
  grid-column: span 4;
} /* 1/3 width */
.bento-card-span-6 {
  grid-column: span 6;
} /* 1/2 width */
.bento-card-span-8 {
  grid-column: span 8;
} /* 2/3 width */
.bento-card-span-12 {
  grid-column: span 12;
} /* Full width */

.bento-card-row-span-2 {
  grid-row: span 2;
} /* Double height */
.bento-card-row-span-3 {
  grid-row: span 3;
} /* Triple height */
```

**Why Bento Grid?**

- **Visual Hierarchy**: Larger cards naturally draw attention to important content
- **Space Efficiency**: Better use of available screen space
- **Modern Aesthetic**: Creates engaging, dynamic layouts (popularized by Apple, Notion, etc.)
- **Content Flexibility**: Accommodates different content types (charts, stats, lists) with appropriate sizing

**When to Use Bento Grid:**

- ✅ Dashboard overview pages with mixed content types
- ✅ When you need to emphasize certain metrics or actions
- ✅ Content-heavy pages where visual hierarchy matters
- ✅ Modern, engaging user experiences

**When to Use Uniform Grid:**

- ✅ Lists of similar items (roster, schedule items)
- ✅ When all content has equal importance
- ✅ Simpler, more predictable layouts
- ✅ Mobile-first designs where space is limited

**Why Bento Grid Wasn't Originally Included:**
The design system initially focused on uniform grids for simplicity and consistency. Uniform grids are:

- **Easier to implement**: No need to calculate spans or manage complex layouts
- **More predictable**: Developers know exactly how items will flow
- **Better for mobile**: Uniform grids naturally stack on small screens
- **Simpler maintenance**: Less CSS to maintain and fewer edge cases

However, bento grids are now included as an **optional enhancement** for dashboards and content-heavy pages where visual hierarchy and modern aesthetics are priorities. Both approaches coexist in the design system, allowing developers to choose the best layout for their specific use case.

#### Card Component

Standardized card spacing:

```css
.card {
  background: var(--color-surface);
  border-radius: 12px;
  padding: var(--space-5); /* 20px padding */
  box-shadow: var(--shadow-small);
}
```

#### Section Spacing

Consistent vertical spacing for content sections:

```css
.section {
  margin-top: var(--space-6); /* 24px top margin */
}

h2 {
  margin-bottom: var(--space-3); /* 12px bottom margin */
}
```

### Usage Examples

#### Uniform Grid Layout

```html
<!-- Layout Container with Dashboard Grid -->
<div class="layout-container">
  <div class="dashboard-grid">
    <div class="card">Next Session</div>
    <div class="card">Training Progress</div>
    <div class="card">Weekly Schedule</div>
  </div>
</div>
```

#### Bento Grid Layout

```html
<!-- Bento Grid with varied card sizes -->
<div class="layout-container">
  <div class="bento-grid">
    <!-- Hero card - spans full width -->
    <div class="card bento-card-span-12">
      <h2>Today's Training Session</h2>
      <!-- Primary content -->
    </div>

    <!-- Large metric card - spans 2/3 width -->
    <div class="card bento-card-span-8 bento-card-row-span-2">
      <h3>Performance Chart</h3>
      <!-- Chart content -->
    </div>

    <!-- Small metric cards - span 1/3 width -->
    <div class="card bento-card-span-4">
      <div class="metric-value">85%</div>
      <div class="metric-label">Completion Rate</div>
    </div>

    <div class="card bento-card-span-4">
      <div class="metric-value">12</div>
      <div class="metric-label">Sessions This Week</div>
    </div>

    <!-- Medium card - spans half width -->
    <div class="card bento-card-span-6">
      <h3>Upcoming Events</h3>
      <!-- Event list -->
    </div>

    <div class="card bento-card-span-6">
      <h3>Quick Actions</h3>
      <!-- Action buttons -->
    </div>
  </div>
</div>
```

#### Section with Consistent Spacing

```html
<section class="section">
  <h2>Performance Metrics</h2>
  <div class="card">
    <!-- Card content -->
  </div>
</section>
```

#### Responsive Bento Grid

```css
/* Desktop: Full bento grid */
.bento-grid {
  grid-template-columns: repeat(12, 1fr);
}

/* Tablet: 6-column grid */
@media (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(6, 1fr);
  }
  .bento-card-span-8 {
    grid-column: span 6;
  } /* Full width */
  .bento-card-span-4 {
    grid-column: span 3;
  } /* Half width */
}

/* Mobile: 2-column grid (improved hierarchy) */
@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: 1fr 1fr; /* 2 columns, not 1 */
    gap: var(--space-4); /* Smaller gap on mobile */
  }
  
  /* Hero cards span full width */
  .bento-card-hero,
  .bento-card-span-12 {
    grid-column: 1 / -1; /* Hero spans full width */
  }
  
  /* Large cards span full width on mobile */
  .bento-card-span-8 {
    grid-column: span 2; /* Full width */
  }
  
  /* Medium cards span full width */
  .bento-card-span-6 {
    grid-column: span 2; /* Full width */
  }
  
  /* Small cards stay 1 column (half width) */
  .bento-card-span-4 {
    grid-column: span 1; /* Half width */
  }
  
  /* Row spans reset on mobile */
  .bento-card-row-span-2,
  .bento-card-row-span-3 {
    grid-row: span 1;
  }
}

/* Small mobile: Single column for very small screens */
@media (max-width: 480px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }
  .bento-card-span-4,
  .bento-card-span-6,
  .bento-card-span-8,
  .bento-card-span-12 {
    grid-column: span 1; /* All cards full width */
  }
}
```

### Spacing Guidelines

- **Component Padding**: Use `--space-4` (16px) to `--space-6` (24px) for card padding
- **Component Gaps**: Use `--space-4` (16px) to `--space-6` (24px) for gaps between related elements
- **Layout Gaps**: Use `--space-6` (24px) to `--space-8` (32px) for grid gaps
- **Section Spacing**: Use `--space-6` (24px) to `--space-12` (48px) for vertical section spacing
- **Typography Spacing**: Use `--space-2` (8px) to `--space-4` (16px) for heading margins

### Responsive Breakpoints

Mobile-first approach with comprehensive device coverage:

- **Mobile Small**: 320px - 480px (iPhone SE, Small Android)
- **Mobile Medium**: 481px - 768px (iPhone 12/13/14, Samsung Galaxy)
- **Tablet Portrait**: 769px - 1024px (iPad, iPad Mini)
- **Tablet Landscape / Small Desktop**: 1025px - 1280px
- **Large Desktop**: 1281px+ (Desktop monitors)

### Touch Device Optimizations

- Minimum 44px touch targets for all interactive elements
- 16px font size on inputs (prevents iOS zoom)
- Touch-specific media queries: `@media (hover: none) and (pointer: coarse)`
- Landscape orientation support for mobile devices

> **📱 Mobile-First Implementation Guide**: For complete mobile patterns, navigation components, swipe gestures, form optimizations, and performance strategies, see [MOBILE_FIRST_DESIGN_PATTERNS.md](./MOBILE_FIRST_DESIGN_PATTERNS.md)

## Component Library

### Button System

**Status**: ✅ **Stable** - Production-ready

Comprehensive button variants for all use cases:

#### Variants

- **Primary**: Main actions, high emphasis
- **Secondary**: Supporting actions, medium emphasis
- **Tertiary**: Low emphasis actions
- **Ghost**: Minimal visual weight

#### Sizes

- **XS**: 28px height, compact spaces
- **SM**: 36px height, dense layouts
- **MD**: 44px height, standard size
- **LG**: 52px height, prominent actions
- **XL**: 60px height, hero sections

#### States

- **Default**: Base appearance
- **Hover**: Visual feedback on interaction
- **Active**: Pressed state
- **Focus**: Keyboard navigation indicator
- **Disabled**: Non-interactive state

#### Component API

| Property        | Type      | Default  | Required | Description                                  |
| --------------- | --------- | -------- | -------- | -------------------------------------------- |
| `btn-primary`   | class     | -        | No       | Primary button variant (high emphasis)       |
| `btn-secondary` | class     | -        | No       | Secondary button variant (medium emphasis)   |
| `btn-tertiary`  | class     | -        | No       | Tertiary button variant (low emphasis)       |
| `btn-ghost`     | class     | -        | No       | Ghost button variant (minimal visual weight) |
| `btn-xs`        | class     | -        | No       | Extra small size (28px height)               |
| `btn-sm`        | class     | -        | No       | Small size (36px height)                     |
| `btn-md`        | class     | `btn-md` | No       | Medium size (44px height)                    |
| `btn-lg`        | class     | -        | No       | Large size (52px height)                     |
| `btn-xl`        | class     | -        | No       | Extra large size (60px height)               |
| `disabled`      | attribute | false    | No       | Disables button interaction                  |

#### Usage Examples

```html
<!-- Primary action button -->
<button class="btn btn-primary btn-md">Start Training</button>

<!-- Secondary action -->
<button class="btn btn-secondary btn-md">View Stats</button>

<!-- Tertiary action -->
<button class="btn btn-tertiary btn-sm">Learn More</button>

<!-- Disabled button -->
<button class="btn btn-primary btn-md" disabled>Cannot Click</button>

<!-- Button with icon -->
<button class="btn btn-primary btn-md">
  <i data-lucide="play" style="width: 16px; height: 16px;"></i>
  Start Training
</button>
```

#### Do's and Don'ts

✅ **Do:**

- Use primary buttons for the main action on a page
- Use secondary buttons for supporting actions
- Use consistent button sizes within a group
- Include icons for clarity when appropriate

❌ **Don't:**

- Use multiple primary buttons on the same page
- Use buttons for navigation (use links instead)
- Make buttons too small for touch targets (< 44px)
- Disable buttons without explaining why

### Form Components

**Status**: ✅ **Stable** - Production-ready

Complete form system with validation states:

#### Component API

| Property        | Type      | Default | Required | Description              |
| --------------- | --------- | ------- | -------- | ------------------------ |
| `form-group`    | class     | -       | Yes      | Container for form field |
| `form-label`    | class     | -       | Yes      | Label for form input     |
| `form-input`    | class     | -       | Yes      | Text input field         |
| `form-select`   | class     | -       | No       | Select dropdown          |
| `form-textarea` | class     | -       | No       | Textarea field           |
| `required`      | class     | -       | No       | Marks field as required  |
| `error`         | class     | -       | No       | Error state styling      |
| `success`       | class     | -       | No       | Success state styling    |
| `disabled`      | attribute | false   | No       | Disables input           |

#### Input Types

- Text inputs with validation states
- Select dropdowns with custom styling
- Textareas with resize controls
- Checkboxes and radio buttons
- Toggle switches

#### Validation States

- **Default**: Neutral state
- **Focus**: Active interaction
- **Error**: Invalid input with red indicators
- **Success**: Valid input with green indicators
- **Disabled**: Non-interactive state

#### Basic Form Example

```html
<!-- Form group with error state -->
<div class="form-group">
  <label class="form-label required" for="email">Email Address</label>
  <input
    type="email"
    id="email"
    class="form-input error"
    value="invalid-email"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <div class="form-error" id="email-error">
    Please enter a valid email address
  </div>
</div>

<!-- Form group with success state -->
<div class="form-group">
  <label class="form-label required" for="name">Full Name</label>
  <input
    type="text"
    id="name"
    class="form-input success"
    value="John Smith"
    aria-invalid="false"
  />
  <div class="form-success">✓ Valid</div>
</div>
```

#### Date/Time Picker

**Status**: ⏳ **Preview** - Feature-complete, may have minor changes

```html
<!-- Date Picker -->
<div class="form-group">
  <label class="form-label required" for="training-date">Training Date</label>
  <input
    type="date"
    id="training-date"
    class="form-input form-date"
    min="2025-01-01"
    required
  />
  <div class="form-hint">Select a future date for training session</div>
</div>

<!-- Time Picker -->
<div class="form-group">
  <label class="form-label required" for="training-time">Training Time</label>
  <input type="time" id="training-time" class="form-input form-time" required />
</div>

<!-- DateTime Picker (Combined) -->
<div class="form-group">
  <label class="form-label required" for="session-datetime"
    >Session Date & Time</label
  >
  <input
    type="datetime-local"
    id="session-datetime"
    class="form-input form-datetime"
    required
  />
</div>
```

**JavaScript Implementation:**

```javascript
// Date validation example
const dateInput = document.getElementById("training-date");
dateInput.addEventListener("change", (e) => {
  const selectedDate = new Date(e.target.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    showFieldError(dateInput, "Training date cannot be in the past");
  } else {
    clearFieldError(dateInput);
  }
});
```

#### Dropdown with Search

**Status**: ⏳ **Preview** - Feature-complete, may have minor changes

```html
<div class="form-group">
  <label class="form-label required" for="athlete-select">Select Athlete</label>
  <div class="select-wrapper">
    <input
      type="text"
      class="form-input form-select-search"
      id="athlete-search"
      placeholder="Search athletes..."
      autocomplete="off"
    />
    <select
      id="athlete-select"
      class="form-select"
      size="5"
      style="display: none;"
    >
      <option value="">-- Select an athlete --</option>
      <option value="1">John Smith</option>
      <option value="2">Sarah Johnson</option>
      <option value="3">Mike Davis</option>
      <!-- More options -->
    </select>
    <div
      class="select-dropdown"
      id="athlete-dropdown"
      role="listbox"
      aria-label="Athlete selection"
    >
      <!-- Populated dynamically -->
    </div>
  </div>
</div>
```

**JavaScript Implementation:**

```javascript
class SearchableSelect {
  constructor(inputId, selectId) {
    this.input = document.getElementById(inputId);
    this.select = document.getElementById(selectId);
    this.dropdown = document.getElementById(
      inputId.replace("-search", "-dropdown"),
    );
    this.options = Array.from(this.select.options);
    this.filteredOptions = this.options;

    this.init();
  }

  init() {
    this.input.addEventListener("input", (e) => this.filter(e.target.value));
    this.input.addEventListener("focus", () => this.showDropdown());
    this.input.addEventListener("blur", () =>
      setTimeout(() => this.hideDropdown(), 200),
    );

    this.renderDropdown();
  }

  filter(query) {
    const lowerQuery = query.toLowerCase();
    this.filteredOptions = this.options.filter((opt) =>
      opt.text.toLowerCase().includes(lowerQuery),
    );
    this.renderDropdown();
  }

  renderDropdown() {
    this.dropdown.innerHTML = this.filteredOptions
      .map(
        (opt) => `
        <div class="select-option" 
             role="option" 
             data-value="${opt.value}"
             tabindex="0">
          ${opt.text}
        </div>
      `,
      )
      .join("");

    // Add click handlers
    this.dropdown.querySelectorAll(".select-option").forEach((option) => {
      option.addEventListener("click", () =>
        this.selectOption(option.dataset.value),
      );
      option.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.selectOption(option.dataset.value);
        }
      });
    });
  }

  selectOption(value) {
    const option = this.options.find((opt) => opt.value === value);
    if (option) {
      this.input.value = option.text;
      this.select.value = value;
      this.hideDropdown();
      this.input.dispatchEvent(new Event("change"));
    }
  }

  showDropdown() {
    this.dropdown.style.display = "block";
  }

  hideDropdown() {
    this.dropdown.style.display = "none";
  }
}

// Initialize
new SearchableSelect("athlete-search", "athlete-select");
```

#### Multiselect Component

**Status**: ⏳ **Preview** - Feature-complete, may have minor changes

```html
<div class="form-group">
  <label class="form-label required" for="athletes-multiselect"
    >Select Athletes</label
  >
  <div class="multiselect-wrapper">
    <div
      class="multiselect-input"
      id="athletes-multiselect"
      role="combobox"
      aria-expanded="false"
      aria-haspopup="listbox"
      tabindex="0"
    >
      <div class="multiselect-tags">
        <!-- Selected tags appear here -->
      </div>
      <input
        type="text"
        class="multiselect-search"
        placeholder="Search athletes..."
        autocomplete="off"
      />
    </div>
    <div
      class="multiselect-dropdown"
      role="listbox"
      aria-label="Athlete selection"
    >
      <!-- Options appear here -->
    </div>
  </div>
</div>
```

#### File Upload

**Status**: ⏳ **Preview** - Feature-complete, may have minor changes

```html
<div class="form-group">
  <label class="form-label" for="video-upload">Upload Training Video</label>
  <div class="file-upload-wrapper">
    <input
      type="file"
      id="video-upload"
      class="file-input"
      accept="video/*"
      multiple
    />
    <label for="video-upload" class="file-upload-label">
      <i data-lucide="upload" style="width: 24px; height: 24px;"></i>
      <span>Choose files or drag and drop</span>
      <span class="file-upload-hint">MP4, MOV up to 100MB</span>
    </label>
    <div class="file-upload-list">
      <!-- Uploaded files appear here -->
    </div>
  </div>
</div>
```

**JavaScript Implementation:**

```javascript
const fileInput = document.getElementById("video-upload");
const fileList = document.querySelector(".file-upload-list");

fileInput.addEventListener("change", (e) => {
  Array.from(e.target.files).forEach((file) => {
    const fileItem = createFileItem(file);
    fileList.appendChild(fileItem);
    uploadFile(file, fileItem);
  });
});

function createFileItem(file) {
  const item = document.createElement("div");
  item.className = "file-item";
  item.innerHTML = `
    <div class="file-info">
      <i data-lucide="file-video"></i>
      <span class="file-name">${file.name}</span>
      <span class="file-size">${formatFileSize(file.size)}</span>
    </div>
    <div class="file-progress">
      <div class="file-progress-bar" style="width: 0%"></div>
    </div>
    <button class="file-remove" aria-label="Remove file">
      <i data-lucide="x"></i>
    </button>
  `;
  return item;
}

function uploadFile(file, item) {
  const formData = new FormData();
  formData.append("video", file);

  const xhr = new XMLHttpRequest();
  const progressBar = item.querySelector(".file-progress-bar");

  xhr.upload.addEventListener("progress", (e) => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      progressBar.style.width = `${percent}%`;
    }
  });

  xhr.addEventListener("load", () => {
    item.classList.add("file-uploaded");
    progressBar.style.width = "100%";
  });

  xhr.addEventListener("error", () => {
    item.classList.add("file-error");
    showToast.error("Failed to upload file");
  });

  xhr.open("POST", "/api/upload");
  xhr.send(formData);
}
```

### Card System

Flexible container component with multiple variants:

```html
<!-- Basic card -->
<div class="card">
  <div class="card-header">
    <h3>Performance Summary</h3>
  </div>
  <div class="card-body">
    <p>Your training metrics for this week.</p>
  </div>
</div>

<!-- Elevated card with hover effect -->
<div class="card card-elevated">
  <!-- Card content -->
</div>
```

### Badge System

Status indicators and labels:

```html
<!-- Status badges -->
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-error">Failed</span>
```

### Modal System

**Status**: ✅ **Stable** - Production-ready

Accessible dialog components for confirmations, forms, and content display.

#### Component API

| Property        | Type      | Default | Required | Description                   |
| --------------- | --------- | ------- | -------- | ----------------------------- |
| `modal-overlay` | class     | -       | Yes      | Modal backdrop/overlay        |
| `modal-content` | class     | -       | Yes      | Modal dialog container        |
| `modal-header`  | class     | -       | No       | Modal header section          |
| `modal-body`    | class     | -       | No       | Modal body content            |
| `modal-footer`  | class     | -       | No       | Modal footer actions          |
| `modal-open`    | class     | -       | No       | Applied when modal is visible |
| `data-modal`    | attribute | -       | No       | Modal identifier              |

#### HTML Structure

```html
<div
  class="modal-overlay"
  id="confirm-modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-hidden="true"
>
  <div class="modal-content">
    <div class="modal-header">
      <h2 id="modal-title">Confirm Action</h2>
      <button class="modal-close" aria-label="Close modal">
        <i data-lucide="x" style="width: 20px; height: 20px;"></i>
      </button>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to delete this training session?</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-error">Delete</button>
    </div>
  </div>
</div>
```

#### JavaScript Implementation

```javascript
class Modal {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    this.overlay = this.modal;
    this.content = this.modal.querySelector(".modal-content");
    this.closeButtons = this.modal.querySelectorAll(
      ".modal-close, [data-modal-close]",
    );
    this.previouslyFocused = null;
    this.focusableElements = null;

    this.init();
  }

  init() {
    // Close button handlers
    this.closeButtons.forEach((btn) => {
      btn.addEventListener("click", () => this.close());
    });

    // Overlay click handler
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Escape key handler
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen()) {
        this.close();
      }
    });

    // Trap focus within modal
    this.content.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        this.trapFocus(e);
      }
    });
  }

  open() {
    this.modal.classList.add("modal-open");
    this.modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Store previously focused element
    this.previouslyFocused = document.activeElement;

    // Get focusable elements
    this.focusableElements = this.getFocusableElements();

    // Focus first element
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
  }

  close() {
    this.modal.classList.remove("modal-open");
    this.modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    // Return focus to previously focused element
    if (this.previouslyFocused) {
      this.previouslyFocused.focus();
    }
  }

  isOpen() {
    return this.modal.classList.contains("modal-open");
  }

  getFocusableElements() {
    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(this.content.querySelectorAll(selector)).filter(
      (el) => !el.disabled && el.offsetParent !== null,
    );
  }

  trapFocus(e) {
    const firstElement = this.focusableElements[0];
    const lastElement =
      this.focusableElements[this.focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
}

// Convenience functions
window.openModal = (modalId) => {
  const modal = new Modal(modalId);
  modal.open();
  return modal;
};

window.closeModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    const modalInstance = new Modal(modalId);
    modalInstance.close();
  }
};

// Usage:
// openModal('confirm-modal');
// closeModal('confirm-modal');
```

#### CSS Styles

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.3s,
    visibility 0.3s;
}

.modal-overlay.modal-open {
  opacity: 1;
  visibility: visible;
}

.modal-content {
  background: var(--surface-primary);
  border-radius: var(--radius-component-lg);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  transform: scale(0.95);
  transition: transform 0.3s;
}

.modal-overlay.modal-open .modal-content {
  transform: scale(1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border-secondary);
}

.modal-body {
  padding: var(--space-6);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-6);
  border-top: 1px solid var(--color-border-secondary);
}

.modal-close {
  background: none;
  border: none;
  padding: var(--space-2);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.modal-close:hover {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .modal-overlay,
  .modal-content {
    transition: none;
  }
}
```

### Toast Notifications

**Status**: ✅ **Stable** - Production-ready

Temporary notifications for user feedback. Positioned bottom-right by default.

#### Component API

| Property        | Type      | Default | Required | Description                                       |
| --------------- | --------- | ------- | -------- | ------------------------------------------------- |
| `toast-success` | class     | -       | No       | Success toast variant (green)                     |
| `toast-error`   | class     | -       | No       | Error toast variant (red)                         |
| `toast-warning` | class     | -       | No       | Warning toast variant (amber)                     |
| `toast-info`    | class     | -       | No       | Info toast variant (blue/gray)                    |
| `role`          | attribute | -       | Yes      | `status` for success/info, `alert` for errors     |
| `aria-live`     | attribute | -       | Yes      | `polite` for success/info, `assertive` for errors |

#### HTML Structure

```html
<!-- Success Toast -->
<div class="toast toast-success" role="status" aria-live="polite">
  <div class="toast-content">
    <i data-lucide="check-circle" style="width: 20px; height: 20px;"></i>
    <span>Training session saved successfully</span>
  </div>
  <button class="toast-close" aria-label="Close notification">
    <i data-lucide="x" style="width: 16px; height: 16px;"></i>
  </button>
</div>

<!-- Error Toast -->
<div class="toast toast-error" role="alert" aria-live="assertive">
  <div class="toast-content">
    <i data-lucide="alert-circle" style="width: 20px; height: 20px;"></i>
    <span>Failed to save changes. Please try again.</span>
  </div>
  <button class="toast-close" aria-label="Close notification">
    <i data-lucide="x" style="width: 16px; height: 16px;"></i>
  </button>
</div>

<!-- Toast with Action Button -->
<div class="toast toast-success" role="status" aria-live="polite">
  <div class="toast-content">
    <i data-lucide="check-circle" style="width: 20px; height: 20px;"></i>
    <span>Session deleted</span>
  </div>
  <button class="toast-action">Undo</button>
  <button class="toast-close" aria-label="Close notification">
    <i data-lucide="x" style="width: 16px; height: 16px;"></i>
  </button>
</div>
```

#### JavaScript Implementation

```javascript
/**
 * Toast Notification Manager
 * Handles showing, hiding, and managing toast notifications
 */

class ToastManager {
  constructor() {
    this.container = this.createContainer();
    this.toasts = new Map();
  }

  createContainer() {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      container.setAttribute("aria-live", "polite");
      container.setAttribute("aria-atomic", "true");
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = "info", duration = null, action = null) {
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast = this.createToast(toastId, message, type, action);

    this.container.appendChild(toast);
    this.toasts.set(toastId, toast);

    // Auto-dismiss logic
    if (duration !== null) {
      const autoDismiss = duration || this.getDefaultDuration(type);
      setTimeout(() => this.hide(toastId), autoDismiss);
    }

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add("toast-visible");
    });

    return toastId;
  }

  createToast(id, message, type, action) {
    const toast = document.createElement("div");
    toast.id = id;
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.setAttribute("aria-live", type === "error" ? "assertive" : "polite");

    const icons = {
      success: "check-circle",
      error: "alert-circle",
      warning: "alert-triangle",
      info: "info",
    };

    toast.innerHTML = `
      <div class="toast-content">
        <i data-lucide="${icons[type]}" style="width: 20px; height: 20px;"></i>
        <span>${message}</span>
      </div>
      ${action ? `<button class="toast-action">${action.label}</button>` : ""}
      <button class="toast-close" aria-label="Close notification">
        <i data-lucide="x" style="width: 16px; height: 16px;"></i>
      </button>
    `;

    // Initialize Lucide icons
    if (window.lucide) {
      lucide.createIcons();
    }

    // Close button handler
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => this.hide(id));

    // Action button handler
    if (action) {
      const actionBtn = toast.querySelector(".toast-action");
      actionBtn.addEventListener("click", () => {
        if (action.callback) action.callback();
        this.hide(id);
      });
    }

    // Keyboard dismiss (Escape key)
    toast.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hide(id);
      }
    });

    return toast;
  }

  hide(toastId) {
    const toast = this.toasts.get(toastId);
    if (!toast) return;

    toast.classList.remove("toast-visible");
    toast.classList.add("toast-hiding");

    setTimeout(() => {
      toast.remove();
      this.toasts.delete(toastId);
    }, 300); // Match CSS transition duration
  }

  getDefaultDuration(type) {
    const durations = {
      success: 3000, // 3 seconds
      info: 4000, // 4 seconds
      warning: 7000, // 7 seconds
      error: 0, // Don't auto-dismiss errors
    };
    return durations[type] || 4000;
  }
}

// Initialize global toast manager
const toast = new ToastManager();

// Convenience functions
window.showToast = {
  success: (message, duration, action) =>
    toast.show(message, "success", duration, action),
  error: (message, duration, action) =>
    toast.show(message, "error", duration, action),
  warning: (message, duration, action) =>
    toast.show(message, "warning", duration, action),
  info: (message, duration, action) =>
    toast.show(message, "info", duration, action),
};

// Usage examples:
// showToast.success('Training session saved successfully');
// showToast.error('Failed to save changes', null, { label: 'Retry', callback: () => retrySave() });
// showToast.warning('Session will expire in 5 minutes', 7000);
```

#### CSS Styles

```css
.toast-container {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 400px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background: var(--surface-primary);
  border-radius: var(--radius-component-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border-secondary);
  pointer-events: auto;
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-visible {
  opacity: 1;
  transform: translateX(0);
}

.toast-hiding {
  opacity: 0;
  transform: translateX(100%);
}

.toast-success {
  border-left: 4px solid var(--color-status-success);
}

.toast-error {
  border-left: 4px solid var(--color-status-error);
}

.toast-warning {
  border-left: 4px solid var(--color-status-warning);
}

.toast-info {
  border-left: 4px solid var(--color-status-info);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
}

.toast-close {
  background: none;
  border: none;
  padding: var(--space-1);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
}

.toast-action {
  background: none;
  border: none;
  color: var(--color-brand-primary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  padding: var(--space-2);
}

@media (prefers-reduced-motion: reduce) {
  .toast {
    transition: opacity 0.01ms;
  }
}

@media (max-width: 768px) {
  .toast-container {
    bottom: var(--space-4);
    right: var(--space-4);
    left: var(--space-4);
    max-width: none;
  }
}
```

#### Properties

- **Position**: Bottom-right (default), top-right, bottom-left, top-left
- **Duration**: 3-5 seconds (success), 7-10 seconds (error), persistent (warning)
- **Types**: `toast-success`, `toast-error`, `toast-warning`, `toast-info`
- **Dismissible**: Auto-dismiss or manual close with × button
- **Action Button**: Optional action button (Undo, View Details)

#### Accessibility

- `role="status"` for success/info, `role="alert"` for errors
- Respects `prefers-reduced-motion` (no slide animations)
- Keyboard dismissible with Escape key
- Error messages don't auto-dismiss (user needs time to read)

#### Do's and Don'ts

✅ **Do:**

- Use toasts for non-critical feedback (saves, updates, deletions)
- Keep messages concise (one sentence)
- Use appropriate duration (errors longer than success)
- Provide action buttons for undoable actions

❌ **Don't:**

- Use toasts for critical errors (use alert banners instead)
- Stack too many toasts (max 3 visible)
- Use toasts for navigation or primary actions
- Auto-dismiss error messages

### Skeleton Screens

Loading placeholders that show content structure while data loads.

```html
<!-- Card Skeleton -->
<div class="skeleton-card">
  <div class="skeleton-header">
    <div class="skeleton-avatar"></div>
    <div class="skeleton-text-group">
      <div class="skeleton-line skeleton-line-title"></div>
      <div class="skeleton-line skeleton-line-subtitle"></div>
    </div>
  </div>
  <div class="skeleton-body">
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line skeleton-line-short"></div>
  </div>
</div>

<!-- Table Skeleton -->
<div class="skeleton-table">
  <div class="skeleton-row">
    <div class="skeleton-cell"></div>
    <div class="skeleton-cell"></div>
    <div class="skeleton-cell"></div>
  </div>
  <div class="skeleton-row">
    <div class="skeleton-cell"></div>
    <div class="skeleton-cell"></div>
    <div class="skeleton-cell"></div>
  </div>
</div>
```

**Guidelines:**

- ✅ Use for container components: cards, tables, lists, grids
- ❌ Don't use for action components: buttons, inputs, modals
- ✅ Match final layout dimensions to avoid Cumulative Layout Shift (CLS)
- ✅ Animate shimmer left-to-right on mobile (omit on desktop if load < 2.5s)
- ✅ Fade smoothly to actual content when loaded

**CSS:**

```css
.skeleton-card {
  background: var(--surface-secondary);
  border-radius: var(--radius-component-lg);
  padding: var(--space-6);
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-card {
    animation: none;
  }
}
```

### Breadcrumbs

Hierarchical navigation showing current location.

```html
<nav aria-label="Breadcrumb" class="breadcrumb">
  <ol class="breadcrumb-list">
    <li class="breadcrumb-item">
      <a href="/dashboard">
        <i data-lucide="home" style="width: 16px; height: 16px;"></i>
        Dashboard
      </a>
    </li>
    <li class="breadcrumb-item">
      <a href="/roster">Roster</a>
    </li>
    <li class="breadcrumb-item">
      <a href="/roster/john-smith">John Smith</a>
    </li>
    <li class="breadcrumb-item breadcrumb-current" aria-current="page">
      Training History
    </li>
  </ol>
</nav>
```

**Usage:**

- Shows hierarchical location: Home > Roster > John Smith > Training History
- Reduces cognitive load and "where am I?" confusion
- Critical for navigation in complex training platform
- Last item is current page (not clickable)

### Pagination

Navigate large datasets (rosters, exercise libraries, training history).

```html
<nav aria-label="Pagination" class="pagination">
  <button
    class="pagination-btn pagination-prev"
    disabled
    aria-label="Previous page"
  >
    <i data-lucide="chevron-left" style="width: 16px; height: 16px;"></i>
    Previous
  </button>

  <div class="pagination-pages">
    <button
      class="pagination-page pagination-active"
      aria-label="Page 1, current page"
    >
      1
    </button>
    <button class="pagination-page" aria-label="Page 2">2</button>
    <button class="pagination-page" aria-label="Page 3">3</button>
    <span class="pagination-ellipsis">...</span>
    <button class="pagination-page" aria-label="Page 10">10</button>
  </div>

  <select class="pagination-select" aria-label="Items per page">
    <option value="10">10 per page</option>
    <option value="25">25 per page</option>
    <option value="50">50 per page</option>
  </select>

  <button class="pagination-btn pagination-next" aria-label="Next page">
    Next
    <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
  </button>
</nav>
```

**Features:**

- Items per page selector (10, 25, 50, 100)
- Page numbers with ellipsis for large ranges
- Previous/Next buttons
- Current page highlighted
- Mobile: Consider infinite scroll alternative

### Alert Banner

Persistent messages at top of page for system-wide information.

```html
<!-- Success Banner -->
<div class="alert-banner alert-success" role="alert">
  <div class="alert-content">
    <i data-lucide="check-circle" style="width: 20px; height: 20px;"></i>
    <div>
      <strong>Profile updated successfully</strong>
      <p>Your changes have been saved.</p>
    </div>
  </div>
  <button class="alert-dismiss" aria-label="Dismiss alert">
    <i data-lucide="x" style="width: 16px; height: 16px;"></i>
  </button>
</div>

<!-- Warning Banner (Sticky) -->
<div class="alert-banner alert-warning alert-sticky" role="alert">
  <div class="alert-content">
    <i data-lucide="alert-triangle" style="width: 20px; height: 20px;"></i>
    <div>
      <strong>System maintenance scheduled</strong>
      <p>Training data will be unavailable on January 15th from 2-4 AM EST.</p>
    </div>
  </div>
</div>
```

**Types:**

- `alert-success`: Success confirmations
- `alert-warning`: Important warnings
- `alert-error`: Critical errors
- `alert-info`: Informational messages
- `alert-sticky`: Non-dismissible (for critical announcements)

### Table/Data Grid

**Status**: ⏳ **Preview** - Feature-complete, may have minor changes

Sortable, filterable data table for displaying large datasets (rosters, performance metrics, training history).

#### Component API

| Property                | Type  | Default | Required | Description               |
| ----------------------- | ----- | ------- | -------- | ------------------------- |
| `data-table`            | class | -       | Yes      | Main table container      |
| `data-table-sortable`   | class | -       | No       | Enables column sorting    |
| `data-table-filterable` | class | -       | No       | Enables row filtering     |
| `data-table-selectable` | class | -       | No       | Enables row selection     |
| `sort-asc`              | class | -       | No       | Ascending sort indicator  |
| `sort-desc`             | class | -       | No       | Descending sort indicator |
| `row-selected`          | class | -       | No       | Selected row styling      |

#### HTML Structure

```html
<div class="data-table-wrapper">
  <!-- Search/Filter Bar -->
  <div class="data-table-toolbar">
    <input
      type="search"
      class="data-table-search"
      placeholder="Search athletes..."
      aria-label="Search table"
    />
    <div class="data-table-actions">
      <button class="btn btn-secondary btn-sm">Export</button>
      <button class="btn btn-primary btn-sm">Add Athlete</button>
    </div>
  </div>

  <!-- Table -->
  <div class="data-table-container">
    <table
      class="data-table data-table-sortable data-table-selectable"
      role="table"
    >
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              class="select-all"
              aria-label="Select all rows"
            />
          </th>
          <th class="sortable" data-sort="name">
            Name
            <i data-lucide="chevron-up" class="sort-icon"></i>
          </th>
          <th class="sortable" data-sort="position">
            Position
            <i data-lucide="chevron-up" class="sort-icon"></i>
          </th>
          <th class="sortable" data-sort="sessions">
            Sessions
            <i data-lucide="chevron-up" class="sort-icon"></i>
          </th>
          <th class="sortable" data-sort="performance">
            Performance
            <i data-lucide="chevron-up" class="sort-icon"></i>
          </th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr data-row-id="1">
          <td>
            <input type="checkbox" class="row-select" aria-label="Select row" />
          </td>
          <td>John Smith</td>
          <td>Quarterback</td>
          <td>24</td>
          <td>
            <div class="performance-badge performance-high">85%</div>
          </td>
          <td>
            <button class="btn-icon" aria-label="View details">
              <i data-lucide="eye"></i>
            </button>
            <button class="btn-icon" aria-label="Edit">
              <i data-lucide="edit"></i>
            </button>
          </td>
        </tr>
        <!-- More rows -->
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  <nav class="pagination" aria-label="Table pagination">
    <!-- Pagination component -->
  </nav>
</div>
```

#### JavaScript Implementation

```javascript
class DataTable {
  constructor(tableId, options = {}) {
    this.table = document.getElementById(tableId);
    this.tbody = this.table.querySelector("tbody");
    this.rows = Array.from(this.tbody.querySelectorAll("tr"));
    this.sortColumn = null;
    this.sortDirection = "asc";
    this.filteredRows = [...this.rows];

    this.init();
  }

  init() {
    // Sort functionality
    this.table.querySelectorAll(".sortable").forEach((header) => {
      header.addEventListener("click", () => this.sort(header.dataset.sort));
    });

    // Search functionality
    const searchInput = document.querySelector(".data-table-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => this.filter(e.target.value));
    }

    // Row selection
    this.table.querySelectorAll(".row-select").forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => this.toggleRow(e.target));
    });

    // Select all
    const selectAll = this.table.querySelector(".select-all");
    if (selectAll) {
      selectAll.addEventListener("change", (e) =>
        this.selectAllRows(e.target.checked),
      );
    }
  }

  sort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortColumn = column;
      this.sortDirection = "asc";
    }

    this.filteredRows.sort((a, b) => {
      const aValue = this.getCellValue(a, column);
      const bValue = this.getCellValue(b, column);

      if (this.sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.render();
    this.updateSortIndicators();
  }

  filter(query) {
    const lowerQuery = query.toLowerCase();
    this.filteredRows = this.rows.filter((row) => {
      const text = row.textContent.toLowerCase();
      return text.includes(lowerQuery);
    });
    this.render();
  }

  getCellValue(row, column) {
    const index = Array.from(this.table.querySelectorAll("th")).findIndex(
      (th) => th.dataset.sort === column,
    );
    return row.cells[index]?.textContent.trim() || "";
  }

  render() {
    this.tbody.innerHTML = "";
    this.filteredRows.forEach((row) => {
      this.tbody.appendChild(row.cloneNode(true));
    });

    // Re-attach event listeners
    this.table.querySelectorAll(".row-select").forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => this.toggleRow(e.target));
    });
  }

  toggleRow(checkbox) {
    const row = checkbox.closest("tr");
    if (checkbox.checked) {
      row.classList.add("row-selected");
    } else {
      row.classList.remove("row-selected");
    }
  }

  selectAllRows(checked) {
    this.table.querySelectorAll(".row-select").forEach((checkbox) => {
      checkbox.checked = checked;
      this.toggleRow(checkbox);
    });
  }

  updateSortIndicators() {
    this.table.querySelectorAll(".sortable").forEach((header) => {
      const icon = header.querySelector(".sort-icon");
      if (header.dataset.sort === this.sortColumn) {
        icon.setAttribute(
          "data-lucide",
          this.sortDirection === "asc" ? "chevron-up" : "chevron-down",
        );
        header.classList.add(`sort-${this.sortDirection}`);
      } else {
        icon.setAttribute("data-lucide", "chevron-up");
        header.classList.remove("sort-asc", "sort-desc");
      }
      if (window.lucide) lucide.createIcons();
    });
  }
}

// Initialize
new DataTable("athletes-table");
```

#### Responsive Behavior

```css
@media (max-width: 768px) {
  .data-table-container {
    overflow-x: auto;
  }

  .data-table {
    min-width: 600px;
  }

  /* Stack table cells on mobile */
  .data-table tbody tr {
    display: block;
    border-bottom: 2px solid var(--color-border-secondary);
    margin-bottom: var(--space-4);
  }

  .data-table tbody td {
    display: flex;
    justify-content: space-between;
    padding: var(--space-2) var(--space-4);
    border: none;
  }

  .data-table tbody td::before {
    content: attr(data-label);
    font-weight: var(--font-weight-semibold);
  }
}
```

## Data Visualization Guidelines

**Status**: ✅ **Stable** - Production-ready

Comprehensive guidelines for displaying performance data, training metrics, and analytics in charts and graphs.

> **📘 Detailed Implementation Guide**: For complete HTML/CSS/JavaScript examples, component implementations, and best practices, see [DATA_VISUALIZATION_IMPLEMENTATION_GUIDE.md](./DATA_VISUALIZATION_IMPLEMENTATION_GUIDE.md)

### Chart Type Selection Guide

#### When to Use Each Chart Type

| Chart Type             | Use Case                    | Example                                           |
| ---------------------- | --------------------------- | ------------------------------------------------- |
| **Line Chart**         | Progress over time          | Strength gains over 12 weeks, speed improvements  |
| **Bar Chart**          | Comparing categories        | Performance across athletes, exercise comparisons |
| **Radar/Spider Chart** | Multidimensional assessment | Speed, strength, agility, endurance profile       |
| **Heat Map**           | Intensity patterns          | Training intensity over weeks/months              |
| **Gauge Chart**        | Goal progress               | Percentage to goal, completion rate               |
| **Area Chart**         | Cumulative data             | Total training hours over time                    |
| **Scatter Plot**       | Correlation analysis        | Relationship between two metrics                  |

### Color Palette for Data Visualization

```css
:root {
  /* Primary Data Colors - Green Theme */
  --chart-primary: #10c96b; /* Main metric */
  --chart-secondary: #89c300; /* Secondary metric */
  --chart-tertiary: #cc9610; /* Tertiary metric */

  /* Extended Palette (8 colors for multiple series) */
  --chart-color-1: #10c96b; /* Primary green */
  --chart-color-2: #89c300; /* Lime green */
  --chart-color-3: #cc9610; /* Gold */
  --chart-color-4: #0ea5e9; /* Blue */
  --chart-color-5: #8b5cf6; /* Purple */
  --chart-color-6: #f59e0b; /* Amber */
  --chart-color-7: #ef4444; /* Red */
  --chart-color-8: #64748b; /* Slate */

  /* Semantic Colors */
  --chart-success: #22c55e; /* Positive metrics */
  --chart-warning: #f59e0b; /* Caution metrics */
  --chart-error: #ef4444; /* Negative metrics */
  --chart-info: #0ea5e9; /* Informational metrics */

  /* Background Colors */
  --chart-bg-primary: var(--surface-primary);
  --chart-bg-secondary: var(--surface-secondary);
  --chart-grid: var(--color-border-secondary);
  --chart-text: var(--color-text-primary);
  --chart-text-secondary: var(--color-text-secondary);
}
```

**Accessibility Notes:**

- All colors meet WCAG AA contrast ratios (4.5:1 minimum)
- Colorblind-friendly palette (tested with Color Oracle)
- Patterns/textures available as alternative to color differentiation

### Chart Anatomy Specifications

#### Standard Chart Structure

```html
<div class="chart-card">
  <div class="chart-header">
    <h3 class="chart-title">Performance Over Time</h3>
    <div class="chart-actions">
      <button class="btn-icon" aria-label="Download chart">
        <i data-lucide="download"></i>
      </button>
      <button class="btn-icon" aria-label="Full screen">
        <i data-lucide="maximize"></i>
      </button>
    </div>
  </div>
  <div class="chart-body">
    <canvas
      id="performance-chart"
      role="img"
      aria-label="Performance chart showing improvement over 12 weeks"
    ></canvas>
    <!-- Alternative: Data table for screen readers -->
    <table class="chart-data-table sr-only" aria-label="Chart data">
      <thead>
        <tr>
          <th>Week</th>
          <th>Performance Score</th>
        </tr>
      </thead>
      <tbody>
        <!-- Data rows -->
      </tbody>
    </table>
  </div>
  <div class="chart-footer">
    <div class="chart-legend">
      <div class="legend-item">
        <span
          class="legend-color"
          style="background: var(--chart-primary);"
        ></span>
        <span class="legend-label">Training Sessions</span>
      </div>
    </div>
    <div class="chart-notes">
      <span class="text-caption">Data updated 2 hours ago</span>
    </div>
  </div>
</div>
```

#### Chart.js Integration Example

```javascript
// Line Chart - Performance Over Time
const ctx = document.getElementById("performance-chart").getContext("2d");
const performanceChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
    datasets: [
      {
        label: "Performance Score",
        data: [65, 68, 72, 75, 78, 82],
        borderColor: "var(--chart-primary)",
        backgroundColor: "rgba(16, 201, 107, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
      },
      tooltip: {
        backgroundColor: "var(--surface-primary)",
        titleColor: "var(--chart-text)",
        bodyColor: "var(--chart-text-secondary)",
        borderColor: "var(--chart-grid)",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: "var(--chart-grid)",
        },
        ticks: {
          color: "var(--chart-text-secondary)",
        },
      },
      x: {
        grid: {
          color: "var(--chart-grid)",
        },
        ticks: {
          color: "var(--chart-text-secondary)",
        },
      },
    },
  },
});
```

### Responsive Chart Behavior

```css
.chart-body {
  position: relative;
  height: 300px; /* Desktop */
}

@media (max-width: 768px) {
  .chart-body {
    height: 250px; /* Mobile - slightly shorter */
  }

  .chart-legend {
    flex-direction: column;
    gap: var(--space-2);
  }
}

@media (max-width: 480px) {
  .chart-body {
    height: 200px; /* Small mobile */
  }

  .chart-title {
    font-size: var(--font-size-lg);
  }
}
```

### Accessibility Guidelines

#### Screen Reader Support

- Provide data table alternative for all charts
- Use `role="img"` with descriptive `aria-label` on canvas
- Include chart title and description in accessible text
- Announce data updates with `aria-live` regions

#### Keyboard Navigation

- Make interactive charts keyboard navigable
- Provide keyboard shortcuts for zoom/pan
- Ensure focus indicators are visible

#### Color Independence

- Never rely solely on color to convey meaning
- Use patterns, textures, or labels as alternatives
- Test with colorblind simulation tools

### Chart Examples

#### Line Chart - Training Progress

```javascript
// Shows improvement over time
// Best for: Weekly/monthly progress tracking
```

#### Bar Chart - Athlete Comparison

```javascript
// Compares performance across athletes
// Best for: Ranking, comparisons
```

#### Radar Chart - Multidimensional Assessment

```javascript
// Shows athlete profile across multiple dimensions
// Best for: Comprehensive athlete evaluation
```

#### Heat Map - Training Intensity

```javascript
// Shows intensity patterns over time
// Best for: Identifying training patterns, rest periods
```

### Sports-Specific Chart Templates

**Status**: ✅ **New** - Production-ready templates for athletic applications

Pre-configured Chart.js templates optimized for sports performance tracking and analysis.

#### 1. Performance Trend Chart

Tracks speed, strength, or other metrics over time with comparison to team average.

```javascript
/**
 * Performance Trend Chart - Speed/Strength Over Time
 * Shows individual athlete performance vs team average
 */
function createPerformanceTrendChart(canvasId, athleteData, teamAverageData) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  return new Chart(ctx, {
    type: "line",
    data: {
      labels: athleteData.labels, // ["Week 1", "Week 2", ...]
      datasets: [
        {
          label: "Athlete Performance",
          data: athleteData.values, // [4.2, 4.1, 4.0, 3.9, ...]
          borderColor: "var(--chart-primary)",
          backgroundColor: "rgba(16, 201, 107, 0.1)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Team Average",
          data: teamAverageData.values,
          borderColor: "var(--chart-secondary)",
          backgroundColor: "rgba(137, 195, 0, 0.1)",
          borderDash: [5, 5],
          tension: 0.4,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 15,
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.y}s`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          reverse: true, // Lower times = better for speed metrics
          title: {
            display: true,
            text: "Time (seconds)",
          },
          grid: {
            color: "var(--chart-grid)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Time Period",
          },
          grid: {
            display: false,
          },
        },
      },
    },
  });
}
```

**Usage Example:**

```html
<div class="chart-card">
  <div class="chart-header">
    <h3>40-Yard Dash Progress</h3>
  </div>
  <div class="chart-body">
    <canvas id="speed-trend-chart" role="img" aria-label="Speed improvement chart showing athlete vs team average"></canvas>
  </div>
</div>

<script>
const athleteData = {
  labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
  values: [4.5, 4.4, 4.3, 4.2, 4.1, 4.0],
};

const teamAverageData = {
  values: [4.6, 4.6, 4.5, 4.5, 4.4, 4.4],
};

createPerformanceTrendChart("speed-trend-chart", athleteData, teamAverageData);
</script>
```

#### 2. Athlete Comparison Chart

Compares multiple athletes across key performance metrics.

```javascript
/**
 * Athlete Comparison Chart - Bar Chart
 * Compares performance across multiple athletes
 */
function createAthleteComparisonChart(canvasId, athletes, metric) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  const colors = [
    "var(--chart-color-1)",
    "var(--chart-color-2)",
    "var(--chart-color-3)",
    "var(--chart-color-4)",
    "var(--chart-color-5)",
  ];

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: athletes.map((a) => a.name),
      datasets: [
        {
          label: metric.label,
          data: athletes.map((a) => a[metric.key]),
          backgroundColor: athletes.map((_, i) => colors[i % colors.length]),
          borderColor: athletes.map((_, i) => colors[i % colors.length]),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${metric.label}: ${context.parsed.y}${metric.unit || ""}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: metric.label,
          },
          grid: {
            color: "var(--chart-grid)",
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  });
}
```

**Usage Example:**

```javascript
const athletes = [
  { name: "Alex Johnson", speed: 4.2, strength: 85, agility: 78 },
  { name: "Sam Williams", speed: 4.4, strength: 90, agility: 82 },
  { name: "Jordan Davis", speed: 4.1, strength: 88, agility: 85 },
];

createAthleteComparisonChart("athlete-comparison", athletes, {
  key: "speed",
  label: "40-Yard Dash Time",
  unit: "s",
});
```

#### 3. Progress Tracking Chart

Shows goal completion, streaks, and milestone achievements.

```javascript
/**
 * Progress Tracking Chart - Goal Completion
 * Shows progress toward goals with milestone markers
 */
function createProgressTrackingChart(canvasId, progressData, goalValue) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  const currentValue = progressData.current;
  const percentage = (currentValue / goalValue) * 100;

  return new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Completed", "Remaining"],
      datasets: [
        {
          data: [currentValue, Math.max(0, goalValue - currentValue)],
          backgroundColor: [
            percentage >= 100 ? "var(--chart-success)" : "var(--chart-primary)",
            "var(--chart-grid)",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "75%",
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percent = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value} (${percent}%)`;
            },
          },
        },
      },
    },
    plugins: [
      {
        id: "centerText",
        beforeDraw: function (chart) {
          const ctx = chart.ctx;
          const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
          const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;

          ctx.save();
          ctx.font = "bold 24px var(--font-family-base)";
          ctx.fillStyle = "var(--chart-text)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${percentage.toFixed(0)}%`, centerX, centerY - 10);

          ctx.font = "14px var(--font-family-base)";
          ctx.fillStyle = "var(--chart-text-secondary)";
          ctx.fillText(`${currentValue}/${goalValue}`, centerX, centerY + 15);
          ctx.restore();
        },
      },
    ],
  });
}
```

**Usage Example:**

```html
<div class="chart-card">
  <div class="chart-header">
    <h3>Training Sessions Goal</h3>
    <span class="text-caption">Target: 30 sessions this month</span>
  </div>
  <div class="chart-body">
    <canvas id="progress-chart"></canvas>
  </div>
</div>

<script>
createProgressTrackingChart("progress-chart", { current: 24 }, 30);
</script>
```

#### 4. Training Intensity Heat Map

Visualizes training intensity patterns over weeks/months.

```javascript
/**
 * Training Intensity Heat Map
 * Shows intensity patterns using color gradients
 */
function createTrainingHeatMap(canvasId, intensityData) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  
  // Prepare data for heat map visualization
  const weeks = intensityData.weeks; // ["Week 1", "Week 2", ...]
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Create matrix data (weeks x days)
  const matrixData = weeks.map((week, weekIndex) => {
    return days.map((day, dayIndex) => {
      return intensityData.data[weekIndex * 7 + dayIndex] || 0;
    });
  });

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: weeks,
      datasets: days.map((day, dayIndex) => ({
        label: day,
        data: matrixData.map((week) => week[dayIndex]),
        backgroundColor: (context) => {
          const value = context.parsed.y;
          if (value >= 8) return "var(--chart-error)"; // High intensity
          if (value >= 5) return "var(--chart-warning)"; // Medium intensity
          if (value >= 2) return "var(--chart-info)"; // Low intensity
          return "var(--chart-grid)"; // Rest
        },
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Intensity: ${context.parsed.y}/10`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false,
          },
        },
        y: {
          stacked: true,
          max: 10,
          title: {
            display: true,
            text: "Intensity Level",
          },
          grid: {
            color: "var(--chart-grid)",
          },
        },
      },
    },
  });
}
```

**Usage Example:**

```javascript
const intensityData = {
  weeks: ["Week 1", "Week 2", "Week 3", "Week 4"],
  data: [
    // Week 1 (7 days)
    5, 7, 6, 8, 4, 3, 2,
    // Week 2
    6, 8, 7, 9, 5, 4, 2,
    // Week 3
    7, 9, 8, 9, 6, 5, 2,
    // Week 4 (recovery)
    4, 5, 4, 3, 2, 2, 1,
  ],
};

createTrainingHeatMap("intensity-heatmap", intensityData);
```

#### 5. Real-Time Metric Display

Live updating chart for metrics during active training sessions.

```javascript
/**
 * Real-Time Metric Display
 * Updates chart in real-time during training sessions
 */
class RealTimeMetricChart {
  constructor(canvasId, metricLabel, updateInterval = 1000) {
    this.canvasId = canvasId;
    this.metricLabel = metricLabel;
    this.updateInterval = updateInterval;
    this.dataPoints = [];
    this.maxDataPoints = 60; // Keep last 60 seconds
    this.chart = null;
    this.initializeChart();
  }

  initializeChart() {
    const ctx = document.getElementById(this.canvasId).getContext("2d");
    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: this.metricLabel,
            data: [],
            borderColor: "var(--chart-primary)",
            backgroundColor: "rgba(16, 201, 107, 0.1)",
            tension: 0.4,
            fill: true,
            pointRadius: 0, // Hide points for cleaner look
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0, // Disable animation for real-time updates
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          x: {
            type: "linear",
            position: "bottom",
            title: {
              display: true,
              text: "Time (seconds)",
            },
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: this.metricLabel,
            },
            grid: {
              color: "var(--chart-grid)",
            },
          },
        },
      },
    });
  }

  addDataPoint(value, timestamp = Date.now()) {
    this.dataPoints.push({ value, timestamp });
    
    // Keep only last N data points
    if (this.dataPoints.length > this.maxDataPoints) {
      this.dataPoints.shift();
    }

    // Update chart
    const startTime = this.dataPoints[0]?.timestamp || timestamp;
    this.chart.data.labels = this.dataPoints.map(
      (point) => ((point.timestamp - startTime) / 1000).toFixed(0) + "s"
    );
    this.chart.data.datasets[0].data = this.dataPoints.map((point) => point.value);
    this.chart.update("none"); // 'none' mode for instant updates
  }

  start() {
    this.intervalId = setInterval(() => {
      // Simulate data - replace with actual sensor data
      const value = Math.random() * 100;
      this.addDataPoint(value);
    }, this.updateInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
```

**Usage Example:**

```html
<div class="chart-card">
  <div class="chart-header">
    <h3>Heart Rate Monitor</h3>
    <span class="text-caption">Live during training</span>
  </div>
  <div class="chart-body">
    <canvas id="realtime-heartrate"></canvas>
  </div>
</div>

<script>
const heartRateChart = new RealTimeMetricChart("realtime-heartrate", "Heart Rate (BPM)", 1000);
heartRateChart.start();

// Stop when training ends
// heartRateChart.stop();
</script>
```

### Chart Template Quick Reference

| Template | Use Case | Key Features |
|----------|----------|--------------|
| **Performance Trend** | Speed/strength over time | Athlete vs team comparison, trend lines |
| **Athlete Comparison** | Multi-athlete metrics | Bar chart, color-coded athletes |
| **Progress Tracking** | Goal completion | Doughnut chart, percentage display |
| **Training Heat Map** | Intensity patterns | Weekly/daily intensity visualization |
| **Real-Time Metrics** | Live training data | Auto-updating, sensor integration |

### Tabs Component

**Status**: ✅ **Stable** - Production-ready, fully implemented

Horizontal navigation between related content sections.

#### Component API

| Property       | Type  | Default | Required | Description           |
| -------------- | ----- | ------- | -------- | --------------------- |
| `tabs`         | class | -       | Yes      | Main tabs container   |
| `tabs-list`    | class | -       | Yes      | Tab button list       |
| `tabs-trigger` | class | -       | Yes      | Individual tab button |
| `tabs-content` | class | -       | Yes      | Tab content container |
| `tabs-panel`   | class | -       | Yes      | Individual tab panel  |
| `tabs-active`  | class | -       | No       | Active tab indicator  |

#### HTML Structure

```html
<div class="tabs" data-tabs="athlete-profile">
  <div class="tabs-list" role="tablist" aria-label="Athlete profile sections">
    <button
      class="tabs-trigger tabs-active"
      role="tab"
      aria-selected="true"
      aria-controls="tab-stats"
      id="trigger-stats"
    >
      Stats
    </button>
    <button
      class="tabs-trigger"
      role="tab"
      aria-selected="false"
      aria-controls="tab-training"
      id="trigger-training"
    >
      Training
    </button>
    <button
      class="tabs-trigger"
      role="tab"
      aria-selected="false"
      aria-controls="tab-nutrition"
      id="trigger-nutrition"
    >
      Nutrition
    </button>
    <button
      class="tabs-trigger"
      role="tab"
      aria-selected="false"
      aria-controls="tab-performance"
      id="trigger-performance"
    >
      Performance
    </button>
  </div>

  <div class="tabs-content">
    <div
      class="tabs-panel tabs-active"
      role="tabpanel"
      aria-labelledby="trigger-stats"
      id="tab-stats"
    >
      <!-- Stats content -->
    </div>
    <div
      class="tabs-panel"
      role="tabpanel"
      aria-labelledby="trigger-training"
      id="tab-training"
    >
      <!-- Training content -->
    </div>
    <div
      class="tabs-panel"
      role="tabpanel"
      aria-labelledby="trigger-nutrition"
      id="tab-nutrition"
    >
      <!-- Nutrition content -->
    </div>
    <div
      class="tabs-panel"
      role="tabpanel"
      aria-labelledby="trigger-performance"
      id="tab-performance"
    >
      <!-- Performance content -->
    </div>
  </div>
</div>
```

#### JavaScript Implementation

```javascript
class Tabs {
  constructor(container) {
    this.container = container;
    this.triggers = container.querySelectorAll(".tabs-trigger");
    this.panels = container.querySelectorAll(".tabs-panel");
    this.activeIndex = 0;

    this.init();
  }

  init() {
    this.triggers.forEach((trigger, index) => {
      trigger.addEventListener("click", () => this.selectTab(index));
      trigger.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          this.selectTab((index + 1) % this.triggers.length);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          this.selectTab(
            (index - 1 + this.triggers.length) % this.triggers.length,
          );
        }
      });
    });
  }

  selectTab(index) {
    // Update triggers
    this.triggers.forEach((trigger, i) => {
      const isActive = i === index;
      trigger.classList.toggle("tabs-active", isActive);
      trigger.setAttribute("aria-selected", isActive);
      trigger.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    // Update panels
    this.panels.forEach((panel, i) => {
      panel.classList.toggle("tabs-active", i === index);
    });

    this.activeIndex = index;

    // Focus the active trigger
    this.triggers[index].focus();
  }
}

// Initialize all tabs
document.querySelectorAll(".tabs").forEach((container) => {
  new Tabs(container);
});
```

---

## Sports-Specific Components

**Status**: ✅ **New** - Production-ready components for athletic applications

Specialized components designed specifically for sports performance tracking and training management.

### Athlete Profile Card

**Status**: ✅ **Stable** - Production-ready

A specialized card component for displaying athlete information with quick stats preview and action buttons.

#### Component API

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `athlete-card` | class | - | Yes | Main card container |
| `athlete-header` | class | - | Yes | Header section with photo and stats |
| `athlete-photo` | class | - | Yes | Athlete profile image |
| `athlete-stats-preview` | class | - | No | Quick stats display |
| `athlete-body` | class | - | Yes | Main content area |
| `athlete-footer` | class | - | No | Action buttons area |

#### HTML Structure

```html
<div class="card athlete-card">
  <div class="athlete-header">
    <img 
      src="/images/athletes/alex-johnson.jpg" 
      alt="Alex Johnson"
      class="athlete-photo"
    />
    <div class="athlete-info">
      <h3 class="athlete-name">Alex Johnson</h3>
      <p class="athlete-position">Quarterback • #12</p>
      <div class="athlete-stats-preview">
        <div class="stat-item">
          <span class="stat-value">24</span>
          <span class="stat-label">Sessions</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">85%</span>
          <span class="stat-label">Performance</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">4.2s</span>
          <span class="stat-label">40-Yard</span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="athlete-body">
    <div class="athlete-metrics">
      <div class="metric">
        <span class="metric-label">Last Session</span>
        <span class="metric-value">2 days ago</span>
      </div>
      <div class="metric">
        <span class="metric-label">Training Streak</span>
        <span class="metric-value">5 days</span>
      </div>
    </div>
  </div>
  
  <div class="athlete-footer">
    <button class="btn btn-secondary btn-sm">View Profile</button>
    <button class="btn btn-primary btn-sm">Start Session</button>
  </div>
</div>
```

#### CSS Implementation

```css
.athlete-card {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.athlete-header {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
}

.athlete-photo {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 2px solid var(--color-border-secondary);
  flex-shrink: 0;
}

.athlete-info {
  flex: 1;
  min-width: 0;
}

.athlete-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1) 0;
}

.athlete-position {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-3) 0;
}

.athlete-stats-preview {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.athlete-body {
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-secondary);
}

.athlete-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.metric {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.metric-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.metric-value {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.athlete-footer {
  display: flex;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .athlete-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .athlete-stats-preview {
    justify-content: center;
  }
  
  .athlete-footer {
    flex-direction: column;
  }
  
  .athlete-footer .btn {
    width: 100%;
  }
}
```

### Training Session Timer

**Status**: ✅ **Stable** - Production-ready

A real-time timer component for tracking active training sessions with exercise progression.

#### Component API

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `session-timer` | class | - | Yes | Main timer container |
| `timer-display` | class | - | Yes | Time display element |
| `exercise-current` | class | - | Yes | Current exercise name |
| `exercise-progress` | class | - | No | Exercise progress indicator |
| `timer-controls` | class | - | No | Play/pause/stop buttons |

#### HTML Structure

```html
<div class="card session-timer">
  <div class="timer-header">
    <h3>Active Session</h3>
    <span class="timer-status">In Progress</span>
  </div>
  
  <div class="timer-display">
    <span class="timer-time" id="session-timer-display">15:23</span>
    <span class="timer-label">Elapsed Time</span>
  </div>
  
  <div class="exercise-current">
    <div class="exercise-name">Burpees</div>
    <div class="exercise-duration">30 seconds remaining</div>
    <div class="exercise-progress">
      <div class="progress-bar">
        <div class="progress-fill" style="width: 60%"></div>
      </div>
    </div>
  </div>
  
  <div class="timer-controls">
    <button class="btn btn-icon" aria-label="Pause session">
      <i data-lucide="pause"></i>
    </button>
    <button class="btn btn-icon" aria-label="Stop session">
      <i data-lucide="square"></i>
    </button>
  </div>
</div>
```

#### CSS Implementation

```css
.session-timer {
  padding: var(--space-6);
  text-align: center;
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.timer-status {
  font-size: var(--font-size-sm);
  color: var(--color-status-success);
  font-weight: var(--font-weight-medium);
  padding: var(--space-1) var(--space-3);
  background: rgba(34, 197, 94, 0.1);
  border-radius: var(--radius-full);
}

.timer-display {
  margin-bottom: var(--space-6);
}

.timer-time {
  display: block;
  font-size: 3rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  margin-bottom: var(--space-2);
}

.timer-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.exercise-current {
  padding: var(--space-4);
  background: var(--surface-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}

.exercise-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.exercise-duration {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
}

.exercise-progress {
  margin-top: var(--space-3);
}

.progress-bar {
  height: 4px;
  background: var(--color-border-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-brand-primary);
  transition: width 0.3s ease;
}

.timer-controls {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
}

/* Responsive */
@media (max-width: 768px) {
  .timer-time {
    font-size: 2.5rem;
  }
}
```

#### JavaScript Implementation

```javascript
class SessionTimer {
  constructor(displayElementId) {
    this.displayElement = document.getElementById(displayElementId);
    this.startTime = null;
    this.elapsedTime = 0;
    this.isRunning = false;
    this.intervalId = null;
  }

  start() {
    if (this.isRunning) return;
    
    this.startTime = Date.now() - this.elapsedTime;
    this.isRunning = true;
    this.intervalId = setInterval(() => this.update(), 100);
  }

  pause() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    clearInterval(this.intervalId);
  }

  stop() {
    this.pause();
    this.elapsedTime = 0;
    this.update();
  }

  update() {
    if (this.isRunning) {
      this.elapsedTime = Date.now() - this.startTime;
    }
    
    const minutes = Math.floor(this.elapsedTime / 60000);
    const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
    this.displayElement.textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Usage
const timer = new SessionTimer("session-timer-display");
timer.start();
```

### Metric Display Card

**Status**: ✅ **Stable** - Production-ready

A specialized card for displaying athletic metrics with trend indicators and context.

#### Component API

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `metric-card` | class | - | Yes | Main metric card container |
| `metric-trend` | class | - | No | Trend indicator (up/down/neutral) |
| `metric-value` | class | - | Yes | Main metric value |
| `metric-label` | class | - | Yes | Metric description |
| `metric-comparison` | class | - | No | Comparison to previous period |

#### HTML Structure

```html
<div class="card metric-card">
  <div class="metric-header">
    <div class="metric-trend trend-up">
      <i data-lucide="trending-up"></i>
      <span>+5%</span>
    </div>
  </div>
  
  <div class="metric-body">
    <div class="metric-value">4.2s</div>
    <div class="metric-label">40-Yard Dash</div>
    <div class="metric-comparison">
      <span class="comparison-label">vs last month:</span>
      <span class="comparison-value">4.4s</span>
    </div>
  </div>
</div>
```

#### CSS Implementation

```css
.metric-card {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.metric-header {
  display: flex;
  justify-content: flex-end;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.metric-trend.trend-up {
  color: var(--color-status-success);
  background: rgba(34, 197, 94, 0.1);
}

.metric-trend.trend-down {
  color: var(--color-status-error);
  background: rgba(239, 68, 68, 0.1);
}

.metric-trend.trend-neutral {
  color: var(--color-text-secondary);
  background: var(--surface-secondary);
}

.metric-body {
  text-align: center;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1;
  margin-bottom: var(--space-2);
  font-variant-numeric: tabular-nums;
}

.metric-label {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
}

.metric-comparison {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-secondary);
}

.comparison-label {
  color: var(--color-text-secondary);
}

.comparison-value {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .metric-value {
    font-size: 2rem;
  }
}
```

#### Usage Examples

```html
<!-- Speed Metric -->
<div class="card metric-card">
  <div class="metric-header">
    <div class="metric-trend trend-up">
      <i data-lucide="trending-up"></i>
      <span>+5%</span>
    </div>
  </div>
  <div class="metric-body">
    <div class="metric-value">4.2s</div>
    <div class="metric-label">40-Yard Dash</div>
    <div class="metric-comparison">
      <span class="comparison-label">vs last month:</span>
      <span class="comparison-value">4.4s</span>
    </div>
  </div>
</div>

<!-- Strength Metric -->
<div class="card metric-card">
  <div class="metric-header">
    <div class="metric-trend trend-up">
      <i data-lucide="trending-up"></i>
      <span>+8%</span>
    </div>
  </div>
  <div class="metric-body">
    <div class="metric-value">185 lbs</div>
    <div class="metric-label">Bench Press Max</div>
    <div class="metric-comparison">
      <span class="comparison-label">vs last month:</span>
      <span class="comparison-value">171 lbs</span>
    </div>
  </div>
</div>
```

### Tooltip Component

**Status**: ⏳ **Preview** - Feature-complete, may have minor changes

Contextual help on hover/focus for icons and complex features.

#### Component API

| Property                | Type      | Default | Required | Description                        |
| ----------------------- | --------- | ------- | -------- | ---------------------------------- |
| `tooltip`               | class     | -       | Yes      | Tooltip container                  |
| `tooltip-trigger`       | class     | -       | Yes      | Element that triggers tooltip      |
| `data-tooltip`          | attribute | -       | Yes      | Tooltip text content               |
| `data-tooltip-position` | attribute | 'top'   | No       | Position: top, bottom, left, right |

#### HTML Structure

```html
<!-- Icon with tooltip -->
<button
  class="btn-icon tooltip-trigger"
  data-tooltip="View training history"
  data-tooltip-position="top"
  aria-label="View training history"
>
  <i data-lucide="history"></i>
</button>

<!-- Text with tooltip -->
<span
  class="tooltip-trigger"
  data-tooltip="This metric shows your overall performance score based on multiple factors"
>
  Performance Score
  <i data-lucide="help-circle" style="width: 14px; height: 14px;"></i>
</span>
```

#### JavaScript Implementation

```javascript
class Tooltip {
  constructor(trigger) {
    this.trigger = trigger;
    this.text = trigger.dataset.tooltip;
    this.position = trigger.dataset.tooltipPosition || "top";
    this.tooltip = null;

    this.init();
  }

  init() {
    this.trigger.addEventListener("mouseenter", () => this.show());
    this.trigger.addEventListener("mouseleave", () => this.hide());
    this.trigger.addEventListener("focus", () => this.show());
    this.trigger.addEventListener("blur", () => this.hide());
  }

  show() {
    if (this.tooltip) return;

    this.tooltip = document.createElement("div");
    this.tooltip.className = `tooltip tooltip-${this.position}`;
    this.tooltip.textContent = this.text;
    this.tooltip.setAttribute("role", "tooltip");

    document.body.appendChild(this.tooltip);

    this.positionTooltip();
  }

  hide() {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  positionTooltip() {
    const rect = this.trigger.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    let top, left;

    switch (this.position) {
      case "top":
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left - tooltipRect.width - 8;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + 8;
        break;
    }

    // Keep tooltip within viewport
    top = Math.max(
      8,
      Math.min(top, window.innerHeight - tooltipRect.height - 8),
    );
    left = Math.max(
      8,
      Math.min(left, window.innerWidth - tooltipRect.width - 8),
    );

    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
  }
}

// Initialize all tooltips
document.querySelectorAll(".tooltip-trigger").forEach((trigger) => {
  new Tooltip(trigger);
});
```

### Avatar Component

**Status**: ⏳ **Preview** - Feature-complete, may have minor changes

User profile images with fallback to initials.

#### Component API

| Property        | Type  | Default     | Required | Description              |
| --------------- | ----- | ----------- | -------- | ------------------------ |
| `avatar`        | class | -           | Yes      | Avatar container         |
| `avatar-xs`     | class | -           | No       | Extra small (24px)       |
| `avatar-sm`     | class | -           | No       | Small (32px)             |
| `avatar-md`     | class | `avatar-md` | No       | Medium (40px)            |
| `avatar-lg`     | class | -           | No       | Large (48px)             |
| `avatar-xl`     | class | -           | No       | Extra large (64px)       |
| `avatar-status` | class | -           | No       | Status indicator overlay |

#### HTML Structure

```html
<!-- Avatar with image -->
<div class="avatar avatar-md">
  <img src="/avatars/john-smith.jpg" alt="John Smith" />
</div>

<!-- Avatar with initials fallback -->
<div class="avatar avatar-md" data-name="John Smith">
  <span class="avatar-initials">JS</span>
</div>

<!-- Avatar with status indicator -->
<div class="avatar avatar-md avatar-status avatar-online">
  <img src="/avatars/john-smith.jpg" alt="John Smith" />
  <span class="avatar-status-dot"></span>
</div>
```

### Accordion Component

**Status**: ✅ **Stable** - Production-ready, fully implemented

Collapsible sections for training program details.

#### HTML Structure

```html
<div class="accordion">
  <div class="accordion-item">
    <button
      class="accordion-trigger"
      aria-expanded="false"
      aria-controls="panel-1"
    >
      <span>Week 1 Training Program</span>
      <i data-lucide="chevron-down" class="accordion-icon"></i>
    </button>
    <div class="accordion-panel" id="panel-1" role="region">
      <div class="accordion-content">
        <!-- Content -->
      </div>
    </div>
  </div>

  <div class="accordion-item">
    <button
      class="accordion-trigger"
      aria-expanded="false"
      aria-controls="panel-2"
    >
      <span>Week 2 Training Program</span>
      <i data-lucide="chevron-down" class="accordion-icon"></i>
    </button>
    <div class="accordion-panel" id="panel-2" role="region">
      <div class="accordion-content">
        <!-- Content -->
      </div>
    </div>
  </div>
</div>
```

### Empty States

**Status**: ⏳ **Preview** - Feature-complete, may have minor changes

Helpful guidance when no data exists.

#### HTML Structure

```html
<div class="empty-state">
  <div class="empty-state-icon">
    <i data-lucide="users" style="width: 64px; height: 64px;"></i>
  </div>
  <h3 class="empty-state-title">No athletes in roster</h3>
  <p class="empty-state-description">
    Get started by adding your first athlete to the roster.
  </p>
  <button class="btn btn-primary btn-md">Add First Athlete</button>
</div>
```

## Component Composition Patterns

**Status**: ✅ **Stable** - Production-ready

Common patterns for combining multiple components to create complex UI patterns.

### Card with Form

Combine card container with form components for modal forms or inline forms.

```html
<div class="card">
  <div class="card-header">
    <h3>Add New Athlete</h3>
  </div>
  <div class="card-body">
    <form class="form">
      <div class="form-group">
        <label class="form-label required" for="name">Full Name</label>
        <input type="text" id="name" class="form-input" required />
      </div>
      <div class="form-group">
        <label class="form-label required" for="position">Position</label>
        <select id="position" class="form-select" required>
          <option value="">Select position</option>
          <option value="qb">Quarterback</option>
          <option value="wr">Wide Receiver</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="email">Email</label>
        <input type="email" id="email" class="form-input" />
      </div>
    </form>
  </div>
  <div class="card-footer">
    <button class="btn btn-secondary" data-modal-close>Cancel</button>
    <button class="btn btn-primary">Save Athlete</button>
  </div>
</div>
```

### Dashboard Layout Pattern

Combine bento grid, cards, and charts for comprehensive dashboards.

```html
<div class="layout-container">
  <div class="bento-grid">
    <!-- Hero Card - Full Width -->
    <div class="card bento-card-span-12">
      <h2>Today's Training Session</h2>
      <p>Next session starts in 2 hours</p>
      <button class="btn btn-primary btn-lg">Start Session</button>
    </div>

    <!-- Performance Chart - 2/3 Width, Double Height -->
    <div class="card chart-card bento-card-span-8 bento-card-row-span-2">
      <div class="card-header">
        <h3>Performance Over Time</h3>
      </div>
      <div class="chart-body">
        <canvas id="performance-chart"></canvas>
      </div>
    </div>

    <!-- Quick Stats - 1/3 Width -->
    <div class="card stat-card bento-card-span-4">
      <div class="stat-value">85%</div>
      <div class="stat-label">Completion Rate</div>
    </div>

    <div class="card stat-card bento-card-span-4">
      <div class="stat-value">12</div>
      <div class="stat-label">Sessions This Week</div>
    </div>

    <!-- Upcoming Events - Half Width -->
    <div class="card bento-card-span-6">
      <div class="card-header">
        <h3>Upcoming Events</h3>
      </div>
      <div class="card-body">
        <!-- Event list -->
      </div>
    </div>

    <!-- Quick Actions - Half Width -->
    <div class="card bento-card-span-6">
      <div class="card-header">
        <h3>Quick Actions</h3>
      </div>
      <div class="card-body">
        <button class="btn btn-primary btn-md">Add Athlete</button>
        <button class="btn btn-secondary btn-md">Schedule Session</button>
      </div>
    </div>
  </div>
</div>
```

### Table with Filters and Pagination

Combine table, search, filters, and pagination for data-heavy pages.

```html
<div class="data-table-wrapper">
  <!-- Search and Actions Toolbar -->
  <div class="data-table-toolbar">
    <input
      type="search"
      class="data-table-search"
      placeholder="Search athletes..."
    />
    <div class="data-table-filters">
      <select class="form-select form-select-sm">
        <option>All Positions</option>
        <option>Quarterback</option>
        <option>Wide Receiver</option>
      </select>
      <select class="form-select form-select-sm">
        <option>All Status</option>
        <option>Active</option>
        <option>Inactive</option>
      </select>
    </div>
    <button class="btn btn-primary btn-sm">Add Athlete</button>
  </div>

  <!-- Table -->
  <div class="data-table-container">
    <table class="data-table data-table-sortable">
      <!-- Table content -->
    </table>
  </div>

  <!-- Pagination -->
  <nav class="pagination" aria-label="Table pagination">
    <!-- Pagination component -->
  </nav>
</div>
```

### Form with Validation and Error Handling

Combine form components with error handling patterns.

```html
<form class="form" id="athlete-form">
  <!-- Form-level errors -->
  <div
    class="form-errors"
    role="alert"
    aria-live="polite"
    id="form-errors"
    style="display: none;"
  >
    <h3>Please fix the following errors:</h3>
    <ul id="error-list"></ul>
  </div>

  <!-- Form fields -->
  <div class="form-group">
    <label class="form-label required" for="athlete-name">Full Name</label>
    <input
      type="text"
      id="athlete-name"
      class="form-input"
      required
      aria-invalid="false"
      aria-describedby="name-error"
    />
    <div class="form-error" id="name-error" role="alert"></div>
  </div>

  <div class="form-group">
    <label class="form-label required" for="athlete-email">Email</label>
    <input
      type="email"
      id="athlete-email"
      class="form-input"
      required
      aria-invalid="false"
      aria-describedby="email-error"
    />
    <div class="form-error" id="email-error" role="alert"></div>
  </div>

  <!-- Form actions -->
  <div class="form-actions">
    <button type="button" class="btn btn-secondary" data-modal-close>
      Cancel
    </button>
    <button type="submit" class="btn btn-primary">Save Athlete</button>
  </div>
</form>
```

### Modal with Form and Toast Feedback

Combine modal, form, and toast notifications for complete user flows.

```html
<!-- Modal -->
<div
  class="modal-overlay"
  id="add-athlete-modal"
  role="dialog"
  aria-modal="true"
  aria-hidden="true"
>
  <div class="modal-content">
    <div class="modal-header">
      <h2 id="modal-title">Add New Athlete</h2>
      <button class="modal-close" aria-label="Close modal">
        <i data-lucide="x"></i>
      </button>
    </div>
    <div class="modal-body">
      <form id="athlete-form">
        <!-- Form fields -->
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-primary" type="submit" form="athlete-form">
        Save
      </button>
    </div>
  </div>
</div>

<!-- Toast Container (in page) -->
<div class="toast-container"></div>
```

**JavaScript:**

```javascript
document
  .getElementById("athlete-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const data = new FormData(e.target);
      const response = await fetch("/api/athletes", {
        method: "POST",
        body: data,
      });

      if (response.ok) {
        closeModal("add-athlete-modal");
        showToast.success("Athlete added successfully");
        // Refresh data or redirect
      } else {
        const errors = await response.json();
        showFormErrors(errors);
      }
    } catch (error) {
      showToast.error("Failed to save athlete. Please try again.");
    }
  });
```

### Card Grid with Empty State Fallback

Combine grid layout with empty state for graceful degradation.

```html
<div class="dashboard-grid" id="athletes-grid">
  <!-- Cards will be inserted here -->
</div>

<!-- Empty State (shown when no data) -->
<div class="empty-state" id="empty-state" style="display: none;">
  <div class="empty-state-icon">
    <i data-lucide="users" style="width: 64px; height: 64px;"></i>
  </div>
  <h3 class="empty-state-title">No athletes in roster</h3>
  <p class="empty-state-description">
    Get started by adding your first athlete to track their training progress.
  </p>
  <button
    class="btn btn-primary btn-md"
    onclick="openModal('add-athlete-modal')"
  >
    Add First Athlete
  </button>
</div>
```

**JavaScript:**

```javascript
function renderAthletes(athletes) {
  const grid = document.getElementById("athletes-grid");
  const emptyState = document.getElementById("empty-state");

  if (athletes.length === 0) {
    grid.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  grid.style.display = "grid";
  emptyState.style.display = "none";

  grid.innerHTML = athletes
    .map(
      (athlete) => `
    <div class="card">
      <div class="card-header">
        <h3>${athlete.name}</h3>
      </div>
      <div class="card-body">
        <p>Position: ${athlete.position}</p>
        <p>Sessions: ${athlete.sessions}</p>
      </div>
    </div>
  `,
    )
    .join("");
}
```

### Breadcrumb Navigation with Page Header

Combine breadcrumbs with page header for clear navigation context.

```html
<div class="page-header">
  <nav aria-label="Breadcrumb" class="breadcrumb">
    <ol class="breadcrumb-list">
      <li class="breadcrumb-item">
        <a href="/dashboard">Dashboard</a>
      </li>
      <li class="breadcrumb-item">
        <a href="/roster">Roster</a>
      </li>
      <li class="breadcrumb-item breadcrumb-current" aria-current="page">
        John Smith
      </li>
    </ol>
  </nav>

  <div class="page-header-content">
    <h1>John Smith</h1>
    <div class="page-header-actions">
      <button class="btn btn-secondary btn-sm">
        <i data-lucide="edit"></i>
        Edit
      </button>
      <button class="btn btn-primary btn-sm">
        <i data-lucide="calendar"></i>
        Schedule Session
      </button>
    </div>
  </div>
</div>
```

### Tabs with Data Table

Combine tabs with data tables for organized content sections.

```html
<div class="tabs" data-tabs="athlete-details">
  <div class="tabs-list" role="tablist">
    <button
      class="tabs-trigger tabs-active"
      role="tab"
      aria-controls="tab-stats"
    >
      Stats
    </button>
    <button class="tabs-trigger" role="tab" aria-controls="tab-training">
      Training History
    </button>
    <button class="tabs-trigger" role="tab" aria-controls="tab-performance">
      Performance
    </button>
  </div>

  <div class="tabs-content">
    <div class="tabs-panel tabs-active" id="tab-stats" role="tabpanel">
      <!-- Stats content -->
    </div>

    <div class="tabs-panel" id="tab-training" role="tabpanel">
      <div class="data-table-wrapper">
        <table class="data-table data-table-sortable">
          <!-- Training history table -->
        </table>
      </div>
    </div>

    <div class="tabs-panel" id="tab-performance" role="tabpanel">
      <div class="chart-card">
        <canvas id="performance-chart"></canvas>
      </div>
    </div>
  </div>
</div>
```

## Icon System

### Icon Library: Lucide Icons

We use **Lucide Icons** (modern icon library similar to Radix UI) for consistent, professional iconography across the application.

### Icon Guidelines

- **Consistent sizing**: 16px, 20px, 24px standard sizes
- **Stroke weight**: 2px for standard icons
- **Color inheritance**: Icons inherit color from parent context
- **Accessibility**: Proper ARIA labels and semantic HTML

### Icon Colors (Dark Mode)

```css
--icon-color-primary: #ffffff; /* White - default */
--icon-color-secondary: #a0a0a0; /* Light gray - secondary */
--icon-color-muted: #6b6b6b; /* Muted gray - inactive */
--icon-color-accent: #10c96b; /* Green - active/hover */
```

### Icon Sizes

```css
--icon-size-xs: 12px; /* Compact UI */
--icon-size-sm: 16px; /* Inline text */
--icon-size-md: 20px; /* Standard UI */
--icon-size-lg: 24px; /* Prominent actions */
--icon-size-xl: 32px; /* Headers */
```

### Usage Examples

```html
<!-- Lucide Icon -->
<i data-lucide="football"></i>
<i data-lucide="target"></i>
<i data-lucide="trophy"></i>
<i data-lucide="activity"></i>

<!-- Icon with size -->
<i data-lucide="settings" style="width: 20px; height: 20px;"></i>

<!-- Icon in button -->
<button class="btn-primary">
  <i data-lucide="play" style="width: 16px; height: 16px;"></i>
  Start Training
</button>
```

### Icon Initialization

```javascript
// Initialize Lucide icons (included in all pages)
lucide.createIcons();
```

## Motion & Animation

### Motion Principles

1. **Purposeful**: Every animation serves a functional purpose
2. **Subtle**: Enhances without distracting from content
3. **Fast**: Quick transitions maintain perceived performance
4. **Accessible**: Respects `prefers-reduced-motion` preference

### Duration Scale

```css
--motion-duration-instant: 75ms; /* State changes */
--motion-duration-fast: 150ms; /* Hover effects */
--motion-duration-normal: 200ms; /* Component transitions */
--motion-duration-slow: 300ms; /* Layout changes */
```

### Easing Functions

```css
--motion-easing-entrance: cubic-bezier(0, 0, 0.2, 1); /* Elements entering */
--motion-easing-exit: cubic-bezier(0.4, 0, 1, 1); /* Elements exiting */
--motion-easing-standard: cubic-bezier(
  0.4,
  0,
  0.2,
  1
); /* General transitions */
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Accessibility

### WCAG 2.1 AA Compliance

- **Color Contrast**: All colors verified and documented
  - White on dark: 14:1 (AAA)
  - Light gray on dark: 8:1 (AA)
  - Green on dark: 10:1 (AAA)
  - Dark text on white: 14:1 (AAA)
- **Focus Management**: Visible focus indicators (`:focus-visible`) on all interactive elements
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and semantic HTML

### Accessibility Features

- **High Contrast Mode**: Enhanced borders and contrast for `prefers-contrast: more`
- **Reduced Motion**: Respects `prefers-reduced-motion` preference
- **System Preference**: Auto-detects light/dark mode via `prefers-color-scheme`
- **Touch Targets**: Minimum 44px for all interactive elements
- **Input Font Size**: 16px minimum (prevents iOS zoom)
- **Screen Reader Classes**: `.sr-only` for assistive technology content
- **Focus Management**: Logical tab order and focus traps in modals
- **Alternative Text**: Required for all meaningful images and icons

### Testing Checklist

- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader announces all content correctly
- [ ] Color contrast meets AA standards
- [ ] Focus indicators are clearly visible
- [ ] Form validation is announced to assistive technology

## Component Testing Guidelines

**Status**: ✅ **Stable** - Production-ready

Comprehensive testing strategies for ensuring component quality, accessibility, and cross-browser compatibility.

### Testing Strategy

#### 1. Unit Testing

Test individual component functionality in isolation.

**Example - Button Component:**

```javascript
// button.test.js
import { render, fireEvent } from "@testing-library/dom";
import { Button } from "./button.js";

describe("Button Component", () => {
  test("renders with correct text", () => {
    const { getByText } = render(Button({ children: "Click me" }));
    expect(getByText("Click me")).toBeInTheDocument();
  });

  test("calls onClick handler when clicked", () => {
    const handleClick = jest.fn();
    const { getByText } = render(
      Button({ onClick: handleClick, children: "Click" }),
    );
    fireEvent.click(getByText("Click"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("is disabled when disabled prop is true", () => {
    const { getByText } = render(
      Button({ disabled: true, children: "Disabled" }),
    );
    expect(getByText("Disabled")).toBeDisabled();
  });
});
```

#### 2. Visual Regression Testing

Ensure components render correctly across browsers and themes.

**Tools:**

- **Percy** - Visual testing platform
- **Chromatic** - Storybook visual testing
- **BackstopJS** - Automated visual regression testing

**Example Configuration:**

```javascript
// backstop.config.js
module.exports = {
  scenarios: [
    {
      label: "Button - Primary",
      url: "http://localhost:3000/components/button",
      selectors: [".btn-primary"],
      viewports: [
        { width: 320, height: 568 },
        { width: 768, height: 1024 },
        { width: 1280, height: 720 },
      ],
    },
  ],
};
```

#### 3. Accessibility Testing

Verify WCAG AA compliance and screen reader compatibility.

**Automated Testing:**

```javascript
// accessibility.test.js
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

test("Button has no accessibility violations", async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Manual Testing Checklist:**

- [ ] **Keyboard Navigation**: Tab through all interactive elements
- [ ] **Screen Reader**: Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] **Focus Indicators**: Visible focus states on all interactive elements
- [ ] **Color Contrast**: Verify 4.5:1 ratio for text, 3:1 for UI components
- [ ] **ARIA Labels**: Proper labels for all interactive elements
- [ ] **Form Labels**: All form inputs have associated labels
- [ ] **Error Messages**: Errors are announced to screen readers
- [ ] **Skip Links**: Skip to main content functionality works

#### 4. Cross-Browser Testing

Test components across supported browsers.

**Browser Testing Matrix:**

| Component | Chrome | Firefox | Safari | Edge | Samsung Internet |
| --------- | ------ | ------- | ------ | ---- | ---------------- |
| Button    | ✅     | ✅      | ✅     | ✅   | ✅               |
| Modal     | ✅     | ✅      | ✅     | ✅   | ⚠️               |
| Toast     | ✅     | ✅      | ✅     | ✅   | ✅               |
| Table     | ✅     | ✅      | ✅     | ✅   | ✅               |

**Testing Tools:**

- **BrowserStack** - Cloud-based browser testing
- **Sauce Labs** - Automated cross-browser testing
- **Playwright** - Cross-browser automation

**Example - Playwright Test:**

```javascript
// button.spec.js
import { test, expect } from "@playwright/test";

test.describe("Button Component", () => {
  test("renders correctly in Chrome", async ({ page, browserName }) => {
    await page.goto("http://localhost:3000/components/button");
    const button = page.locator(".btn-primary");
    await expect(button).toBeVisible();
  });

  test("works in Safari", async ({ page, browserName }) => {
    test.skip(browserName !== "webkit", "Safari only");
    await page.goto("http://localhost:3000/components/button");
    await page.click(".btn-primary");
    // Verify behavior
  });
});
```

#### 5. Performance Testing

Ensure components meet performance budgets.

**Performance Budgets:**

- **CSS Size**: < 50KB (gzipped)
- **JavaScript Size**: < 100KB (gzipped) per component
- **First Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Lighthouse Score**: > 90

**Example - Performance Test:**

```javascript
// performance.test.js
import { performance } from "perf_hooks";

test("Button renders within performance budget", async () => {
  const start = performance.now();
  render(<Button>Click me</Button>);
  const end = performance.now();
  const renderTime = end - start;

  expect(renderTime).toBeLessThan(16); // 60fps = 16ms per frame
});
```

#### 6. Responsive Testing

Verify components work across all breakpoints.

**Breakpoint Testing:**

```javascript
// responsive.test.js
const breakpoints = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
};

Object.entries(breakpoints).forEach(([name, size]) => {
  test(`Button renders correctly on ${name}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("http://localhost:3000/components/button");
    const button = page.locator(".btn-primary");
    await expect(button).toBeVisible();
    await expect(button).toHaveCSS("min-height", "44px"); // Touch target
  });
});
```

### Component Testing Checklist

Before marking a component as **Stable**, verify:

#### Functionality

- [ ] All interactive states work (hover, active, focus, disabled)
- [ ] Event handlers fire correctly
- [ ] Form validation works as expected
- [ ] Keyboard shortcuts function properly
- [ ] Component updates reactively to prop changes

#### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Focus management is correct
- [ ] ARIA attributes are properly set
- [ ] Color contrast meets AA standards
- [ ] No accessibility violations (axe-core)

#### Visual

- [ ] Renders correctly in light theme
- [ ] Renders correctly in dark theme
- [ ] Responsive at all breakpoints
- [ ] No visual regressions
- [ ] Icons and images load correctly

#### Performance

- [ ] Meets performance budget
- [ ] No layout shift (CLS < 0.1)
- [ ] Smooth animations (60fps)
- [ ] Efficient re-renders

#### Browser Compatibility

- [ ] Works in Chrome (latest 2 versions)
- [ ] Works in Firefox (latest 2 versions)
- [ ] Works in Safari (latest 2 versions)
- [ ] Works in Edge (latest 2 versions)
- [ ] Works in Samsung Internet (latest 2 versions)

### Testing Tools & Setup

#### Recommended Testing Stack

```json
{
  "devDependencies": {
    "@testing-library/dom": "^9.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@playwright/test": "^1.40.0",
    "jest": "^29.0.0",
    "jest-axe": "^7.0.0",
    "axe-core": "^4.8.0",
    "backstopjs": "^6.2.0"
  }
}
```

#### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Component Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:accessibility
      - run: npm run test:visual
      - run: npm run test:browser
```

### Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Accessibility Tests**: 100% of interactive components
- **Visual Tests**: 100% of component variants
- **Browser Tests**: Critical user flows in all browsers

## Error Handling & Validation

### Error Types & Classification

#### Domain Errors (Business Logic)

Errors that users can understand and potentially fix:

- Invalid date range (training session in the past)
- Duplicate entry (athlete already in roster)
- Missing required field
- Invalid format (email, phone number)

**Handling**: Show clear, actionable error messages inline or at form level.

#### Technical Errors (System Failures)

Errors that users cannot fix:

- Network timeout
- 500 server error
- Database connection failure
- API unavailable

**Handling**: Log technical details, show generic user-friendly message with recovery options.

### Error Hierarchy

#### 1. Inline Validation

Errors displayed next to the specific field for immediate feedback.

```html
<div class="form-group">
  <label class="form-label required">Email Address</label>
  <input
    type="email"
    class="form-input error"
    value="invalid-email"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <div class="form-error" id="email-error" role="alert">
    <i data-lucide="alert-circle" style="width: 16px; height: 16px;"></i>
    Please enter a valid email address
  </div>
</div>
```

**When to Use:**

- ✅ Field-level validation errors
- ✅ Format validation (email, phone, date)
- ✅ Real-time feedback on blur or submit

**CSS Classes:**

```css
.form-input.error {
  border-color: var(--color-status-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  color: var(--color-status-error);
  font-size: var(--font-size-sm);
}
```

#### 2. Form-Level Errors

Summary of all errors at the top of the form.

```html
<div class="form-errors" role="alert" aria-live="polite">
  <h3>Please fix the following errors:</h3>
  <ul>
    <li><a href="#email-field">Email address is invalid</a></li>
    <li>
      <a href="#password-field">Password must be at least 8 characters</a>
    </li>
  </ul>
</div>
```

**When to Use:**

- ✅ Multiple validation errors on form submit
- ✅ Complex forms with many fields
- ✅ Errors that prevent form submission

#### 3. Banner Notifications

Persistent messages at the top of the page for system-wide information.

```html
<div class="alert-banner alert-error" role="alert">
  <div class="alert-content">
    <i data-lucide="alert-circle" style="width: 20px; height: 20px;"></i>
    <div>
      <strong>Unable to save changes</strong>
      <p>Please check your internet connection and try again.</p>
    </div>
  </div>
  <button class="alert-dismiss" aria-label="Dismiss alert">
    <i data-lucide="x" style="width: 16px; height: 16px;"></i>
  </button>
</div>
```

**When to Use:**

- ✅ System-wide errors (network failures, server errors)
- ✅ Important warnings that affect entire page
- ✅ Success confirmations for critical actions

#### 4. Toast Notifications

Temporary notifications for non-critical feedback.

```html
<div class="toast toast-success" role="status" aria-live="polite">
  <div class="toast-content">
    <i data-lucide="check-circle" style="width: 20px; height: 20px;"></i>
    <span>Training session saved successfully</span>
  </div>
  <button class="toast-close" aria-label="Close notification">
    <i data-lucide="x" style="width: 16px; height: 16px;"></i>
  </button>
</div>
```

**When to Use:**

- ✅ Success confirmations (save, delete, update)
- ✅ Non-critical errors
- ✅ Status updates
- ✅ Quick feedback for user actions

### Validation Timing

#### On Blur (Recommended)

Validate when user leaves the field:

- ✅ Less intrusive
- ✅ Allows users to complete typing
- ✅ Good balance of feedback and interruption

```javascript
input.addEventListener("blur", () => {
  validateField(input);
});
```

#### On Submit

Validate all fields when form is submitted:

- ✅ Prevents premature validation
- ✅ Better for mobile (no keyboard interruptions)
- ✅ Standard pattern users expect

```javascript
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const errors = validateForm(form);
  if (errors.length === 0) {
    form.submit();
  } else {
    showFormErrors(errors);
  }
});
```

#### Real-Time (Advanced)

Validate as user types (debounced):

- ✅ Immediate feedback
- ⚠️ Can be annoying if too aggressive
- ✅ Use for format validation (email, URL)

```javascript
let debounceTimer;
input.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    validateField(input);
  }, 500);
});
```

### Error Message Writing Guidelines

#### Voice & Tone

- **Encouraging**: "Let's fix this together"
- **Clear**: Use plain language, avoid technical jargon
- **Actionable**: Tell users what to do, not just what's wrong
- **Concise**: One sentence, maximum two

#### Good Examples ✅

- "Please enter a valid email address"
- "Password must be at least 8 characters"
- "Training date cannot be in the past"
- "This athlete is already in your roster"

#### Bad Examples ❌

- "Invalid input" (too vague)
- "Error 500" (technical jargon)
- "You did something wrong" (blaming user)
- "The email field contains an invalid email address format" (too wordy)

### Error Recovery Patterns

#### Network Errors

```html
<div class="alert-banner alert-error">
  <div class="alert-content">
    <i data-lucide="wifi-off"></i>
    <div>
      <strong>Connection lost</strong>
      <p>
        Your changes are saved locally.
        <a href="#" onclick="retrySave()">Retry</a>
      </p>
    </div>
  </div>
</div>
```

#### Validation Errors

```html
<div class="form-group">
  <input type="date" class="form-input error" min="2025-01-01" />
  <div class="form-error">
    Training sessions must be scheduled for future dates.
    <a href="#" onclick="setToday()">Use today's date</a>
  </div>
</div>
```

#### Permission Errors

```html
<div class="alert-banner alert-warning">
  <div class="alert-content">
    <i data-lucide="lock"></i>
    <div>
      <strong>Permission required</strong>
      <p>
        You don't have permission to edit this roster.
        <a href="/contact">Request access</a>
      </p>
    </div>
  </div>
</div>
```

### Accessibility Requirements

- **ARIA Attributes**: Use `aria-invalid="true"` on error inputs
- **Error Descriptions**: Link errors to fields with `aria-describedby`
- **Live Regions**: Use `aria-live="polite"` for toast notifications
- **Focus Management**: Move focus to first error on form submit
- **Screen Reader Announcements**: Errors must be announced to assistive technology
- **Keyboard Dismissible**: All error messages must be dismissible with Escape key

## Implementation Guide

### Getting Started

1. **Include the CSS files**:

```html
<link rel="stylesheet" href="./src/ui-design-system.css" />
<link rel="stylesheet" href="./src/dark-theme.css" />
<link rel="stylesheet" href="./src/light-theme.css" id="light-theme" disabled />
<link rel="stylesheet" href="./src/hover-effects.css" />
```

2. **Add font imports**:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800&display=swap"
  rel="stylesheet"
/>
```

3. **Add Lucide Icons and Theme Switcher**:

```html
<script src="https://unpkg.com/lucide@latest"></script>
<script src="./src/icon-helper.js"></script>
<script src="./src/theme-switcher.js"></script>
```

4. **Initialize icons** (in your JavaScript):

```javascript
document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
});
```

5. **Use semantic HTML**:

```html
<button class="btn btn-primary btn-md">
  <i data-lucide="play" style="width: 16px; height: 16px;"></i>
  Primary Action
</button>
```

### Best Practices

#### Do ✅

- Use semantic tokens instead of primitive values
- Follow established component patterns
- Test with keyboard navigation and screen readers
- Provide alternative text for meaningful content
- Use consistent spacing from the 8-point grid

#### Don't ❌

- Override component styles with !important
- Use primitive tokens directly in components
- Rely solely on color to convey meaning
- Skip focus indicators for custom components
- Create new spacing values outside the system

### Customization

#### Creating Custom Themes

```css
:root {
  /* Override semantic tokens for custom themes */
  --color-brand-primary: #your-brand-color;
  --surface-primary: #your-background-color;
}
```

#### Extending Components

```css
.btn-custom {
  /* Extend existing button styles */
  @extend .btn;
  /* Add custom properties */
  background: linear-gradient(45deg, #your-colors);
}
```

## TypeScript Definitions

**Status**: ✅ **New** - Type definitions for component props and APIs

TypeScript type definitions for all components to ensure type safety and better developer experience.

### Component Type Definitions

```typescript
// Button Component Types
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string; // Lucide icon name
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

// Card Component Types
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

// Form Input Types
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// Select/Dropdown Types
interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string | string[];
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  options: SelectOption[];
  onChange?: (value: string | string[]) => void;
  'aria-label'?: string;
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

// Modal Types
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// Toast Notification Types
interface ToastProps {
  id?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Chart Types
interface ChartProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'scatter';
  data: ChartData;
  options?: ChartOptions;
  height?: number;
  'aria-label'?: string;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

// Athlete Card Types
interface AthleteCardProps {
  name: string;
  position: string;
  jerseyNumber?: number;
  photo?: string;
  stats: {
    sessions: number;
    performance: number;
    speed?: string;
  };
  lastSession?: string;
  trainingStreak?: number;
  onViewProfile?: () => void;
  onStartSession?: () => void;
}

// Session Timer Types
interface SessionTimerProps {
  startTime?: Date;
  exercise?: {
    name: string;
    duration: number;
    remaining: number;
  };
  onPause?: () => void;
  onStop?: () => void;
}

// Metric Card Types
interface MetricCardProps {
  value: string | number;
  label: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
  };
  comparison?: {
    label: string;
    value: string | number;
  };
}
```

### Usage Example

```typescript
import { Button, Card, Input, Modal } from '@flagfit/design-system';

function AthleteProfile() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleSave: ButtonProps['onClick'] = (event) => {
    event.preventDefault();
    // Save logic
  };
  
  return (
    <Card variant="elevated" padding="lg">
      <Input
        type="text"
        label="Athlete Name"
        placeholder="Enter name"
        required
        error={errors.name}
      />
      <Button
        variant="primary"
        size="md"
        onClick={handleSave}
        loading={isSaving}
      >
        Save Changes
      </Button>
    </Card>
  );
}
```

### Export Structure

```typescript
// design-system.d.ts
export * from './components/Button';
export * from './components/Card';
export * from './components/Input';
export * from './components/Select';
export * from './components/Modal';
export * from './components/Toast';
export * from './components/Chart';
export * from './components/AthleteCard';
export * from './components/SessionTimer';
export * from './components/MetricCard';
```

---

## Edge Case Patterns

**Status**: ✅ **New** - Production-ready patterns for real-world scenarios

Handling edge cases and uncommon scenarios that occur in production environments.

### Offline State Handling

**Status**: ✅ **Stable** - Production-ready

Patterns for handling network failures and offline states gracefully.

#### Offline Detection

```javascript
class OfflineHandler {
  constructor() {
    this.isOnline = navigator.onLine;
    this.init();
  }

  init() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  handleOnline() {
    this.isOnline = true;
    this.showToast({
      message: 'Connection restored. Syncing data...',
      type: 'success',
    });
    this.syncPendingChanges();
  }

  handleOffline() {
    this.isOnline = false;
    this.showToast({
      message: 'You\'re offline. Changes will sync when connection is restored.',
      type: 'warning',
      duration: 5000,
    });
  }

  async syncPendingChanges() {
    // Sync any pending changes from IndexedDB/localStorage
    const pending = await this.getPendingChanges();
    for (const change of pending) {
      try {
        await this.syncChange(change);
        await this.removePendingChange(change.id);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }
}
```

#### Offline UI Pattern

```html
<!-- Offline Banner -->
<div class="offline-banner" id="offline-banner" role="alert" aria-live="polite" hidden>
  <div class="offline-banner-content">
    <i data-lucide="wifi-off"></i>
    <span>You're offline. Some features may be unavailable.</span>
  </div>
</div>

<!-- Offline Indicator on Forms -->
<form class="form" id="training-form">
  <div class="form-group">
    <label for="session-name">Session Name</label>
    <input type="text" id="session-name" name="sessionName" required>
  </div>
  
  <div class="form-footer">
    <button type="submit" class="btn btn-primary">
      Save Session
    </button>
    <span class="offline-indicator" id="offline-indicator" hidden>
      <i data-lucide="wifi-off"></i>
      Will sync when online
    </span>
  </div>
</form>
```

```css
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--color-status-warning);
  color: var(--color-text-on-warning);
  padding: var(--space-3) var(--space-4);
  z-index: var(--z-index-toast);
  box-shadow: var(--shadow-md);
}

.offline-banner-content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  max-width: 1280px;
  margin: 0 auto;
}

.offline-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.offline-banner[hidden],
.offline-indicator[hidden] {
  display: none;
}
```

### Large Dataset Performance

**Status**: ✅ **Stable** - Production-ready

Optimizations for handling 1000+ items in dropdowns, tables, and lists.

#### Virtualized Dropdown

```javascript
class VirtualizedSelect {
  constructor(selectElement, options) {
    this.selectElement = selectElement;
    this.options = options; // Array of 1000+ items
    this.visibleCount = 10; // Show 10 at a time
    this.scrollPosition = 0;
    this.filteredOptions = options;
    
    this.init();
  }

  init() {
    // Render only visible items
    this.renderVisibleOptions();
    
    // Add search/filter
    this.addSearchInput();
    
    // Virtual scrolling
    this.setupVirtualScroll();
  }

  renderVisibleOptions() {
    const start = this.scrollPosition;
    const end = start + this.visibleCount;
    const visible = this.filteredOptions.slice(start, end);
    
    // Clear and render only visible items
    this.selectElement.innerHTML = '';
    visible.forEach(option => {
      this.selectElement.appendChild(this.createOptionElement(option));
    });
  }

  setupVirtualScroll() {
    this.selectElement.addEventListener('scroll', () => {
      const scrollTop = this.selectElement.scrollTop;
      const itemHeight = 40; // Height of each option
      const newPosition = Math.floor(scrollTop / itemHeight);
      
      if (newPosition !== this.scrollPosition) {
        this.scrollPosition = newPosition;
        this.renderVisibleOptions();
      }
    });
  }

  addSearchInput() {
    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search athletes...';
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      this.filteredOptions = this.options.filter(opt => 
        opt.label.toLowerCase().includes(query)
      );
      this.scrollPosition = 0;
      this.renderVisibleOptions();
    });
    
    this.selectElement.parentElement.insertBefore(
      searchInput,
      this.selectElement
    );
  }
}
```

#### Paginated Table

```javascript
class PaginatedTable {
  constructor(tableElement, data, pageSize = 50) {
    this.tableElement = tableElement;
    this.data = data;
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.totalPages = Math.ceil(data.length / pageSize);
    
    this.init();
  }

  init() {
    this.renderTable();
    this.renderPagination();
  }

  renderTable() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const pageData = this.data.slice(start, end);
    
    // Clear and render page data
    const tbody = this.tableElement.querySelector('tbody');
    tbody.innerHTML = '';
    
    pageData.forEach(row => {
      const tr = document.createElement('tr');
      // Build row...
      tbody.appendChild(tr);
    });
  }

  renderPagination() {
    // Pagination controls
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = this.currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderTable();
        this.renderPagination();
      }
    });
    
    // Page numbers
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = this.currentPage === this.totalPages;
    nextBtn.addEventListener('click', () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.renderTable();
        this.renderPagination();
      }
    });
    
    pagination.appendChild(prevBtn);
    pagination.appendChild(pageInfo);
    pagination.appendChild(nextBtn);
    
    // Replace existing pagination
    const existing = this.tableElement.parentElement.querySelector('.pagination');
    if (existing) existing.remove();
    this.tableElement.parentElement.appendChild(pagination);
  }
}
```

### Internationalization Hooks

**Status**: ✅ **Stable** - Production-ready

Support for RTL languages, date formats, and localization.

#### RTL Support

```css
/* RTL Layout Support */
[dir="rtl"] .athlete-header {
  flex-direction: row-reverse;
}

[dir="rtl"] .btn-icon {
  transform: scaleX(-1);
}

[dir="rtl"] .metric-comparison {
  flex-direction: row-reverse;
}

/* RTL-aware spacing */
.athlete-card {
  padding-inline-start: var(--space-6);
  padding-inline-end: var(--space-6);
}

/* RTL-aware borders */
.card {
  border-inline-start: 1px solid var(--color-border-secondary);
}
```

#### Date Formatting

```javascript
class DateFormatter {
  constructor(locale = 'en-US') {
    this.locale = locale;
  }

  formatDate(date, format = 'short') {
    const options = {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      time: { hour: '2-digit', minute: '2-digit' },
    };
    
    return new Intl.DateTimeFormat(this.locale, options[format]).format(date);
  }

  formatRelative(date) {
    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: 'auto' });
    const diff = date - Date.now();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (Math.abs(days) > 0) return rtf.format(days, 'day');
    if (Math.abs(hours) > 0) return rtf.format(hours, 'hour');
    if (Math.abs(minutes) > 0) return rtf.format(minutes, 'minute');
    return rtf.format(seconds, 'second');
  }
}

// Usage
const formatter = new DateFormatter('ar-SA'); // Arabic
formatter.formatDate(new Date()); // "٢٥ ديسمبر ٢٠٢٤"
```

### Print Stylesheets

**Status**: ✅ **Stable** - Production-ready

Optimized styles for printing training schedules, reports, and athlete profiles.

```css
/* Print Stylesheet */
@media print {
  /* Hide non-essential elements */
  .sidebar,
  .header,
  .btn,
  .navigation,
  .offline-banner {
    display: none !important;
  }

  /* Optimize layout for print */
  .layout-container {
    max-width: 100%;
    padding: 0;
  }

  /* Ensure proper page breaks */
  .card,
  .athlete-card,
  .session-card {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Print-specific spacing */
  .card {
    margin-bottom: var(--space-4);
    padding: var(--space-4);
    box-shadow: none;
    border: 1px solid #000;
  }

  /* Optimize colors for print */
  .metric-value,
  .timer-time {
    color: #000 !important;
  }

  /* Show URLs for links */
  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #666;
  }

  /* Page setup */
  @page {
    margin: 1cm;
    size: A4;
  }

  /* Avoid breaking tables */
  table {
    page-break-inside: avoid;
  }

  tr {
    page-break-inside: avoid;
  }

  /* Print headers/footers */
  .print-header {
    display: block;
    position: running(header);
  }

  .print-footer {
    display: block;
    position: running(footer);
  }

  @page {
    @top-center {
      content: element(header);
    }
    @bottom-center {
      content: element(footer);
    }
  }
}
```

#### Print-Specific HTML

```html
<!-- Print Header -->
<div class="print-header">
  <h1>Training Schedule - Week of December 25, 2024</h1>
  <p>FlagFit Pro Training Report</p>
</div>

<!-- Print Footer -->
<div class="print-footer">
  <p>Generated on <span id="print-date"></span></p>
  <p>Page <span class="page-number"></span> of <span class="total-pages"></span></p>
</div>

<script>
// Set print date
document.getElementById('print-date').textContent = new Date().toLocaleDateString();

// Print button
document.getElementById('print-btn').addEventListener('click', () => {
  window.print();
});
</script>
```

---

## Component Interaction Patterns

**Status**: ✅ **New** - Production-ready patterns for complex component combinations

Documentation for combining multiple components into complex interaction patterns.

### Modal with Form and Validation

**Pattern**: Modal containing a form with real-time validation and toast notifications.

```html
<div class="modal" id="add-athlete-modal">
  <div class="modal-content modal-lg">
    <div class="modal-header">
      <h2>Add New Athlete</h2>
      <button class="btn-icon" aria-label="Close modal" onclick="closeModal()">
        <i data-lucide="x"></i>
      </button>
    </div>
    
    <form class="form" id="add-athlete-form" onsubmit="handleSubmit(event)">
      <div class="form-group">
        <label for="athlete-name">Full Name *</label>
        <input 
          type="text" 
          id="athlete-name" 
          name="name"
          required
          onblur="validateField(this)"
          aria-describedby="name-error name-hint"
        />
        <span class="form-hint" id="name-hint">Enter athlete's full name</span>
        <span class="form-error" id="name-error" role="alert"></span>
      </div>
      
      <div class="form-group">
        <label for="athlete-position">Position *</label>
        <select id="athlete-position" name="position" required>
          <option value="">Select position</option>
          <option value="qb">Quarterback</option>
          <option value="wr">Wide Receiver</option>
          <!-- More options -->
        </select>
      </div>
      
      <div class="form-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" id="submit-btn">
          Add Athlete
        </button>
      </div>
    </form>
  </div>
</div>

<script>
function validateField(field) {
  const errorElement = document.getElementById(`${field.name}-error`);
  
  if (!field.validity.valid) {
    errorElement.textContent = field.validationMessage;
    field.classList.add('input-error');
  } else {
    errorElement.textContent = '';
    field.classList.remove('input-error');
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = document.getElementById('submit-btn');
  
  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';
  
  try {
    const formData = new FormData(form);
    const response = await fetch('/api/athletes', {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      // Show success toast
      showToast({
        message: 'Athlete added successfully',
        type: 'success',
      });
      
      // Close modal
      closeModal();
      
      // Refresh athlete list
      refreshAthleteList();
    } else {
      throw new Error('Failed to add athlete');
    }
  } catch (error) {
    showToast({
      message: 'Failed to add athlete. Please try again.',
      type: 'error',
    });
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Athlete';
  }
}
</script>
```

### DataTable with Selection and Bulk Actions

**Pattern**: Table with row selection, bulk actions, and toast notifications.

```html
<div class="card">
  <div class="card-header">
    <h3>Athletes</h3>
    <div class="card-actions">
      <button 
        class="btn btn-secondary btn-sm" 
        id="bulk-actions-btn"
        disabled
        onclick="showBulkActions()"
      >
        Actions (<span id="selected-count">0</span>)
      </button>
    </div>
  </div>
  
  <div class="data-table-container">
    <table class="data-table" id="athletes-table">
      <thead>
        <tr>
          <th>
            <input 
              type="checkbox" 
              id="select-all"
              onchange="toggleSelectAll(this)"
              aria-label="Select all athletes"
            />
          </th>
          <th>Name</th>
          <th>Position</th>
          <th>Performance</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <!-- Rows with checkboxes -->
        <tr>
          <td>
            <input 
              type="checkbox" 
              class="row-checkbox"
              data-athlete-id="1"
              onchange="updateSelection()"
            />
          </td>
          <td>Alex Johnson</td>
          <td>Quarterback</td>
          <td>85%</td>
          <td>
            <button class="btn-icon" onclick="editAthlete(1)">
              <i data-lucide="edit"></i>
            </button>
          </td>
        </tr>
        <!-- More rows -->
      </tbody>
    </table>
  </div>
</div>

<!-- Bulk Actions Dropdown -->
<div class="dropdown" id="bulk-actions-menu" hidden>
  <button class="dropdown-item" onclick="bulkDelete()">
    <i data-lucide="trash-2"></i>
    Delete Selected
  </button>
  <button class="dropdown-item" onclick="bulkExport()">
    <i data-lucide="download"></i>
    Export Selected
  </button>
</div>

<script>
let selectedIds = new Set();

function updateSelection() {
  const checkboxes = document.querySelectorAll('.row-checkbox:checked');
  selectedIds = new Set(Array.from(checkboxes).map(cb => cb.dataset.athleteId));
  
  const count = selectedIds.size;
  document.getElementById('selected-count').textContent = count;
  document.getElementById('bulk-actions-btn').disabled = count === 0;
}

function toggleSelectAll(checkbox) {
  const rowCheckboxes = document.querySelectorAll('.row-checkbox');
  rowCheckboxes.forEach(cb => {
    cb.checked = checkbox.checked;
  });
  updateSelection();
}

async function bulkDelete() {
  if (!confirm(`Delete ${selectedIds.size} athlete(s)?`)) return;
  
  try {
    const response = await fetch('/api/athletes/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    
    if (response.ok) {
      showToast({
        message: `${selectedIds.size} athlete(s) deleted successfully`,
        type: 'success',
      });
      selectedIds.clear();
      updateSelection();
      refreshTable();
    }
  } catch (error) {
    showToast({
      message: 'Failed to delete athletes',
      type: 'error',
    });
  }
}
</script>
```

### Stacked Toast Notifications

**Pattern**: Multiple toast notifications that stack vertically without overlapping.

```javascript
class ToastManager {
  constructor() {
    this.toasts = [];
    this.container = this.createContainer();
  }

  createContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container toast-container-top-right';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
    return container;
  }

  show(toast) {
    const id = Date.now().toString();
    const toastElement = this.createToastElement(id, toast);
    
    this.container.appendChild(toastElement);
    this.toasts.push({ id, element: toastElement });
    
    // Animate in
    requestAnimationFrame(() => {
      toastElement.classList.add('toast-visible');
    });
    
    // Auto-dismiss
    if (toast.duration !== 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, toast.duration || 5000);
    }
    
    return id;
  }

  createToastElement(id, toast) {
    const element = document.createElement('div');
    element.className = `toast toast-${toast.type}`;
    element.id = `toast-${id}`;
    element.setAttribute('role', 'alert');
    
    element.innerHTML = `
      <div class="toast-content">
        <i data-lucide="${this.getIcon(toast.type)}"></i>
        <span class="toast-message">${toast.message}</span>
      </div>
      ${toast.action ? `
        <button class="toast-action" onclick="toastManager.dismiss('${id}')">
          ${toast.action.label}
        </button>
      ` : ''}
      <button class="toast-close" onclick="toastManager.dismiss('${id}')" aria-label="Close">
        <i data-lucide="x"></i>
      </button>
    `;
    
    return element;
  }

  dismiss(id) {
    const toast = this.toasts.find(t => t.id === id);
    if (!toast) return;
    
    toast.element.classList.remove('toast-visible');
    setTimeout(() => {
      toast.element.remove();
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 300);
  }

  getIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'alert-circle',
      warning: 'alert-triangle',
      info: 'info',
    };
    return icons[type] || 'info';
  }
}

// Global instance
const toastManager = new ToastManager();

// Usage
toastManager.show({
  message: 'Athlete added successfully',
  type: 'success',
});

// Stacked toasts
toastManager.show({ message: 'First notification', type: 'info' });
toastManager.show({ message: 'Second notification', type: 'success' });
toastManager.show({ message: 'Third notification', type: 'warning' });
```

```css
.toast-container {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: var(--z-index-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 400px;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  opacity: 0;
  transform: translateX(100%);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-visible {
  opacity: 1;
  transform: translateX(0);
}

/* Prevent overlap on small screens */
@media (max-width: 768px) {
  .toast-container {
    left: var(--space-4);
    right: var(--space-4);
    max-width: none;
  }
}
```

---

## Performance Guidelines

**Status**: ✅ **Stable** - Production-ready

Performance optimization strategies and budgets to ensure fast, responsive user experiences.

### Performance Budgets

#### CSS Performance

| Metric             | Budget           | Notes                 |
| ------------------ | ---------------- | --------------------- |
| **Total CSS Size** | < 30KB (gzipped) | Target: 30KB with critical CSS extraction (improved from 50KB) |
| **Critical CSS**   | < 14KB (gzipped) | Above-the-fold styles |
| **CSS Selectors**  | < 4096 per file  | Browser limit         |
| **CSS Variables**  | < 1000           | Performance impact    |

#### Performance Optimizations

**CSS Containment**

Use CSS containment to isolate component rendering and improve performance:

```css
/* Component isolation for better performance */
.component {
  contain: layout style paint;
}

/* For components with complex content */
.card {
  contain: layout style;
}

/* For components that don't affect layout */
.metric-value {
  contain: style;
}

/* For isolated components (modals, dropdowns) */
.modal,
.dropdown {
  contain: strict; /* layout style paint size */
}
```

**Critical CSS Extraction**

Extract and inline critical CSS for above-the-fold content:

```html
<!-- Inline critical CSS in <head> -->
<style>
  /* Critical CSS: Header, navigation, first card */
  .header { /* ... */ }
  .nav { /* ... */ }
  .card:first-child { /* ... */ }
</style>

<!-- Load non-critical CSS asynchronously -->
<link rel="preload" href="/css/design-system.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/css/design-system.css"></noscript>
```

**CSS Loading Strategy**

```html
<!-- 1. Inline critical CSS -->
<style>
  /* Critical styles here */
</style>

<!-- 2. Preload main stylesheet -->
<link rel="preload" href="/css/main.css" as="style">

<!-- 3. Load main stylesheet -->
<link rel="stylesheet" href="/css/main.css">

<!-- 4. Load non-critical CSS asynchronously -->
<link rel="preload" href="/css/components.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/css/components.css"></noscript>
```

**Component-Level Performance**

```css
/* Use will-change sparingly for animated elements */
.animated-card {
  will-change: transform;
  transition: transform 0.3s ease;
}

/* Use transform instead of position for animations */
.slide-in {
  transform: translateX(0);
  transition: transform 0.3s ease;
}

.slide-in-hidden {
  transform: translateX(-100%);
}

/* Optimize repaints with transform and opacity */
.fade-in {
  opacity: 1;
  transform: scale(1);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

/* GPU acceleration for smooth animations */
.smooth-animation {
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

#### JavaScript Performance

| Metric                    | Budget               | Notes                  |
| ------------------------- | -------------------- | ---------------------- |
| **Total JS Size**         | < 100KB (gzipped)    | All component JS       |
| **Component JS**          | < 10KB per component | Individual components  |
| **Third-party Libraries** | < 50KB (gzipped)     | Chart.js, Lucide, etc. |
| **Initialization Time**   | < 100ms              | Component setup        |

#### Loading Performance

| Metric                             | Budget  | Target |
| ---------------------------------- | ------- | ------ |
| **First Contentful Paint (FCP)**   | < 1.5s  | < 1.0s |
| **Largest Contentful Paint (LCP)** | < 2.5s  | < 1.8s |
| **Time to Interactive (TTI)**      | < 3.5s  | < 2.5s |
| **Cumulative Layout Shift (CLS)**  | < 0.1   | < 0.05 |
| **First Input Delay (FID)**        | < 100ms | < 50ms |

#### Lighthouse Scores

| Category           | Minimum | Target |
| ------------------ | ------- | ------ |
| **Performance**    | 80      | 90+    |
| **Accessibility**  | 95      | 100    |
| **Best Practices** | 90      | 100    |
| **SEO**            | 90      | 100    |

### Optimization Strategies

#### CSS Optimization

**1. Critical CSS Extraction**

```html
<!-- Inline critical CSS in <head> -->
<style>
  /* Critical above-the-fold styles */
  .btn-primary {
    /* ... */
  }
  .card {
    /* ... */
  }
</style>

<!-- Load non-critical CSS asynchronously -->
<link
  rel="preload"
  href="./src/design-system.css"
  as="style"
  onload="this.onload=null;this.rel='stylesheet'"
/>
```

**2. CSS Minification**

```bash
# Use CSS minifier
npm install -g clean-css-cli
cleancss -o design-system.min.css design-system.css
```

**3. Remove Unused CSS**

```bash
# Use PurgeCSS to remove unused styles
npm install @fullhuman/postcss-purgecss
```

**4. CSS Variable Optimization**

```css
/* ✅ Good: Use semantic tokens */
.button {
  background: var(--color-brand-primary);
}

/* ❌ Bad: Multiple primitive tokens */
.button {
  background: var(--primitive-primary-500);
  color: var(--primitive-neutral-900);
  padding: var(--primitive-space-16);
}
```

#### JavaScript Optimization

**1. Code Splitting**

```javascript
// Lazy load components
const Modal = await import("./components/modal.js");
const DataTable = await import("./components/data-table.js");
```

**2. Tree Shaking**

```javascript
// ✅ Good: Import only what you need
import { showToast } from "./toast-manager.js";

// ❌ Bad: Import entire library
import * as ToastManager from "./toast-manager.js";
```

**3. Debouncing & Throttling**

```javascript
// Debounce search input
let debounceTimer;
searchInput.addEventListener("input", (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    performSearch(e.target.value);
  }, 300);
});

// Throttle scroll events
let throttleTimer;
window.addEventListener("scroll", () => {
  if (!throttleTimer) {
    throttleTimer = setTimeout(() => {
      handleScroll();
      throttleTimer = null;
    }, 100);
  }
});
```

**4. Event Delegation**

```javascript
// ✅ Good: Single event listener
document.addEventListener("click", (e) => {
  if (e.target.matches(".btn")) {
    handleButtonClick(e.target);
  }
});

// ❌ Bad: Multiple event listeners
document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("click", handleButtonClick);
});
```

#### Asset Optimization

**1. Image Optimization**

```html
<!-- Use modern formats -->
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Description" loading="lazy" />
</picture>
```

**2. Font Loading**

```html
<!-- Preload critical fonts -->
<link
  rel="preload"
  href="/fonts/inter.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>

<!-- Use font-display: swap -->
<link
  href="https://fonts.googleapis.com/css2?family=Inter&display=swap"
  rel="stylesheet"
/>
```

**3. Icon Optimization**

```javascript
// ✅ Good: Load icons on demand
import { createIcon } from "lucide";
createIcon("football");

// ❌ Bad: Load entire icon library
import * as lucide from "lucide";
```

### Lazy Loading Patterns

#### Component Lazy Loading

```javascript
// Lazy load heavy components
const loadChart = async () => {
  const { Chart } = await import("chart.js");
  // Initialize chart
};

// Load when component becomes visible
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      loadChart();
      observer.unobserve(entry.target);
    }
  });
});

observer.observe(document.querySelector(".chart-container"));
```

#### Data Lazy Loading

```javascript
// Load data in chunks
async function loadAthletes(page = 1, limit = 20) {
  const response = await fetch(`/api/athletes?page=${page}&limit=${limit}`);
  return response.json();
}

// Infinite scroll
let currentPage = 1;
window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 1000
  ) {
    loadAthletes(++currentPage);
  }
});
```

### Performance Monitoring

#### Web Vitals Tracking

```javascript
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

function sendToAnalytics(metric) {
  // Send to analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

#### Performance Budget Monitoring

```javascript
// Check if performance budget is met
const performanceBudget = {
  fcp: 1500,
  lcp: 2500,
  cls: 0.1,
};

function checkPerformanceBudget() {
  const perfData = performance.getEntriesByType("navigation")[0];
  const fcp = perfData.responseEnd - perfData.fetchStart;

  if (fcp > performanceBudget.fcp) {
    console.warn(`FCP exceeded budget: ${fcp}ms > ${performanceBudget.fcp}ms`);
  }
}
```

### Best Practices

#### ✅ Do

- **Minify CSS and JavaScript** in production
- **Use CSS custom properties** for theming (better than multiple CSS files)
- **Lazy load** heavy components and data
- **Debounce/throttle** frequent events (scroll, resize, input)
- **Use event delegation** for dynamic content
- **Optimize images** (WebP, AVIF, lazy loading)
- **Preload critical resources** (fonts, critical CSS)
- **Monitor performance** in production

#### ❌ Don't

- **Don't inline** large CSS/JS in HTML
- **Don't load** entire libraries when you only need one function
- **Don't use** `!important` excessively (increases CSS size)
- **Don't create** too many CSS variables (performance impact)
- **Don't block** rendering with synchronous scripts
- **Don't load** all icons upfront
- **Don't ignore** performance budgets

### Performance Checklist

Before deploying, verify:

- [ ] CSS is minified and gzipped (< 50KB)
- [ ] JavaScript is minified and gzipped (< 100KB)
- [ ] Images are optimized (WebP/AVIF where possible)
- [ ] Fonts use `font-display: swap`
- [ ] Critical CSS is inlined
- [ ] Non-critical CSS loads asynchronously
- [ ] Components lazy load when appropriate
- [ ] Lighthouse Performance score > 80
- [ ] Core Web Vitals meet budgets
- [ ] No layout shift (CLS < 0.1)

## Versioning & Changelog

### Semantic Versioning Strategy

The design system follows [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH):

- **MAJOR (1.0.0 → 2.0.0)**: Breaking changes requiring migration
  - Component API changes
  - Removed components or classes
  - CSS variable name changes
  - Requires migration guide

- **MINOR (1.0.0 → 1.1.0)**: New features, backward compatible
  - New components
  - New variants or sizes
  - New CSS variables (additive only)
  - No breaking changes

- **PATCH (1.0.0 → 1.0.1)**: Bug fixes, no breaking changes
  - Bug fixes
  - Accessibility improvements
  - Performance optimizations
  - Documentation updates

### Component Status Matrix

| Status         | Description                              | Usage                           |
| -------------- | ---------------------------------------- | ------------------------------- |
| **Stable**     | Production-ready, fully documented       | ✅ Use in production            |
| **Preview**    | Feature-complete, may have minor changes | ⚠️ Use with caution, may change |
| **Draft**      | In development, API may change           | ❌ Do not use in production     |
| **Deprecated** | Will be removed in next major version    | ⚠️ Migrate to replacement       |

### Changelog

#### Version 1.0.0 (Current - November 2025)

**Initial Stable Release**

##### Added

- ✅ Green theme color palette (#10c96b primary)
- ✅ Lucide icon integration
- ✅ Bento grid layout system
- ✅ Toast notification component
- ✅ Skeleton screen loading patterns
- ✅ Breadcrumb navigation component
- ✅ Pagination component
- ✅ Alert banner component
- ✅ Comprehensive error handling patterns
- ✅ Dark/light theme toggle with system preference detection
- ✅ Complete spacing system (4px base unit)
- ✅ Responsive breakpoints for all devices

##### Changed

- ✅ Replaced purple/blue colors with green theme
- ✅ Updated dark theme contrast ratios for WCAG AA compliance
- ✅ Migrated from emoji icons to Lucide icons

##### Deprecated

- None (initial stable release)

##### Breaking Changes

- None (initial stable release)

### Migration Guides

Migration guides are provided for major version updates. Each guide includes:

- List of breaking changes
- Step-by-step migration instructions
- Code examples (before/after)
- Timeline and deprecation notices

_No migration guides available yet (initial release)_

## Governance

### Design System Team

- **Design Lead**: Maintains design consistency and component specifications
- **Engineering Lead**: Ensures technical implementation quality
- **Accessibility Expert**: Reviews all components for WCAG compliance
- **Product Representative**: Validates user needs and business requirements

### Contribution Process

#### Step 1: Proposal Phase

**Submit RFC (Request for Comments)** with:

- **Problem Statement**: What problem does this solve?
- **Proposed Solution**: Component design, API, and usage
- **Use Cases**: 3+ real-world scenarios where this component is needed
- **Design Mockups**: Visual design and variants
- **Accessibility Considerations**: How will this meet WCAG AA standards?

**Proposal Template:**

```markdown
## Component Proposal: [Component Name]

### Problem Statement

[Describe the problem this component solves]

### Proposed Solution

[Describe the component, its variants, and API]

### Use Cases

1. [Use case 1]
2. [Use case 2]
3. [Use case 3]

### Design Mockups

[Link to Figma or images]

### Accessibility Plan

[How will this meet WCAG AA standards?]
```

#### Step 2: Evaluation

Design system team reviews against criteria:

**Acceptance Criteria:**

- ✅ Used in 3+ product teams or pages
- ✅ Meets WCAG AA accessibility standards
- ✅ Has clear use cases not solved by existing components
- ✅ Aligns with design principles and brand identity
- ✅ Has documented API and usage guidelines
- ✅ Reusable across multiple contexts

**Review Process:**

1. Design team validates visual consistency
2. Engineering team reviews technical feasibility
3. Accessibility expert verifies WCAG compliance
4. Product representative validates user needs

#### Step 3: Kick-off Meeting

**Scope Agreement:**

- Finalize component specifications
- Define timeline and milestones
- Identify stakeholders
- Assign designer + developer pair

**Deliverables:**

- Design specifications (Figma)
- Technical implementation plan
- Testing strategy
- Documentation outline

#### Step 4: Development Phase

**Designer Responsibilities:**

- Create detailed design specifications
- Design all variants and states
- Ensure visual consistency
- Provide design assets

**Developer Responsibilities:**

- Implement component with accessibility in mind
- Write clean, maintainable code
- Add unit tests
- Document API and usage

**Regular Check-ins:**

- Weekly sync meetings
- Design reviews at key milestones
- Code reviews before merge

#### Step 5: Review & Testing

**Accessibility Audit:**

- ✅ Keyboard navigation works
- ✅ Screen reader announces correctly
- ✅ Color contrast meets AA standards
- ✅ Focus indicators visible
- ✅ ARIA attributes correct

**Code Review:**

- Code quality and maintainability
- Performance considerations
- Browser compatibility
- Responsive behavior

**Visual Regression Tests:**

- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Device testing (mobile, tablet, desktop)
- Dark/light theme verification

#### Step 6: Documentation

**Required Documentation:**

- Usage guidelines with examples
- Do/don't visual examples
- Code snippets (HTML, CSS, JavaScript)
- Component API reference
- Accessibility notes
- Migration guide (if replacing existing component)

#### Step 7: Release

**Pre-Release Checklist:**

- [ ] Component tested and reviewed
- [ ] Documentation complete
- [ ] Changelog updated
- [ ] Version incremented
- [ ] Migration guide created (if breaking change)

**Release Process:**

1. Merge to main branch
2. Update version number
3. Update changelog
4. Tag release in version control
5. Announce to team (Slack, email)
6. Update design system documentation site

### Communication Channels

- **Slack**: `#design-system` for quick questions and discussions
- **GitHub Issues**: Feature requests and bug reports
- **GitHub Pull Requests**: Code contributions and reviews
- **Office Hours**: Weekly Q&A sessions (Thursdays 2-3 PM)
- **Design System Meetings**: Bi-weekly team sync

### Version Control

- **Major**: Breaking changes requiring migration
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes and minor improvements

### Maintenance Schedule

- **Weekly**: Component audits and issue triage
- **Monthly**: Accessibility testing and validation
- **Quarterly**: Performance optimization and cleanup
- **Annually**: Major version planning and architecture review

## Support & Resources

### Getting Help

- **Slack**: #design-system for quick questions
- **GitHub**: Issues and feature requests
- **Documentation Site**: Comprehensive guides and examples
- **Office Hours**: Weekly Q&A sessions

### Additional Resources

- **Figma Library**: Design components and tokens
- **Storybook**: Interactive component documentation
- **Code Examples**: GitHub repository with implementation examples
- **Video Tutorials**: Step-by-step implementation guides

## Theme Toggle Switch

### Implementation

The theme toggle switch allows users to manually switch between light and dark modes, with preference persistence via localStorage.

### HTML Structure

```html
<div class="theme-toggle-container">
  <label class="theme-toggle-label" title="Toggle Light/Dark Mode">
    <input
      type="checkbox"
      id="theme-toggle"
      class="theme-toggle-input"
      checked
    />
    <span class="theme-toggle-slider"></span>
    <span class="theme-toggle-text">Dark</span>
  </label>
</div>
```

### JavaScript Integration

The `theme-switcher.js` automatically:

- Detects system preference on first visit
- Saves user preference to localStorage
- Applies theme across all pages
- Updates toggle state and text

### Theme Files

- `dark-theme.css` - Dark mode styles (always loaded)
- `light-theme.css` - Light mode styles (loaded when needed)
- Both themes are WCAG AA compliant with verified contrast ratios

## Recent Updates (November 9, 2025)

### ✅ Completed Today

1. **Green Theme Implementation**: All colors migrated from purple/blue to green theme
2. **Theme Toggle Switch**: Manual light/dark mode toggle added to all pages
3. **Lucide Icons**: Replaced all emoji icons with modern Lucide icons
4. **Dark Theme Revamp**: Production-ready CSS with no unnecessary `!important`
5. **Light Theme Revamp**: Complete WCAG AA compliant light mode
6. **Responsive Design**: Comprehensive breakpoints for all devices (iPhone, Samsung, iPad)
7. **Accessibility**: Full focus states, reduced motion, high contrast support
8. **Touch Optimization**: 44px minimum touch targets, 16px input fonts

### 🎨 Color System Updates

- **Primary**: Green (`#10c96b`) instead of Indigo/Purple
- **Secondary**: Lime Green (`#89c300`)
- **Tertiary**: Gold/Warm (`#cc9610`)
- All purple, blue, and pink colors replaced with green theme
- All colors use CSS variables for maintainability

### 📱 Responsive Design

- **Mobile Small** (320px - 480px): iPhone SE, Small Android
- **Mobile Medium** (481px - 768px): iPhone 12/13/14, Samsung Galaxy
- **Tablet Portrait** (769px - 1024px): iPad, iPad Mini
- **Tablet Landscape** (1025px - 1280px): iPad Pro landscape
- **Large Desktop** (1281px+): Desktop monitors
- Touch device optimizations
- Landscape orientation support

### ♿ Accessibility Improvements

- WCAG AA compliant contrast ratios (all verified)
- `:focus-visible` states on all interactive elements
- `prefers-reduced-motion` support
- `prefers-contrast: more` high contrast mode
- System preference detection (`prefers-color-scheme`)
- 16px minimum font size on inputs (prevents iOS zoom)
- 44px minimum touch targets

---

## Browser Compatibility Matrix

### Supported Browsers

The FlagFit Pro Design System is tested and supported on the following browsers:

| Browser              | Version           | Desktop | Mobile | Notes                       |
| -------------------- | ----------------- | ------- | ------ | --------------------------- |
| **Chrome**           | Latest 2 versions | ✅      | ✅     | Primary development browser |
| **Firefox**          | Latest 2 versions | ✅      | ✅     | Full support                |
| **Safari**           | Latest 2 versions | ✅      | ✅     | iOS 14+                     |
| **Edge**             | Latest 2 versions | ✅      | ✅     | Chromium-based              |
| **Samsung Internet** | Latest 2 versions | ❌      | ✅     | Android devices             |
| **Opera**            | Latest 2 versions | ✅      | ❌     | Limited testing             |

### Feature Support Matrix

| Feature                  | Chrome | Firefox | Safari | Edge | Samsung Internet |
| ------------------------ | ------ | ------- | ------ | ---- | ---------------- |
| CSS Grid                 | ✅     | ✅      | ✅     | ✅   | ✅               |
| CSS Custom Properties    | ✅     | ✅      | ✅     | ✅   | ✅               |
| Flexbox                  | ✅     | ✅      | ✅     | ✅   | ✅               |
| `prefers-color-scheme`   | ✅     | ✅      | ✅     | ✅   | ✅               |
| `prefers-reduced-motion` | ✅     | ✅      | ✅     | ✅   | ✅               |
| `:focus-visible`         | ✅     | ✅      | ✅     | ✅   | ⚠️ Partial       |
| CSS `backdrop-filter`    | ✅     | ✅      | ✅     | ✅   | ⚠️ Partial       |

### Known Issues

#### Safari

- **Issue**: CSS custom properties in `calc()` may require fallbacks
- **Workaround**: Provide fallback values for critical calculations
- **Status**: Minor, non-blocking

#### Samsung Internet

- **Issue**: `:focus-visible` support is partial
- **Workaround**: Use `:focus` as fallback
- **Status**: Handled with fallback styles

#### Internet Explorer

- **Status**: ❌ Not supported
- **Reason**: IE11 reached end-of-life in June 2022
- **Recommendation**: Use modern browsers only

### Testing Strategy

- **Automated Testing**: Cross-browser testing with BrowserStack
- **Manual Testing**: Weekly checks on latest browser versions
- **Device Testing**: Physical devices for mobile browsers
- **Accessibility Testing**: Screen readers on all supported browsers

### Progressive Enhancement

The design system follows progressive enhancement principles:

1. **Core Functionality**: Works without JavaScript
2. **Enhanced Experience**: JavaScript adds interactivity
3. **Modern Features**: CSS Grid, Custom Properties enhance layout
4. **Fallbacks**: Graceful degradation for older browsers

### Browser-Specific Considerations

#### Mobile Safari (iOS)

- **Viewport**: Use `viewport-fit=cover` for safe areas
- **Touch Targets**: Minimum 44px enforced
- **Input Zoom**: 16px minimum font size prevents zoom
- **Scroll Behavior**: Smooth scrolling may need `-webkit-overflow-scrolling: touch`

#### Chrome Mobile

- **Performance**: Optimized for Chrome's rendering engine
- **PWA Support**: Full Progressive Web App support

#### Firefox

- **CSS Grid**: Excellent support, no issues
- **Custom Properties**: Full support

## Writing Guidelines

### Voice & Tone

The FlagFit Pro design system uses an **encouraging, clear, and action-oriented** voice that motivates athletes while providing clear guidance.

#### Core Principles

1. **Encouraging**: Support athletes in their training journey
   - ✅ "Great progress this week!"
   - ❌ "You're behind schedule"

2. **Clear**: Use plain language, avoid jargon
   - ✅ "Training session saved successfully"
   - ❌ "Data persistence operation completed"

3. **Action-Oriented**: Tell users what they can do
   - ✅ "Add your first athlete to get started"
   - ❌ "No athletes found"

4. **Concise**: Get to the point quickly
   - ✅ "Password must be at least 8 characters"
   - ❌ "The password field requires a minimum of 8 characters to ensure security"

### Button Labels

#### Guidelines

- Use action verbs (Save, Delete, Cancel, Add)
- Be specific (Save Changes, not Submit)
- Match user intent (Start Training, not Begin)
- Keep labels short (2-3 words max)

#### Examples

| Context         | ✅ Good        | ❌ Bad                   |
| --------------- | -------------- | ------------------------ |
| Form submission | Save Changes   | Submit                   |
| Confirmation    | Delete Session | OK                       |
| Navigation      | View Profile   | Click Here               |
| Creation        | Add Athlete    | Create New Athlete Entry |

### Error Messages

#### Structure

1. **What went wrong** (clear statement)
2. **Why it happened** (brief explanation)
3. **What to do** (actionable guidance)

#### Examples

✅ **Good:**

- "Training date cannot be in the past. Please select a future date."
- "Password must be at least 8 characters. Add more characters to continue."
- "This athlete is already in your roster. Try adding a different athlete."

❌ **Bad:**

- "Invalid input"
- "Error 500"
- "You did something wrong"
- "The system encountered an error processing your request"

### Success Messages

#### Guidelines

- Confirm what happened
- Be specific about the action
- Keep it brief

#### Examples

✅ **Good:**

- "Training session saved successfully"
- "Athlete added to roster"
- "Profile updated"

❌ **Bad:**

- "Success!"
- "Done"
- "Operation completed"

### Empty States

#### Structure

1. **Icon/Illustration** (visual context)
2. **Headline** (what's missing)
3. **Description** (why it's empty, what to do)
4. **Action Button** (how to fix it)

#### Examples

✅ **Good:**

```
No athletes in roster
Get started by adding your first athlete to track their training progress.
[Add First Athlete]
```

❌ **Bad:**

```
No data
There is nothing here.
[OK]
```

### Tooltips & Help Text

#### Guidelines

- Answer "What is this?" or "How do I use this?"
- Keep to one sentence
- Use plain language

#### Examples

✅ **Good:**

- "Performance score based on training completion and metrics"
- "Click to view detailed training history"
- "Select multiple athletes for bulk actions"

❌ **Bad:**

- "This is a performance metric"
- "Click here"
- "Multi-select functionality"

### Form Labels & Hints

#### Labels

- Be descriptive and specific
- Use sentence case
- Include units when relevant

#### Hints

- Provide context or examples
- Show format requirements
- Explain why information is needed

#### Examples

✅ **Good:**

```
Training Date *
Select a future date for your training session
[Date picker]
```

❌ **Bad:**

```
Date *
[Date picker]
```

### Microcopy Library

Common phrases used throughout the application:

#### Actions

- "Save Changes"
- "Cancel"
- "Delete"
- "Add [Item]"
- "Edit"
- "View Details"
- "Start Training"
- "End Session"

#### Status Messages

- "Loading..."
- "Saving..."
- "Processing..."
- "Success"
- "Error"
- "Warning"

#### Navigation

- "Dashboard"
- "Training Schedule"
- "Roster"
- "Performance Analytics"
- "Settings"

#### Data Labels

- "Performance Score"
- "Training Sessions"
- "Completion Rate"
- "Last Updated"
- "Created"

### Accessibility in Writing

#### Guidelines

- Use descriptive link text ("View training history" not "Click here")
- Provide context for screen readers
- Use headings hierarchically
- Label form fields clearly
- Provide alternative text for images

#### Examples

✅ **Good:**

```html
<a href="/training/history">View training history</a>
<img
  src="chart.png"
  alt="Performance chart showing 15% improvement over 12 weeks"
/>
```

❌ **Bad:**

```html
<a href="/training/history">Click here</a> <img src="chart.png" alt="Chart" />
```

### Content Checklist

Before publishing any UI copy, verify:

- [ ] Uses encouraging, clear language
- [ ] Action-oriented (tells user what to do)
- [ ] Concise (one sentence when possible)
- [ ] No technical jargon
- [ ] Proper grammar and spelling
- [ ] Accessible (descriptive links, alt text)
- [ ] Consistent with design system voice
- [ ] Matches user's mental model

---

## Roadmap

### Phase 1: Foundation (Weeks 1-2) - Critical Priority

**Goal**: Establish version control, contribution process, and critical feedback mechanisms

**Deliverables:**

- ✅ Versioning Strategy (Semantic versioning implemented)
- ✅ Contribution Process (Workflow documented)
- ✅ Toast Notifications (Component documented)
- ✅ Skeleton Screens (Patterns documented)
- ✅ Error Handling Patterns (Comprehensive guidelines added)

**Status**: ✅ **COMPLETE**

### Phase 2: Essential Components (Weeks 3-6) - High Priority

**Goal**: Add navigation, form, and data display components critical for app functionality

**Deliverables:**

- ✅ Navigation: Breadcrumbs, Pagination (Documented)
- ⏳ Forms: Dropdown/Select with search, Date/Time picker, Multiselect
- ⏳ Data Display: Table/Data Grid with sorting and filtering
- ✅ Feedback: Alert/Banner component (Documented)
- ⏳ Data Visualization: Chart guidelines and 3-4 core chart types

**Status**: 🟡 **IN PROGRESS** (2/5 complete)

**Next Steps:**

1. Implement Date/Time picker component
2. Create Table/Data Grid component
3. Add data visualization guidelines

### Phase 3: Enhanced Components (Weeks 7-10) - Medium Priority

**Goal**: Polish user experience with additional components and patterns

**Deliverables:**

- ⏳ Additional Components: Tooltip, Avatar, Accordion, Empty States
- ⏳ UX Patterns: Loading patterns, Search patterns
- ⏳ Documentation: Add code examples to all components
- ⏳ Testing: Component testing guidelines

**Status**: ⏳ **PLANNED**

### Phase 4: Polish & Optimization (Weeks 11-14) - Medium/Low Priority

**Goal**: Complete the system with remaining components and content guidelines

**Deliverables:**

- ⏳ File Upload component
- ⏳ Progress Bar component
- ⏳ Onboarding patterns
- ⏳ Writing guidelines and microcopy library
- ⏳ Browser compatibility matrix
- ⏳ Migration guides for future versions

**Status**: ⏳ **PLANNED**

### Quick Wins (Completed)

These high-impact items have been completed:

- ✅ **Versioning & Changelog**: Semantic versioning and changelog added
- ✅ **Toast Notifications**: Component documented with examples
- ✅ **Skeleton Screens**: Loading patterns documented
- ✅ **Breadcrumbs**: Navigation component documented
- ✅ **Error Handling**: Comprehensive patterns and guidelines added

### Measuring Success

Track these metrics to know your design system is improving:

- **Adoption Rate**: % of product teams using design system
- **Component Coverage**: % of UI built from design system components
- **Contribution Volume**: # of contributions per quarter
- **Time to Implement**: Average hours to build new feature with system
- **Consistency Score**: % of UI matching design system specifications
- **Developer Satisfaction**: Survey score from engineering team

### Immediate Next Actions

**This Week:**

1. Implement Date/Time picker component (8-12 hours)
2. Create Table/Data Grid component (12-16 hours)
3. Add data visualization guidelines (8-12 hours)

**Next Quarter:**

1. Complete Phase 2 roadmap (essential components)
2. Add data visualization guidelines (critical for performance app)
3. Expand navigation components (tabs, accordion)
4. Enhance documentation with code examples for every component
5. Build contribution culture by welcoming first external contribution

---

_This documentation is maintained by the FlagFit Pro Design System team. Last updated: December 2024_

## Recent Updates (December 2024)

### Component Library - 100% Complete

- ✅ All 23 core components implemented (8 atoms, 8 molecules, 4 organisms, 3 templates)
- ✅ Component library showcase page created (`component-library.html`)
- ✅ All components include HTML markup, README documentation, and examples
- ✅ Tabs and Accordion components moved from Preview to Stable status
- ✅ Alert and Modal components implemented (CSS existed, HTML added)
- ✅ Form components complete (Textarea, Select, Checkbox, Radio)
