import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-screen">
          <div className="error-boundary-card">
            <span className="error-icon" aria-hidden="true">⚛️</span>
            <h2>Quantum Anomaly Detected</h2>
            <p>Something unexpected went wrong in this timeline.</p>
            {this.state.error && (
              <pre className="error-trace">{this.state.error.message || String(this.state.error)}</pre>
            )}
            <button className="btn primary" onClick={this.handleReload}>
              Re-align Timeline (Reload)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
