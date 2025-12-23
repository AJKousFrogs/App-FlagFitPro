# FlagFit Pro Design System - Quick Reference Card

**Print-friendly visual guide for daily use**

---

## 🎨 Color Tokens

### Primary Brand Colors

```
--color-brand-primary        #089949  Primary Green
--color-brand-primary-hover  #0ab85a  Hover Green
--color-brand-primary-active #036d35  Active Green
```

### Text Colors

```
--color-text-primary    #171717  Main Text (Black)
--color-text-secondary   #737373  Secondary Text (Gray)
--color-text-muted       #a3a3a3  Muted Text (Light Gray)
--color-text-on-primary  #ffffff  White on Green
```

### Surface Colors

```
--surface-primary    #ffffff  White Backgrounds
--surface-secondary   #f8faf9  Card Backgrounds
--surface-tertiary    #e9ecef  Subtle Backgrounds
```

### Status Colors

```
--color-status-success  #f1c40f  Yellow (Success)
--color-status-warning   #ef4444  Red (Warning)
--color-status-error     #ef4444  Red (Error)
```

---

## 📏 Spacing System (8-Point Grid)

```
--space-0    0px
--space-1    4px    (0.25rem)
--space-2    8px    (0.5rem)
--space-3    12px   (0.75rem)
--space-4    16px   (1rem)      ← Most common
--space-6    24px   (1.5rem)    ← Common
--space-8    32px   (2rem)
--space-12   48px   (3rem)
--space-16   64px   (4rem)
--space-24   96px   (6rem)
```

**Semantic Aliases:**

```
--space-xs   → --space-1   (4px)
--space-sm   → --space-2   (8px)
--space-md   → --space-4   (16px)
--space-lg   → --space-6   (24px)
--space-xl   → --space-8   (32px)
--space-2xl  → --space-12  (48px)
```

---

## 🔤 Typography

### Font Families

```
--font-family-sans    Poppins (Default)
--font-family-display Poppins (Headings)
--font-family-mono    SF Mono (Code)
```

### Font Sizes

```
--text-xs    12px
--text-sm    14px
--text-base  16px   ← Body text
--text-lg    18px
--text-xl    20px
--text-2xl   24px   ← Headings
--text-3xl   30px
--text-4xl   40px
--text-5xl   60px
```

### Font Weights

```
--font-weight-normal    400
--font-weight-medium    500
--font-weight-semibold  600
--font-weight-bold      700
```

### Heading Sizes

```
--font-heading-xs  16px
--font-heading-sm  18px
--font-heading-md  20px
--font-heading-lg  24px
--font-heading-xl  30px
--font-heading-2xl 40px
```

---

## 🔘 Buttons

### 6 Button Variants

```html
<!-- Primary - Green BG + White Text -->
<button class="btn btn-primary">Save</button>

<!-- Secondary - White BG + Green Text -->
<button class="btn btn-secondary">Cancel</button>

<!-- Outlined - Green Border + Green Text -->
<button class="btn btn-outlined">Learn More</button>

<!-- Text - No Background + Green Text -->
<button class="btn btn-text">View Details</button>

<!-- Danger - Red BG + White Text -->
<button class="btn btn-danger">Delete</button>

<!-- Success - Yellow BG + Black Text -->
<button class="btn btn-success">Approve</button>
```

### Button Sizes

```html
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Default</button>
<button class="btn btn-primary btn-lg">Large</button>
```

---

## 🃏 Cards

```html
<!-- Default Card -->
<div class="card">
  <div class="card-body">Content</div>
</div>

<!-- Elevated Card -->
<div class="card card-elevated">
  <div class="card-header">
    <h3 class="card-title">Title</h3>
  </div>
  <div class="card-body">Content</div>
  <div class="card-footer">Footer</div>
</div>

<!-- Outlined Card -->
<div class="card card-outlined">
  <div class="card-body">Content</div>
</div>
```

---

## 📝 Forms

### Text Input

```html
<div class="form-group">
  <label for="email">Email</label>
  <input id="email" type="email" class="form-control" />
  <div class="form-help">Help text</div>
</div>
```

### Select

```html
<div class="form-group">
  <label for="position">Position</label>
  <select id="position" class="form-control">
    <option>Select...</option>
  </select>
</div>
```

### Checkbox

```html
<div class="form-check">
  <input type="checkbox" id="agree" />
  <label for="agree">I agree</label>
</div>
```

---

## 🎯 Border Radius

```
--radius-none  0
--radius-sm    2px
--radius-md    6px
--radius-lg    8px      ← Most common
--radius-xl    12px
--radius-2xl   16px
--radius-3xl   24px
--radius-full  9999px   ← Fully rounded
```

---

## 🌑 Shadows

```
--shadow-sm  0 1px 3px rgba(0,0,0,0.1)
--shadow-md  0 4px 12px rgba(0,0,0,0.15)
--shadow-lg  0 8px 24px rgba(0,0,0,0.12)
--shadow-xl  0 12px 48px rgba(0,0,0,0.15)
```

---

## 🎨 Color Combinations

### ✅ Allowed

- Green BG + White Text (Primary buttons)
- White BG + Green Text (Secondary buttons)
- Black BG + White Text (Dark headers)
- Yellow BG + Black Text (Success messages)

### ❌ Forbidden

- Green BG + Black Text (Fails contrast)
- Black BG + Green Text (Fails contrast)
- Yellow BG + White Text (Poor contrast)

---

## 📐 Layout Utilities

### Container

```html
<div class="container">
  <!-- Max width 1200px, centered -->
</div>
```

### Grid

```html
<div class="grid grid-cols-3">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Flex

```html
<div class="flex items-center justify-between">
  <span>Left</span>
  <span>Right</span>
</div>
```

---

## 🏷️ Badges & Tags

```html
<!-- Badge -->
<span class="badge badge-primary">New</span>
<span class="badge badge-success">Active</span>
<span class="badge badge-error">Error</span>

<!-- Tag -->
<div class="tag">
  Tag Name
  <button class="tag-close">×</button>
</div>
```

---

## 💬 Alerts

```html
<div class="alert alert-success">
  <div class="alert-content">
    <h4 class="alert-title">Success!</h4>
    <p class="alert-message">Message here</p>
  </div>
</div>
```

**Types:** `alert-success`, `alert-warning`, `alert-error`, `alert-info`

---

## 🔄 Dark Mode

### Automatic

```css
/* Automatically switches based on system preference */
@media (prefers-color-scheme: dark) {
  /* Colors switch automatically */
}
```

### Manual Toggle

```typescript
// Toggle dark mode
document.documentElement.setAttribute("data-theme", "dark");
document.documentElement.setAttribute("data-theme", "light");
```

---

## 🚨 Common Mistakes

### ❌ Don't Hardcode Colors

```scss
/* BAD */
color: #089949;

/* GOOD */
color: var(--color-brand-primary);
```

### ❌ Don't Use Legacy Variables

```scss
/* BAD */
color: var(--dark-text-primary);

/* GOOD */
color: var(--color-text-primary);
```

### ❌ Don't Mix Spacing Systems

```scss
/* BAD */
padding: 15px; /* Not on 8-point grid */

/* GOOD */
padding: var(--space-4); /* 16px - on grid */
```

---

## 📚 Quick Links

- **Full Documentation:** `DESIGN_SYSTEM_DOCUMENTATION.md`
- **Quick Start:** `quick-start.md`
- **Migration Guide:** `migration-guide.md`
- **Angular Examples:** `angular-components.md`
- **Delivery Summary:** `DELIVERY-SUMMARY.md`

---

## 🎯 Finding Tokens

### Need a color?

→ Check `design-tokens.scss` comments  
→ Look for `--color-*` or `--surface-*`

### Need spacing?

→ Use 8-point grid: `--space-1` to `--space-24`  
→ Prefer semantic: `--space-xs`, `--space-md`, `--space-lg`

### Need typography?

→ Use semantic sizes: `--text-xs` to `--text-5xl`  
→ Use heading sizes: `--font-heading-*`  
→ Use body sizes: `--font-body-*`

---

## ✨ Remember

- ✅ Always use design tokens
- ✅ Follow 8-point spacing grid
- ✅ Test color contrast ratios
- ✅ Support dark mode
- ✅ Use semantic variable names

**Print this page and keep it handy! 📄**
