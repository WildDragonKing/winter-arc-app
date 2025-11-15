import * as Sentry from '@sentry/react';

/**
 * Sentry Error Tracking Service
 *
 * Centralized Sentry configuration and error tracking utilities
 *
 * @module sentryService
 */

declare global {
  interface Window {
    SENTRY_RELEASE?: {
      id?: string;
    };
  }
}

interface SentryConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
  enabled?: boolean;
}

/**
 * Initialize Sentry with configuration from environment variables
 *
 * @param config - Optional configuration overrides
 * @returns boolean - true if Sentry was initialized successfully
 */
export function initializeSentry(config?: Partial<SentryConfig>): boolean {
  if (!isBrowserRuntime()) {
    return false;
  }

  const sentryDsn = config?.dsn ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  const hasDsn = Boolean(sentryDsn);
  const suppressionReason = getTelemetrySuppressionReason();

  if (suppressionReason && config?.enabled !== true) {
    console.warn(`[Sentry] Telemetry disabled (${suppressionReason})`);
    return false;
  }

  const isEnabled = config?.enabled ?? hasDsn;

  if (!isEnabled || !hasDsn) {
    if (!hasDsn && config?.enabled !== false) {
      console.warn('[Sentry] DSN not configured - error tracking disabled');
    }
    return false;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: config?.environment ?? process.env.NODE_ENV,
      release: config?.release ?? getReleaseId(),

      // Integrations
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Performance Monitoring
      tracesSampleRate:
        config?.tracesSampleRate ?? (process.env.NODE_ENV === 'production' ? 0.2 : 1.0),

      // Session Replay
      replaysSessionSampleRate: config?.replaysSessionSampleRate ?? 0.1,
      replaysOnErrorSampleRate: config?.replaysOnErrorSampleRate ?? 1.0,

      // Privacy
      sendDefaultPii: false,

      // Allow URLs - only send errors from our domains
      allowUrls: [
        /winterarc\.newrealm\.de/,
        /.*github\.io/,
        /localhost/,
      ],

      // Before send hook - filter sensitive data and handle 403s
      beforeSend(event, hint) {
        // Filter out potential sensitive data from URLs and breadcrumbs
        if (event.request?.url) {
          event.request.url = filterSensitiveData(event.request.url);
        }

        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
            ...breadcrumb,
            message: breadcrumb.message ? filterSensitiveData(breadcrumb.message) : undefined,
          }));
        }

        // Handle Sentry 403 errors gracefully
        const originalException = hint?.originalException;
        if (originalException && typeof originalException === 'object' && 'status' in originalException) {
          const status = (originalException as { status?: number }).status;
          if (status === 403) {
            console.error('⚠️ Sentry: 403 Forbidden - Check your DSN and project permissions');
            // Don't send this error to avoid infinite loops
            return null;
          }
        }

        return event;
      },
    });

    console.warn('[Sentry] ✅ Error tracking initialized');

    // Setup global error handlers
    setupGlobalErrorHandlers();

    return true;
  } catch (error) {
    console.error('[Sentry] ❌ Failed to initialize:', error);
    return false;
  }
}

/**
 * Setup global error handlers for unhandled errors and promise rejections
 */
function setupGlobalErrorHandlers(): void {
  // Unhandled errors
  window.addEventListener('error', (event) => {
    Sentry.captureException(event.error || new Error(event.message), {
      contexts: {
        errorEvent: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      },
    });
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    Sentry.captureException(event.reason || new Error('Unhandled Promise Rejection'), {
      contexts: {
        promiseRejection: {
          reason: String(event.reason),
        },
      },
    });
  });
}

/**
 * Filter sensitive data from strings (tokens, keys, passwords, etc.)
 */
function filterSensitiveData(text: string): string {
  return text
    .replace(/([?&])(token|key|password|secret|auth)=[^&]*/gi, '$1$2=REDACTED')
    .replace(/Bearer\s+[^\s]+/gi, 'Bearer REDACTED')
    .replace(/AIza[0-9A-Za-z_-]{35}/g, 'API_KEY_REDACTED');
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error | unknown, context?: Record<string, unknown>): void {
  if (shouldSuppressTelemetry()) {
    return; // Don't send errors when telemetry is disabled
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  if (shouldSuppressTelemetry()) {
    return; // Don't send messages when telemetry is disabled
  }

  Sentry.captureMessage(message, level);
}

/**
 * Set user context for Sentry
 */
export function setUser(user: { id: string; email?: string; nickname?: string } | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.nickname,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info'
): void {
  Sentry.addBreadcrumb({
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a performance span
 */
export function startSpan<T>(
  name: string,
  op: string,
  callback: () => T
): T {
  return Sentry.startSpan(
    {
      name,
      op,
    },
    callback
  );
}

/**
 * Export Sentry for advanced usage
 */
export { Sentry };

function isBrowserRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const runtime = process.env.NEXT_RUNTIME;
  if (runtime === 'edge' || runtime === 'nodejs') {
    return false;
  }

  return true;
}

function getReleaseId(): string | undefined {
  return typeof window === 'undefined' ? undefined : window.SENTRY_RELEASE?.id;
}

function shouldSuppressTelemetry(): boolean {
  return getTelemetrySuppressionReason() !== null;
}

function getTelemetrySuppressionReason(): string | null {
  if (process.env.NODE_ENV === 'test') {
    return 'test environment';
  }

  if (process.env.NEXT_PUBLIC_SENTRY_DISABLE === 'true') {
    return 'NEXT_PUBLIC_SENTRY_DISABLE flag';
  }

  return null;
}

