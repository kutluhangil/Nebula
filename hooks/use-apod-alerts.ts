"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import {
  useAlertSource,
  type AlertSourceResult,
} from "@/hooks/use-alert-source";

interface ApodPayload {
  date: string;
  title: string;
}

/**
 * NASA publishes one Astronomy Picture of the Day, and its `date` field is what
 * changes when a new one lands — the image url is not reliably unique. The
 * alert id is therefore the date, so a tab that was already open when the
 * picture changed reports it once and never again.
 *
 * The query shares its key with APODCard, so this adds no second request; it
 * adds the hourly poll that lets a tab left open overnight notice the change.
 */
export function useApodAlerts(enabled: boolean): AlertSourceResult {
  const { data } = useQuery<ApodPayload>({
    queryKey: ["apod"],
    queryFn: () => fetchJson<ApodPayload>("/api/apod"),
    staleTime: 1000 * 60 * 60,
    refetchInterval: 1000 * 60 * 60,
  });

  const candidates = useMemo(
    () =>
      data?.date
        ? [
            {
              id: `apod-${data.date}`,
              title: "New NASA image of the day",
              body: data.title,
            },
          ]
        : [],
    [data]
  );

  useAlertSource({ enabled, candidates });

  const primeIds = useMemo(
    () => candidates.map((candidate) => candidate.id),
    [candidates]
  );

  return { candidates, primeIds };
}
