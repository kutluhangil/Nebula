"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import { useWatchlist } from "@/hooks/use-watchlist";
import {
  useAlertSource,
  type AlertSourceResult,
} from "@/hooks/use-alert-source";

interface SolarPayload {
  kpIndex: number;
  observedAt: string;
}

/** NOAA's G scale, indexed by planetary K. Kp below 5 is unsettled, not a storm. */
const G_SCALE: Record<number, string> = {
  5: "G1 minor",
  6: "G2 moderate",
  7: "G3 strong",
  8: "G4 severe",
  9: "G5 extreme",
};

/**
 * Geomagnetic storm alerts, at or above the watchlist's Kp threshold.
 *
 * A storm is a condition that lasts, not an instant, so the id cannot be the
 * observation time — NOAA republishes every three hours and a two-day storm
 * would alert sixteen times. It is the Kp level and the UTC day instead: one
 * alert per level per day, so a storm that deepens from Kp5 to Kp7 says so and
 * a storm that merely persists stays quiet.
 */
export function useSolarAlerts(enabled: boolean): AlertSourceResult {
  const { solarThreshold } = useWatchlist();

  const { data } = useQuery<SolarPayload>({
    queryKey: ["solar"],
    queryFn: () => fetchJson<SolarPayload>("/api/solar"),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });

  const candidates = useMemo(() => {
    if (!data || !Number.isFinite(data.kpIndex)) return [];
    if (data.kpIndex < solarThreshold) return [];

    const observedDay = data.observedAt.slice(0, 10);
    const scale = G_SCALE[data.kpIndex] ?? `Kp ${data.kpIndex}`;

    return [
      {
        id: `solar-kp${data.kpIndex}-${observedDay}`,
        title: `Geomagnetic storm — Kp ${data.kpIndex}`,
        body: `${scale} · observed ${data.observedAt} UTC (NOAA SWPC)`,
      },
    ];
  }, [data, solarThreshold]);

  useAlertSource({ enabled, candidates });

  const primeIds = useMemo(
    () => candidates.map((candidate) => candidate.id),
    [candidates]
  );

  return { candidates, primeIds };
}
