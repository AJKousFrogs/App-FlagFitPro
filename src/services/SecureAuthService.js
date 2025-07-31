// SecureAuthService.js - Production-ready secure authentication service
// Addresses security vulnerabilities identified in code review

import DOMPurify from 'dompurify';

class SecureAuthService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    this.csrfToken = null;
    this.sessionTimeout = 15 * 60 * 1000; // 15 minutes
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.loginAttempts = new Map(); // For rate limiting
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes lockout
    
    // Initialize CSRF token on service creation
    this.initializeCSRF();
    
    // Set up session timeout monitoring
    this.setupSessionMonitoring();
  }

  // Initialize CSRF token
  async initializeCSRF() {
    try {
      const response = await fetch(`${this.baseURL}/auth/csrf`, {
        method: 'GET',
        credentials: 'include', // Include cookies for httpOnly
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrfToken;
      }
    } catch (error) {
      console.error('Failed to initialize CSRF token:', error);
    }
  }

  // Rate limiting check
  checkRateLimit(identifier) {
    const now = Date.now();
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: 0, lockedUntil: 0 };
    
    // Check if user is locked out
    if (attempts.lockedUntil > now) {
      const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
      throw new Error(`Account temporarily locked. Try again in ${remainingTime} minutes.`);
    }
    
    // Reset attempts if enough time has passed
    if (now - attempts.lastAttempt > this.lockoutDuration) {
      attempts.count = 0;
    }
    
    // Check if max attempts exceeded
    if (attempts.count >= this.maxLoginAttempts) {
      attempts.lockedUntil = now + this.lockoutDuration;
      this.loginAttempts.set(identifier, attempts);
      throw new Error('Too many login attempts. Account temporarily locked.');
    }
    
    return true;
  }

  // Record failed login attempt
  recordFailedAttempt(identifier) {
    const now = Date.now();
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: 0, lockedUntil: 0 };
    attempts.count += 1;
    attempts.lastAttempt = now;
    this.loginAttempts.set(identifier, attempts);
  }

  // Clear failed attempts on successful login
  clearFailedAttempts(identifier) {
    this.loginAttempts.delete(identifier);
  }

  // Input sanitization
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return DOMPurify.sanitize(input.trim());
  }

  // Password strength validation
  validatePassword(password) {
    const errors = [];
    
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Check for common weak passwords
    const commonPasswords = [
      'password123', '123456789', 'qwerty123', 'admin123',
      'welcome123', 'password1', 'letmein123'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more unique password');
    }
    
    // Check for sequential characters
    if (/123456|abcdef|qwerty/i.test(password)) {
      errors.push('Password cannot contain sequential characters');
    }
    
    return errors;
  }

  // Email validation with proper regex
  validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!email || !emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    
    if (email.length > 254) {
      return 'Email address is too long';
    }
    
    return null;
  }

  // Secure API request with retry logic
  async secureRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      credentials: 'include', // Always include cookies
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // CSRF protection
        ...(this.csrfToken && { 'X-CSRF-Token': this.csrfToken }),
        ...options.headers
      },
      ...options
    };

    let lastError;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, defaultOptions);
        
        // Handle CSRF token refresh
        if (response.status === 403 && response.headers.get('X-CSRF-Token-Expired')) {
          await this.initializeCSRF();
          defaultOptions.headers['X-CSRF-Token'] = this.csrfToken;
          continue; // Retry with new token
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        lastError = error;
        
        if (attempt < this.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
        }
      }
    }
    
    throw lastError;
  }

  // Secure login with comprehensive validation
  async login(credentials) {
    try {
      // Sanitize inputs
      const email = this.sanitizeInput(credentials.email);
      const password = credentials.password; // Don't sanitize password to preserve special chars
      
      // Validate inputs
      const emailError = this.validateEmail(email);
      if (emailError) {
        throw new Error(emailError);
      }
      
      if (!password) {
        throw new Error('Password is required');
      }
      
      // Check rate limiting
      this.checkRateLimit(email);
      
      // Make secure API request
      const response = await this.secureRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      // Clear failed attempts on successful login
      this.clearFailedAttempts(email);
      
      // Set up session monitoring
      this.startSessionTimer();
      
      // Store user data (not sensitive tokens)
      if (data.user) {
        sessionStorage.setItem('user', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          permissions: data.user.permissions || []
        }));
      }
      
      return {
        success: true,
        user: data.user,
        message: 'Login successful'
      };
      
    } catch (error) {
      // Record failed attempt
      if (credentials.email) {
        this.recordFailedAttempt(this.sanitizeInput(credentials.email));
      }
      
      throw error;
    }
  }

  // Secure registration with validation
  async register(userData) {
    try {
      // Sanitize all inputs
      const sanitizedData = {
        fullName: this.sanitizeInput(userData.fullName),
        email: this.sanitizeInput(userData.email),
        password: userData.password, // Don't sanitize password
        confirmPassword: userData.confirmPassword
      };
      
      // Validate email
      const emailError = this.validateEmail(sanitizedData.email);
      if (emailError) {
        throw new Error(emailError);
      }
      
      // Validate password
      const passwordErrors = this.validatePassword(sanitizedData.password);
      if (passwordErrors.length > 0) {
        throw new Error(passwordErrors.join(', '));
      }
      
      // Confirm password match
      if (sanitizedData.password !== sanitizedData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Validate full name
      if (!sanitizedData.fullName || sanitizedData.fullName.length < 2) {
        throw new Error('Full name must be at least 2 characters long');
      }
      
      if (sanitizedData.fullName.length > 100) {
        throw new Error('Full name is too long');
      }
      
      // Make secure API request
      const response = await this.secureRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName: sanitizedData.fullName.split(' ')[0] || sanitizedData.fullName,
          lastName: sanitizedData.fullName.split(' ').slice(1).join(' ') || '',
          username: sanitizedData.email.split('@')[0],
          email: sanitizedData.email,
          password: sanitizedData.password
        })
      });
      
      const data = await response.json();
      
      return {
        success: true,
        user: data.user,
        message: 'Registration successful. Please check your email for verification.'
      };
      
    } catch (error) {
      throw error;
    }
  }

  // Secure logout
  async logout() {
    try {
      // Clear session storage
      sessionStorage.clear();
      
      // Clear session timer
      this.clearSessionTimer();
      
      // Notify server to invalidate session
      await this.secureRequest('/auth/logout', {
        method: 'POST'
      });
      
      // Clear CSRF token
      this.csrfToken = null;
      
      return { success: true, message: 'Logout successful' };
      
    } catch (error) {
      // Even if server request fails, clear local data
      sessionStorage.clear();
      this.clearSessionTimer();
      this.csrfToken = null;
      
      return { success: true, message: 'Logout completed' };
    }
  }

  // Check authentication status
  async checkAuth() {
    try {
      const response = await this.secureRequest('/auth/me', {
        method: 'GET'
      });
      
      const data = await response.json();
      
      // Update stored user data
      if (data.user) {
        sessionStorage.setItem('user', JSON.stringify(data.user));
        this.startSessionTimer(); // Refresh session timer
      }
      
      return {
        isAuthenticated: true,
        user: data.user
      };
      
    } catch (error) {
      // Clear invalid session
      sessionStorage.clear();
      this.clearSessionTimer();
      
      return {
        isAuthenticated: false,
        user: null
      };
    }
  }

  // Get current user from session storage
  getCurrentUser() {
    try {
      const userData = sessionStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  // Session timeout management
  setupSessionMonitoring() {
    this.sessionTimer = null;
    this.warningTimer = null;
    
    // Listen for user activity
    const resetSessionTimer = () => {
      if (this.getCurrentUser()) {
        this.startSessionTimer();
      }
    };
    
    // Reset timer on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetSessionTimer, { passive: true });
    });
  }

  startSessionTimer() {
    this.clearSessionTimer();
    
    // Warning 5 minutes before timeout
    this.warningTimer = setTimeout(() => {
      this.showSessionWarning();
    }, this.sessionTimeout - 5 * 60 * 1000);
    
    // Auto logout after timeout
    this.sessionTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.sessionTimeout);
  }

  clearSessionTimer() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  showSessionWarning() {
    // Emit custom event for session warning
    window.dispatchEvent(new CustomEvent('sessionWarning', {
      detail: { remainingTime: 5 * 60 }
    }));
  }

  handleSessionTimeout() {
    // Emit custom event for session timeout
    window.dispatchEvent(new CustomEvent('sessionTimeout'));
    
    // Force logout
    this.logout();
  }

  // Password reset
  async requestPasswordReset(email) {
    try {
      const sanitizedEmail = this.sanitizeInput(email);
      const emailError = this.validateEmail(sanitizedEmail);
      
      if (emailError) {
        throw new Error(emailError);
      }
      
      const response = await this.secureRequest('/auth/password-reset', {
        method: 'POST',
        body: JSON.stringify({ email: sanitizedEmail })
      });
      
      return {
        success: true,
        message: 'Password reset instructions sent to your email'
      };
      
    } catch (error) {
      throw error;
    }
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      const passwordErrors = this.validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        throw new Error(passwordErrors.join(', '));
      }
      
      const response = await this.secureRequest('/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({ token, password: newPassword })
      });
      
      return {
        success: true,
        message: 'Password reset successful'
      };
      
    } catch (error) {
      throw error;
    }
  }

  // Change password (authenticated user)
  async changePassword(currentPassword, newPassword) {
    try {
      const passwordErrors = this.validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        throw new Error(passwordErrors.join(', '));
      }
      
      if (currentPassword === newPassword) {
        throw new Error('New password must be different from current password');
      }
      
      const response = await this.secureRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        })
      });
      
      return {
        success: true,
        message: 'Password changed successfully'
      };
      
    } catch (error) {
      throw error;
    }
  }
}

// Create singleton instance
const secureAuthService = new SecureAuthService();

export default secureAuthService;