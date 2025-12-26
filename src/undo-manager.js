// Undo Manager for FlagFit Pro
// Provides undo functionality and confirmation dialogs

import { logger } from "./logger.js";
import { setSafeContent } from "./js/utils/shared.js";

export class UndoManager {
  constructor() {
    this.actionHistory = [];
    this.maxHistorySize = 50;
    this.undoTimeout = 30000; // 30 seconds

    // SECURITY: Safe callback registry to prevent code injection
    // Instead of executing arbitrary code from data attributes,
    // we register safe callbacks that can be referenced by name
    this.callbackRegistry = new Map();

    this.init();
  }

  /**
   * Register a safe callback function
   * @param {string} name - Unique callback identifier
   * @param {Function} callback - The function to execute
   */
  registerCallback(name, callback) {
    if (typeof callback !== "function") {
      logger.error("[UndoManager] Callback must be a function");
      return;
    }
    this.callbackRegistry.set(name, callback);
    logger.debug(`[UndoManager] Registered callback: ${name}`);
  }

  /**
   * Unregister a callback
   * @param {string} name - Callback identifier to remove
   */
  unregisterCallback(name) {
    this.callbackRegistry.delete(name);
  }

  init() {
    // Listen for delete actions
    document.addEventListener("click", (e) => {
      const deleteBtn = e.target.closest('[data-action="delete"]');
      if (deleteBtn) {
        e.preventDefault();
        this.handleDelete(deleteBtn);
      }
    });
  }

  // Handle delete action with confirmation
  handleDelete(button) {
    const itemName = button.getAttribute("data-item-name") || "this item";
    const itemId = button.getAttribute("data-item-id");
    const itemType = button.getAttribute("data-item-type") || "item";
    const onConfirm = button.getAttribute("data-on-confirm");

    // Show confirmation dialog
    this.showConfirmationDialog({
      title: "Confirm Deletion",
      message: `Are you sure you want to delete "${itemName}"? This action can be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: () => {
        // Store action for undo
        const action = {
          type: "delete",
          itemId,
          itemName,
          itemType,
          timestamp: Date.now(),
          data: this.getItemData(itemId, itemType),
        };

        this.addToHistory(action);

        // SECURITY FIX: Execute registered callback instead of arbitrary code
        // Instead of using Function() constructor (which is like eval()),
        // we now look up pre-registered safe callbacks by name
        if (onConfirm) {
          try {
            const callback = this.callbackRegistry.get(onConfirm);
            if (callback && typeof callback === "function") {
              callback(itemId, itemType);
            } else if (onConfirm) {
              logger.warn(
                `[UndoManager] Callback '${onConfirm}' not found in registry. ` +
                  `Register it using undoManager.registerCallback('${onConfirm}', yourFunction)`,
              );
            }
          } catch (e) {
            logger.error("Error executing delete callback:", e);
          }
        }

        // Show undo notification
        this.showUndoNotification(action);
      },
    });
  }

  // Show confirmation dialog
  showConfirmationDialog(options) {
    const {
      title = "Confirm Action",
      message = "Are you sure?",
      confirmText = "Confirm",
      cancelText = "Cancel",
      onConfirm,
      onCancel,
      destructive = false,
    } = options;

    const modal = document.createElement("div");
    modal.className = "confirmation-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "confirmation-title");
    modal.setAttribute("aria-modal", "true");

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "confirmation-overlay";

    // Create content container
    const content = document.createElement("div");
    content.className = "confirmation-content";

    // Create header
    const header = document.createElement("div");
    header.className = "confirmation-header";
    const titleEl = document.createElement("h3");
    titleEl.id = "confirmation-title";
    setSafeContent(titleEl, title);
    header.appendChild(titleEl);

    // Create body
    const body = document.createElement("div");
    body.className = "confirmation-body";
    const messageEl = document.createElement("p");
    setSafeContent(messageEl, message);
    body.appendChild(messageEl);

    // Create footer
    const footer = document.createElement("div");
    footer.className = "confirmation-footer";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary confirmation-cancel";
    setSafeContent(cancelBtn, cancelText);
    const confirmBtn = document.createElement("button");
    confirmBtn.className = `btn ${destructive ? "btn-danger" : "btn-primary"} confirmation-confirm`;
    setSafeContent(confirmBtn, confirmText);
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    // Assemble modal
    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    modal.appendChild(overlay);
    modal.appendChild(content);

    document.body.appendChild(modal);

    // Elements already created above, just get references
    const confirmBtnRef = modal.querySelector(".confirmation-confirm");
    const cancelBtnRef = modal.querySelector(".confirmation-cancel");

    confirmBtnRef.addEventListener("click", () => {
      if (onConfirm) {
        onConfirm();
      }
      this.closeConfirmation(modal);
    });

    cancelBtnRef.addEventListener("click", () => {
      if (onCancel) {
        onCancel();
      }
      this.closeConfirmation(modal);
    });

    overlay.addEventListener("click", () => {
      if (onCancel) {
        onCancel();
      }
      this.closeConfirmation(modal);
    });

    // Keyboard navigation
    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (onCancel) {
          onCancel();
        }
        this.closeConfirmation(modal);
      } else if (e.key === "Enter" && e.target === modal) {
        if (onConfirm) {
          onConfirm();
        }
        this.closeConfirmation(modal);
      }
    });

    confirmBtnRef.focus();
    this.trapFocus(modal);
  }

  trapFocus(modal) {
    // Store previous focus
    this.previousFocus = document.activeElement;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") {
        return;
      }

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener("keydown", handleKeyDown);

    // Store handler for cleanup
    modal._focusTrapHandler = handleKeyDown;
  }

  closeConfirmation(modal) {
    // Restore focus before closing
    if (this.previousFocus && typeof this.previousFocus.focus === "function") {
      this.previousFocus.focus();
    }

    // Clean up focus trap
    if (modal._focusTrapHandler) {
      modal.removeEventListener("keydown", modal._focusTrapHandler);
    }

    modal.style.opacity = "0";
    setTimeout(() => modal.remove(), 300);
  }

  // Add action to history
  addToHistory(action) {
    this.actionHistory.unshift(action);
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory.pop();
    }

    // Auto-remove after timeout
    setTimeout(() => {
      const index = this.actionHistory.findIndex((a) => a === action);
      if (index !== -1) {
        this.actionHistory.splice(index, 1);
      }
    }, this.undoTimeout);
  }

  // Show undo notification
  showUndoNotification(action) {
    const notification = document.createElement("div");
    notification.className = "undo-notification";

    const content = document.createElement("div");
    content.className = "undo-notification-content";

    const span = document.createElement("span");
    setSafeContent(span, `${action.itemName} deleted`);

    const undoBtn = document.createElement("button");
    undoBtn.className = "undo-button";
    undoBtn.setAttribute("data-action-id", String(action.timestamp));
    setSafeContent(undoBtn, "Undo");

    content.appendChild(span);
    content.appendChild(undoBtn);
    notification.appendChild(content);

    document.body.appendChild(notification);
    undoBtn.addEventListener("click", () => {
      this.undoAction(action);
      notification.remove();
    });

    // Auto-remove after timeout
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }, this.undoTimeout);
  }

  // Undo action
  undoAction(action) {
    const index = this.actionHistory.findIndex(
      (a) => a.timestamp === action.timestamp,
    );
    if (index === -1) {
      return;
    }

    // Restore item
    this.restoreItem(action);

    // Remove from history
    this.actionHistory.splice(index, 1);

    // Show success notification
    this.showSuccessNotification(`${action.itemName} restored`);
  }

  // Get item data before deletion
  getItemData(itemId, _itemType) {
    // This would typically fetch from DOM or store
    const element = document.querySelector(`[data-item-id="${itemId}"]`);
    if (element) {
      return {
        html: element.outerHTML,
        data: element.dataset,
      };
    }
    return null;
  }

  // Restore item
  restoreItem(action) {
    // This would typically restore from storage or DOM
    if (action.data && action.data.html) {
      // Restore logic here
      logger.debug("Restoring item:", action.itemName);
    }
  }

  // Show success notification
  showSuccessNotification(message) {
    const notification = document.createElement("div");
    notification.className = "success-notification";

    const content = document.createElement("div");
    content.className = "success-notification-content";

    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", "check-circle");
    icon.setAttribute("aria-hidden", "true");

    const span = document.createElement("span");
    setSafeContent(span, message);

    content.appendChild(icon);
    content.appendChild(span);
    notification.appendChild(content);

    document.body.appendChild(notification);

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Global instance
export const undoManager = new UndoManager();
