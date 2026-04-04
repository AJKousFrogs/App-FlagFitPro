# Route transitions

Route changes use the **browser View Transitions API** via Angular’s `withViewTransitions()` in `app.config.ts`.

- **Reduced motion:** `onViewTransitionCreated` calls `transition.skipTransition()` when `prefers-reduced-motion: reduce` is set.
- **Timing:** Default cross-fade is tuned in `src/scss/components/_view-transitions.scss` (`::view-transition-old(new)(root)`).
- **Angular animations:** The app uses `provideNoopAnimations()` — there is no `@angular/animations` route trigger on `<main>`.

Older per-route `data.animation` keys have been removed; customize transitions with global CSS or View Transition types if needed later.
