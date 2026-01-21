/**
 * Validation utility functions
 * Updated: January 2026 - Enhanced validation with security improvements
 */

/**
 * Validate email format
 * Enhanced with max length and proper RFC 5322 validation
 * @example
 * isEmail('test@example.com') // true
 */
export function isEmail(email: string): boolean {
  if (!email || typeof email !== "string" || email.length > 254) {
    return false;
  }
  // More robust email validation per RFC 5322
  const emailPattern =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailPattern.test(email.trim());
}

/**
 * Validate phone number format (US/International)
 * Enhanced with stricter validation
 * @example
 * isPhone('+1-555-123-4567') // true
 */
export function isPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string" || phone.length > 20) {
    return false;
  }
  const phonePattern = /^\+?[\d\s\-()]+$/;
  const digits = phone.replace(/\D/g, "");
  return phonePattern.test(phone) && digits.length >= 10 && digits.length <= 15;
}

/**
 * Check if password is strong
 * Requirements: 8+ chars, uppercase, lowercase, number, special char
 * Updated to match OWASP recommendations
 * @example
 * isStrongPassword('Test123!@') // true
 */
export function isStrongPassword(password: string): boolean {
  if (!password || typeof password !== "string") {
    return false;
  }
  return (
    password.length >= 8 &&
    password.length <= 128 && // Max length to prevent DoS
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) // Special char
  );
}

/**
 * Get password strength score (0-4)
 * @param password - Password to evaluate
 * @returns Score: 0=very weak, 1=weak, 2=fair, 3=strong, 4=very strong
 */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;

  let score = 0;

  // Length scoring
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;

  return Math.min(score, 4);
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
  return typeof value === "number" && !isNaN(value) && isFinite(value);
}

/**
 * Check if string contains only letters
 */
export function isAlpha(str: string): boolean {
  return /^[a-zA-Z]+$/.test(str);
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * Sanitize string input to prevent XSS attacks
 * Removes potentially dangerous characters and HTML
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== "string") return "";

  return input
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validate UUID format
 */
export function isUUID(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value);
}

/**
 * Validate numeric range with type safety
 */
export function isInNumericRange(
  value: number,
  min: number,
  max: number,
): boolean {
  if (typeof value !== "number" || isNaN(value) || !isFinite(value)) {
    return false;
  }
  return value >= min && value <= max;
}

/**
 * Validate team ID format (alphanumeric and hyphens only)
 */
export function isValidTeamId(teamId: string): boolean {
  if (!teamId || typeof teamId !== "string") return false;
  return /^[a-zA-Z0-9-_]{1,64}$/.test(teamId);
}

/**
 * Validate player name (letters, spaces, hyphens, apostrophes)
 */
export function isValidPlayerName(name: string): boolean {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  return (
    trimmed.length >= 2 &&
    trimmed.length <= 100 &&
    /^[a-zA-Z\s'-]+$/.test(trimmed)
  );
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
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj < new Date();
}

/**
 * Validate date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj > new Date();
}

/**
 * Validate credit card number (Luhn algorithm)
 */
export function isCreditCard(cardNumber: string): boolean {
  const sanitized = cardNumber.replace(/\D/g, "");

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
