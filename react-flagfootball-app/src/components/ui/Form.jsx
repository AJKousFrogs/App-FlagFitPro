import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

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
      firstErrorField?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit?.(values, {
        setFieldError: (field, error) => setErrors(prev => ({ ...prev, [field]: error })),
        setFieldValue: (field, value) => setValues(prev => ({ ...prev, [field]: value })),
        resetForm: () => {
          setValues(initialValues);
          setErrors({});
          setTouched({});
        }
      });

      if (resetOnSubmit) {
        setValues(initialValues);
        setErrors({});
        setTouched({});
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
  }, [initialValues]);

  // Form context
  const formContext = {
    values,
    errors,
    touched,
    isSubmitting,
    submitCount,
    setFieldValue: handleFieldChange,
    setFieldError: (field, error) => setErrors(prev => ({ ...prev, [field]: error })),
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

Form.displayName = 'Form';

// Form Context
const FormContext = React.createContext(null);

// Hook to use form context
export const useFormContext = () => {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a Form component');
  }
  return context;
};

// Field Component
export const Field = memo(({
  name,
  type = 'text',
  label,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  labelClassName = '',
  errorClassName = '',
  helpText,
  prefix,
  suffix,
  as: Component = 'input',
  children,
  ...props
}) => {
  const {
    values,
    errors,
    touched,
    handleFieldChange,
    handleFieldBlur
  } = useFormContext();

  const fieldValue = values[name] || '';
  const fieldError = errors[name];
  const isFieldTouched = touched[name];
  const showError = isFieldTouched && fieldError;

  const handleChange = useCallback((e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    handleFieldChange(name, value);
  }, [name, handleFieldChange]);

  const handleBlur = useCallback(() => {
    handleFieldBlur(name);
  }, [name, handleFieldBlur]);

  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  return (
    <div className={`field-group ${className} ${showError ? 'has-error' : ''}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className={`field-label ${labelClassName} ${required ? 'required' : ''}`}
          style={{
            display: 'block',
            marginBottom: '4px',
            fontWeight: '500',
            color: showError ? '#dc3545' : '#212529'
          }}
        >
          {label}
          {required && <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>}
        </label>
      )}

      <div className="field-input-wrapper" style={{ position: 'relative' }}>
        {prefix && (
          <span className="field-prefix" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6c757d',
            zIndex: 1
          }}>
            {prefix}
          </span>
        )}

        <Component
          id={fieldId}
          name={name}
          type={type}
          value={fieldValue}
          placeholder={placeholder}
          disabled={disabled}
          className={`field-input ${inputClassName} ${showError ? 'error' : ''}`}
          style={{
            width: '100%',
            padding: '8px 12px',
            paddingLeft: prefix ? '36px' : '12px',
            paddingRight: suffix ? '36px' : '12px',
            border: `1px solid ${showError ? '#dc3545' : '#ced4da'}`,
            borderRadius: '4px',
            fontSize: '14px',
            transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
            ':focus': {
              borderColor: showError ? '#dc3545' : '#80bdff',
              outline: 0,
              boxShadow: `0 0 0 0.2rem ${showError ? 'rgba(220, 53, 69, 0.25)' : 'rgba(0, 123, 255, 0.25)'}`
            }
          }}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={showError}
          aria-describedby={`${showError ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
          {...props}
        >
          {children}
        </Component>

        {suffix && (
          <span className="field-suffix" style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6c757d',
            zIndex: 1
          }}>
            {suffix}
          </span>
        )}
      </div>

      {showError && (
        <div
          id={errorId}
          className={`field-error ${errorClassName}`}
          style={{
            color: '#dc3545',
            fontSize: '12px',
            marginTop: '4px'
          }}
          role="alert"
        >
          {fieldError}
        </div>
      )}

      {helpText && !showError && (
        <div
          id={helpId}
          className="field-help"
          style={{
            color: '#6c757d',
            fontSize: '12px',
            marginTop: '4px'
          }}
        >
          {helpText}
        </div>
      )}
    </div>
  );
});

Field.displayName = 'Field';

// Submit Button Component
export const SubmitButton = memo(({
  children = 'Submit',
  disabled,
  loading,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const { isSubmitting } = useFormContext();

  const variantStyles = {
    primary: { background: '#007bff', color: 'white' },
    secondary: { background: '#6c757d', color: 'white' },
    success: { background: '#28a745', color: 'white' },
    danger: { background: '#dc3545', color: 'white' },
    warning: { background: '#ffc107', color: '#212529' },
    info: { background: '#17a2b8', color: 'white' }
  };

  return (
    <button
      type="submit"
      disabled={disabled || isSubmitting || loading}
      className={`submit-button ${className}`}
      style={{
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled || isSubmitting || loading ? 'not-allowed' : 'pointer',
        fontWeight: '500',
        opacity: disabled || isSubmitting || loading ? 0.6 : 1,
        transition: 'all 0.15s ease-in-out',
        ...variantStyles[variant]
      }}
      {...props}
    >
      {(isSubmitting || loading) ? 'Submitting...' : children}
    </button>
  );
});

SubmitButton.displayName = 'SubmitButton';

// Field Group Component
export const FieldGroup = memo(({ children, className = '', ...props }) => (
  <div className={`field-group-container ${className}`} style={{ marginBottom: '16px' }} {...props}>
    {children}
  </div>
));

FieldGroup.displayName = 'FieldGroup';

Form.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  onSubmit: PropTypes.func.isRequired,
  validationSchema: PropTypes.object,
  initialValues: PropTypes.object,
  resetOnSubmit: PropTypes.bool,
  validateOnChange: PropTypes.bool,
  validateOnBlur: PropTypes.bool,
  className: PropTypes.string,
  noValidate: PropTypes.bool,
  autoComplete: PropTypes.string
};

Field.propTypes = {
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  errorClassName: PropTypes.string,
  helpText: PropTypes.string,
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  as: PropTypes.elementType,
  children: PropTypes.node
};

export default Form;