/**
 * Form validation utilities for safe handling of setCustomValidity
 * Prevents "setCustomValidity is not a function" errors
 */

/**
 * Safely sets custom validity on a form element
 * @param {HTMLElement} element - The form element (input, select, textarea)
 * @param {string} message - The validation message
 */
export const safeSetCustomValidity = (element, message) => {
  if (element && typeof element.setCustomValidity === 'function') {
    element.setCustomValidity(message);
  }
};

/**
 * Safely clears custom validity on a form element
 * @param {HTMLElement} element - The form element (input, select, textarea)
 */
export const safeClearCustomValidity = (element) => {
  safeSetCustomValidity(element, '');
};

/**
 * Safely sets custom validity on multiple form elements
 * @param {NodeList|Array} elements - Collection of form elements
 * @param {string} message - The validation message
 */
export const safeSetCustomValidityMultiple = (elements, message) => {
  if (elements) {
    elements.forEach(element => safeSetCustomValidity(element, message));
  }
};

/**
 * Safely clears custom validity on multiple form elements
 * @param {NodeList|Array} elements - Collection of form elements
 */
export const safeClearCustomValidityMultiple = (elements) => {
  safeSetCustomValidityMultiple(elements, '');
};

/**
 * Safely sets custom validity on a form element by name
 * @param {HTMLFormElement} form - The form element
 * @param {string} fieldName - The name of the field
 * @param {string} message - The validation message
 */
export const safeSetCustomValidityByName = (form, fieldName, message) => {
  if (form) {
    const fieldElement = form.querySelector(`[name="${fieldName}"]`);
    safeSetCustomValidity(fieldElement, message);
  }
};

/**
 * Safely clears custom validity on a form element by name
 * @param {HTMLFormElement} form - The form element
 * @param {string} fieldName - The name of the field
 */
export const safeClearCustomValidityByName = (form, fieldName) => {
  safeSetCustomValidityByName(form, fieldName, '');
};

/**
 * Safely clears all custom validity messages in a form
 * @param {HTMLFormElement} form - The form element
 */
export const safeClearAllCustomValidity = (form) => {
  if (form) {
    const allFields = form.querySelectorAll('input, select, textarea');
    safeClearCustomValidityMultiple(allFields);
  }
};

/**
 * Validates if an element supports setCustomValidity
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} - True if the element supports setCustomValidity
 */
export const supportsCustomValidity = (element) => {
  return element && typeof element.setCustomValidity === 'function';
};

/**
 * Creates a safe ref handler for form elements
 * @param {Function} callback - The callback to execute when ref is set
 * @returns {Function} - A ref handler function
 */
export const createSafeRefHandler = (callback) => {
  return (element) => {
    if (element && supportsCustomValidity(element)) {
      callback(element);
    }
  };
};

/**
 * Validates form fields and safely sets custom validity
 * @param {HTMLFormElement} form - The form element
 * @param {Object} errors - Object containing field names and error messages
 */
export const validateFormAndSetCustomValidity = (form, errors) => {
  if (!form) return;

  // Clear all existing custom validity messages
  safeClearAllCustomValidity(form);

  // Set custom validity for fields with errors
  Object.entries(errors).forEach(([fieldName, errorMessage]) => {
    safeSetCustomValidityByName(form, fieldName, errorMessage);
  });
};

/**
 * Hook for safely managing form validation with refs
 * @param {Object} options - Configuration options
 * @returns {Object} - Object containing validation utilities
 */
export const useSafeFormValidation = (options = {}) => {
  const {
    formRef,
    onValidationChange = () => {},
    onValidationClear = () => {}
  } = options;

  const setFieldValidation = (fieldName, message) => {
    if (formRef?.current) {
      safeSetCustomValidityByName(formRef.current, fieldName, message);
      onValidationChange(fieldName, message);
    }
  };

  const clearFieldValidation = (fieldName) => {
    if (formRef?.current) {
      safeClearCustomValidityByName(formRef.current, fieldName);
      onValidationClear(fieldName);
    }
  };

  const clearAllValidation = () => {
    if (formRef?.current) {
      safeClearAllCustomValidity(formRef.current);
      onValidationClear();
    }
  };

  const validateFields = (errors) => {
    if (formRef?.current) {
      validateFormAndSetCustomValidity(formRef.current, errors);
    }
  };

  return {
    setFieldValidation,
    clearFieldValidation,
    clearAllValidation,
    validateFields,
    safeSetCustomValidity,
    safeClearCustomValidity
  };
}; 