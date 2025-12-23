/**
 * View Transitions Configuration
 *
 * Angular 21 View Transitions API configuration
 * Provides smooth page transitions between routes
 */

import { ViewTransitionsService } from "@angular/router";

/**
 * View Transition Options
 */
export interface ViewTransitionOptions {
  skipTransition?: boolean;
  transitionName?: string;
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
   * Start a view transition
   */
  static startTransition(callback: () => void): Promise<void> {
    if (!this.isSupported()) {
      callback();
      return Promise.resolve();
    }

    return (document as any).startViewTransition(callback).finished;
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
}

/**
 * View Transition CSS Classes
 * Add these to your global styles for view transitions
 */
export const VIEW_TRANSITION_STYLES = `
  /* View Transition Styles */
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 0.3s;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }

  ::view-transition-old(root) {
    animation-name: fade-out;
  }

  ::view-transition-new(root) {
    animation-name: fade-in;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fade-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  /* Slide transitions */
  [data-transition="slide-left"]::view-transition-old(root) {
    animation-name: slide-out-left;
  }

  [data-transition="slide-left"]::view-transition-new(root) {
    animation-name: slide-in-right;
  }

  [data-transition="slide-right"]::view-transition-old(root) {
    animation-name: slide-out-right;
  }

  [data-transition="slide-right"]::view-transition-new(root) {
    animation-name: slide-in-left;
  }

  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes slide-out-left {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-100%);
    }
  }

  @keyframes slide-in-left {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes slide-out-right {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(100%);
    }
  }

  /* Respect reduced motion */
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(*),
    ::view-transition-old(*),
    ::view-transition-new(*) {
      animation-duration: 0.01ms !important;
      animation-delay: 0ms !important;
    }
  }
`;
