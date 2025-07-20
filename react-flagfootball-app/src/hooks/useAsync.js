import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for handling async operations
 * @param {Function} asyncFunction - The async function to execute
 * @param {boolean} immediate - Whether to execute the function immediately
 * @returns {Object} - Object containing data, loading, error states and execute function
 */
export const useAsync = (asyncFunction, immediate = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    execute
  };
}; 