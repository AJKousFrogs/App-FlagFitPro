# UI State Consistency Checklist

## Overview

This checklist ensures all interactive elements follow the unified design system state patterns established in `states.scss`. Use this during QA testing and code reviews.

---

## Screens Checked (January 2026 Audit)

| Screen/Component | Location | Status |
|-----------------|----------|--------|
| Button Component | `shared/components/button/` | Compliant |
| ARIA Button | `shared/components/aria/aria-button.component.scss` | Updated |
| ARIA Dialog | `shared/components/aria/aria-dialog.component.scss` | Updated |
| Card Component | `shared/components/card/` | Compliant |
| Input Component | `shared/components/input/` | Compliant |
| Nav Item | `shared/components/nav-item.component.scss` | Updated |
| Sidebar | `shared/components/sidebar/sidebar.component.scss` | Updated |
| Alert | `shared/components/alert/alert.component.scss` | Updated |
| Success Checkmark | `shared/components/success-checkmark/` | Updated |
| Analytics | `features/analytics/analytics.component.scss` | Updated |
| Toast | `shared/components/toast/` | Compliant |

---

## Files Edited

1. **`angular/src/styles/design-system/states.scss`** - Extended with comprehensive state mixins
2. **`angular/src/app/shared/components/aria/aria-button.component.scss`** - Centralized states
3. **`angular/src/app/shared/components/aria/aria-dialog.component.scss`** - Fixed blur, focus ring
4. **`angular/src/app/shared/components/nav-item.component.scss`** - Centralized focus ring
5. **`angular/src/app/shared/components/sidebar/sidebar.component.scss`** - Desktop-only hover
6. **`angular/src/app/shared/components/alert/alert.component.scss`** - Desktop-only hover, focus ring
7. **`angular/src/app/shared/components/success-checkmark/success-checkmark.component.scss`** - Fixed initial render blur
8. **`angular/src/app/features/analytics/analytics.component.scss`** - Desktop-only hover
9. **`angular/src/index.html`** - Added initial render protection script

---

## QA Checklist

### 1. Hover States

- [ ] **Desktop only**: Hover effects should ONLY appear on devices with `@media (hover: hover) and (pointer: fine)`
- [ ] **Visual feedback**: Hover should provide clear visual feedback (background change, elevation, color shift)
- [ ] **No flicker**: Hover transitions should be smooth (use `var(--ds-state-transition)`)
- [ ] **Consistent across variants**: All button variants (primary, secondary, outlined, etc.) have matching hover patterns

**Test procedure**:
1. Test on desktop browser - hover effects should appear
2. Test on mobile device (or DevTools device mode) - NO hover effects on tap

### 2. Focus States (Keyboard Accessibility)

- [ ] **Visible focus ring**: All interactive elements show a visible focus ring on keyboard navigation
- [ ] **Green ring standard**: Focus ring is `2px solid var(--ds-primary-green)` with `outline-offset: 2px`
- [ ] **Shadow glow**: Focus includes `box-shadow: 0 0 0 4px rgba(8, 153, 73, 0.25)`
- [ ] **Mouse users excluded**: Focus ring hidden for mouse clicks via `:focus:not(:focus-visible)`
- [ ] **All elements covered**: Buttons, inputs, links, cards (interactive), menu items, tabs

**Test procedure**:
1. Tab through all interactive elements using keyboard
2. Verify green focus ring appears on each element
3. Click elements with mouse - no focus ring should appear

### 3. Disabled States

- [ ] **Visually distinct**: Disabled elements have `opacity: 0.5` and appear grayed out
- [ ] **Cursor indication**: Disabled elements show `cursor: not-allowed`
- [ ] **Non-interactive**: Disabled elements have `pointer-events: none`
- [ ] **No hover effects**: Disabled elements do NOT show hover state changes
- [ ] **ARIA support**: Both `:disabled` and `[aria-disabled="true"]` work

**Test procedure**:
1. Attempt to click disabled buttons - no action should occur
2. Hover over disabled elements - no visual change should occur
3. Verify disabled elements look clearly different from enabled

### 4. Active/Pressed States

- [ ] **Visual feedback**: Active state provides immediate visual feedback
- [ ] **Transform effect**: Active state uses `transform: scale(0.98)` or similar
- [ ] **Touch optimized**: Touch devices use `scale(0.97)` on `:active`
- [ ] **All devices**: Active state works on both desktop click and mobile tap

**Test procedure**:
1. Click and hold buttons - verify press effect appears
2. Tap buttons on mobile - verify tap feedback appears

### 5. Loading States

- [ ] **No layout shift**: Loading state maintains element dimensions
- [ ] **Visual indication**: Loading spinner or skeleton appears
- [ ] **Non-interactive**: Loading elements have `pointer-events: none`
- [ ] **Cursor change**: Loading state shows `cursor: wait`

**Test procedure**:
1. Trigger loading states (form submissions, data fetches)
2. Verify no layout jumping occurs
3. Verify elements cannot be clicked during loading

### 6. Initial Render (No Blur/Flicker)

- [ ] **No opacity 0 → 1 transitions**: Elements don't fade in on first render
- [ ] **No filter blur**: No blur filters on initial paint
- [ ] **Fonts loaded**: Font loading doesn't cause layout shift
- [ ] **Skeleton matching**: Skeleton loaders match final layout heights
- [ ] **Initial render class**: `html.ds-initial-render` prevents transitions on first paint

**Test procedure**:
1. Hard refresh the page (Cmd+Shift+R)
2. Watch for any flashing, blurring, or layout shifting
3. Record with slow-motion if needed to catch quick issues

---

## Design System State Variables

All components should use these CSS variables for consistency:

```scss
// Hover backgrounds
--ds-state-hover-bg: rgba(0, 0, 0, 0.04);

// Active backgrounds  
--ds-state-active-bg: rgba(0, 0, 0, 0.08);

// Focus ring
--ds-state-focus-ring: 0 0 0 3px rgba(8, 153, 73, 0.3);
--ds-state-focus-outline: 2px solid var(--ds-primary-green);
--ds-state-focus-outline-offset: 2px;

// Disabled
--ds-state-disabled-opacity: 0.5;

// Transition timing
--ds-state-transition: 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
```

---

## Available State Mixins

Import and use these mixins from `states.scss`:

```scss
@use "styles/design-system/states" as states;

// For buttons
@include states.ds-button-states;

// For inputs
@include states.ds-input-states;

// For cards
@include states.ds-card-states($interactive: true);

// For tabs
@include states.ds-tab-states;

// For menu items
@include states.ds-menu-item-states;

// For nav items
@include states.ds-nav-item-states;

// For icon buttons
@include states.ds-icon-button-states;

// For toggle switches
@include states.ds-toggle-states;

// Focus ring only
@include states.ds-focus-ring;

// Disabled state only
@include states.ds-disabled-state;
```

---

## Common Issues to Watch For

### Issue 1: Hover on Touch Devices
**Problem**: Hover states "stick" on mobile after tap
**Solution**: Wrap hover styles in `@media (hover: hover) and (pointer: fine)`

### Issue 2: Missing Focus Ring
**Problem**: Element can receive focus but has no visible indicator
**Solution**: Add `@include states.ds-focus-ring;`

### Issue 3: Disabled but Clickable-Looking
**Problem**: Disabled element has full opacity or no cursor change
**Solution**: Add `@include states.ds-disabled-state;`

### Issue 4: Initial Render Flash
**Problem**: Element flashes or blurs on page load
**Solution**: Use `visibility: hidden` instead of `opacity: 0` for hidden elements

### Issue 5: Inconsistent Transitions
**Problem**: Different transition speeds across components
**Solution**: Use `var(--ds-state-transition)` for all interactive transitions

---

## Reporting Issues

When reporting state consistency issues, include:

1. **Component name** and file path
2. **State type** (hover, focus, disabled, active, loading)
3. **Device type** (desktop, mobile, tablet)
4. **Browser** and version
5. **Screenshot or video** of the issue
6. **Expected behavior** vs actual behavior

---

## Version History

| Date | Author | Changes |
|------|--------|---------|
| Jan 2026 | UI Review | Initial checklist created, states.scss extended, key components updated |
