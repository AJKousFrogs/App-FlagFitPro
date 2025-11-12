# Tailwind CSS Integration Guide

## 🎯 Why Tailwind + Your Design Tokens?

You already have an excellent design token system. Instead of replacing it, **Tailwind will use your tokens** as the source of truth. This gives you:

- ✅ **Faster development** - Utility classes instead of writing CSS
- ✅ **Your design system** - All Tailwind utilities use your CSS variables
- ✅ **Best of both worlds** - Keep your tokens, gain Tailwind's speed
- ✅ **No migration needed** - Use Tailwind alongside your existing CSS

## 🚀 Quick Start

### 1. Add Tailwind to your HTML

```html
<!-- Option A: Use Tailwind alongside your existing CSS -->
<link rel="stylesheet" href="./src/css/main.css" />
<link rel="stylesheet" href="./src/css/tailwind.css" />

<!-- Option B: Build Tailwind with PostCSS (recommended for production) -->
<!-- See build instructions below -->
```

### 2. Build Tailwind CSS (for production)

```bash
# Install PostCSS CLI if needed
npm install -D postcss-cli

# Build Tailwind CSS
npx tailwindcss -i ./src/css/tailwind.css -o ./dist/tailwind.css --watch
```

Or add to your `package.json`:

```json
{
  "scripts": {
    "build:css": "tailwindcss -i ./src/css/tailwind.css -o ./dist/tailwind.css",
    "build:css:watch": "tailwindcss -i ./src/css/tailwind.css -o ./dist/tailwind.css --watch"
  }
}
```

## 📝 Usage Examples

### Before (Vanilla CSS)

```html
<div class="top-bar">
  <div class="header-left">
    <div class="search-box">
      <input class="search-input" type="text" placeholder="Search..." />
    </div>
  </div>
  <div class="header-right">
    <button class="header-icon">...</button>
  </div>
</div>
```

```css
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--primitive-space-16) var(--primitive-space-32);
  background: var(--surface-primary);
  border-bottom: 1px solid var(--color-border-primary);
}
```

### After (Tailwind - Same Design Tokens!)

```html
<div
  class="flex justify-between items-center p-16 px-32 bg-surface-primary border-b border-border-primary"
>
  <div class="flex-1">
    <div class="relative">
      <input
        class="w-full px-12 py-12 pl-40 rounded-md border border-border-secondary bg-surface-secondary text-text-primary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
        type="text"
        placeholder="Search..."
      />
    </div>
  </div>
  <div class="flex items-center gap-16">
    <button
      class="w-44 h-44 rounded-md bg-transparent hover:bg-surface-secondary"
    >
      ...
    </button>
  </div>
</div>
```

**Notice:** All Tailwind classes use your CSS variables automatically!

## 🎨 Your Design Tokens → Tailwind Classes

| Your CSS Variable              | Tailwind Class           | Example              |
| ------------------------------ | ------------------------ | -------------------- |
| `--color-brand-primary`        | `bg-brand-primary`       | `bg-brand-primary`   |
| `--surface-primary`            | `bg-surface-primary`     | `bg-surface-primary` |
| `--color-text-primary`         | `text-text-primary`      | `text-text-primary`  |
| `--primitive-space-16`         | `p-16`, `m-16`, `gap-16` | `p-16`, `m-16`       |
| `--radius-component-md`        | `rounded-md`             | `rounded-md`         |
| `--typography-heading-lg-size` | `text-heading-lg`        | `text-heading-lg`    |

## 🔄 Migration Strategy

### Phase 1: Use Tailwind for New Components

- Keep existing CSS as-is
- Use Tailwind for new features
- Gradually migrate as you refactor

### Phase 2: Hybrid Approach

- Use Tailwind utilities for layout/spacing
- Keep component CSS for complex components
- Best of both worlds!

### Phase 3: Full Tailwind (Optional)

- Migrate components to Tailwind
- Use `@apply` for component classes
- Keep your design tokens

## 💡 Real Example: Top Bar Component

### Current Approach (Vanilla CSS)

```html
<div class="top-bar">
  <div class="header-left">...</div>
  <div class="header-right">...</div>
</div>
```

### Tailwind Approach (Same Visual Result)

```html
<div
  class="sticky top-0 z-sticky flex justify-between items-center h-72 px-16 px-32 bg-surface-primary border-b border-border-primary shadow-sm"
>
  <div class="flex items-center flex-1 min-w-0">...</div>
  <div class="flex items-center gap-16">...</div>
</div>
```

## 🎯 When to Use What?

### Use Tailwind For:

- ✅ Quick layouts and spacing
- ✅ Responsive breakpoints (`md:`, `lg:`)
- ✅ Hover/focus states (`hover:`, `focus:`)
- ✅ Flexbox/Grid utilities
- ✅ Rapid prototyping

### Keep Your CSS For:

- ✅ Complex component logic
- ✅ Animations and transitions
- ✅ Component-specific styles
- ✅ Design system components

## 🛠️ Custom Tailwind Components

You can create reusable components using `@apply`:

```css
/* In tailwind.css or a component file */
@layer components {
  .btn-primary {
    @apply px-16 py-12 rounded-md font-semibold;
    @apply bg-brand-primary text-white;
    @apply hover:bg-brand-primary-hover;
    @apply focus:outline-2 focus:outline-brand-primary;
  }

  .card {
    @apply p-24 rounded-lg bg-surface-primary border border-border-primary shadow-medium;
  }
}
```

Then use them:

```html
<button class="btn-primary">Click me</button>
<div class="card">Content</div>
```

## 📊 Comparison

| Feature           | Vanilla CSS                 | Tailwind                          |
| ----------------- | --------------------------- | --------------------------------- |
| Development Speed | Slower (write CSS)          | Faster (utility classes)          |
| Bundle Size       | Smaller (only what you use) | Larger (but purged in production) |
| Learning Curve    | Low (you know CSS)          | Medium (learn utilities)          |
| Design Tokens     | ✅ Full control             | ✅ Uses your tokens               |
| Maintainability   | High (semantic classes)     | Medium (utility-first)            |
| Flexibility       | High                        | Very High                         |

## 🚦 Recommendation

**Start using Tailwind for:**

1. New components and pages
2. Quick layout adjustments
3. Responsive breakpoints
4. Spacing and typography utilities

**Keep your existing CSS for:**

1. Complex components (like your top-bar)
2. Animations
3. Design system components

This hybrid approach gives you the best of both worlds!

## 📚 Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Tailwind + CSS Variables](https://tailwindcss.com/docs/customizing-colors#using-css-variables)
- Your Design Tokens: `src/css/tokens.css`

## ⚡ Quick Reference

```html
<!-- Spacing -->
<div class="p-16 m-24 gap-16">...</div>

<!-- Colors -->
<div class="bg-surface-primary text-text-primary">...</div>

<!-- Responsive -->
<div class="flex flex-col md:flex-row">...</div>

<!-- Hover/Focus -->
<button class="hover:bg-surface-secondary focus:ring-2">...</button>

<!-- Typography -->
<h1 class="text-heading-lg font-bold">Title</h1>
<p class="text-body-md text-text-secondary">Content</p>
```
