/**
 * API Service with Versioning Strategy
 * Provides a centralized API client with version management
 */

import env from '../config/environment';
import logger from './logger.service';
import sentryService from './sentry.service';

// API version configuration
const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2',
  CURRENT: 'v1'  // Current default version
};

class ApiService {
  constructor() {
    this.config = env.getConfig();
    this.baseURL = this.config.api.pocketbaseUrl;
    this.timeout = this.config.api.timeout;
    this.defaultVersion = API_VERSIONS.CURRENT;
    
    // Request interceptors
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    
    this.setupDefaultInterceptors();
  }

  setupDefaultInterceptors() {
    // Request logging interceptor
    this.addRequestInterceptor((config) => {
      const timer = logger.startTimer(`API ${config.method?.toUpperCase()} ${config.url}`);
      config.startTime = performance.now();
      config.timer = timer;
      
      logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        version: config.version,
        headers: this.sanitizeHeaders(config.headers)
      });
      
      return config;
    });

    // Response logging interceptor
    this.addResponseInterceptor(
      (response) => {
        const duration = performance.now() - (response.config?.startTime || 0);
        
        logger.logRequest(
          response.config?.url || '',
          response.config?.method?.toUpperCase() || '',
          response.status,
          `${duration.toFixed(2)}ms`
        );

        // Log to Sentry for monitoring
        sentryService.captureApiCall(
          response.config?.url || '',
          response.config?.method?.toUpperCase() || '',
          response.status,
          duration
        );

        response.config?.timer?.end();
        return response;
      },
      (error) => {
        const duration = performance.now() - (error.config?.startTime || 0);
        const status = error.response?.status || 0;
        
        logger.logRequest(
          error.config?.url || '',
          error.config?.method?.toUpperCase() || '',
          status,
          `${duration.toFixed(2)}ms`
        );

        // Log API errors to Sentry
        sentryService.captureException(error, {
          api: {
            url: error.config?.url,
            method: error.config?.method,
            status,
            duration
          }
        });

        error.config?.timer?.end();
        throw error;
      }
    );

    // Auth interceptor
    this.addRequestInterceptor((config) => {
      const token = this.getAuthToken();
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      return config;
    });

    // Version header interceptor
    this.addRequestInterceptor((config) => {
      const version = config.version || this.defaultVersion;
      config.headers = {
        ...config.headers,
        'API-Version': version,
        'Content-Type': 'application/json'
      };
      return config;
    });
  }

  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(onFulfilled, onRejected) {
    this.responseInterceptors.push({ onFulfilled, onRejected });
  }

  async request(config) {
    // Apply request interceptors
    let processedConfig = { ...config };
    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }

    // Build URL with version
    const url = this.buildVersionedUrl(processedConfig.url, processedConfig.version);
    
    // Create fetch options
    const fetchOptions = {
      method: processedConfig.method || 'GET',
      headers: processedConfig.headers || {},
      signal: this.createAbortSignal(processedConfig.timeout)
    };

    if (processedConfig.data) {
      fetchOptions.body = JSON.stringify(processedConfig.data);
    }

    try {
      // Make the request
      const response = await fetch(url, fetchOptions);
      
      // Create response object
      const responseObj = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: await this.parseResponse(response),
        config: processedConfig
      };

      // Apply response interceptors (success)
      let processedResponse = responseObj;
      for (const { onFulfilled } of this.responseInterceptors) {
        if (onFulfilled) {
          processedResponse = await onFulfilled(processedResponse);
        }
      }

      // Check if response is ok
      if (!response.ok) {
        throw new ApiError(processedResponse.data?.message || response.statusText, response.status, processedResponse);
      }

      return processedResponse;

    } catch (error) {
      // Apply response interceptors (error)
      for (const { onRejected } of this.responseInterceptors) {
        if (onRejected) {
          await onRejected(error);
        }
      }
      throw error;
    }
  }

  buildVersionedUrl(endpoint, version) {
    const apiVersion = version || this.defaultVersion;
    
    // Handle PocketBase API structure
    if (this.baseURL.includes('pocketbase') || endpoint.startsWith('/api/')) {
      // For PocketBase, we add version as a query parameter or header
      // since PocketBase has its own URL structure
      return `${this.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    }
    
    // For custom APIs, use standard versioned URLs
    const baseUrl = this.baseURL.replace(/\/$/, '');
    const versionedPath = `/api/${apiVersion}`;
    const cleanEndpoint = endpoint.replace(/^\//, '');
    
    return `${baseUrl}${versionedPath}/${cleanEndpoint}`;
  }

  createAbortSignal(timeout) {
    const controller = new AbortController();
    const timeoutMs = timeout || this.timeout;
    
    setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    
    return controller.signal;
  }

  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else if (contentType?.includes('text/')) {
      return await response.text();
    } else {
      return await response.blob();
    }
  }

  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    // Remove sensitive headers from logs
    delete sanitized.Authorization;
    delete sanitized.Cookie;
    return sanitized;
  }

  getAuthToken() {
    try {
      const authData = JSON.parse(localStorage.getItem('pocketbase_auth') || '{}');
      return authData.token;
    } catch {
      return null;
    }
  }

  // Convenience methods for different HTTP verbs
  async get(url, config = {}) {
    return this.request({ ...config, method: 'GET', url });
  }

  async post(url, data, config = {}) {
    return this.request({ ...config, method: 'POST', url, data });
  }

  async put(url, data, config = {}) {
    return this.request({ ...config, method: 'PUT', url, data });
  }

  async patch(url, data, config = {}) {
    return this.request({ ...config, method: 'PATCH', url, data });
  }

  async delete(url, config = {}) {
    return this.request({ ...config, method: 'DELETE', url });
  }

  // Versioned API methods
  async getV1(url, config = {}) {
    return this.get(url, { ...config, version: API_VERSIONS.V1 });
  }

  async postV1(url, data, config = {}) {
    return this.post(url, data, { ...config, version: API_VERSIONS.V1 });
  }

  async getV2(url, config = {}) {
    return this.get(url, { ...config, version: API_VERSIONS.V2 });
  }

  async postV2(url, data, config = {}) {
    return this.post(url, data, { ...config, version: API_VERSIONS.V2 });
  }

  // Version management
  setDefaultVersion(version) {
    if (Object.values(API_VERSIONS).includes(version)) {
      this.defaultVersion = version;
    } else {
      throw new Error(`Invalid API version: ${version}`);
    }
  }

  getDefaultVersion() {
    return this.defaultVersion;
  }

  getSupportedVersions() {
    return Object.values(API_VERSIONS).filter(v => v !== 'CURRENT');
  }

  // Health check with version support
  async healthCheck(version) {
    try {
      const response = await this.get('/health', { version, timeout: 5000 });
      return {
        status: 'healthy',
        version: response.data?.version || version,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Custom API Error class
class ApiError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

// Export singleton instance and classes
export const apiService = new ApiService();
export { ApiError, API_VERSIONS };
export default apiService;