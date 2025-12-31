/**
 * Privacy Logger Utility
 * 
 * Structured logging for privacy-related events with automatic PII redaction.
 * All logs follow the format defined in MONITORING.md.
 * 
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// ============================================================================
// REDACTION UTILITIES
// ============================================================================

/**
 * Redact email address (keep first char + domain)
 * @param {string} email 
 * @returns {string} Redacted email
 */
function redactEmail(email) {
  if (!email || typeof email !== 'string') {return email;}
  const parts = email.split('@');
  if (parts.length !== 2) {return '***@***';}
  const [user, domain] = parts;
  return `${user[0]}***@${domain}`;
}

/**
 * Redact phone number (keep last 4 digits)
 * @param {string} phone 
 * @returns {string} Redacted phone
 */
function redactPhone(phone) {
  if (!phone || typeof phone !== 'string') {return phone;}
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) {return '***';}
  return `***-***-${digits.slice(-4)}`;
}

/**
 * Redact a name (first name + initial)
 * @param {string} name 
 * @returns {string} Redacted name
 */
function redactName(name) {
  if (!name || typeof name !== 'string') {return name;}
  const parts = name.trim().split(' ');
  if (parts.length === 1) {return `${parts[0][0]}***`;}
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/**
 * Redact JWT token (show first 10 chars)
 * @param {string} token 
 * @returns {string} Redacted token
 */
function redactToken(token) {
  if (!token || typeof token !== 'string') {return token;}
  if (token.length <= 10) {return '***';}
  return `${token.substring(0, 10)}***`;
}

/**
 * Recursively redact sensitive fields from an object
 * @param {Object} obj 
 * @returns {Object} Redacted object
 */
function redactSensitive(obj) {
  if (!obj || typeof obj !== 'object') {return obj;}
  if (Array.isArray(obj)) {return obj.map(redactSensitive);}

  const redacted = {};
  const sensitiveFields = {
    email: redactEmail,
    guardian_email: redactEmail,
    guardianEmail: redactEmail,
    phone: redactPhone,
    phone_number: redactPhone,
    phoneNumber: redactPhone,
    name: redactName,
    full_name: redactName,
    fullName: redactName,
    guardian_name: redactName,
    guardianName: redactName,
    token: redactToken,
    access_token: redactToken,
    accessToken: redactToken,
    refresh_token: redactToken,
    refreshToken: redactToken,
    authorization: redactToken,
  };

  // Fields to completely remove
  const removeFields = [
    'password',
    'passwordHash',
    'password_hash',
    'secret',
    'api_key',
    'apiKey',
    'ssn',
    'social_security',
    'credit_card',
    'creditCard',
    'card_number',
    'cardNumber',
  ];

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Remove completely sensitive fields
    if (removeFields.some(f => lowerKey.includes(f.toLowerCase()))) {
      continue;
    }

    // Redact known sensitive fields
    const redactor = sensitiveFields[key] || sensitiveFields[lowerKey];
    if (redactor && typeof value === 'string') {
      redacted[key] = redactor(value);
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitive(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

/**
 * Log a privacy-related event with structured format
 * @param {string} event - Event name (e.g., 'consent_check', 'ai_consent_check')
 * @param {Object} details - Event details
 * @param {string} details.requestId - Request ID for tracing
 * @param {string} details.userId - User ID (UUID)
 * @param {string} details.outcome - 'allowed', 'blocked', 'error', etc.
 * @param {Object} [details.extra] - Additional details (will be redacted)
 * @param {string} [level='info'] - Log level
 */
function logPrivacyEvent(event, details, level = 'info') {
  if (LOG_LEVELS[level] < LOG_LEVELS[CURRENT_LOG_LEVEL]) {
    return;
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    service: process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_NAME || 'netlify-function',
    requestId: details.requestId || 'unknown',
    userId: details.userId || null, // UUID is safe
    event,
    outcome: details.outcome || null,
    details: details.extra ? redactSensitive(details.extra) : undefined,
  };

  // Clean undefined fields
  Object.keys(logEntry).forEach(key => {
    if (logEntry[key] === undefined) {delete logEntry[key];}
  });

  console.log(JSON.stringify(logEntry));
}

/**
 * Log consent check event
 */
function logConsentCheck(requestId, accessorId, targetId, resource, granted, reason = null) {
  logPrivacyEvent('consent_check', {
    requestId,
    userId: accessorId,
    outcome: granted ? 'allowed' : 'blocked',
    extra: {
      targetUserId: targetId,
      resource,
      granted,
      reason,
    },
  });
}

/**
 * Log AI consent check event
 */
function logAiConsentCheck(requestId, userId, enabled) {
  logPrivacyEvent('ai_consent_check', {
    requestId,
    userId,
    outcome: enabled ? 'allowed' : 'blocked',
    extra: {
      aiProcessingEnabled: enabled,
    },
  });
}

/**
 * Log deletion request event
 */
function logDeletionRequested(requestId, userId, deletionRequestId) {
  logPrivacyEvent('deletion_requested', {
    requestId,
    userId,
    outcome: 'initiated',
    extra: {
      deletionRequestId,
    },
  }, 'info');
}

/**
 * Log deletion processed event
 */
function logDeletionProcessed(requestId, deletionRequestId, tablesDeleted) {
  logPrivacyEvent('deletion_processed', {
    requestId,
    userId: null, // User no longer exists
    outcome: 'completed',
    extra: {
      deletionRequestId,
      tablesDeletedCount: tablesDeleted?.length || 0,
    },
  }, 'info');
}

/**
 * Log deletion failed event
 */
function logDeletionFailed(requestId, userId, deletionRequestId, error) {
  logPrivacyEvent('deletion_failed', {
    requestId,
    userId,
    outcome: 'error',
    extra: {
      deletionRequestId,
      errorCode: error?.code || 'unknown',
      // Don't log full error message as it may contain PII
    },
  }, 'error');
}

/**
 * Log privacy setting change
 */
function logPrivacySettingChanged(requestId, userId, setting, oldValue, newValue) {
  logPrivacyEvent('privacy_setting_changed', {
    requestId,
    userId,
    outcome: 'updated',
    extra: {
      setting,
      oldValue: typeof oldValue === 'boolean' ? oldValue : '***',
      newValue: typeof newValue === 'boolean' ? newValue : '***',
    },
  });
}

/**
 * Log retention cleanup event
 */
function logRetentionCleanup(requestId, recordCount, recordType = 'emergency_medical_records') {
  logPrivacyEvent('retention_cleanup', {
    requestId,
    userId: null,
    outcome: recordCount > 0 ? 'cleaned' : 'no_action',
    extra: {
      recordCount,
      recordType,
    },
  });
}

/**
 * Log data state for metrics tracking
 */
function logDataState(requestId, userId, feature, dataState, dataPoints) {
  logPrivacyEvent('data_state_check', {
    requestId,
    userId,
    outcome: dataState,
    extra: {
      feature,
      dataState,
      dataPoints,
    },
  }, 'debug');
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Core logging
  logPrivacyEvent,
  
  // Specific event loggers
  logConsentCheck,
  logAiConsentCheck,
  logDeletionRequested,
  logDeletionProcessed,
  logDeletionFailed,
  logPrivacySettingChanged,
  logRetentionCleanup,
  logDataState,
  
  // Utilities
  redactSensitive,
  redactEmail,
  redactPhone,
  redactName,
  redactToken,
};




