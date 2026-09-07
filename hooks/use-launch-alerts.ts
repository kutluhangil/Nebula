"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import { useNow } from "@/hooks/use-now";
import {
  useAlertSource,
  type AlertSourceResult,
} from "@/hooks/use-alert-source";

interface UpcomingLaunch {
  id: string;
  name: string;
  date_utc: string;
  launchpad: string;
}

/** How far ahead of liftoff the alert fires. */
export const LAUNCH_LEAD_MS = 60 * 60 * 1000;

/**
 * SpaceX launch alerts, one hour before the currently published NET.
 *
 * Launch Library's NET moves — a scrub or a range hold can push it by hours.
 * The alert id is the launch id rather than the time, so a launch that slips
 * out of the window after being announced is not announced again when it comes
 * back in. The one-hour figure is what the notification says, so a slip shows
 * up as a launch that did not happen on time rather than as a wrong claim.
 */
export function useLaunchAlerts(enabled: boolean): AlertSourceResult {
  const { data } = useQuery<{ upcoming: UpcomingLaunch[] }>({
    queryKey: ["spacex"],
    queryFn: () => fetchJson("/api/spacex"),
    staleTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 60 * 30,
  });

  const now = useNow();

  const candidates = useMemo(() => {
    if (now === null) return [];

    return (data?.upcoming ?? [])
      .map((launch) => ({ launch, t: Date.parse(launch.date_utc) }))
      .filter(
        ({ t }) => Number.isFinite(t) && t > now && t - now <= LAUNCH_LEAD_MS
      )
      // Soonest first, so the cap keeps the most imminent.
      .sort((a, b) => a.t - b.t)
      .map(({ launch, t }) => ({
        id: `launch-${launch.id}`,
        title: `${launch.name} launches in ${Math.round((t - now) / 60000)} min`,
        body: launch.launchpad || "SpaceX",
      }));
  }, [data?.upcoming, now]);

  useAlertSource({ enabled, candidates });

  const primeIds = useMemo(
    () => candidates.map((candidate) => candidate.id),
    [candidates]
  );

  return { candidates, primeIds };
}
