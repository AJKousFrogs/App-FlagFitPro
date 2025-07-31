import React, { Component } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';

class BackupErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isRecovering: false 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to console for debugging
    console.error('Backup Error Boundary caught an error:', error, errorInfo);

    // In a real app, you would send this to an error reporting service
    // this.logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isRecovering: true 
    });

    // Force a re-render of the child components
    setTimeout(() => {
      this.setState({ isRecovering: false });
    }, 100);
  };

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isRecovering: false 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              🚨 Backup Operation Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-red-700">
                An error occurred during the backup operation. This could be due to:
              </p>
              
              <ul className="list-disc list-inside text-red-700 space-y-1 ml-4">
                <li>Network connectivity issues</li>
                <li>Insufficient storage space</li>
                <li>Database connection problems</li>
                <li>Permission issues</li>
                <li>Corrupted data</li>
              </ul>

              <div className="bg-red-100 border border-red-300 rounded p-3">
                <p className="text-sm text-red-800 font-mono">
                  {this.state.error && this.state.error.toString()}
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={this.handleRetry}
                  disabled={this.state.isRecovering}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {this.state.isRecovering ? 'Retrying...' : 'Retry Operation'}
                </Button>
                
                <Button 
                  onClick={this.handleReset}
                  variant="outline"
                >
                  Reset
                </Button>
              </div>

              <div className="text-xs text-red-600">
                <p>If this error persists, please contact support with the error details above.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (this.state.isRecovering) {
      return (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
              <p className="text-yellow-800">Recovering from error...</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default BackupErrorBoundary; 