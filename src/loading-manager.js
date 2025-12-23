// Loading Manager for FlagFit Pro
// Provides consistent loading states, skeleton screens, and progress indicators

import { SecureDOMUtils } from "./secure-dom-utils.js";

export class LoadingManager {
  constructor() {
    this.activeLoaders = new Map();
  }

  // Show loading overlay with optional cancellation
  showLoading(
    message = "Loading...",
    id = null,
    cancellable = false,
    onCancel = null,
  ) {
    const loaderId = id || `loader-${Date.now()}`;

    const overlay = document.createElement("div");
    overlay.className = "loading-overlay";
    overlay.id = loaderId;
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    overlay.setAttribute("aria-label", message);

    // Create spinner
    const spinner = SecureDOMUtils.createElement(overlay, "div", {
      className: "loading-spinner",
    });

    // Create message
    const messageEl = SecureDOMUtils.createElement(overlay, "div", {
      className: "loading-message",
      textContent: message,
    });

    // Add cancel button if needed
    let cancelBtn = null;
    if (cancellable) {
      cancelBtn = SecureDOMUtils.createElement(overlay, "button", {
        className: "loading-cancel-btn",
        textContent: "Cancel",
        attributes: {
          "aria-label": "Cancel loading",
          style: `
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.875rem;
          `,
        },
      });
    }

    // Add cancel handler
    if (cancellable && onCancel && cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        if (onCancel) {
          onCancel();
        }
        this.hideLoading(loaderId);
      });
    }

    document.body.appendChild(overlay);
    this.activeLoaders.set(loaderId, overlay);

    return loaderId;
  }

  // Hide loading overlay
  hideLoading(id = null) {
    if (id) {
      const loader = this.activeLoaders.get(id);
      if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => {
          loader.remove();
          this.activeLoaders.delete(id);
        }, 300);
      }
    } else {
      // Hide all loaders
      this.activeLoaders.forEach((loader) => {
        loader.style.opacity = "0";
        setTimeout(() => loader.remove(), 300);
      });
      this.activeLoaders.clear();
    }
  }

  // Show skeleton screen
  showSkeleton(container, count = 1) {
    if (typeof container === "string") {
      container = document.querySelector(container);
    }

    if (!container) {
      return;
    }

    const skeletons = [];
    for (let i = 0; i < count; i++) {
      const skeleton = SecureDOMUtils.createElement(container, "div", {
        className: "skeleton-item",
      });

      // Create skeleton header
      SecureDOMUtils.createElement(skeleton, "div", {
        className: "skeleton-header",
      });

      // Create skeleton body
      const skeletonBody = SecureDOMUtils.createElement(skeleton, "div", {
        className: "skeleton-body",
      });

      // Create skeleton lines
      SecureDOMUtils.createElement(skeletonBody, "div", {
        className: "skeleton-line",
      });
      SecureDOMUtils.createElement(skeletonBody, "div", {
        className: "skeleton-line",
      });
      SecureDOMUtils.createElement(skeletonBody, "div", {
        className: "skeleton-line short",
      });

      skeletons.push(skeleton);
    }

    return skeletons;
  }

  // Hide skeleton screens
  hideSkeleton(skeletons) {
    if (Array.isArray(skeletons)) {
      skeletons.forEach((skeleton) => {
        skeleton.style.opacity = "0";
        setTimeout(() => skeleton.remove(), 300);
      });
    } else if (skeletons) {
      skeletons.style.opacity = "0";
      setTimeout(() => skeletons.remove(), 300);
    }
  }

  // Show progress bar
  showProgress(container, current, total, message = null) {
    if (typeof container === "string") {
      container = document.querySelector(container);
    }

    if (!container) {
      return;
    }

    const progressId = `progress-${Date.now()}`;
    const percentage = Math.round((current / total) * 100);

    const progressBar = SecureDOMUtils.createElement(container, "div", {
      className: "progress-container",
      attributes: { id: progressId },
    });

    // Add message if provided
    if (message) {
      SecureDOMUtils.createElement(progressBar, "div", {
        className: "progress-message",
        textContent: message,
      });
    }

    // Create progress bar wrapper
    const wrapper = SecureDOMUtils.createElement(progressBar, "div", {
      className: "progress-bar-wrapper",
    });

    // Create progress bar
    SecureDOMUtils.createElement(wrapper, "div", {
      className: "progress-bar",
      attributes: { style: `width: ${percentage}%` },
    });

    // Create progress text
    SecureDOMUtils.createElement(progressBar, "div", {
      className: "progress-text",
      textContent: `${current} of ${total} (${percentage}%)`,
    });
    return progressId;
  }

  // Update progress
  updateProgress(progressId, current, total) {
    const progressBar = document.getElementById(progressId);
    if (!progressBar) {
      return;
    }

    const percentage = Math.round((current / total) * 100);
    const bar = progressBar.querySelector(".progress-bar");
    const text = progressBar.querySelector(".progress-text");

    if (bar) {
      bar.style.width = `${percentage}%`;
    }
    if (text) {
      SecureDOMUtils.setTextContent(
        text,
        `${current} of ${total} (${percentage}%)`,
      );
    }
  }

  // Show inline loading state
  setLoadingState(element, isLoading, message = null) {
    if (typeof element === "string") {
      element = document.querySelector(element);
    }

    if (!element) {
      return;
    }

    if (isLoading) {
      element.classList.add("is-loading");
      element.setAttribute("aria-busy", "true");
      if (message) {
        element.setAttribute("aria-label", message);
      }
    } else {
      element.classList.remove("is-loading");
      element.removeAttribute("aria-busy");
      element.removeAttribute("aria-label");
    }
  }

  // Show saving indicator
  showSaving(element, message = "Saving...") {
    if (typeof element === "string") {
      element = document.querySelector(element);
    }

    if (!element) {
      return;
    }

    const savingId = `saving-${Date.now()}`;
    const indicator = SecureDOMUtils.createElement(element, "div", {
      className: "saving-indicator",
      attributes: { id: savingId },
    });

    // Create icon element
    SecureDOMUtils.createElement(indicator, "i", {
      attributes: { "data-lucide": "loader-2" },
    });

    // Create message span
    SecureDOMUtils.createElement(indicator, "span", {
      textContent: message,
    });

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    return savingId;
  }

  // Hide saving indicator
  hideSaving(savingId) {
    const indicator = document.getElementById(savingId);
    if (indicator) {
      indicator.style.opacity = "0";
      setTimeout(() => indicator.remove(), 300);
    }
  }
}

// Global instance
export const loadingManager = new LoadingManager();
