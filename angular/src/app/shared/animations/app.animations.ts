/**
 * Centralized Animation Definitions
 *
 * Angular 21 Animation System - Premium Edition
 * Provides reusable animations matching the FlagFit Pro design system
 * with enhanced micro-interactions and performance optimizations
 *
 * Usage:
 * ```typescript
 * import { fadeInOut, slideDown, staggerFadeIn, ripple } from '@shared/animations/app.animations';
 *
 * @Component({
 *   animations: [fadeInOut, slideDown, ripple]
 * })
 * ```
 */

import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
  group,
  state,
  keyframes,
} from "@angular/animations";

/**
 * Animation Timing Constants
 * Matches design system tokens with premium feel
 */
export const ANIMATION_TIMINGS = {
  instant: "100ms",
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
  slower: "400ms",
  slowest: "500ms",
  // Stagger timings
  staggerFast: "50ms",
  staggerNormal: "75ms",
  staggerSlow: "100ms",
} as const;

/**
 * Animation Easing Functions
 * Premium easing curves for delightful interactions
 */
export const ANIMATION_EASING = {
  // Standard easings
  productive: "ease",
  expressive: "cubic-bezier(0.4, 0, 0.2, 1)",
  entrance: "cubic-bezier(0, 0, 0.2, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  standard: "cubic-bezier(0.4, 0, 0.6, 1)",
  // Premium easings
  spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  smooth: "cubic-bezier(0.25, 0.1, 0.25, 1)",
  sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
  // Micro-interaction easings
  microBounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  microSpring: "cubic-bezier(0.22, 1, 0.36, 1)",
  overshoot: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

/**
 * Common Animation Styles
 */
const fadeInStyle = style({ opacity: 0 });
const _fadeOutStyle = style({ opacity: 1 });
const slideUpStyle = style({ transform: "translateY(20px)", opacity: 0 });
const slideDownStyle = style({ transform: "translateY(-20px)", opacity: 0 });
const slideLeftStyle = style({ transform: "translateX(-20px)", opacity: 0 });
const slideRightStyle = style({ transform: "translateX(20px)", opacity: 0 });
const scaleInStyle = style({ transform: "scale(0.95)", opacity: 0 });
const _scaleOutStyle = style({ transform: "scale(1)", opacity: 1 });
const _scaleUpStyle = style({ transform: "scale(0.9)", opacity: 0 });
const _scaleDownStyle = style({ transform: "scale(1.1)", opacity: 0 });

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
 * Fade Scale Animation
 * Premium fade with subtle scale for modern feel
 */
export const fadeScale = trigger("fadeScale", [
  transition(":enter", [
    style({ opacity: 0, transform: "scale(0.96)" }),
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.microSpring}`,
      style({ opacity: 1, transform: "scale(1)" }),
    ),
  ]),
  transition(":leave", [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ opacity: 0, transform: "scale(0.96)" }),
    ),
  ]),
]);

/**
 * Slide Down Animation
 * Slides content down with fade
 */
export const slideDown = trigger("slideDown", [
  transition(":enter", [
    slideDownStyle,
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.microSpring}`,
      style({ transform: "translateY(0)", opacity: 1 }),
    ),
  ]),
  transition(":leave", [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ transform: "translateY(-20px)", opacity: 0 }),
    ),
  ]),
]);

/**
 * Slide Up Animation
 * Slides content up with fade - perfect for cards and list items
 */
export const slideUp = trigger("slideUp", [
  transition(":enter", [
    slideUpStyle,
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.microSpring}`,
      style({ transform: "translateY(0)", opacity: 1 }),
    ),
  ]),
  transition(":leave", [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ transform: "translateY(20px)", opacity: 0 }),
    ),
  ]),
]);

/**
 * Slide Left Animation
 * Slides content from left with fade
 */
export const slideLeft = trigger("slideLeft", [
  transition(":enter", [
    slideLeftStyle,
    animate(
      `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.microSpring}`,
      style({ transform: "translateX(0)", opacity: 1 }),
    ),
  ]),
  transition(":leave", [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ transform: "translateX(-20px)", opacity: 0 }),
    ),
  ]),
]);

/**
 * Slide Right Animation
 * Slides content from right with fade
 */
export const slideRight = trigger("slideRight", [
  transition(":enter", [
    slideRightStyle,
    animate(
      `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.microSpring}`,
      style({ transform: "translateX(0)", opacity: 1 }),
    ),
  ]),
  transition(":leave", [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ transform: "translateX(20px)", opacity: 0 }),
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

/**
 * Pop In Animation
 * Bouncy scale animation for attention-grabbing elements
 */
export const popIn = trigger("popIn", [
  transition(":enter", [
    style({ transform: "scale(0.8)", opacity: 0 }),
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.overshoot}`,
      style({ transform: "scale(1)", opacity: 1 }),
    ),
  ]),
  transition(":leave", [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ transform: "scale(0.8)", opacity: 0 }),
    ),
  ]),
]);

/**
 * Bounce In Animation
 * Premium bounce effect for notifications and alerts
 */
export const bounceIn = trigger("bounceIn", [
  transition(":enter", [
    animate(
      `${ANIMATION_TIMINGS.slower} ${ANIMATION_EASING.bounce}`,
      keyframes([
        style({ transform: "scale(0.3)", opacity: 0, offset: 0 }),
        style({ transform: "scale(1.05)", opacity: 0.8, offset: 0.5 }),
        style({ transform: "scale(0.95)", opacity: 0.9, offset: 0.7 }),
        style({ transform: "scale(1)", opacity: 1, offset: 1 }),
      ]),
    ),
  ]),
  transition(":leave", [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ transform: "scale(0.8)", opacity: 0 }),
    ),
  ]),
]);

/**
 * Stagger Fade In Animation
 * Fades in list items with stagger effect
 */
export const staggerFadeIn = trigger("staggerFadeIn", [
  transition("* => *", [
    query(
      ":enter",
      [
        fadeInStyle,
        stagger(`${ANIMATION_TIMINGS.staggerNormal}`, [
          animate(
            `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.entrance}`,
            style({ opacity: 1 }),
          ),
        ]),
      ],
      { optional: true },
    ),
  ]),
]);

/**
 * Stagger Slide Up Animation
 * Slides up list items with stagger effect - perfect for cards
 */
export const staggerSlideUp = trigger("staggerSlideUp", [
  transition("* => *", [
    query(
      ":enter",
      [
        style({ transform: "translateY(30px)", opacity: 0 }),
        stagger(`${ANIMATION_TIMINGS.staggerNormal}`, [
          animate(
            `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.microSpring}`,
            style({ transform: "translateY(0)", opacity: 1 }),
          ),
        ]),
      ],
      { optional: true },
    ),
  ]),
]);

/**
 * Stagger Scale Animation
 * Premium stagger with scale for grid items
 */
export const staggerScale = trigger("staggerScale", [
  transition("* => *", [
    query(
      ":enter",
      [
        style({ transform: "scale(0.9)", opacity: 0 }),
        stagger(`${ANIMATION_TIMINGS.staggerSlow}`, [
          animate(
            `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.microSpring}`,
            style({ transform: "scale(1)", opacity: 1 }),
          ),
        ]),
      ],
      { optional: true },
    ),
  ]),
]);

/**
 * Cascade Animation
 * Premium cascade effect for hero sections
 */
export const cascade = trigger("cascade", [
  transition(":enter", [
    query(
      ".cascade-item, [cascade-item]",
      [
        style({ transform: "translateY(40px)", opacity: 0 }),
        stagger(`${ANIMATION_TIMINGS.staggerSlow}`, [
          animate(
            `${ANIMATION_TIMINGS.slower} ${ANIMATION_EASING.microSpring}`,
            style({ transform: "translateY(0)", opacity: 1 }),
          ),
        ]),
      ],
      { optional: true },
    ),
  ]),
]);

/**
 * Expand/Collapse Animation
 * Expands and collapses content vertically with smooth feel
 */
export const expandCollapse = trigger("expandCollapse", [
  transition(":enter", [
    style({ height: 0, opacity: 0, overflow: "hidden" }),
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.microSpring}`,
      style({ height: "*", opacity: 1 }),
    ),
  ]),
  transition(":leave", [
    style({ height: "*", opacity: 1, overflow: "hidden" }),
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ height: 0, opacity: 0 }),
    ),
  ]),
]);

/**
 * Accordion Animation
 * Smooth accordion expand/collapse
 */
export const accordion = trigger("accordion", [
  state("closed", style({ height: "0", opacity: 0, overflow: "hidden" })),
  state("open", style({ height: "*", opacity: 1, overflow: "visible" })),
  transition("closed <=> open", [
    animate(`${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.microSpring}`),
  ]),
]);

/**
 * Rotate Animation
 * Rotates element (useful for icons)
 */
export const rotate = trigger("rotate", [
  state("false", style({ transform: "rotate(0deg)" })),
  state("true", style({ transform: "rotate(180deg)" })),
  transition("false <=> true", [
    animate(`${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.microSpring}`),
  ]),
]);

/**
 * Spin Animation
 * Continuous spin for loading indicators
 */
export const spin = trigger("spin", [
  state("spinning", style({ transform: "rotate(360deg)" })),
  transition("* => spinning", [animate(`600ms linear`)]),
]);

/**
 * Pulse Animation
 * Creates a pulsing effect for attention
 */
export const pulse = trigger("pulse", [
  transition("* => pulse", [
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.expressive}`,
      keyframes([
        style({ transform: "scale(1)", offset: 0 }),
        style({ transform: "scale(1.05)", offset: 0.5 }),
        style({ transform: "scale(1)", offset: 1 }),
      ]),
    ),
  ]),
]);

/**
 * Heartbeat Animation
 * Premium heartbeat for live indicators
 */
export const heartbeat = trigger("heartbeat", [
  transition("* => beat", [
    animate(
      `${ANIMATION_TIMINGS.slower}`,
      keyframes([
        style({ transform: "scale(1)", offset: 0 }),
        style({ transform: "scale(1.15)", offset: 0.14 }),
        style({ transform: "scale(1)", offset: 0.28 }),
        style({ transform: "scale(1.15)", offset: 0.42 }),
        style({ transform: "scale(1)", offset: 0.7 }),
        style({ transform: "scale(1)", offset: 1 }),
      ]),
    ),
  ]),
]);

/**
 * Shake Animation
 * Shakes element horizontally (useful for errors)
 */
export const shake = trigger("shake", [
  transition("* => shake", [
    animate(
      `${ANIMATION_TIMINGS.slower}`,
      keyframes([
        style({ transform: "translateX(0)", offset: 0 }),
        style({ transform: "translateX(-10px)", offset: 0.1 }),
        style({ transform: "translateX(10px)", offset: 0.2 }),
        style({ transform: "translateX(-10px)", offset: 0.3 }),
        style({ transform: "translateX(10px)", offset: 0.4 }),
        style({ transform: "translateX(-5px)", offset: 0.5 }),
        style({ transform: "translateX(5px)", offset: 0.6 }),
        style({ transform: "translateX(-2px)", offset: 0.7 }),
        style({ transform: "translateX(2px)", offset: 0.8 }),
        style({ transform: "translateX(0)", offset: 1 }),
      ]),
    ),
  ]),
]);

/**
 * Wiggle Animation
 * Subtle wiggle for attention-grabbing
 */
export const wiggle = trigger("wiggle", [
  transition("* => wiggle", [
    animate(
      `${ANIMATION_TIMINGS.slow}`,
      keyframes([
        style({ transform: "rotate(0deg)", offset: 0 }),
        style({ transform: "rotate(-3deg)", offset: 0.25 }),
        style({ transform: "rotate(3deg)", offset: 0.5 }),
        style({ transform: "rotate(-3deg)", offset: 0.75 }),
        style({ transform: "rotate(0deg)", offset: 1 }),
      ]),
    ),
  ]),
]);

/**
 * Glow Animation
 * Subtle glow pulse for highlights
 */
export const glow = trigger("glow", [
  state("off", style({ boxShadow: "0 0 0 0 rgba(8, 153, 73, 0)" })),
  state("on", style({ boxShadow: "0 0 20px 5px rgba(8, 153, 73, 0.3)" })),
  transition("off <=> on", [
    animate(`${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.smooth}`),
  ]),
]);

/**
 * Route Transition Animation
 * Smooth transitions between routes
 */
export const routeTransition = trigger("routeTransition", [
  transition("* <=> *", [
    query(":enter, :leave", style({ position: "absolute", width: "100%" }), {
      optional: true,
    }),
    query(":enter", [style({ opacity: 0, transform: "translateY(10px)" })], {
      optional: true,
    }),
    group([
      query(
        ":leave",
        [
          animate(
            `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.exit}`,
            style({ opacity: 0, transform: "translateY(-10px)" }),
          ),
        ],
        { optional: true },
      ),
      query(
        ":enter",
        [
          animate(
            `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.microSpring}`,
            style({ opacity: 1, transform: "translateY(0)" }),
          ),
        ],
        { optional: true },
      ),
    ]),
  ]),
]);

/**
 * Page Enter Animation
 * Premium page entrance for main content
 */
export const pageEnter = trigger("pageEnter", [
  transition(":enter", [
    style({ opacity: 0, transform: "translateY(20px)" }),
    animate(
      `${ANIMATION_TIMINGS.slower} ${ANIMATION_EASING.microSpring}`,
      style({ opacity: 1, transform: "translateY(0)" }),
    ),
  ]),
]);

/**
 * Modal Enter/Exit Animation
 * For modal dialogs with premium feel
 */
export const modalEnterExit = trigger("modalEnterExit", [
  transition(":enter", [
    style({ opacity: 0, transform: "scale(0.95) translateY(-20px)" }),
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.microSpring}`,
      style({ opacity: 1, transform: "scale(1) translateY(0)" }),
    ),
  ]),
  transition(":leave", [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ opacity: 0, transform: "scale(0.95) translateY(-20px)" }),
    ),
  ]),
]);

/**
 * Backdrop Animation
 * Smooth backdrop fade for modals
 */
export const backdrop = trigger("backdrop", [
  transition(":enter", [
    style({ opacity: 0 }),
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
 * Toast Enter/Exit Animation
 * For toast notifications with slide and bounce
 */
export const toastEnterExit = trigger("toastEnterExit", [
  transition(":enter", [
    style({ opacity: 0, transform: "translateX(100%) scale(0.95)" }),
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.microSpring}`,
      style({ opacity: 1, transform: "translateX(0) scale(1)" }),
    ),
  ]),
  transition(":leave", [
    animate(
      `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.exit}`,
      style({ opacity: 0, transform: "translateX(100%) scale(0.95)" }),
    ),
  ]),
]);

/**
 * Notification Badge Animation
 * Bouncy badge appearance
 */
export const notificationBadge = trigger("notificationBadge", [
  transition(":enter", [
    style({ transform: "scale(0)", opacity: 0 }),
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.overshoot}`,
      style({ transform: "scale(1)", opacity: 1 }),
    ),
  ]),
  transition(":leave", [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ transform: "scale(0)", opacity: 0 }),
    ),
  ]),
]);

/**
 * Drawer Slide Animation
 * For side drawers/panels
 */
export const drawerSlide = trigger("drawerSlide", [
  transition(":enter", [
    style({ transform: "translateX(-100%)" }),
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.microSpring}`,
      style({ transform: "translateX(0)" }),
    ),
  ]),
  transition(":leave", [
    animate(
      `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.exit}`,
      style({ transform: "translateX(-100%)" }),
    ),
  ]),
]);

/**
 * Drawer Slide Right Animation
 * For right-side panels
 */
export const drawerSlideRight = trigger("drawerSlideRight", [
  transition(":enter", [
    style({ transform: "translateX(100%)" }),
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.microSpring}`,
      style({ transform: "translateX(0)" }),
    ),
  ]),
  transition(":leave", [
    animate(
      `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.exit}`,
      style({ transform: "translateX(100%)" }),
    ),
  ]),
]);

/**
 * Flip Animation
 * 3D flip effect for cards
 */
export const flip = trigger("flip", [
  state("front", style({ transform: "rotateY(0deg)" })),
  state("back", style({ transform: "rotateY(180deg)" })),
  transition("front <=> back", [
    animate(`${ANIMATION_TIMINGS.slower} ${ANIMATION_EASING.smooth}`),
  ]),
]);

/**
 * Hover Lift Animation
 * Subtle lift effect on hover
 */
export const hoverLift = trigger("hoverLift", [
  state(
    "default",
    style({ transform: "translateY(0)", boxShadow: "var(--shadow-sm)" }),
  ),
  state(
    "hover",
    style({ transform: "translateY(-4px)", boxShadow: "var(--shadow-lg)" }),
  ),
  transition("default <=> hover", [
    animate(`${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.microSpring}`),
  ]),
]);

/**
 * Press Animation
 * Tactile press feedback
 */
export const press = trigger("press", [
  state("default", style({ transform: "scale(1)" })),
  state("pressed", style({ transform: "scale(0.97)" })),
  transition("default <=> pressed", [
    animate(`${ANIMATION_TIMINGS.instant} ${ANIMATION_EASING.sharp}`),
  ]),
]);

/**
 * Skeleton Loading Animation
 * For skeleton loaders
 */
export const skeletonPulse = trigger("skeletonPulse", [
  transition("* => *", [
    animate(
      "1.5s ease-in-out",
      keyframes([
        style({ opacity: 1, offset: 0 }),
        style({ opacity: 0.4, offset: 0.5 }),
        style({ opacity: 1, offset: 1 }),
      ]),
    ),
  ]),
]);

/**
 * Counter Animation
 * For animating number changes
 */
export const counter = trigger("counter", [
  transition(":increment", [
    style({ transform: "translateY(-100%)", opacity: 0 }),
    animate(
      `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.microSpring}`,
      style({ transform: "translateY(0)", opacity: 1 }),
    ),
  ]),
  transition(":decrement", [
    style({ transform: "translateY(100%)", opacity: 0 }),
    animate(
      `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.microSpring}`,
      style({ transform: "translateY(0)", opacity: 1 }),
    ),
  ]),
]);

/**
 * Highlight Animation
 * Flash highlight for updated content
 */
export const highlight = trigger("highlight", [
  transition("* => highlight", [
    animate(
      `${ANIMATION_TIMINGS.slower}`,
      keyframes([
        style({ backgroundColor: "transparent", offset: 0 }),
        style({ backgroundColor: "rgba(8, 153, 73, 0.2)", offset: 0.3 }),
        style({ backgroundColor: "rgba(8, 153, 73, 0.2)", offset: 0.7 }),
        style({ backgroundColor: "transparent", offset: 1 }),
      ]),
    ),
  ]),
]);

/**
 * All Common Animations
 * Export all animations for easy importing
 */
export const commonAnimations = [
  fadeInOut,
  fadeScale,
  slideDown,
  slideUp,
  slideLeft,
  slideRight,
  scaleInOut,
  popIn,
  bounceIn,
  staggerFadeIn,
  staggerSlideUp,
  staggerScale,
  cascade,
  expandCollapse,
  accordion,
  rotate,
  spin,
  pulse,
  heartbeat,
  shake,
  wiggle,
  glow,
  routeTransition,
  pageEnter,
  modalEnterExit,
  backdrop,
  toastEnterExit,
  notificationBadge,
  drawerSlide,
  drawerSlideRight,
  flip,
  hoverLift,
  press,
  skeletonPulse,
  counter,
  highlight,
];

/**
 * Animation Helper Functions
 */

/**
 * Create a custom fade animation with custom duration
 */
export function createFadeAnimation(
  duration: string = ANIMATION_TIMINGS.normal,
) {
  return trigger("fade", [
    transition(":enter", [
      fadeInStyle,
      animate(
        `${duration} ${ANIMATION_EASING.entrance}`,
        style({ opacity: 1 }),
      ),
    ]),
    transition(":leave", [
      animate(`${duration} ${ANIMATION_EASING.exit}`, style({ opacity: 0 })),
    ]),
  ]);
}

/**
 * Create a custom slide animation with custom direction and duration
 */
export function createSlideAnimation(
  direction: "up" | "down" | "left" | "right",
  duration: string = ANIMATION_TIMINGS.normal,
  distance: string = "20px",
) {
  const directions = {
    up: {
      enter: { transform: `translateY(${distance})`, opacity: 0 },
      leave: { transform: `translateY(${distance})`, opacity: 0 },
    },
    down: {
      enter: { transform: `translateY(-${distance})`, opacity: 0 },
      leave: { transform: `translateY(-${distance})`, opacity: 0 },
    },
    left: {
      enter: { transform: `translateX(-${distance})`, opacity: 0 },
      leave: { transform: `translateX(-${distance})`, opacity: 0 },
    },
    right: {
      enter: { transform: `translateX(${distance})`, opacity: 0 },
      leave: { transform: `translateX(${distance})`, opacity: 0 },
    },
  };

  const config = directions[direction];

  return trigger(
    `slide${direction.charAt(0).toUpperCase() + direction.slice(1)}Custom`,
    [
      transition(":enter", [
        style(config.enter),
        animate(
          `${duration} ${ANIMATION_EASING.microSpring}`,
          style({ transform: "translate(0, 0)", opacity: 1 }),
        ),
      ]),
      transition(":leave", [
        animate(`${duration} ${ANIMATION_EASING.exit}`, style(config.leave)),
      ]),
    ],
  );
}

/**
 * Create a stagger animation with custom timing
 */
export function createStaggerAnimation(
  staggerTime: string = ANIMATION_TIMINGS.staggerNormal,
  animationDuration: string = ANIMATION_TIMINGS.slow,
) {
  return trigger("customStagger", [
    transition("* => *", [
      query(
        ":enter",
        [
          style({ transform: "translateY(20px)", opacity: 0 }),
          stagger(staggerTime, [
            animate(
              `${animationDuration} ${ANIMATION_EASING.microSpring}`,
              style({ transform: "translateY(0)", opacity: 1 }),
            ),
          ]),
        ],
        { optional: true },
      ),
    ]),
  ]);
}
