// Error Prevention Utilities for FlagFit Pro
// Provides date validation, duplicate detection, and input constraints

export class ErrorPrevention {
  constructor() {
    this.init();
  }

  init() {
    // Add date validation to date inputs
    this.setupDateValidation();

    // Add duplicate detection to forms
    this.setupDuplicateDetection();

    // Add input constraints
    this.setupInputConstraints();
  }

  setupDateValidation() {
    // Find all date inputs and add validation
    document.addEventListener("DOMContentLoaded", () => {
      const dateInputs = document.querySelectorAll('input[type="date"]');
      dateInputs.forEach((input) => {
        // Prevent past dates for training sessions
        if (
          input.closest('[data-context="training"]') ||
          input.closest('[data-context="tournament"]')
        ) {
          const today = new Date().toISOString().split("T")[0];
          input.setAttribute("min", today);

          input.addEventListener("change", (e) => {
            if (e.target.value < today) {
              this.showError(e.target, "Date cannot be in the past");
              e.target.value = "";
            }
          });
        }
      });
    });
  }

  setupDuplicateDetection() {
    // Detect duplicate entries in forms
    document.addEventListener("submit", (e) => {
      const form = e.target;

      // Check for duplicate email in roster
      if (form.id === "roster-form" || form.closest('[data-form="roster"]')) {
        const emailInput = form.querySelector('input[type="email"]');
        if (emailInput) {
          const email = emailInput.value.toLowerCase().trim();
          const existingEmails = this.getExistingEmails();

          if (existingEmails.includes(email)) {
            e.preventDefault();
            this.showError(emailInput, "This email is already in your roster");
            return false;
          }
        }
      }
    });
  }

  getExistingEmails() {
    // Get existing emails from roster table
    const rosterTable = document.querySelector(
      '.roster-table, [data-table="roster"]',
    );
    if (!rosterTable) {return [];}

    const emailCells = rosterTable.querySelectorAll('[data-field="email"]');
    return Array.from(emailCells).map((cell) =>
      cell.textContent.toLowerCase().trim(),
    );
  }

  setupInputConstraints() {
    // Add character limits and format validation
    document.addEventListener("input", (e) => {
      const input = e.target;

      // Character counter for text areas
      if (input.tagName === "TEXTAREA" && input.hasAttribute("maxlength")) {
        this.addCharacterCounter(input);
      }

      // Format validation for phone numbers
      if (input.type === "tel" || input.hasAttribute('data-type="phone"')) {
        input.addEventListener("input", (e) => {
          e.target.value = this.formatPhoneNumber(e.target.value);
        });
      }
    });
  }

  addCharacterCounter(textarea) {
    const maxLength = parseInt(textarea.getAttribute("maxlength"));
    if (!maxLength) {return;}

    let counter = textarea.parentElement.querySelector(".character-counter");
    if (!counter) {
      counter = document.createElement("div");
      counter.className = "character-counter";
      textarea.parentElement.appendChild(counter);
    }

    const updateCounter = () => {
      const remaining = maxLength - textarea.value.length;
      counter.textContent = `${remaining} characters remaining`;
      counter.classList.toggle("character-counter-warning", remaining < 50);
    };

    textarea.addEventListener("input", updateCounter);
    updateCounter();
  }

  formatPhoneNumber(value) {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {return digits;}
    if (digits.length <= 6) {return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;}
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  showError(element, message) {
    // Remove existing error
    const existingError = element.parentElement.querySelector(".field-error");
    if (existingError) {existingError.remove();}

    // Add error styling
    element.classList.add("has-error");
    element.setAttribute("aria-invalid", "true");

    // Create error message
    const errorDiv = document.createElement("div");
    errorDiv.className = "field-error";
    errorDiv.setAttribute("role", "alert");
    errorDiv.innerHTML = `
      <i data-lucide="alert-circle" aria-hidden="true"></i>
      <span>${message}</span>
    `;

    element.parentElement.appendChild(errorDiv);

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    // Focus the input
    element.focus();

    // Remove error on input
    element.addEventListener(
      "input",
      () => {
        element.classList.remove("has-error");
        element.removeAttribute("aria-invalid");
        errorDiv.remove();
      },
      { once: true },
    );
  }

  // Validate form before submission
  validateForm(form) {
    const errors = [];
    const requiredFields = form.querySelectorAll("[required]");

    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        errors.push({
          field,
          message: `${field.labels[0]?.textContent || "This field"} is required`,
        });
      }
    });

    // Date validation
    const dateFields = form.querySelectorAll('input[type="date"]');
    dateFields.forEach((field) => {
      if (field.value) {
        const selectedDate = new Date(field.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (field.hasAttribute("data-no-past") && selectedDate < today) {
          errors.push({
            field,
            message: "Date cannot be in the past",
          });
        }
      }
    });

    // Email validation
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach((field) => {
      if (field.value && !this.isValidEmail(field.value)) {
        errors.push({
          field,
          message: "Please enter a valid email address",
        });
      }
    });

    // Show errors
    if (errors.length > 0) {
      errors.forEach((error) => {
        this.showError(error.field, error.message);
      });
      return false;
    }

    return true;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Global instance
export const errorPrevention = new ErrorPrevention();
