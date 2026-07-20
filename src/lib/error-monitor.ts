/**
 * Global error logger — captures runtime errors and logs them.
 * In production, this can be connected to Sentry or similar.
 * For now, logs to console + DB (SystemLog table if available).
 */

interface ErrorContext {
  [key: string]: unknown;
}

export function logError(error: Error | string, context: ErrorContext = {}) {
  const timestamp = new Date().toISOString();
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? undefined : error.stack;

  // Console log (always)
  console.error(`[ERROR ${timestamp}] ${message}`, {
    ...context,
    stack,
  });

  // In production with Sentry, uncomment:
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: context });
  // }
}

export function logWarning(message: string, context: ErrorContext = {}) {
  const timestamp = new Date().toISOString();
  console.warn(`[WARN ${timestamp}] ${message}`, context);
}

export function logInfo(message: string, context: ErrorContext = {}) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[INFO ${new Date().toISOString()}] ${message}`, context);
  }
}
