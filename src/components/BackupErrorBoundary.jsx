import React from 'react';

class BackupErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Backup Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          border: '1px solid red', 
          padding: '10px', 
          margin: '10px',
          background: '#fee' 
        }}>
          <h3>Backup System Error</h3>
          <p>Something went wrong with the backup system.</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default BackupErrorBoundary;