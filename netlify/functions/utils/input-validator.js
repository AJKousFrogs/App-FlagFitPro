/**
 * Input Validation Middleware
 *
 * Provides centralized input validation for Netlify functions.
 * Helps prevent:
 * - SQL injection
 * - XSS attacks
 * - Invalid data types
 * - Missing required fields
 */

import { handleValidationError } from "./error-handler.js";

/**
 * Common validation patterns
 */
const PATTERNS = {
  // UUID format (Supabase user IDs)
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  // Email format
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Safe string (alphanumeric, spaces, basic punctuation)
  SAFE_STRING: /^[a-zA-Z0-9\s.,!?'-]+$/,
  // Safe identifier (alphanumeric, underscores, hyphens)
  SAFE_ID: /^[A-Za-z0-9_-]+$/,
  // Date format (YYYY-MM-DD)
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  // ISO datetime
  ISO_DATETIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  // Phone number (basic)
  PHONE: /^[+]?[0-9\s()-]{7,20}$/,
  // URL
  URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
};

/**
 * Field type validators
 */
const VALIDATORS = {
  string: (value, options = {}) => {
    if (typeof value !== "string") {
      return "must be a string";
    }
    if (options.minLength && value.length < options.minLength) {
      return `must be at least ${options.minLength} characters`;
    }
    if (options.maxLength && value.length > options.maxLength) {
      return `must be at most ${options.maxLength} characters`;
    }
    if (options.pattern && !options.pattern.test(value)) {
      return options.patternMessage || "has invalid format";
    }
    return null;
  },

  number: (value, options = {}) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (typeof num !== "number" || isNaN(num)) {
      return "must be a number";
    }
    if (options.min !== undefined && num < options.min) {
      return `must be at least ${options.min}`;
    }
    if (options.max !== undefined && num > options.max) {
      return `must be at most ${options.max}`;
    }
    if (options.integer && !Number.isInteger(num)) {
      return "must be an integer";
    }
    return null;
  },

  boolean: (value) => {
    if (typeof value !== "boolean" && value !== "true" && value !== "false") {
      return "must be a boolean";
    }
    return null;
  },

  email: (value) => {
    if (typeof value !== "string" || !PATTERNS.EMAIL.test(value)) {
      return "must be a valid email address";
    }
    return null;
  },

  uuid: (value) => {
    if (typeof value !== "string" || !PATTERNS.UUID.test(value)) {
      return "must be a valid UUID";
    }
    return null;
  },

  date: (value) => {
    if (typeof value !== "string" || !PATTERNS.DATE.test(value)) {
      return "must be a valid date (YYYY-MM-DD)";
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return "must be a valid date";
    }
    return null;
  },

  datetime: (value) => {
    if (typeof value !== "string") {
      return "must be a string";
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return "must be a valid datetime";
    }
    return null;
  },

  array: (value, options = {}) => {
    if (!Array.isArray(value)) {
      return "must be an array";
    }
    if (options.minLength && value.length < options.minLength) {
      return `must have at least ${options.minLength} items`;
    }
    if (options.maxLength && value.length > options.maxLength) {
      return `must have at most ${options.maxLength} items`;
    }
    return null;
  },

  object: (value) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return "must be an object";
    }
    return null;
  },

  enum: (value, options = {}) => {
    if (!options.values || !options.values.includes(value)) {
      return `must be one of: ${(options.values || []).join(", ")}`;
    }
    return null;
  },
};

/**
 * Validate input against a schema
 *
 * @param {object} data - The data to validate
 * @param {object} schema - Validation schema
 * @returns {{ valid: boolean, errors: string[], cleaned: object }}
 *
 * @example
 * const schema = {
 *   name: { type: 'string', required: true, minLength: 2, maxLength: 50 },
 *   email: { type: 'email', required: true },
 *   age: { type: 'number', min: 0, max: 150 },
 *   role: { type: 'enum', values: ['admin', 'user', 'guest'] }
 * };
 *
 * const result = validateInput(data, schema);
 * if (!result.valid) {
 *   return handleValidationError(result.errors.join(', '));
 * }
 */
function validateInput(data, schema) {
  const errors = [];
  const cleaned = {};

  if (!data || typeof data !== "object") {
    return {
      valid: false,
      errors: ["Request body must be an object"],
      cleaned: {},
    };
  }

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required fields
    if (
      rules.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip validation if field is optional and not provided
    if (value === undefined || value === null) {
      if (rules.default !== undefined) {
        cleaned[field] = rules.default;
      }
      continue;
    }

    // Get the validator for this type
    const validator = VALIDATORS[rules.type];
    if (!validator) {
      errors.push(`Unknown validation type: ${rules.type}`);
      continue;
    }

    // Run validation
    const error = validator(value, rules);
    if (error) {
      errors.push(`${field} ${error}`);
    } else {
      // Add to cleaned data with type coercion if needed
      if (rules.type === "number") {
        cleaned[field] = typeof value === "string" ? parseFloat(value) : value;
      } else if (rules.type === "boolean") {
        cleaned[field] = value === true || value === "true";
      } else {
        cleaned[field] = value;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    cleaned,
  };
}

/**
 * Sanitize a string to prevent XSS
 */
function sanitizeString(str) {
  if (typeof str !== "string") {
    return str;
  }
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

/**
 * Sanitize an object recursively
 */
function sanitizeObject(obj) {
  if (typeof obj !== "object" || obj === null) {
    return typeof obj === "string" ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[sanitizeString(key)] = sanitizeObject(value);
  }
  return sanitized;
}

/**
 * Parse and validate JSON body from request
 *
 * @param {object} event - Netlify function event
 * @param {object} schema - Validation schema (optional)
 * @returns {{ valid: boolean, data: object, error: object|null }}
 */
function parseAndValidateBody(event, schema = null) {
  // Parse JSON body
  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (_error) {
    return {
      valid: false,
      data: null,
      error: handleValidationError("Invalid JSON in request body"),
    };
  }

  // Sanitize input
  body = sanitizeObject(body);

  // Validate against schema if provided
  if (schema) {
    const validation = validateInput(body, schema);
    if (!validation.valid) {
      return {
        valid: false,
        data: null,
        error: handleValidationError(validation.errors.join(", ")),
      };
    }
    return {
      valid: true,
      data: validation.cleaned,
      error: null,
    };
  }

  return {
    valid: true,
    data: body,
    error: null,
  };
}

/**
 * Validate query parameters
 *
 * @param {object} params - Query parameters
 * @param {object} schema - Validation schema
 * @returns {{ valid: boolean, data: object, error: object|null }}
 */
function validateQueryParams(params, schema) {
  const queryParams = params || {};
  const validation = validateInput(queryParams, schema);

  if (!validation.valid) {
    return {
      valid: false,
      data: null,
      error: handleValidationError(validation.errors.join(", ")),
    };
  }

  return {
    valid: true,
    data: validation.cleaned,
    error: null,
  };
}

function parseJsonObjectBody(rawBody, { allowEmpty = true } = {}) {
  if (rawBody === undefined || rawBody === null || rawBody === "") {
    if (allowEmpty) {
      return {};
    }

    const error = new Error("Request body is required");
    error.isValidation = true;
    error.code = "INVALID_JSON_BODY";
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch (_parseError) {
    const error = new Error("Invalid JSON in request body");
    error.isValidation = true;
    error.code = "INVALID_JSON_BODY";
    throw error;
  }

  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    const error = new Error("Request body must be an object");
    error.isValidation = true;
    error.code = "INVALID_JSON_BODY";
    throw error;
  }

  return parsed;
}

function tryParseJsonObjectBody(rawBody, options) {
  try {
    return {
      ok: true,
      data: parseJsonObjectBody(rawBody, options),
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: handleValidationError(error?.message || "Invalid request body"),
    };
  }
}

/**
 * Common validation schemas for reuse
 */
const COMMON_SCHEMAS = {
  pagination: {
    page: { type: "number", min: 1, default: 1 },
    limit: { type: "number", min: 1, max: 100, default: 20 },
  },
  dateRange: {
    startDate: { type: "date" },
    endDate: { type: "date" },
  },
  athleteId: {
    athleteId: { type: "uuid" },
  },
};

export {
  validateInput,
  sanitizeString,
  sanitizeObject,
  parseAndValidateBody,
  parseJsonObjectBody,
  tryParseJsonObjectBody,
  validateQueryParams,
  PATTERNS,
  VALIDATORS,
  COMMON_SCHEMAS,
};

export default {
  validateInput,
  sanitizeString,
  sanitizeObject,
  parseAndValidateBody,
  parseJsonObjectBody,
  tryParseJsonObjectBody,
  validateQueryParams,
  PATTERNS,
  VALIDATORS,
  COMMON_SCHEMAS,
};
