import React from 'react';
import { Button } from '@/components/ui/button';
import { reportError } from '@/lib/error-reporting';

const STORAGE_PREFIX = 'rubiks-solver';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function clearAppData(): void {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
    for (const key of keys) {
      if (key?.startsWith(STORAGE_PREFIX)) localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable; reloading is still the best we can do.
  }
  window.location.reload();
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
    reportError(error, { componentStack: info.componentStack });
  }

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-zinc-950 text-zinc-50 p-6">
        <div className="max-w-md w-full p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h1 className="font-serif text-xl font-medium mb-2">Something went wrong</h1>
          <p className="text-sm text-zinc-400">
            Reload to try again. If the problem keeps happening, resetting clears your saved cube,
            learning progress and solve times.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-4 text-xs text-red-300 whitespace-pre-wrap break-words font-mono bg-black/30 p-3 rounded max-h-64 overflow-auto">
              {error.stack ?? error.message}
            </pre>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => window.location.reload()}>
              Reload
            </Button>
            <Button size="sm" variant="soft" accent="danger" onClick={clearAppData}>
              Reset app data
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
