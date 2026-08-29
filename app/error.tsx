"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Route-level error boundary. Next renders this in place of the page when a
 * client render throws, so a single bad component no longer takes the whole
 * app down to a blank screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="w-6 h-6 text-[var(--text-faint)]" />
      <h1 className="font-serif text-2xl text-[var(--text)]">
        Something broke on this page
      </h1>
      <p className="max-w-md text-sm text-[var(--text-dim)]">{error.message}</p>
      {error.digest && (
        <p className="font-mono text-xs text-[var(--text-faint)]">
          Reference: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Try again
      </button>
    </div>
  );
}
