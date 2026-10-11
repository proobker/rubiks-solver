type Sentry = typeof import('@sentry/react');

const DSN = import.meta.env.VITE_SENTRY_DSN;

let sentry: Promise<Sentry | null> = Promise.resolve(null);

export function initErrorReporting(): void {
  if (!DSN || !import.meta.env.PROD) return;
  sentry = import('@sentry/react')
    .then((mod) => {
      mod.init({
        dsn: DSN,
        release: __APP_VERSION__,
        environment: import.meta.env.MODE,
      });
      return mod;
    })
    .catch(() => null);
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  void sentry.then((mod) => mod?.captureException(error, context ? { extra: context } : undefined));
}
