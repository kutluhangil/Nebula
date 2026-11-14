"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Gauge, ArrowUp, Eye, Sun, Satellite } from "lucide-react";
import { fetchJson } from "@/lib/api-client";
import { FeedError } from "@/components/ui/feed-state";
import { useLocation } from "@/hooks/use-location";
import { useLocale } from "@/lib/i18n";

interface TrackPoint {
  lat: number;
  lon: number;
}

interface ISSPosition {
  iss_position: { latitude: string; longitude: string };
  timestamp: number;
  altitude?: number;
  velocity?: number;
  visibility?: string;
  footprint?: number;
  groundTrack?: TrackPoint[];
}

interface ISSPass {
  start: string;
  peak: string;
  end: string;
  durationSeconds: number;
  peakElevation: number;
  startAzimuth: number;
  endAzimuth: number;
  visible: boolean;
}

interface ISSPasses {
  passes: ISSPass[];
  nextVisible: ISSPass | null;
}

function compass(degrees: number): string {
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round(degrees / 45) % 8];
}

/** Equirectangular projection helper for a 360x180 world SVG frame. */
function project(lat: number, lon: number): { x: number; y: number } {
  return {
    x: lon + 180,
    y: 90 - lat,
  };
}

/** Splits the 90-minute orbital path into clean segments when crossing the antimeridian. */
function buildTrackSegments(points: TrackPoint[]): string[] {
  if (points.length < 2) return [];
  const segments: string[] = [];
  let current: string[] = [];
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const prev = i > 0 ? points[i - 1] : null;
    if (prev && Math.abs(pt.lon - prev.lon) > 180) {
      if (current.length > 1) segments.push(current.join(" "));
      current = [];
    }
    const { x, y } = project(pt.lat, pt.lon);
    current.push(`${current.length === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  if (current.length > 1) segments.push(current.join(" "));
  return segments;
}

// Simplified equirectangular continent outlines (360x180 coordinate space)
const LAND_PATHS = [
  // North America
  "M15,24 L40,18 L84,18 L112,28 L124,38 L108,48 L96,55 L86,70 L78,78 L72,68 L62,64 L54,54 L46,42 L28,36 Z",
  // South America
  "M99,78 L114,80 L142,94 L145,112 L130,132 L114,148 L104,144 L104,116 L96,95 Z",
  // Greenland
  "M118,8 L154,7 L158,20 L134,26 L120,20 Z",
  // Europe + Asia
  "M169,36 L186,26 L216,20 L270,18 L322,22 L344,32 L322,42 L308,58 L294,76 L278,78 L266,68 L254,78 L242,66 L222,64 L206,56 L186,52 L172,48 Z",
  // Africa
  "M166,55 L192,53 L214,62 L228,80 L218,108 L206,125 L194,124 L186,102 L172,88 L162,72 Z",
  // Australia
  "M293,104 L322,102 L334,116 L326,130 L298,128 L290,116 Z",
];

function OrbitalMap({
  lat,
  lon,
  groundTrack,
}: {
  lat: number;
  lon: number;
  groundTrack: TrackPoint[];
}) {
  const pos = project(lat, lon);
  const trackPaths = useMemo(
    () => buildTrackSegments(groundTrack),
    [groundTrack]
  );

  return (
    <div className="relative rounded-xl overflow-hidden inset-well p-2">
      <svg
        viewBox="0 0 360 180"
        className="w-full h-auto block"
        role="img"
        aria-label={`ISS orbital ground track over ${lat.toFixed(1)}°, ${lon.toFixed(1)}°`}
      >
        {/* Graticule grid */}
        {[-60, -30, 0, 30, 60].map((phi) => (
          <line
            key={`lat-${phi}`}
            x1={0}
            y1={90 - phi}
            x2={360}
            y2={90 - phi}
            stroke="var(--border)"
            strokeWidth={phi === 0 ? 0.7 : 0.4}
            strokeDasharray={phi === 0 ? undefined : "2 3"}
          />
        ))}
        {[-120, -60, 0, 60, 120].map((lam) => (
          <line
            key={`lon-${lam}`}
            x1={lam + 180}
            y1={0}
            x2={lam + 180}
            y2={180}
            stroke="var(--border)"
            strokeWidth={lam === 0 ? 0.7 : 0.4}
            strokeDasharray={lam === 0 ? undefined : "2 3"}
          />
        ))}

        {/* Landmasses */}
        {LAND_PATHS.map((d, idx) => (
          <path
            key={idx}
            d={d}
            fill="var(--surface-3)"
            stroke="var(--border-strong)"
            strokeWidth={0.5}
            opacity={0.8}
          />
        ))}

        {/* 90-minute SGP4 ground track */}
        {trackPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth={1.3}
            strokeDasharray="3 2.5"
            opacity={0.85}
          />
        ))}

        {/* Horizon footprint (~20 deg radius in low Earth orbit) */}
        <circle
          cx={pos.x}
          cy={pos.y}
          r={20}
          fill="var(--accent)"
          fillOpacity={0.12}
          stroke="var(--accent)"
          strokeWidth={0.8}
          strokeDasharray="2 2"
        />

        {/* ISS marker */}
        <circle cx={pos.x} cy={pos.y} r={3.4} fill="var(--accent)" />
        <circle
          cx={pos.x}
          cy={pos.y}
          r={6.5}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={0.9}
          opacity={0.6}
        />

        <text
          x={pos.x > 295 ? pos.x - 42 : pos.x + 8}
          y={pos.y < 16 ? pos.y + 11 : pos.y - 6}
          fontSize="7.5"
          fontFamily="var(--font-mono)"
          fill="var(--text)"
        >
          ISS {lat.toFixed(1)}°, {lon.toFixed(1)}°
        </text>
      </svg>
    </div>
  );
}

export function ISSTracker() {
  const { t, locale } = useLocale();
  const { coords, status, request } = useLocation();

  const { data, isLoading, isError, error, refetch } = useQuery<ISSPosition>({
    queryKey: ["iss"],
    queryFn: () => fetchJson<ISSPosition>("/api/iss"),
    refetchInterval: 5000,
  });

  const { data: passData } = useQuery<ISSPasses>({
    queryKey: ["iss-passes", coords?.lat, coords?.lon],
    queryFn: () =>
      fetchJson<ISSPasses>(
        `/api/iss/passes?lat=${coords!.lat}&lon=${coords!.lon}`
      ),
    enabled: Boolean(coords),
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return <div className="glass-panel h-80 skeleton" aria-busy="true" />;
  }

  if (isError || !data) {
    return (
      <div className="glass-panel h-80 flex items-center justify-center">
        <FeedError
          title={t.dashboard.iss.unavailable}
          error={error}
          icon={Satellite}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const lat = parseFloat(data.iss_position.latitude);
  const lon = parseFloat(data.iss_position.longitude);

  const visibilityLabels: Record<string, string> = {
    daylight: t.dashboard.iss.daylight,
    eclipsed: t.dashboard.iss.eclipsed,
    visible: t.dashboard.iss.visible,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-4"
    >
      <OrbitalMap lat={lat} lon={lon} groundTrack={data.groundTrack ?? []} />

      <div className="grid grid-cols-2 gap-2 mt-4">
        <StatItem
          icon={MapPin}
          label={t.dashboard.iss.lat}
          value={`${lat.toFixed(3)}°`}
          tone="text-[var(--text)]"
        />
        <StatItem
          icon={MapPin}
          label={t.dashboard.iss.lon}
          value={`${lon.toFixed(3)}°`}
          tone="text-[var(--text)]"
        />
        <StatItem
          icon={ArrowUp}
          label={t.dashboard.iss.alt}
          value={data?.altitude ? `${Math.round(data.altitude)} km` : "— km"}
          tone="text-[var(--accent-cyan)]"
        />
        <StatItem
          icon={Gauge}
          label={t.dashboard.iss.speed}
          value={
            data?.velocity
              ? `${Math.round(data.velocity).toLocaleString()} km/h`
              : "— km/h"
          }
          tone="text-[var(--text)]"
        />
        <StatItem
          icon={Sun}
          label={t.dashboard.iss.sunlight}
          value={
            data?.visibility
              ? visibilityLabels[data.visibility] ?? data.visibility
              : "—"
          }
          tone="text-[var(--text-dim)]"
        />
        <StatItem
          icon={Eye}
          label={t.dashboard.iss.footprint}
          value={data?.footprint ? `${data.footprint.toLocaleString()} km` : "—"}
          tone="text-[var(--text-dim)]"
        />
      </div>

      {/* Next visible pass */}
      <div className="mt-3 pt-3 border-t border-[var(--border)]">
        {!coords ? (
          <button
            type="button"
            onClick={request}
            disabled={status === "prompting"}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <MapPin className="w-3 h-3" />
            {status === "prompting"
              ? t.dashboard.iss.locating
              : status === "denied"
              ? t.dashboard.iss.denied
              : t.dashboard.iss.useLocation}
          </button>
        ) : passData?.nextVisible ? (
          <div className="text-xs">
            <div className="flex items-center gap-1.5 text-[var(--text-faint)] mb-1">
              <Eye className="w-3 h-3" />
              {t.dashboard.iss.nextPass}
            </div>
            <div className="text-[var(--text)] font-mono">
              {new Date(passData.nextVisible.start).toLocaleString(
                locale === "tr" ? "tr-TR" : "en-US",
                {
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </div>
            <div className="text-[var(--text-faint)] mt-0.5 font-mono text-[11px]">
              {Math.round(passData.nextVisible.durationSeconds / 60)} min ·{" "}
              {t.dashboard.iss.peaks} {passData.nextVisible.peakElevation}° ·{" "}
              {compass(passData.nextVisible.startAzimuth)} →{" "}
              {compass(passData.nextVisible.endAzimuth)}
            </div>
          </div>
        ) : passData ? (
          <p className="text-xs text-[var(--text-faint)] text-center">
            {t.dashboard.iss.noPass}
          </p>
        ) : (
          <p className="text-xs text-[var(--text-faint)] text-center">
            {t.dashboard.iss.computing}
          </p>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-faint)] text-center font-mono">
        {t.dashboard.iss.updated}{" "}
        {data?.timestamp ? new Date(data.timestamp * 1000).toLocaleTimeString() : "—"}
      </div>
    </motion.div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
      <div className="flex items-center gap-1 text-[var(--text-faint)] text-[10px] font-mono uppercase tracking-wide">
        <Icon className={`w-3 h-3 ${tone}`} />
        {label}
      </div>
      <div className={`text-sm font-semibold font-mono tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}
