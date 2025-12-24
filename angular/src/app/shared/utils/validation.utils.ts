/**
 * Validation utility functions
 */

/**
 * Validate email format
 * @example
 * isEmail('test@example.com') // true
 */
export function isEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Validate phone number format (US/International)
 * @example
 * isPhone('+1-555-123-4567') // true
 */
export function isPhone(phone: string): boolean {
  const phonePattern = /^\+?[\d\s\-()]+$/;
  return phonePattern.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Check if password is strong
 * Requirements: 8+ chars, uppercase, lowercase, number
 * @example
 * isStrongPassword('Test123!') // true
 */
export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

/**
 * Check if string is a valid URL
 * @example
 * isUrl('https://example.com') // true
 */
export function isUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if value is a valid number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Check if string contains only letters
 */
export function isAlpha(str: string): boolean {
  return /^[a-zA-Z]+$/.test(str);
}

/**
 * Check if string contains only letters and numbers
 */
export function isAlphaNumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Validate minimum length
 */
export function minLength(value: string, min: number): boolean {
  return value.length >= min;
}

/**
 * Validate maximum length
 */
export function maxLength(value: string, max: number): boolean {
  return value.length <= max;
}

/**
 * Validate value is within range
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
}

/**
 * Validate date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
}

/**
 * Validate credit card number (Luhn algorithm)
 */
export function isCreditCard(cardNumber: string): boolean {
  const sanitized = cardNumber.replace(/\D/g, '');
  
  if (sanitized.length < 13 || sanitized.length > 19) {
    return false;
  }
  
  let sum = 0;
  let isEven = false;
  
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Validate ZIP code (US format)
 */
export function isZipCode(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip);
}

/**
 * Custom pattern validation
 */
export function matchesPattern(value: string, pattern: RegExp): boolean {
  return pattern.test(value);
}

