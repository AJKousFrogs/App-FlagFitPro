/**
 * Centralized Animation Definitions
 * 
 * Angular 21 Animation System
 * Provides reusable animations matching the FlagFit Pro design system
 * 
 * Usage:
 * ```typescript
 * import { fadeInOut, slideDown, staggerFadeIn } from '@shared/animations/app.animations';
 * 
 * @Component({
 *   animations: [fadeInOut, slideDown]
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
  animateChild,
  AnimationMetadata,
  AnimationTriggerMetadata,
} from '@angular/animations';

/**
 * Animation Timing Constants
 * Matches design system tokens
 */
export const ANIMATION_TIMINGS = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

/**
 * Animation Easing Functions
 */
export const ANIMATION_EASING = {
  productive: 'ease',
  expressive: 'cubic-bezier(0.4, 0, 0.2, 1)',
  entrance: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  standard: 'cubic-bezier(0.4, 0, 0.6, 1)',
} as const;

/**
 * Common Animation Styles
 */
const fadeInStyle = style({ opacity: 0 });
const fadeOutStyle = style({ opacity: 1 });
const slideUpStyle = style({ transform: 'translateY(20px)', opacity: 0 });
const slideDownStyle = style({ transform: 'translateY(-20px)', opacity: 0 });
const slideLeftStyle = style({ transform: 'translateX(-20px)', opacity: 0 });
const slideRightStyle = style({ transform: 'translateX(20px)', opacity: 0 });
const scaleInStyle = style({ transform: 'scale(0.95)', opacity: 0 });
const scaleOutStyle = style({ transform: 'scale(1)', opacity: 1 });

/**
 * Fade In/Out Animation
 * Simple opacity transition
 */
export const fadeInOut = trigger('fadeInOut', [
  transition(':enter', [
    fadeInStyle,
    animate(`${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.entrance}`, style({ opacity: 1 })),
  ]),
  transition(':leave', [
    animate(`${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`, style({ opacity: 0 })),
  ]),
]);

/**
 * Slide Down Animation
 * Slides content down with fade
 */
export const slideDown = trigger('slideDown', [
  transition(':enter', [
    slideDownStyle,
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.entrance}`,
      style({ transform: 'translateY(0)', opacity: 1 })
    ),
  ]),
  transition(':leave', [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ transform: 'translateY(-20px)', opacity: 0 })
    ),
  ]),
]);

/**
 * Slide Up Animation
 * Slides content up with fade
 */
export const slideUp = trigger('slideUp', [
  transition(':enter', [
    slideUpStyle,
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.entrance}`,
      style({ transform: 'translateY(0)', opacity: 1 })
    ),
  ]),
  transition(':leave', [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ transform: 'translateY(20px)', opacity: 0 })
    ),
  ]),
]);

/**
 * Slide Left Animation
 * Slides content from left with fade
 */
export const slideLeft = trigger('slideLeft', [
  transition(':enter', [
    slideLeftStyle,
    animate(
      `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.entrance}`,
      style({ transform: 'translateX(0)', opacity: 1 })
    ),
  ]),
  transition(':leave', [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ transform: 'translateX(-20px)', opacity: 0 })
    ),
  ]),
]);

/**
 * Slide Right Animation
 * Slides content from right with fade
 */
export const slideRight = trigger('slideRight', [
  transition(':enter', [
    slideRightStyle,
    animate(
      `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.entrance}`,
      style({ transform: 'translateX(0)', opacity: 1 })
    ),
  ]),
  transition(':leave', [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ transform: 'translateX(20px)', opacity: 0 })
    ),
  ]),
]);

/**
 * Scale In/Out Animation
 * Scales content with fade
 */
export const scaleInOut = trigger('scaleInOut', [
  transition(':enter', [
    scaleInStyle,
    animate(
      `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.entrance}`,
      style({ transform: 'scale(1)', opacity: 1 })
    ),
  ]),
  transition(':leave', [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ transform: 'scale(0.95)', opacity: 0 })
    ),
  ]),
]);

/**
 * Stagger Fade In Animation
 * Fades in list items with stagger effect
 */
export const staggerFadeIn = trigger('staggerFadeIn', [
  transition('* => *', [
    query(
      ':enter',
      [
        fadeInStyle,
        stagger(`${ANIMATION_TIMINGS.fast}`, [
          animate(`${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.entrance}`, style({ opacity: 1 })),
        ]),
      ],
      { optional: true }
    ),
  ]),
]);

/**
 * Stagger Slide Up Animation
 * Slides up list items with stagger effect
 */
export const staggerSlideUp = trigger('staggerSlideUp', [
  transition('* => *', [
    query(
      ':enter',
      [
        slideUpStyle,
        stagger(`${ANIMATION_TIMINGS.fast}`, [
          animate(
            `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.entrance}`,
            style({ transform: 'translateY(0)', opacity: 1 })
          ),
        ]),
      ],
      { optional: true }
    ),
  ]),
]);

/**
 * Expand/Collapse Animation
 * Expands and collapses content vertically
 */
export const expandCollapse = trigger('expandCollapse', [
  transition(':enter', [
    style({ height: 0, opacity: 0, overflow: 'hidden' }),
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.entrance}`,
      style({ height: '*', opacity: 1 })
    ),
  ]),
  transition(':leave', [
    style({ height: '*', opacity: 1, overflow: 'hidden' }),
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ height: 0, opacity: 0 })
    ),
  ]),
]);

/**
 * Rotate Animation
 * Rotates element (useful for icons)
 */
export const rotate = trigger('rotate', [
  transition('false => true', [
    animate(`${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.standard}`, style({ transform: 'rotate(180deg)' })),
  ]),
  transition('true => false', [
    animate(`${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.standard}`, style({ transform: 'rotate(0deg)' })),
  ]),
]);

/**
 * Pulse Animation
 * Creates a pulsing effect
 */
export const pulse = trigger('pulse', [
  transition(':enter', [
    style({ transform: 'scale(1)' }),
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.expressive}`,
      style({ transform: 'scale(1.05)' })
    ),
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.expressive}`,
      style({ transform: 'scale(1)' })
    ),
  ]),
]);

/**
 * Shake Animation
 * Shakes element horizontally (useful for errors)
 */
export const shake = trigger('shake', [
  transition('* => shake', [
    animate(
      '100ms',
      style({ transform: 'translateX(-10px)' })
    ),
    animate(
      '100ms',
      style({ transform: 'translateX(10px)' })
    ),
    animate(
      '100ms',
      style({ transform: 'translateX(-10px)' })
    ),
    animate(
      '100ms',
      style({ transform: 'translateX(0)' })
    ),
  ]),
]);

/**
 * Route Transition Animation
 * Smooth transitions between routes
 */
export const routeTransition = trigger('routeTransition', [
  transition('* <=> *', [
    query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
    query(':enter', [fadeInStyle], { optional: true }),
    group([
      query(':leave', [animate(`${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.exit}`, style({ opacity: 0 }))], {
        optional: true,
      }),
      query(':enter', [animate(`${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.entrance}`, style({ opacity: 1 }))], {
        optional: true,
      }),
    ]),
  ]),
]);

/**
 * Modal Enter/Exit Animation
 * For modal dialogs
 */
export const modalEnterExit = trigger('modalEnterExit', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95) translateY(-20px)' }),
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.entrance}`,
      style({ opacity: 1, transform: 'scale(1) translateY(0)' })
    ),
  ]),
  transition(':leave', [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ opacity: 0, transform: 'scale(0.95) translateY(-20px)' })
    ),
  ]),
]);

/**
 * Toast Enter/Exit Animation
 * For toast notifications
 */
export const toastEnterExit = trigger('toastEnterExit', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(100%)' }),
    animate(
      `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.entrance}`,
      style({ opacity: 1, transform: 'translateX(0)' })
    ),
  ]),
  transition(':leave', [
    animate(
      `${ANIMATION_TIMINGS.fast} ${ANIMATION_EASING.exit}`,
      style({ opacity: 0, transform: 'translateX(100%)' })
    ),
  ]),
]);

/**
 * Drawer Slide Animation
 * For side drawers/panels
 */
export const drawerSlide = trigger('drawerSlide', [
  transition(':enter', [
    style({ transform: 'translateX(-100%)' }),
    animate(
      `${ANIMATION_TIMINGS.slow} ${ANIMATION_EASING.entrance}`,
      style({ transform: 'translateX(0)' })
    ),
  ]),
  transition(':leave', [
    animate(
      `${ANIMATION_TIMINGS.normal} ${ANIMATION_EASING.exit}`,
      style({ transform: 'translateX(-100%)' })
    ),
  ]),
]);

/**
 * All Common Animations
 * Export all animations for easy importing
 */
export const commonAnimations = [
  fadeInOut,
  slideDown,
  slideUp,
  slideLeft,
  slideRight,
  scaleInOut,
  staggerFadeIn,
  staggerSlideUp,
  expandCollapse,
  rotate,
  pulse,
  shake,
  routeTransition,
  modalEnterExit,
  toastEnterExit,
  drawerSlide,
];

/**
 * Animation Helper Functions
 */

/**
 * Create a custom fade animation with custom duration
 */
export function createFadeAnimation(duration: string = ANIMATION_TIMINGS.normal) {
  return trigger('fade', [
    transition(':enter', [
        fadeInStyle,
        animate(`${duration} ${ANIMATION_EASING.entrance}`, style({ opacity: 1 })),
    ]),
    transition(':leave', [
        animate(`${duration} ${ANIMATION_EASING.exit}`, style({ opacity: 0 })),
    ]),
  ]);
}

/**
 * Create a custom slide animation with custom direction and duration
 */
export function createSlideAnimation(
  direction: 'up' | 'down' | 'left' | 'right',
  duration: string = ANIMATION_TIMINGS.normal
) {
  const directions = {
    up: { enter: slideUpStyle, leave: { transform: 'translateY(20px)', opacity: 0 } },
    down: { enter: slideDownStyle, leave: { transform: 'translateY(-20px)', opacity: 0 } },
    left: { enter: slideLeftStyle, leave: { transform: 'translateX(-20px)', opacity: 0 } },
    right: { enter: slideRightStyle, leave: { transform: 'translateX(20px)', opacity: 0 } },
  };

  const config = directions[direction];

  return trigger(`slide${direction.charAt(0).toUpperCase() + direction.slice(1)}`, [
    transition(':enter', [
      config.enter,
      animate(`${duration} ${ANIMATION_EASING.entrance}`, style({ transform: 'translate(0, 0)', opacity: 1 })),
    ]),
    transition(':leave', [
      animate(`${duration} ${ANIMATION_EASING.exit}`, style(config.leave)),
    ]),
  ]);
}

