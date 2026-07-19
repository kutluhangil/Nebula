import { create } from "zustand";
import { persist } from "zustand/middleware";

export type EarthquakeThreshold = 4 | 5 | 6;

interface WatchlistState {
  earthquakeThreshold: EarthquakeThreshold;
  tsunamiOnly: boolean;
  alertsEnabled: boolean;
  knownEventIds: string[];
  setEarthquakeThreshold: (threshold: EarthquakeThreshold) => void;
  setTsunamiOnly: (enabled: boolean) => void;
  setAlertsEnabled: (enabled: boolean) => void;
  rememberEvents: (ids: string[]) => void;
}

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set) => ({
      earthquakeThreshold: 5,
      tsunamiOnly: false,
      alertsEnabled: false,
      knownEventIds: [],
      setEarthquakeThreshold: (earthquakeThreshold) => set({ earthquakeThreshold }),
      setTsunamiOnly: (tsunamiOnly) => set({ tsunamiOnly }),
      setAlertsEnabled: (alertsEnabled) => set({ alertsEnabled }),
      rememberEvents: (ids) =>
        set((state) => ({
          knownEventIds: [...new Set([...state.knownEventIds, ...ids])].slice(-200),
        })),
    }),
    { name: "nebula-watchlist" }
  )
);
