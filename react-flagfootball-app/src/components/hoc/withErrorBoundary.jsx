import React, { memo } from 'react';
import ErrorBoundary from '../ErrorBoundary';

/**
 * Higher-order component that wraps components with error boundary
 * Provides enterprise-grade error handling and recovery
 */
const withErrorBoundary = (WrappedComponent, errorBoundaryProps = {}) => {
  const {
    fallback: CustomFallback = null,
    onError = null,
    isolate = false,
    resetKeys = [],
    resetOnPropsChange = true
  } = errorBoundaryProps;

  const ComponentWithErrorBoundary = memo((props) => {
    // Default fallback component
    const DefaultFallback = ({ error, resetError }) => (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        margin: '20px'
      }}>
        <h3 style={{ color: '#721c24', marginBottom: '16px' }}>
          Something went wrong
        </h3>
        <p style={{ color: '#721c24', marginBottom: '16px' }}>
          {process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'An unexpected error occurred. Please try again.'
          }
        </p>
        <button
          onClick={resetError}
          style={{
            padding: '8px 16px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
        {process.env.NODE_ENV === 'development' && (
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', color: '#721c24' }}>
              Error Details (Development)
            </summary>
            <pre style={{ 
              background: '#fff', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              marginTop: '8px'
            }}>
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    );

    const FallbackComponent = CustomFallback || DefaultFallback;

    const errorBoundaryConfig = {
      fallback: FallbackComponent,
      onError: (error, errorInfo) => {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
          console.group('🚨 Error Boundary Caught Error');
          console.error('Component:', WrappedComponent.displayName || WrappedComponent.name);
          console.error('Error:', error);
          console.error('Error Info:', errorInfo);
          console.groupEnd();
        }
        
        // Call custom error handler
        if (onError) {
          onError(error, errorInfo, props);
        }
        
        // In production, send to error reporting service
        if (process.env.NODE_ENV === 'production') {
          // Example: Sentry, LogRocket, etc.
          console.error('Production error in component:', {
            component: WrappedComponent.displayName || WrappedComponent.name,
            error: error.message,
            stack: error.stack,
            props: isolate ? {} : props, // Don't log props if isolate is true
            timestamp: new Date().toISOString()
          });
        }
      },
      isolate,
      resetKeys: resetOnPropsChange ? [JSON.stringify(props), ...resetKeys] : resetKeys
    };

    return (
      <ErrorBoundary {...errorBoundaryConfig}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  });

  // Set display name for debugging
  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ComponentWithErrorBoundary;
};

// Specialized error boundary HOCs
export const withPageErrorBoundary = (Component) => withErrorBoundary(Component, {
  fallback: ({ error, resetError }) => (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>😵</h1>
      <h2 style={{ marginBottom: '16px' }}>Page Error</h2>
      <p style={{ marginBottom: '24px', textAlign: 'center', maxWidth: '500px' }}>
        This page encountered an error and couldn't be displayed properly.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={resetError}
          style={{
            padding: '12px 24px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          style={{
            padding: '12px 24px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  ),
  isolate: true,
  resetOnPropsChange: false
});

export const withComponentErrorBoundary = (Component) => withErrorBoundary(Component, {
  fallback: ({ error, resetError }) => (
    <div style={{
      padding: '20px',
      background: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '4px',
      textAlign: 'center'
    }}>
      <p style={{ color: '#856404', marginBottom: '12px' }}>
        Component failed to load
      </p>
      <button
        onClick={resetError}
        style={{
          padding: '6px 12px',
          background: '#ffc107',
          color: '#212529',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Retry
      </button>
    </div>
  ),
  isolate: true
});

export const withSilentErrorBoundary = (Component) => withErrorBoundary(Component, {
  fallback: () => null, // Render nothing on error
  isolate: true,
  onError: (error, errorInfo, props) => {
    // Only log, don't show anything to user
    console.warn('Silent error boundary caught error:', error.message);
  }
});

export const withApiErrorBoundary = (Component) => withErrorBoundary(Component, {
  fallback: ({ error, resetError }) => (
    <div style={{
      padding: '20px',
      background: '#f8d7da',
      border: '1px solid #f5c6cb',
      borderRadius: '4px',
      textAlign: 'center'
    }}>
      <h4 style={{ color: '#721c24', marginBottom: '12px' }}>
        API Error
      </h4>
      <p style={{ color: '#721c24', marginBottom: '16px', fontSize: '14px' }}>
        {error.message.includes('fetch') || error.message.includes('network')
          ? 'Network error. Please check your connection.'
          : 'API request failed. Please try again.'
        }
      </p>
      <button
        onClick={resetError}
        style={{
          padding: '8px 16px',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Retry Request
      </button>
    </div>
  ),
  resetOnPropsChange: true
});

export default withErrorBoundary;