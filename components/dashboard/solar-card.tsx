"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Zap, Sun, Activity } from "lucide-react";
import { kpColor } from "@/lib/dataviz";
import { fetchJson } from "@/lib/api-client";
import { FeedError } from "@/components/ui/feed-state";

// NOAA SWPC reads the planetary K index against its G storm scale: Kp 0-2 is
// quiet, 3 unsettled, 4 active, and a geomagnetic storm only begins at Kp 5
// (G1) running to Kp 9 (G5). The index into this array is the Kp value itself,
// so it needs an entry for every level from 0 to 9. It previously held nine
// entries starting the storm bands one step early, which announced a storm on
// merely active days.
const KP_LEVELS = [
  "Quiet",
  "Quiet",
  "Quiet",
  "Unsettled",
  "Active",
  "Minor Storm",
  "Moderate Storm",
  "Strong Storm",
  "Severe Storm",
  "Extreme Storm",
];

interface SolarData {
  kpIndex: number;
  observedAt: string;
  auroraProbability: number;
  auroraObservedAt: string;
  geoStorms: number;
  solarFlares: number;
  source: string;
}

function KPGauge({ value }: { value: number }) {
  const color = kpColor(value);
  // NOAA reports Kp on a 0–9 integer scale, so the track is drawn as the ten
  // steps it actually has rather than a continuous bar: the reader can see
  // which step the planet is on and how far it is from the storm boundary.
  const steps = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div className="relative">
      <div className="flex items-end justify-between mb-3">
        <div>
          <div
            className="tabular text-4xl font-mono font-medium leading-none"
            style={{ color }}
          >
            {value}
          </div>
          <div className="text-[var(--text-faint)] text-xs mt-1.5">KP Index</div>
        </div>
        <div className="text-right">
          <div className="text-[var(--text)] text-sm font-medium">
            {KP_LEVELS[Math.min(Math.max(value, 0), KP_LEVELS.length - 1)]}
          </div>
          <div className="text-[var(--text-faint)] text-xs">Activity Level</div>
        </div>
      </div>

      <div className="flex gap-[2px]" role="img" aria-label={`Kp ${value} of 9`}>
        {steps.map((step) => {
          const reached = step <= value;
          return (
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: step * 0.03 }}
              className="h-2 flex-1 rounded-[2px]"
              style={{
                backgroundColor: reached ? kpColor(step) : "var(--surface-3)",
              }}
            />
          );
        })}
      </div>

      {/* The storm boundary is the number that matters, so it is written on
          the scale rather than left for the reader to count to. */}
      <div className="flex justify-between mt-1.5 text-[9px] text-[var(--text-faint)] font-mono">
        <span>0 quiet</span>
        <span>5 storm</span>
        <span>9 extreme</span>
      </div>
    </div>
  );
}

export function SolarCard() {
  const { data, isLoading, isError, error, refetch } = useQuery<SolarData>({
    queryKey: ["solar"],
    queryFn: () => fetchJson<SolarData>("/api/solar"),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <div className="glass-panel h-80 skeleton" aria-busy="true" />;
  }

  if (isError || !data) {
    return (
      <div className="glass-panel h-80 flex items-center justify-center">
        <FeedError
          title="NOAA space weather is unavailable right now."
          error={error}
          icon={Zap}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const kpIndex = data.kpIndex;
  const auroraProb = data.auroraProbability;
  const solarFlares = data.solarFlares;
  const geoStorms = data.geoStorms;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 space-y-5"
    >
      <KPGauge value={kpIndex} />

      <div className="section-divider" />

      {/* Aurora probability */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
            <Activity className="w-3.5 h-3.5 text-[var(--text-dim)]" />
            Aurora Probability
          </div>
          <span className="text-[var(--text-dim)] font-mono text-sm font-semibold">
            {auroraProb}%
          </span>
        </div>
        <div className="h-1 bg-[var(--surface)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${auroraProb}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-full rounded-full bg-[var(--accent-cyan)]"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="inset-well p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Sun className="w-3 h-3 text-[var(--text-dim)]" />
            <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-wide">
              Solar Flares
            </span>
          </div>
          <div className="text-lg font-mono tabular font-medium text-[var(--text)]">
            {solarFlares}
          </div>
          <div className="text-[10px] text-[var(--text-faint)]">Today</div>
        </div>
        <div className="inset-well p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3 text-[var(--text-dim)]" strokeWidth={1.5} />
            <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-wide">
              Geo Storms
            </span>
          </div>
          <div
            className={`text-lg font-mono tabular font-medium ${
              geoStorms > 0 ? "text-[var(--accent-red)]" : "text-[var(--text)]"
            }`}
          >
            {geoStorms}
          </div>
          <div className="text-[10px] text-[var(--text-faint)]">Active</div>
        </div>
      </div>

      <div className="text-[10px] text-[var(--text-faint)] text-center">
        Source: {data.source} · Kp observed {data.observedAt.replace("T", " ")} UTC
      </div>
    </motion.div>
  );
}
