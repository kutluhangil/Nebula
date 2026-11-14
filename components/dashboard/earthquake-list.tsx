"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Maximize2,
  X,
  MapPin,
  Clock,
  Waves,
  Bell,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { useWatchlist } from "@/hooks/use-watchlist";
import { fetchJson } from "@/lib/api-client";
import { FeedError } from "@/components/ui/feed-state";
import { useModal } from "@/hooks/use-modal";
import { useLocale } from "@/lib/i18n";

interface EarthquakeFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    tsunami: number;
    status: string;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

function getMagStyle(mag: number) {
  if (mag >= 7) {
    return {
      color: "var(--accent-red)",
      borderColor: "color-mix(in srgb, var(--accent-red) 35%, transparent)",
      backgroundColor: "color-mix(in srgb, var(--accent-red) 12%, transparent)",
    };
  }
  if (mag >= 6) {
    return {
      color: "var(--accent-amber)",
      borderColor: "color-mix(in srgb, var(--accent-amber) 35%, transparent)",
      backgroundColor: "color-mix(in srgb, var(--accent-amber) 12%, transparent)",
    };
  }
  if (mag >= 5) {
    return {
      color: "var(--accent-cyan)",
      borderColor: "color-mix(in srgb, var(--accent-cyan) 32%, transparent)",
      backgroundColor: "color-mix(in srgb, var(--accent-cyan) 10%, transparent)",
    };
  }
  return {
    color: "var(--accent-green)",
    borderColor: "color-mix(in srgb, var(--accent-green) 28%, transparent)",
    backgroundColor: "color-mix(in srgb, var(--accent-green) 9%, transparent)",
  };
}

function MagBadge({ mag }: { mag: number }) {
  const style = getMagStyle(mag);
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border"
      style={style}
    >
      <span className="text-xs font-bold font-mono tabular-nums" style={{ color: style.color }}>
        {mag.toFixed(1)}
      </span>
    </div>
  );
}

export function EarthquakeList() {
  const { t, dateLocale, locale } = useLocale();
  const [selected, setSelected] = useState<EarthquakeFeature | null>(null);
  const closeDetail = useCallback(() => setSelected(null), []);
  const modalRef = useModal(Boolean(selected), closeDetail);
  const { alertsEnabled } = useWatchlist();

  const { data, isLoading, isError, error, refetch } = useQuery<{
    features: EarthquakeFeature[];
  }>({
    queryKey: ["earthquakes"],
    queryFn: () => fetchJson("/api/earthquakes"),
    refetchInterval: 1000 * 60 * 10,
  });

  const quakes = data?.features?.slice(0, 15) || [];
  const totalCount = data?.features?.length ?? 0;

  if (isLoading) {
    return <div className="glass-panel h-64 skeleton" aria-busy="true" />;
  }

  if (isError || !data) {
    return (
      <div className="glass-panel h-64 flex items-center justify-center">
        <FeedError
          title={t.dashboard.earthquakes.unavailable}
          error={error}
          icon={Activity}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel overflow-hidden"
      >
        <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
          <span className="eyebrow !text-[10px] pl-2">
            {t.dashboard.earthquakes.recent}
          </span>
          {!alertsEnabled && (
            <a
              href="#watchlist"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-dim)] text-[10px] font-mono transition-colors border border-[var(--border)]"
            >
              <Bell className="w-3 h-3" />
              {t.dashboard.earthquakes.setupAlerts}
            </a>
          )}
        </div>
        <div className="divide-y divide-[var(--border)] max-h-[26rem] overflow-y-auto overscroll-contain">
          {quakes.map((quake, i) => (
            <motion.button
              type="button"
              key={quake.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.025 }}
              onClick={() => setSelected(quake)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface)] transition-colors text-left group cursor-pointer"
              aria-label={`Magnitude ${quake.properties.mag} earthquake near ${quake.properties.place}`}
            >
              <MagBadge mag={quake.properties.mag} />
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text)] text-sm font-medium truncate">
                  {quake.properties.place}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 font-mono text-[11px] text-[var(--text-faint)]">
                  <span>
                    {formatDistanceToNow(quake.properties.time, {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </span>
                  <span>·</span>
                  <span>
                    {t.dashboard.earthquakes.depth}:{" "}
                    {quake.geometry.coordinates[2].toFixed(1)}km
                  </span>
                  {quake.properties.tsunami === 1 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--accent)] font-medium">
                      <Waves className="w-2.5 h-2.5" />
                      {t.dashboard.earthquakes.tsunami}
                    </span>
                  )}
                </div>
              </div>
              <Maximize2 className="w-3 h-3 text-[var(--text-faint)] group-hover:text-[var(--text)] transition-colors flex-shrink-0" />
            </motion.button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border)]">
          <span className="text-[var(--text-faint)] text-xs font-mono tabular-nums">
            {t.dashboard.earthquakes.showing} {quakes.length}{" "}
            {t.dashboard.earthquakes.of} {totalCount}{" "}
            {t.dashboard.earthquakes.recorded}
          </span>
          <Link
            href="/earth"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors"
          >
            {t.dashboard.earthquakes.openMonitor}
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      </motion.div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ backgroundColor: "var(--modal-scrim)" }}
            onClick={closeDetail}
          >
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-label={`Magnitude ${selected.properties.mag.toFixed(1)} earthquake near ${selected.properties.place}`}
              tabIndex={-1}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel p-6 max-w-md w-full border border-[var(--border-strong)]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MagBadge mag={selected.properties.mag} />
                  <div>
                    <div
                      className="text-2xl font-bold font-mono"
                      style={{ color: getMagStyle(selected.properties.mag).color }}
                    >
                      M{selected.properties.mag.toFixed(1)}
                    </div>
                    <div className="text-[var(--text-faint)] text-xs">
                      {t.dashboard.earthquakes.magnitude}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDetail}
                  className="w-8 h-8 rounded-lg bezel flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] cursor-pointer"
                  aria-label={t.common.close}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <FavoriteButton
                  item={{
                    id: `earthquake-${selected.id}`,
                    type: "earthquake",
                    title: `M${selected.properties.mag.toFixed(1)} Earthquake`,
                    subtitle: selected.properties.place,
                    date: new Date(selected.properties.time).toISOString(),
                    data: selected,
                  }}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[var(--text-faint)] mt-0.5 shrink-0" />
                  <span className="text-[var(--text)] text-sm">
                    {selected.properties.place}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--text-faint)] shrink-0" />
                  <span className="text-[var(--text-dim)] text-sm font-mono">
                    {new Date(selected.properties.time).toLocaleString(
                      locale === "tr" ? "tr-TR" : "en-US"
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[
                    {
                      label: t.dashboard.earthquakes.depth,
                      value: `${selected.geometry.coordinates[2].toFixed(1)}km`,
                    },
                    {
                      label: t.dashboard.earthquakes.lat,
                      value: `${selected.geometry.coordinates[1].toFixed(3)}°`,
                    },
                    {
                      label: t.dashboard.earthquakes.lon,
                      value: `${selected.geometry.coordinates[0].toFixed(3)}°`,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="inset-well rounded-lg p-3 text-center"
                    >
                      <div className="text-[var(--text-faint)] text-[10px] font-mono uppercase tracking-wide mb-1">
                        {stat.label}
                      </div>
                      <div className="text-[var(--text)] text-sm font-mono font-semibold tabular-nums">
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {selected.properties.tsunami === 1 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)] text-sm">
                    <Waves className="w-4 h-4 shrink-0" />
                    {t.dashboard.earthquakes.tsunamiWarning}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
