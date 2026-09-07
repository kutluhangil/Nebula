import { create } from "zustand";
import { persist } from "zustand/middleware";

export type EarthquakeThreshold = 4 | 5 | 6;

/** Kp 5 is the G1 storm floor; 6 is G2, 7 is G3. Below 5 is unsettled, not a storm. */
export type SolarThreshold = 5 | 6 | 7;

export type AlertSourceKey = "earthquake" | "apod" | "launch" | "solar";

export type AlertSources = Record<AlertSourceKey, boolean>;

const DEFAULT_SOURCES: AlertSources = {
  earthquake: true,
  apod: true,
  launch: true,
  solar: true,
};

const WATCHLIST_DEFAULTS = {
  earthquakeThreshold: 5 as EarthquakeThreshold,
  tsunamiOnly: false,
  solarThreshold: 5 as SolarThreshold,
  alertsEnabled: false,
  sources: DEFAULT_SOURCES,
};

interface WatchlistState {
  earthquakeThreshold: EarthquakeThreshold;
  tsunamiOnly: boolean;
  solarThreshold: SolarThreshold;
  alertsEnabled: boolean;
  sources: AlertSources;
  knownEventIds: string[];
  setEarthquakeThreshold: (threshold: EarthquakeThreshold) => void;
  setTsunamiOnly: (enabled: boolean) => void;
  setSolarThreshold: (threshold: SolarThreshold) => void;
  setAlertsEnabled: (enabled: boolean) => void;
  setSourceEnabled: (source: AlertSourceKey, enabled: boolean) => void;
  rememberEvents: (ids: string[]) => void;
}

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set) => ({
      ...WATCHLIST_DEFAULTS,
      knownEventIds: [],
      setEarthquakeThreshold: (earthquakeThreshold) => set({ earthquakeThreshold }),
      setTsunamiOnly: (tsunamiOnly) => set({ tsunamiOnly }),
      setSolarThreshold: (solarThreshold) => set({ solarThreshold }),
      setAlertsEnabled: (alertsEnabled) => set({ alertsEnabled }),
      setSourceEnabled: (source, enabled) =>
        set((state) => ({ sources: { ...state.sources, [source]: enabled } })),
      rememberEvents: (ids) =>
        set((state) => ({
          knownEventIds: [...new Set([...state.knownEventIds, ...ids])].slice(-200),
        })),
    }),
    {
      name: "nebula-watchlist",
      /**
       * The default merge is shallow, so a `sources` object persisted before a
       * new source existed would replace the defaults wholesale and leave the
       * new key undefined — silently off, with its toggle rendering unchecked.
       * Merging the map key by key means an added source arrives at its
       * default instead.
       */
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<WatchlistState>;
        return {
          ...current,
          ...saved,
          sources: { ...DEFAULT_SOURCES, ...(saved.sources ?? {}) },
        };
      },
    }
  )
);
