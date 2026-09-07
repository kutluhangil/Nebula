"use client";

import { useCallback, useMemo } from "react";
import { useWatchlist } from "@/hooks/use-watchlist";
import {
  useAlertSource,
  type AlertSourceResult,
} from "@/hooks/use-alert-source";

export interface AlertableQuake {
  id: string;
  properties: { mag: number; place: string; tsunami: number };
}

/**
 * Earthquake alerts, driven by the watchlist's own magnitude and tsunami rules.
 *
 * There were previously two engines: a fixed M6.5 rule in the quake list that
 * deduplicated in a ref (so it re-alerted on every remount), and the watchlist
 * rule that persisted seen ids but only ever notified about the first match
 * while marking every match as seen. Between them the same quake could alert
 * twice, and genuinely new quakes could be silently swallowed.
 *
 * `primeIds` is every quake on the feed, not just the matching ones: priming
 * only the matches would mean lowering the threshold later re-alerts on quakes
 * the reader has already scrolled past.
 */
export function useEarthquakeAlerts(
  earthquakes: AlertableQuake[],
  enabled: boolean
): AlertSourceResult {
  const { earthquakeThreshold, tsunamiOnly } = useWatchlist();

  const candidates = useMemo(
    () =>
      earthquakes
        .filter(
          (quake) =>
            quake.properties.mag >= earthquakeThreshold &&
            (!tsunamiOnly || quake.properties.tsunami === 1)
        )
        // Strongest first, so the cap keeps the events that matter most.
        .sort((a, b) => b.properties.mag - a.properties.mag)
        .map((quake) => ({
          id: quake.id,
          title: `M${quake.properties.mag.toFixed(1)} earthquake`,
          body: quake.properties.place,
        })),
    [earthquakes, earthquakeThreshold, tsunamiOnly]
  );

  const summarize = useCallback(
    (remaining: number) => ({
      id: "earthquake-summary",
      title: `${remaining} more earthquakes match your watchlist`,
      body: `M${earthquakeThreshold}.0+${tsunamiOnly ? ", tsunami flagged" : ""}`,
    }),
    [earthquakeThreshold, tsunamiOnly]
  );

  useAlertSource({ enabled, candidates, summarize });

  const primeIds = useMemo(
    () => earthquakes.map((quake) => quake.id),
    [earthquakes]
  );

  return { candidates, primeIds };
}
