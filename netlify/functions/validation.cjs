/**
 * Request Validation Middleware for Netlify Functions
 * Provides reusable validation utilities for API requests
 */

/**
 * Validation schemas and rules
 */
const VALIDATION_RULES = {
  // Physical measurements validation
  physicalMeasurements: {
    weight: { min: 40, max: 200, required: false },
    height: { min: 140, max: 220, required: false },
    bodyFat: { min: 3, max: 50, required: false },
    muscleMass: { min: 0, max: 150, required: false },
  },

  // Wellness data validation
  wellness: {
    sleep: { min: 0, max: 10, required: false },
    energy: { min: 0, max: 10, required: false },
    stress: { min: 0, max: 10, required: false },
    soreness: { min: 0, max: 10, required: false },
    motivation: { min: 0, max: 10, required: false },
    mood: { min: 0, max: 10, required: false },
    hydration: { min: 0, max: 10, required: false },
    date: { type: 'date', required: false },
  },

  // Supplement data validation
  supplement: {
    name: { type: 'string', minLength: 1, maxLength: 200, required: true },
    dosage: { type: 'string', maxLength: 100, required: false },
    taken: { type: 'boolean', required: false },
    date: { type: 'date', required: false },
    timeOfDay: { type: 'string', enum: ['morning', 'afternoon', 'evening', 'pre-workout', 'post-workout'], required: false },
  },

  // Injury data validation
  injury: {
    type: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    severity: { type: 'integer', min: 1, max: 10, required: true },
    description: { type: 'string', maxLength: 500, required: false },
    status: { type: 'string', enum: ['active', 'recovering', 'monitoring', 'recovered'], required: false },
    startDate: { type: 'date', required: true },
    recoveryDate: { type: 'date', required: false },
  },

  // Performance test validation
  performanceTest: {
    testType: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    result: { type: 'number', required: true },
    date: { type: 'date', required: false },
    conditions: { type: 'object', required: false },
  },

  // Query parameters validation
  queryParams: {
    timeframe: { type: 'string', enum: ['7d', '1w', '30d', '1m', '3m', '6m', '12m', '1y'], required: false },
    page: { type: 'integer', min: 1, max: 1000, required: false },
    limit: { type: 'integer', min: 1, max: 100, required: false },
    status: { type: 'string', enum: ['active', 'recovering', 'monitoring', 'recovered', 'all'], required: false },
    testType: { type: 'string', required: false },
    format: { type: 'string', enum: ['json', 'csv'], required: false },
  },

  // Authentication - Login validation
  login: {
    email: { type: 'string', required: true, minLength: 3, maxLength: 255 },
    password: { type: 'string', required: true, minLength: 6, maxLength: 255 },
  },

  // Authentication - Registration validation
  register: {
    email: { type: 'string', required: true, minLength: 3, maxLength: 255 },
    password: { type: 'string', required: true, minLength: 8, maxLength: 255 },
    name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    role: { type: 'string', enum: ['player', 'coach', 'admin'], required: false },
  },
};

/**
 * Validate a single field against its rules
 * @param {string} fieldName - Name of the field
 * @param {any} value - Value to validate
 * @param {object} rules - Validation rules for the field
 * @returns {string|null} Error message or null if valid
 */
function validateField(fieldName, value, rules) {
  // Check if required
  if (rules.required && (value === undefined || value === null || value === '')) {
    return `${fieldName} is required`;
  }

  // If not required and empty, skip other validations
  if (!rules.required && (value === undefined || value === null || value === '')) {
    return null;
  }

  // Type validation
  if (rules.type) {
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${fieldName} must be a string`;
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${fieldName} must be a number`;
        }
        break;

      case 'integer':
        if (!Number.isInteger(Number(value))) {
          return `${fieldName} must be an integer`;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          return `${fieldName} must be a boolean`;
        }
        break;

      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return `${fieldName} must be a valid date`;
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null) {
          return `${fieldName} must be an object`;
        }
        break;
    }
  }

  // Min/Max validation for numbers
  if (rules.min !== undefined && Number(value) < rules.min) {
    return `${fieldName} must be at least ${rules.min}`;
  }

  if (rules.max !== undefined && Number(value) > rules.max) {
    return `${fieldName} must be at most ${rules.max}`;
  }

  // String length validation
  if (rules.minLength !== undefined && value.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`;
  }

  if (rules.maxLength !== undefined && value.length > rules.maxLength) {
    return `${fieldName} must be at most ${rules.maxLength} characters`;
  }

  // Enum validation
  if (rules.enum && !rules.enum.includes(value)) {
    return `${fieldName} must be one of: ${rules.enum.join(', ')}`;
  }

  return null;
}

/**
 * Validate data against a schema
 * @param {object} data - Data to validate
 * @param {string} schemaName - Name of the schema in VALIDATION_RULES
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validate(data, schemaName) {
  const schema = VALIDATION_RULES[schemaName];

  if (!schema) {
    return {
      valid: false,
      errors: [`Unknown validation schema: ${schemaName}`],
    };
  }

  const errors = [];

  // Validate each field in the schema
  for (const [fieldName, rules] of Object.entries(schema)) {
    const value = data[fieldName];
    const error = validateField(fieldName, value, rules);

    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize input data
 * @param {object} data - Data to sanitize
 * @returns {object} Sanitized data
 */
function sanitize(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    // Remove null bytes
    if (typeof value === 'string') {
      sanitized[key] = value.replace(/\0/g, '');
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Create a validation error response
 * @param {string[]} errors - Array of error messages
 * @param {number} statusCode - HTTP status code (default: 400)
 * @returns {object} Netlify function response object
 */
function createValidationErrorResponse(errors, statusCode = 400) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      success: false,
      errors,
      message: 'Validation failed',
    }),
  };
}

/**
 * Validate request body middleware
 * @param {string} body - Request body string
 * @param {string} schemaName - Validation schema name
 * @returns {object} { valid: boolean, data: object|null, response: object|null }
 */
function validateRequestBody(body, schemaName) {
  try {
    // Parse JSON
    const data = JSON.parse(body);

    // Sanitize input
    const sanitizedData = sanitize(data);

    // Validate against schema
    const validation = validate(sanitizedData, schemaName);

    if (!validation.valid) {
      return {
        valid: false,
        data: null,
        response: createValidationErrorResponse(validation.errors),
      };
    }

    return {
      valid: true,
      data: sanitizedData,
      response: null,
    };
  } catch (error) {
    return {
      valid: false,
      data: null,
      response: createValidationErrorResponse(['Invalid JSON in request body']),
    };
  }
}

/**
 * Validate query parameters
 * @param {object} queryParams - Query parameters object
 * @returns {object} { valid: boolean, errors: string[], sanitized: object }
 */
function validateQueryParams(queryParams) {
  if (!queryParams) {
    return { valid: true, errors: [], sanitized: {} };
  }

  const sanitized = sanitize(queryParams);
  const validation = validate(sanitized, 'queryParams');

  return {
    valid: validation.valid,
    errors: validation.errors,
    sanitized,
  };
}

module.exports = {
  validate,
  validateField,
  validateRequestBody,
  validateQueryParams,
  sanitize,
  createValidationErrorResponse,
  VALIDATION_RULES,
};
