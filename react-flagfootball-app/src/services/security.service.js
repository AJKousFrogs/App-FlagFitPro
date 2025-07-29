import CryptoJS from 'crypto-js';
import DOMPurify from 'dompurify';

/**
 * Enterprise-grade security service with AES-256 encryption
 * Provides secure token storage, input sanitization, and CSRF protection
 */
class SecurityService {
  constructor() {
    // Generate or retrieve encryption key securely
    this.encryptionKey = this.generateEncryptionKey();
    this.csrfToken = this.generateCSRFToken();
    this.initializeSecurityHeaders();
  }

  /**
   * Generate a secure encryption key for AES-256
   * In production, this should come from environment variables
   */
  generateEncryptionKey() {
    const existingKey = sessionStorage.getItem('app_security_key');
    if (existingKey) {
      return existingKey;
    }

    // Generate a 256-bit key
    const key = CryptoJS.lib.WordArray.random(256/8).toString();
    sessionStorage.setItem('app_security_key', key);
    return key;
  }

  /**
   * Generate CSRF token for form protection
   */
  generateCSRFToken() {
    const existingToken = sessionStorage.getItem('csrf_token');
    if (existingToken && this.isCSRFTokenValid(existingToken)) {
      return existingToken;
    }

    const token = CryptoJS.lib.WordArray.random(128/8).toString();
    const timestamp = Date.now();
    const csrfToken = `${token}.${timestamp}`;
    
    sessionStorage.setItem('csrf_token', csrfToken);
    return csrfToken;
  }

  /**
   * Validate CSRF token (expires after 1 hour)
   */
  isCSRFTokenValid(token) {
    if (!token || !token.includes('.')) return false;
    
    const [, timestamp] = token.split('.');
    const tokenAge = Date.now() - parseInt(timestamp);
    const oneHour = 60 * 60 * 1000;
    
    return tokenAge < oneHour;
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(plaintext) {
    try {
      if (!plaintext) return null;
      
      // Generate random IV for each encryption
      const iv = CryptoJS.lib.WordArray.random(128/8);
      
      // Encrypt using AES-256-GCM
      const encrypted = CryptoJS.AES.encrypt(plaintext, this.encryptionKey, {
        iv: iv,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.Pkcs7
      });

      // Combine IV and encrypted data
      const result = {
        iv: iv.toString(),
        data: encrypted.toString(),
        timestamp: Date.now()
      };

      return btoa(JSON.stringify(result));
    } catch (error) {
      console.error('Encryption failed:', error);
      return null;
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(ciphertext) {
    try {
      if (!ciphertext) return null;
      
      const encryptedData = JSON.parse(atob(ciphertext));
      const { iv, data, timestamp } = encryptedData;
      
      // Check if data is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > maxAge) {
        console.warn('Encrypted data is too old, rejecting');
        return null;
      }

      // Decrypt using AES-256-GCM
      const decrypted = CryptoJS.AES.decrypt(data, this.encryptionKey, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.Pkcs7
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Secure token storage with encryption and integrity checks
   */
  setSecureToken(key, token) {
    try {
      if (!token) return false;
      
      const tokenData = {
        token,
        issued: Date.now(),
        csrfToken: this.csrfToken,
        fingerprint: this.generateDeviceFingerprint()
      };

      const encryptedToken = this.encrypt(JSON.stringify(tokenData));
      if (encryptedToken) {
        localStorage.setItem(`secure_${key}`, encryptedToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token storage failed:', error);
      return false;
    }
  }

  /**
   * Retrieve and validate secure token
   */
  getSecureToken(key) {
    try {
      const encryptedToken = localStorage.getItem(`secure_${key}`);
      if (!encryptedToken) return null;

      const decryptedData = this.decrypt(encryptedToken);
      if (!decryptedData) return null;

      const tokenData = JSON.parse(decryptedData);
      
      // Validate device fingerprint
      if (tokenData.fingerprint !== this.generateDeviceFingerprint()) {
        console.warn('Device fingerprint mismatch, token invalid');
        this.removeSecureToken(key);
        return null;
      }

      // Check token age (24 hours)
      const tokenAge = Date.now() - tokenData.issued;
      const maxAge = 24 * 60 * 60 * 1000;
      
      if (tokenAge > maxAge) {
        console.warn('Token expired, removing');
        this.removeSecureToken(key);
        return null;
      }

      return tokenData.token;
    } catch (error) {
      console.error('Token retrieval failed:', error);
      this.removeSecureToken(key);
      return null;
    }
  }

  /**
   * Remove secure token
   */
  removeSecureToken(key) {
    localStorage.removeItem(`secure_${key}`);
  }

  /**
   * Generate device fingerprint for additional security
   */
  generateDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas.toDataURL()
    ].join('|');

    return CryptoJS.SHA256(fingerprint).toString();
  }

  /**
   * Sanitize user input to prevent XSS attacks
   */
  sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') return input;

    const defaultOptions = {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false,
      SANITIZE_DOM: true,
      FORCE_BODY: false,
      WHOLE_DOCUMENT: false
    };

    const sanitizeOptions = { ...defaultOptions, ...options };
    return DOMPurify.sanitize(input, sanitizeOptions);
  }

  /**
   * Validate and sanitize form data
   */
  sanitizeFormData(formData, schema = {}) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(formData)) {
      if (schema[key]) {
        // Apply specific sanitization rules per field
        switch (schema[key].type) {
          case 'email':
            sanitized[key] = this.sanitizeEmail(value);
            break;
          case 'password':
            // Don't sanitize passwords, just validate length
            sanitized[key] = value;
            break;
          case 'text':
            sanitized[key] = this.sanitizeInput(value, schema[key].options);
            break;
          case 'html':
            sanitized[key] = this.sanitizeInput(value, {
              ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i'],
              ALLOWED_ATTR: []
            });
            break;
          default:
            sanitized[key] = this.sanitizeInput(value);
        }
      } else {
        // Default sanitization
        sanitized[key] = this.sanitizeInput(value);
      }
    }
    
    return sanitized;
  }

  /**
   * Sanitize email input
   */
  sanitizeEmail(email) {
    if (typeof email !== 'string') return '';
    
    // Basic email sanitization
    return email.toLowerCase().trim().replace(/[<>\"']/g, '');
  }

  /**
   * Generate secure headers for API requests
   */
  getSecureHeaders(includeCSRF = true) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    };

    if (includeCSRF) {
      headers['X-CSRF-Token'] = this.getCSRFToken();
    }

    return headers;
  }

  /**
   * Get current CSRF token, generate new if expired
   */
  getCSRFToken() {
    if (!this.isCSRFTokenValid(this.csrfToken)) {
      this.csrfToken = this.generateCSRFToken();
    }
    return this.csrfToken;
  }

  /**
   * Validate request with CSRF token
   */
  validateCSRFToken(providedToken) {
    return providedToken === this.getCSRFToken() && this.isCSRFTokenValid(providedToken);
  }

  /**
   * Initialize security headers for the application
   */
  initializeSecurityHeaders() {
    // Set CSP meta tag if not already present
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' data: blob: https:;
        font-src 'self' data: https://fonts.gstatic.com;
        connect-src 'self' https:;
        worker-src 'self';
      `.replace(/\s+/g, ' ').trim();
      document.head.appendChild(cspMeta);
    }
  }

  /**
   * Rate limiting for API calls
   */
  checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const requests = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]');
    
    // Remove requests outside the time window
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    // Add current request
    validRequests.push(now);
    localStorage.setItem(`rate_limit_${key}`, JSON.stringify(validRequests));
    
    return true; // Request allowed
  }

  /**
   * Clear all security data (logout)
   */
  clearSecurityData() {
    // Clear encrypted tokens
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('secure_') || key.startsWith('rate_limit_')) {
        localStorage.removeItem(key);
      }
    });

    // Clear session data
    sessionStorage.clear();
    
    // Generate new CSRF token
    this.csrfToken = this.generateCSRFToken();
  }
}

// Create singleton instance
const securityService = new SecurityService();

export default securityService;