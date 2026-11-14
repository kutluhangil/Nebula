"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, Waves, AlertTriangle, Focus, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MagnitudeChart } from "@/components/earth/magnitude-chart";
import { DepthChart } from "@/components/earth/depth-chart";
import { MAGNITUDE_BANDS } from "@/lib/dataviz";
import { useWatchlist, type EarthquakeThreshold } from "@/hooks/use-watchlist";
import { fetchJson } from "@/lib/api-client";
import { FeedError } from "@/components/ui/feed-state";
import { EtchedBanner } from "@/components/ui/etched-banner";
import { useLocale } from "@/lib/i18n";
import {
  EVENT_CATEGORIES,
  EVENT_LAYERS,
  RADAR_LAYER,
  TSUNAMI_LAYER,
  type EventCategory,
  type EventsResponse,
  type NaturalEvent,
} from "@/lib/natural-events";

// Leaflet must be dynamically imported (no SSR)
const EarthquakeMap = dynamic(
  () => import("@/components/earth/earthquake-map"),
  { ssr: false, loading: () => <div className="glass-card h-96 skeleton" /> }
);

interface EarthquakeFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    tsunami: number;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

export default function EarthPage() {
  const { t, dateLocale } = useLocale();
  const [mapFocused, setMapFocused] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState<[number, number] | null>(null);
  const [activeLayers, setActiveLayers] = useState<EventCategory[]>([]);

  useEffect(() => {
    if (!mapFocused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMapFocused(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mapFocused]);
  const {
    earthquakeThreshold,
    tsunamiOnly,
    setEarthquakeThreshold,
    setTsunamiOnly,
  } = useWatchlist();
  const {
    data,
    isLoading,
    isError: quakesFailed,
    error: quakesError,
    refetch: refetchQuakes,
  } = useQuery<{ features: EarthquakeFeature[] }>({
    queryKey: ["earthquakes"],
    queryFn: () => fetchJson("/api/earthquakes"),
    refetchInterval: 1000 * 60 * 10,
  });

  const layerQueries = useQueries({
    queries: EVENT_CATEGORIES.map((category) => ({
      queryKey: ["events", category],
      queryFn: () => fetchJson<EventsResponse>(`/api/events?category=${category}`),
      enabled: activeLayers.includes(category),
      staleTime: 1000 * 60 * 30,
    })),
  });

  // Two layers do not come from EONET: precipitation radar reads RainViewer,
  // and the tsunami layer reads the flag USGS already sets on a quake.
  const [showRadar, setShowRadar] = useState(false);
  const [showTsunamiLayer, setShowTsunamiLayer] = useState(false);

  const radar = useQuery<{ tileBase: string; observedAt: string }>({
    queryKey: ["radar"],
    queryFn: () => fetchJson("/api/radar"),
    enabled: showRadar,
    // RainViewer publishes a new frame every ten minutes.
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });

  const naturalEvents: NaturalEvent[] = layerQueries.flatMap(
    (query) => query.data?.events ?? []
  );
  const layersLoading = layerQueries.some((query) => query.isLoading);
  const failedLayer = layerQueries.find((query) => query.isError);

  const toggleLayer = (category: EventCategory) =>
    setActiveLayers((current) =>
      current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category]
    );

  const allQuakes = data?.features || [];
  const quakes = allQuakes.filter(
    (quake) =>
      quake.properties.mag >= earthquakeThreshold &&
      (!tsunamiOnly || quake.properties.tsunami === 1)
  );
  const major = quakes.filter((q) => q.properties.mag >= 6);
  const moderate = quakes.filter(
    (q) => q.properties.mag >= 5 && q.properties.mag < 6
  );
  const tsunamiAlerts = quakes.filter((q) => q.properties.tsunami === 1);

  return (
    <div className="min-h-screen w-full pt-28 pb-24 px-4 md:px-8 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <EtchedBanner
          preset="glacier"
          eyebrow={t.earth.badge}
          titlePre={t.earth.titlePre}
          titleItalic={t.earth.titleItalic}
          subtitle={`USGS · M${earthquakeThreshold}.0+ · 7d${tsunamiOnly ? ` · ${t.earth.tsunamiOnly}` : ""}`}
        />

        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--text)]">{t.earth.filtersTitle}</p>
            <p className="mt-0.5 text-xs text-[var(--text-faint)]">{t.earth.filtersSub}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([4, 5, 6] as EarthquakeThreshold[]).map((threshold) => (
              <button
                type="button"
                key={threshold}
                onClick={() => setEarthquakeThreshold(threshold)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                  earthquakeThreshold === threshold
                    ? "border-[var(--accent)] bg-[var(--surface-hover)] text-[var(--text)]"
                    : "border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-dim)]"
                }`}
              >
                M{threshold}+
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTsunamiOnly(!tsunamiOnly)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                tsunamiOnly
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-dim)]"
              }`}
            >
              {t.earth.tsunamiOnly}
            </button>
          </div>
        </div>

        {quakesFailed && (
          <div className="mb-6 glass-card">
            <FeedError
              title={t.dashboard.earthquakes.unavailable}
              error={quakesError}
              icon={Activity}
              onRetry={() => refetchQuakes()}
            />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: t.earth.stats.total, value: quakes.length, tone: "text-[var(--text)]" },
            {
              label: t.earth.stats.major,
              value: major.length,
              tone: major.length > 0 ? "text-[var(--accent-red)]" : "text-[var(--text)]",
            },
            { label: t.earth.stats.moderate, value: moderate.length, tone: "text-[var(--text)]" },
            {
              label: t.earth.stats.tsunami,
              value: tsunamiAlerts.length,
              tone: tsunamiAlerts.length > 0 ? "text-[var(--accent-amber)]" : "text-[var(--text)]",
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inset-well px-4 py-3.5"
            >
              <div className="eyebrow !text-[9px] mb-2">{stat.label}</div>
              <div className={`font-mono tabular text-2xl leading-none font-medium ${stat.tone}`}>
                {isLoading || quakesFailed ? "—" : stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <MagnitudeChart earthquakes={quakes} />
          <DepthChart earthquakes={quakes} />
        </div>

        {/* Map */}
        <div
          id="seismic-map-panel"
          className={
            mapFocused
              ? "fixed inset-3 z-[90] flex flex-col rounded-2xl border border-[var(--border-strong)] bg-[var(--bg)] p-3 shadow-[var(--panel-shadow)] sm:inset-8"
              : "mb-8"
          }
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-[var(--text)] font-semibold text-sm">
              {t.earth.mapTitle}
            </span>
            <div className="ml-auto flex items-center gap-3 text-xs text-[var(--text-faint)]">
              {MAGNITUDE_BANDS.map((b) => (
                <span key={b.key} className="hidden sm:flex items-center gap-1 font-mono">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: b.color }}
                  />
                  {b.key}
                </span>
              ))}
              <button
                type="button"
                onClick={() => setMapFocused(!mapFocused)}
                className="ml-1 inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide text-[var(--text-dim)] transition-colors hover:text-[var(--text)] cursor-pointer"
              >
                {mapFocused ? <X className="h-3 w-3" /> : <Focus className="h-3 w-3" />}
                {mapFocused ? t.earth.close : t.earth.focus}
              </button>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-faint)]">
              {t.earth.layers}
            </span>
            {EVENT_CATEGORIES.map((category) => {
              const layer = EVENT_LAYERS[category];
              const active = activeLayers.includes(category);
              const count = layerQueries[EVENT_CATEGORIES.indexOf(category)]?.data
                ?.events.length;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleLayer(category)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-mono uppercase tracking-wide transition-colors ${
                    active
                      ? "border-[var(--text-faint)] text-[var(--text)]"
                      : "border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-dim)]"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: layer.color,
                      opacity: active ? 1 : 0.35,
                    }}
                  />
                  {layer.label}
                  {active && count !== undefined ? ` · ${count}` : ""}
                  <span className="sr-only">{active ? " (shown)" : " (hidden)"}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setShowRadar(!showRadar)}
              aria-pressed={showRadar}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-mono uppercase tracking-wide transition-colors ${
                showRadar
                  ? "border-[var(--text-faint)] text-[var(--text)]"
                  : "border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-dim)]"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: RADAR_LAYER.color,
                  opacity: showRadar ? 1 : 0.35,
                }}
              />
              {RADAR_LAYER.label}
              <span className="sr-only">{showRadar ? " (shown)" : " (hidden)"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTsunamiLayer(!showTsunamiLayer)}
              aria-pressed={showTsunamiLayer}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-mono uppercase tracking-wide transition-colors ${
                showTsunamiLayer
                  ? "border-[var(--text-faint)] text-[var(--text)]"
                  : "border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-dim)]"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: TSUNAMI_LAYER.color,
                  opacity: showTsunamiLayer ? 1 : 0.35,
                }}
              />
              {TSUNAMI_LAYER.label}
              {showTsunamiLayer ? ` · ${tsunamiAlerts.length}` : ""}
              <span className="sr-only">
                {showTsunamiLayer ? " (shown)" : " (hidden)"}
              </span>
            </button>

            {layersLoading && (
              <span className="text-[10px] font-mono uppercase tracking-wide text-[var(--text-faint)]">
                Loading…
              </span>
            )}
            {failedLayer && (
              <span className="text-[10px] text-[#e0483d]" role="status">
                {failedLayer.error instanceof Error
                  ? failedLayer.error.message
                  : "A layer failed to load"}
              </span>
            )}
            {/* A radar layer that silently draws nothing is indistinguishable
                from clear skies over the whole planet. */}
            {radar.isError && (
              <span className="text-[10px] text-[#e0483d]" role="status">
                {radar.error instanceof Error
                  ? radar.error.message
                  : "The weather radar layer failed to load"}
              </span>
            )}
            {showRadar && radar.data && (
              <span className="text-[10px] font-mono uppercase tracking-wide text-[var(--text-faint)]">
                Radar {new Date(radar.data.observedAt).toISOString().slice(11, 16)}Z
                {" · RainViewer"}
              </span>
            )}
          </div>
          <p className="sr-only" role="status">
            {activeLayers.length === 0
              ? "No natural event layers shown."
              : `Showing ${naturalEvents.length} events across ${activeLayers.length} layers.`}
          </p>
          <EarthquakeMap
            key={mapFocused ? "focused" : "default"}
            earthquakes={quakes}
            naturalEvents={naturalEvents}
            radarTileBase={showRadar ? radar.data?.tileBase ?? null : null}
            highlightTsunami={showTsunamiLayer}
            focusCenter={selectedFocus}
            height={mapFocused ? "calc(100vh - 8rem)" : "500px"}
          />
        </div>

        {/* Recent major events */}
        {major.length > 0 && (
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--accent-red)]" />
                <span className="text-[var(--text)] font-semibold text-sm">
                  {t.earth.majorEvents}
                </span>
              </div>
              <span className="text-xs font-mono text-[var(--text-faint)]">
                {t.earth.clickHint}
              </span>
            </div>
            <div className="space-y-2">
              {major.slice(0, 5).map((q) => {
                const [lon, lat] = q.geometry.coordinates;
                return (
                  <button
                    type="button"
                    key={q.id}
                    onClick={() => {
                      setSelectedFocus([lat, lon]);
                      document
                        .getElementById("seismic-map-panel")
                        ?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className="w-full glass-card p-4 flex items-center gap-4 text-left hover:border-[var(--border-strong)] transition-colors cursor-pointer"
                  >
                    <div
                      className="w-12 h-12 rounded-full border flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: "color-mix(in srgb, var(--accent-red) 35%, transparent)",
                        backgroundColor: "color-mix(in srgb, var(--accent-red) 10%, transparent)",
                      }}
                    >
                      <span className="text-[var(--accent-red)] font-bold font-mono text-sm tabular-nums">
                        {q.properties.mag.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text)] font-medium text-sm truncate">
                        {q.properties.place}
                      </p>
                      <p className="text-[var(--text-faint)] text-xs font-mono mt-0.5">
                        {formatDistanceToNow(q.properties.time, {
                          addSuffix: true,
                          locale: dateLocale,
                        })}{" "}
                        · {t.dashboard.earthquakes.depth} {q.geometry.coordinates[2].toFixed(0)}km
                      </p>
                    </div>
                    {q.properties.tsunami === 1 && (
                      <div className="flex items-center gap-1 text-[var(--accent)] text-xs font-mono shrink-0">
                        <Waves className="w-3.5 h-3.5" />
                        {t.dashboard.earthquakes.tsunami}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
