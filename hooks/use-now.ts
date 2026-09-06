"use client";

import { useSyncExternalStore } from "react";

/** How often the shared clock advances. */
const TICK_MS = 30_000;

// useSyncExternalStore compares snapshots by identity, so the time has to be
// cached and replaced on a tick — returning Date.now() per call would
// re-render forever. One store serves every subscriber, and the interval only
// runs while something is watching it.
let snapshot = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);

  if (timer === null) {
    timer = setInterval(() => {
      snapshot = Date.now();
      for (const listener of listeners) listener();
    }, TICK_MS);
  }

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot(): number | null {
  return snapshot;
}

function getServerSnapshot(): number | null {
  return null;
}

/**
 * The current time in epoch milliseconds, refreshed every {@link TICK_MS}.
 * Reading `Date.now()` during render is impure: the value changes between
 * renders React expects to be idempotent. Reading it from a store keeps a
 * render a pure function of its snapshot.
 *
 * Null on the server, so callers must state what they show before the clock is
 * known rather than assuming a time the server could not have had.
 */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
