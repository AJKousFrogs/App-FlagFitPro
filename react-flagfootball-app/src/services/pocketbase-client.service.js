import PocketBase from 'pocketbase';
import { COLLECTIONS } from '../config/collections.js';

/**
 * PocketBase Service for FlagFit Pro
 * Replaces Supabase functionality with PocketBase equivalent
 */
class PocketBaseService {
  constructor() {
    const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL || import.meta.env.VITE_DATABASE_URL || process.env.POCKETBASE_URL || '';
    if (!pocketbaseUrl) {
      console.warn('No PocketBase URL configured. Using fallback localhost for development.');
    }
    this.pb = new PocketBase(pocketbaseUrl || 'http://127.0.0.1:8090');
    this.authStore = this.pb.authStore;
    this.pendingRequests = new Map();
  }

  // Authentication Methods
  /**
   * Sign up a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Created user record
   */
  async signUp(userData) {
    try {
      // Use minimal required fields only
      const userPayload = {
        email: userData.email,
        password: userData.password,
        passwordConfirm: userData.password
      };
      
      // Add name only if we have first/last name data
      if (userData.firstName || userData.lastName) {
        userPayload.name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
      }
      
      console.log('Creating user with minimal data:', {
        email: userData.email,
        hasPassword: !!userData.password,
        hasName: !!userPayload.name
      });
      
      const record = await this.pb.collection(COLLECTIONS.USERS).create(userPayload);
      
      console.log('User created successfully:', record.email);
      
      // Return user without auto-login to avoid authentication issues
      console.log('Registration successful, skipping auto-login for now');
      
      return {
        user: record,
        token: null,
        requiresLogin: true
      };
    } catch (error) {
      console.error('SignUp error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        response: error.response
      });
      
      // Handle specific PocketBase validation errors
      if (error.data && error.data.email) {
        if (error.data.email.code === 'validation_invalid_email') {
          throw new Error('This email address is already registered. Please use a different email or try logging in.');
        }
        throw new Error(`Email error: ${error.data.email.message}`);
      }
      if (error.data && error.data.password) {
        throw new Error(`Password error: ${error.data.password.message}`);
      }
      if (error.status === 400) {
        if (error.message.includes('create record')) {
          throw new Error('Registration failed. The email might already be in use. Please try a different email.');
        }
        if (error.message.includes('invalid formatting')) {
          throw new Error('Registration data format error. Please check all fields and try again.');
        }
      }
      
      const errorMessage = this.handleConnectionError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Sign in user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User session data
   */
  async signIn(email, password) {
    const requestKey = `auth:${email}`;
    
    // Prevent duplicate requests
    if (this.pendingRequests.has(requestKey)) {
      console.log('Login request already pending for:', email);
      return this.pendingRequests.get(requestKey);
    }
    
    const loginPromise = this._performLogin(email, password);
    this.pendingRequests.set(requestKey, loginPromise);
    
    try {
      const result = await loginPromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }
  
  async _performLogin(email, password) {
    try {
      console.log('Attempting login with email:', email);
      
      // Clear all pending requests before login attempt
      this.clearPendingRequests();
      
      const authData = await this.pb.collection(COLLECTIONS.USERS).authWithPassword(email, password);
      
      console.log('Login successful:', {
        user: authData.record?.email,
        hasToken: !!authData.token
      });
      
      return {
        user: authData.record,
        token: authData.token
      };
    } catch (error) {
      console.error('PocketBase signIn error:', {
        message: error.message,
        status: error.status,
        data: error.data
      });
      
      // Handle specific authentication errors
      if (error.status === 400) {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
      
      const errorMessage = this.handleConnectionError(error);
      throw new Error(`Login failed: ${errorMessage}`);
    }
  }

  /**
   * Sign out user
   * @returns {Promise<void>}
   */
  async signOut() {
    this.pb.authStore.clear();
    // Clear all pending requests when user signs out
    this.clearPendingRequests();
  }

  /**
   * Clear all pending requests
   */
  clearPendingRequests() {
    console.log('Clearing all pending requests');
    this.pendingRequests.clear();
  }

  /**
   * Get current user
   * @returns {Promise<Object|null>} - Current user or null
   */
  async getCurrentUser() {
    if (!this.authStore.isValid) {
      return null;
    }
    return this.authStore.model;
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated user record
   */
  async updateProfile(profileData) {
    try {
      const record = await this.pb.collection(COLLECTIONS.USERS).update(this.authStore.model.id, profileData);
      return { user: record };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Database Operations
  /**
   * Create a record in a collection
   * @param {string} collection - Collection name
   * @param {Object} data - Record data
   * @returns {Promise<Object>} - Created record
   */
  async create(collection, data) {
    try {
      const record = await this.pb.collection(collection).create(data);
      return { data: record, error: null };
    } catch (error) {
      const errorMessage = this.handleConnectionError(error);
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Get records from a collection
   * @param {string} collection - Collection name
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Records and metadata
   */
  async getList(collection, options = {}) {
    const { page = 1, perPage = 50, sort = '-created', filter = '' } = options;
    const requestKey = `getList:${collection}:${page}:${perPage}:${sort}:${filter}:${this.authStore.model?.id || 'anonymous'}`;
    
    // Check for pending requests with a shorter timeout
    if (this.pendingRequests.has(requestKey)) {
      const pendingPromise = this.pendingRequests.get(requestKey);
      console.log(`Reusing pending ${collection} request`);
      return pendingPromise;
    }
    
    const requestPromise = this._performGetList(collection, { page, perPage, sort, filter });
    this.pendingRequests.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up with a slight delay to allow rapid subsequent calls
      setTimeout(() => {
        this.pendingRequests.delete(requestKey);
      }, 100);
    }
  }
  
  async _performGetList(collection, { page, perPage, sort, filter }) {
    try {
      console.log(`Fetching ${collection} with filter: ${filter}`);
      
      const records = await this.pb.collection(collection).getList(page, perPage, {
        sort,
        filter
      });
      
      console.log(`Successfully fetched ${records.items.length} ${collection} records`);
      return { data: records.items, count: records.totalItems, error: null };
    } catch (error) {
      console.error(`PocketBase error fetching ${collection}:`, {
        message: error.message,
        status: error.status,
        collection,
        filter
      });
      
      const errorMessage = this.handleConnectionError(error);
      return { data: [], count: 0, error: errorMessage };
    }
  }

  /**
   * Get a single record by ID
   * @param {string} collection - Collection name
   * @param {string} id - Record ID
   * @returns {Promise<Object>} - Record data
   */
  async getOne(collection, id) {
    try {
      const record = await this.pb.collection(collection).getOne(id);
      return { data: record, error: null };
    } catch (error) {
      const errorMessage = this.handleConnectionError(error);
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Update a record
   * @param {string} collection - Collection name
   * @param {string} id - Record ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated record
   */
  async update(collection, id, data) {
    try {
      const record = await this.pb.collection(collection).update(id, data);
      return { data: record, error: null };
    } catch (error) {
      const errorMessage = this.handleConnectionError(error);
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Delete a record
   * @param {string} collection - Collection name
   * @param {string} id - Record ID
   * @returns {Promise<Object>} - Deletion result
   */
  async delete(collection, id) {
    try {
      await this.pb.collection(collection).delete(id);
      return { data: { success: true }, error: null };
    } catch (error) {
      const errorMessage = this.handleConnectionError(error);
      return { data: null, error: errorMessage };
    }
  }

  // Real-time subscriptions (PocketBase equivalent)
  /**
   * Subscribe to real-time updates
   * @param {string} collection - Collection name
   * @param {Function} callback - Callback function for updates
   * @returns {Function} - Unsubscribe function
   */
  subscribe(collection, callback) {
    return this.pb.collection(collection).subscribe('*', callback);
  }

  /**
   * Subscribe to specific record changes
   * @param {string} collection - Collection name
   * @param {string} recordId - Record ID
   * @param {Function} callback - Callback function for updates
   * @returns {Function} - Unsubscribe function
   */
  subscribeToRecord(collection, recordId, callback) {
    return this.pb.collection(collection).subscribe(recordId, callback);
  }

  // File upload
  /**
   * Upload a file
   * @param {File} file - File to upload
   * @returns {Promise<Object>} - Upload result
   */
  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const record = await this.pb.collection('files').create(formData);
      return { data: record, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  // Utility methods
  /**
   * Get file URL
   * @param {string} collection - Collection name
   * @param {string} recordId - Record ID
   * @param {string} filename - Filename
   * @returns {string} - File URL
   */
  getFileUrl(collection, recordId, filename) {
    return this.pb.files.getUrl(collection, recordId, filename);
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} - Authentication status
   */
  isAuthenticated() {
    return this.authStore.isValid;
  }

  /**
   * Get authentication token
   * @returns {string|null} - Auth token
   */
  getToken() {
    return this.authStore.token;
  }

  /**
   * Set authentication token
   * @param {string} token - Auth token
   */
  setToken(token) {
    this.authStore.save(token, this.authStore.model);
  }

  /**
   * Handle connection errors gracefully
   * @param {Error} error - The error object
   * @returns {string} - User-friendly error message
   */
  handleConnectionError(error) {
    if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
      return 'Unable to connect to server. Please check your connection and try again.';
    }
    if (error.status === 404) {
      return 'Collection not found. This feature may not be configured yet.';
    }
    if (error.status === 401) {
      return 'Authentication required. Please log in again.';
    }
    if (error.status === 403) {
      return 'Access denied. You do not have permission for this action.';
    }
    return error.message || 'An unexpected error occurred.';
  }
}

// Export singleton instance
export const pocketbaseService = new PocketBaseService();
export default pocketbaseService; 