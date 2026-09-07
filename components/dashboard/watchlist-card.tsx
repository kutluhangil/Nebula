"use client";

import {
  Activity,
  Bell,
  BellRing,
  Check,
  Image as ImageIcon,
  Rocket,
  SlidersHorizontal,
  Sun,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useWatchlist,
  type AlertSourceKey,
  type EarthquakeThreshold,
  type SolarThreshold,
} from "@/hooks/use-watchlist";
import { useAlerts } from "@/hooks/use-alerts";

interface Earthquake {
  id: string;
  properties: { mag: number; place: string; tsunami: number };
}

const SOURCES: { key: AlertSourceKey; label: string; icon: LucideIcon }[] = [
  { key: "earthquake", label: "Earthquakes", icon: Activity },
  { key: "apod", label: "NASA image", icon: ImageIcon },
  { key: "launch", label: "Launches", icon: Rocket },
  { key: "solar", label: "Solar storms", icon: Sun },
];

/** Kp value paired with the NOAA G-scale label it corresponds to. */
const SOLAR_LEVELS: { value: SolarThreshold; label: string }[] = [
  { value: 5, label: "Kp5 · G1" },
  { value: 6, label: "Kp6 · G2" },
  { value: 7, label: "Kp7 · G3" },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-faint)]">
      {children}
    </p>
  );
}

export function WatchlistCard({ earthquakes }: { earthquakes: Earthquake[] }) {
  const {
    earthquakeThreshold,
    tsunamiOnly,
    solarThreshold,
    sources,
    alertsEnabled,
    setEarthquakeThreshold,
    setTsunamiOnly,
    setSolarThreshold,
    setSourceEnabled,
  } = useWatchlist();

  // The one place the alert engine is mounted.
  const { permission, enableAlerts, disableAlerts } = useAlerts(earthquakes);

  return (
    <section id="watchlist" className="glass-panel p-5" aria-label="Alert watchlist">
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
          <button type="button" onClick={disableAlerts} aria-label="Turn alerts off" className="flex items-center gap-1.5 text-xs text-emerald-400" aria-pressed="true">
            <BellRing className="h-3.5 w-3.5" /> On
          </button>
        ) : (
          <button type="button" onClick={enableAlerts} className="btn-ghost !min-h-0 shrink-0 whitespace-nowrap !px-3 !py-2 !text-xs">
            <Bell className="h-3.5 w-3.5" /> Enable alerts
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Without this the button would silently do nothing: a blocked site
            cannot re-prompt, so the only way out is the browser's own settings. */}
        {permission === "denied" && (
          <p className="rounded-lg border border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/10 px-3 py-2 text-[11px] leading-relaxed text-[var(--accent-amber)]">
            This browser has blocked notifications for the site. Alerts stay off
            until you allow them in the browser&apos;s site settings.
          </p>
        )}

        <div>
          <FieldLabel>Notify me about</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {SOURCES.map(({ key, label, icon: Icon }) => (
              <button
                type="button"
                key={key}
                onClick={() => setSourceEnabled(key, !sources[key])}
                aria-pressed={sources[key]}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${sources[key] ? "border-[var(--accent)] bg-[var(--surface-hover)] text-[var(--text)]" : "border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-dim)]"}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                </span>
                {sources[key] && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Each rule is only shown while its source is on: a threshold for a
            source that cannot fire is a control with no effect. */}
        {sources.earthquake && (
          <div className="space-y-3">
            <div>
              <FieldLabel>Earthquake threshold</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {([4, 5, 6] as EarthquakeThreshold[]).map((threshold) => (
                  <button
                    type="button"
                    key={threshold}
                    onClick={() => setEarthquakeThreshold(threshold)}
                    aria-pressed={earthquakeThreshold === threshold}
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
              aria-pressed={tsunamiOnly}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs transition-colors ${tsunamiOnly ? "border-blue-400/40 bg-blue-500/10 text-blue-300" : "border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-dim)]"}`}
            >
              <span className="flex items-center gap-2"><Waves className="h-3.5 w-3.5" /> Tsunami-flagged events only</span>
              {tsunamiOnly && <Check className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}

        {sources.solar && (
          <div>
            <FieldLabel>Solar storm threshold</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {SOLAR_LEVELS.map(({ value, label }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setSolarThreshold(value)}
                  aria-pressed={solarThreshold === value}
                  className={`rounded-lg border px-2 py-2 text-[11px] font-mono transition-colors ${solarThreshold === value ? "border-[var(--accent)] bg-[var(--surface-hover)] text-[var(--text)]" : "border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-dim)]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {sources.launch && (
          <p className="text-[11px] leading-relaxed text-[var(--text-faint)]">
            Launch alerts fire an hour before the published liftoff time, which
            moves when a launch slips.
          </p>
        )}
      </div>
    </section>
  );
}
