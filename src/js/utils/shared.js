// Shared Utilities Module - FlagFit Pro
// Common functions used across multiple page modules

import { escapeHtml } from "./sanitize.js";

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

/**
 * Safely set content on an element to prevent XSS attacks
 * @param {HTMLElement} element - The element to set content on
 * @param {string} content - The content to set
 * @param {boolean} isHTML - Whether content should be treated as HTML (default: false)
 * @param {boolean} allowRichText - Whether to allow rich text formatting (default: false)
 */
export function setSafeContent(element, content, isHTML = false, allowRichText = false) {
  if (!element) {return;}

  // Clear existing content
  element.textContent = '';

  if (content === null || content === undefined) {return;}

  if (isHTML && allowRichText) {
    // For trusted HTML content (e.g., from local config, NOT user input)
    // We still sanitize to be safe
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    // Only allow specific safe tags and attributes
    const allowedTags = ['b', 'i', 'em', 'strong', 'br', 'p', 'span', 'div', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const allowedAttrs = ['style', 'class', 'id']; // Be careful with style

    const sanitize = (node) => {
      const sanitizedNode = node.cloneNode(false);
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        if (!allowedTags.includes(tag)) {
          return document.createTextNode(node.textContent);
        }
        
        // Sanitize attributes
        if (sanitizedNode.attributes) {
          Array.from(sanitizedNode.attributes).forEach(attr => {
            if (!allowedAttrs.includes(attr.name.toLowerCase())) {
              sanitizedNode.removeAttribute(attr.name);
            }
          });
        }
      }
      
      Array.from(node.childNodes).forEach(child => {
        sanitizedNode.appendChild(sanitize(child));
      });
      
      return sanitizedNode;
    };

    const sanitizedBody = sanitize(doc.body);
    Array.from(sanitizedBody.childNodes).forEach(child => {
      element.appendChild(child.cloneNode(true));
    });
  } else if (isHTML) {
    // Treat as plain text even if isHTML is true, unless allowRichText is also true
    element.textContent = content;
  } else {
    // Plain text - safest option
    element.textContent = content;
  }
}

export function createElementWithClass(tag, className, content = "") {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (content) {
    // Use setSafeContent instead of innerHTML
    setSafeContent(element, content, false);
  }
  return element;
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
// LOCAL STORAGE UTILITIES
// ================================================================
// NOTE: Storage functions have been moved to storage-service-unified.js
// These are kept for backward compatibility but will be deprecated
// Import from '../services/storage-service-unified.js' instead

import { storageService } from "../services/storage-service-unified.js";

import { logger } from "../../logger.js";

/**
 * @deprecated Use storageService.set() from storage-service-unified.js instead
 */
export function saveToStorage(key, data) {
  return storageService.set(key, data, { usePrefix: false });
}

/**
 * @deprecated Use storageService.get() from storage-service-unified.js instead
 */
export function getFromStorage(key, defaultValue = null) {
  return storageService.get(key, defaultValue, { usePrefix: false });
}

/**
 * @deprecated Use storageService.remove() from storage-service-unified.js instead
 */
export function removeFromStorage(key) {
  return storageService.remove(key, { usePrefix: false });
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
// ================================================================

export function formatNumber(num, decimals = 0) {
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercentage(num, decimals = 1) {
  return `${(num * 100).toFixed(decimals)}%`;
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
  // Clear and build safely
  element.textContent = '';
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '⏳';
  element.appendChild(icon);
  element.appendChild(document.createTextNode(' ' + text));
  element.disabled = true;
}

export function hideLoading(element, originalText) {
  if (!element) {
    return;
  }
  element.textContent = originalText;
  element.disabled = false;
}

export function createModal(title, content, actions = []) {
  const modal = createElementWithClass("div", "modal");

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = () => window.closeModal?.();

  // Create modal content container
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';

  // Create header
  const header = document.createElement('div');
  header.className = 'modal-header';
  const h2 = document.createElement('h2');
  h2.textContent = title;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.onclick = () => window.closeModal?.();
  const closeIcon = document.createElement('i');
  closeIcon.setAttribute('data-lucide', 'x');
  closeIcon.className = 'icon-18';
  closeBtn.appendChild(closeIcon);
  header.appendChild(h2);
  header.appendChild(closeBtn);

  // Create body
  const body = document.createElement('div');
  body.className = 'modal-body';
  setSafeContent(body, content, false);

  // Create actions
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'modal-actions';
  actions.forEach(action => {
    const btn = document.createElement('button');
    btn.className = action.class;
    btn.textContent = action.text;
    btn.onclick = () => {
      if (typeof action.onclick === 'function') {
        action.onclick();
      }
    };
    actionsDiv.appendChild(btn);
  });

  // Assemble
  modalContent.appendChild(header);
  modalContent.appendChild(body);
  modalContent.appendChild(actionsDiv);
  modal.appendChild(overlay);
  modal.appendChild(modalContent);

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

export function getMessageActionsHtml(_isOwn) {
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

  // Storage
  saveToStorage,
  getFromStorage,
  removeFromStorage,

  // Arrays
  shuffleArray,
  getRandomItem,
  groupBy,

  // Strings
  capitalize,
  kebabCase,
  truncate,

  // Numbers
  formatNumber,
  formatPercentage,
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
