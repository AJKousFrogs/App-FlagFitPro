import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Safe validation utility to handle setCustomValidity without errors
 */
const safeSetCustomValidity = (element, message) => {
  if (element && typeof element.setCustomValidity === 'function') {
    element.setCustomValidity(message);
  }
};

/**
 * Enterprise-grade form component with validation, accessibility, and advanced features
 * Supports field validation, form state management, and accessibility patterns
 */
const Form = memo(({
  children,
  onSubmit,
  validationSchema,
  initialValues = {},
  resetOnSubmit = false,
  validateOnChange = true,
  validateOnBlur = true,
  className = '',
  noValidate = true,
  autoComplete = 'on',
  ...props
}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const formRef = useRef(null);

  // Validation function
  const validateField = useCallback((name, value, schema = validationSchema) => {
    if (!schema || !schema[name]) return null;

    const fieldSchema = schema[name];
    const fieldValue = value !== undefined ? value : values[name];

    // Required validation
    if (fieldSchema.required && (!fieldValue || fieldValue.toString().trim() === '')) {
      return fieldSchema.required === true ? `${name} is required` : fieldSchema.required;
    }

    // Type validations
    if (fieldValue && fieldValue.toString().trim() !== '') {
      // Email validation
      if (fieldSchema.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(fieldValue)) {
          return fieldSchema.email === true ? 'Invalid email format' : fieldSchema.email;
        }
      }

      // Min length validation
      if (fieldSchema.minLength && fieldValue.length < fieldSchema.minLength) {
        return `Minimum ${fieldSchema.minLength} characters required`;
      }

      // Max length validation
      if (fieldSchema.maxLength && fieldValue.length > fieldSchema.maxLength) {
        return `Maximum ${fieldSchema.maxLength} characters allowed`;
      }

      // Pattern validation
      if (fieldSchema.pattern && !fieldSchema.pattern.test(fieldValue)) {
        return fieldSchema.patternMessage || 'Invalid format';
      }

      // Custom validation
      if (fieldSchema.validate) {
        const customError = fieldSchema.validate(fieldValue, values);
        if (customError) return customError;
      }
    }

    return null;
  }, [values, validationSchema]);

  // Validate all fields
  const validateForm = useCallback(() => {
    if (!validationSchema) return {};

    const newErrors = {};
    Object.keys(validationSchema).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    return newErrors;
  }, [values, validationSchema, validateField]);

  // Handle field change
  const handleFieldChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));

    if (validateOnChange) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
      
      // Safely set custom validity
      const fieldElement = formRef.current?.querySelector(`[name="${name}"]`);
      safeSetCustomValidity(fieldElement, error || '');
    }
  }, [validateOnChange, validateField]);

  // Handle field blur
  const handleFieldBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    if (validateOnBlur) {
      const error = validateField(name, values[name]);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
      
      // Safely set custom validity
      const fieldElement = formRef.current?.querySelector(`[name="${name}"]`);
      safeSetCustomValidity(fieldElement, error || '');
    }
  }, [validateOnBlur, validateField, values]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSubmitCount(prev => prev + 1);

    // Validate all fields
    const formErrors = validateForm();
    setErrors(formErrors);

    // Mark all fields as touched
    const allFieldsTouched = {};
    Object.keys(validationSchema || {}).forEach(fieldName => {
      allFieldsTouched[fieldName] = true;
    });
    setTouched(allFieldsTouched);

    // Stop if there are errors
    if (Object.keys(formErrors).length > 0) {
      // Focus first error field
      const firstErrorField = formRef.current?.querySelector(`[name="${Object.keys(formErrors)[0]}"]`);
      if (firstErrorField) {
        firstErrorField.focus();
        // Safely set custom validity for the first error field
        safeSetCustomValidity(firstErrorField, formErrors[Object.keys(formErrors)[0]]);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit?.(values, {
        setFieldError: (field, error) => {
          setErrors(prev => ({ ...prev, [field]: error }));
          // Safely set custom validity
          const fieldElement = formRef.current?.querySelector(`[name="${field}"]`);
          safeSetCustomValidity(fieldElement, error || '');
        },
        setFieldValue: (field, value) => setValues(prev => ({ ...prev, [field]: value })),
        resetForm: () => {
          setValues(initialValues);
          setErrors({});
          setTouched({});
          // Clear all custom validity messages
          const allFields = formRef.current?.querySelectorAll('input, select, textarea');
          allFields?.forEach(field => safeSetCustomValidity(field, ''));
        }
      });

      if (resetOnSubmit) {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        // Clear all custom validity messages
        const allFields = formRef.current?.querySelectorAll('input, select, textarea');
        allFields?.forEach(field => safeSetCustomValidity(field, ''));
      }
    } catch (error) {
      // Handle submission error
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validationSchema, validateForm, onSubmit, resetOnSubmit, initialValues]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitCount(0);
    // Clear all custom validity messages
    const allFields = formRef.current?.querySelectorAll('input, select, textarea');
    allFields?.forEach(field => safeSetCustomValidity(field, ''));
  }, [initialValues]);

  // Form context
  const formContext = {
    values,
    errors,
    touched,
    isSubmitting,
    submitCount,
    setFieldValue: handleFieldChange,
    setFieldError: (field, error) => {
      setErrors(prev => ({ ...prev, [field]: error }));
      // Safely set custom validity
      const fieldElement = formRef.current?.querySelector(`[name="${field}"]`);
      safeSetCustomValidity(fieldElement, error || '');
    },
    setFieldTouched: (field, isTouched = true) => setTouched(prev => ({ ...prev, [field]: isTouched })),
    handleFieldChange,
    handleFieldBlur,
    validateField,
    resetForm
  };

  return (
    <FormContext.Provider value={formContext}>
      <form
        ref={formRef}
        className={`form ${className}`}
        onSubmit={handleSubmit}
        noValidate={noValidate}
        autoComplete={autoComplete}
        {...props}
      >
        {typeof children === 'function' ? children(formContext) : children}
      </form>
    </FormContext.Provider>
  );
});

// ... existing code ... 