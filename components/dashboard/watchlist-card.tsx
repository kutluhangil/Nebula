"use client";

import { useEffect } from "react";
import { Bell, BellRing, Check, SlidersHorizontal, Waves } from "lucide-react";
import { useWatchlist, type EarthquakeThreshold } from "@/hooks/use-watchlist";

interface Earthquake {
  id: string;
  properties: { mag: number; place: string; tsunami: number };
}

export function WatchlistCard({ earthquakes }: { earthquakes: Earthquake[] }) {
  const {
    earthquakeThreshold,
    tsunamiOnly,
    alertsEnabled,
    knownEventIds,
    setEarthquakeThreshold,
    setTsunamiOnly,
    setAlertsEnabled,
    rememberEvents,
  } = useWatchlist();

  useEffect(() => {
    if (!alertsEnabled || typeof Notification === "undefined") return;
    const matches = earthquakes.filter(
      (quake) =>
        quake.properties.mag >= earthquakeThreshold &&
        (!tsunamiOnly || quake.properties.tsunami === 1) &&
        !knownEventIds.includes(quake.id)
    );
    if (!matches.length) return;

    const first = matches[0];
    new Notification(`M${first.properties.mag.toFixed(1)} earthquake`, {
      body: first.properties.place,
      icon: "/favicon.ico",
      tag: `earthquake-${first.id}`,
    });
    rememberEvents(matches.map((quake) => quake.id));
  }, [alertsEnabled, earthquakeThreshold, earthquakes, knownEventIds, rememberEvents, tsunamiOnly]);

  const enableAlerts = async () => {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      rememberEvents(earthquakes.map((quake) => quake.id));
      setAlertsEnabled(true);
    }
  };

  return (
    <section id="watchlist" className="glass-panel p-5" aria-label="Earthquake watchlist">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="icon-tile flex h-9 w-9 items-center justify-center rounded-xl">
            <SlidersHorizontal className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text)]">Your watchlist</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-faint)]">Saved on this device. Alerts run while this tab is open.</p>
          </div>
        </div>
        {alertsEnabled ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400"><BellRing className="h-3.5 w-3.5" /> On</span>
        ) : (
          <button type="button" onClick={enableAlerts} className="btn-ghost !min-h-0 !px-3 !py-2 !text-xs">
            <Bell className="h-3.5 w-3.5" /> Enable alerts
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-faint)]">Earthquake threshold</p>
          <div className="grid grid-cols-3 gap-2">
            {([4, 5, 6] as EarthquakeThreshold[]).map((threshold) => (
              <button
                type="button"
                key={threshold}
                onClick={() => setEarthquakeThreshold(threshold)}
                className={`rounded-lg border px-3 py-2 text-xs font-mono transition-colors ${earthquakeThreshold === threshold ? "border-[var(--accent)] bg-[var(--surface-hover)] text-[var(--text)]" : "border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-dim)]"}`}
              >
                M{threshold}+
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setTsunamiOnly(!tsunamiOnly)}
          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs transition-colors ${tsunamiOnly ? "border-blue-400/40 bg-blue-500/10 text-blue-300" : "border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-dim)]"}`}
        >
          <span className="flex items-center gap-2"><Waves className="h-3.5 w-3.5" /> Tsunami-flagged events only</span>
          {tsunamiOnly && <Check className="h-3.5 w-3.5" />}
        </button>
      </div>
    </section>
  );
}
