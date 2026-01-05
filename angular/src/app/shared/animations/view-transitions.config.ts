/**
 * View Transitions Configuration - Angular 21 Premium Edition
 *
 * Angular 21 View Transitions API configuration
 * Provides smooth page transitions between routes with premium effects
 */

/**
 * View Transition Options
 */
export interface ViewTransitionOptions {
  skipTransition?: boolean;
  transitionName?: string;
  transitionType?: "fade" | "slide" | "scale" | "morph";
}

/**
 * View Transition Helper
 * Provides utilities for managing view transitions
 */
export class ViewTransitionHelper {
  /**
   * Check if view transitions are supported
   */
  static isSupported(): boolean {
    return typeof document !== "undefined" && "startViewTransition" in document;
  }

  /**
   * Check if reduced motion is preferred
   */
  static prefersReducedMotion(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /**
   * Start a view transition
   */
  static startTransition(callback: () => void): Promise<void> {
    if (!this.isSupported() || this.prefersReducedMotion()) {
      callback();
      return Promise.resolve();
    }

    return (document as Document & { startViewTransition: (callback: () => void) => { finished: Promise<void> } }).startViewTransition(callback).finished;
  }

  /**
   * Start a view transition with custom options
   */
  static startTransitionWithOptions(
    callback: () => void,
    options: ViewTransitionOptions = {},
  ): Promise<void> {
    if (
      options.skipTransition ||
      !this.isSupported() ||
      this.prefersReducedMotion()
    ) {
      callback();
      return Promise.resolve();
    }

    // Set transition type attribute
    if (options.transitionType) {
      document.documentElement.setAttribute(
        "data-transition-type",
        options.transitionType,
      );
    }

    // Set transition name for specific element transitions
    if (options.transitionName) {
      document.documentElement.setAttribute(
        "data-transition-name",
        options.transitionName,
      );
    }

    return (document as Document & { startViewTransition: (callback: () => void) => { finished: Promise<void> } })
      .startViewTransition(callback)
      .finished.finally(() => {
        // Clean up attributes after transition
        document.documentElement.removeAttribute("data-transition-type");
        document.documentElement.removeAttribute("data-transition-name");
      });
  }

  /**
   * Skip transition for next navigation
   */
  static skipNextTransition(): void {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-skip-transition", "true");
    }
  }

  /**
   * Check if transition should be skipped
   */
  static shouldSkipTransition(): boolean {
    if (typeof document === "undefined") {
      return false;
    }
    const skip =
      document.documentElement.getAttribute("data-skip-transition") === "true";
    if (skip) {
      document.documentElement.removeAttribute("data-skip-transition");
    }
    return skip;
  }

  /**
   * Set view transition name on an element
   */
  static setViewTransitionName(element: HTMLElement, name: string): void {
    element.style.viewTransitionName = name;
  }

  /**
   * Remove view transition name from an element
   */
  static removeViewTransitionName(element: HTMLElement): void {
    element.style.viewTransitionName = "";
  }
}

/**
 * View Transition CSS Classes
 * Add these to your global styles for view transitions
 */
export const VIEW_TRANSITION_STYLES = `
  /* ================================================================
     VIEW TRANSITION STYLES - PREMIUM EDITION
     ================================================================ */

  /* Base View Transition Settings */
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 300ms;
    animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* ================================
     FADE TRANSITION (Default)
     ================================ */

  ::view-transition-old(root) {
    animation-name: vt-fade-out;
  }

  ::view-transition-new(root) {
    animation-name: vt-fade-in;
  }

  @keyframes vt-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes vt-fade-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  /* ================================
     SLIDE TRANSITIONS
     ================================ */

  /* Slide Left */
  [data-transition-type="slide"] ::view-transition-old(root),
  [data-transition="slide-left"] ::view-transition-old(root) {
    animation-name: vt-slide-out-left;
  }

  [data-transition-type="slide"] ::view-transition-new(root),
  [data-transition="slide-left"] ::view-transition-new(root) {
    animation-name: vt-slide-in-right;
  }

  @keyframes vt-slide-in-right {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes vt-slide-out-left {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(-30px);
    }
  }

  /* Slide Right */
  [data-transition="slide-right"] ::view-transition-old(root) {
    animation-name: vt-slide-out-right;
  }

  [data-transition="slide-right"] ::view-transition-new(root) {
    animation-name: vt-slide-in-left;
  }

  @keyframes vt-slide-in-left {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes vt-slide-out-right {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(30px);
    }
  }

  /* Slide Up */
  [data-transition="slide-up"] ::view-transition-old(root) {
    animation-name: vt-slide-out-up;
  }

  [data-transition="slide-up"] ::view-transition-new(root) {
    animation-name: vt-slide-in-up;
  }

  @keyframes vt-slide-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes vt-slide-out-up {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-30px);
    }
  }

  /* ================================
     SCALE TRANSITION
     ================================ */

  [data-transition-type="scale"] ::view-transition-old(root) {
    animation-name: vt-scale-out;
  }

  [data-transition-type="scale"] ::view-transition-new(root) {
    animation-name: vt-scale-in;
  }

  @keyframes vt-scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes vt-scale-out {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(1.05);
    }
  }

  /* ================================
     MORPH TRANSITION
     ================================ */

  [data-transition-type="morph"] ::view-transition-old(root) {
    animation-name: vt-morph-out;
    animation-duration: 400ms;
  }

  [data-transition-type="morph"] ::view-transition-new(root) {
    animation-name: vt-morph-in;
    animation-duration: 400ms;
  }

  @keyframes vt-morph-in {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(20px);
      filter: blur(4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
      filter: blur(0);
    }
  }

  @keyframes vt-morph-out {
    from {
      opacity: 1;
      transform: scale(1) translateY(0);
      filter: blur(0);
    }
    to {
      opacity: 0;
      transform: scale(1.1) translateY(-20px);
      filter: blur(4px);
    }
  }

  /* ================================
     SHARED ELEMENT TRANSITIONS
     ================================ */

  /* Hero image transition */
  ::view-transition-old(hero-image),
  ::view-transition-new(hero-image) {
    animation-duration: 400ms;
    animation-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
    height: 100%;
    width: 100%;
    object-fit: cover;
  }

  /* Card transition */
  ::view-transition-old(card),
  ::view-transition-new(card) {
    animation-duration: 300ms;
    animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Header transition */
  ::view-transition-old(header),
  ::view-transition-new(header) {
    animation-duration: 250ms;
    animation-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  /* Sidebar transition */
  ::view-transition-old(sidebar),
  ::view-transition-new(sidebar) {
    animation: none;
  }

  /* ================================
     CROSS-FADE GROUP
     ================================ */

  ::view-transition-group(root) {
    animation-duration: 300ms;
    animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  ::view-transition-image-pair(root) {
    isolation: isolate;
  }

  /* ================================
     REDUCED MOTION
     ================================ */

  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(*),
    ::view-transition-old(*),
    ::view-transition-new(*) {
      animation-duration: 0.01ms !important;
      animation-delay: 0ms !important;
    }
  }

  /* ================================
     DARK MODE ADJUSTMENTS
     ================================ */

  [data-theme="dark"] ::view-transition-old(root),
  [data-theme="dark"] ::view-transition-new(root),
  .dark-theme ::view-transition-old(root),
  .dark-theme ::view-transition-new(root) {
    /* Slightly faster transitions in dark mode */
    animation-duration: 250ms;
  }
`;

/**
 * CSS Utility Classes for View Transitions
 */
export const VIEW_TRANSITION_UTILITIES = `
  /* View Transition Name Utilities */
  .vt-hero { view-transition-name: hero-image; }
  .vt-card { view-transition-name: card; }
  .vt-header { view-transition-name: header; }
  .vt-sidebar { view-transition-name: sidebar; }
  .vt-main { view-transition-name: main-content; }
  .vt-title { view-transition-name: page-title; }
  .vt-avatar { view-transition-name: avatar; }
  .vt-fab { view-transition-name: fab; }
  
  /* Disable view transition for specific elements */
  .vt-none { view-transition-name: none; }
`;
