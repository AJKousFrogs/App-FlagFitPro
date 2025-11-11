# 🎨 Theme Styles Location Guide

This document shows where all **Light Mode** and **Dark Mode** design styles are defined in the codebase.

---

## 📍 **Main Theme Style Locations**

### **1. Design System CSS** (`src/comprehensive-design-system.css`)

#### **Light Mode (Default)**
**Location:** Lines 11-489 (`:root` selector)

**Key Colors:**
```css
:root {
  /* Surface Colors - Light Mode (default) */
  --surface-primary: #ffffff;
  --surface-secondary: var(--primitive-neutral-50);  /* #f8f8f8 */
  --surface-tertiary: var(--primitive-neutral-100); /* #f0f0f0 */
  
  /* Text Colors - Light Mode */
  --color-text-primary: var(--primitive-neutral-900);    /* #1a1a1a */
  --color-text-secondary: var(--primitive-neutral-700);  /* #404040 */
  --color-text-tertiary: var(--primitive-neutral-500);   /* #888888 */
  
  /* Border Colors - Light Mode */
  --color-border-primary: var(--primitive-neutral-300);  /* #d0d0d0 */
  --color-border-secondary: var(--primitive-neutral-200); /* #e8e8e8 */
}
```

#### **Dark Mode**
**Location:** Lines 495-529 (`@media (prefers-color-scheme: dark)`)

**Key Colors:**
```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Surface Colors - Dark Mode */
    --surface-primary: var(--primitive-neutral-900);     /* #1a1a1a */
    --surface-secondary: var(--primitive-neutral-800);   /* #2a2a2a */
    --surface-tertiary: var(--primitive-neutral-700);    /* #404040 */
    
    /* Text Colors - Dark Mode */
    --color-text-primary: var(--primitive-neutral-100);   /* #f0f0f0 */
    --color-text-secondary: var(--primitive-neutral-300); /* #d0d0d0 */
    --color-text-tertiary: var(--primitive-neutral-500);  /* #888888 */
    
    /* Border Colors - Dark Mode */
    --color-border-primary: var(--primitive-neutral-700);  /* #404040 */
    --color-border-secondary: var(--primitive-neutral-800); /* #2a2a2a */
  }
}
```

---

### **2. Dashboard-Specific Theme Styles** (`dashboard.html`)

**Location:** Lines 84-1120 (in `<style>` tag)

#### **Dark Theme Styles**
Uses `body[data-theme="dark"]` and `html[data-theme="dark"]` selectors

**Key Elements:**
- **Body Background:** `#0f0f0f` (line 95)
- **Body Text:** `#ffffff` (line 96)
- **Sidebar:** `#1a1a1a` background (line 126)
- **Top Bar:** `#0f0f0f` background (line 227)
- **Main Content:** `#0f0f0f` background (line 455)
- **Cards:** `rgba(255, 255, 255, 0.03)` background (line 476)
- **Search Input:** `rgba(255, 255, 255, 0.05)` background (line 281)
- **Icons:** `rgba(255, 255, 255, 0.6)` color (line 171)

#### **Light Theme Styles**
Uses `body[data-theme="light"]` and `html[data-theme="light"]` selectors

**Key Elements:**
- **Body Background:** `#ffffff` (line 103)
- **Body Text:** `#1a1a1a` (line 104)
- **Sidebar:** `#f5f5f5` background (line 133)
- **Top Bar:** `#ffffff` background (line 234)
- **Main Content:** `#ffffff` background (line 461)
- **Cards:** `rgba(0, 0, 0, 0.02)` background (line 490)
- **Search Input:** `rgba(0, 0, 0, 0.05)` background (line 301)
- **Icons:** `rgba(0, 0, 0, 0.6)` color (line 183)

---

## 🎯 **Theme Implementation Methods**

### **Method 1: Media Query (Design System)**
```css
/* src/comprehensive-design-system.css */
@media (prefers-color-scheme: dark) {
  :root {
    /* Dark mode variables */
  }
}
```
- **Uses:** System preference
- **Location:** `src/comprehensive-design-system.css:495-529`

### **Method 2: Data Attribute (Dashboard)**
```css
/* dashboard.html */
body[data-theme="dark"] {
  background: #0f0f0f;
  color: #ffffff;
}

body[data-theme="light"] {
  background: #ffffff;
  color: #1a1a1a;
}
```
- **Uses:** `data-theme` attribute set by JavaScript
- **Location:** `dashboard.html:91-105`
- **Set by:** `src/theme-switcher.js`

---

## 📋 **Complete Theme Style Breakdown**

### **Dark Mode Colors**

| Element | Color | Location |
|---------|-------|----------|
| Body Background | `#0f0f0f` | dashboard.html:95 |
| Body Text | `#ffffff` | dashboard.html:96 |
| Sidebar Background | `#1a1a1a` | dashboard.html:126 |
| Top Bar Background | `#0f0f0f` | dashboard.html:227 |
| Main Content | `#0f0f0f` | dashboard.html:455 |
| Card Background | `rgba(255, 255, 255, 0.03)` | dashboard.html:476 |
| Card Border | `rgba(255, 255, 255, 0.08)` | dashboard.html:477 |
| Search Background | `rgba(255, 255, 255, 0.05)` | dashboard.html:281 |
| Icon Color | `rgba(255, 255, 255, 0.6)` | dashboard.html:171 |
| Text Primary | `#ffffff` | dashboard.html:1116 |
| Text Secondary | `rgba(255, 255, 255, 0.6)` | dashboard.html:1083 |

### **Light Mode Colors**

| Element | Color | Location |
|---------|-------|----------|
| Body Background | `#ffffff` | dashboard.html:103 |
| Body Text | `#1a1a1a` | dashboard.html:104 |
| Sidebar Background | `#f5f5f5` | dashboard.html:133 |
| Top Bar Background | `#ffffff` | dashboard.html:234 |
| Main Content | `#ffffff` | dashboard.html:461 |
| Card Background | `rgba(0, 0, 0, 0.02)` | dashboard.html:490 |
| Card Border | `rgba(0, 0, 0, 0.08)` | dashboard.html:491 |
| Search Background | `rgba(0, 0, 0, 0.05)` | dashboard.html:301 |
| Icon Color | `rgba(0, 0, 0, 0.6)` | dashboard.html:183 |
| Text Primary | `#1a1a1a` | dashboard.html:1110 |
| Text Secondary | `rgba(0, 0, 0, 0.6)` | dashboard.html:1079 |

---

## 🔧 **Theme Switcher Logic**

**File:** `src/theme-switcher.js`

**Key Functions:**
- `applyTheme(theme)` - Sets `data-theme` attribute (lines 75-127)
- `switchTheme(theme)` - Switches theme and saves to localStorage (lines 68-73)
- `updateToggleText(theme)` - Updates toggle label (lines 129-137)

**How it works:**
1. Sets `data-theme="dark"` or `data-theme="light"` on `<html>` and `<body>`
2. CSS selectors `body[data-theme="dark"]` and `body[data-theme="light"]` apply styles
3. Theme preference saved to `localStorage`

---

## 📂 **File Summary**

| File | Purpose | Theme Method |
|------|---------|--------------|
| `src/comprehensive-design-system.css` | Global design system | `@media (prefers-color-scheme: dark)` |
| `dashboard.html` (style tag) | Dashboard-specific styles | `[data-theme="dark"]` / `[data-theme="light"]` |
| `src/theme-switcher.js` | Theme switching logic | Sets `data-theme` attribute |

---

## 🎨 **Brand Colors (Both Themes)**

**Primary Green:** `#10c96b` (used in both themes)
**Secondary Lime:** `#89c300`
**Tertiary Gold:** `#cc9610`

These brand colors remain consistent across both themes.

---

## 💡 **Quick Reference**

**To find dark mode styles:**
- Search for: `data-theme="dark"` or `prefers-color-scheme: dark`

**To find light mode styles:**
- Search for: `data-theme="light"` or look in `:root` (default)

**To modify theme colors:**
1. **Dashboard-specific:** Edit `dashboard.html` lines 91-1120
2. **Global design system:** Edit `src/comprehensive-design-system.css` lines 11-529

