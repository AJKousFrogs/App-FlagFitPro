/**
 * Modal Component
 * Reusable modal component with accessibility features
 */

import { setSafeContent, escapeHtml } from "../utils/shared.js";

class Modal {
  constructor(options = {}) {
    this.id = options.id || `modal-${Date.now()}`;
    this.title = options.title || "";
    this.content = options.content || "";
    this.footer = options.footer || null;
    this.onClose = options.onClose || null;
    this.closeOnBackdrop = options.closeOnBackdrop !== false;
    this.closeOnEscape = options.closeOnEscape !== true;
    this.modalElement = null;
    this.previousFocus = null;
  }

  /**
   * Create modal element using DOM methods
   */
  createModalElement() {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = `${this.id}-overlay`;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", `${this.id}-title`);

    const content = document.createElement("div");
    content.className = "modal-content";
    content.id = `${this.id}-content`;

    const header = document.createElement("div");
    header.className = "modal-header";

    const title = document.createElement("h2");
    title.className = "modal-title";
    title.id = `${this.id}-title`;
    title.textContent = this.title;

    const closeBtn = document.createElement("button");
    closeBtn.className = "modal-close";
    closeBtn.setAttribute("aria-label", "Close modal");
    closeBtn.setAttribute("data-modal-close", "");
    closeBtn.type = "button";

    const closeIcon = document.createElement("i");
    closeIcon.setAttribute("data-lucide", "x");
    closeIcon.className = "icon-20";
    closeBtn.appendChild(closeIcon);

    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = document.createElement("div");
    body.className = "modal-body";
    body.id = `${this.id}-body`;
    // Use setSafeContent to sanitize content
    setSafeContent(body, this.content, true, true);

    content.appendChild(header);
    content.appendChild(body);

    if (this.footer) {
      const footer = document.createElement("div");
      footer.className = "modal-footer";
      footer.id = `${this.id}-footer`;
      // Use setSafeContent to sanitize footer content
      setSafeContent(footer, this.footer, true, true);
      content.appendChild(footer);
    }

    overlay.appendChild(content);
    return overlay;
  }

  /**
   * Open the modal
   */
  open() {
    // Store current focus
    this.previousFocus = document.activeElement;

    // Create modal element using DOM methods instead of innerHTML
    this.modalElement = this.createModalElement();

    // Add to DOM
    document.body.appendChild(this.modalElement);
    document.body.style.overflow = "hidden";

    // Initialize icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    // Set up event listeners
    this.setupEvents();

    // Focus management
    this.focusModal();

    // Animate in
    requestAnimationFrame(() => {
      this.modalElement.classList.add("open");
    });
  }

  /**
   * Close the modal
   */
  close() {
    if (!this.modalElement) {
      return;
    }

    // Animate out
    this.modalElement.classList.remove("open");

    setTimeout(() => {
      // Remove from DOM
      if (this.modalElement && this.modalElement.parentNode) {
        this.modalElement.parentNode.removeChild(this.modalElement);
      }
      document.body.style.overflow = "";

      // Restore focus
      if (
        this.previousFocus &&
        typeof this.previousFocus.focus === "function"
      ) {
        this.previousFocus.focus();
      }

      // Call onClose callback
      if (this.onClose) {
        this.onClose();
      }

      this.modalElement = null;
    }, 300); // Match CSS transition duration
  }

  /**
   * Set up event listeners
   */
  setupEvents() {
    if (!this.modalElement) {
      return;
    }

    // Close button
    const closeBtn = this.modalElement.querySelector("[data-modal-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }

    // Backdrop click
    if (this.closeOnBackdrop) {
      const overlay = this.modalElement;
      if (overlay) {
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) {
            this.close();
          }
        });
      }
    }

    // Escape key
    if (this.closeOnEscape) {
      const escapeHandler = (e) => {
        if (e.key === "Escape" && this.modalElement) {
          this.close();
          document.removeEventListener("keydown", escapeHandler);
        }
      };
      document.addEventListener("keydown", escapeHandler);
    }

    // Trap focus within modal
    this.trapFocus();
  }

  /**
   * Focus management - move focus into modal
   */
  focusModal() {
    if (!this.modalElement) {
      return;
    }

    const focusableElements = this.modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    if (firstElement) {
      firstElement.focus();
    }
  }

  /**
   * Trap focus within modal
   */
  trapFocus() {
    if (!this.modalElement) {
      return;
    }

    const focusableElements = this.modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const trapHandler = (e) => {
      if (e.key !== "Tab") {
        return;
      }

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    this.modalElement.addEventListener("keydown", trapHandler);
  }

  /**
   * Update modal content
   */
  updateContent(content) {
    if (!this.modalElement) {
      return;
    }
    const body = this.modalElement.querySelector(".modal-body");
    if (body) {
      // Use setSafeContent to sanitize content
      setSafeContent(body, content, true, true);
      // Re-initialize icons if needed
      if (typeof lucide !== "undefined") {
        lucide.createIcons();
      }
    }
  }

  /**
   * Update modal title
   */
  updateTitle(title) {
    if (!this.modalElement) {
      return;
    }
    const titleElement = this.modalElement.querySelector(".modal-title");
    if (titleElement) {
      titleElement.textContent = title;
    }
  }
}

export default Modal;
