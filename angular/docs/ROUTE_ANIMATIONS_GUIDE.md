# Route Animation Guide

## Overview

Route animations provide smooth visual transitions between page navigations, enhancing the user experience with professional motion design aligned with our design system tokens.

**Implementation**: Week 3 Phase 3A (v3.1 Improvements)

**Files**:
- `/src/app/core/animations/route-animations.ts` - Animation definitions
- `/src/app/app.component.ts` - Animation integration
- Route config files - Animation type specification

## Animation Types

### 1. **fade** (Default)
Simple opacity transition - lowest motion, highest performance.

**Use for**:
- High-frequency navigations (dashboards, main sections)
- Pages with similar layouts
- When subtle transitions are preferred

**Example**:
```typescript
{
  path: "dashboard",
  component: DashboardComponent,
  data: { animation: "fade" }
}
```

**Visual**: Page fades in/out (300ms)

---

### 2. **slideLeft** (Forward Navigation)
New page slides in from right, old page slides out to left.

**Use for**:
- Drilling down into details (list → detail)
- Moving forward in a flow (step 1 → step 2)
- Hierarchical navigation (parent → child)

**Example**:
```typescript
{
  path: "training",
  component: TrainingScheduleComponent,
  data: { animation: "slideLeft" }
}
```

**Visual**: New page enters from right (100% → 0), old page exits to left (0 → -30%)

---

### 3. **slideRight** (Back Navigation)
New page slides in from left, old page slides out to right.

**Use for**:
- Going back up hierarchy (detail → list)
- Moving backward in a flow (step 2 → step 1)
- Breadcrumb navigation

**Example**:
```typescript
{
  path: "roster",
  component: RosterComponent,
  data: { animation: "slideRight" }
}
```

**Visual**: New page enters from left (-30% → 0), old page exits to right (0 → 100%)

---

### 4. **fadeScale** (Modal/Overlay)
Subtle scale + fade for overlay-like transitions.

**Use for**:
- Profile/settings pages (overlay-style)
- Modal-like full-page views
- Configuration/preferences screens

**Example**:
```typescript
{
  path: "settings",
  component: SettingsComponent,
  data: { animation: "fadeScale" }
}
```

**Visual**: New page scales up (0.95 → 1) while fading in, old page scales up (1 → 1.05) while fading out

---

### 5. **slideUp** (Mobile Sheets)
Page slides up from bottom - mobile-optimized.

**Use for**:
- Mobile-first pages (login, register)
- Bottom sheet-style content
- Forms and input-heavy pages on mobile

**Example**:
```typescript
{
  path: "login",
  component: LoginComponent,
  data: { animation: "slideUp" }
}
```

**Visual**: New page enters from bottom (20% → 0), old page exits upward (0 → -10%)

---

### 6. **none** (No Animation)
Instant transition - no animation.

**Use for**:
- Redirects
- High-performance requirements
- Same-layout transitions

**Example**:
```typescript
{
  path: "legacy-route",
  redirectTo: "/new-route",
  data: { animation: "none" }
}
```

**Visual**: Instant page swap

---

## Timing & Motion

All animations use design system motion tokens:

| Property | Value | Token Equivalent |
|----------|-------|------------------|
| **Duration** | 300ms | `--motion-base` |
| **Easing** | `cubic-bezier(0.4, 0.0, 0.2, 1)` | `--ease-standard` |

**Accessibility**: Animations automatically disable when user enables `prefers-reduced-motion` via the `[@.disabled]` directive on `<router-outlet>`.

---

## Implementation Examples

### Dashboard Routes
```typescript
// src/app/core/routes/groups/dashboard.routes.ts
export const dashboardRoutes: Routes = [
  {
    path: "todays-practice",
    loadComponent: () => import("...").then(m => m.TodayComponent),
    data: { animation: "fade" } // Fast, subtle
  },
  {
    path: "dashboard",
    loadComponent: () => import("...").then(m => m.DashboardComponent),
    data: { animation: "fade" } // High-frequency
  },
];
```

### Training Routes (Forward Flow)
```typescript
// src/app/core/routes/groups/training.routes.ts
export const trainingRoutes: Routes = [
  {
    path: "training",
    loadComponent: () => import("...").then(m => m.TrainingScheduleComponent),
    data: { animation: "slideLeft" } // Entering training section
  },
  {
    path: "training/workspace",
    loadComponent: () => import("...").then(m => m.TrainingComponent),
    data: { animation: "slideLeft" } // Drilling deeper
  },
];
```

### Profile Routes (Overlay Style)
```typescript
// src/app/core/routes/groups/profile.routes.ts
export const profileRoutes: Routes = [
  {
    path: "profile",
    loadComponent: () => import("...").then(m => m.ProfileComponent),
    data: { animation: "fadeScale" } // Modal-like
  },
  {
    path: "settings",
    loadComponent: () => import("...").then(m => m.SettingsComponent),
    data: { animation: "fadeScale" } // Overlay-style
  },
];
```

### Auth Routes (Mobile-Optimized)
```typescript
// src/app/core/routes/groups/public.routes.ts
export const publicRoutes: Routes = [
  {
    path: "login",
    loadComponent: () => import("...").then(m => m.LoginComponent),
    data: { animation: "slideUp" } // Bottom sheet style
  },
  {
    path: "register",
    loadComponent: () => import("...").then(m => m.RegisterComponent),
    data: { animation: "slideUp" } // Mobile-first
  },
];
```

---

## Best Practices

### 1. **Choose Animation Based on Context**
- **Dashboards/Frequent**: `fade` (fast, subtle)
- **Hierarchical Forward**: `slideLeft` (drilling down)
- **Hierarchical Back**: `slideRight` (going back)
- **Settings/Profile**: `fadeScale` (overlay-style)
- **Mobile Forms**: `slideUp` (bottom sheet)
- **Redirects**: `none` (instant)

### 2. **Maintain Directional Consistency**
```typescript
// ✅ GOOD: Consistent hierarchy
/training → /training/workspace (slideLeft)
/training/workspace → /training (slideRight)

// ❌ BAD: Inconsistent directions
/training → /training/workspace (slideRight) // Wrong direction
```

### 3. **Default to `fade` When Unsure**
If animation direction is ambiguous, use `fade`. It's safe, performant, and works for all contexts.

### 4. **Consider Mobile Performance**
- `fade` is the most performant (opacity only)
- `slideLeft`/`slideRight` use transforms (GPU-accelerated)
- `fadeScale` and `slideUp` are slightly more complex

### 5. **Test with Reduced Motion**
Always verify animations disable properly when users enable `prefers-reduced-motion`.

---

## Performance Considerations

### Bundle Impact
- **Route animations**: +2.31 kB to main bundle
- **Async loading**: Animations loaded asynchronously via `provideAnimationsAsync()`
- **GPU acceleration**: All transforms use GPU-accelerated properties (translateX, translateY, scale)

### Runtime Performance
- **Fade**: ~1-2ms per frame (opacity only)
- **Slide**: ~2-3ms per frame (transform)
- **FadeScale**: ~3-4ms per frame (transform + opacity)

All animations run at 60 FPS on modern devices.

---

## Troubleshooting

### Animation Not Playing

**Check**:
1. Does route have `data: { animation: 'type' }`?
2. Is `provideAnimationsAsync()` in `app.config.ts`?
3. Is `[@.disabled]="animationsDisabled()"` on `<router-outlet>`?
4. Check browser console for animation errors

### Animation Stuttering

**Causes**:
- Heavy component initialization during transition
- Large images loading without placeholders
- Synchronous operations blocking main thread

**Solutions**:
- Use skeleton loaders
- Defer heavy operations with `setTimeout(() => {}, 0)`
- Preload images and data

### Reduced Motion Not Disabling

**Check**:
- `animationsDisabled()` signal in `app.component.ts`
- `[@.disabled]` binding on `<router-outlet>`
- Browser setting: `prefers-reduced-motion: reduce`

---

## Migration Guide

### Adding Animations to Existing Routes

**Step 1**: Identify route type
- High-frequency? → `fade`
- Forward hierarchy? → `slideLeft`
- Back hierarchy? → `slideRight`
- Overlay-style? → `fadeScale`
- Mobile form? → `slideUp`

**Step 2**: Add animation data
```typescript
// Before:
{ path: "example", component: ExampleComponent }

// After:
{ path: "example", component: ExampleComponent, data: { animation: "fade" } }
```

**Step 3**: Test navigation
- Navigate to/from route
- Verify animation plays smoothly
- Test with reduced motion enabled

---

## Future Enhancements

### Planned Improvements (Phase 3B)
- [ ] Custom animation per route group
- [ ] Gesture-based navigation (swipe back/forward)
- [ ] Page transition progress indicator
- [ ] Cross-fade for similar layouts

### Experimental Features
- [ ] View transitions API (when browser support improves)
- [ ] Physics-based spring animations
- [ ] Route-aware animation direction (automatic slideLeft/slideRight)

---

## Related Documentation

- [Animation Primitives Guide](/docs/ANIMATION_PRIMITIVES.md) - Component-level animations
- [Design System Tokens](/src/scss/tokens/design-system-tokens.scss) - Motion tokens
- [Accessibility Guidelines](/docs/ACCESSIBILITY.md) - Reduced motion support

---

**Last Updated**: Week 3 Phase 3A (March 2026)
**Maintained By**: Frontend Team
**Questions?**: Contact the UI/UX team for animation guidance
