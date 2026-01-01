/**
 * Success Animations
 *
 * Premium animations for success states, form submissions, and achievements.
 * Includes checkmark animations, confetti effects, and celebration animations.
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  trigger,
  state,
  style,
  animate,
  transition,
  keyframes,
  AnimationTriggerMetadata,
  query,
  stagger,
  group,
} from "@angular/animations";

// ================================
// SUCCESS CHECKMARK ANIMATION
// ================================

/**
 * Animated checkmark that draws itself
 * Usage: [@successCheckmark]="isSuccess"
 */
export const successCheckmarkAnimation: AnimationTriggerMetadata = trigger(
  "successCheckmark",
  [
    state(
      "void",
      style({
        opacity: 0,
        transform: "scale(0.5)",
      }),
    ),
    state(
      "success",
      style({
        opacity: 1,
        transform: "scale(1)",
      }),
    ),
    transition("void => success", [
      animate(
        "400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        keyframes([
          style({ opacity: 0, transform: "scale(0)", offset: 0 }),
          style({ opacity: 1, transform: "scale(1.2)", offset: 0.6 }),
          style({ opacity: 1, transform: "scale(0.9)", offset: 0.8 }),
          style({ opacity: 1, transform: "scale(1)", offset: 1 }),
        ]),
      ),
    ]),
    transition("success => void", [
      animate("200ms ease-out", style({ opacity: 0, transform: "scale(0.5)" })),
    ]),
  ],
);

/**
 * Circle that expands behind the checkmark
 * Usage: [@successCircle]="isSuccess"
 */
export const successCircleAnimation: AnimationTriggerMetadata = trigger(
  "successCircle",
  [
    state(
      "void",
      style({
        opacity: 0,
        transform: "scale(0)",
      }),
    ),
    state(
      "success",
      style({
        opacity: 1,
        transform: "scale(1)",
      }),
    ),
    transition("void => success", [
      animate(
        "500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        keyframes([
          style({ opacity: 0, transform: "scale(0)", offset: 0 }),
          style({ opacity: 0.3, transform: "scale(1.5)", offset: 0.5 }),
          style({ opacity: 0, transform: "scale(2)", offset: 1 }),
        ]),
      ),
    ]),
  ],
);

// ================================
// FORM SUCCESS ANIMATION
// ================================

/**
 * Form success animation with fade and slide
 * Usage: [@formSuccess]="formState" (formState: 'idle' | 'submitting' | 'success' | 'error')
 */
export const formSuccessAnimation: AnimationTriggerMetadata = trigger(
  "formSuccess",
  [
    state(
      "idle",
      style({
        opacity: 1,
        transform: "translateY(0)",
      }),
    ),
    state(
      "submitting",
      style({
        opacity: 0.7,
        transform: "scale(0.98)",
      }),
    ),
    state(
      "success",
      style({
        opacity: 1,
        transform: "translateY(0)",
      }),
    ),
    state(
      "error",
      style({
        opacity: 1,
        transform: "translateX(0)",
      }),
    ),
    transition("idle => submitting", [animate("200ms ease-out")]),
    transition("submitting => success", [
      animate(
        "400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        keyframes([
          style({ opacity: 0.7, transform: "scale(0.98)", offset: 0 }),
          style({ opacity: 1, transform: "scale(1.02)", offset: 0.5 }),
          style({ opacity: 1, transform: "scale(1)", offset: 1 }),
        ]),
      ),
    ]),
    transition("submitting => error", [
      animate(
        "400ms ease-out",
        keyframes([
          style({ transform: "translateX(0)", offset: 0 }),
          style({ transform: "translateX(-10px)", offset: 0.2 }),
          style({ transform: "translateX(10px)", offset: 0.4 }),
          style({ transform: "translateX(-10px)", offset: 0.6 }),
          style({ transform: "translateX(5px)", offset: 0.8 }),
          style({ transform: "translateX(0)", offset: 1 }),
        ]),
      ),
    ]),
    transition("* => idle", [animate("200ms ease-out")]),
  ],
);

// ================================
// BUTTON SUCCESS ANIMATION
// ================================

/**
 * Button success state animation
 * Usage: [@buttonSuccess]="buttonState" (buttonState: 'idle' | 'loading' | 'success')
 */
export const buttonSuccessAnimation: AnimationTriggerMetadata = trigger(
  "buttonSuccess",
  [
    state(
      "idle",
      style({
        transform: "scale(1)",
      }),
    ),
    state(
      "loading",
      style({
        transform: "scale(1)",
      }),
    ),
    state(
      "success",
      style({
        transform: "scale(1)",
      }),
    ),
    transition("loading => success", [
      animate(
        "500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        keyframes([
          style({ transform: "scale(1)", offset: 0 }),
          style({ transform: "scale(1.1)", offset: 0.3 }),
          style({ transform: "scale(0.95)", offset: 0.6 }),
          style({ transform: "scale(1)", offset: 1 }),
        ]),
      ),
    ]),
    transition("success => idle", [animate("300ms ease-out")]),
  ],
);

// ================================
// ACHIEVEMENT UNLOCK ANIMATION
// ================================

/**
 * Achievement badge unlock animation
 * Usage: [@achievementUnlock]="isUnlocked"
 */
export const achievementUnlockAnimation: AnimationTriggerMetadata = trigger(
  "achievementUnlock",
  [
    state(
      "locked",
      style({
        opacity: 0.5,
        transform: "scale(0.9)",
        filter: "grayscale(100%)",
      }),
    ),
    state(
      "unlocked",
      style({
        opacity: 1,
        transform: "scale(1)",
        filter: "grayscale(0%)",
      }),
    ),
    transition("locked => unlocked", [
      group([
        animate(
          "600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          keyframes([
            style({
              opacity: 0.5,
              transform: "scale(0.9) rotate(-10deg)",
              filter: "grayscale(100%)",
              offset: 0,
            }),
            style({
              opacity: 1,
              transform: "scale(1.3) rotate(5deg)",
              filter: "grayscale(50%)",
              offset: 0.4,
            }),
            style({
              opacity: 1,
              transform: "scale(0.95) rotate(-2deg)",
              filter: "grayscale(20%)",
              offset: 0.7,
            }),
            style({
              opacity: 1,
              transform: "scale(1) rotate(0)",
              filter: "grayscale(0%)",
              offset: 1,
            }),
          ]),
        ),
      ]),
    ]),
  ],
);

// ================================
// TOAST SUCCESS ANIMATION
// ================================

/**
 * Toast notification slide-in animation
 * Usage: [@toastSlide]
 */
export const toastSlideAnimation: AnimationTriggerMetadata = trigger(
  "toastSlide",
  [
    transition(":enter", [
      style({
        opacity: 0,
        transform: "translateX(100%) scale(0.95)",
      }),
      animate(
        "400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        style({
          opacity: 1,
          transform: "translateX(0) scale(1)",
        }),
      ),
    ]),
    transition(":leave", [
      animate(
        "300ms ease-in",
        style({
          opacity: 0,
          transform: "translateX(100%) scale(0.95)",
        }),
      ),
    ]),
  ],
);

// ================================
// CONFETTI PARTICLE ANIMATION
// ================================

/**
 * Confetti particle animation for celebrations
 * Usage: [@confettiParticle]="{ value: 'active', params: { delay: 0, x: 0, rotation: 0 } }"
 */
export const confettiParticleAnimation: AnimationTriggerMetadata = trigger(
  "confettiParticle",
  [
    transition(":enter", [
      style({
        opacity: 1,
        transform: "translateY(0) translateX(0) rotate(0deg) scale(1)",
      }),
      animate(
        "{{ duration }}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        keyframes([
          style({
            opacity: 1,
            transform:
              "translateY(-100px) translateX({{ x }}px) rotate({{ rotation }}deg) scale(1)",
            offset: 0.3,
          }),
          style({
            opacity: 0.8,
            transform:
              "translateY(50px) translateX({{ x2 }}px) rotate({{ rotation2 }}deg) scale(0.8)",
            offset: 0.7,
          }),
          style({
            opacity: 0,
            transform:
              "translateY(200px) translateX({{ x3 }}px) rotate({{ rotation3 }}deg) scale(0.5)",
            offset: 1,
          }),
        ]),
      ),
    ]),
  ],
);

// ================================
// PULSE SUCCESS ANIMATION
// ================================

/**
 * Pulse animation for success indicators
 * Usage: [@pulseSuccess]="isActive"
 */
export const pulseSuccessAnimation: AnimationTriggerMetadata = trigger(
  "pulseSuccess",
  [
    state(
      "inactive",
      style({
        transform: "scale(1)",
        boxShadow: "0 0 0 0 rgba(var(--ds-primary-green-rgb), 0)",
      }),
    ),
    state(
      "active",
      style({
        transform: "scale(1)",
        boxShadow: "0 0 0 0 rgba(var(--ds-primary-green-rgb), 0)",
      }),
    ),
    transition("inactive => active", [
      animate(
        "1000ms ease-out",
        keyframes([
          style({
            transform: "scale(1)",
            boxShadow: "0 0 0 0 rgba(var(--ds-primary-green-rgb), 0.7)",
            offset: 0,
          }),
          style({
            transform: "scale(1.05)",
            boxShadow: "0 0 0 10px rgba(var(--ds-primary-green-rgb), 0.3)",
            offset: 0.5,
          }),
          style({
            transform: "scale(1)",
            boxShadow: "0 0 0 20px rgba(var(--ds-primary-green-rgb), 0)",
            offset: 1,
          }),
        ]),
      ),
    ]),
  ],
);

// ================================
// COUNTER INCREMENT ANIMATION
// ================================

/**
 * Number counter animation
 * Usage: [@counterIncrement]="{ value: count, params: { previous: prevCount } }"
 */
export const counterIncrementAnimation: AnimationTriggerMetadata = trigger(
  "counterIncrement",
  [
    transition("* => *", [
      animate(
        "300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        keyframes([
          style({ transform: "translateY(0) scale(1)", offset: 0 }),
          style({ transform: "translateY(-5px) scale(1.1)", offset: 0.5 }),
          style({ transform: "translateY(0) scale(1)", offset: 1 }),
        ]),
      ),
    ]),
  ],
);

// ================================
// STAGGER LIST SUCCESS ANIMATION
// ================================

/**
 * Staggered list items success animation
 * Usage: [@staggerSuccess]
 */
export const staggerSuccessAnimation: AnimationTriggerMetadata = trigger(
  "staggerSuccess",
  [
    transition(":enter", [
      query(
        ":enter",
        [
          style({ opacity: 0, transform: "translateY(20px)" }),
          stagger("50ms", [
            animate(
              "400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              style({ opacity: 1, transform: "translateY(0)" }),
            ),
          ]),
        ],
        { optional: true },
      ),
    ]),
  ],
);

// ================================
// EXPORT ALL ANIMATIONS
// ================================

export const SUCCESS_ANIMATIONS = [
  successCheckmarkAnimation,
  successCircleAnimation,
  formSuccessAnimation,
  buttonSuccessAnimation,
  achievementUnlockAnimation,
  toastSlideAnimation,
  confettiParticleAnimation,
  pulseSuccessAnimation,
  counterIncrementAnimation,
  staggerSuccessAnimation,
];
