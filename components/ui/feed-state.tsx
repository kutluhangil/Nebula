"use client";

import { RotateCw, TriangleAlert, type LucideIcon } from "lucide-react";

/**
 * Turns a thrown value into the sentence a reader can act on. Upstream errors
 * arrive with the provider's own JSON body attached, which is the right thing
 * to keep for diagnosis and the wrong thing to lead with on screen.
 */
function technicalDetail(error: unknown, fallback?: string): string | null {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback ?? null;
}

interface FeedErrorProps {
  /** What failed, in a sentence, naming the source. */
  title: string;
  /** The thrown value. Shown verbatim, but behind a disclosure. */
  error?: unknown;
  /** Used when the failure carries no message of its own. */
  detailFallback?: string;
  icon?: LucideIcon;
  onRetry?: () => void;
  /** Disables the retry control while a refetch is in flight. */
  retrying?: boolean;
  className?: string;
}

/**
 * The single failure surface every feed-backed card renders. It states what is
 * unavailable, keeps the upstream text one click away, and offers a retry —
 * never a blank panel, a zero, or a raw JSON body as the headline.
 */
export function FeedError({
  title,
  error,
  detailFallback,
  icon: Icon = TriangleAlert,
  onRetry,
  retrying = false,
  className = "",
}: FeedErrorProps) {
  const detail = technicalDetail(error, detailFallback);

  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-4 p-8 text-center ${className}`}
    >
      <div className="w-10 h-10 rounded-full inset-well flex items-center justify-center">
        <Icon
          className="w-4 h-4 text-[var(--text-faint)]"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>

      <div className="space-y-2 max-w-sm">
        <p className="text-[var(--text)] text-sm font-medium">{title}</p>
        <p className="text-[var(--text-faint)] text-xs leading-relaxed">
          The feed answered with an error. Nothing below is being estimated in
          its place.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 w-full">
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={retrying}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-dim)] text-xs font-medium hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors disabled:opacity-50 tap"
          >
            <RotateCw
              className={`w-3 h-3 ${retrying ? "animate-spin" : ""}`}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            Retry
          </button>
        )}

        {detail && (
          <details className="w-full max-w-md text-left group">
            <summary className="cursor-pointer list-none text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--text-faint)] hover:text-[var(--text-dim)] transition-colors text-center">
              Technical detail
            </summary>
            <pre className="mt-3 inset-well p-3 text-[11px] leading-relaxed text-[var(--text-faint)] font-mono whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
              {detail}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
