// Shared Utilities Module - FlagFit Pro
// Common functions used across multiple page modules

import { logger } from "../../logger.js";
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
      console.warn(
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
    element.innerHTML = innerHTML;
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
  element.innerHTML = `<span aria-hidden="true">⏳</span> ${text}`;
  element.disabled = true;
}

export function hideLoading(element, originalText) {
  if (!element) {
    return;
  }
  element.innerHTML = originalText;
  element.disabled = false;
}

export function createModal(title, content, actions = []) {
  const modal = createElementWithClass("div", "modal");
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal()"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close" onclick="closeModal()" aria-label="Close">
          <i data-lucide="x" class="icon-18"></i>
        </button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      <div class="modal-actions">
        ${actions
          .map(
            (action) => `
          <button class="${action.class}" onclick="${action.onclick}">
            ${action.text}
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

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
