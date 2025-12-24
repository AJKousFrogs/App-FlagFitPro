/**
 * Modal Component
 * Reusable modal component with accessibility features
 */

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
   * Create modal HTML structure
   */
  createHTML() {
    return `
            <div class="modal-overlay" id="${this.id}-overlay" role="dialog" aria-modal="true" aria-labelledby="${this.id}-title">
                <div class="modal-content" id="${this.id}-content">
                    <div class="modal-header">
                        <h2 class="modal-title" id="${this.id}-title">${this.title}</h2>
                        <button class="modal-close" aria-label="Close modal" data-modal-close type="button">
                            <i data-lucide="x" class="icon-20"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="${this.id}-body">
                        ${this.content}
                    </div>
                    ${
                      this.footer
                        ? `
                    <div class="modal-footer" id="${this.id}-footer">
                        ${this.footer}
                    </div>
                    `
                        : ""
                    }
                </div>
            </div>
        `;
  }

  /**
   * Open the modal
   */
  open() {
    // Store current focus
    this.previousFocus = document.activeElement;

    // Create modal element
    const modalHTML = this.createHTML();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = modalHTML;
    this.modalElement = tempDiv.firstElementChild;

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
      body.textContent = content;
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
