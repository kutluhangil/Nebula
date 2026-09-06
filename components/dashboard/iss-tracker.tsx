"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Gauge, ArrowUp, Eye, Sun, Satellite } from "lucide-react";
import { fetchJson } from "@/lib/api-client";
import { useLocation } from "@/hooks/use-location";

interface ISSPosition {
  iss_position: { latitude: string; longitude: string };
  timestamp: number;
  altitude?: number;
  velocity?: number;
  visibility?: string;
  footprint?: number;
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

/**
 * wheretheiss.at reports three lighting states: the station in daylight, in
 * Earth's shadow, or sunlit while the ground below is dark — the last being
 * the only one where it can be seen from the surface.
 */
const VISIBILITY_LABELS: Record<string, string> = {
  daylight: "Sunlit",
  eclipsed: "Eclipsed",
  visible: "Visible now",
};

/** Compass point for a bearing, e.g. 305 -> "NW". */
function compass(degrees: number): string {
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round(degrees / 45) % 8];
}

function ISSGlobe({
  lat,
  lon,
}: {
  lat: number;
  lon: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.4;

    ctx.clearRect(0, 0, size, size);

    // Glow
    const glow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.3);
    glow.addColorStop(0, "rgba(14, 165, 233, 0.1)");
    glow.addColorStop(1, "rgba(14, 165, 233, 0)");
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Globe
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const bg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
    bg.addColorStop(0, "#1a3a6a");
    bg.addColorStop(0.5, "#0d2040");
    bg.addColorStop(1, "#050f20");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    // Grid lines
    ctx.strokeStyle = "rgba(14, 165, 233, 0.1)";
    ctx.lineWidth = 0.5;
    for (let lat = -75; lat <= 75; lat += 30) {
      const y = cy - (lat / 90) * r;
      const rLat = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
      ctx.beginPath();
      ctx.ellipse(cx, y, rLat, rLat * 0.12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let lng = 0; lng < 360; lng += 30) {
      const angle = (lng * Math.PI) / 180;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.abs(Math.cos(angle)) * r, r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // ISS position dot
    const issLng = ((lon + 180) / 360) * Math.PI * 2 - Math.PI / 2;
    const issLat = (lat / 90) * (Math.PI / 2);
    const issX = cx + Math.cos(issLat) * Math.sin(issLng) * r;
    const issY = cy - Math.sin(issLat) * r;

    // Orbit ring (simplified)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.25);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(14, 165, 233, 0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.restore();

    // ISS dot
    const issGlow = ctx.createRadialGradient(issX, issY, 0, issX, issY, 12);
    issGlow.addColorStop(0, "rgba(14, 165, 233, 0.8)");
    issGlow.addColorStop(0.4, "rgba(14, 165, 233, 0.3)");
    issGlow.addColorStop(1, "rgba(14, 165, 233, 0)");
    ctx.beginPath();
    ctx.arc(issX, issY, 12, 0, Math.PI * 2);
    ctx.fillStyle = issGlow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(issX, issY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#0ea5e9";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(issX, issY, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Label
    ctx.fillStyle = "rgba(14, 165, 233, 0.9)";
    ctx.font = "bold 8px 'JetBrains Mono', monospace";
    ctx.fillText("ISS", issX + 8, issY - 5);
  }, [lat, lon]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className="w-full max-w-[180px] mx-auto"
      aria-label="ISS position on globe"
    />
  );
}

export function ISSTracker() {
  const { coords, status, request } = useLocation();

  const { data, isLoading, isError, error, refetch } = useQuery<ISSPosition>({
    queryKey: ["iss"],
    queryFn: () => fetchJson("/api/iss"),
    refetchInterval: 5000,
  });

  // Pass prediction is observer-specific, so it only runs once the viewer has
  // shared a location.
  const { data: passData } = useQuery<ISSPasses>({
    queryKey: ["iss-passes", coords?.lat ?? null, coords?.lon ?? null],
    queryFn: () =>
      fetchJson(`/api/iss/passes?lat=${coords!.lat}&lon=${coords!.lon}`),
    enabled: Boolean(coords),
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return <div className="glass-panel h-64 skeleton" aria-busy="true" />;
  }

  // Falling back to zero here would draw the station off the coast of Africa
  // and label it live telemetry. With no position there is nothing honest to
  // render, so the card says so instead.
  if (isError || !data) {
    return (
      <div className="glass-panel p-4 h-64 flex flex-col items-center justify-center gap-3 text-center">
        <Satellite className="w-5 h-5 text-[var(--text-faint)]" />
        <p className="text-[var(--text-dim)] text-sm">
          ISS telemetry is unavailable right now.
        </p>
        <p className="text-[var(--text-faint)] text-xs max-w-xs">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)] text-xs font-medium hover:text-[var(--text)] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const lat = parseFloat(data.iss_position.latitude);
  const lon = parseFloat(data.iss_position.longitude);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-4"
    >
      <ISSGlobe lat={lat} lon={lon} />

      <div className="grid grid-cols-2 gap-2 mt-4">
        <StatItem
          icon={MapPin}
          label="Latitude"
          value={`${lat.toFixed(4)}°`}
          color="text-[var(--text-dim)]"
        />
        <StatItem
          icon={MapPin}
          label="Longitude"
          value={`${lon.toFixed(4)}°`}
          color="text-[var(--text-dim)]"
        />
        <StatItem
          icon={ArrowUp}
          label="Altitude"
          value={data?.altitude ? `${Math.round(data.altitude)} km` : "— km"}
          color="text-cyan-400"
        />
        <StatItem
          icon={Gauge}
          label="Speed"
          value={
            data?.velocity
              ? `${Math.round(data.velocity).toLocaleString()} km/h`
              : "— km/h"
          }
          color="text-[var(--text-dim)]"
        />
        <StatItem
          icon={Sun}
          label="Sunlight"
          value={
            data?.visibility
              ? VISIBILITY_LABELS[data.visibility] ?? data.visibility
              : "—"
          }
          color="text-[var(--text-dim)]"
        />
        <StatItem
          icon={Eye}
          label="Footprint"
          value={data?.footprint ? `${data.footprint.toLocaleString()} km` : "—"}
          color="text-[var(--text-dim)]"
        />
      </div>

      {/* Next visible pass — requires the viewer's location. */}
      <div className="mt-3 pt-3 border-t border-[var(--border)]">
        {!coords ? (
          <button
            onClick={request}
            disabled={status === "prompting"}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-[var(--text-faint)] hover:text-[var(--text-dim)] transition-colors disabled:opacity-50"
          >
            <MapPin className="w-3 h-3" />
            {status === "prompting"
              ? "Locating…"
              : status === "denied"
              ? "Location denied — pass times unavailable"
              : "Use my location for next visible pass"}
          </button>
        ) : passData?.nextVisible ? (
          <div className="text-xs">
            <div className="flex items-center gap-1.5 text-[var(--text-faint)] mb-1">
              <Eye className="w-3 h-3" />
              Next visible pass
            </div>
            <div className="text-[var(--text)] font-mono">
              {new Date(passData.nextVisible.start).toLocaleString([], {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="text-[var(--text-faint)] mt-0.5">
              {Math.round(passData.nextVisible.durationSeconds / 60)} min ·
              peaks {passData.nextVisible.peakElevation}° ·{" "}
              {compass(passData.nextVisible.startAzimuth)} to{" "}
              {compass(passData.nextVisible.endAzimuth)}
            </div>
          </div>
        ) : passData ? (
          <p className="text-xs text-[var(--text-faint)] text-center">
            No visible pass in the next 48 hours.
          </p>
        ) : (
          <p className="text-xs text-[var(--text-faint)] text-center">
            Computing passes…
          </p>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-faint)] text-center font-mono">
        Updated {data?.timestamp ? new Date(data.timestamp * 1000).toLocaleTimeString() : "—"}
      </div>
    </motion.div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
      <div className="flex items-center gap-1 text-[var(--text-faint)] text-[10px] uppercase tracking-wide">
        <Icon className={`w-3 h-3 ${color}`} />
        {label}
      </div>
      <div className={`text-sm font-semibold font-mono ${color}`}>{value}</div>
    </div>
  );
}
