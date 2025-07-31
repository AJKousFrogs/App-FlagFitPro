import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { safeSetCustomValidity, safeClearCustomValidity } from '../../utils/formValidation';

/**
 * Safe input component that properly forwards refs and handles validation
 * Prevents "setCustomValidity is not a function" errors
 */
const SafeInput = forwardRef(({
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  error,
  ...props
}, ref) => {
  const inputRef = useRef(null);

  // Forward the ref to the actual input element
  useImperativeHandle(ref, () => ({
    // Expose the actual DOM element
    get element() {
      return inputRef.current;
    },
    
    // Expose safe validation methods
    setCustomValidity: (message) => {
      safeSetCustomValidity(inputRef.current, message);
    },
    
    clearCustomValidity: () => {
      safeClearCustomValidity(inputRef.current);
    },
    
    // Expose standard input methods
    focus: () => {
      inputRef.current?.focus();
    },
    
    blur: () => {
      inputRef.current?.blur();
    },
    
    select: () => {
      inputRef.current?.select();
    },
    
    // Expose standard input properties
    get value() {
      return inputRef.current?.value || '';
    },
    
    set value(val) {
      if (inputRef.current) {
        inputRef.current.value = val;
      }
    },
    
    get validity() {
      return inputRef.current?.validity;
    },
    
    get validationMessage() {
      return inputRef.current?.validationMessage || '';
    },
    
    checkValidity: () => {
      return inputRef.current?.checkValidity() || false;
    },
    
    reportValidity: () => {
      return inputRef.current?.reportValidity() || false;
    }
  }));

  const handleChange = (e) => {
    // Clear custom validity when user starts typing
    if (error) {
      safeClearCustomValidity(inputRef.current);
    }
    onChange?.(e);
  };

  const handleBlur = (e) => {
    // Set custom validity if there's an error
    if (error) {
      safeSetCustomValidity(inputRef.current, error);
    }
    onBlur?.(e);
  };

  const handleFocus = (e) => {
    // Clear custom validity on focus
    safeClearCustomValidity(inputRef.current);
    onFocus?.(e);
  };

  return (
    <input
      ref={inputRef}
      type={type}
      name={name}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={`safe-input ${className} ${error ? 'error' : ''}`}
      aria-invalid={!!error}
      aria-describedby={error ? `${name}-error` : undefined}
      {...props}
    />
  );
});

SafeInput.displayName = 'SafeInput';

export default SafeInput; 