"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
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
  const [mapFocused, setMapFocused] = useState(false);
  const [activeLayers, setActiveLayers] = useState<EventCategory[]>([]);
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="badge-live">Live Monitor</div>
          </div>
          <h1
            className="font-serif text-4xl md:text-5xl text-[var(--text)]"
           
          >
            Earth{" "}
            <span className="italic text-[var(--accent)]">Intelligence</span>
          </h1>
          <p className="text-[var(--text-faint)] text-sm mt-1">
            USGS · Earthquakes M{earthquakeThreshold}.0+ · Last 7 days{tsunamiOnly ? " · Tsunami flagged" : ""}
          </p>
        </motion.div>

        {/* Shared with the dashboard watchlist, so monitoring choices travel with the user. */}
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--text-dim)]">Seismic view filters</p>
            <p className="mt-0.5 text-xs text-[var(--text-faint)]">These match your dashboard watchlist.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([4, 5, 6] as EarthquakeThreshold[]).map((threshold) => (
              <button
                type="button"
                key={threshold}
                onClick={() => setEarthquakeThreshold(threshold)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors ${earthquakeThreshold === threshold ? "border-[var(--accent)] bg-[var(--surface-hover)] text-[var(--text)]" : "border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-dim)]"}`}
              >
                M{threshold}+
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTsunamiOnly(!tsunamiOnly)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${tsunamiOnly ? "border-blue-400/40 bg-blue-500/10 text-blue-300" : "border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text-dim)]"}`}
            >
              Tsunami only
            </button>
          </div>
        </div>

        {/* Counting an empty list as zero events would state, on the strength of
            a failed request, that the planet recorded no earthquakes this week. */}
        {quakesFailed && (
          <div className="mb-6 glass-card">
            <FeedError
              title="USGS seismic data is unavailable right now."
              error={quakesError}
              icon={Activity}
              onRetry={() => refetchQuakes()}
            />
          </div>
        )}

        {/* Stats. The surface stays neutral; colour is reserved for the two
            counts that actually escalate, so a busy week reads at a glance. */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total events", value: quakes.length, tone: "text-[var(--text)]" },
            { label: "Major (M6+)", value: major.length, tone: major.length > 0 ? "text-[var(--accent-red)]" : "text-[var(--text)]" },
            { label: "Moderate (M5+)", value: moderate.length, tone: "text-[var(--text)]" },
            { label: "Tsunami alerts", value: tsunamiAlerts.length, tone: tsunamiAlerts.length > 0 ? "text-[var(--accent-amber)]" : "text-[var(--text)]" },
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

        {/* Distribution + relationship charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <MagnitudeChart earthquakes={quakes} />
          <DepthChart earthquakes={quakes} />
        </div>

        {/* Map */}
        <div className={mapFocused ? "fixed inset-3 z-[90] flex flex-col rounded-2xl border border-[var(--border-strong)] bg-[var(--bg)] p-3 shadow-[var(--panel-shadow)] sm:inset-8" : "mb-6"}>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-[var(--text-dim)] font-semibold text-sm">
              Interactive Seismic Map
            </span>
            <div className="ml-auto flex items-center gap-3 text-xs text-[var(--text-faint)]">
              {MAGNITUDE_BANDS.map((b) => (
                <span key={b.key} className="flex items-center gap-1">
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
                className="ml-1 inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-[var(--text-faint)] transition-colors hover:text-[var(--text-dim)]"
              >
                {mapFocused ? <X className="h-3 w-3" /> : <Focus className="h-3 w-3" />}
                {mapFocused ? "Close" : "Focus"}
              </button>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-faint)]">
              Layers
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
            height={mapFocused ? "calc(100vh - 8rem)" : "500px"}
          />
        </div>

        {/* Recent major events */}
        {major.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-[var(--text-dim)] font-semibold text-sm">
                Major Events (M6+)
              </span>
            </div>
            <div className="space-y-2">
              {major.slice(0, 5).map((q) => (
                <div
                  key={q.id}
                  className="glass-card p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-400 font-bold font-mono text-sm">
                      {q.properties.mag.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[var(--text-dim)] font-medium text-sm">
                      {q.properties.place}
                    </p>
                    <p className="text-[var(--text-faint)] text-xs mt-0.5">
                      {formatDistanceToNow(q.properties.time, {
                        addSuffix: true,
                      })}{" "}
                      · Depth {q.geometry.coordinates[2].toFixed(0)}km
                    </p>
                  </div>
                  {q.properties.tsunami === 1 && (
                    <div className="flex items-center gap-1 text-blue-400 text-xs">
                      <Waves className="w-3.5 h-3.5" />
                      Tsunami
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
