import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level safety net for uncaught render errors.
 * React 19 still requires class components for error boundaries —
 * there is no useErrorBoundary hook. The body is intentionally
 * minimal: log, render a fallback that says where to look.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[pipeline-kanban] uncaught render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="m-4 max-w-2xl rounded-md border border-destructive/40 bg-destructive/5 p-6 text-sm">
          <h1 className="mb-2 text-lg font-semibold">Something went wrong.</h1>
          <p className="mb-2 text-muted-foreground">
            The board crashed unexpectedly. Reload the page; if the error
            persists, open the browser console and report the stack trace.
          </p>
          <pre className="overflow-auto rounded bg-background/60 p-2 text-xs">
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
