/* ====== SHARED UTILITIES - FLAGFIT PRO ====== */

/**
 * ========================================
 * ERROR HANDLING UTILITIES
 * ========================================
 */

export const handleApiError = (error, context = 'API call') => {
  console.error(`Error in ${context}:`, error);
  
  // Standard error structure
  const standardError = {
    message: error.message || 'An unexpected error occurred',
    status: error.status || 500,
    context,
    timestamp: new Date().toISOString()
  };
  
  // Log to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to logging service
  }
  
  return standardError;
};

export const createErrorHandler = (defaultMessage = 'Something went wrong') => {
  return (error) => {
    console.error('Caught error:', error);
    return {
      error: true,
      message: error.message || defaultMessage,
      details: error
    };
  };
};

/**
 * ========================================
 * API UTILITIES
 * ========================================
 */

export const createApiHeaders = (token, contentType = 'application/json') => {
  const headers = {
    'Content-Type': contentType
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

export const fetchWithErrorHandling = async (url, options = {}, context = 'API request') => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    throw handleApiError(error, context);
  }
};

export const buildQueryString = (params) => {
  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
    
  return filtered ? `?${filtered}` : '';
};

/**
 * ========================================
 * FORMATTING UTILITIES
 * ========================================
 */

export const formatTime = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return `${hours}h ${minutes}m ${remainingSeconds}s`;
};

export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatNumber = (number, decimals = 0) => {
  return Number(number).toFixed(decimals);
};

export const formatPercentage = (value, total, decimals = 1) => {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(decimals)}%`;
};

export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * ========================================
 * DOM UTILITIES
 * ========================================
 */

export const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const unescapeHtml = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

export const getInitials = (name) => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

export const scrollToElement = (elementId, offset = 0) => {
  const element = document.getElementById(elementId);
  if (element) {
    const top = element.offsetTop - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
};

export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * ========================================
 * VALIDATION UTILITIES
 * ========================================
 */

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const validateRequired = (value, fieldName = 'Field') => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateLength = (value, min = 0, max = Infinity, fieldName = 'Field') => {
  const length = String(value).length;
  if (length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  if (length > max) {
    return `${fieldName} must be no more than ${max} characters`;
  }
  return null;
};

/**
 * ========================================
 * ARRAY AND OBJECT UTILITIES
 * ========================================
 */

export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = typeof key === 'function' ? key(item) : item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

export const uniqueBy = (array, key) => {
  const seen = new Set();
  return array.filter(item => {
    const value = typeof key === 'function' ? key(item) : item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

export const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

export const omit = (object, keys) => {
  const keysArray = Array.isArray(keys) ? keys : [keys];
  const result = {};
  
  for (const key in object) {
    if (object.hasOwnProperty(key) && !keysArray.includes(key)) {
      result[key] = object[key];
    }
  }
  
  return result;
};

export const pick = (object, keys) => {
  const keysArray = Array.isArray(keys) ? keys : [keys];
  const result = {};
  
  keysArray.forEach(key => {
    if (object.hasOwnProperty(key)) {
      result[key] = object[key];
    }
  });
  
  return result;
};

/**
 * ========================================
 * DEBOUNCING AND THROTTLING
 * ========================================
 */

export const debounce = (func, wait, immediate = false) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(this, args);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * ========================================
 * LOCAL STORAGE UTILITIES
 * ========================================
 */

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage for key "${key}":`, error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage for key "${key}":`, error);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage for key "${key}":`, error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

/**
 * ========================================
 * RANDOM UTILITIES
 * ========================================
 */

export const generateId = (prefix = 'id') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const randomBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * ========================================
 * PERFORMANCE UTILITIES
 * ========================================
 */

export const measure = (name, fn) => {
  return (...args) => {
    const start = performance.now();
    const result = fn.apply(this, args);
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  };
};

export const memoize = (fn) => {
  const cache = new Map();
  
  return (...args) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

/**
 * ========================================
 * SPORTS-SPECIFIC UTILITIES
 * ========================================
 */

export const calculateBMI = (weightKg, heightCm) => {
  const heightM = heightCm / 100;
  return (weightKg / (heightM * heightM)).toFixed(1);
};

export const formatGameTime = (minutes, seconds = 0) => {
  const totalSeconds = (minutes * 60) + seconds;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const getPositionAbbreviation = (position) => {
  const abbreviations = {
    'quarterback': 'QB',
    'wide receiver': 'WR',
    'running back': 'RB',
    'tight end': 'TE',
    'offensive line': 'OL',
    'defensive line': 'DL',
    'linebacker': 'LB',
    'defensive back': 'DB',
    'safety': 'S',
    'cornerback': 'CB',
    'kicker': 'K',
    'punter': 'P'
  };
  
  return abbreviations[position.toLowerCase()] || position.toUpperCase().slice(0, 2);
};

/**
 * ========================================
 * CONSTANTS
 * ========================================
 */

export const CONSTANTS = {
  API_TIMEOUT: 10000, // 10 seconds
  DEBOUNCE_DELAY: 300, // 300ms
  THROTTLE_DELAY: 500, // 500ms
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/
};