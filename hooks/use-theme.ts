"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "nebula-theme";
const CHANGE_EVENT = "nebula-theme-change";

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

/**
 * The theme lives on the <html data-theme> attribute, written by the no-flash
 * inline script in the document head before React hydrates. That makes it
 * external state, so it is read through useSyncExternalStore rather than
 * mirrored into component state via an effect.
 */
function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

/** The server has no document, and the head script defaults to dark. */
function getServerSnapshot(): Theme {
  return "dark";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private mode / disabled) — theme still
      // applies for this session via the data-theme attribute.
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(readTheme() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}
