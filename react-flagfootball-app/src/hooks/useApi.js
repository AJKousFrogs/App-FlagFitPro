/**
 * Enhanced API Hook with Versioning Support
 * Provides React hooks for API calls with version management
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService, API_VERSIONS } from '../services/api.service.js';
import logger from '../services/logger.service.js';

/**
 * Enhanced useApi hook with versioning support
 * @param {string} url - API endpoint
 * @param {Object} options - Configuration options
 * @returns {Object} - API state and methods
 */
export const useApi = (url, options = {}) => {
  const {
    method = 'GET',
    data = null,
    version = API_VERSIONS.CURRENT,
    immediate = true,
    onSuccess,
    onError,
    retry = 3,
    retryDelay = 1000,
    ...requestConfig
  } = options;

  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
    status: null
  });

  const [retryCount, setRetryCount] = useState(0);

  const executeRequest = useCallback(async (requestData = data) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const config = {
        ...requestConfig,
        version,
        data: requestData
      };

      const response = await apiService.request({
        method,
        url,
        ...config
      });

      setState({
        data: response.data,
        loading: false,
        error: null,
        status: response.status
      });

      if (onSuccess) {
        onSuccess(response.data, response);
      }

      // Reset retry count on success
      setRetryCount(0);

      return response;

    } catch (error) {
      const shouldRetry = retryCount < retry && error.status >= 500;
      
      if (shouldRetry) {
        logger.warn(`API request failed, retrying (${retryCount + 1}/${retry})`, {
          url,
          method,
          error: error.message
        });

        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          executeRequest(requestData);
        }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        
        return;
      }

      setState({
        data: null,
        loading: false,
        error: error.message,
        status: error.status
      });

      if (onError) {
        onError(error);
      }

      logger.error(`API request failed after ${retryCount} retries`, {
        url,
        method,
        error: error.message,
        status: error.status
      });

      throw error;
    }
  }, [url, method, data, version, onSuccess, onError, retry, retryDelay, retryCount, requestConfig]);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate && url) {
      executeRequest();
    }
  }, [executeRequest, immediate, url]);

  const refetch = useCallback((newData) => {
    return executeRequest(newData);
  }, [executeRequest]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      status: null
    });
    setRetryCount(0);
  }, []);

  return {
    ...state,
    execute: executeRequest,
    refetch,
    reset,
    isIdle: !state.loading && !state.error && !state.data,
    isSuccess: !state.loading && !state.error && state.data !== null,
    isError: !state.loading && state.error !== null
  };
};

/**
 * Hook for versioned API calls
 * @param {string} url - API endpoint
 * @param {string} version - API version
 * @param {Object} options - Configuration options
 * @returns {Object} - API state and methods
 */
export const useVersionedApi = (url, version, options = {}) => {
  return useApi(url, { ...options, version });
};

/**
 * Hook for API mutations (POST, PUT, PATCH, DELETE)
 * @param {string} url - API endpoint
 * @param {Object} options - Configuration options
 * @returns {Object} - Mutation state and methods
 */
export const useMutation = (url, options = {}) => {
  const {
    method = 'POST',
    version = API_VERSIONS.CURRENT,
    onSuccess,
    onError,
    ...requestConfig
  } = options;

  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
    status: null
  });

  const mutate = useCallback(async (data, mutationOptions = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const config = {
        ...requestConfig,
        ...mutationOptions,
        version,
        data
      };

      const response = await apiService.request({
        method,
        url,
        ...config
      });

      setState({
        data: response.data,
        loading: false,
        error: null,
        status: response.status
      });

      if (onSuccess) {
        onSuccess(response.data, response);
      }

      return response;

    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error.message,
        status: error.status
      });

      if (onError) {
        onError(error);
      }

      throw error;
    }
  }, [url, method, version, onSuccess, onError, requestConfig]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      status: null
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
    isIdle: !state.loading && !state.error && !state.data,
    isSuccess: !state.loading && !state.error && state.data !== null,
    isError: !state.loading && state.error !== null
  };
};

/**
 * Hook for API health checks across versions
 * @returns {Object} - Health check state and methods
 */
export const useApiHealth = () => {
  const [healthStatus, setHealthStatus] = useState({});
  const [checking, setChecking] = useState(false);

  const checkHealth = useCallback(async (versions = API_VERSIONS) => {
    setChecking(true);
    const results = {};

    try {
      const versionList = Array.isArray(versions) ? versions : Object.values(versions).filter(v => v !== 'CURRENT');
      
      const healthChecks = versionList.map(async (version) => {
        try {
          const result = await apiService.healthCheck(version);
          return { version, ...result };
        } catch (error) {
          return {
            version,
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }
      });

      const healthResults = await Promise.all(healthChecks);
      
      healthResults.forEach(result => {
        results[result.version] = result;
      });

      setHealthStatus(results);
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
    } finally {
      setChecking(false);
    }

    return results;
  }, []);

  // Check health on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const isHealthy = useCallback((version) => {
    return healthStatus[version]?.status === 'healthy';
  }, [healthStatus]);

  const getOverallHealth = useCallback(() => {
    const statuses = Object.values(healthStatus);
    if (statuses.length === 0) return 'unknown';
    
    const healthy = statuses.filter(s => s.status === 'healthy').length;
    const total = statuses.length;
    
    if (healthy === total) return 'healthy';
    if (healthy === 0) return 'unhealthy';
    return 'degraded';
  }, [healthStatus]);

  return {
    healthStatus,
    checking,
    checkHealth,
    isHealthy,
    overallHealth: getOverallHealth(),
    isOverallHealthy: getOverallHealth() === 'healthy'
  };
};

// Legacy hook for backward compatibility
export const useApiRequest = useApi;

export default useApi;