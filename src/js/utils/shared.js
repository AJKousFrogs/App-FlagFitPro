// Shared Utilities Module - FlagFit Pro
// Common functions used across multiple page modules

import { logger } from "../../logger.js";
import { escapeHtml, sanitizeRichText } from "./sanitize.js";

// ================================================================
// DOM UTILITIES
// ================================================================

export function getInitials(name) {
  if (!name) {
    return "??";
  }
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function scrollToBottom(containerId, delay = 100) {
  const container = document.getElementById(containerId);
  if (container) {
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, delay);
  }
}

/**
 * Initialize Lucide icons with polling fallback
 * Waits for Lucide to load if not immediately available
 * @param {HTMLElement|Document} container - Container to initialize icons in (default: document)
 * @param {Object} options - Options
 * @param {number} options.maxAttempts - Maximum polling attempts (default: 50)
 * @param {number} options.pollInterval - Polling interval in ms (default: 100)
 * @param {number} options.initialDelay - Initial delay before checking in ms (default: 100)
 * @returns {void}
 */
export function initializeLucideIcons(container = document, options = {}) {
  const { maxAttempts = 50, pollInterval = 100, initialDelay = 100 } = options;

  // Check if Lucide is already available
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    setTimeout(() => {
      lucide.createIcons(container);
    }, initialDelay);
    return;
  }

  // Poll for Lucide to load
  let attempts = 0;
  const checkLucide = setInterval(() => {
    attempts++;
    if (typeof lucide !== "undefined" && lucide.createIcons) {
      clearInterval(checkLucide);
      lucide.createIcons(container);
    } else if (attempts >= maxAttempts) {
      clearInterval(checkLucide);
      logger.warn(
        "[Lucide Icons] Lucide library not loaded after maximum attempts",
      );
    }
  }, pollInterval);
}

export function createElementWithClass(tag, className, innerHTML = "") {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (innerHTML) {
    // Use setSafeContent for safety instead of direct innerHTML
    setSafeContent(element, innerHTML, true, true);
  }
  return element;
}

/**
 * Safely set HTML content using DOM manipulation instead of innerHTML
 * Prevents XSS attacks by using textContent for plain text or sanitized HTML
 * @param {HTMLElement} element - Element to set content on
 * @param {string|HTMLElement} content - Text content or HTML element
 * @param {boolean} isHTML - Whether content contains HTML (default: false, uses textContent)
 * @param {boolean} sanitize - Whether to sanitize HTML content (default: true)
 * @returns {void}
 */
export function setSafeContent(
  element,
  content,
  isHTML = false,
  sanitize = true,
) {
  if (!element) {
    return;
  }

  // Clear existing content
  element.textContent = "";

  if (isHTML && typeof content === "string") {
    let safeContent = content;

    if (sanitize) {
      // Sanitize HTML content - removes dangerous tags and attributes
      // This uses sanitizeRichText which allows only safe tags: b, i, em, strong, br
      safeContent = sanitizeRichText(content);
    }

    // Create a temporary container and move nodes
    // This approach is safer than direct innerHTML assignment

    // Safe: Using temp container pattern for sanitized content
    const temp = document.createElement("div");
    // eslint-disable-next-line no-restricted-syntax
    temp.innerHTML = safeContent;
    while (temp.firstChild) {
      element.appendChild(temp.firstChild);
    }
  } else if (content instanceof HTMLElement) {
    element.appendChild(content);
  } else {
    // Default: use textContent for safety
    element.textContent = content || "";
  }
}

// ================================================================
// TIME AND DATE UTILITIES
// ================================================================

export function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    return date.toLocaleDateString();
  }
}

export function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString();
}

export function getTimeAgo(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }
  if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  }
  if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  }
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

// ================================================================
// VALIDATION UTILITIES
// ================================================================

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRequired(value, fieldName) {
  if (!value || value.toString().trim() === "") {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateLength(value, minLength, maxLength, fieldName) {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  if (maxLength && value.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters`;
  }
  return null;
}

// ================================================================
// FORM UTILITIES
// ================================================================

export function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) {
    return;
  }

  clearFieldState(fieldId);
  field.classList.add("error");

  const errorDiv = createElementWithClass("div", "field-error", message);
  field.parentNode.appendChild(errorDiv);
}

export function showFieldSuccess(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) {
    return;
  }

  clearFieldState(fieldId);
  field.classList.add("success");
}

export function clearFieldState(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) {
    return;
  }

  field.classList.remove("error", "success");
  const existingError = field.parentNode.querySelector(".field-error");
  if (existingError) {
    existingError.remove();
  }
}

export function getFormData(formId) {
  const form = document.getElementById(formId);
  if (!form) {
    return null;
  }

  const formData = new FormData(form);
  const data = {};
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  return data;
}

// ================================================================
// ARRAY UTILITIES
// ================================================================

export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key];
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
}

// ================================================================
// STRING UTILITIES
// ================================================================

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function kebabCase(str) {
  return str.toLowerCase().replace(/\s+/g, "-");
}

export function truncate(str, length = 50, suffix = "...") {
  if (str.length <= length) {
    return str;
  }
  return str.substring(0, length) + suffix;
}

// ================================================================
// NUMBER UTILITIES
// Enhanced formatting utilities following PLAYER_DATA_DISPLAY_LOGIC.md
// ================================================================

/**
 * Round a number to specified decimal places using banker's rounding
 * Ensures consistent rounding across the application
 *
 * @param {number} value - Number to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded number
 */
export function roundToDecimals(value, decimals = 0) {
  if (decimals === 0) {
    return Math.round(value);
  }

  const factor = Math.pow(10, decimals);
  const multiplied = value * factor;

  // Banker's rounding: round to nearest even
  const rounded = Math.round(multiplied);

  return rounded / factor;
}

/**
 * Format a number with specified decimal places
 * Uses banker's rounding for consistency
 *
 * @param {number|null|undefined} num - Number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @param {boolean} showZero - Whether to show "0" or "N/A" for zero values (default: true)
 * @returns {string} Formatted number string with thousand separators
 *
 * @example
 * formatNumber(1234.567, 2) // "1,234.57"
 * formatNumber(0, 0, false) // "N/A"
 */
export function formatNumber(num, decimals = 0, showZero = true) {
  if (num === null || num === undefined || isNaN(num)) {
    return showZero ? "0" : "N/A";
  }

  if (num === 0 && !showZero) {
    return "N/A";
  }

  // Use banker's rounding for consistency
  const rounded = roundToDecimals(Number(num), decimals);

  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a percentage value
 * Always shows 1 decimal place by default (per PLAYER_DATA_DISPLAY_LOGIC.md)
 *
 * @param {number|null|undefined} num - Percentage as decimal (0-1) or already as percentage (0-100)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @param {boolean} asDecimal - Whether value is already a decimal (0-1) or percentage (0-100) (default: true)
 * @param {boolean} showZero - Whether to show "0.0%" or "N/A" for zero values (default: true)
 * @returns {string} Formatted percentage string
 *
 * @example
 * formatPercentage(0.75) // "75.0%"
 * formatPercentage(75, 1, false) // "75.0%"
 * formatPercentage(0, 1, true, false) // "N/A"
 */
export function formatPercentage(
  num,
  decimals = 1,
  asDecimal = true,
  showZero = true,
) {
  if (num === null || num === undefined || isNaN(num)) {
    return showZero ? "0.0%" : "N/A";
  }

  if (num === 0 && !showZero) {
    return "N/A";
  }

  const percentage = asDecimal ? num * 100 : num;
  const rounded = roundToDecimals(percentage, decimals);

  return `${rounded.toFixed(decimals)}%`;
}

/**
 * Format an average value (yards per attempt, yards per carry, etc.)
 * Always shows 2 decimal places (per PLAYER_DATA_DISPLAY_LOGIC.md)
 *
 * @param {number|null|undefined} value - Average value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {boolean} showZero - Whether to show "0.00" or "N/A" for zero values (default: true)
 * @returns {string} Formatted average string
 *
 * @example
 * formatAverage(12.5) // "12.50"
 * formatAverage(8.456) // "8.46"
 * formatAverage(0, 2, false) // "N/A"
 */
export function formatAverage(value, decimals = 2, showZero = true) {
  if (value === null || value === undefined || isNaN(value)) {
    return showZero ? `0.${"0".repeat(decimals)}` : "N/A";
  }

  if (value === 0 && !showZero) {
    return "N/A";
  }

  const rounded = roundToDecimals(value, decimals);
  return rounded.toFixed(decimals);
}

/**
 * Format a stat value based on its type
 * Automatically applies correct formatting based on stat type
 *
 * @param {number|null|undefined} value - Stat value to format
 * @param {string} statType - Type of stat ('percentage' | 'average' | 'whole')
 * @param {Object} options - Formatting options
 * @param {number} options.decimals - Number of decimal places
 * @param {boolean} options.showZero - Whether to show zero or "N/A"
 * @returns {string} Formatted stat string
 *
 * @example
 * formatStat(75.5, 'percentage') // "75.5%"
 * formatStat(12.5, 'average') // "12.50"
 * formatStat(1234, 'whole') // "1,234"
 */
export function formatStat(value, statType, options = {}) {
  const { decimals, showZero = true } = options;

  switch (statType) {
    case "percentage":
      return formatPercentage(value, decimals, true, showZero);
    case "average":
      return formatAverage(value, decimals, showZero);
    case "whole":
      return formatNumber(value, 0, showZero);
    default:
      return formatNumber(value, 0, showZero);
  }
}

/**
 * Format a completion percentage (specialized for player stats)
 * Always uses 1 decimal place per PLAYER_DATA_DISPLAY_LOGIC.md
 *
 * @param {number} completions - Number of completions
 * @param {number} attempts - Number of attempts
 * @returns {string} Formatted completion percentage
 *
 * @example
 * formatCompletionPercentage(15, 20) // "75.0%"
 * formatCompletionPercentage(0, 0) // "0.0%"
 */
export function formatCompletionPercentage(completions, attempts) {
  if (attempts === 0) {
    return "0.0%";
  }

  const percentage = (completions / attempts) * 100;
  return formatPercentage(percentage / 100, 1, false, true);
}

/**
 * Format a drop rate (specialized for player stats)
 * Always uses 1 decimal place per PLAYER_DATA_DISPLAY_LOGIC.md
 *
 * @param {number} drops - Number of drops
 * @param {number} targets - Number of targets
 * @returns {string} Formatted drop rate percentage
 *
 * @example
 * formatDropRate(2, 15) // "13.3%"
 * formatDropRate(0, 0) // "0.0%"
 */
export function formatDropRate(drops, targets) {
  if (targets === 0) {
    return "0.0%";
  }

  const rate = (drops / targets) * 100;
  return formatPercentage(rate / 100, 1, false, true);
}

/**
 * Format yards per attempt (specialized for player stats)
 * Always uses 2 decimal places per PLAYER_DATA_DISPLAY_LOGIC.md
 *
 * @param {number} yards - Total yards
 * @param {number} attempts - Number of attempts
 * @returns {string} Formatted yards per attempt
 *
 * @example
 * formatYardsPerAttempt(250, 20) // "12.50"
 * formatYardsPerAttempt(0, 0) // "0.00"
 */
export function formatYardsPerAttempt(yards, attempts) {
  if (attempts === 0) {
    return "0.00";
  }

  const avg = yards / attempts;
  return formatAverage(avg, 2, true);
}

/**
 * Format yards per carry (specialized for player stats)
 * Always uses 2 decimal places per PLAYER_DATA_DISPLAY_LOGIC.md
 *
 * @param {number} yards - Total rushing yards
 * @param {number} carries - Number of carries
 * @returns {string} Formatted yards per carry
 *
 * @example
 * formatYardsPerCarry(85, 10) // "8.50"
 * formatYardsPerCarry(0, 0) // "0.00"
 */
export function formatYardsPerCarry(yards, carries) {
  if (carries === 0) {
    return "0.00";
  }

  const avg = yards / carries;
  return formatAverage(avg, 2, true);
}

/**
 * Format flag pull success rate (specialized for player stats)
 * Always uses 1 decimal place per PLAYER_DATA_DISPLAY_LOGIC.md
 *
 * @param {number} pulls - Number of successful flag pulls
 * @param {number} attempts - Number of flag pull attempts
 * @returns {string} Formatted success rate percentage
 *
 * @example
 * formatFlagPullSuccessRate(8, 12) // "66.7%"
 * formatFlagPullSuccessRate(0, 0) // "0.0%"
 */
export function formatFlagPullSuccessRate(pulls, attempts) {
  if (attempts === 0) {
    return "0.0%";
  }

  const rate = (pulls / attempts) * 100;
  return formatPercentage(rate / 100, 1, false, true);
}

export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

// ================================================================
// EVENT UTILITIES
// ================================================================

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

export function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ================================================================
// UI UTILITIES
// ================================================================

export function showLoading(element, text = "Loading...") {
  if (!element) {
    return;
  }
  // Use setSafeContent with sanitization for safety
  const loadingHTML = `<span aria-hidden="true">⏳</span> ${escapeHtml(text)}`;
  setSafeContent(element, loadingHTML, true, true);
  element.disabled = true;
}

export function hideLoading(element, originalText) {
  if (!element) {
    return;
  }
  // Use setSafeContent - originalText should be plain text or sanitized HTML
  setSafeContent(element, originalText, true, true);
  element.disabled = false;
}

export function createModal(title, content, actions = []) {
  const modal = createElementWithClass("div", "modal");

  // Create modal structure using DOM methods instead of innerHTML
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.addEventListener("click", () => closeModal());

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const modalHeader = document.createElement("div");
  modalHeader.className = "modal-header";

  const titleEl = document.createElement("h2");
  titleEl.textContent = title;

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.addEventListener("click", () => closeModal());

  const closeIcon = document.createElement("i");
  closeIcon.setAttribute("data-lucide", "x");
  closeIcon.className = "icon-18";
  closeBtn.appendChild(closeIcon);

  modalHeader.appendChild(titleEl);
  modalHeader.appendChild(closeBtn);

  const modalBody = document.createElement("div");
  modalBody.className = "modal-body";
  // Use setSafeContent for content to prevent XSS
  setSafeContent(modalBody, content, true, true);

  const modalActions = document.createElement("div");
  modalActions.className = "modal-actions";

  // Create action buttons safely using DOM methods
  actions.forEach((action) => {
    const actionBtn = document.createElement("button");
    actionBtn.className = action.class || "";
    actionBtn.textContent = action.text || "";
    if (action.onclick && typeof action.onclick === "function") {
      actionBtn.addEventListener("click", action.onclick);
    }
    modalActions.appendChild(actionBtn);
  });

  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modalContent.appendChild(modalActions);

  overlay.appendChild(modalContent);
  modal.appendChild(overlay);

  document.body.appendChild(modal);
  initializeLucideIcons(modal);
  return modal;
}

export function closeModal() {
  const modal = document.querySelector(".modal");
  if (modal) {
    modal.remove();
  }
}

// Make closeModal globally accessible
window.closeModal = closeModal;

// ================================================================
// ACCESSIBILITY UTILITIES
// ================================================================

export function announceToScreenReader(message, priority = "polite") {
  const announcement = createElementWithClass("div", "sr-only");
  announcement.setAttribute("aria-live", priority);
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    announcement.remove();
  }, 1000);
}

export function focusElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.focus();
  }
}

export function setAriaLabel(elementId, label) {
  const element = document.getElementById(elementId);
  if (element) {
    element.setAttribute("aria-label", label);
  }
}

// ================================================================
// MESSAGE STATUS UTILITIES (for chat features)
// ================================================================

export function getMessageStatusHtml(status) {
  const statusIcons = {
    sent: "check",
    delivered: "check-check",
    read: "check-check",
  };

  const statusClasses = {
    sent: "status-sent",
    delivered: "status-delivered",
    read: "status-read",
  };

  const icon = statusIcons[status] || "check";
  const statusClass = statusClasses[status] || "status-sent";

  return `
    <div class="message-status">
      <i data-lucide="${icon}" class="${statusClass} icon-14"></i>
    </div>
  `;
}

export function getMessageActionsHtml(isOwn) {
  return `
    <div class="message-actions" role="toolbar" aria-label="Message actions">
      <button class="action-btn-mini" aria-label="React to message">
        <i data-lucide="smile" class="icon-14"></i>
      </button>
      <button class="action-btn-mini" aria-label="Reply to message">
        <i data-lucide="reply" class="icon-14"></i>
      </button>
      <button class="action-btn-mini" aria-label="More options">
        <i data-lucide="more-horizontal" class="icon-14"></i>
      </button>
    </div>
  `;
}

// ================================================================
// EXPORT ALL UTILITIES
// ================================================================

export const utils = {
  // DOM
  escapeHtml,
  getInitials,
  scrollToBottom,
  initializeLucideIcons,
  createElementWithClass,

  // Time
  formatTime,
  formatDateTime,
  getTimeAgo,

  // Validation
  validateEmail,
  validateRequired,
  validateLength,

  // Forms
  showFieldError,
  showFieldSuccess,
  clearFieldState,
  getFormData,

  // Arrays
  shuffleArray,
  getRandomItem,
  groupBy,

  // Strings
  capitalize,
  kebabCase,
  truncate,

  // Numbers
  roundToDecimals,
  formatNumber,
  formatPercentage,
  formatAverage,
  formatStat,
  formatCompletionPercentage,
  formatDropRate,
  formatYardsPerAttempt,
  formatYardsPerCarry,
  formatFlagPullSuccessRate,
  clamp,

  // Events
  debounce,
  throttle,

  // UI
  showLoading,
  hideLoading,
  createModal,
  closeModal,

  // Accessibility
  announceToScreenReader,
  focusElement,
  setAriaLabel,

  // Messages
  getMessageStatusHtml,
  getMessageActionsHtml,
};
