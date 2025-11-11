# 🎨 Design System Quick Reference

**Use this as a cheat sheet when building new pages/components.**

---

## 🎯 **MUST-HAVE STRUCTURE**

```html
<div class="dashboard-container">
    <div class="sidebar"><!-- Unified sidebar --></div>
    <main class="main-content"><!-- Content --></main>
</div>
```

---

## 🎨 **COLORS - USE THESE ONLY**

```css
/* Text */
var(--color-text-primary)
var(--color-text-secondary)
var(--color-text-tertiary)
var(--color-text-muted)

/* Backgrounds */
var(--surface-primary)
var(--surface-secondary)
var(--color-surface-secondary)
var(--dark-bg-primary)        /* Dark theme */
var(--dark-card-bg)            /* Dark theme cards */

/* Borders */
var(--color-border-primary)
var(--color-border-secondary)

/* Brand */
var(--primitive-primary-500)
var(--primitive-primary-600)
var(--primitive-success-500)
var(--primitive-success-600)
```

---

## 📐 **SPACING - USE THESE ONLY**

```css
/* Component */
var(--spacing-component-xs)    /* 12px */
var(--spacing-component-sm)    /* 16px */
var(--spacing-component-md)    /* 24px */
var(--spacing-component-lg)    /* 32px */
var(--spacing-component-xl)    /* 40px */

/* Layout */
var(--spacing-layout-xs)       /* 20px */
var(--spacing-layout-sm)       /* 32px */
var(--spacing-layout-md)       /* 40px */
var(--spacing-layout-lg)       /* 48px */
var(--spacing-layout-xl)       /* 56px */

/* Cards */
var(--card-padding-sm)         /* 24px */
var(--card-padding-md)         /* 32px */
var(--card-padding-lg)         /* 40px */

/* Grids */
var(--grid-gap-sm)             /* 24px */
var(--grid-gap-md)             /* 32px */
var(--grid-gap-lg)             /* 40px */
```

---

## 🔲 **BORDER RADIUS**

```css
border-radius: var(--radius-component-lg);  /* 20px for cards */
border-radius: 14px;                         /* Buttons */
border-radius: 12px;                         /* Small elements */
border-radius: 8px;                          /* Very small */
```

---

## 🌑 **BOX SHADOWS**

```css
/* Standard Card */
box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);

/* Hover */
box-shadow: 
    0 12px 32px rgba(0, 0, 0, 0.12),
    0 6px 16px rgba(0, 0, 0, 0.08);
```

---

## 🎴 **CARD CLASSES - USE THESE**

```html
<div class="stat-card">          <!-- Statistics/metrics -->
<div class="chart-card">         <!-- Charts -->
<div class="metric-card">         <!-- Metrics -->
<div class="upcoming-card">      <!-- Actions/upcoming -->
<div class="card">                <!-- Generic -->
```

---

## 🔤 **TYPOGRAPHY**

```css
/* Font Family (DO NOT CHANGE) */
font-family: 'Inter', sans-serif;

/* Sizes */
font-size: var(--text-xs);      /* 12px */
font-size: var(--text-sm);      /* 14px */
font-size: var(--text-base);    /* 16px */
font-size: var(--text-lg);      /* 18px */
font-size: var(--text-xl);      /* 20px */
font-size: var(--text-2xl);     /* 24px */

/* Weights */
font-weight: var(--font-light);    /* 300 */
font-weight: var(--font-regular);  /* 400 */
font-weight: var(--font-medium);   /* 500 */
font-weight: var(--font-semibold); /* 600 */
font-weight: var(--font-bold);     /* 700 */
```

---

## 🎯 **ICONS**

```html
<!-- Lucide Icons Only -->
<i data-lucide="icon-name" style="width: 24px; height: 24px;"></i>

<!-- With Color -->
<i data-lucide="icon-name" style="width: 24px; height: 24px; color: var(--icon-color-primary); stroke: var(--icon-color-primary);"></i>
```

---

## 📋 **REQUIRED CSS FILES (IN ORDER)**

```html
<link rel="stylesheet" href="./src/comprehensive-design-system.css">
<link rel="stylesheet" href="./src/spacing-system.css">
<link rel="stylesheet" href="./src/modern-dashboard-redesign.css">
<link rel="stylesheet" href="./src/hover-effects.css">
```

---

## 📜 **REQUIRED SCRIPTS**

```html
<script src="https://unpkg.com/lucide@latest"></script>
<script src="./src/icon-helper.js"></script>
<script src="./src/theme-switcher.js"></script>
<script src="./src/nav-highlight.js"></script>
```

---

## ✅ **CHECKLIST**

Before creating any new page/component:

- [ ] Uses `dashboard-container` + `sidebar` + `main-content`
- [ ] All colors from CSS variables
- [ ] All spacing from spacing system
- [ ] Uses predefined card classes
- [ ] Uses Inter font only
- [ ] Uses Lucide icons only
- [ ] Supports dark/light theme
- [ ] No hardcoded values
- [ ] No new CSS classes

---

**Reference:** `dashboard.html` is the master template.

