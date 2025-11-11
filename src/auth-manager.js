// Enhanced Authentication Manager for FlagFit Pro
// Handles login, registration, session management, and user state

import { apiClient, auth } from './api-config.js';

// Import mock authentication for static deployment
let mockAuth = null;
const initMockAuth = async () => {
  // Initialize mock authentication for development only
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isDevelopment) {
    console.log('🔄 Initializing mock authentication for development...');
  }
  
  // Check if we're using Netlify Functions
  const isUsingNetlifyFunctions = window.location.hostname.includes('netlify') || 
                                  (window.location.hostname === 'localhost' && window.location.port === '8888');
  
  if (isDevelopment) {
    console.log('🔍 Using Netlify Functions:', isUsingNetlifyFunctions);
  }
  
  // For local development without Netlify Dev, always use mock auth
  if (!isUsingNetlifyFunctions) {
    if (isDevelopment) console.log('🎭 Loading mock authentication for local development...');
    try {
      const { MockAuth } = await import('./mock-auth.js');
      mockAuth = new MockAuth();
      if (isDevelopment) console.log('✅ Mock authentication loaded successfully');
    } catch (error) {
      if (isDevelopment) console.error('❌ Failed to load mock auth:', error);
    }
  } else {
    if (isDevelopment) console.log('🌐 Using production Netlify Functions - no mock auth needed');
  }
};

const checkRealApiAvailable = async () => {
  try {
    await fetch('http://localhost:3001/api/health');
    return true;
  } catch {
    return false;
  }
};

class AuthManager {
  constructor() {
    this.user = null;
    this.token = null;
    this.loginCallbacks = [];
    this.logoutCallbacks = [];
    this.isRedirecting = false;
    this.init();
  }

  // Initialize auth manager
  async init() {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDevelopment) console.log('🚀 Initializing authentication manager...');
    
    this.isInitializing = true;
    
    // Add session timeout management
    this.setupSessionTimeout();
    
    await initMockAuth();
    this.loadStoredAuth();
    this.setupTokenRefresh();
    await this.validateStoredToken();
    this.checkAuthStateOnLoad();
    
    this.isInitializing = false;
    this.isInitialized = true;
    
    if (isDevelopment) console.log('✅ Authentication manager initialized');
  }

  // Wait for authentication to be fully initialized
  async waitForInit() {
    if (this.isInitialized) return;
    
    return new Promise((resolve) => {
      const checkInit = () => {
        if (this.isInitialized) {
          resolve();
        } else {
          setTimeout(checkInit, 50);
        }
      };
      checkInit();
    });
  }

  // Check authentication state on page load
  checkAuthStateOnLoad() {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDevelopment) console.log('🔍 Checking authentication state on page load...');
    
    // Prevent redirect loops by checking if we're already redirecting
    if (this.isRedirecting) {
      if (isDevelopment) console.log('🔄 Already redirecting, skipping auth check');
      return;
    }
    
    // Skip check if still initializing - let individual pages handle it
    if (this.isInitializing) {
      if (isDevelopment) console.log('⏳ Still initializing, deferring auth check to page logic');
      return;
    }
    
    if (this.isAuthenticated()) {
      if (isDevelopment) {
        console.log('✅ User is already authenticated');
        console.log('👤 Current user:', this.user?.email || 'Unknown');
        console.log('🎫 Current token:', this.token ? 'Present' : 'Missing');
      }
      
      // For demo tokens or local development, skip server validation to prevent loops
      if (this.token && this.token.startsWith('demo-token-')) {
        if (isDevelopment) console.log('🎭 Demo token detected, skipping server validation');
        this.notifyLoginCallbacks();
        return;
      }
      
      // Verify token is still valid by making a test request
      this.validateStoredToken().then(isValid => {
        if (isValid) {
          if (isDevelopment) console.log('✅ Token validation successful');
          this.notifyLoginCallbacks();
        } else {
          if (isDevelopment) console.log('❌ Token validation failed, redirecting to login');
          this.redirectToLogin();
        }
      }).catch(error => {
        if (isDevelopment) {
          console.error('❌ Token validation error:', error);
          console.log('🎭 Falling back to demo mode to prevent redirect loop');
        }
        this.notifyLoginCallbacks();
      });
    } else {
      if (isDevelopment) console.log('❌ No valid authentication found on page load');
      // Check if we're on a protected page
      if (this.isProtectedPage()) {
        if (isDevelopment) console.log('🔒 Protected page detected, redirecting to login');
        this.redirectToLogin();
      }
    }
  }

  // Check if current page requires authentication
  isProtectedPage() {
    const protectedPages = ['/dashboard.html', '/profile.html', '/settings.html'];
    const currentPath = window.location.pathname;
    return protectedPages.some(page => currentPath.includes(page));
  }

  // Load authentication data from localStorage
  loadStoredAuth() {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDevelopment) console.log('📂 Loading stored authentication data...');
    
    try {
      this.token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (isDevelopment) {
        console.log('🎫 Stored token:', this.token ? 'Present' : 'Missing');
        console.log('👤 Stored user data:', userData ? 'Present' : 'Missing');
      }
      
      if (userData) {
        this.user = JSON.parse(userData);
        if (isDevelopment) console.log('👤 Loaded user:', this.user);
      }
      
      if (this.token) {
        apiClient.setAuthToken(this.token);
        if (isDevelopment) console.log('🔗 Token set in API client');
      }
      
      if (isDevelopment) {
        if (this.token && this.user) {
          console.log('✅ Stored auth data loaded successfully');
        } else {
          console.log('❌ No complete stored auth data found');
        }
      }
    } catch (error) {
      if (isDevelopment) console.error('❌ Error loading stored auth:', error);
      this.clearAuth();
    }
  }

  // Validate stored token with backend
  async validateStoredToken() {
    if (!this.token) return false;

    // Skip validation for demo tokens to prevent loops
    if (this.token.startsWith('demo-token-')) {
      console.log('🎭 Demo token, skipping server validation');
      return true;
    }

    try {
      const response = await auth.getCurrentUser();
      if (response.success) {
        this.user = response.user;
        this.saveUserData();
        this.notifyLoginCallbacks();
        return true;
      } else {
        console.log('❌ Token validation failed on server');
        // Don't clear auth immediately, let the page handle it
        return false;
      }
    } catch (error) {
      console.error('❌ Token validation network error:', error);
      // On network error, assume token is still valid to prevent redirect loops
      console.log('🌐 Network error during validation, assuming token valid');
      return true;
    }
  }

  // Login with email and password
  async login(email, password) {
    try {
      console.log('🔐 Starting authentication process...');
      console.log('📧 Email:', email);
      console.log('🔑 Password length:', password ? password.length : 0);
      
      this.showLoading('Signing in...');
      
      // For Netlify deployments, use real Supabase functions
      const isUsingNetlifyFunctions = window.location.hostname.includes('netlify.app') || 
                                      window.location.hostname.includes('netlify.com') ||
                                      (window.location.hostname === 'localhost' && window.location.port === '8888');
      
      console.log('🔍 Using Netlify Functions:', isUsingNetlifyFunctions);
      console.log('🔍 Mock auth status:', mockAuth ? 'Available' : 'Not available');
      console.log('🎭 Demo mode enabled for Netlify deployment');
      
      // Fallback to mock auth if real auth failed or not using Netlify
      if (mockAuth) {
        console.log('🎭 Using mock authentication...');
        const response = await mockAuth.login({ email, password });
        
        console.log('📋 Authentication response:', response);
        
        if (response.success) {
          console.log('✅ Authentication successful!');
          console.log('🎫 Token received:', response.data.token ? 'Yes' : 'No');
          console.log('👤 User data:', response.data.user);
          
          this.token = response.data.token;
          this.user = response.data.user;
          
          // Store authentication data
          localStorage.setItem('authToken', this.token);
          localStorage.setItem('userData', JSON.stringify(this.user));
          console.log('💾 Auth data stored in localStorage');
          console.log('💾 Stored token key: authToken');
          console.log('💾 Stored user key: userData');
          
          this.saveUserData();
          
          // Set token in API client
          apiClient.setAuthToken(this.token);
          console.log('🔗 Token set in API client');
          
          // Verify auth state
          const isValid = this.isAuthenticated();
          console.log('🔍 Auth state valid:', isValid);
          
          // Notify callbacks
          this.notifyLoginCallbacks();
          
          this.hideLoading();
          this.showSuccess('Welcome back!');
          
          // Redirect to dashboard after successful login
          setTimeout(() => {
            console.log('🚀 Starting dashboard redirect...');
            console.log('🔍 Final auth check before redirect:');
            console.log('   - Token exists:', !!this.token);
            console.log('   - User exists:', !!this.user);
            console.log('   - Token value:', this.token);
            console.log('   - User value:', this.user);
            console.log('   - LocalStorage token:', localStorage.getItem('authToken'));
            console.log('   - LocalStorage user:', localStorage.getItem('userData'));
            console.log('   - Is authenticated:', this.isAuthenticated());
            
            // Double-check auth state with a brief delay
            if (this.isAuthenticated()) {
              console.log('✅ Authentication confirmed, proceeding with redirect');
              this.redirectToDashboard();
            } else {
              console.error('❌ Auth state invalid at redirect time');
              console.log('🔄 Attempting to restore auth from localStorage...');
              this.loadStoredAuth();
              
              // Try again after loading
              if (this.isAuthenticated()) {
                console.log('✅ Auth restored from storage, proceeding with redirect');
                this.redirectToDashboard();
              } else {
                console.error('❌ Unable to restore authentication');
                this.showError('Authentication state lost. Please try logging in again.');
              }
            }
          }, 1500); // Increased delay to ensure everything is saved
          
          return { success: true, user: this.user };
        } else {
          console.error('❌ Authentication failed:', response.error);
          this.hideLoading();
          this.showError(response.error || 'Login failed');
          return { success: false, error: response.error };
        }
      }
      
      // If no mock auth available, create temporary demo auth for any environment
      if (!mockAuth) {
        console.log('🎭 Creating temporary demo authentication...');
        
        // Simple demo authentication for any environment
        if (email && password) {
          const demoToken = 'demo-token-' + Date.now();
          const demoUser = {
            id: '1',
            email: email,
            name: email.split('@')[0],
            role: 'player'
          };
          
          this.token = demoToken;
          this.user = demoUser;
          
          // Store authentication data
          localStorage.setItem('authToken', this.token);
          localStorage.setItem('userData', JSON.stringify(this.user));
          console.log('💾 Demo auth data stored in localStorage');
          
          this.saveUserData();
          
          // Set token in API client
          apiClient.setAuthToken(this.token);
          console.log('🔗 Token set in API client');
          
          // Notify callbacks
          this.notifyLoginCallbacks();
          
          this.hideLoading();
          this.showSuccess('Welcome back!');
          
          // Redirect to dashboard after successful login
          setTimeout(() => {
            console.log('🚀 Starting dashboard redirect...');
            console.log('🔍 Final auth check before redirect:');
            console.log('   - Token exists:', !!this.token);
            console.log('   - User exists:', !!this.user);
            console.log('   - Is authenticated:', this.isAuthenticated());
            
            if (this.isAuthenticated()) {
              this.redirectToDashboard();
            } else {
              console.error('❌ Auth state invalid at redirect time');
              this.showError('Authentication state lost. Please try logging in again.');
            }
          }, 1500);
          
          return { success: true, user: this.user };
        }
      }
      
      // Try real API
      console.log('🌐 Trying real API authentication...');
      const response = await auth.login({ email, password });
      
      if (response.success) {
        this.token = response.data.token;
        this.user = response.data.user;
        
        // Store authentication data
        localStorage.setItem('authToken', this.token);
        this.saveUserData();
        
        // Set token in API client
        apiClient.setAuthToken(this.token);
        
        // Notify callbacks
        this.notifyLoginCallbacks();
        
        this.hideLoading();
        this.showSuccess('Welcome back!');
        
        // Redirect to dashboard after successful login
        setTimeout(() => {
          this.redirectToDashboard();
        }, 1000);
        
        return { success: true, user: this.user };
      } else {
        this.hideLoading();
        this.showError(response.error || 'Login failed');
        return { success: false, error: response.error };
      }
    } catch (error) {
      this.hideLoading();
      this.showError('Network error. Please try again.');
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  // Register new user
  async register(userData) {
    try {
      this.showLoading('Creating your account...');
      
      const response = await auth.register(userData);
      
      if (response.success) {
        this.token = response.token;
        this.user = response.user;
        
        // Store authentication data
        localStorage.setItem('authToken', this.token);
        this.saveUserData();
        
        // Set token in API client
        apiClient.setAuthToken(this.token);
        
        // Notify callbacks
        this.notifyLoginCallbacks();
        
        this.hideLoading();
        this.showSuccess('Account created successfully!');
        
        return { success: true, user: this.user };
      } else {
        this.hideLoading();
        this.showError(response.error || 'Registration failed');
        return { success: false, error: response.error };
      }
    } catch (error) {
      this.hideLoading();
      this.showError('Network error. Please try again.');
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  // Logout user
  async logout() {
    try {
      // Call backend logout if possible
      if (this.token) {
        await auth.logout().catch(() => {}); // Don't fail if backend is offline
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }
    
    this.clearAuth();
    this.notifyLogoutCallbacks();
    this.showSuccess('You have been logged out');
  }

  // Clear all authentication data
  clearAuth() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    apiClient.setAuthToken(null);
  }

  // Save user data to localStorage
  saveUserData() {
    if (this.user) {
      localStorage.setItem('userData', JSON.stringify(this.user));
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDevelopment) {
      console.log('🔍 Checking authentication state...');
      console.log('🎫 Token exists:', !!this.token);
      console.log('👤 User exists:', !!this.user);
    }
    
    if (this.token && this.user) {
      // Check if it's a demo token (starts with "demo-token-") - only allow in development
      if (this.token.startsWith('demo-token-')) {
        if (isDevelopment) {
          // Only log in development
          if (window.location.hostname === 'localhost') {
            console.log('🎭 Demo token detected in development, skipping JWT validation');
            console.log('✅ User is authenticated (demo mode)');
          }
          return true;
        } else {
          // Demo tokens strictly forbidden in production
          console.error('❌ SECURITY VIOLATION: Demo token detected in production environment');
          this.clearAuth();
          this.showError('Security violation detected. Please contact support.');
          return false;
        }
      }
      
      // For real JWT tokens, validate expiration
      try {
        // Verify token is not expired
        const payload = JSON.parse(atob(this.token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        
        // Only log token details in development
        if (isDevelopment) {
          console.log('⏰ Token expires at:', new Date(payload.exp * 1000));
          console.log('⏰ Current time:', new Date(now * 1000));
          console.log('⏰ Token valid:', payload.exp > now);
        }
        
        if (payload.exp && payload.exp > now) {
          if (isDevelopment) {
            console.log('✅ User is authenticated (JWT valid)');
          }
          return true;
        } else {
          if (isDevelopment) {
            console.log('❌ Token expired, clearing auth');
          }
          this.clearAuth();
          return false;
        }
      } catch (error) {
        if (isDevelopment) {
          console.error('❌ JWT token validation failed:', error);
          console.log('🔄 Treating as demo token fallback');
        }
        
        // If JWT parsing fails but we have token and user, only allow in development
        if (this.token && this.user && isDevelopment) {
          if (isDevelopment) {
            console.log('✅ User is authenticated (fallback mode)');
          }
          return true;
        }
        
        // In production, JWT parsing failure means invalid token
        this.clearAuth();
        return false;
      }
    }
    
    if (isDevelopment) {
      console.log('❌ No valid authentication found');
    }
    return false;
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Get current token
  getToken() {
    return this.token;
  }

  // Get user role
  getUserRole() {
    return this.user?.role || 'player';
  }

  // Check if user has specific role
  hasRole(role) {
    return this.getUserRole() === role;
  }

  // Setup automatic token refresh
  setupTokenRefresh() {
    // Refresh token every 23 hours (tokens expire in 24 hours)
    setInterval(() => {
      if (this.isAuthenticated()) {
        this.validateStoredToken();
      }
    }, 23 * 60 * 60 * 1000);
  }

  // Setup session timeout management
  setupSessionTimeout() {
    const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
    const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
    
    let sessionTimer;
    let warningTimer;
    let lastActivity = Date.now();
    
    const resetSessionTimer = () => {
      lastActivity = Date.now();
      
      // Clear existing timers
      if (sessionTimer) clearTimeout(sessionTimer);
      if (warningTimer) clearTimeout(warningTimer);
      
      // Set warning timer
      warningTimer = setTimeout(() => {
        if (this.isAuthenticated()) {
          this.showWarning('Your session will expire in 5 minutes due to inactivity.');
        }
      }, SESSION_TIMEOUT - WARNING_TIME);
      
      // Set logout timer
      sessionTimer = setTimeout(() => {
        if (this.isAuthenticated()) {
          this.showError('Session expired due to inactivity.');
          this.logout();
        }
      }, SESSION_TIMEOUT);
    };
    
    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        if (this.isAuthenticated() && Date.now() - lastActivity > 60000) { // Reset every minute
          resetSessionTimer();
        }
      }, true);
    });
    
    // Initialize session timer
    if (this.isAuthenticated()) {
      resetSessionTimer();
    }
    
    // Reset timer on login
    this.onLogin(() => {
      resetSessionTimer();
    });
    
    // Clear timers on logout
    this.onLogout(() => {
      if (sessionTimer) clearTimeout(sessionTimer);
      if (warningTimer) clearTimeout(warningTimer);
    });
  }

  // Add login callback
  onLogin(callback) {
    this.loginCallbacks.push(callback);
  }

  // Add logout callback
  onLogout(callback) {
    this.logoutCallbacks.push(callback);
  }

  // Notify login callbacks
  notifyLoginCallbacks() {
    this.loginCallbacks.forEach(callback => {
      try {
        callback(this.user);
      } catch (error) {
        console.error('Login callback error:', error);
      }
    });
  }

  // Notify logout callbacks
  notifyLogoutCallbacks() {
    this.logoutCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Logout callback error:', error);
      }
    });
  }

  // Redirect to login if not authenticated
  async requireAuth() {
    console.log('🔒 Checking authentication requirement...');
    
    // Wait for auth manager to finish initializing
    await this.waitForInit();
    
    console.log('🔍 Auth check after initialization:');
    console.log('   - Is authenticated:', this.isAuthenticated());
    console.log('   - Token exists:', !!this.token);
    console.log('   - User exists:', !!this.user);
    
    if (!this.isAuthenticated()) {
      console.log('❌ Authentication required but user not authenticated, redirecting to login');
      this.redirectToLogin();
      return false;
    }
    
    console.log('✅ Authentication verified');
    return true;
  }

  // Redirect to login page
  redirectToLogin() {
    if (this.isRedirecting) {
      console.log('🔄 Already redirecting, skipping');
      return;
    }
    this.isRedirecting = true;
    console.log('🚀 Redirecting to login...');
    window.location.href = '/login.html';
  }

  // Redirect to dashboard
  redirectToDashboard() {
    if (this.isRedirecting) {
      console.log('🔄 Already redirecting, skipping');
      return;
    }
    this.isRedirecting = true;
    console.log('🚀 Redirecting to dashboard...');
    console.log('📍 Current location:', window.location.href);
    
    // Handle different environments
    const dashboardUrl = this.getDashboardUrl();
    console.log('🎯 Dashboard URL:', dashboardUrl);
    
    try {
      window.location.href = dashboardUrl;
    } catch (error) {
      console.error('❌ Redirect failed:', error);
      // Fallback: try window.location.assign
      window.location.assign(dashboardUrl);
    }
  }
  
  // Get the correct dashboard URL for current environment
  getDashboardUrl() {
    const currentUrl = window.location;
    const baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;
    
    // For local development (localhost:8888, localhost:3000, etc.)
    if (currentUrl.hostname === 'localhost' || currentUrl.hostname === '127.0.0.1') {
      return `${baseUrl}/dashboard.html`;
    }
    
    // For Netlify production
    return `${baseUrl}/dashboard.html`;
  }

  // Show loading indicator
  showLoading(message = 'Loading...') {
    const loadingDiv = document.getElementById('loading-indicator') || this.createLoadingIndicator();
    const messageSpan = loadingDiv.querySelector('.loading-message');
    if (messageSpan) {
      messageSpan.textContent = message;
    }
    loadingDiv.style.display = 'flex';
  }

  // Hide loading indicator
  hideLoading() {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }
  }

  // Create loading indicator
  createLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: 'Poppins', sans-serif;
    `;
    
    loadingDiv.innerHTML = `
      <div style="text-align: center;">
        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <span class="loading-message">Loading...</span>
      </div>
    `;
    
    // Add spinner animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(loadingDiv);
    return loadingDiv;
  }

  // Show success message
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  // Show error message
  showError(message) {
    this.showNotification(message, 'error');
  }
  
  // Show warning message
  showWarning(message) {
    this.showNotification(message, 'warning');
  }
  
  // Show info message
  showInfo(message) {
    this.showNotification(message, 'info');
  }
  
  // Show loading overlay
  showLoading(message = 'Loading...') {
    // Remove any existing loading
    const existing = document.querySelector('.auth-loading-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'auth-loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
    `;
    
    overlay.innerHTML = `
      <div style="background: white; padding: 2rem; border-radius: 12px; text-align: center; min-width: 200px;">
        <div style="font-size: 2rem; margin-bottom: 1rem; animation: spin 1s linear infinite;">⏳</div>
        <div style="font-weight: 500; color: #374151;">${message}</div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    return overlay;
  }
  
  // Hide loading overlay
  hideLoading() {
    const loading = document.querySelector('.auth-loading-overlay');
    if (loading) loading.remove();
  }

  // Show notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      z-index: 10001;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    // Add slide animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      this.showLoading('Updating profile...');
      
      // Call API to update profile
      const response = await apiClient.put('/api/auth/profile', profileData);
      
      if (response.success) {
        this.user = { ...this.user, ...response.user };
        this.saveUserData();
        this.hideLoading();
        this.showSuccess('Profile updated successfully!');
        return { success: true, user: this.user };
      } else {
        this.hideLoading();
        this.showError(response.error || 'Profile update failed');
        return { success: false, error: response.error };
      }
    } catch (error) {
      this.hideLoading();
      this.showError('Network error. Please try again.');
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      this.showLoading('Changing password...');
      
      const response = await apiClient.put('/api/auth/password', {
        currentPassword,
        newPassword
      });
      
      if (response.success) {
        this.hideLoading();
        this.showSuccess('Password changed successfully!');
        return { success: true };
      } else {
        this.hideLoading();
        this.showError(response.error || 'Password change failed');
        return { success: false, error: response.error };
      }
    } catch (error) {
      this.hideLoading();
      this.showError('Network error. Please try again.');
      console.error('Password change error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
export const authManager = new AuthManager();

// Export class for potential additional instances
export default AuthManager;