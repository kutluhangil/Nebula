"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import {
  buildAsteroidEntries,
  buildAstronautEntries,
  buildEarthquakeEntries,
  buildLaunchEntries,
  buildPlanetEntries,
  buildRocketEntries,
  type AsteroidRecord,
  type AstronautRecord,
  type EarthquakeRecord,
  type LaunchRecord,
  type SearchEntry,
} from "@/lib/search-index";

export interface SearchFeedFailure {
  /** What the reader was looking for, not the route name. */
  subject: string;
  message: string;
}

export interface SearchIndex {
  entries: SearchEntry[];
  /** Feeds that failed, so an empty result is never mistaken for "nothing matched". */
  failures: SearchFeedFailure[];
  isLoading: boolean;
}

/**
 * The corpus universal search filters over.
 *
 * Every record comes from a feed the app already serves, so search never shows
 * a fact no page could back up. The queries share their keys with the cards, so
 * opening the palette on a page that already loaded a feed costs nothing, and
 * they only run while the palette is open — a keyboard shortcut nobody pressed
 * should not pull four feeds on every page.
 */
export function useSearchIndex(enabled: boolean): SearchIndex {
  const launches = useQuery<{ latest: LaunchRecord | null; upcoming: LaunchRecord[] }>({
    queryKey: ["spacex"],
    queryFn: () => fetchJson("/api/spacex"),
    staleTime: 1000 * 60 * 30,
    enabled,
  });

  const asteroids = useQuery<{ asteroids: AsteroidRecord[] }>({
    queryKey: ["space"],
    queryFn: () => fetchJson("/api/space"),
    staleTime: 1000 * 60 * 30,
    enabled,
  });

  const quakes = useQuery<{ features: EarthquakeRecord[] }>({
    queryKey: ["earthquakes"],
    queryFn: () => fetchJson("/api/earthquakes"),
    staleTime: 1000 * 60 * 5,
    enabled,
  });

  const crew = useQuery<{ people: AstronautRecord[] }>({
    queryKey: ["astronauts"],
    queryFn: () => fetchJson("/api/astronauts"),
    staleTime: 1000 * 60 * 60,
    enabled,
  });

  const entries = useMemo(() => {
    const board = [
      ...(launches.data?.latest ? [launches.data.latest] : []),
      ...(launches.data?.upcoming ?? []),
    ];

    return [
      ...buildLaunchEntries(board),
      ...buildRocketEntries(board),
      ...buildPlanetEntries(),
      ...buildAstronautEntries(crew.data?.people ?? []),
      ...buildAsteroidEntries(asteroids.data?.asteroids ?? []),
      ...buildEarthquakeEntries(quakes.data?.features ?? []),
    ];
  }, [asteroids.data, crew.data, launches.data, quakes.data]);

  const failures = useMemo(() => {
    const reported: SearchFeedFailure[] = [];
    const add = (subject: string, error: Error | null) => {
      if (error) reported.push({ subject, message: error.message });
    };

    add("Missions and rockets", launches.error);
    add("Asteroids", asteroids.error);
    add("Earthquakes", quakes.error);
    add("Astronauts", crew.error);

    return reported;
  }, [asteroids.error, crew.error, launches.error, quakes.error]);

  return {
    entries,
    failures,
    isLoading:
      launches.isLoading ||
      asteroids.isLoading ||
      quakes.isLoading ||
      crew.isLoading,
  };
}
