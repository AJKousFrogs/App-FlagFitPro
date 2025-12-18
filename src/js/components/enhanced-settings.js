/* eslint-disable no-console */
/**
 * Enhanced Settings Component
 * 
 * Features:
 * - Real-time settings sync via Supabase
 * - Auto-save with debouncing
 * - Enhanced form validation with real-time feedback
 * - Optimistic UI updates
 * - Settings categories management
 * - Change tracking and unsaved changes warning
 * - Export/import settings
 */

import { realtimeManager } from '../services/supabase-client.js';
import { storageService } from '../services/storage-service-unified.js';

class EnhancedSettings {
  constructor() {
    this.settings = {
      profile: {},
      notifications: {},
      privacy: {},
      preferences: {},
      security: {}
    };
    this.originalSettings = {};
    this.hasUnsavedChanges = false;
    this.autoSaveTimeout = null;
    this.autoSaveDelay = 2000; // 2 seconds
    this.realtimeSubscription = null;
    this.currentUserId = null;
    this.listeners = new Set();
    this.validationRules = {
      displayName: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z0-9\s\-_]+$/
      },
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      },
      password: {
        minLength: 8,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      },
      jerseyNumber: {
        min: 0,
        max: 99,
        type: 'number'
      }
    };
  }

  /**
   * Initialize the enhanced settings component
   */
  async init(options = {}) {
    this.options = {
      enableRealtime: options.enableRealtime !== false,
      enableAutoSave: options.enableAutoSave !== false,
      enableValidation: options.enableValidation !== false,
      ...options
    };

    // Get current user
    this.currentUserId = this.getCurrentUserId();
    if (!this.currentUserId) {
      console.warn('[Settings] No user ID found');
      return;
    }

    // Load initial settings
    await this.loadSettings();

    // Setup real-time subscription
    if (this.options.enableRealtime) {
      await this.setupRealtimeSubscription();
    }

    // Setup auto-save
    if (this.options.enableAutoSave) {
      this.setupAutoSave();
    }

    // Setup form validation
    if (this.options.enableValidation) {
      this.setupValidation();
    }

    // Setup change tracking
    this.setupChangeTracking();

    console.log('[Settings] Enhanced settings initialized');
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    try {
      if (window.authManager) {
        const user = window.authManager.getCurrentUser();
        return user?.id || user?.user_id;
      }
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user?.id || user?.user_id;
      }
      return null;
    } catch (error) {
      console.warn('[Settings] Failed to get user ID:', error);
      return null;
    }
  }

  /**
   * Load settings from API/storage
   */
  async loadSettings() {
    try {
      // Try API first
      const response = await this.apiCall('/api/user/settings', {
        method: 'GET'
      });

      if (response && response.success && response.data) {
        this.settings = { ...this.settings, ...response.data };
        this.originalSettings = JSON.parse(JSON.stringify(this.settings));
        this.populateForm();
        this.notifyListeners();
        return;
      }
    } catch (error) {
      console.warn('[Settings] Failed to load from API, using localStorage:', error);
    }

    // Fallback to localStorage
    const savedSettings = storageService.get('flagfit_settings', {}, { usePrefix: false });
    const user = window.authManager?.getCurrentUser() || {};

    // Merge saved settings with defaults
    this.settings = {
      profile: {
        displayName: user.name || savedSettings.displayName || '',
        email: user.email || savedSettings.email || '',
        position: savedSettings.position || '',
        jerseyNumber: savedSettings.jerseyNumber || null,
        experienceLevel: savedSettings.experienceLevel || '',
        team: savedSettings.team || ''
      },
      notifications: savedSettings.notifications || {
        training: true,
        tournaments: true,
        team: false,
        achievement: true,
        wellness: true,
        game: true
      },
      privacy: savedSettings.privacy || {
        profileVisible: true,
        dataSharing: true,
        analytics: false
      },
      preferences: {
        theme: savedSettings.theme || 'auto',
        language: savedSettings.language || 'en',
        timezone: savedSettings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        autoRefresh: true
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 30 // minutes
      }
    };

    this.originalSettings = JSON.parse(JSON.stringify(this.settings));
    this.populateForm();
    this.notifyListeners();
  }

  /**
   * Populate form fields with current settings
   */
  populateForm() {
    // Profile settings
    const displayNameField = document.getElementById('displayName');
    if (displayNameField) {
      displayNameField.value = this.settings.profile.displayName || '';
    }

    const emailField = document.getElementById('email');
    if (emailField) {
      emailField.value = this.settings.profile.email || '';
    }

    const positionField = document.getElementById('position');
    if (positionField) {
      positionField.value = this.settings.profile.position || '';
    }

    const jerseyNumberField = document.getElementById('jerseyNumber');
    if (jerseyNumberField) {
      jerseyNumberField.value = this.settings.profile.jerseyNumber || '';
    }

    const experienceLevelField = document.getElementById('experienceLevel');
    if (experienceLevelField) {
      experienceLevelField.value = this.settings.profile.experienceLevel || '';
    }

    const teamField = document.getElementById('team');
    if (teamField) {
      teamField.value = this.settings.profile.team || '';
    }

    // Notification settings
    this.updateNotificationToggles();

    // Privacy settings
    this.updatePrivacyToggles();

    // Preferences
    const themeField = document.getElementById('theme');
    if (themeField) {
      themeField.value = this.settings.preferences.theme || 'auto';
    }

    const languageField = document.getElementById('language');
    if (languageField) {
      languageField.value = this.settings.preferences.language || 'en';
    }

    const timezoneField = document.getElementById('timezone');
    if (timezoneField) {
      timezoneField.value = this.settings.preferences.timezone || '';
    }
  }

  /**
   * Update notification toggle switches
   */
  updateNotificationToggles() {
    const notificationTypes = ['training', 'tournament', 'team', 'achievement', 'wellness', 'game'];
    
    notificationTypes.forEach(type => {
      const toggle = document.querySelector(`[data-preference-key="${type}"]`);
      if (toggle) {
        const isActive = this.settings.notifications[type] !== false;
        if (isActive) {
          toggle.classList.add('active');
        } else {
          toggle.classList.remove('active');
        }
      }
    });
  }

  /**
   * Update privacy toggle switches
   */
  updatePrivacyToggles() {
    const privacySection = document.querySelector('.settings-section:nth-child(3)');
    if (!privacySection) return;

    const profileVisibleToggle = privacySection.querySelector('.setting-item:nth-child(1) .toggle-switch');
    if (profileVisibleToggle) {
      if (this.settings.privacy.profileVisible) {
        profileVisibleToggle.classList.add('active');
      } else {
        profileVisibleToggle.classList.remove('active');
      }
    }

    const dataSharingToggle = privacySection.querySelector('.setting-item:nth-child(2) .toggle-switch');
    if (dataSharingToggle) {
      if (this.settings.privacy.dataSharing) {
        dataSharingToggle.classList.add('active');
      } else {
        dataSharingToggle.classList.remove('active');
      }
    }

    const analyticsToggle = privacySection.querySelector('.setting-item:nth-child(3) .toggle-switch');
    if (analyticsToggle) {
      if (this.settings.privacy.analytics) {
        analyticsToggle.classList.add('active');
      } else {
        analyticsToggle.classList.remove('active');
      }
    }
  }

  /**
   * Setup real-time subscription for settings updates
   */
  async setupRealtimeSubscription() {
    try {
      if (!this.currentUserId) return;

      // Subscribe to user settings updates
      this.realtimeSubscription = realtimeManager.subscribe(
        'user_settings',
        {
          event: '*',
          filter: `user_id=eq.${this.currentUserId}`
        },
        (payload) => {
          this.handleRealtimeUpdate(payload);
        }
      );

      console.log('[Settings] Real-time subscription active');
    } catch (error) {
      console.warn('[Settings] Failed to setup real-time subscription:', error);
    }
  }

  /**
   * Handle real-time settings updates
   */
  handleRealtimeUpdate(payload) {
    const eventType = payload.eventType || 'UPDATE';
    const settings = payload.new || payload.old;

    if (!settings || settings.user_id !== this.currentUserId) return;

    console.log('[Settings] Real-time update:', eventType, settings);

    // Merge updated settings
    if (settings.settings) {
      this.settings = { ...this.settings, ...settings.settings };
      this.populateForm();
      this.notifyListeners();
    }
  }

  /**
   * Setup auto-save functionality
   */
  setupAutoSave() {
    // Auto-save on input changes
    const inputs = document.querySelectorAll('.form-input, .form-select, .select-input');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.scheduleAutoSave();
      });
    });

    // Auto-save on toggle changes
    const toggles = document.querySelectorAll('.toggle-switch');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        this.scheduleAutoSave();
      });
    });
  }

  /**
   * Schedule auto-save
   */
  scheduleAutoSave() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.hasUnsavedChanges = true;
    this.updateSaveButton();
    this.showUnsavedChangesWarning(true);

    this.autoSaveTimeout = setTimeout(() => {
      this.showAutoSaveIndicator('saving');
      this.saveSettings(true).then(success => {
        if (success) {
          this.showAutoSaveIndicator('saved');
          setTimeout(() => {
            this.showAutoSaveIndicator('hidden');
          }, 2000);
        } else {
          this.showAutoSaveIndicator('error');
          setTimeout(() => {
            this.showAutoSaveIndicator('hidden');
          }, 3000);
        }
      });
    }, this.autoSaveDelay);
  }

  /**
   * Show/hide unsaved changes warning
   */
  showUnsavedChangesWarning(show) {
    const warning = document.getElementById('unsavedChangesWarning');
    if (warning) {
      if (show) {
        warning.classList.add('show');
      } else {
        warning.classList.remove('show');
      }
    }
  }

  /**
   * Show auto-save indicator
   */
  showAutoSaveIndicator(state) {
    const indicator = document.getElementById('autoSaveIndicator');
    const text = document.getElementById('autoSaveText');
    
    if (!indicator || !text) return;

    indicator.classList.remove('show', 'saving', 'saved', 'error');
    
    switch (state) {
      case 'saving':
        indicator.classList.add('show', 'saving');
        text.textContent = 'Saving...';
        break;
      case 'saved':
        indicator.classList.add('show', 'saved');
        text.textContent = 'Saved';
        break;
      case 'error':
        indicator.classList.add('show', 'error');
        text.textContent = 'Save failed';
        break;
      case 'hidden':
      default:
        // Hide indicator
        break;
    }
  }

  /**
   * Update save button state
   */
  updateSaveButton() {
    const saveButton = document.querySelector('button[onclick*="saveSettings"]');
    if (!saveButton) return;

    if (this.hasUnsavedChanges) {
      saveButton.classList.add('has-changes');
      saveButton.textContent = '💾 Save Changes';
    } else {
      saveButton.classList.remove('has-changes');
      saveButton.textContent = '💾 Saved';
    }
  }

  /**
   * Setup form validation
   */
  setupValidation() {
    // Display name validation
    const displayNameField = document.getElementById('displayName');
    if (displayNameField) {
      displayNameField.addEventListener('input', (e) => {
        this.validateField('displayName', e.target.value);
      });
    }

    // Email validation
    const emailField = document.getElementById('email');
    if (emailField) {
      emailField.addEventListener('input', (e) => {
        this.validateField('email', e.target.value);
      });
    }

    // Password validation
    const newPasswordField = document.getElementById('newPassword');
    if (newPasswordField) {
      newPasswordField.addEventListener('input', (e) => {
        this.validateField('password', e.target.value, 'newPassword');
      });
    }

    // Jersey number validation
    const jerseyNumberField = document.getElementById('jerseyNumber');
    if (jerseyNumberField) {
      jerseyNumberField.addEventListener('input', (e) => {
        this.validateField('jerseyNumber', e.target.value);
      });
    }
  }

  /**
   * Validate a field
   */
  validateField(fieldName, value, elementId = null) {
    const element = document.getElementById(elementId || fieldName);
    if (!element) return true;

    const rule = this.validationRules[fieldName];
    if (!rule) return true;

    let isValid = true;
    let errorMessage = '';

    // Required check
    if (rule.required && (!value || value.trim() === '')) {
      isValid = false;
      errorMessage = 'This field is required';
    }

    // Min length check
    if (isValid && rule.minLength && value.length < rule.minLength) {
      isValid = false;
      errorMessage = `Must be at least ${rule.minLength} characters`;
    }

    // Max length check
    if (isValid && rule.maxLength && value.length > rule.maxLength) {
      isValid = false;
      errorMessage = `Must be no more than ${rule.maxLength} characters`;
    }

    // Pattern check
    if (isValid && rule.pattern && !rule.pattern.test(value)) {
      isValid = false;
      if (fieldName === 'email') {
        errorMessage = 'Please enter a valid email address';
      } else if (fieldName === 'password') {
        errorMessage = 'Password must contain uppercase, lowercase, number, and special character';
      } else {
        errorMessage = 'Invalid format';
      }
    }

    // Number range check
    if (isValid && rule.type === 'number') {
      const numValue = parseInt(value);
      if (isNaN(numValue)) {
        isValid = false;
        errorMessage = 'Must be a number';
      } else if (rule.min !== undefined && numValue < rule.min) {
        isValid = false;
        errorMessage = `Must be at least ${rule.min}`;
      } else if (rule.max !== undefined && numValue > rule.max) {
        isValid = false;
        errorMessage = `Must be no more than ${rule.max}`;
      }
    }

    // Update UI
    this.updateFieldValidation(element, isValid, errorMessage);

    return isValid;
  }

  /**
   * Update field validation UI
   */
  updateFieldValidation(element, isValid, errorMessage) {
    const errorElement = document.getElementById(`${element.id}-error`);
    const successElement = document.getElementById(`${element.id}-success`);

    element.setAttribute('aria-invalid', !isValid);

    if (isValid) {
      element.classList.remove('invalid');
      element.classList.add('valid');
      if (errorElement) errorElement.style.display = 'none';
      if (successElement) successElement.style.display = 'block';
    } else {
      element.classList.remove('valid');
      element.classList.add('invalid');
      if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
      }
      if (successElement) successElement.style.display = 'none';
    }
  }

  /**
   * Setup change tracking
   */
  setupChangeTracking() {
    // Track changes to detect unsaved modifications
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        this.hasUnsavedChanges = true;
        this.updateSaveButton();
      });
    });

    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    });
  }

  /**
   * Collect settings from form
   */
  collectSettings() {
    return {
      profile: {
        displayName: document.getElementById('displayName')?.value || '',
        email: document.getElementById('email')?.value || '',
        position: document.getElementById('position')?.value || '',
        jerseyNumber: parseInt(document.getElementById('jerseyNumber')?.value) || null,
        experienceLevel: document.getElementById('experienceLevel')?.value || '',
        team: document.getElementById('team')?.value || ''
      },
      notifications: {
        training: document.querySelector('[data-preference-key="training"]')?.classList.contains('active') !== false,
        tournament: document.querySelector('[data-preference-key="tournament"]')?.classList.contains('active') !== false,
        team: document.querySelector('[data-preference-key="team"]')?.classList.contains('active') !== false,
        achievement: document.querySelector('[data-preference-key="achievement"]')?.classList.contains('active') !== false,
        wellness: document.querySelector('[data-preference-key="wellness"]')?.classList.contains('active') !== false,
        game: document.querySelector('[data-preference-key="game"]')?.classList.contains('active') !== false
      },
      privacy: {
        profileVisible: document.querySelector('.settings-section:nth-child(3) .setting-item:nth-child(1) .toggle-switch')?.classList.contains('active') !== false,
        dataSharing: document.querySelector('.settings-section:nth-child(3) .setting-item:nth-child(2) .toggle-switch')?.classList.contains('active') !== false,
        analytics: document.querySelector('.settings-section:nth-child(3) .setting-item:nth-child(3) .toggle-switch')?.classList.contains('active') !== false
      },
      preferences: {
        theme: document.getElementById('theme')?.value || 'auto',
        language: document.getElementById('language')?.value || 'en',
        timezone: document.getElementById('timezone')?.value || '',
        autoRefresh: true
      },
      security: {
        currentPassword: document.getElementById('currentPassword')?.value || '',
        newPassword: document.getElementById('newPassword')?.value || ''
      }
    };
  }

  /**
   * Save settings
   */
  async saveSettings(isAutoSave = false) {
    // Collect current settings
    const newSettings = this.collectSettings();

    // Validate required fields
    if (!this.validateField('displayName', newSettings.profile.displayName)) {
      this.showError('Please fix validation errors before saving');
      return false;
    }

    if (!this.validateField('email', newSettings.profile.email)) {
      this.showError('Please fix validation errors before saving');
      return false;
    }

    // Validate password if provided
    if (newSettings.security.newPassword) {
      if (!this.validateField('password', newSettings.security.newPassword, 'newPassword')) {
        this.showError('Please fix password validation errors');
        return false;
      }
    }

    // Update settings
    this.settings = newSettings;

    try {
      // Save to API
      const response = await this.apiCall('/api/user/settings', {
        method: 'PUT',
        body: this.settings
      });

      if (response && response.success) {
        // Save to localStorage as backup
        storageService.set('flagfit_settings', {
          displayName: this.settings.profile.displayName,
          email: this.settings.profile.email,
          position: this.settings.profile.position,
          jerseyNumber: this.settings.profile.jerseyNumber,
          experienceLevel: this.settings.profile.experienceLevel,
          team: this.settings.profile.team,
          theme: this.settings.preferences.theme,
          language: this.settings.preferences.language,
          timezone: this.settings.preferences.timezone,
          notifications: this.settings.notifications,
          privacy: this.settings.privacy
        }, { usePrefix: false });

        // Update original settings
        this.originalSettings = JSON.parse(JSON.stringify(this.settings));
        this.hasUnsavedChanges = false;
        this.updateSaveButton();
        this.showUnsavedChangesWarning(false);

        if (!isAutoSave) {
          this.showSuccess('Settings saved successfully!');
        }

        this.notifyListeners();
        return true;
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('[Settings] Failed to save settings:', error);
      
      // Save to localStorage as fallback
      storageService.set('flagfit_settings', {
        displayName: this.settings.profile.displayName,
        email: this.settings.profile.email,
        position: this.settings.profile.position,
        jerseyNumber: this.settings.profile.jerseyNumber,
        experienceLevel: this.settings.profile.experienceLevel,
        team: this.settings.profile.team,
        theme: this.settings.preferences.theme,
        language: this.settings.preferences.language,
        timezone: this.settings.preferences.timezone,
        notifications: this.settings.notifications,
        privacy: this.settings.privacy
      }, { usePrefix: false });

      if (!isAutoSave) {
        this.showError('Failed to save settings. Changes saved locally.');
      }
      return false;
    }
  }

  /**
   * API call helper
   */
  async apiCall(endpoint, options = {}) {
    try {
      if (window.apiClient) {
        const { method = 'GET', body } = options;
        
        if (method === 'GET') {
          return await window.apiClient.get(endpoint);
        } else if (method === 'PUT' || method === 'POST') {
          return await window.apiClient[method.toLowerCase()](endpoint, body);
        }
      }

      // Fallback to fetch
      let url = endpoint;
      if (!url.startsWith('http')) {
        url = new URL(endpoint, window.location.origin).toString();
      }

      const fetchOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      // Add auth token if available
      if (window.authManager) {
        const user = window.authManager.getCurrentUser();
        if (user && user.access_token) {
          fetchOptions.headers['Authorization'] = `Bearer ${user.access_token}`;
        }
      }

      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[Settings] API call failed:', error);
      throw error;
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    if (window.authManager) {
      window.authManager.showSuccess(message);
    } else {
      console.log('[Settings]', message);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (window.authManager) {
      window.authManager.showError(message);
    } else {
      console.error('[Settings]', message);
    }
  }

  /**
   * Add event listener
   */
  addEventListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          settings: this.settings,
          hasUnsavedChanges: this.hasUnsavedChanges
        });
      } catch (error) {
        console.error('[Settings] Listener error:', error);
      }
    });
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    // Clear auto-save timeout
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    // Unsubscribe from real-time updates
    if (this.realtimeSubscription && this.realtimeSubscription.unsubscribe) {
      this.realtimeSubscription.unsubscribe();
    }

    this.listeners.clear();
    console.log('[Settings] Enhanced settings destroyed');
  }
}

// Export singleton instance
export const enhancedSettings = new EnhancedSettings();

