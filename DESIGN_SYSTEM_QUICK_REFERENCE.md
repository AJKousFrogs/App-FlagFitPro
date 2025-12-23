# FlagFit Pro Design System - Quick Reference

**Quick lookup guide for common design system tokens and components**

---

## 🎨 Colors

### Brand Colors

```css
--color-brand-primary          /* #089949 - Main brand color */
--color-brand-primary-hover    /* #036d35 - Hover state */
--color-brand-secondary        /* #10c96b - Accent color */
```

### Status Colors

```css
--color-status-success         /* #63ad0e - Success/positive */
--color-status-warning         /* #ffc000 - Warning/alert */
--color-status-error           /* #FF003C - Error/danger */
--color-status-info            /* #0ea5e9 - Info/informational */
```

### Text Colors

```css
--color-text-primary           /* #1a1a1a - Main text (white bg) */
--color-text-secondary         /* #4a4a4a - Secondary text */
--color-text-muted             /* #6b7280 - Muted text */
--color-text-on-primary        /* #ffffff - Text on green bg */
```

### Surface Colors

```css
--surface-primary              /* #ffffff - Main background */
--surface-secondary            /* #f8faf9 - Card background */
--surface-tertiary            /* #e9ecef - Subtle background */
```

---

## 📏 Spacing (8-Point Grid)

```css
--space-xs    /* 4px  */
--space-sm    /* 8px  */
--space-md    /* 16px */
--space-lg    /* 24px */
--space-xl    /* 32px */
--space-2xl   /* 48px */
--space-3xl   /* 64px */
```

**Common Usage:**

- `padding: var(--space-md)` - Standard padding
- `gap: var(--space-lg)` - Component spacing
- `margin-bottom: var(--space-xl)` - Section spacing

---

## ✍️ Typography

### Font Sizes

```css
--font-heading-xl    /* 30px - Page titles */
--font-heading-lg    /* 24px - Section headers */
--font-heading-md    /* 20px - Subsection headers */
--font-body-md       /* 16px - Default body text */
--font-body-sm       /* 14px - Small text */
```

### Font Weights

```css
--font-weight-normal    /* 400 */
--font-weight-medium    /* 500 */
--font-weight-semibold  /* 600 */
--font-weight-bold      /* 700 */
```

### Line Heights

```css
--line-height-tight    /* 1.2 - Headings */
--line-height-normal   /* 1.5 - Body text */
--line-height-relaxed  /* 1.625 - Comfortable reading */
```

---

## 🔘 Buttons

### Variants

```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-tertiary">Tertiary</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-error">Error</button>
```

### Sizes

```html
<button class="btn btn-primary btn-xs">XS</button>
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-md">Medium (default)</button>
<button class="btn btn-primary btn-lg">Large</button>
```

### With Icons

```html
<button class="btn btn-primary btn-md">
  <i data-lucide="save" style="width: 18px; height: 18px;"></i>
  Save
</button>
```

---

## 📝 Forms

### Input

```html
<input type="text" class="form-input" placeholder="Enter text" />
<input type="text" class="form-input error" placeholder="Error" />
<input type="text" class="form-input" disabled />
```

### Form Group

```html
<div class="form-group">
  <label class="form-label">Label</label>
  <input type="text" class="form-input" />
  <span class="form-error">Error message</span>
</div>
```

---

## 🎴 Cards

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Title</h3>
  </div>
  <div class="card-body">Content here</div>
  <div class="card-footer">Footer content</div>
</div>
```

---

## 🏷️ Badges

```html
<span class="badge badge-primary">New</span>
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-error">Error</span>
```

---

## 📐 Border Radius

```css
--radius-sm    /* 2px  */
--radius-md    /* 6px  */
--radius-lg    /* 8px  - Default for components */
--radius-xl    /* 12px */
--radius-full  /* Fully rounded */
```

---

## 🌑 Shadows

```css
--shadow-sm      /* Subtle shadow */
--shadow-md      /* Medium shadow - Cards */
--shadow-lg      /* Large shadow - Modals */
--elevation-low  /* Alias for shadow-sm */
--elevation-medium /* Alias for shadow-md */
--elevation-high /* Alias for shadow-lg */
```

---

## ⚡ Transitions

```css
--transition-base  /* 0.2s ease - Default */
--transition-fast  /* 0.15s ease */
--transition-slow  /* 0.3s ease */
```

**Usage:**

```css
.button {
  transition: all var(--transition-base);
}
```

---

## 🎯 Z-Index

```css
--z-index-dropdown      /* 1000 */
--z-index-sticky        /* 1020 */
--z-index-modal-backdrop /* 1040 */
--z-index-modal         /* 1050 */
--z-index-popover       /* 1060 */
--z-index-tooltip       /* 1070 */
```

---

## 📱 Responsive Breakpoints

```css
--breakpoint-sm   /* 640px  */
--breakpoint-md   /* 768px  */
--breakpoint-lg   /* 1024px */
--breakpoint-xl   /* 1280px */
```

**Usage:**

```css
@media (min-width: 768px) {
  /* Tablet and up */
}
```

---

## ✅ Color Rules (CRITICAL)

### ✅ Allowed

- **Green on White**: `--color-brand-primary` on white backgrounds
- **White on Green**: `--color-text-on-primary` on green backgrounds
- **Black on White**: `--color-text-primary` on white backgrounds

### ❌ Forbidden

- **Black on Green**: Never use `--color-text-primary` on green backgrounds
- **Green on Black**: Use white text instead

---

## 🎨 Common Patterns

### Button with Icon

```html
<button class="btn btn-primary btn-md">
  <i data-lucide="icon-name" style="width: 18px; height: 18px;"></i>
  Button Text
</button>
```

### Card Layout

```html
<div class="card">
  <div class="card-header">
    <h3 class="text-heading-lg">Card Title</h3>
  </div>
  <div class="card-body">
    <p class="text-body-md">Card content</p>
  </div>
</div>
```

### Form Layout

```html
<div class="form-group">
  <label class="form-label text-body-sm font-weight-medium"> Label </label>
  <input type="text" class="form-input" placeholder="Enter value" />
  <span class="form-error text-body-xs"> Error message </span>
</div>
```

### Flex Layout

```html
<div style="display: flex; align-items: center; gap: var(--space-md);">
  <button class="btn btn-primary">Action</button>
  <span class="text-body-md">Text</span>
</div>
```

---

## 🚨 Common Mistakes

### ❌ Don't Hardcode Colors

```css
/* BAD */
.button {
  color: #089949;
}

/* GOOD */
.button {
  color: var(--color-brand-primary);
}
```

### ❌ Don't Use Arbitrary Spacing

```css
/* BAD */
.container {
  padding: 13px;
}

/* GOOD */
.container {
  padding: var(--space-md);
}
```

### ❌ Don't Mix Token Systems

```css
/* BAD */
.component {
  color: var(--color-primary); /* Legacy */
  padding: var(--space-md); /* New */
}

/* GOOD */
.component {
  color: var(--color-brand-primary);
  padding: var(--space-md);
}
```

---

## 📚 File Locations

- **HTML CSS**: `src/css/design-system-tokens.css`
- **Angular SCSS**: `angular/src/assets/styles/design-system-tokens.scss`
- **TypeScript**: `angular/src/app/shared/models/design-tokens.ts`
- **Components**: `src/components/`
- **Full Docs**: `DESIGN_SYSTEM_DOCUMENTATION.md`

---

## 🔍 Finding Tokens

### Need a color?

1. Check semantic tokens: `--color-brand-*`, `--color-status-*`
2. Check text colors: `--color-text-*`
3. Check surfaces: `--surface-*`

### Need spacing?

1. Use 8-point grid: `--space-xs` through `--space-3xl`
2. Prefer semantic: `--space-md`, `--space-lg`

### Need typography?

1. Headings: `--font-heading-*`
2. Body: `--font-body-*`
3. Weights: `--font-weight-*`

---

**Quick Tip:** Use your editor's autocomplete to see all available tokens!
