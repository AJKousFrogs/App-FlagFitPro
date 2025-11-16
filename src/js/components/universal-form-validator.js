/**
 * Universal Form Validation Component
 * Standardizes form validation across all pages with forms
 * Pages: login.html, register.html, settings.html, profile.html, update-roster-data.html, reset-password.html
 */

class UniversalFormValidator {
  constructor(formElement, options = {}) {
    this.form = formElement;
    this.options = {
      validateOnInput: true,
      validateOnBlur: true,
      showSuccessStates: true,
      realTimePasswordStrength: true,
      announceErrors: true,
      ...options
    };
    
    this.fields = new Map();
    this.validators = new Map();
    this.errorMessages = new Map();
    
    this.setupDefaultValidators();
    this.setupDefaultErrorMessages();
    this.init();
  }

  init() {
    if (!this.form) return;
    
    this.setupFields();
    this.setupEventListeners();
    this.setupAccessibility();
    this.setupCSRFProtection();
  }

  setupFields() {
    const formFields = this.form.querySelectorAll('input, select, textarea');
    
    formFields.forEach(field => {
      const fieldConfig = {
        element: field,
        required: field.hasAttribute('required'),
        type: field.type || field.tagName.toLowerCase(),
        validators: [],
        errorContainer: null,
        successContainer: null,
        helpContainer: null
      };
      
      // Find associated containers
      const fieldId = field.id;
      if (fieldId) {
        fieldConfig.errorContainer = document.getElementById(`${fieldId}-error`);
        fieldConfig.successContainer = document.getElementById(`${fieldId}-success`);
        fieldConfig.helpContainer = document.getElementById(`${fieldId}-help`) || 
                                   document.getElementById(`${fieldId}-hint`);
      }
      
      // Create containers if they don't exist
      this.ensureFieldContainers(field, fieldConfig);
      
      // Setup field-specific validators
      this.setupFieldValidators(field, fieldConfig);
      
      this.fields.set(field, fieldConfig);
    });
  }

  ensureFieldContainers(field, config) {
    const fieldGroup = field.closest('.form-group') || field.parentElement;
    
    // Create error container if missing
    if (!config.errorContainer) {
      config.errorContainer = document.createElement('div');
      config.errorContainer.id = `${field.id}-error`;
      config.errorContainer.className = 'form-error';
      config.errorContainer.setAttribute('role', 'alert');
      config.errorContainer.setAttribute('aria-live', 'polite');
      config.errorContainer.style.display = 'none';
      fieldGroup.appendChild(config.errorContainer);
    }
    
    // Create success container if missing and enabled
    if (!config.successContainer && this.options.showSuccessStates) {
      config.successContainer = document.createElement('div');
      config.successContainer.id = `${field.id}-success`;
      config.successContainer.className = 'form-success';
      config.successContainer.style.display = 'none';
      fieldGroup.appendChild(config.successContainer);
    }
    
    // Update field ARIA attributes
    const describedBy = [];
    if (config.helpContainer) describedBy.push(config.helpContainer.id);
    if (config.errorContainer) describedBy.push(config.errorContainer.id);
    if (config.successContainer) describedBy.push(config.successContainer.id);
    
    if (describedBy.length > 0) {
      field.setAttribute('aria-describedby', describedBy.join(' '));
    }
  }

  setupFieldValidators(field, config) {
    const fieldType = config.type;
    const fieldName = field.name || field.id;
    
    // Required validation
    if (config.required) {
      config.validators.push('required');
    }
    
    // Type-specific validations
    switch (fieldType) {
      case 'email':
        config.validators.push('email');
        break;
      case 'password':
        config.validators.push('password');
        if (this.options.realTimePasswordStrength) {
          this.setupPasswordStrength(field);
        }
        break;
      case 'tel':
        config.validators.push('phone');
        break;
      case 'url':
        config.validators.push('url');
        break;
      case 'number':
        config.validators.push('number');
        break;
    }
    
    // Custom validators based on field name
    if (fieldName.includes('confirm') && fieldName.includes('password')) {
      config.validators.push('passwordConfirm');
    }
    
    if (fieldName.includes('age')) {
      config.validators.push('age');
    }
  }

  setupDefaultValidators() {
    this.validators.set('required', (value) => {
      return value && value.trim().length > 0;
    });

    this.validators.set('email', (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !value || emailRegex.test(value);
    });

    this.validators.set('password', (value) => {
      if (!value) return true; // Let required validator handle empty values
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      return passwordRegex.test(value);
    });

    this.validators.set('passwordConfirm', (value, field) => {
      const passwordField = this.form.querySelector('input[type="password"]:not([name*="confirm"])');
      return !value || value === passwordField?.value;
    });

    this.validators.set('phone', (value) => {
      if (!value) return true;
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
    });

    this.validators.set('url', (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    });

    this.validators.set('number', (value) => {
      return !value || !isNaN(Number(value));
    });

    this.validators.set('age', (value) => {
      const age = Number(value);
      return !value || (age >= 13 && age <= 100);
    });
  }

  setupDefaultErrorMessages() {
    this.errorMessages.set('required', 'This field is required.');
    this.errorMessages.set('email', 'Please enter a valid email address.');
    this.errorMessages.set('password', 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.');
    this.errorMessages.set('passwordConfirm', 'Passwords do not match.');
    this.errorMessages.set('phone', 'Please enter a valid phone number.');
    this.errorMessages.set('url', 'Please enter a valid URL.');
    this.errorMessages.set('number', 'Please enter a valid number.');
    this.errorMessages.set('age', 'Age must be between 13 and 100.');
  }

  setupEventListeners() {
    this.fields.forEach((config, field) => {
      if (this.options.validateOnInput) {
        field.addEventListener('input', () => {
          this.clearFieldErrors(field);
          if (field.value.trim()) {
            setTimeout(() => this.validateField(field), 300); // Debounce
          }
        });
      }
      
      if (this.options.validateOnBlur) {
        field.addEventListener('blur', () => {
          this.validateField(field);
        });
      }
      
      // Special handling for password confirmation
      if (config.validators.includes('passwordConfirm')) {
        const passwordField = this.form.querySelector('input[type="password"]:not([name*="confirm"])');
        if (passwordField) {
          passwordField.addEventListener('input', () => {
            if (field.value) {
              setTimeout(() => this.validateField(field), 100);
            }
          });
        }
      }
    });

    // Form submission validation
    this.form.addEventListener('submit', (e) => {
      if (!this.validateForm()) {
        e.preventDefault();
        this.focusFirstErrorField();
      }
    });
  }

  setupPasswordStrength(passwordField) {
    let strengthContainer = document.getElementById('password-strength') || 
                           document.getElementById('passwordStrength');
    
    if (!strengthContainer) {
      strengthContainer = document.createElement('div');
      strengthContainer.id = 'password-strength';
      strengthContainer.className = 'password-strength';
      strengthContainer.setAttribute('aria-live', 'polite');
      strengthContainer.style.display = 'none';
      
      const fieldGroup = passwordField.closest('.form-group');
      if (fieldGroup) {
        fieldGroup.appendChild(strengthContainer);
      }
    }

    passwordField.addEventListener('input', () => {
      const password = passwordField.value;
      const strength = this.calculatePasswordStrength(password);
      
      if (password.length === 0) {
        strengthContainer.style.display = 'none';
        return;
      }
      
      strengthContainer.style.display = 'block';
      strengthContainer.innerHTML = this.getPasswordStrengthHTML(strength);
    });
  }

  calculatePasswordStrength(password) {
    let score = 0;
    const feedback = [];

    if (password.length >= 8) score++;
    else feedback.push('At least 8 characters');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Uppercase letter');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('Lowercase letter');

    if (/\d/.test(password)) score++;
    else feedback.push('Number');

    if (/[@$!%*?&]/.test(password)) score++;
    else feedback.push('Special character');

    return { score, feedback, total: 5 };
  }

  getPasswordStrengthHTML(strength) {
    const { score, feedback } = strength;
    let label, className;

    if (score <= 2) {
      label = 'Weak';
      className = 'strength-weak';
    } else if (score <= 3) {
      label = 'Medium';
      className = 'strength-medium';
    } else if (score <= 4) {
      label = 'Good';
      className = 'strength-good';
    } else {
      label = 'Strong';
      className = 'strength-strong';
    }

    const progressWidth = (score / 5) * 100;
    
    return `
      <div class="strength-meter">
        <div class="strength-bar">
          <div class="strength-fill ${className}" style="width: ${progressWidth}%"></div>
        </div>
        <span class="strength-label ${className}">${label}</span>
      </div>
      ${feedback.length > 0 ? `<div class="strength-feedback">Missing: ${feedback.join(', ')}</div>` : ''}
    `;
  }

  setupAccessibility() {
    // Add form landmark if not present
    if (!this.form.getAttribute('role')) {
      this.form.setAttribute('role', 'form');
    }
    
    // Ensure form has accessible name
    if (!this.form.getAttribute('aria-label') && !this.form.getAttribute('aria-labelledby')) {
      const formTitle = this.form.querySelector('h1, h2, h3, legend');
      if (formTitle && !formTitle.id) {
        formTitle.id = 'form-title-' + Date.now();
      }
      if (formTitle) {
        this.form.setAttribute('aria-labelledby', formTitle.id);
      }
    }
  }

  setupCSRFProtection() {
    // Generate CSRF token if not present
    let csrfField = this.form.querySelector('input[name="_token"], input[name="csrf_token"]');
    
    if (!csrfField && window.crypto) {
      csrfField = document.createElement('input');
      csrfField.type = 'hidden';
      csrfField.name = '_token';
      
      // Generate CSRF token
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      csrfField.value = token;
      this.form.appendChild(csrfField);
      
      // Store in session for validation
      sessionStorage.setItem('csrf_token', token);
    }
  }

  validateField(field) {
    const config = this.fields.get(field);
    if (!config) return true;

    const value = field.value;
    let isValid = true;
    let errorMessage = '';

    // Run all validators for this field
    for (const validatorName of config.validators) {
      const validator = this.validators.get(validatorName);
      if (validator && !validator(value, field)) {
        isValid = false;
        errorMessage = this.errorMessages.get(validatorName) || 'Invalid input';
        break;
      }
    }

    // Update field state
    this.updateFieldState(field, isValid, errorMessage);
    
    return isValid;
  }

  updateFieldState(field, isValid, errorMessage = '') {
    const config = this.fields.get(field);
    if (!config) return;

    // Update field classes
    field.classList.remove('error', 'success');
    field.setAttribute('aria-invalid', (!isValid).toString());

    if (isValid) {
      field.classList.add('success');
      this.showFieldSuccess(field);
      this.hideFieldError(field);
    } else {
      field.classList.add('error');
      this.showFieldError(field, errorMessage);
      this.hideFieldSuccess(field);
    }
  }

  showFieldError(field, message) {
    const config = this.fields.get(field);
    if (!config || !config.errorContainer) return;

    config.errorContainer.textContent = message;
    config.errorContainer.style.display = 'block';
    
    if (this.options.announceErrors) {
      this.announceToScreenReader(`Error: ${message}`);
    }
  }

  hideFieldError(field) {
    const config = this.fields.get(field);
    if (!config || !config.errorContainer) return;

    config.errorContainer.style.display = 'none';
  }

  showFieldSuccess(field) {
    const config = this.fields.get(field);
    if (!config || !config.successContainer || !this.options.showSuccessStates) return;

    config.successContainer.textContent = 'Valid';
    config.successContainer.style.display = 'block';
  }

  hideFieldSuccess(field) {
    const config = this.fields.get(field);
    if (!config || !config.successContainer) return;

    config.successContainer.style.display = 'none';
  }

  clearFieldErrors(field) {
    this.hideFieldError(field);
    field.classList.remove('error');
    field.setAttribute('aria-invalid', 'false');
  }

  validateForm() {
    let isValid = true;
    
    this.fields.forEach((config, field) => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  focusFirstErrorField() {
    for (const [field] of this.fields) {
      if (field.classList.contains('error')) {
        field.focus();
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  }

  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }

  // Public methods
  reset() {
    this.fields.forEach((config, field) => {
      field.classList.remove('error', 'success');
      field.setAttribute('aria-invalid', 'false');
      this.hideFieldError(field);
      this.hideFieldSuccess(field);
    });
  }

  addCustomValidator(name, validatorFn, errorMessage) {
    this.validators.set(name, validatorFn);
    this.errorMessages.set(name, errorMessage);
  }

  setFieldValidator(field, validatorName) {
    const config = this.fields.get(field);
    if (config && !config.validators.includes(validatorName)) {
      config.validators.push(validatorName);
    }
  }
}

// Auto-initialize for forms on page load
document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    // Skip forms that already have validators or don't need validation
    if (form.hasAttribute('data-no-validation') || form.validator) return;
    
    form.validator = new UniversalFormValidator(form);
  });
});

// Export for module usage
export { UniversalFormValidator };