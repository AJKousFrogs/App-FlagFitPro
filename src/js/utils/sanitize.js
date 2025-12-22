/* global logger */
/**
 * FlagFit Pro - HTML Sanitization Utilities
 * Prevents XSS attacks by escaping user-generated content
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for HTML insertion
 */
function escapeHtml(str) {
  if (str === null || str === undefined) {
    return '';
  }

  const text = String(str);
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;'
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize HTML attributes
 * @param {string} attr - Attribute value to sanitize
 * @returns {string} Sanitized attribute value
 */
function sanitizeAttribute(attr) {
  if (attr === null || attr === undefined) {
    return '';
  }

  // Remove any javascript: or data: URLs
  const str = String(attr);
  if (/^(javascript|data|vbscript):/i.test(str)) {
    return '';
  }

  return escapeHtml(str);
}

/**
 * Sanitize URL to prevent XSS via href/src attributes
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL or empty string if dangerous
 */
function sanitizeUrl(url) {
  if (!url) {
    return '';
  }

  const str = String(url).trim();

  // Allow only safe protocols
  const safeProtocols = /^(https?|mailto|tel|sms):/i;
  const hasProtocol = /^[a-z][a-z0-9+.-]*:/i.test(str);

  if (hasProtocol && !safeProtocols.test(str)) {
    // Don't log the actual URL content in production for security
    if (typeof logger !== 'undefined') {
      logger.warn('[Sanitize] Blocked unsafe URL protocol');
    }
    return '';
  }

  // Block javascript: and data: URLs (redundant check for safety)
  if (/^(javascript|data|vbscript):/i.test(str)) {
    if (typeof logger !== 'undefined') {
      logger.warn('[Sanitize] Blocked XSS URL attempt');
    }
    return '';
  }

  return str;
}

/**
 * Create safe HTML element with text content
 * This is the safest way - creates actual DOM elements instead of HTML strings
 * @param {string} tag - HTML tag name
 * @param {object} attributes - Element attributes
 * @param {string|Node} content - Text content or child node
 * @returns {HTMLElement} Safe DOM element
 */
function createSafeElement(tag, attributes = {}, content = '') {
  const element = document.createElement(tag);

  // Set attributes safely
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key === 'class' || key === 'className') {
      element.className = value;
    } else if (key === 'href' || key === 'src') {
      element.setAttribute(key, sanitizeUrl(value));
    } else {
      element.setAttribute(key, sanitizeAttribute(value));
    }
  }

  // Set content safely
  if (content instanceof Node) {
    element.appendChild(content);
  } else if (content) {
    element.textContent = String(content);
  }

  return element;
}

/**
 * Sanitize and allow only specific safe HTML tags
 * For limited rich text (bold, italic, links)
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML with only allowed tags
 */
function sanitizeRichText(html) {
  if (!html) {
    return '';
  }

  const temp = document.createElement('div');
  temp.textContent = html; // First escape everything

  // Then allow specific safe formatting
  // Safe: Reading escaped content from temp container (temp container pattern)
  // eslint-disable-next-line no-restricted-syntax
  let sanitized = temp.innerHTML;

  // Allow safe tags: <b>, <i>, <em>, <strong>, <br>
  // This is a simple implementation - for production use DOMPurify
  const allowedTags = ['b', 'i', 'em', 'strong', 'br'];
  const tagPattern = new RegExp(`&lt;(/?)(${allowedTags.join('|')})&gt;`, 'gi');

  sanitized = sanitized.replace(tagPattern, '<$1$2>');

  return sanitized;
}

// Export functions for ES6 modules
export {
  escapeHtml,
  sanitizeAttribute,
  sanitizeUrl,
  createSafeElement,
  sanitizeRichText
};

// Also export for CommonJS (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHtml,
    sanitizeAttribute,
    sanitizeUrl,
    createSafeElement,
    sanitizeRichText
  };
}

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.sanitize = {
    escapeHtml,
    sanitizeAttribute,
    sanitizeUrl,
    createSafeElement,
    sanitizeRichText
  };
}

// Use logger if available (imported modules will have it)
if (typeof logger !== 'undefined') {
  logger.debug('[Sanitize] HTML sanitization utilities loaded');
}
