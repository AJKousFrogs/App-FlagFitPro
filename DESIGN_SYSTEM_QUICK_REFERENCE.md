# Design System Quick Reference

## 🎨 Color Rules (STRICTLY ENFORCED)

### ✅ Allowed Combinations

| Background | Text Color | Usage | Token |
|------------|-----------|-------|-------|
| White | Green | Primary actions, links | `color: var(--ds-primary-green)` |
| Green | White | Text/icons on green | `color: var(--color-text-on-primary)` |
| White | Black | Primary text | `color: var(--color-text-primary)` |

### ❌ Forbidden

| Background | Text Color | Why | Use Instead |
|------------|-----------|-----|-------------|
| Green | Black | Low contrast | `--color-text-on-primary` (white) |

## 🎯 Primary Green (Single Source of Truth)

```scss
--ds-primary-green: #089949;  // USE THIS EVERYWHERE
```

**Never hardcode `#089949`** - always use `var(--ds-primary-green)`

## 🔘 Button Variants

```html
<!-- Primary: Green BG, White Text -->
<button class="btn btn-primary">Save</button>

<!-- Secondary: White BG, Green Text/Border -->
<button class="btn btn-secondary">Cancel</button>

<!-- Ghost: Transparent BG, Green Text -->
<button class="btn btn-ghost">Learn More</button>

<!-- Destructive: Red BG, White Text -->
<button class="btn btn-destructive">Delete</button>
```

## 🃏 Card Variants

```html
<!-- Default -->
<div class="card">
  <div class="card-body">Content</div>
</div>

<!-- Elevated (more shadow) -->
<div class="card card-elevated">...</div>

<!-- Outlined (border only) -->
<div class="card card-outlined">...</div>

<!-- Interactive (hover effects) -->
<div class="card card-interactive">...</div>
```

## 🏷️ Tag/Badge Variants

```html
<span class="tag tag-primary">Primary</span>
<span class="tag tag-secondary">Secondary</span>
<span class="tag tag-success">Success</span>
<span class="tag tag-warning">Warning</span>
<span class="tag tag-error">Error</span>
```

## 📐 Spacing Scale (8-point grid)

```scss
padding: var(--space-2);  // 8px
padding: var(--space-4);  // 16px
padding: var(--space-6);  // 24px
padding: var(--space-8);  // 32px
```

## 📝 Typography

```scss
// Headings
font-size: var(--font-heading-lg);  // 24px
font-size: var(--font-heading-md);  // 20px

// Body
font-size: var(--font-body-md);     // 16px
font-size: var(--font-body-sm);     // 14px
```

## 🎨 Common Color Tokens

```scss
// Brand
--ds-primary-green              // #089949
--color-brand-primary           // Same as above
--color-brand-primary-hover     // #036d35

// Text
--color-text-primary            // #1a1a1a (black)
--color-text-secondary          // #4a4a4a (gray)
--color-text-on-primary         // #ffffff (white)

// Surface
--surface-primary               // #ffffff (white)
--surface-secondary             // #f8faf9 (off-white)
--surface-tertiary              // #e9ecef (light gray)

// Status
--color-status-success          // #f1c40f (yellow)
--color-status-warning          // #ef4444 (red)
--color-status-error            // #ef4444 (red)
```

## 📄 Layout Patterns

### Page Header
```html
<div class="page-header">
  <div class="page-header-content">
    <h1 class="page-title">Title</h1>
    <p class="page-subtitle">Subtitle</p>
  </div>
  <div class="page-header-actions">
    <button class="btn btn-primary">Action</button>
  </div>
</div>
```

### Breadcrumbs
```html
<nav class="breadcrumbs">
  <div class="breadcrumb-item">
    <a href="/">Home</a>
    <span class="breadcrumb-separator">/</span>
  </div>
  <div class="breadcrumb-item">Current</div>
</nav>
```

## 🔧 PrimeNG Integration

PrimeNG components automatically use design system tokens via CSS variables:

```typescript
// PrimeNG buttons automatically styled
<p-button label="Save" styleClass="p-button-primary"></p-button>
<p-button label="Cancel" styleClass="p-button-secondary"></p-button>
<p-button label="Delete" styleClass="p-button-danger"></p-button>
```

## ⚠️ Common Mistakes to Avoid

1. ❌ **Hardcoding colors**: `color: #089949;`
   ✅ **Use tokens**: `color: var(--ds-primary-green);`

2. ❌ **Black text on green**: `color: var(--color-text-primary); background: var(--ds-primary-green);`
   ✅ **White text on green**: `color: var(--color-text-on-primary); background: var(--ds-primary-green);`

3. ❌ **Inconsistent variants**: `class="btn btn-success"`
   ✅ **Standard variants**: `class="btn btn-primary"`

4. ❌ **Custom spacing**: `padding: 13px;`
   ✅ **Use spacing scale**: `padding: var(--space-4);`

5. ❌ **Duplicate token files**: Using old `_variables.scss`
   ✅ **Single source**: Use `design-system-tokens.scss`

## 📚 File Locations

- **Design Tokens**: `angular/src/assets/styles/design-system-tokens.scss`
- **Components**: `angular/src/assets/styles/standardized-components.scss`
- **Layouts**: `angular/src/assets/styles/layout-system.scss`
- **HTML Pages**: `src/css/design-system-tokens.css`

## 🚀 Quick Start

1. Import design system in your component:
   ```scss
   @import './assets/styles/design-system-tokens.scss';
   ```

2. Use standardized classes:
   ```html
   <button class="btn btn-primary">Click Me</button>
   ```

3. Follow color rules - never use black on green!

