/**
 * FlagFit Pro - Data Validation Utilities
 * Comprehensive validation for forms, API data, and user inputs
 */

import { DATA_LIMITS, VALIDATION, WELLNESS } from "../config/app-constants.js";
import { logger } from "../../logger.js";

/**
 * Validation result structure
 */
class ValidationResult {
  constructor(isValid = true, errors = {}, warnings = {}) {
    this.isValid = isValid;
    this.errors = errors;
    this.warnings = warnings;
  }

  addError(field, message) {
    this.isValid = false;
    if (!this.errors[field]) {
      this.errors[field] = [];
    }
    this.errors[field].push(message);
  }

  addWarning(field, message) {
    if (!this.warnings[field]) {
      this.warnings[field] = [];
    }
    this.warnings[field].push(message);
  }

  hasErrors() {
    return Object.keys(this.errors).length > 0;
  }

  hasWarnings() {
    return Object.keys(this.warnings).length > 0;
  }

  getErrorMessages() {
    return Object.values(this.errors).flat();
  }

  getWarningMessages() {
    return Object.values(this.warnings).flat();
  }
}

/**
 * Base validators
 */
export const Validators = {
  /**
   * Check if value is required (not empty)
   */
  required(value, fieldName = "This field") {
    if (value === null || value === undefined || value === "") {
      return `${fieldName} is required`;
    }
    if (typeof value === "string" && value.trim() === "") {
      return `${fieldName} cannot be empty`;
    }
    return null;
  },

  /**
   * Validate email format
   */
  email(value) {
    if (!value) {
      return null;
    } // Skip if empty (use required separately)

    if (!VALIDATION.EMAIL_REGEX.test(value)) {
      return "Please enter a valid email address";
    }

    if (value.length > DATA_LIMITS.MAX_EMAIL_LENGTH) {
      return `Email must be less than ${DATA_LIMITS.MAX_EMAIL_LENGTH} characters`;
    }

    return null;
  },

  /**
   * Validate password strength
   */
  password(value) {
    if (!value) {
      return null;
    }

    const errors = [];

    if (value.length < DATA_LIMITS.MIN_PASSWORD_LENGTH) {
      errors.push(
        `Password must be at least ${DATA_LIMITS.MIN_PASSWORD_LENGTH} characters`,
      );
    }

    if (value.length > DATA_LIMITS.MAX_PASSWORD_LENGTH) {
      errors.push(
        `Password must be less than ${DATA_LIMITS.MAX_PASSWORD_LENGTH} characters`,
      );
    }

    if (!VALIDATION.PASSWORD_REGEX.HAS_UPPERCASE.test(value)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!VALIDATION.PASSWORD_REGEX.HAS_LOWERCASE.test(value)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!VALIDATION.PASSWORD_REGEX.HAS_NUMBER.test(value)) {
      errors.push("Password must contain at least one number");
    }

    return errors.length > 0 ? errors.join(". ") : null;
  },

  /**
   * Validate string length
   */
  length(value, min, max, fieldName = "Value") {
    if (!value) {
      return null;
    }

    const len = value.length;

    if (min && len < min) {
      return `${fieldName} must be at least ${min} characters`;
    }

    if (max && len > max) {
      return `${fieldName} must be less than ${max} characters`;
    }

    return null;
  },

  /**
   * Validate number range
   */
  range(value, min, max, fieldName = "Value") {
    if (value === null || value === undefined) {
      return null;
    }

    const num = Number(value);

    if (isNaN(num)) {
      return `${fieldName} must be a number`;
    }

    if (min !== undefined && num < min) {
      return `${fieldName} must be at least ${min}`;
    }

    if (max !== undefined && num > max) {
      return `${fieldName} must be at most ${max}`;
    }

    return null;
  },

  /**
   * Validate URL format
   */
  url(value) {
    if (!value) {
      return null;
    }

    if (!VALIDATION.URL_REGEX.test(value)) {
      return "Please enter a valid URL starting with http:// or https://";
    }

    return null;
  },

  /**
   * Validate phone number
   */
  phone(value) {
    if (!value) {
      return null;
    }

    if (!VALIDATION.PHONE_REGEX.test(value)) {
      return "Please enter a valid phone number";
    }

    return null;
  },

  /**
   * Validate date format (YYYY-MM-DD)
   */
  date(value) {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return "Please enter a valid date";
    }

    return null;
  },

  /**
   * Validate that value matches another field
   */
  matches(value, otherValue, fieldName = "Fields") {
    if (value !== otherValue) {
      return `${fieldName} do not match`;
    }

    return null;
  },
};

/**
 * Domain-specific validators
 */
export const DomainValidators = {
  /**
   * Validate wellness rating (1-10)
   */
  wellnessRating(value, fieldName = "Rating") {
    return Validators.range(
      value,
      WELLNESS.MIN_RATING,
      WELLNESS.MAX_RATING,
      fieldName,
    );
  },

  /**
   * Validate sleep hours
   */
  sleepHours(value) {
    const error = Validators.range(
      value,
      WELLNESS.MIN_SLEEP,
      WELLNESS.MAX_SLEEP,
      "Sleep hours",
    );

    if (error) {
      return error;
    }

    // Add warning for low sleep
    const num = Number(value);
    if (num < WELLNESS.LOW_SLEEP_HOURS) {
      return null; // Valid but will add warning in validateWellnessData
    }

    return null;
  },

  /**
   * Validate workout duration
   */
  workoutDuration(value) {
    return Validators.range(value, 1, 300, "Workout duration");
  },
};

/**
 * Form validators
 */
export const FormValidators = {
  /**
   * Validate login form
   */
  loginForm(data) {
    const result = new ValidationResult();

    const emailError =
      Validators.required(data.email, "Email") || Validators.email(data.email);
    if (emailError) {
      result.addError("email", emailError);
    }

    const passwordError = Validators.required(data.password, "Password");
    if (passwordError) {
      result.addError("password", passwordError);
    }

    return result;
  },

  /**
   * Validate registration form
   */
  registrationForm(data) {
    const result = new ValidationResult();

    // Name
    const nameError =
      Validators.required(data.name, "Name") ||
      Validators.length(data.name, 2, DATA_LIMITS.MAX_NAME_LENGTH, "Name");
    if (nameError) {
      result.addError("name", nameError);
    }

    // Email
    const emailError =
      Validators.required(data.email, "Email") || Validators.email(data.email);
    if (emailError) {
      result.addError("email", emailError);
    }

    // Password
    const passwordError =
      Validators.required(data.password, "Password") ||
      Validators.password(data.password);
    if (passwordError) {
      result.addError("password", passwordError);
    }

    // Confirm password
    const confirmError =
      Validators.required(data.confirmPassword, "Confirm password") ||
      Validators.matches(data.password, data.confirmPassword, "Passwords");
    if (confirmError) {
      result.addError("confirmPassword", confirmError);
    }

    return result;
  },

  /**
   * Validate wellness check-in form
   */
  wellnessForm(data) {
    const result = new ValidationResult();

    // Sleep
    if (data.sleep !== undefined && data.sleep !== null) {
      const sleepError = DomainValidators.sleepHours(data.sleep);
      if (sleepError) {
        result.addError("sleep", sleepError);
      }

      // Warning for low sleep
      if (Number(data.sleep) < WELLNESS.LOW_SLEEP_HOURS) {
        result.addWarning(
          "sleep",
          `Less than ${WELLNESS.LOW_SLEEP_HOURS} hours of sleep may affect performance`,
        );
      }
    }

    // Energy
    if (data.energy !== undefined && data.energy !== null) {
      const energyError = DomainValidators.wellnessRating(
        data.energy,
        "Energy",
      );
      if (energyError) {
        result.addError("energy", energyError);
      }

      // Warning for low energy
      if (Number(data.energy) <= WELLNESS.LOW_ENERGY_THRESHOLD) {
        result.addWarning(
          "energy",
          "Low energy detected. Consider rest or light training.",
        );
      }
    }

    // Mood
    if (data.mood !== undefined && data.mood !== null) {
      const moodError = DomainValidators.wellnessRating(data.mood, "Mood");
      if (moodError) {
        result.addError("mood", moodError);
      }
    }

    // Stress
    if (data.stress !== undefined && data.stress !== null) {
      const stressError = DomainValidators.wellnessRating(
        data.stress,
        "Stress",
      );
      if (stressError) {
        result.addError("stress", stressError);
      }

      // Warning for high stress
      if (Number(data.stress) >= WELLNESS.HIGH_STRESS_THRESHOLD) {
        result.addWarning(
          "stress",
          "High stress detected. Consider stress management techniques.",
        );
      }
    }

    // Notes
    if (data.notes) {
      const notesError = Validators.length(
        data.notes,
        null,
        DATA_LIMITS.MAX_NOTES_LENGTH,
        "Notes",
      );
      if (notesError) {
        result.addError("notes", notesError);
      }
    }

    return result;
  },

  /**
   * Validate profile update form
   */
  profileForm(data) {
    const result = new ValidationResult();

    // Name
    if (data.name !== undefined) {
      const nameError =
        Validators.required(data.name, "Name") ||
        Validators.length(data.name, 2, DATA_LIMITS.MAX_NAME_LENGTH, "Name");
      if (nameError) {
        result.addError("name", nameError);
      }
    }

    // Email
    if (data.email !== undefined) {
      const emailError =
        Validators.required(data.email, "Email") ||
        Validators.email(data.email);
      if (emailError) {
        result.addError("email", emailError);
      }
    }

    // Phone (optional)
    if (data.phone) {
      const phoneError = Validators.phone(data.phone);
      if (phoneError) {
        result.addError("phone", phoneError);
      }
    }

    return result;
  },
};

/**
 * Normalize user input for consistent formatting
 * Note: This is for format normalization (lowercase, strip chars), NOT XSS prevention.
 * For XSS prevention, use escapeHtml() from sanitize.js
 */
export function normalizeInput(value, type = "text") {
  if (value === null || value === undefined) {
    return "";
  }

  let normalized = String(value).trim();

  switch (type) {
    case "email":
      normalized = normalized.toLowerCase();
      break;
    case "number":
      normalized = normalized.replace(/[^\d.-]/g, "");
      break;
    case "phone":
      normalized = normalized.replace(/[^\d\s\-\+\(\)]/g, "");
      break;
    case "alphanumeric":
      normalized = normalized.replace(/[^a-zA-Z0-9\s]/g, "");
      break;
  }

  return normalized;
}

/**
 * Validate and sanitize form data
 */
export function validateForm(formData, validatorName) {
  if (!FormValidators[validatorName]) {
    logger.error(`[Validation] Unknown validator: ${validatorName}`);
    return new ValidationResult(false, { form: ["Validation error"] });
  }

  const result = FormValidators[validatorName](formData);

  logger.debug(`[Validation] Form validation result:`, {
    validator: validatorName,
    isValid: result.isValid,
    errorCount: Object.keys(result.errors).length,
    warningCount: Object.keys(result.warnings).length,
  });

  return result;
}

/**
 * Display validation errors in UI
 */
export function displayValidationErrors(result, formElement) {
  // Clear previous errors
  formElement
    .querySelectorAll(".validation-error")
    .forEach((el) => el.remove());
  formElement.querySelectorAll(".input-error").forEach((el) => {
    el.classList.remove("input-error");
  });

  if (!result.hasErrors()) {
    return;
  }

  // Display errors for each field
  for (const [fieldName, messages] of Object.entries(result.errors)) {
    const input = formElement.querySelector(`[name="${fieldName}"]`);

    if (input) {
      // Add error class to input
      input.classList.add("input-error");

      // Create error message element
      const errorDiv = document.createElement("div");
      errorDiv.className = "validation-error";
      errorDiv.style.cssText =
        "color: #ef4444; font-size: 0.875rem; margin-top: 0.25rem;";
      errorDiv.textContent = messages.join(". ");

      // Insert after input
      input.parentNode.insertBefore(errorDiv, input.nextSibling);
    }
  }

  // Display warnings if any
  if (result.hasWarnings()) {
    for (const [fieldName, messages] of Object.entries(result.warnings)) {
      const input = formElement.querySelector(`[name="${fieldName}"]`);

      if (input) {
        const warningDiv = document.createElement("div");
        warningDiv.className = "validation-warning";
        warningDiv.style.cssText =
          "color: #f59e0b; font-size: 0.875rem; margin-top: 0.25rem;";
        warningDiv.textContent = messages.join(". ");

        input.parentNode.insertBefore(warningDiv, input.nextSibling);
      }
    }
  }

  // Focus first error field
  const firstErrorField = formElement.querySelector(".input-error");
  if (firstErrorField) {
    firstErrorField.focus();
  }
}

// Export all
export default {
  Validators,
  DomainValidators,
  FormValidators,
  ValidationResult,
  normalizeInput,
  validateForm,
  displayValidationErrors,
};

logger.debug("[Validation] Validation utilities loaded");
