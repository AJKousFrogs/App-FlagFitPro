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
import { logger } from '../../logger.js';

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

    // Try to get current user ID - wait for auth if needed
    this.currentUserId = await this.getCurrentUserIdAsync();
    
    // Continue initialization even without user ID (for guest mode or when auth is loading)
    // The component can still work with localStorage-only settings
    if (!this.currentUserId) {
      logger.warn('[Settings] No user ID found - continuing with local settings only');
    }

    // Load initial settings
    await this.loadSettings();

    // Setup real-time subscription (only if we have a user ID)
    if (this.options.enableRealtime && this.currentUserId) {
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

    logger.info('[Settings] Enhanced settings initialized', this.currentUserId ? `(User: ${this.currentUserId})` : '(Local mode)');
  }

  /**
   * Get current user ID synchronously
   */
  getCurrentUserId() {
    try {
      // Try window.authManager first
      if (window.authManager) {
        const user = window.authManager.getCurrentUser();
        if (user) {
          return user?.id || user?.user_id;
        }
      }

      // Try Supabase client directly
      if (window.supabase) {
        try {
          const { createClient } = window.supabase;
          if (createClient && window._env?.SUPABASE_URL && window._env?.SUPABASE_ANON_KEY) {
            const supabase = createClient(window._env.SUPABASE_URL, window._env.SUPABASE_ANON_KEY);
            // Note: getSession() is async, but we can't await here
            // This is handled in getCurrentUserIdAsync()
          }
        } catch (e) {
          // Supabase not available
        }
      }

      // Try localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          return user?.id || user?.user_id;
        } catch (e) {
          // Invalid JSON
        }
      }

      // Try flagfit_auth storage
      const flagfitAuth = localStorage.getItem('flagfit_auth');
      const flagfitUser = localStorage.getItem('flagfit_user');
      if (flagfitAuth === 'true' && flagfitUser) {
        try {
          const user = JSON.parse(flagfitUser);
          return user?.id || user?.user_id;
        } catch (e) {
          // Invalid JSON
        }
      }

      return null;
    } catch (error) {
      logger.warn('[Settings] Failed to get user ID:', error);
      return null;
    }
  }

  /**
   * Get current user ID asynchronously (waits for auth if needed)
   */
  async getCurrentUserIdAsync() {
    // First try synchronous method
    const syncUserId = this.getCurrentUserId();
    if (syncUserId) {
      return syncUserId;
    }

    // Wait for authManager to initialize (max 3 seconds)
    if (!window.authManager) {
      const maxWait = 3000;
      const startTime = Date.now();
      
      while (!window.authManager && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (window.authManager) {
        // Wait for authManager to finish initializing
        if (window.authManager.waitForInit && typeof window.authManager.waitForInit === 'function') {
          await window.authManager.waitForInit(2000);
        }
        
        const user = window.authManager.getCurrentUser();
        if (user) {
          return user?.id || user?.user_id;
        }
      }
    }

    // Try Supabase client directly
    try {
      if (window.supabase && window._env?.SUPABASE_URL && window._env?.SUPABASE_ANON_KEY) {
        const { createClient } = window.supabase;
        if (createClient) {
          const supabase = createClient(window._env.SUPABASE_URL, window._env.SUPABASE_ANON_KEY);
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            return session.user.id;
          }
        }
      }
    } catch (error) {
      // Supabase not available or error
      logger.debug('[Settings] Supabase auth check failed:', error);
    }

    // Try importing supabase-client if available
    try {
      const { getSupabase } = await import('../services/supabase-client.js');
      const supabase = getSupabase();
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          return session.user.id;
        }
      }
    } catch (error) {
      // Module not available
      logger.debug('[Settings] Supabase client import failed:', error);
    }

    return null;
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
      logger.warn('[Settings] Failed to load from API, using localStorage:', error);
    }

    // Fallback to localStorage
    const savedSettings = storageService.get('flagfit_settings', {}, { usePrefix: false });
    
    // Try to get user data from various sources
    let user = {};
    if (window.authManager?.getCurrentUser) {
      user = window.authManager.getCurrentUser() || {};
    } else {
      // Try localStorage fallbacks
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          user = JSON.parse(userData);
        } else {
          const flagfitUser = localStorage.getItem('flagfit_user');
          if (flagfitUser) {
            user = JSON.parse(flagfitUser);
          }
        }
      } catch (e) {
        // Invalid JSON, use empty object
      }
    }

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

      logger.info('[Settings] Real-time subscription active');
    } catch (error) {
      logger.warn('[Settings] Failed to setup real-time subscription:', error);
    }
  }

  /**
   * Handle real-time settings updates
   */
  handleRealtimeUpdate(payload) {
    const eventType = payload.eventType || 'UPDATE';
    const settings = payload.new || payload.old;

    if (!settings || settings.user_id !== this.currentUserId) return;

    logger.debug('[Settings] Real-time update:', eventType, settings);

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

    // Validate all required fields and collect errors
    const validationErrors = [];
    let firstInvalidField = null;

    // Validate display name
    if (!this.validateField('displayName', newSettings.profile.displayName)) {
      const displayNameField = document.getElementById('displayName');
      if (displayNameField) {
        validationErrors.push('Display Name');
        if (!firstInvalidField) {
          firstInvalidField = displayNameField;
        }
      }
    }

    // Validate email
    if (!this.validateField('email', newSettings.profile.email)) {
      const emailField = document.getElementById('email');
      if (emailField) {
        validationErrors.push('Email');
        if (!firstInvalidField) {
          firstInvalidField = emailField;
        }
      }
    }

    // Validate password if provided
    if (newSettings.security.newPassword) {
      if (!this.validateField('password', newSettings.security.newPassword, 'newPassword')) {
        const passwordField = document.getElementById('newPassword');
        if (passwordField) {
          validationErrors.push('New Password');
          if (!firstInvalidField) {
            firstInvalidField = passwordField;
          }
        }
      }
    }

    // If there are validation errors, show them and focus the first invalid field
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.length === 1
        ? `Please fix the ${validationErrors[0]} field before saving`
        : `Please fix the following fields before saving: ${validationErrors.join(', ')}`;
      
      this.showError(errorMessage);
      
      // Scroll to and focus the first invalid field
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalidField.focus();
        
        // Highlight the field briefly
        firstInvalidField.classList.add('invalid');
        setTimeout(() => {
          // Keep the invalid class but ensure error is visible
          const errorElement = document.getElementById(`${firstInvalidField.id}-error`);
          if (errorElement) {
            errorElement.style.display = 'block';
          }
        }, 100);
      }
      
      return false;
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
      logger.error('[Settings] Failed to save settings:', error);
      
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
      logger.error('[Settings] API call failed:', error);
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
      logger.info('[Settings]', message);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (window.authManager && typeof window.authManager.showError === 'function') {
      window.authManager.showError(message);
    } else {
      logger.error('[Settings]', message);
      
      // Show a visible error notification if authManager is not available
      this.showErrorNotification(message);
    }
  }

  /**
   * Show error notification (fallback when authManager is not available)
   */
  showErrorNotification(message) {
    // Remove any existing error notification
    const existing = document.getElementById('settings-error-notification');
    if (existing) {
      existing.remove();
    }

    // Create error notification element using DOM methods instead of innerHTML
    const notification = document.createElement('div');
    notification.id = 'settings-error-notification';
    notification.className = 'settings-error-notification';
    notification.setAttribute('role', 'alert');
    
    const content = document.createElement('div');
    content.className = 'settings-error-content';
    
    const icon = document.createElement('span');
    icon.className = 'settings-error-icon';
    icon.textContent = '⚠️';
    
    const messageEl = document.createElement('span');
    messageEl.className = 'settings-error-message';
    messageEl.textContent = message; // Safe: message should be escaped by caller
    
    const closeButton = document.createElement('button');
    closeButton.className = 'settings-error-close';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => notification.remove());
    
    content.appendChild(icon);
    content.appendChild(messageEl);
    content.appendChild(closeButton);
    notification.appendChild(content);

    // Add styles if not already present
    if (!document.getElementById('settings-error-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'settings-error-notification-styles';
      style.textContent = `
        .settings-error-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #ef4444;
          color: white;
          padding: 16px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10000;
          max-width: 400px;
          animation: slideInRight 0.3s ease-out;
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .settings-error-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .settings-error-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .settings-error-message {
          flex: 1;
          line-height: 1.5;
        }
        .settings-error-close {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          opacity: 0.8;
        }
        .settings-error-close:hover {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
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
        logger.error('[Settings] Listener error:', error);
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
    logger.info('[Settings] Enhanced settings destroyed');
  }
}

// Export singleton instance
export const enhancedSettings = new EnhancedSettings();

