# FlagFit Pro Design System Summary

## Overview
This document provides a concise summary of the FlagFit Pro design system, which uses the **Radix Colors palette** and **Poppins typography** to create a modern, accessible, and consistent user interface.

## 🎨 Color System

### Radix Colors Palette
The design system uses a comprehensive 12-step color scale for both light and dark themes:

#### Light Theme
- **Primary Accent**: `#5271FF` (Blue) - Main brand color
- **Primary Gray**: `#111111` (Black) - Main text color  
- **Primary Background**: `#FFFFFF` (White) - Main background

#### Dark Theme
- **Primary Accent**: `#FFFFFF` (White) - Main brand color
- **Primary Gray**: `#5271FF` (Blue) - Main text color
- **Primary Background**: `#111111` (Black) - Main background

### Color Usage
- **Accent colors**: Interactive elements, CTAs, brand elements
- **Gray colors**: Text, borders, backgrounds, disabled states
- **Background colors**: Page backgrounds, cards, overlays

## 📝 Typography

### Font Family
- **Primary**: Poppins (Google Fonts)
- **Fallback**: ui-sans-serif, system-ui, sans-serif

### Font Weights
- **Light**: 300
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

### Type Scale
- **xs**: 0.75rem (12px)
- **sm**: 0.875rem (14px)
- **base**: 1rem (16px)
- **lg**: 1.125rem (18px)
- **xl**: 1.25rem (20px)
- **2xl**: 1.5rem (24px)
- **3xl**: 1.875rem (30px)
- **4xl**: 2.25rem (36px)

## 📏 Spacing System

### 4-Point Grid
- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 0.75rem (12px)
- **lg**: 1rem (16px)
- **xl**: 1.5rem (24px)
- **2xl**: 2rem (32px)
- **3xl**: 3rem (48px)
- **4xl**: 4rem (64px)

## 🔲 Border Radius

- **sm**: 0.25rem (4px)
- **md**: 0.375rem (6px)
- **lg**: 0.5rem (8px)
- **xl**: 0.75rem (12px)
- **2xl**: 1rem (16px)
- **full**: 9999px (circular)

## 🌫️ Shadows

- **sm**: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
- **md**: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
- **lg**: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
- **xl**: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)

## 🎨 Component Guidelines

### Buttons
```css
/* Primary Button */
.btn-primary {
  background: var(--radix-accent-11);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  font-family: 'Poppins', sans-serif;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--radix-accent-11);
  border: 2px solid var(--radix-accent-11);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  font-family: 'Poppins', sans-serif;
}
```

### Cards
```css
.card {
  background: var(--radix-background-1);
  border: 1px solid var(--radix-accent-3);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  font-family: 'Poppins', sans-serif;
}
```

### Forms
```css
.input {
  background: var(--radix-background-1);
  border: 1px solid var(--radix-accent-3);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  font-family: 'Poppins', sans-serif;
  color: var(--radix-accent-7);
}

.input:focus {
  outline: none;
  border-color: var(--radix-accent-11);
  box-shadow: 0 0 0 3px rgba(82, 113, 255, 0.1);
}
```

## 🌙 Dark Mode

### Theme Switching
```javascript
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}
```

### CSS Variables
```css
/* Light Theme (default) */
:root {
  --primary-accent: #5271FF;
  --primary-gray: #111111;
  --primary-background: #ffffff;
}

/* Dark Theme */
[data-theme="dark"] {
  --primary-accent: #ffffff;
  --primary-gray: #5271FF;
  --primary-background: #111111;
}
```

## 📱 Responsive Design

### Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Container Max Widths
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## ♿ Accessibility

### Standards
- **WCAG AA Compliance**: 4.5:1 contrast ratio minimum
- **WCAG AAA Compliance**: 7:1 contrast ratio where possible
- **Touch Targets**: Minimum 44px for mobile interactions
- **Focus Indicators**: Clear focus states with 3:1 contrast ratio

### Typography
- **Minimum Font Size**: 14px for body text
- **Line Height**: 1.5 for optimal readability
- **Font Weight**: Minimum 400 for body text, 600+ for headings

## 🎨 Usage Examples

### Tailwind CSS Classes
```html
<!-- Primary Button -->
<button class="bg-radix-accent-11 text-white px-6 py-3 rounded-lg font-medium font-poppins">
  Primary Action
</button>

<!-- Card Component -->
<div class="bg-radix-background-1 border border-radix-accent-3 rounded-lg p-6 shadow-sm font-poppins">
  <h3 class="text-radix-accent-9 font-semibold mb-4">Card Title</h3>
  <p class="text-radix-accent-6">Card content goes here...</p>
</div>

<!-- Input Field -->
<input class="bg-radix-background-1 border border-radix-accent-3 rounded-md px-3 py-3 font-poppins text-radix-accent-7 focus:border-radix-accent-11 focus:ring-2 focus:ring-radix-accent-11/20" placeholder="Enter text...">
```

## 🔧 Implementation

### Tailwind Configuration
The design system is implemented through Tailwind CSS configuration with custom color palettes and font families.

### CSS Custom Properties
All design tokens are available as CSS custom properties for use in custom CSS.

### Theme Switching
Dark mode is implemented using CSS custom properties and JavaScript for theme switching.

## 📋 Key Benefits

1. **Consistency**: Unified color palette and typography across all components
2. **Accessibility**: WCAG AA compliant with proper contrast ratios
3. **Flexibility**: Easy theme switching between light and dark modes
4. **Scalability**: Comprehensive design token system for future growth
5. **Performance**: Optimized for modern browsers and mobile devices

This design system provides a solid foundation for building consistent, accessible, and beautiful user interfaces for the FlagFit Pro application. 