import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Eye, EyeOff } from '../../utils/icons';
import { cn } from '../../utils/cn';
import { safeSetCustomValidity, safeClearCustomValidity } from '../../utils/formValidation';

/**
 * Safe password input component with visibility toggle and proper ref forwarding
 * Prevents "setCustomValidity is not a function" errors
 */
const SafePasswordInput = forwardRef(({
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder = 'Enter your password',
  required = false,
  disabled = false,
  className = '',
  error,
  showToggle = true,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
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
    },
    
    // Expose password-specific methods
    togglePasswordVisibility: () => {
      setShowPassword(prev => !prev);
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

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={showPassword ? "text" : "password"}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          showToggle ? "pr-12" : "",
          error 
            ? "border-red-300 focus:border-red-500" 
            : "border-gray-300 focus:border-blue-500",
          className
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
      
      {showToggle && (
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          aria-label="Toggle password visibility"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      )}
    </div>
  );
});

SafePasswordInput.displayName = 'SafePasswordInput';

export default SafePasswordInput; 