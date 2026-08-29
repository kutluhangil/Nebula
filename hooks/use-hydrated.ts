"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  // Hydration happens exactly once and never reverts, so there is nothing to
  // subscribe to — the server/client snapshot pair carries the whole signal.
  return () => {};
}

/**
 * False during server render and the hydration pass, true afterwards. Used by
 * components that read localStorage-backed state (zustand `persist`), whose
 * value cannot match the server-rendered markup.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
