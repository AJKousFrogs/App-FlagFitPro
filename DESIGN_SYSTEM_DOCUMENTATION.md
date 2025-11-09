# FlagFit Pro - Comprehensive Design System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Design Token Architecture](#design-token-architecture)
4. [Typography System](#typography-system)
5. [Color System](#color-system)
6. [Spacing & Layout](#spacing--layout)
7. [Component Library](#component-library)
8. [Icon System](#icon-system)
9. [Motion & Animation](#motion--animation)
10. [Accessibility](#accessibility)
11. [Implementation Guide](#implementation-guide)
12. [Governance](#governance)

## Overview

The FlagFit Pro Design System is a comprehensive, semantic token-based design framework built for Olympic-level flag football training applications. It provides a scalable, accessible, and maintainable foundation for creating consistent user experiences across all touchpoints.

### Key Features
- **Semantic Token Architecture**: Two-tier system with primitive and semantic tokens
- **Complete Component Library**: 20+ production-ready components with multiple variants
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

## Typography System

### Font Families
- **Primary**: `'Inter'` - Optimized for UI text, excellent readability at small sizes
- **Display**: `'Poppins'` - Used for headings and hero text
- **Monospace**: `'SF Mono'` - Code snippets and data tables

### Typography Scale
Our typography system uses semantic sizing that adapts to context:

| Size | Use Case | Font Size | Line Height |
|------|----------|-----------|-------------|
| `display-2xl` | Hero sections | 72px | 1.0 |
| `display-xl` | Page headers | 60px | 1.0 |
| `heading-xl` | Section headers | 30px | 1.25 |
| `heading-lg` | Subsection headers | 24px | 1.25 |
| `heading-md` | Component titles | 20px | 1.375 |
| `body-lg` | Large body text | 18px | 1.625 |
| `body-md` | Standard body text | 16px | 1.5 |
| `body-sm` | Supporting text | 14px | 1.5 |
| `caption` | Small details | 12px | 1.375 |

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

### 8-Point Grid System
All spacing follows an 8-point grid for visual consistency and easier development:

```css
--primitive-space-8: 0.5rem;    /* 8px */
--primitive-space-16: 1rem;     /* 16px */
--primitive-space-24: 1.5rem;   /* 24px */
--primitive-space-32: 2rem;     /* 32px */
```

### Semantic Spacing
```css
--spacing-component-xs: var(--primitive-space-8);
--spacing-component-md: var(--primitive-space-16);
--spacing-layout-lg: var(--primitive-space-48);
```

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

## Component Library

### Button System
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

```html
<!-- Primary action button -->
<button class="btn btn-primary btn-md">Start Training</button>

<!-- Secondary action -->
<button class="btn btn-secondary btn-md">View Stats</button>

<!-- Tertiary action -->
<button class="btn btn-tertiary btn-sm">Learn More</button>
```

### Form Components
Complete form system with validation states:

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

```html
<!-- Form group with error state -->
<div class="form-group">
  <label class="form-label required">Email Address</label>
  <input type="email" class="form-input error" value="invalid-email">
  <div class="form-error">Please enter a valid email address</div>
</div>
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
Accessible dialog components:

```html
<div class="modal-overlay">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Confirm Action</h2>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to delete this training session?</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-error">Delete</button>
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
--icon-color-primary: #ffffff;      /* White - default */
--icon-color-secondary: #a0a0a0;    /* Light gray - secondary */
--icon-color-muted: #6b6b6b;        /* Muted gray - inactive */
--icon-color-accent: #10c96b;       /* Green - active/hover */
```

### Icon Sizes
```css
--icon-size-xs: 12px;  /* Compact UI */
--icon-size-sm: 16px;  /* Inline text */
--icon-size-md: 20px;  /* Standard UI */
--icon-size-lg: 24px;  /* Prominent actions */
--icon-size-xl: 32px;  /* Headers */
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
--motion-duration-instant: 75ms;   /* State changes */
--motion-duration-fast: 150ms;     /* Hover effects */
--motion-duration-normal: 200ms;   /* Component transitions */
--motion-duration-slow: 300ms;     /* Layout changes */
```

### Easing Functions
```css
--motion-easing-entrance: cubic-bezier(0, 0, 0.2, 1);     /* Elements entering */
--motion-easing-exit: cubic-bezier(0.4, 0, 1, 1);        /* Elements exiting */
--motion-easing-standard: cubic-bezier(0.4, 0, 0.2, 1);  /* General transitions */
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

## Implementation Guide

### Getting Started

1. **Include the CSS files**:
```html
<link rel="stylesheet" href="./src/ui-design-system.css">
<link rel="stylesheet" href="./src/dark-theme.css">
<link rel="stylesheet" href="./src/light-theme.css" id="light-theme" disabled>
<link rel="stylesheet" href="./src/hover-effects.css">
```

2. **Add font imports**:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

3. **Add Lucide Icons and Theme Switcher**:
```html
<script src="https://unpkg.com/lucide@latest"></script>
<script src="./src/icon-helper.js"></script>
<script src="./src/theme-switcher.js"></script>
```

4. **Initialize icons** (in your JavaScript):
```javascript
document.addEventListener('DOMContentLoaded', () => {
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

## Governance

### Design System Team
- **Design Lead**: Maintains design consistency and component specifications
- **Engineering Lead**: Ensures technical implementation quality
- **Accessibility Expert**: Reviews all components for compliance
- **Product Representative**: Validates user needs and business requirements

### Contribution Process
1. **Proposal**: Submit RFC for new components or changes
2. **Design Review**: Design team validates visual consistency
3. **Engineering Review**: Technical feasibility and implementation
4. **Accessibility Review**: WCAG compliance verification  
5. **Testing**: Cross-browser and device validation
6. **Documentation**: Update usage guidelines and examples
7. **Release**: Version update with changelog

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
        <input type="checkbox" id="theme-toggle" class="theme-toggle-input" checked>
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

*This documentation is maintained by the FlagFit Pro Design System team. Last updated: November 9, 2025*