"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Zap, Sun, Activity } from "lucide-react";
import { kpColor } from "@/lib/dataviz";
import { fetchJson } from "@/lib/api-client";

const KP_LEVELS = ["Quiet", "Quiet", "Unsettled", "Active", "Minor Storm", "Moderate Storm", "Strong Storm", "Severe Storm", "Extreme Storm"];

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
  const percentage = (value / 9) * 100;
  const color = kpColor(value);

  return (
    <div className="relative">
      <div className="flex items-end justify-between mb-2">
        <div>
          <div
            className="tabular text-4xl font-bold font-mono"
            style={{ color }}
          >
            {value}
          </div>
          <div className="text-[var(--text-faint)] text-xs">KP Index</div>
        </div>
        <div className="text-right">
          <div className="text-[var(--text-dim)] text-sm font-medium">
            {KP_LEVELS[Math.min(value, 8)]}
          </div>
          <div className="text-[var(--text-faint)] text-xs">Activity Level</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      {/* Scale */}
      <div className="flex justify-between mt-1 text-[9px] text-[var(--text-faint)] font-mono">
        <span>0</span>
        <span>3</span>
        <span>5</span>
        <span>7</span>
        <span>9</span>
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
      <div className="glass-panel p-5 flex flex-col items-center justify-center gap-3 h-80 text-center">
        <Zap className="w-5 h-5 text-[var(--text-faint)]" />
        <p className="text-[var(--text-dim)] text-sm">
          NOAA space weather is unavailable right now.
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
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/10 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Sun className="w-3 h-3 text-[var(--text-dim)]" />
            <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-wide">
              Solar Flares
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-[var(--text-dim)]">
            {solarFlares}
          </div>
          <div className="text-[10px] text-[var(--text-faint)]">Today</div>
        </div>
        <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3 text-red-400" />
            <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-wide">
              Geo Storms
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-red-400">
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
