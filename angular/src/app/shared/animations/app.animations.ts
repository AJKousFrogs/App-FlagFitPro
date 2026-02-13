/**
 * Centralized Animation Definitions
 *
 * Angular 21 Animation System - Premium Edition
 * Provides reusable animations matching the FlagFit Pro design system
 * with enhanced micro-interactions and performance optimizations
 *
 * Usage:
 * ```typescript
 * import { fadeInOut, scaleInOut } from '@shared/animations/app.animations';
 *
 * @Component({
 *   animations: [fadeInOut, scaleInOut]
 * })
 * ```
 */

import { trigger, transition, style, animate } from "@angular/animations";

/**
 * Animation Timing Constants
 * Used by fadeInOut and scaleInOut
 */
export const ANIMATION_TIMINGS = {
  fast: "150ms",
  normal: "200ms",
} as const;

/**
 * Animation Easing Functions
 * Used by fadeInOut and scaleInOut
 */
export const ANIMATION_EASING = {
  entrance: "cubic-bezier(0, 0, 0.2, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  microSpring: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

/**
 * Common Animation Styles
 */
const fadeInStyle = style({ opacity: 0 });
const scaleInStyle = style({ transform: "scale(0.95)", opacity: 0 });

/**
 * Fade In/Out Animation
 * Simple opacity transition with smooth feel
 */
export const fadeInOut = trigger("fadeInOut", [
  transition(":enter", [
    fadeInStyle,
    animate(
      `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.entrance}`,
      style({ opacity: 1 }),
    ),
  ]),
  transition(":leave", [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ opacity: 0 }),
    ),
  ]),
]);

/**
 * Scale In/Out Animation
 * Scales content with fade - premium feel
 */
export const scaleInOut = trigger("scaleInOut", [
  transition(":enter", [
    scaleInStyle,
    animate(
      `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.microSpring}`,
      style({ transform: "scale(1)", opacity: 1 }),
    ),
  ]),
  transition(":leave", [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ transform: "scale(0.95)", opacity: 0 }),
    ),
  ]),
]);

