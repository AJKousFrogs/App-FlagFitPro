import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Simple console logging instead of service imports
    console.error('React Error Boundary caught an error:', error);
    console.error('Error info:', errorInfo);

    this.setState({
      error,
      errorInfo
    });
  }

  handleReportError = () => {
    // Fallback: open email client
    const subject = encodeURIComponent('Application Error Report');
    const body = encodeURIComponent(`
Error: ${this.state.error?.message || 'Unknown error'}
Stack: ${this.state.error?.stack || 'Not available'}
Component Stack: ${this.state.errorInfo?.componentStack || 'Not available'}
    `);
    window.location.href = `mailto:support@flagfitpro.com?subject=${subject}&body=${body}`;
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Something went wrong
                  </h2>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  We&apos;re sorry for the inconvenience. An unexpected error occurred while loading this page.
                </p>
                
                {this.state.error && (
                  <div className="bg-gray-50 p-3 rounded text-xs text-gray-700 font-mono">
                    {this.state.error.message}
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Reload Page
                </button>
                
                <button
                  onClick={this.handleReportError}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Report Error
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Error ID: Not available
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 