import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-white p-6">
          <div className="max-w-lg w-full p-6 bg-red-500/10 border border-red-500/40 rounded-lg">
            <h1 className="text-lg font-bold text-red-400 mb-3">Something went wrong</h1>
            <pre className="text-xs text-zinc-300 whitespace-pre-wrap break-words font-mono bg-black/30 p-3 rounded">
              {this.state.error.message}
            </pre>
            <pre className="text-xs text-zinc-500 whitespace-pre-wrap break-words font-mono mt-3 max-h-64 overflow-auto">
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
