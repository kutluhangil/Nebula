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
import { useLocale } from "@/lib/i18n";

interface Earthquake {
  id: string;
  properties: { mag: number; place: string; tsunami: number };
}

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
  const { t } = useLocale();
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

  const { permission, enableAlerts, disableAlerts } = useAlerts(earthquakes);

  const sourceList: { key: AlertSourceKey; label: string; icon: LucideIcon }[] = [
    { key: "earthquake", label: t.dashboard.watchlist.sources.earthquake, icon: Activity },
    { key: "apod", label: t.dashboard.watchlist.sources.apod, icon: ImageIcon },
    { key: "launch", label: t.dashboard.watchlist.sources.launch, icon: Rocket },
    { key: "solar", label: t.dashboard.watchlist.sources.solar, icon: Sun },
  ];

  return (
    <section
      id="watchlist"
      className="border border-[var(--border)] rounded-xl bg-[var(--surface-1)]/80 p-6 h-full"
      aria-label={t.dashboard.watchlist.ariaLabel}
    >
      <div className="mb-5 flex items-start justify-between gap-4 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="h-4 w-4 text-[var(--text-dim)] shrink-0" />
          <div>
            <p className="font-serif text-lg text-[var(--text)] leading-none">
              {t.dashboard.watchlist.title}
            </p>
            <p className="mt-1 text-xs text-[var(--text-faint)]">
              {t.dashboard.watchlist.subtitle}
            </p>
          </div>
        </div>
        {alertsEnabled ? (
          <button
            type="button"
            onClick={disableAlerts}
            aria-label="Turn alerts off"
            className="flex items-center gap-1.5 text-xs text-[var(--accent-green)] font-mono cursor-pointer shrink-0"
            aria-pressed="true"
          >
            <BellRing className="h-3.5 w-3.5" /> {t.dashboard.watchlist.on}
          </button>
        ) : (
          <button
            type="button"
            onClick={enableAlerts}
            className="btn-ghost !min-h-0 shrink-0 whitespace-nowrap !px-3 !py-1.5 !text-xs cursor-pointer"
          >
            <Bell className="h-3.5 w-3.5" /> {t.dashboard.watchlist.enable}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {permission === "denied" && (
          <p className="rounded-lg border border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/10 px-3 py-2 text-[11px] leading-relaxed text-[var(--accent-amber)]">
            {t.dashboard.watchlist.blocked}
          </p>
        )}

        <div>
          <FieldLabel>{t.dashboard.watchlist.notifyMe}</FieldLabel>
          <div className="grid grid-cols-2 gap-1.5">
            {sourceList.map(({ key, label, icon: Icon }) => (
              <button
                type="button"
                key={key}
                onClick={() => setSourceEnabled(key, !sources[key])}
                aria-pressed={sources[key]}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                  sources[key]
                    ? "border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text)]"
                    : "border-[var(--border)] bg-transparent text-[var(--text-faint)] hover:text-[var(--text-dim)]"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-75" />
                  <span className="truncate">{label}</span>
                </span>
                {sources[key] && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--text)]" />}
              </button>
            ))}
          </div>
        </div>

        {sources.earthquake && (
          <div className="space-y-2">
            <div>
              <FieldLabel>{t.dashboard.watchlist.quakeThreshold}</FieldLabel>
              <div className="grid grid-cols-3 gap-1.5">
                {([4, 5, 6] as EarthquakeThreshold[]).map((threshold) => (
                  <button
                    type="button"
                    key={threshold}
                    onClick={() => setEarthquakeThreshold(threshold)}
                    aria-pressed={earthquakeThreshold === threshold}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                      earthquakeThreshold === threshold
                        ? "border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text)]"
                        : "border-[var(--border)] bg-transparent text-[var(--text-faint)] hover:text-[var(--text-dim)]"
                    }`}
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
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                tsunamiOnly
                  ? "border-[var(--accent)]/60 bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-transparent text-[var(--text-faint)] hover:text-[var(--text-dim)]"
              }`}
            >
              <span className="flex items-center gap-2">
                <Waves className="h-3.5 w-3.5" /> {t.dashboard.watchlist.tsunamiOnly}
              </span>
              {tsunamiOnly && <Check className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}

        {sources.solar && (
          <div>
            <FieldLabel>{t.dashboard.watchlist.solarThreshold}</FieldLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {SOLAR_LEVELS.map(({ value, label }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setSolarThreshold(value)}
                  aria-pressed={solarThreshold === value}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] font-mono transition-colors cursor-pointer ${
                    solarThreshold === value
                      ? "border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text)]"
                      : "border-[var(--border)] bg-transparent text-[var(--text-faint)] hover:text-[var(--text-dim)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {sources.launch && (
          <p className="text-[11px] leading-relaxed text-[var(--text-faint)]">
            {t.dashboard.watchlist.launchHint}
          </p>
        )}
      </div>
    </section>
  );
}
