"use client";

import { useCallback, useEffect } from "react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useNotifications } from "@/hooks/use-notifications";

export interface AlertableQuake {
  id: string;
  properties: { mag: number; place: string; tsunami: number };
}

// A burst of qualifying events should not open a dozen system notifications;
// past this many, one summary notification stands in for the rest.
const MAX_INDIVIDUAL_ALERTS = 3;

/**
 * The single earthquake alert engine.
 *
 * There were previously two: a fixed M6.5 rule in the quake list that
 * deduplicated in a ref (so it re-alerted on every remount), and the watchlist
 * rule that persisted seen ids but only ever notified about the first match
 * while marking every match as seen. Between them the same quake could alert
 * twice, and genuinely new quakes could be silently swallowed.
 *
 * This hook must be mounted exactly once. It reads the watchlist's own
 * thresholds, deduplicates against the persisted id set, and reports every new
 * match up to a cap.
 */
export function useEarthquakeAlerts(earthquakes: AlertableQuake[]) {
  const {
    earthquakeThreshold,
    tsunamiOnly,
    alertsEnabled,
    knownEventIds,
    setAlertsEnabled,
    rememberEvents,
  } = useWatchlist();

  const { permission, requestPermission, sendNotification } =
    useNotifications();

  const active = alertsEnabled && permission === "granted";

  useEffect(() => {
    if (!active) return;

    const known = new Set(knownEventIds);
    const matches = earthquakes.filter(
      (quake) =>
        quake.properties.mag >= earthquakeThreshold &&
        (!tsunamiOnly || quake.properties.tsunami === 1) &&
        !known.has(quake.id)
    );

    if (!matches.length) return;

    // Strongest first, so the cap keeps the events that matter most.
    const ranked = [...matches].sort(
      (a, b) => b.properties.mag - a.properties.mag
    );

    for (const quake of ranked.slice(0, MAX_INDIVIDUAL_ALERTS)) {
      sendNotification(`M${quake.properties.mag.toFixed(1)} earthquake`, {
        body: quake.properties.place,
        // The tag collapses repeats of the same event at the OS level, a second
        // line of defence behind the persisted id set.
        tag: `earthquake-${quake.id}`,
      });
    }

    const remaining = ranked.length - MAX_INDIVIDUAL_ALERTS;
    if (remaining > 0) {
      sendNotification(`${remaining} more earthquakes match your watchlist`, {
        body: `M${earthquakeThreshold}.0+${tsunamiOnly ? ", tsunami flagged" : ""}`,
        tag: "earthquake-summary",
      });
    }

    // Mark every match seen, including the ones folded into the summary, so
    // they are not reported again on the next poll.
    rememberEvents(ranked.map((quake) => quake.id));
  }, [
    active,
    earthquakeThreshold,
    earthquakes,
    knownEventIds,
    rememberEvents,
    sendNotification,
    tsunamiOnly,
  ]);

  /**
   * Turning alerts on treats everything currently on screen as already seen,
   * so enabling does not immediately fire for the existing backlog.
   */
  const enableAlerts = useCallback(async () => {
    await requestPermission();
    if (Notification.permission !== "granted") return;
    rememberEvents(earthquakes.map((quake) => quake.id));
    setAlertsEnabled(true);
  }, [earthquakes, rememberEvents, requestPermission, setAlertsEnabled]);

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
