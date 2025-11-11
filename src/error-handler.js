// Global Error Handler for FlagFit Pro
// Provides consistent error handling and user feedback across the app

export class ErrorHandler {
  static init() {
    // Global error event listeners
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    
    // Network status monitoring
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }
  
  static handleError(event) {
    const isDevelopment = window.location.hostname === 'localhost';
    
    if (isDevelopment) {
      console.error('Global error caught:', event.error);
    }
    
    // Show user-friendly error message
    this.showUserError('Something went wrong. Please refresh the page and try again.');
  }
  
  static handlePromiseRejection(event) {
    const isDevelopment = window.location.hostname === 'localhost';
    
    if (isDevelopment) {
      console.error('Unhandled promise rejection:', event.reason);
    }
    
    // Prevent the default browser error handling
    event.preventDefault();
    
    // Show user-friendly error message
    this.showUserError('A network request failed. Please check your connection and try again.');
  }
  
  static handleOnline() {
    this.showSuccess('Connection restored');
  }
  
  static handleOffline() {
    this.showWarning('You are offline. Some features may not work properly.');
  }
  
  // API Error handling
  static handleApiError(error, context = '') {
    const isDevelopment = window.location.hostname === 'localhost';
    
    if (isDevelopment) {
      console.error(`API Error ${context}:`, error);
    }
    
    let message = 'Something went wrong. Please try again.';
    
    if (error.status === 401) {
      message = 'Your session has expired. Please log in again.';
      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 2000);
    } else if (error.status === 403) {
      message = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      message = 'The requested resource was not found.';
    } else if (error.status >= 500) {
      message = 'Server error. Please try again later.';
    } else if (!navigator.onLine) {
      message = 'You are offline. Please check your internet connection.';
    }
    
    this.showUserError(message);
    return { error: true, message };
  }
  
  // Form validation error handling
  static handleValidationError(field, message) {
    // Find the field element
    const fieldElement = document.getElementById(field) || document.querySelector(`[name="${field}"]`);
    
    if (fieldElement) {
      // Add error styling
      fieldElement.style.borderColor = '#ef4444';
      fieldElement.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
      
      // Remove error styling after user starts typing
      const removeError = () => {
        fieldElement.style.borderColor = '';
        fieldElement.style.boxShadow = '';
        fieldElement.removeEventListener('input', removeError);
      };
      fieldElement.addEventListener('input', removeError);
    }
    
    this.showUserError(message);
  }
  
  // User-friendly error display
  static showUserError(message) {
    this.showNotification(message, 'error', 8000);
  }
  
  static showSuccess(message) {
    this.showNotification(message, 'success', 5000);
  }
  
  static showWarning(message) {
    this.showNotification(message, 'warning', 6000);
  }
  
  static showInfo(message) {
    this.showNotification(message, 'info', 5000);
  }
  
  // Notification display system
  static showNotification(message, type = 'info', duration = 5000) {
    // Remove any existing notifications of the same type
    const existing = document.querySelector(`.error-notification.${type}`);
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `error-notification ${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 400px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      font-size: 0.875rem;
      font-family: 'Inter', 'Poppins', sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      line-height: 1.4;
      ${type === 'error' ? 'background: #ef4444; border-left: 4px solid #dc2626;' : ''}  /* Red for alerts */
      ${type === 'success' ? 'background: #10c96b; border-left: 4px solid #0ab85a;' : ''}  /* Green for actions */
      ${type === 'warning' ? 'background: #fbbf24; border-left: 4px solid #f59e0b;' : ''}  /* Yellow for warnings */
      ${type === 'info' ? 'background: #fbbf24; border-left: 4px solid #f59e0b;' : ''}  /* Yellow for info */
    `;
    
    const icon = {
      error: '❌',
      success: '✅', 
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
        <span style="flex-shrink: 0; font-size: 1rem;">${icon[type]}</span>
        <span style="flex: 1;">${message}</span>
        <button onclick="this.closest('.error-notification').remove()" 
                style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; 
                       opacity: 0.8; padding: 0; margin: 0; line-height: 1; flex-shrink: 0;"
                onmouseover="this.style.opacity='1'" 
                onmouseout="this.style.opacity='0.8'">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.style.transform = 'translateX(100%)';
          setTimeout(() => notification.remove(), 300);
        }
      }, duration);
    }
  }
  
  // Loading state management
  static showLoading(message = 'Loading...') {
    const existing = document.querySelector('.global-loading-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'global-loading-overlay';
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
      z-index: 10001;
      backdrop-filter: blur(2px);
    `;
    
    overlay.innerHTML = `
      <div style="background: white; padding: 2rem 3rem; border-radius: 12px; text-align: center; 
                  min-width: 200px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
        <div style="font-size: 2rem; margin-bottom: 1rem; 
                    animation: spin 1s linear infinite;">⏳</div>
        <div style="font-weight: 500; color: #374151; font-size: 1rem;">${message}</div>
      </div>
      <style>
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    
    document.body.appendChild(overlay);
    return overlay;
  }
  
  static hideLoading() {
    const loading = document.querySelector('.global-loading-overlay');
    if (loading) loading.remove();
  }
  
  // Utility method to wrap async operations with error handling
  static async withErrorHandling(operation, context = '') {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      return this.handleApiError(error, context);
    }
  }
}

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    ErrorHandler.init();
  });
}

export default ErrorHandler;