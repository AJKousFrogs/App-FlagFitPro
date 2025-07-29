import securityService from './security.service.js';

class AuthService {
  constructor() {
    // Use demo mode for development
    this.baseUrl = import.meta.env.VITE_API_URL || '/api/auth';
    this.tokenKey = 'flagfit-auth-token';
    this.demoMode = import.meta.env.VITE_DEMO_MODE !== 'false';
  }

  // Get stored token (with AES-256 decryption)
  getToken() {
    try {
      return securityService.getSecureToken(this.tokenKey);
    } catch (error) {
      console.error('Error getting token:', error);
      this.removeToken();
      return null;
    }
  }

  // Set token in storage (with AES-256 encryption)
  setToken(token) {
    try {
      if (!token) return false;
      return securityService.setSecureToken(this.tokenKey, token);
    } catch (error) {
      console.error('Error setting token:', error);
      return false;
    }
  }

  // Remove token from storage
  removeToken() {
    securityService.removeSecureToken(this.tokenKey);
  }

  // Check if token is expired (handled by security service)
  isTokenExpired() {
    const token = this.getToken();
    return !token; // Security service handles expiration
  }

  // Login user with advanced security validation
  async login(credentials, signal) {
    try {
      // Rate limiting check
      if (!securityService.checkRateLimit('login', 5, 300000)) { // 5 attempts per 5 minutes
        throw new Error('Too many login attempts. Please try again later.');
      }

      // Input validation and sanitization
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }
      
      // Sanitize inputs
      const sanitizedCredentials = securityService.sanitizeFormData(credentials, {
        email: { type: 'email' },
        password: { type: 'password' }
      });
      
      if (!this.isValidEmail(sanitizedCredentials.email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (sanitizedCredentials.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Demo mode - simulate login
      if (this.demoMode) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const demoUser = {
          id: '1',
          email: credentials.email,
          name: credentials.email.split('@')[0],
          role: 'player',
          position: 'QB',
          team: 'Demo Team'
        };
        
        const demoToken = 'demo-token-' + Date.now();
        this.setToken(demoToken);
        
        return {
          user: demoUser,
          token: demoToken
        };
      }

      // Production mode - real API call with security headers
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          ...securityService.getSecureHeaders(true), // Include CSRF protection
        },
        body: JSON.stringify(sanitizedCredentials),
        signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store token securely
      if (data.token) {
        this.setToken(data.token);
      }

      return {
        user: data.user,
        token: data.token
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      console.error('Login error:', error);
      throw error;
    }
  }

  // Email validation helper
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Register user with enterprise-grade security validation
  async register(userData, signal) {
    try {
      // Rate limiting check
      if (!securityService.checkRateLimit('register', 3, 600000)) { // 3 attempts per 10 minutes
        throw new Error('Too many registration attempts. Please try again later.');
      }

      // Input validation and sanitization
      if (!userData.email || !userData.password || !userData.confirmPassword) {
        throw new Error('All fields are required');
      }
      
      // Sanitize all user inputs
      const sanitizedData = securityService.sanitizeFormData(userData, {
        email: { type: 'email' },
        password: { type: 'password' },
        confirmPassword: { type: 'password' },
        name: { type: 'text' },
        team: { type: 'text' },
        position: { type: 'text' }
      });
      
      if (!this.isValidEmail(sanitizedData.email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (sanitizedData.password !== sanitizedData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      if (sanitizedData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      if (!this.isStrongPassword(sanitizedData.password)) {
        throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      }
      
      // Additional security validations
      if (this.isCommonPassword(sanitizedData.password)) {
        throw new Error('Password is too common. Please choose a more secure password.');
      }

      // Demo mode - simulate registration
      if (this.demoMode) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const demoUser = {
          id: Date.now().toString(),
          email: userData.email,
          name: userData.name || userData.email.split('@')[0],
          role: userData.role || 'player',
          position: userData.position || 'QB',
          team: userData.team || 'Demo Team'
        };
        
        const demoToken = 'demo-token-' + Date.now();
        this.setToken(demoToken);
        
        return {
          user: demoUser,
          token: demoToken
        };
      }

      // Production mode - real API call with security headers
      const { confirmPassword, ...registrationData } = sanitizedData;
      
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          ...securityService.getSecureHeaders(true), // Include CSRF protection
        },
        body: JSON.stringify(registrationData),
        signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      
      // Store token securely
      if (data.token) {
        this.setToken(data.token);
      }

      return {
        user: data.user,
        token: data.token
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Enhanced password strength validation
  isStrongPassword(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const minLength = password.length >= 8;
    const maxLength = password.length <= 128;
    
    return hasUpperCase && hasLowerCase && hasNumbers && minLength && maxLength;
  }

  // Check against common passwords
  isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      'dragon', 'shadow', 'master', 'superman', 'michael'
    ];
    
    const lowerPassword = password.toLowerCase();
    return commonPasswords.some(common => 
      lowerPassword.includes(common) || common.includes(lowerPassword)
    );
  }

  // Calculate password strength score (0-100)
  getPasswordStrength(password) {
    let score = 0;
    
    // Length bonus
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 10;
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;
    
    // Pattern penalties
    if (/^\d+$/.test(password)) score -= 20; // All numbers
    if (/^[a-zA-Z]+$/.test(password)) score -= 10; // All letters
    if (this.isCommonPassword(password)) score -= 30;
    
    return Math.max(0, Math.min(100, score));
  }

  // Logout user with complete security cleanup
  async logout() {
    try {
      const token = this.getToken();
      
      if (token) {
        // Call logout endpoint with security headers
        await fetch(`${this.baseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            ...securityService.getSecureHeaders(true)
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if server call fails
    } finally {
      // Always clear all security data
      securityService.clearSecurityData();
      this.removeToken();
    }
  }

  // Get current user with enhanced security validation
  async getCurrentUser(signal) {
    try {
      const token = this.getToken();
      
      if (!token) {
        return null;
      }

      // Demo mode - return demo user
      if (this.demoMode) {
        return {
          id: '1',
          email: 'demo@flagfit.com',
          name: 'Demo User',
          role: 'player',
          position: 'QB',
          team: 'Demo Team'
        };
      }

      // Production mode - real API call with security headers
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...securityService.getSecureHeaders(false) // No CSRF needed for GET requests
        },
        signal
      });

      if (!response.ok) {
        // Token might be invalid, clear it
        this.removeToken();
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      if (error.name === 'AbortError') {
        return null;
      }
      console.error('Get current user error:', error);
      // Clear token on error
      this.removeToken();
      return null;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const token = this.getToken();
      
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profile update failed');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Check if user is authenticated with security validation
  isAuthenticated() {
    const token = this.getToken();
    return !!token; // Security service handles all validation
  }

  // Get CSRF token for forms
  getCSRFToken() {
    return securityService.getCSRFToken();
  }

  // Validate CSRF token
  validateCSRFToken(token) {
    return securityService.validateCSRFToken(token);
  }

  // Refresh token
  async refreshToken() {
    try {
      const token = this.getToken();
      
      if (!token) {
        throw new Error('No token to refresh');
      }

      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.token) {
        this.setToken(data.token);
      }

      return data.token;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.removeToken();
      throw error;
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export { authService }; 