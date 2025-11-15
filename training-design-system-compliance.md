# Training.html Design System Compliance Report

## ✅ Compliant Areas

### Typography
- ✅ Using proper utility classes: `u-text-heading-lg`, `u-text-body-md`, `u-text-display-lg`
- ✅ Font weights follow design system: `u-font-weight-500`, `u-font-weight-600`, `u-font-weight-700`
- ✅ Font family: Poppins (loaded via Google Fonts)

### Colors
- ✅ Using design system color variables: `var(--color-brand-primary)`, `var(--color-text-primary)`, `var(--color-text-secondary)`
- ✅ Color utility classes: `u-text-primary`, `u-text-secondary`, `u-text-success`

### Icons
- ✅ Using Lucide icons (`data-lucide` attributes)
- ✅ Icon sizing classes: `icon-16`, `icon-20`, `icon-24`

## ⚠️ Issues Found

### 1. Buttons - Missing Size Classes
**Issue**: Buttons are missing the size specification (`btn-md` is the default but should be explicit per design system)

**Current**:
```html
<button class="btn btn-primary">Start</button>
```

**Should be**:
```html
<button class="btn btn-primary btn-md">Start</button>
```

**Affected lines**: 334, 567, 643, 694, 735, 776, 857, 938

### 2. Cards - Using Custom Class Instead of Standard
**Issue**: Using `stat-card` class instead of standard `.card` class. While `stat-card` may be a valid variant, it should follow the standard card structure.

**Current**:
```html
<div class="stat-card u-radius-xl u-padding-24 u-shadow-sm">
```

**Should be** (if stat-card is a valid variant):
```html
<div class="card stat-card">
  <div class="card-body">
    <!-- content -->
  </div>
</div>
```

**Note**: If `stat-card` is intentionally a custom component, ensure it follows design system spacing and styling patterns.

### 3. Inline Styles - Should Use Design System Variables
**Issue**: Some inline styles use hardcoded values instead of design system variables

**Examples**:
- `style="opacity: 0.7;"` - Should use CSS class or design system opacity variable
- `style="max-width: 600px;"` - Should use spacing variable
- `style="white-space: nowrap;"` - Acceptable utility

### 4. Button Font Weight Override
**Issue**: Using `u-font-weight-600` on buttons when buttons already have `font-weight: var(--font-weight-medium)` defined

**Current**:
```html
<button class="btn btn-primary u-font-weight-600">
```

**Should be**: Remove `u-font-weight-600` or ensure button component allows weight override

## 📋 Recommendations

1. **Add `btn-md` to all buttons** for explicit sizing (even though it's default)
2. **Review `stat-card` implementation** - ensure it extends `.card` base class
3. **Replace inline opacity** with utility classes or CSS variables
4. **Standardize card structure** to use `card-header`, `card-body`, `card-footer` where applicable
5. **Verify utility classes** map correctly to design system tokens

## 🔧 Quick Fixes Needed

1. Add `btn-md` to 8 button instances
2. Review and potentially refactor `stat-card` to extend `.card`
3. Replace inline `opacity: 0.7` with utility class or CSS variable
4. Remove redundant `u-font-weight-600` from buttons (if button component already sets weight)

