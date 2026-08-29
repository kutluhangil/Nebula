"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "nebula-location";

export interface Coords {
  lat: number;
  lon: number;
}

export type LocationStatus =
  | "idle"
  | "prompting"
  | "granted"
  | "denied"
  | "unavailable";

interface StoredLocation extends Coords {
  savedAt: number;
}

// The stored location is external state (localStorage), read through
// useSyncExternalStore. getSnapshot must be referentially stable between
// changes or React re-renders forever, so the parsed value is cached and only
// recomputed when the raw string actually differs.
let cachedRaw: string | null = null;
let cachedCoords: Coords | null = null;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab writing the same key should update this one too.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): Coords | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }

  if (raw === cachedRaw) return cachedCoords;
  cachedRaw = raw;

  if (!raw) {
    cachedCoords = null;
    return cachedCoords;
  }

  try {
    const parsed = JSON.parse(raw) as StoredLocation;
    cachedCoords =
      Number.isFinite(parsed.lat) && Number.isFinite(parsed.lon)
        ? { lat: parsed.lat, lon: parsed.lon }
        : null;
  } catch {
    cachedCoords = null;
  }
  return cachedCoords;
}

/** The server has no localStorage, so it renders as though nothing is stored. */
function getServerSnapshot(): Coords | null {
  return null;
}

function write(coords: Coords | null) {
  try {
    if (coords) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...coords, savedAt: Date.now() })
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable — the value still applies for this session.
  }
  emit();
}

/**
 * The viewer's coordinates, used to localise weather and ISS pass predictions.
 *
 * Location is never requested on load: the browser prompt only appears when
 * the viewer asks for it via `request()`. A granted position is cached in
 * localStorage so the prompt is not repeated on every visit, and it never
 * leaves the browser except as query parameters on this app's own API routes.
 */
export function useLocation() {
  const coords = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const [requestState, setRequestState] = useState<LocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setRequestState("unavailable");
      setError("This browser does not expose a geolocation API.");
      return;
    }

    setRequestState("prompting");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRequestState("granted");
        write({
          // Two decimals is roughly a kilometre — enough for weather and pass
          // predictions, and coarser than the raw fix.
          lat: Math.round(position.coords.latitude * 100) / 100,
          lon: Math.round(position.coords.longitude * 100) / 100,
        });
      },
      (positionError) => {
        setRequestState(
          positionError.code === positionError.PERMISSION_DENIED
            ? "denied"
            : "unavailable"
        );
        setError(positionError.message);
      },
      { timeout: 10000, maximumAge: 1000 * 60 * 30 }
    );
  }, []);

  const clear = useCallback(() => {
    setRequestState("idle");
    setError(null);
    write(null);
  }, []);

  const status: LocationStatus = coords ? "granted" : requestState;

  return { coords, status, error, request, clear };
}
