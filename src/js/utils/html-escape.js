/**
 * HTML Escape Utility
 * Prevents XSS attacks by escaping HTML special characters
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} unsafe - Unsafe string that may contain HTML
 * @returns {string} Safe string with HTML characters escaped
 */
export function escapeHtml(unsafe) {
  if (typeof unsafe !== "string") {
    return unsafe;
  }

  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Escapes HTML in an object's string properties
 * @param {Object} obj - Object with string properties
 * @param {Array<string>} fields - Fields to escape
 * @returns {Object} New object with escaped fields
 */
export function escapeObjectFields(obj, fields) {
  const escaped = { ...obj };
  fields.forEach((field) => {
    if (typeof escaped[field] === "string") {
      escaped[field] = escapeHtml(escaped[field]);
    }
  });
  return escaped;
}

/**
 * Debounce utility function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
