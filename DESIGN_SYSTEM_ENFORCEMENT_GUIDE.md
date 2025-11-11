# 🎨 Design System Enforcement Guide

**CRITICAL:** All new pages, features, and components MUST follow this guide exactly.

---

## 📋 **MANDATORY STRUCTURE**

### 1. **HTML Structure Template**

Every page MUST follow this exact structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlagFit Pro - [Page Name]</title>
    
    <!-- REQUIRED: Fonts (DO NOT CHANGE) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet">
    
    <!-- REQUIRED: CSS Files (IN THIS ORDER) -->
    <link rel="stylesheet" href="./src/comprehensive-design-system.css">
    <link rel="stylesheet" href="./src/spacing-system.css">
    <link rel="stylesheet" href="./src/modern-dashboard-redesign.css">
    <link rel="stylesheet" href="./src/hover-effects.css">
    
    <!-- REQUIRED: Scripts -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="./src/icon-helper.js"></script>
    <script src="./src/theme-switcher.js"></script>
    <script src="./src/nav-highlight.js"></script>
</head>
<body>
    <div class="dashboard-container">
        <!-- REQUIRED: Unified Sidebar Navigation -->
        <div class="sidebar">
            <!-- Use src/unified-sidebar.html template -->
        </div>
        
        <!-- REQUIRED: Main Content Area -->
        <main class="main-content">
            <!-- Page content here -->
        </main>
    </div>
</body>
</html>
```

---

## 🎨 **MANDATORY CSS VARIABLES**

### **Colors - USE THESE ONLY:**

```css
/* Text Colors */
var(--color-text-primary)      /* Primary text */
var(--color-text-secondary)    /* Secondary text */
var(--color-text-tertiary)     /* Tertiary text */
var(--color-text-muted)        /* Muted text */

/* Background Colors */
var(--surface-primary)         /* Primary background */
var(--surface-secondary)       /* Secondary background */
var(--color-surface-secondary) /* Alternative secondary */

/* Border Colors */
var(--color-border-primary)    /* Primary borders */
var(--color-border-secondary) /* Secondary borders */

/* Brand Colors */
var(--primitive-primary-500)   /* Primary brand color */
var(--primitive-primary-600)   /* Primary brand darker */
var(--primitive-success-500)   /* Success color */
var(--primitive-success-600)   /* Success darker */

/* Theme Colors (Dark/Light) */
var(--dark-bg-primary)         /* Dark theme background */
var(--dark-text-primary)       /* Dark theme text */
var(--dark-card-bg)            /* Dark theme cards */
```

**❌ NEVER USE:**
- Hardcoded colors like `#ffffff`, `rgb(255,255,255)`, `rgba(0,0,0,0.1)`
- New color variables
- Custom color definitions

---

## 📐 **MANDATORY SPACING**

### **Use Spacing System Variables:**

```css
/* Component Spacing */
var(--spacing-component-xs)    /* 12px */
var(--spacing-component-sm)    /* 16px */
var(--spacing-component-md)    /* 24px */
var(--spacing-component-lg)    /* 32px */
var(--spacing-component-xl)    /* 40px */

/* Layout Spacing */
var(--spacing-layout-xs)       /* 20px */
var(--spacing-layout-sm)       /* 32px */
var(--spacing-layout-md)       /* 40px */
var(--spacing-layout-lg)       /* 48px */
var(--spacing-layout-xl)       /* 56px */

/* Card Padding */
var(--card-padding-sm)         /* 24px */
var(--card-padding-md)         /* 32px */
var(--card-padding-lg)         /* 40px */
var(--card-padding-xl)         /* 48px */

/* Grid Gaps */
var(--grid-gap-sm)             /* 24px */
var(--grid-gap-md)             /* 32px */
var(--grid-gap-lg)             /* 40px */
var(--grid-gap-xl)             /* 48px */

/* Section Spacing */
var(--section-spacing-sm)      /* 40px */
var(--section-spacing-md)      /* 48px */
var(--section-spacing-lg)      /* 56px */
var(--section-spacing-xl)      /* 80px */
```

**❌ NEVER USE:**
- Hardcoded padding/margin like `padding: 20px`, `margin: 15px`
- Custom spacing values
- px values directly (use variables)

---

## 🔲 **MANDATORY BORDER RADIUS**

### **Use Design System Radius:**

```css
/* From comprehensive-design-system.css */
var(--radius-sm)               /* Small radius */
var(--radius-md)               /* Medium radius */
var(--radius-lg)               /* Large radius */
var(--radius-xl)               /* Extra large radius */
var(--radius-component-lg)     /* Component radius */
```

**Standard Values:**
- Cards: `border-radius: var(--radius-component-lg)` or `20px`
- Buttons: `border-radius: 14px` (from modern-dashboard-redesign.css)
- Small elements: `border-radius: 8px` or `12px`

**❌ NEVER USE:**
- Custom border-radius values
- Values not in design system

---

## 🌑 **MANDATORY BOX SHADOWS**

### **Use Design System Shadows:**

```css
/* Card Shadows (from modern-dashboard-redesign.css) */
box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);

/* Hover Shadows */
box-shadow: 
    0 12px 32px rgba(0, 0, 0, 0.12),
    0 6px 16px rgba(0, 0, 0, 0.08);

/* Or use design system variables */
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)
```

**❌ NEVER USE:**
- Custom shadow values
- Hardcoded shadow colors

---

## 🎴 **MANDATORY CARD STYLES**

### **Use Predefined Card Classes:**

```html
<!-- Stat Card -->
<div class="stat-card" data-type="[type]">
    <!-- Content -->
</div>

<!-- Chart Card -->
<div class="chart-card">
    <!-- Content -->
</div>

<!-- Metric Card -->
<div class="metric-card">
    <!-- Content -->
</div>

<!-- Upcoming Card (Action Cards) -->
<div class="upcoming-card">
    <!-- Content -->
</div>
```

**Card Classes Available:**
- `.stat-card` - Statistics/metrics cards
- `.chart-card` - Chart containers
- `.metric-card` - Metric displays
- `.upcoming-card` - Action/upcoming items
- `.card` - Generic card

**❌ NEVER CREATE:**
- New card classes
- Custom card styles
- Inline card styles

---

## 📊 **MANDATORY CHART STYLES**

### **Use Existing Chart Patterns:**

```javascript
// Chart.js Configuration Template
new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            borderColor: 'var(--primitive-primary-500)',
            backgroundColor: gradient, // Use gradient from dashboard.html
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'var(--primitive-primary-500)',
            pointBorderColor: 'white',
            pointBorderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 10
        }]
    },
    options: {
        scales: {
            y: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.06)',
                },
                ticks: {
                    color: 'var(--color-text-secondary)',
                    font: {
                        family: 'Inter',
                        size: 12,
                        weight: '600'
                    }
                }
            },
            x: {
                ticks: {
                    color: 'var(--color-text-secondary)',
                    font: {
                        family: 'Inter',
                        size: 12,
                        weight: '600'
                    }
                }
            }
        }
    }
});
```

---

## 🔤 **MANDATORY TYPOGRAPHY**

### **Use Design System Typography:**

```css
/* Font Families (DO NOT CHANGE) */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
font-family: 'Roboto', sans-serif; /* Only for specific cases */

/* Font Sizes - Use Variables */
var(--text-xs)      /* 12px */
var(--text-sm)      /* 14px */
var(--text-base)    /* 16px */
var(--text-lg)      /* 18px */
var(--text-xl)      /* 20px */
var(--text-2xl)     /* 24px */
var(--text-3xl)     /* 30px */

/* Font Weights */
var(--font-light)   /* 300 */
var(--font-regular) /* 400 */
var(--font-medium)  /* 500 */
var(--font-semibold)/* 600 */
var(--font-bold)    /* 700 */

/* Typography Hierarchy (from modern-dashboard-redesign.css) */
.stat-title {
    font-size: 0.875rem; /* 14px */
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.stat-value {
    font-size: 2.75rem; /* 44px */
    font-weight: 700;
    line-height: 1.1;
}

.stat-context {
    font-size: 0.75rem; /* 12px */
    font-weight: 400;
}
```

**❌ NEVER USE:**
- New font families
- Custom font stacks
- Hardcoded font sizes
- Custom typography styles

---

## 🎯 **MANDATORY ICON STYLES**

### **Use Lucide Icons Only:**

```html
<!-- Standard Icon Pattern -->
<i data-lucide="[icon-name]" style="width: 24px; height: 24px;"></i>

<!-- With Color Variable -->
<i data-lucide="[icon-name]" style="width: 24px; height: 24px; color: var(--icon-color-primary); stroke: var(--icon-color-primary);"></i>

<!-- Icon Sizes -->
width: 16px; height: 16px;  /* Small */
width: 20px; height: 20px;  /* Medium */
width: 24px; height: 24px;  /* Standard */
width: 32px; height: 32px;  /* Large */
```

**❌ NEVER USE:**
- Font Awesome icons
- Material Icons
- Custom icon fonts
- SVG icons (unless from Lucide)

---

## 🎨 **MANDATORY THEME SUPPORT**

### **All Styles MUST Support Dark/Light Theme:**

```css
/* Light Theme (Default) */
.element {
    background: var(--surface-primary);
    color: var(--color-text-primary);
    border-color: var(--color-border-secondary);
}

/* Dark Theme Override */
body[data-theme="dark"] .element,
html[data-theme="dark"] .element {
    background: var(--dark-bg-primary);
    color: var(--dark-text-primary);
    border-color: rgba(255, 255, 255, 0.1);
}
```

**❌ NEVER USE:**
- Hardcoded colors that don't adapt to theme
- Theme-specific styles without variables
- Colors that break in dark mode

---

## 📱 **MANDATORY RESPONSIVE DESIGN**

### **Use Standard Breakpoints:**

```css
/* Mobile First Approach */
@media (max-width: 768px) {
    /* Mobile styles */
}

@media (min-width: 769px) and (max-width: 1024px) {
    /* Tablet styles */
}

@media (min-width: 1025px) {
    /* Desktop styles */
}
```

**Standard Responsive Patterns:**
- Sidebar: Hidden on mobile, visible on desktop
- Grid: 1 column mobile, 2-3 columns desktop
- Padding: Smaller on mobile, larger on desktop

---

## ✅ **CHECKLIST FOR NEW PAGES**

Before creating any new page, verify:

- [ ] Uses `dashboard-container` wrapper
- [ ] Includes unified sidebar from `src/unified-sidebar.html`
- [ ] Uses `main-content` class for content area
- [ ] Includes all required CSS files (in correct order)
- [ ] Includes all required scripts
- [ ] Uses only CSS variables for colors
- [ ] Uses only spacing system variables
- [ ] Uses predefined card classes (`.stat-card`, `.chart-card`, etc.)
- [ ] Uses design system border-radius values
- [ ] Uses design system box-shadow patterns
- [ ] Uses only Inter/Roboto fonts
- [ ] Uses only Lucide icons
- [ ] Supports dark/light theme with CSS variables
- [ ] Responsive design with standard breakpoints
- [ ] No hardcoded colors, spacing, or styles
- [ ] No new CSS classes (reuse existing)
- [ ] No custom font stacks

---

## 🚫 **ABSOLUTELY FORBIDDEN**

1. **New Color Definitions**
   - ❌ No new `--color-*` variables
   - ❌ No hardcoded colors
   - ❌ No custom color palettes

2. **New Typography**
   - ❌ No new font families
   - ❌ No custom font stacks
   - ❌ No new typography classes

3. **New Visual Styles**
   - ❌ No custom border-radius values
   - ❌ No custom box-shadow values
   - ❌ No new animation styles
   - ❌ No custom gradients (unless from design system)

4. **New Layout Patterns**
   - ❌ No new container classes
   - ❌ No custom grid systems
   - ❌ No new sidebar styles

5. **New Component Styles**
   - ❌ No new card classes
   - ❌ No new button styles
   - ❌ No new form styles

---

## 📚 **REFERENCE FILES**

**Always reference these files:**
1. `dashboard.html` - Main reference for structure and styles
2. `src/comprehensive-design-system.css` - All CSS variables
3. `src/spacing-system.css` - Spacing variables
4. `src/modern-dashboard-redesign.css` - Modern card/chart styles
5. `src/unified-sidebar.html` - Sidebar template

---

## 🔍 **VERIFICATION**

Before submitting any new page:

1. Run: `node scripts/audit-navigation.cjs`
2. Check: All CSS variables are from design system
3. Check: No hardcoded colors/spacing
4. Check: Dark/light theme works correctly
5. Check: Responsive design works
6. Check: Uses only predefined classes

---

**Remember:** Consistency is key. Every page should look and feel like part of the same application.

