// Enhanced Authentication Manager for FlagFit Pro
// Handles login, registration, session management, and user state

import { apiClient, auth } from './api-config.js';

class AuthManager {
  constructor() {
    this.user = null;
    this.token = null;
    this.loginCallbacks = [];
    this.logoutCallbacks = [];
    this.init();
  }

  // Initialize auth manager
  init() {
    this.loadStoredAuth();
    this.setupTokenRefresh();
    this.validateStoredToken();
  }

  // Load authentication data from localStorage
  loadStoredAuth() {
    try {
      this.token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (userData) {
        this.user = JSON.parse(userData);
      }
      
      if (this.token) {
        apiClient.setAuthToken(this.token);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      this.clearAuth();
    }
  }

  // Validate stored token with backend
  async validateStoredToken() {
    if (!this.token) return false;

    try {
      const response = await auth.getCurrentUser();
      if (response.success) {
        this.user = response.user;
        this.saveUserData();
        this.notifyLoginCallbacks();
        return true;
      } else {
        this.clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      this.clearAuth();
      return false;
    }
  }

  // Login with email and password
  async login(email, password) {
    try {
      this.showLoading('Signing in...');
      
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
    return !!(this.token && this.user);
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
  requireAuth() {
    if (!this.isAuthenticated()) {
      this.redirectToLogin();
      return false;
    }
    return true;
  }

  // Redirect to login page
  redirectToLogin() {
    window.location.href = '/login.html';
  }

  // Redirect to dashboard
  redirectToDashboard() {
    window.location.href = '/dashboard.html';
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