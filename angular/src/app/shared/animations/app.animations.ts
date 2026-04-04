/**
 * Motion timing/easing tokens for CSS animations (align with design-system motion).
 * Prefer global keyframes in `scss/utilities/_motion.scss` (e.g. `ui-motion-fade-in`).
 */

export const ANIMATION_TIMINGS = {
  fast: "150ms",
  normal: "200ms",
} as const;

export const ANIMATION_EASING = {
  entrance: "cubic-bezier(0, 0, 0.2, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  microSpring: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;
