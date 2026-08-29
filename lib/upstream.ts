/**
 * Timeout for outbound requests to third-party data sources.
 *
 * Without one, a source that accepts the connection and then stalls holds the
 * route open until the platform's own function timeout, turning one slow
 * upstream into a slow page. AbortSignal.timeout rejects with a TimeoutError,
 * which the routes surface as an actionable 502.
 */
export const UPSTREAM_TIMEOUT_MS = 10_000;

/** Adds the standard timeout to a fetch init, preserving anything already set. */
export function withTimeout(init: RequestInit = {}): RequestInit {
  return { ...init, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) };
}

/** Turns an upstream failure into a message that names the source and cause. */
export function upstreamError(source: string, error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "TimeoutError") {
      return `${source} did not respond within ${UPSTREAM_TIMEOUT_MS / 1000}s`;
    }
    return error.message;
  }
  return `${source} request failed`;
}
