# Quick Responsive Reference Card

## FlagFit Pro - Developer Quick Guide

---

## 🎯 Common Breakpoints

```css
/* Mobile Small */
@media (max-width: 480px) {
}

/* Mobile Medium */
@media (max-width: 768px) {
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
}

/* Desktop */
@media (min-width: 1025px) {
}
```

---

## 📱 Mobile Checklist

- ✅ No horizontal scroll
- ✅ Touch targets ≥44px
- ✅ Input font-size ≥16px (iOS zoom prevention)
- ✅ Modals full-screen
- ✅ Sidebar slides in/out
- ✅ Tables scroll horizontally

---

## 🎨 CSS Variables (Breakpoints)

```css
--bp-mobile: 320px;
--bp-mobile-lg: 480px;
--bp-tablet: 768px;
--bp-tablet-lg: 1024px;
--bp-desktop: 1280px;
```

---

## 🔧 Common Patterns

### Full-Width on Mobile

```css
@media (max-width: 768px) {
  .container {
    width: 100% !important;
    max-width: 100% !important;
    padding: 16px !important;
  }
}
```

### Stack Grids on Mobile

```css
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr !important;
  }
}
```

### Touch Target

```css
@media (max-width: 768px) {
  button,
  .btn {
    min-height: 44px !important;
    min-width: 44px !important;
  }
}
```

### iOS Zoom Prevention

```css
input,
textarea,
select {
  font-size: 16px !important; /* Mobile */
}

@media (min-width: 768px) {
  input,
  textarea,
  select {
    font-size: var(--typography-body-md-size);
  }
}
```

---

## 📋 Testing Commands

```bash
# Run automated responsive test
node scripts/test-responsive-pages.js

# Check viewport meta tags
grep -r "viewport" *.html

# Find fixed widths
grep -r "width:.*px" src/css/
```

---

## 🚨 Common Issues

| Issue               | Solution                              |
| ------------------- | ------------------------------------- |
| Horizontal scroll   | Add `overflow-x: hidden` to html/body |
| iOS zoom on input   | Set `font-size: 16px` minimum         |
| Small touch targets | Add `min-height: 44px`                |
| Modal overflow      | Make full-screen on mobile            |
| Table overflow      | Add horizontal scroll wrapper         |

---

## 📁 Key Files

- `src/css/responsive-fixes.css` - Global fixes
- `src/css/breakpoints.css` - Breakpoint definitions
- `RESPONSIVE_FIXES_SUMMARY.md` - Complete summary
- `VISUAL_RESPONSIVE_TESTING_GUIDE.md` - Testing guide

---

**Quick Tip:** Always test at 375px (iPhone SE) and 768px (iPad) breakpoints!
