import React from 'react';
import { Button } from '../ui/Button';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      return (
        <div role="alert" className="container-content flex min-h-[60vh] flex-col justify-center py-16">
          <p className="eyebrow">Error</p>
          <h1 className="mt-3 font-serif text-3xl text-ink">This page didn’t load.</h1>
          <p className="mt-3 max-w-prose text-sm text-muted">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={this.handleReset}>Try again</Button>
            <Button variant="secondary" onClick={() => window.location.replace('/')}>
              Go to home
            </Button>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}

export default ErrorBoundary;
