"use client";

import { useCallback } from "react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useNotifications } from "@/hooks/use-notifications";
import {
  useEarthquakeAlerts,
  type AlertableQuake,
} from "@/hooks/use-earthquake-alerts";
import { useApodAlerts } from "@/hooks/use-apod-alerts";
import { useLaunchAlerts } from "@/hooks/use-launch-alerts";
import { useSolarAlerts } from "@/hooks/use-solar-alerts";

/**
 * The one alert engine, composed of four sources.
 *
 * This hook must be mounted exactly once: each source deduplicates against the
 * same persisted id set, and a second mount would race it. A source only fires
 * when the master switch is on, the browser has granted permission, and that
 * source's own toggle is on — the browser permission is the outer gate because
 * without it `sendNotification` is a no-op and a card claiming alerts are on
 * would be lying.
 */
export function useAlerts(earthquakes: AlertableQuake[]) {
  const { alertsEnabled, sources, setAlertsEnabled, rememberEvents } =
    useWatchlist();
  const { permission, requestPermission } = useNotifications();

  const active = alertsEnabled && permission === "granted";

  const quake = useEarthquakeAlerts(earthquakes, active && sources.earthquake);
  const apod = useApodAlerts(active && sources.apod);
  const launch = useLaunchAlerts(active && sources.launch);
  const solar = useSolarAlerts(active && sources.solar);

  /**
   * Turning alerts on treats everything already qualifying as seen, so enabling
   * does not immediately fire for the existing backlog. Every source is primed,
   * including the ones whose toggle is currently off — otherwise switching a
   * source on tomorrow would replay whatever it was already showing.
   */
  const enableAlerts = useCallback(async () => {
    const granted = await requestPermission();
    if (granted !== "granted") return;
    rememberEvents([
      ...quake.primeIds,
      ...apod.primeIds,
      ...launch.primeIds,
      ...solar.primeIds,
    ]);
    setAlertsEnabled(true);
  }, [
    apod.primeIds,
    launch.primeIds,
    quake.primeIds,
    rememberEvents,
    requestPermission,
    setAlertsEnabled,
    solar.primeIds,
  ]);

  const disableAlerts = useCallback(
    () => setAlertsEnabled(false),
    [setAlertsEnabled]
  );

  return {
    alertsEnabled,
    permission,
    active,
    enableAlerts,
    disableAlerts,
  };
}
