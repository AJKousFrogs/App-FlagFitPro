# Animations Upgrade Guide

## Overview

The Angular application has been upgraded to use Angular 21's modern animation system with centralized, reusable animations that match the FlagFit Pro design system.

## What Changed

### 1. **Centralized Animation System**

- Created `angular/src/app/shared/animations/app.animations.ts` with reusable animation presets
- All animations match design system timing tokens
- Consistent easing functions across the application

### 2. **Performance Improvements**

- Upgraded from `provideAnimations()` to `provideAnimationsAsync()` in `app.config.ts`
- Animations load asynchronously, reducing initial bundle size
- Better performance for applications with many animations

### 3. **Animation Utilities**

- Created `animation.utils.ts` with helper classes and functions
- `AnimationState` - Manage animation states
- `AnimationPlayerManager` - Manage animation players for cleanup
- `AnimationHelper` - Utility service for programmatic animations

### 4. **View Transitions**

- Created `view-transitions.config.ts` for route transition utilities
- Helper functions for managing view transitions
- CSS styles for smooth page transitions

## Available Animations

### Basic Animations

- **fadeInOut** - Simple opacity transition
- **slideDown** - Slides content down with fade
- **slideUp** - Slides content up with fade
- **slideLeft** - Slides content from left
- **slideRight** - Slides content from right
- **scaleInOut** - Scales content with fade

### List Animations

- **staggerFadeIn** - Fades in list items with stagger effect
- **staggerSlideUp** - Slides up list items with stagger effect

### Special Animations

- **expandCollapse** - Expands and collapses content vertically
- **rotate** - Rotates element (useful for icons)
- **pulse** - Creates a pulsing effect
- **shake** - Shakes element horizontally (useful for errors)

### UI Component Animations

- **modalEnterExit** - For modal dialogs
- **toastEnterExit** - For toast notifications
- **drawerSlide** - For side drawers/panels
- **routeTransition** - Smooth transitions between routes

## Usage Examples

### Basic Component Animation

```typescript
import { Component } from "@angular/core";
import { fadeInOut, slideDown } from "@shared/animations/app.animations";

@Component({
  selector: "app-my-component",
  standalone: true,
  animations: [fadeInOut, slideDown],
  template: `
    <div [@fadeInOut]>Content</div>
    <div [@slideDown]>More content</div>
  `,
})
export class MyComponent {}
```

### Stagger Animation for Lists

```typescript
import { Component } from '@angular/core';
import { staggerFadeIn } from '@shared/animations/app.animations';

@Component({
  selector: 'app-list',
  standalone: true,
  animations: [staggerFadeIn],
  template: `
    <div [@staggerFadeIn]="items.length">
      @for (item of items; track item.id) {
        <div class="list-item">{{ item.name }}</div>
      }
    </div>
  `
})
export class ListComponent {
  items = signal([...]);
}
```

### Expand/Collapse Animation

```typescript
import { Component } from "@angular/core";
import { expandCollapse } from "@shared/animations/app.animations";

@Component({
  selector: "app-expandable",
  standalone: true,
  animations: [expandCollapse],
  template: `
    <button (click)="expanded.set(!expanded())">Toggle</button>
    @if (expanded()) {
      <div [@expandCollapse]>Expanded content</div>
    }
  `,
})
export class ExpandableComponent {
  expanded = signal(false);
}
```

### Programmatic Animations

```typescript
import { Component, ElementRef, inject } from "@angular/core";
import { AnimationHelper } from "@shared/animations/animation.utils";

@Component({
  selector: "app-animated",
  standalone: true,
  template: `<div #myElement>Content</div>`,
})
export class AnimatedComponent {
  private animationHelper = inject(AnimationHelper);

  animate(elementRef: ElementRef) {
    const player = this.animationHelper.fadeIn(elementRef, 300);
    player.onDone(() => {
      console.log("Animation complete");
    });
  }
}
```

### Custom Animation

```typescript
import { Component } from "@angular/core";
import {
  createFadeAnimation,
  ANIMATION_TIMINGS,
} from "@shared/animations/app.animations";

@Component({
  selector: "app-custom",
  standalone: true,
  animations: [createFadeAnimation(ANIMATION_TIMINGS.slow)],
  template: `<div [@fade]>Content</div>`,
})
export class CustomComponent {}
```

### View Transitions

```typescript
import { Component } from "@angular/core";
import { ViewTransitionHelper } from "@shared/animations/view-transitions.config";

@Component({
  selector: "app-navigation",
  standalone: true,
  template: ` <button (click)="navigate()">Navigate</button> `,
})
export class NavigationComponent {
  navigate() {
    ViewTransitionHelper.startTransition(() => {
      // Navigation logic
      this.router.navigate(["/new-route"]);
    });
  }
}
```

## Animation Timing Constants

All animations use consistent timing from design tokens:

```typescript
import {
  ANIMATION_TIMINGS,
  ANIMATION_EASING,
} from "@shared/animations/app.animations";

// Available timings:
ANIMATION_TIMINGS.fast; // 150ms
ANIMATION_TIMINGS.normal; // 200ms
ANIMATION_TIMINGS.slow; // 300ms
ANIMATION_TIMINGS.slower; // 500ms

// Available easing:
ANIMATION_EASING.productive; // ease
ANIMATION_EASING.expressive; // cubic-bezier(0.4, 0, 0.2, 1)
ANIMATION_EASING.entrance; // cubic-bezier(0, 0, 0.2, 1)
ANIMATION_EASING.exit; // cubic-bezier(0.4, 0, 1, 1)
```

## Accessibility

All animations respect user preferences:

- Automatically respects `prefers-reduced-motion` media query
- Use `getAnimationDuration()` helper to conditionally reduce animation duration
- View transitions automatically disable for reduced motion

```typescript
import {
  prefersReducedMotion,
  getAnimationDuration,
} from "@shared/animations/animation.utils";

const duration = getAnimationDuration("300ms", "0ms"); // Returns '0ms' if reduced motion
```

## Migration Guide

### Before (Old Pattern)

```typescript
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms', style({ opacity: 1 }))
      ])
    ])
  ]
})
```

### After (New Pattern)

```typescript
import { fadeInOut } from '@shared/animations/app.animations';

@Component({
  animations: [fadeInOut]
})
```

## Components Updated

- ✅ `progressive-stats.component.ts` - Now uses `expandCollapse`
- ✅ `ai-training-companion.component.ts` - Now uses `scaleInOut`
- ✅ `app.config.ts` - Upgraded to `provideAnimationsAsync()`

## Best Practices

1. **Use centralized animations** - Import from `@shared/animations/app.animations`
2. **Match design tokens** - All animations use consistent timing
3. **Respect accessibility** - Check `prefers-reduced-motion`
4. **Clean up players** - Use `AnimationPlayerManager` for programmatic animations
5. **Use stagger for lists** - Better UX for multiple items
6. **Keep animations subtle** - Don't over-animate

## Future Enhancements

- [ ] Add more specialized animations (bounce, flip, etc.)
- [ ] Create animation presets for common UI patterns
- [ ] Add animation performance monitoring
- [ ] Create animation testing utilities
