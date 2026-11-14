"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { enUS, tr as trLocale } from "date-fns/locale";
import { DICTIONARIES, type Locale } from "@/lib/dictionaries";

const STORAGE_KEY = "nebula-locale";
const CHANGE_EVENT = "nebula-locale-change";

function readLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "tr" || saved === "en") return saved;
  } catch {
    // Private browsing or blocked storage — fall back to English.
  }
  return "en";
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

function getServerSnapshot(): Locale {
  return "en";
}

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, readLocale, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    document.documentElement.lang = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable — active for the session only.
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(readLocale() === "en" ? "tr" : "en");
  }, [setLocale]);

  return {
    locale,
    setLocale,
    toggleLocale,
    t: DICTIONARIES[locale],
    dateLocale: locale === "tr" ? trLocale : enUS,
  };
}
