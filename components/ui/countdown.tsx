"use client";

import { useSyncExternalStore } from "react";

interface CountdownProps {
  targetDate: string;
  labels: {
    days: string;
    hrs: string;
    min: string;
    sec: string;
    windowOpen: string;
  };
  /** Visual density: compact fits inside dashboard cards, hero fits /launches. */
  variant?: "compact" | "hero";
}

let secondSnapshot = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribeSecondClock(listener: () => void) {
  listeners.add(listener);
  if (timer === null) {
    timer = setInterval(() => {
      secondSnapshot = Date.now();
      for (const l of listeners) l();
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSecondSnapshot(): number | null {
  return secondSnapshot;
}

function getServerSecondSnapshot(): number | null {
  return null;
}

export function Countdown({
  targetDate,
  labels,
  variant = "compact",
}: CountdownProps) {
  const now = useSyncExternalStore(
    subscribeSecondClock,
    getSecondSnapshot,
    getServerSecondSnapshot
  );
  const diff = now === null ? 0 : new Date(targetDate).getTime() - now;

  if (now !== null && diff <= 0) {
    return (
      <span className="text-xs font-mono text-[var(--accent-cyan)]">
        {labels.windowOpen}
      </span>
    );
  }

  const safeDiff = Math.max(0, diff);
  const units = [
    { value: Math.floor(safeDiff / 86_400_000), label: labels.days },
    { value: Math.floor((safeDiff / 3_600_000) % 24), label: labels.hrs },
    { value: Math.floor((safeDiff / 60_000) % 60), label: labels.min },
    { value: Math.floor((safeDiff / 1000) % 60), label: labels.sec },
  ];

  if (variant === "hero") {
    return (
      <div className="grid grid-cols-4 gap-2.5 max-w-xs">
        {units.map((u) => (
          <div
            key={u.label}
            className="inset-well rounded-lg px-3 py-2.5 text-center"
          >
            <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-[var(--text)]">
              {String(u.value).padStart(2, "0")}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-faint)] mt-0.5">
              {u.label}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1.5">
      {units.map((u) => (
        <div
          key={u.label}
          className="inset-well px-2.5 py-1.5 rounded-lg text-center min-w-[44px]"
        >
          <div className="text-sm font-mono font-bold tabular-nums text-[var(--text)]">
            {String(u.value).padStart(2, "0")}
          </div>
          <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-[var(--text-faint)]">
            {u.label}
          </div>
        </div>
      ))}
    </div>
  );
}
