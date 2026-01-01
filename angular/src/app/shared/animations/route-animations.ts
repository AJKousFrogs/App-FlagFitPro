/**
 * Route Animations
 *
 * Premium page transition animations for Angular router.
 * Provides smooth, professional transitions between routes.
 *
 * Usage in app.config.ts:
 * provideRouter(routes, withViewTransitions())
 *
 * Usage in component:
 * @Component({
 *   animations: [routeAnimations]
 * })
 * <div [@routeAnimations]="outlet.isActivated ? outlet.activatedRoute : ''">
 *   <router-outlet #outlet="outlet"></router-outlet>
 * </div>
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  trigger,
  transition,
  style,
  query,
  animate,
  group,
  AnimationTriggerMetadata,
  animateChild,
  state,
} from "@angular/animations";

// ================================
// TIMING CONSTANTS
// ================================

const DURATION_FAST = "200ms";
const DURATION_NORMAL = "300ms";
const DURATION_SLOW = "400ms";

const EASING_SMOOTH = "cubic-bezier(0.25, 0.1, 0.25, 1)";
const EASING_BOUNCE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const EASING_DECELERATE = "cubic-bezier(0, 0, 0.2, 1)";
const EASING_ACCELERATE = "cubic-bezier(0.4, 0, 1, 1)";

// ================================
// FADE TRANSITION
// ================================

/**
 * Simple fade transition between routes
 * Usage: [@fadeRoute]="outlet.activatedRouteData['animation']"
 */
export const fadeRouteAnimation: AnimationTriggerMetadata = trigger(
  "fadeRoute",
  [
    transition("* <=> *", [
      style({ position: "relative" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            opacity: 1,
          }),
        ],
        { optional: true },
      ),
      query(":enter", [style({ opacity: 0 })], { optional: true }),
      group([
        query(
          ":leave",
          [
            animate(
              `${DURATION_NORMAL} ${EASING_SMOOTH}`,
              style({ opacity: 0 }),
            ),
          ],
          { optional: true },
        ),
        query(
          ":enter",
          [
            animate(
              `${DURATION_NORMAL} ${EASING_SMOOTH}`,
              style({ opacity: 1 }),
            ),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
);

// ================================
// SLIDE TRANSITION
// ================================

/**
 * Slide transition - slides left/right based on route depth
 * Usage: [@slideRoute]="prepareRoute(outlet)"
 */
export const slideRouteAnimation: AnimationTriggerMetadata = trigger(
  "slideRoute",
  [
    // Forward navigation (deeper route)
    transition(":increment", [
      style({ position: "relative", overflow: "hidden" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }),
        ],
        { optional: true },
      ),
      query(":enter", [style({ transform: "translateX(100%)", opacity: 0 })], {
        optional: true,
      }),
      group([
        query(
          ":leave",
          [
            animate(
              `${DURATION_SLOW} ${EASING_SMOOTH}`,
              style({ transform: "translateX(-30%)", opacity: 0 }),
            ),
          ],
          { optional: true },
        ),
        query(
          ":enter",
          [
            animate(
              `${DURATION_SLOW} ${EASING_SMOOTH}`,
              style({ transform: "translateX(0)", opacity: 1 }),
            ),
          ],
          { optional: true },
        ),
      ]),
    ]),
    // Back navigation (shallower route)
    transition(":decrement", [
      style({ position: "relative", overflow: "hidden" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }),
        ],
        { optional: true },
      ),
      query(":enter", [style({ transform: "translateX(-30%)", opacity: 0 })], {
        optional: true,
      }),
      group([
        query(
          ":leave",
          [
            animate(
              `${DURATION_SLOW} ${EASING_SMOOTH}`,
              style({ transform: "translateX(100%)", opacity: 0 }),
            ),
          ],
          { optional: true },
        ),
        query(
          ":enter",
          [
            animate(
              `${DURATION_SLOW} ${EASING_SMOOTH}`,
              style({ transform: "translateX(0)", opacity: 1 }),
            ),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
);

// ================================
// SCALE FADE TRANSITION
// ================================

/**
 * Scale with fade transition - elegant zoom effect
 * Usage: [@scaleFadeRoute]="outlet.isActivated"
 */
export const scaleFadeRouteAnimation: AnimationTriggerMetadata = trigger(
  "scaleFadeRoute",
  [
    transition("* <=> *", [
      style({ position: "relative" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            opacity: 1,
            transform: "scale(1)",
          }),
        ],
        { optional: true },
      ),
      query(":enter", [style({ opacity: 0, transform: "scale(0.95)" })], {
        optional: true,
      }),
      group([
        query(
          ":leave",
          [
            animate(
              `${DURATION_NORMAL} ${EASING_ACCELERATE}`,
              style({ opacity: 0, transform: "scale(1.02)" }),
            ),
          ],
          { optional: true },
        ),
        query(
          ":enter",
          [
            animate(
              `${DURATION_SLOW} ${EASING_BOUNCE}`,
              style({ opacity: 1, transform: "scale(1)" }),
            ),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
);

// ================================
// SLIDE UP TRANSITION
// ================================

/**
 * Slide up transition - new page slides up from bottom
 * Great for modal-like pages
 * Usage: [@slideUpRoute]="outlet.isActivated"
 */
export const slideUpRouteAnimation: AnimationTriggerMetadata = trigger(
  "slideUpRoute",
  [
    transition(":enter", [
      style({ transform: "translateY(20px)", opacity: 0 }),
      animate(
        `${DURATION_SLOW} ${EASING_BOUNCE}`,
        style({ transform: "translateY(0)", opacity: 1 }),
      ),
    ]),
    transition(":leave", [
      animate(
        `${DURATION_FAST} ${EASING_ACCELERATE}`,
        style({ transform: "translateY(-10px)", opacity: 0 }),
      ),
    ]),
  ],
);

// ================================
// FLIP TRANSITION
// ================================

/**
 * Flip transition - 3D flip effect
 * Usage: [@flipRoute]="outlet.isActivated"
 */
export const flipRouteAnimation: AnimationTriggerMetadata = trigger(
  "flipRoute",
  [
    transition("* <=> *", [
      style({ perspective: "1200px" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            backfaceVisibility: "hidden",
          }),
        ],
        { optional: true },
      ),
      query(":enter", [style({ transform: "rotateY(180deg)", opacity: 0 })], {
        optional: true,
      }),
      group([
        query(
          ":leave",
          [
            animate(
              `${DURATION_SLOW} ${EASING_SMOOTH}`,
              style({ transform: "rotateY(-180deg)", opacity: 0 }),
            ),
          ],
          { optional: true },
        ),
        query(
          ":enter",
          [
            animate(
              `${DURATION_SLOW} ${EASING_SMOOTH}`,
              style({ transform: "rotateY(0)", opacity: 1 }),
            ),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
);

// ================================
// MAIN ROUTE ANIMATION
// ================================

/**
 * Main route animation - recommended for most use cases
 * Combines fade with subtle slide for professional feel
 * Usage: [@routeAnimations]="prepareRoute(outlet)"
 */
export const routeAnimations: AnimationTriggerMetadata = trigger(
  "routeAnimations",
  [
    // Default transition
    transition("* <=> *", [
      style({ position: "relative" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            opacity: 1,
            transform: "translateY(0)",
          }),
        ],
        { optional: true },
      ),
      query(":enter", [style({ opacity: 0, transform: "translateY(10px)" })], {
        optional: true,
      }),
      group([
        query(
          ":leave",
          [
            animate(
              `${DURATION_FAST} ${EASING_ACCELERATE}`,
              style({ opacity: 0, transform: "translateY(-10px)" }),
            ),
          ],
          { optional: true },
        ),
        query(
          ":enter",
          [
            animate(
              `${DURATION_NORMAL} ${EASING_DECELERATE}`,
              style({ opacity: 1, transform: "translateY(0)" }),
            ),
          ],
          { optional: true },
        ),
      ]),
      query("@*", animateChild(), { optional: true }),
    ]),
  ],
);

// ================================
// PAGE ENTER/LEAVE ANIMATIONS
// ================================

/**
 * Page enter animation - for individual page components
 * Usage: [@pageEnter]
 */
export const pageEnterAnimation: AnimationTriggerMetadata = trigger(
  "pageEnter",
  [
    transition(":enter", [
      style({ opacity: 0, transform: "translateY(20px)" }),
      animate(
        `${DURATION_SLOW} ${EASING_BOUNCE}`,
        style({ opacity: 1, transform: "translateY(0)" }),
      ),
    ]),
  ],
);

/**
 * Page leave animation
 * Usage: [@pageLeave]
 */
export const pageLeaveAnimation: AnimationTriggerMetadata = trigger(
  "pageLeave",
  [
    transition(":leave", [
      animate(
        `${DURATION_FAST} ${EASING_ACCELERATE}`,
        style({ opacity: 0, transform: "translateY(-10px)" }),
      ),
    ]),
  ],
);

// ================================
// STAGGER CHILDREN ANIMATION
// ================================

/**
 * Stagger animation for page content
 * Animates children with delay
 * Usage: [@staggerContent]
 */
export const staggerContentAnimation: AnimationTriggerMetadata = trigger(
  "staggerContent",
  [
    transition(":enter", [
      query(
        ".stagger-item, [data-stagger]",
        [
          style({ opacity: 0, transform: "translateY(15px)" }),
          animate(
            `${DURATION_NORMAL} ${EASING_BOUNCE}`,
            style({ opacity: 1, transform: "translateY(0)" }),
          ),
        ],
        { optional: true },
      ),
    ]),
  ],
);

// ================================
// HELPER FUNCTION
// ================================

/**
 * Helper function to prepare route data for animations
 * Use in component: prepareRoute(outlet: RouterOutlet)
 */
export function prepareRoute(outlet: {
  activatedRouteData: Record<string, unknown>;
}): string | number {
  return (
    outlet?.activatedRouteData?.["animation"] ||
    outlet?.activatedRouteData?.["depth"] ||
    ""
  );
}

// ================================
// EXPORT ALL ROUTE ANIMATIONS
// ================================

export const ROUTE_ANIMATIONS = [
  routeAnimations,
  fadeRouteAnimation,
  slideRouteAnimation,
  scaleFadeRouteAnimation,
  slideUpRouteAnimation,
  flipRouteAnimation,
  pageEnterAnimation,
  pageLeaveAnimation,
  staggerContentAnimation,
];
