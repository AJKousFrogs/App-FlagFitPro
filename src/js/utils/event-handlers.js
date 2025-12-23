/**
 * Centralized Event Handlers - Phase 2 Cleanup
 *
 * This file consolidates all inline event handlers (onclick, onchange, onsubmit)
 * into external JavaScript using addEventListener for better maintainability,
 * CSP compliance, and testability.
 */

import { logger } from "../../logger.js";

// ================================================================
// SIDEBAR TOGGLE
// ================================================================
export function initSidebarToggle() {
  const sidebarOverlays = document.querySelectorAll(
    "[data-sidebar-overlay], .sidebar-overlay",
  );
  sidebarOverlays.forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      e.preventDefault();
      window.toggleSidebar();
    });
  });
}

// Global function for backward compatibility
window.toggleSidebar = function () {
  const sidebar = document.querySelector(".sidebar, [data-sidebar]");
  const overlay = document.querySelector(
    ".sidebar-overlay, [data-sidebar-overlay]",
  );

  if (sidebar) {
    sidebar.classList.toggle("sidebar-open");
    document.body.classList.toggle("sidebar-open");
  }

  if (overlay) {
    overlay.classList.toggle("active");
    overlay.setAttribute(
      "aria-hidden",
      overlay.classList.contains("active") ? "false" : "true",
    );
  }
};

// ================================================================
// TAB SWITCHING (Tournaments)
// ================================================================
export function initTabSwitching() {
  const tabButtons = document.querySelectorAll("[data-tab-switch]");
  tabButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = button.getAttribute("data-tab-switch");
      if (typeof window.switchTab === "function") {
        window.switchTab(tabId, e);
      }
    });
  });
}

// Global function for backward compatibility
window.switchTab = function (tabId, event) {
  if (event) {
    event.preventDefault();
  }

  // Remove active class from all tabs
  document.querySelectorAll("[data-tab-switch]").forEach((btn) => {
    btn.classList.remove("active");
    btn.setAttribute("aria-selected", "false");
  });

  // Add active class to clicked tab
  const activeButton = document.querySelector(`[data-tab-switch="${tabId}"]`);
  if (activeButton) {
    activeButton.classList.add("active");
    activeButton.setAttribute("aria-selected", "true");
  }

  // Show/hide tab content
  document.querySelectorAll("[data-tab-content]").forEach((content) => {
    content.classList.add("hidden");
    content.setAttribute("aria-hidden", "true");
  });

  const activeContent = document.querySelector(`[data-tab-content="${tabId}"]`);
  if (activeContent) {
    activeContent.classList.remove("hidden");
    activeContent.setAttribute("aria-hidden", "false");
  }
};

// ================================================================
// NAVIGATION HELPERS
// ================================================================
export function initNavigationHandlers() {
  // Handle navigation buttons
  document.querySelectorAll("[data-navigate-to]").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const url = button.getAttribute("data-navigate-to");
      if (url) {
        window.location.href = url;
      }
    });
  });

  // Handle decline/back buttons
  document
    .querySelectorAll('[data-action="decline"], [data-action="back"]')
    .forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const target = button.getAttribute("data-target") || "/dashboard.html";
        window.location.href = target;
      });
    });
}

// ================================================================
// MODAL HANDLERS
// ================================================================
// Define modal functions before they're used
window.closeModal = function (modalId) {
  const modal =
    document.getElementById(modalId) ||
    document.querySelector(`[data-modal="${modalId}"]`);
  if (modal) {
    modal.classList.add("modal-hidden", "u-display-none");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
};

window.openModal = function (modalId) {
  const modal =
    document.getElementById(modalId) ||
    document.querySelector(`[data-modal="${modalId}"]`);
  if (modal) {
    modal.classList.remove("modal-hidden", "u-display-none");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    // Focus first focusable element
    const firstInput = modal.querySelector(
      'input, button, textarea, select, [tabindex]:not([tabindex="-1"])',
    );
    if (firstInput) {
      firstInput.focus();
    }
  }
};

export function initModalHandlers() {
  // Close modal buttons
  document.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const modalId = button.getAttribute("data-modal-close");
      window.closeModal(modalId);
    });
  });

  // Open modal buttons
  document.querySelectorAll("[data-modal-open]").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const modalId = button.getAttribute("data-modal-open");
      window.openModal(modalId);
    });
  });
}

window.closeModal = function (modalId) {
  const modal =
    document.getElementById(modalId) ||
    document.querySelector(`[data-modal="${modalId}"]`);
  if (modal) {
    modal.classList.add("modal-hidden", "u-display-none");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
};

window.openModal = function (modalId) {
  const modal =
    document.getElementById(modalId) ||
    document.querySelector(`[data-modal="${modalId}"]`);
  if (modal) {
    modal.classList.remove("modal-hidden", "u-display-none");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    // Focus first focusable element
    const firstInput = modal.querySelector(
      'input, button, textarea, select, [tabindex]:not([tabindex="-1"])',
    );
    if (firstInput) {
      firstInput.focus();
    }
  }
};

// ================================================================
// BUTTON ACTION HANDLERS
// ================================================================
export function initButtonActionHandlers() {
  // Generic action buttons
  document.querySelectorAll("[data-action]").forEach((button) => {
    const action = button.getAttribute("data-action");

    switch (action) {
      case "log-session":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          if (window.logSession) {
            window.logSession();
          }
        });
        break;

      case "start-quick-session":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          if (window.startQuickSession) {
            window.startQuickSession();
          }
        });
        break;

      case "load-more":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const loadMoreFn = button.getAttribute("data-load-more-fn");
          if (loadMoreFn && window[loadMoreFn]) {
            window[loadMoreFn]();
          } else if (window.loadMoreSessions) {
            window.loadMoreSessions();
          }
        });
        break;

      case "generate-code":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          if (window.generateCode) {
            window.generateCode();
          }
        });
        break;

      case "copy-clipboard":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const text =
            button.getAttribute("data-copy-text") ||
            button
              .closest("[data-copy-target]")
              ?.querySelector("[data-copy-content]")?.textContent;
          if (text && window.copyToClipboard) {
            window.copyToClipboard(text, button);
          } else if (window.copyToClipboard) {
            window.copyToClipboard();
          }
        });
        break;

      case "remove-player":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const playerId = button.getAttribute("data-player-id");
          if (playerId && window.removePlayer) {
            window.removePlayer(playerId);
          }
        });
        break;

      case "show-profile-modal":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          if (
            window.profileCompletionManager &&
            window.profileCompletionManager.showProfileCompletionModal
          ) {
            window.profileCompletionManager.showProfileCompletionModal(false);
          }
        });
        break;

      case "dismiss-prompt":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const prompt = button.closest(".profile-incomplete-prompt");
          if (prompt) {
            prompt.remove();
          }
        });
        break;

      case "reload-page":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          window.location.reload();
        });
        break;

      case "start-tournament-simulation":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          if (window.startTournamentSimulation) {
            window.startTournamentSimulation();
          }
        });
        break;

      case "onboarding-next":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          if (window.nextStep) {
            window.nextStep();
          }
        });
        break;

      case "onboarding-previous":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          if (window.previousStep) {
            window.previousStep();
          }
        });
        break;

      case "select-role":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const role = button.getAttribute("data-role-value");
          if (role && window.selectRole) {
            window.selectRole(role);
          }
        });
        break;

      case "show-profile-completion":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          if (window.showProfileCompletion) {
            window.showProfileCompletion();
          }
        });
        break;

      case "skip-profile":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          if (window.skipProfile) {
            window.skipProfile();
          }
        });
        break;

      case "complete-onboarding":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          if (window.completedOnboarding) {
            window.completedOnboarding();
          }
        });
        break;

      case "start-workout":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const day = button.getAttribute("data-day");
          const week = button.getAttribute("data-week");
          if (day && week && window.startWorkout) {
            window.startWorkout(day, parseInt(week));
          }
        });
        break;

      case "reload-page":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          window.location.reload();
        });
        break;

      case "view-tournament":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const tournamentId = button.getAttribute("data-tournament-id");
          if (tournamentId && window.viewTournamentDetails) {
            window.viewTournamentDetails(tournamentId);
          }
        });
        break;

      case "show-protocol-modal":
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const protocolType = button.getAttribute("data-protocol-type");
          if (protocolType && window.showProtocolModal) {
            window.showProtocolModal(protocolType);
          }
        });
        break;
    }
  });

  // Handle role cards and team options (clickable divs)
  document
    .querySelectorAll(
      "[data-role], .team-option[data-navigate-to], .team-option[data-action], .role-card[data-action]",
    )
    .forEach((element) => {
      element.addEventListener("click", (e) => {
        e.preventDefault();
        const navigateTo = element.getAttribute("data-navigate-to");
        const action = element.getAttribute("data-action");

        if (navigateTo) {
          window.location.href = navigateTo;
        } else if (action) {
          // Trigger click on button with same action if exists
          const actionButton = document.querySelector(
            `[data-action="${action}"]`,
          );
          if (actionButton && actionButton !== element) {
            actionButton.click();
          }
        }
      });

      // Keyboard support
      element.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          element.click();
        }
      });
    });
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================
window.copyToClipboard = function (text, button) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (button) {
          const originalText = button.textContent;
          button.textContent = "Copied!";
          button.classList.add("copied");
          setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove("copied");
          }, 2000);
        }
      })
      .catch((err) => {
        logger.error("Failed to copy:", err);
      });
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      if (button) {
        const originalText = button.textContent;
        button.textContent = "Copied!";
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (err) {
      logger.error("Fallback copy failed:", err);
    }
    document.body.removeChild(textArea);
  }
};

// ================================================================
// FORM HANDLERS
// ================================================================
export function initFormHandlers() {
  // Handle onchange events
  document
    .querySelectorAll('[data-action="update-charts"]')
    .forEach((element) => {
      element.addEventListener("change", (e) => {
        if (window.updateCharts) {
          window.updateCharts();
        }
      });
    });

  // Handle onsubmit events
  document.querySelectorAll("[data-form-submit]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const handlerName = form.getAttribute("data-form-submit");
      if (handlerName && window[handlerName]) {
        window[handlerName](e);
      }
    });
  });
}

// ================================================================
// INITIALIZATION
// ================================================================
export function initAllEventHandlers() {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initSidebarToggle();
      initTabSwitching();
      initNavigationHandlers();
      initModalHandlers();
      initButtonActionHandlers();
      initFormHandlers();
    });
  } else {
    // DOM already loaded
    initSidebarToggle();
    initTabSwitching();
    initNavigationHandlers();
    initModalHandlers();
    initButtonActionHandlers();
    initFormHandlers();
  }
}

// Auto-initialize if this script is loaded directly
if (typeof window !== "undefined") {
  initAllEventHandlers();
}
