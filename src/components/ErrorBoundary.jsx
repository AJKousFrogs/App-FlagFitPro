// ErrorBoundary.jsx - Comprehensive error boundary with logging and recovery
// Addresses error handling improvements from code review

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from '../utils/icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      retryCount: 0,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Generate unique event ID for tracking
    const eventId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
      eventId
    });

    // Log to external service (if available)
    this.logError(error, errorInfo, eventId);
    
    // Track error in analytics
    this.trackError(error, errorInfo, eventId);
  }

  logError = (error, errorInfo, eventId) => {
    try {
      // Log to console with full details
      console.group(`🚨 Error Boundary - Event ID: ${eventId}`);
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Props:', this.props);
      console.error('Timestamp:', new Date().toISOString());
      console.groupEnd();

      // Store error in localStorage for debugging
      const errorLog = {
        eventId,
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        componentStack: errorInfo.componentStack,
        props: this.props,
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getCurrentUserId()
      };

      // Store in localStorage (limit to last 10 errors)
      const errorHistory = JSON.parse(localStorage.getItem('errorBoundaryLogs') || '[]');
      errorHistory.unshift(errorLog);
      errorHistory.splice(10); // Keep only last 10 errors
      localStorage.setItem('errorBoundaryLogs', JSON.stringify(errorHistory));

      // Send to external logging service if available
      if (window.errorReportingService) {
        window.errorReportingService.logError(errorLog);
      }
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  trackError = (error, errorInfo, eventId) => {
    try {
      // Track error in analytics
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: false,
          event_id: eventId
        });
      }

      // Custom analytics tracking
      if (window.analytics) {
        window.analytics.track('Error Boundary Triggered', {
          eventId,
          errorName: error.name,
          errorMessage: error.message,
          componentStack: errorInfo.componentStack.split('\n')[0],
          timestamp: new Date().toISOString()
        });
      }
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  };

  getCurrentUserId = () => {
    try {
      const userData = sessionStorage.getItem('user');
      return userData ? JSON.parse(userData).id : 'anonymous';
    } catch {
      return 'anonymous';
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      retryCount: prevState.retryCount + 1,
      showDetails: false
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const { error, errorInfo, eventId } = this.state;
    const reportData = {
      eventId,
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Create mailto link with error details
    const subject = encodeURIComponent(`Bug Report - Error ${eventId}`);
    const body = encodeURIComponent(`
Error Report Details:
====================

Event ID: ${eventId}
Timestamp: ${reportData.timestamp}
URL: ${reportData.url}
User Agent: ${reportData.userAgent}

Error Message: ${reportData.error}

Component Stack:
${reportData.componentStack}

Error Stack:
${reportData.stack}

Additional Context:
Please describe what you were doing when this error occurred.
    `);

    window.open(`mailto:support@flagfitpro.com?subject=${subject}&body=${body}`);
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, eventId, retryCount, showDetails } = this.state;
      const { fallback: CustomFallback, level = 'page' } = this.props;

      // Use custom fallback if provided
      if (CustomFallback) {
        return <CustomFallback 
          error={error} 
          retry={this.handleRetry} 
          eventId={eventId}
          retryCount={retryCount}
        />;
      }

      // Different UI based on error boundary level
      const isComponentLevel = level === 'component';
      const containerClass = isComponentLevel 
        ? 'bg-red-50 border border-red-200 rounded-lg p-4 m-2'
        : 'min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4';

      return (
        <div className={containerClass}>
          <div className={`bg-white rounded-2xl shadow-lg border border-red-200 p-8 max-w-2xl w-full ${isComponentLevel ? 'max-w-md' : ''}`}>
            {/* Error Icon and Title */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className={`font-bold text-gray-900 mb-2 ${isComponentLevel ? 'text-lg' : 'text-2xl'}`}>
                {isComponentLevel ? 'Component Error' : 'Oops! Something went wrong'}
              </h1>
              <p className="text-gray-600 text-sm">
                {isComponentLevel 
                  ? 'This component encountered an error'
                  : 'We encountered an unexpected error. Don\'t worry, your data is safe.'
                }
              </p>
            </div>

            {/* Error Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Error Details</h3>
                <button
                  onClick={this.toggleDetails}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  {showDetails ? 'Hide' : 'Show'} Technical Details
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Event ID:</strong> {eventId}</p>
                <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
                {retryCount > 0 && (
                  <p><strong>Retry Attempts:</strong> {retryCount}</p>
                )}
              </div>

              {showDetails && (
                <div className="mt-4 p-3 bg-gray-100 rounded border text-xs font-mono">
                  <div className="mb-2">
                    <strong>Error:</strong> {error?.message}
                  </div>
                  <div className="mb-2">
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1 text-gray-700">
                      {errorInfo?.componentStack}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary Actions */}
              <div className={`flex ${isComponentLevel ? 'flex-col' : 'flex-col sm:flex-row'} gap-3`}>
                <button
                  onClick={this.handleRetry}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                
                {!isComponentLevel && (
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </button>
                )}
              </div>

              {/* Secondary Actions */}
              <div className="flex justify-center">
                <button
                  onClick={this.handleReportBug}
                  className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 transition-colors"
                >
                  <Bug className="w-4 h-4" />
                  Report this issue
                </button>
              </div>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>If this error persists, please contact support with Event ID: <strong>{eventId}</strong></p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component wrapper for easy usage
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Component-level error boundary
export const ComponentErrorBoundary = ({ children, fallback }) => (
  <ErrorBoundary level="component" fallback={fallback}>
    {children}
  </ErrorBoundary>
);

// Route-level error boundary
export const RouteErrorBoundary = ({ children, fallback }) => (
  <ErrorBoundary level="route" fallback={fallback}>
    {children}
  </ErrorBoundary>
);

// App-level error boundary
export const AppErrorBoundary = ({ children, fallback }) => (
  <ErrorBoundary level="app" fallback={fallback}>
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;