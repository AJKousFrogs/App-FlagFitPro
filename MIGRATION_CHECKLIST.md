# Design System Migration Checklist

## Overview

This checklist tracks the migration of components and pages to use the new centralized design system tokens.

## ✅ Completed

### Design System Foundation

- [x] Created `design-system-tokens.scss` (single source of truth)
- [x] Created `standardized-components.scss` (component variants)
- [x] Created `layout-system.scss` (reusable layouts)
- [x] Updated `styles.scss` to use new design system
- [x] Deprecated legacy token files (`_variables.scss`, `_tokens.scss`, `_theme.scss`)

### Components Updated

- [x] `PageHeaderComponent` - Updated to use layout system
- [x] `HeaderComponent` - Updated avatar color to use CSS variable
- [x] `StatsGridComponent` - Updated hardcoded colors to CSS variables
- [x] `ProgressiveStatsComponent` - Updated hardcoded colors to CSS variables
- [x] `TrainingHeatmapComponent` - Updated intensity-7 color to CSS variable

## 🔄 In Progress

### Legacy Files (Deprecated but still functional)

- [ ] Remove `angular/src/assets/styles/_variables.scss` (after all components migrated)
- [ ] Remove `angular/src/assets/styles/_tokens.scss` (after all components migrated)
- [ ] Remove `angular/src/assets/styles/_theme.scss` (after all components migrated)
- [ ] Remove `angular/src/assets/styles/design-tokens.scss` (old version, replaced by design-system-tokens.scss)

## 📋 Components to Update

### Shared Components

- [ ] `WellnessWidgetComponent` - Update statusColor signal default value
- [ ] `ReadinessWidgetComponent` - Check for hardcoded colors
- [ ] `TrafficLightRiskComponent` - Migrate from Tailwind to design tokens
- [ ] `SidebarComponent` - Check for design token usage
- [ ] `SmartBreadcrumbsComponent` - Verify using layout system classes

### Feature Components

- [ ] `DashboardComponent` - Update chart colors and styling
- [ ] `TrainingComponent` - Update hardcoded colors
- [ ] `MicrocyclePlannerComponent` - Migrate hardcoded colors to tokens
- [ ] `AnalyticsComponent` - Update chart colors
- [ ] `PerformanceTrackingComponent` - Update colors
- [ ] `CoachComponent` - Update colors
- [ ] `RosterComponent` - Update gradient colors
- [ ] `ProfileComponent` - Update colors
- [ ] `ChatComponent` - Update colors
- [ ] `GameTrackerComponent` - Update colors

### HTML Pages

- [ ] Update all HTML pages to include `design-system-tokens.css`
- [ ] Replace hardcoded colors in HTML pages
- [ ] Update button classes to use standardized variants
- [ ] Update card classes to use standardized variants

## 🎨 Color Token Migration

### Find and Replace Patterns

**Hardcoded Primary Green:**

```typescript
// Find
'#089949'
"#089949"
color: #089949

// Replace with
var(--ds-primary-green)
'var(--ds-primary-green)'
color: var(--ds-primary-green)
```

**Hardcoded Colors in Styles:**

```scss
// Find
background-color: #089949;
color: #ffffff;

// Replace with
background-color: var(--ds-primary-green);
color: var(--color-text-on-primary);
```

**Legacy Token Usage:**

```scss
// Find
var(--color-brand-primary)
var(--color-primary)
var(--brand-green)

// Replace with (if needed for compatibility, they're aliased)
var(--ds-primary-green)  // Preferred
// Or keep using aliases (they redirect to new tokens)
```

## 📐 Component Variant Migration

### Buttons

```html
<!-- Old -->
<button class="btn btn-success">Save</button>
<button class="custom-button">Click</button>

<!-- New -->
<button class="btn btn-primary">Save</button>
<button class="btn btn-secondary">Cancel</button>
```

### Cards

```html
<!-- Old -->
<div class="custom-card">...</div>

<!-- New -->
<div class="card card-elevated">...</div>
```

### Tags/Badges

```html
<!-- Old -->
<span class="badge badge-green">New</span>

<!-- New -->
<span class="tag tag-primary">New</span>
```

## 🔍 Search Commands

### Find Hardcoded Colors

```bash
# Find all instances of #089949
grep -r "#089949" angular/src/app/

# Find hardcoded colors in styles
grep -r "color: #" angular/src/app/
grep -r "background.*#" angular/src/app/
```

### Find Legacy Token Usage

```bash
# Find components using old token files
grep -r "@import.*variables" angular/src/app/
grep -r "@import.*tokens" angular/src/app/
grep -r "@import.*theme" angular/src/app/
```

## 📝 Migration Steps for Each Component

1. **Identify hardcoded colors**
   - Search for `#089949` and other hardcoded colors
   - Check inline styles and CSS classes

2. **Replace with CSS variables**
   - Use `var(--ds-primary-green)` for primary green
   - Use semantic tokens for text/surface colors

3. **Update component variants**
   - Replace custom classes with standardized variants
   - Use `.btn-primary`, `.card-elevated`, etc.

4. **Test component**
   - Verify colors match design system
   - Check responsive behavior
   - Ensure accessibility (contrast ratios)

5. **Update documentation**
   - Add component to this checklist
   - Note any special considerations

## 🎯 Priority Order

### High Priority (Frequently Used)

1. Dashboard components
2. Shared components (used across app)
3. Navigation components

### Medium Priority

4. Feature-specific components
5. Form components

### Low Priority

6. Utility components
7. One-off pages

## 📚 Resources

- **Design System Docs**: `DESIGN_SYSTEM_REVAMP_SUMMARY.md`
- **Quick Reference**: `DESIGN_SYSTEM_QUICK_REFERENCE.md`
- **Token File**: `angular/src/assets/styles/design-system-tokens.scss`
- **Component Styles**: `angular/src/assets/styles/standardized-components.scss`
- **Layout System**: `angular/src/assets/styles/layout-system.scss`

## ⚠️ Notes

- Legacy token files are deprecated but still functional (they redirect to new tokens)
- Don't break existing functionality during migration
- Test thoroughly after each component update
- Keep this checklist updated as you progress
