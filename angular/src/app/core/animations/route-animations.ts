import {
  trigger,
  transition,
  style,
  query,
  group,
  animate,
  AnimationTriggerMetadata,
} from "@angular/animations";

/**
 * Route Transition Animations
 * ============================
 *
 * Provides smooth transitions between route changes aligned with design system motion tokens.
 * See Week 3 Phase 3A of v3.1 improvements.
 *
 * USAGE:
 *   // In app.component.ts:
 *   import { routeAnimations } from './core/animations/route-animations';
 *
 *   @Component({
 *     template: `<router-outlet></router-outlet>`,
 *     animations: [routeAnimations]
 *   })
 *
 *   // In route config:
 *   { path: 'dashboard', component: DashboardComponent, data: { animation: 'fade' } }
 *
 * ANIMATION TYPES:
 *   - fade           - Simple opacity transition (default)
 *   - slideLeft      - Slide in from right (forward navigation)
 *   - slideRight     - Slide in from left (back navigation)
 *   - fadeScale      - Fade + subtle scale (modals, overlays)
 *   - slideUp        - Slide in from bottom (mobile sheets)
 *   - none           - No animation
 *
 * TIMING:
 *   - Duration: 300ms (--motion-base equivalent)
 *   - Easing: cubic-bezier(0.4, 0.0, 0.2, 1) (--ease-standard)
 *   - Respects prefers-reduced-motion via [@.disabled] on router-outlet
 */

// Animation timing aligned with design tokens
const DURATION = 300; // --motion-base: 300ms
const EASE = "cubic-bezier(0.4, 0.0, 0.2, 1)"; // --ease-standard

/**
 * Route animation trigger
 * Watches for route changes and applies appropriate transition
 */
export const routeAnimations: AnimationTriggerMetadata = trigger(
  "routeAnimations",
  [
    // ============================================
    // FADE TRANSITION (Default)
    // ============================================
    // Simple opacity fade - lowest motion, highest performance
    transition("* <=> fade", [
      style({ position: "relative" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
          }),
        ],
        { optional: true },
      ),
      query(":enter", [style({ opacity: 0 })], { optional: true }),
      group([
        query(
          ":leave",
          [animate(`${DURATION}ms ${EASE}`, style({ opacity: 0 }))],
          { optional: true },
        ),
        query(
          ":enter",
          [animate(`${DURATION}ms ${EASE}`, style({ opacity: 1 }))],
          { optional: true },
        ),
      ]),
    ]),

    // ============================================
    // SLIDE LEFT (Forward Navigation)
    // ============================================
    // New page slides in from right, old page slides out to left
    transition("* <=> slideLeft", [
      style({ position: "relative" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
          }),
        ],
        { optional: true },
      ),
      query(
        ":enter",
        [
          style({
            transform: "translateX(100%)",
            opacity: 0,
          }),
        ],
        { optional: true },
      ),
      group([
        query(
          ":leave",
          [
            animate(
              `${DURATION}ms ${EASE}`,
              style({
                transform: "translateX(-30%)",
                opacity: 0,
              }),
            ),
          ],
          { optional: true },
        ),
        query(
          ":enter",
          [
            animate(
              `${DURATION}ms ${EASE}`,
              style({
                transform: "translateX(0)",
                opacity: 1,
              }),
            ),
          ],
          { optional: true },
        ),
      ]),
    ]),

    // ============================================
    // SLIDE RIGHT (Back Navigation)
    // ============================================
    // New page slides in from left, old page slides out to right
    transition("* <=> slideRight", [
      style({ position: "relative" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
          }),
        ],
        { optional: true },
      ),
      query(
        ":enter",
        [
          style({
            transform: "translateX(-30%)",
            opacity: 0,
          }),
        ],
        { optional: true },
      ),
      group([
        query(
          ":leave",
          [
            animate(
              `${DURATION}ms ${EASE}`,
              style({
                transform: "translateX(100%)",
                opacity: 0,
              }),
            ),
          ],
          { optional: true },
        ),
        query(
          ":enter",
          [
            animate(
              `${DURATION}ms ${EASE}`,
              style({
                transform: "translateX(0)",
                opacity: 1,
              }),
            ),
          ],
          { optional: true },
        ),
      ]),
    ]),

    // ============================================
    // FADE SCALE (Modal/Overlay)
    // ============================================
    // Subtle scale + fade for overlay-like transitions
    transition("* <=> fadeScale", [
      style({ position: "relative" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
          }),
        ],
        { optional: true },
      ),
      query(
        ":enter",
        [
          style({
            opacity: 0,
            transform: "scale(0.95)",
          }),
        ],
        { optional: true },
      ),
      group([
        query(
          ":leave",
          [
            animate(
              `${DURATION}ms ${EASE}`,
              style({
                opacity: 0,
                transform: "scale(1.05)",
              }),
            ),
          ],
          { optional: true },
        ),
        query(
          ":enter",
          [
            animate(
              `${DURATION}ms ${EASE}`,
              style({
                opacity: 1,
                transform: "scale(1)",
              }),
            ),
          ],
          { optional: true },
        ),
      ]),
    ]),

    // ============================================
    // SLIDE UP (Mobile Sheets)
    // ============================================
    // Page slides up from bottom (mobile-optimized)
    transition("* <=> slideUp", [
      style({ position: "relative" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
          }),
        ],
        { optional: true },
      ),
      query(
        ":enter",
        [
          style({
            transform: "translateY(20%)",
            opacity: 0,
          }),
        ],
        { optional: true },
      ),
      group([
        query(
          ":leave",
          [
            animate(
              `${DURATION}ms ${EASE}`,
              style({
                transform: "translateY(-10%)",
                opacity: 0,
              }),
            ),
          ],
          { optional: true },
        ),
        query(
          ":enter",
          [
            animate(
              `${DURATION}ms ${EASE}`,
              style({
                transform: "translateY(0)",
                opacity: 1,
              }),
            ),
          ],
          { optional: true },
        ),
      ]),
    ]),

    // ============================================
    // NO ANIMATION
    // ============================================
    // Instant transition (for high-frequency navigations)
    transition("* <=> none", []),
  ],
);

/**
 * Helper to get animation state from activated route
 * Used in app.component.ts to bind animation trigger
 *
 * @example
 * <router-outlet
 *   #outlet="outlet"
 *   [@routeAnimations]="getRouteAnimationState(outlet)"
 * ></router-outlet>
 */
export function getRouteAnimationState(outlet: any): string {
  return (
    outlet?.activatedRouteData?.["animation"] ||
    outlet?.activatedRoute?.snapshot?.data?.["animation"] ||
    "fade"
  );
}
