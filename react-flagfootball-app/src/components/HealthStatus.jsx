/**
 * Health Status Component
 * Displays application health status and metrics
 */

import React, { useState, useEffect } from 'react';
import { useApiHealth } from '../hooks/useApi';
// Removed direct import - will use dynamic import when needed

const HealthStatus = ({ minimal = false, className = '' }) => {
  const { healthStatus, checking, checkHealth, overallHealth, isOverallHealthy } = useApiHealth();
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        checkHealth().then(() => {
          setLastUpdated(new Date());
        });
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, checkHealth]);

  const handleManualRefresh = async () => {
    try {
      await checkHealth();
      setLastUpdated(new Date());
      logger.info('Health status manually refreshed');
    } catch (error) {
      logger.error('Failed to refresh health status', { error: error.message });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'unhealthy':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'degraded':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (minimal) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(overallHealth)}`}>
          {getStatusIcon(overallHealth)}
          <span className="ml-1 capitalize">{overallHealth}</span>
        </div>
        {checking && (
          <div className="w-3 h-3 border border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(overallHealth)}`}>
            {getStatusIcon(overallHealth)}
            <span className="ml-2 capitalize">{overallHealth}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-xs font-medium ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Auto: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          
          <button
            onClick={handleManualRefresh}
            disabled={checking}
            className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 disabled:opacity-50"
          >
            {checking ? (
              <div className="w-3 h-3 border border-blue-300 border-t-blue-600 rounded-full animate-spin mr-2" />
            ) : (
              <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Health Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Object.entries(healthStatus).map(([version, status]) => (
          <div key={version} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">API {version.toUpperCase()}</span>
              <div className={`flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(status.status)}`}>
                {getStatusIcon(status.status)}
                <span className="ml-1 capitalize">{status.status}</span>
              </div>
            </div>
            
            {status.error && (
              <div className="text-xs text-red-600 mb-2">
                Error: {status.error}
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              Last checked: {new Date(status.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Information */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-sm font-medium text-gray-500">Total Endpoints</div>
            <div className="text-lg font-semibold text-gray-900">
              {Object.keys(healthStatus).length}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-500">Healthy</div>
            <div className="text-lg font-semibold text-green-600">
              {Object.values(healthStatus).filter(s => s.status === 'healthy').length}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-500">Unhealthy</div>
            <div className="text-lg font-semibold text-red-600">
              {Object.values(healthStatus).filter(s => s.status === 'unhealthy').length}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-500">Last Updated</div>
            <div className="text-lg font-semibold text-gray-900">
              {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* Overall Status Message */}
      <div className="mt-4 p-3 rounded-lg bg-gray-50">
        <div className="text-sm text-gray-600">
          {isOverallHealthy ? (
            '✅ All systems are operational'
          ) : overallHealth === 'degraded' ? (
            '⚠️ Some systems are experiencing issues'
          ) : (
            '❌ System is experiencing problems'
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthStatus;