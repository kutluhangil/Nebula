"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Zap, Sun, Activity, Wind, Maximize2 } from "lucide-react";
import { kpColor } from "@/lib/dataviz";
import { fetchJson } from "@/lib/api-client";
import { FeedError } from "@/components/ui/feed-state";
import { useModal } from "@/hooks/use-modal";
import { useLocale } from "@/lib/i18n";

interface KpPoint {
  timeTag: string;
  kp: number;
}

interface SolarWind {
  speedKms: number;
  density: number | null;
  bt: number | null;
  bz: number | null;
  source: string;
  observedAt: string;
}

interface SolarData {
  kpIndex: number;
  observedAt: string;
  kpHistory?: KpPoint[];
  auroraProbability: number;
  auroraObservedAt: string;
  geoStorms: number;
  solarFlares: number;
  solarWind?: SolarWind | null;
  sdoImageUrl?: string;
  source: string;
}

function KPGauge({ value }: { value: number }) {
  const { t } = useLocale();
  const color = kpColor(value);
  const steps = Array.from({ length: 10 }, (_, i) => i);

  const kpLevels = [
    t.dashboard.solar.quiet,
    t.dashboard.solar.quiet,
    t.dashboard.solar.quiet,
    t.dashboard.solar.unsettled,
    t.dashboard.solar.active,
    t.dashboard.solar.minor,
    t.dashboard.solar.moderate,
    t.dashboard.solar.strong,
    t.dashboard.solar.severe,
    t.dashboard.solar.extreme,
  ];

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
          <div className="text-[var(--text-faint)] text-xs mt-1.5">
            {t.dashboard.solar.kpIndex}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[var(--text)] text-sm font-medium">
            {kpLevels[Math.min(Math.max(value, 0), kpLevels.length - 1)]}
          </div>
          <div className="text-[var(--text-faint)] text-xs">
            {t.dashboard.solar.activityLevel}
          </div>
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

      <div className="flex justify-between mt-1.5 text-[9px] text-[var(--text-faint)] font-mono">
        <span>0 {t.dashboard.solar.quiet.toLowerCase()}</span>
        <span>5 G1</span>
        <span>9 G5</span>
      </div>
    </div>
  );
}

function KpSparkline({ history }: { history: KpPoint[] }) {
  const { t } = useLocale();
  if (history.length < 2) return null;

  const w = 240;
  const h = 44;
  const pts = history.map((point, idx) => {
    const x = (idx / (history.length - 1)) * w;
    const y = h - (Math.min(9, Math.max(0, point.kp)) / 9) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const stormY = h - (5 / 9) * (h - 6) - 3;

  return (
    <div className="inset-well p-2.5 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
          {t.dashboard.solar.kpTrend}
        </span>
        <span className="text-[10px] font-mono text-[var(--text-faint)]">
          Kp {history[0].kp.toFixed(0)} → {history[history.length - 1].kp.toFixed(0)}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9 overflow-visible" aria-hidden="true">
        <line
          x1={0}
          y1={stormY}
          x2={w}
          y2={stormY}
          stroke="var(--accent-amber)"
          strokeWidth={0.7}
          strokeDasharray="2 3"
          opacity={0.55}
        />
        <polyline
          fill="none"
          stroke="var(--accent-cyan)"
          strokeWidth={1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={pts.join(" ")}
        />
      </svg>
    </div>
  );
}

export function SolarCard() {
  const { t } = useLocale();
  const [sunModalOpen, setSunModalOpen] = useState(false);
  const closeModal = useCallback(() => setSunModalOpen(false), []);
  const modalRef = useModal(sunModalOpen, closeModal);

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
          title={t.dashboard.solar.unavailable}
          error={error}
          icon={Zap}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { kpIndex, auroraProbability: auroraProb, solarFlares, geoStorms, solarWind, kpHistory } = data;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-5 space-y-4"
      >
        <KPGauge value={kpIndex} />

        {kpHistory && kpHistory.length > 1 && <KpSparkline history={kpHistory} />}

        {/* Aurora probability */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
              <Activity className="w-3.5 h-3.5 text-[var(--text-dim)]" />
              {t.dashboard.solar.auroraProb}
            </div>
            <span className="text-[var(--text)] font-mono text-sm font-semibold tabular-nums">
              {auroraProb}%
            </span>
          </div>
          <div className="h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${auroraProb}%` }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="h-full rounded-full bg-[var(--accent-cyan)]"
            />
          </div>
        </div>

        {/* Stats + Solar wind */}
        <div className="grid grid-cols-2 gap-2">
          <div className="inset-well p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Sun className="w-3 h-3 text-[var(--text-dim)]" />
              <span className="text-[10px] font-mono text-[var(--text-faint)] uppercase tracking-wide">
                {t.dashboard.solar.flares}
              </span>
            </div>
            <div className="text-lg font-mono tabular font-medium text-[var(--text)]">
              {solarFlares}
            </div>
            <div className="text-[10px] text-[var(--text-faint)]">{t.dashboard.solar.today}</div>
          </div>

          <div className="inset-well p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-[var(--text-dim)]" strokeWidth={1.5} />
              <span className="text-[10px] font-mono text-[var(--text-faint)] uppercase tracking-wide">
                {t.dashboard.solar.storms}
              </span>
            </div>
            <div
              className={`text-lg font-mono tabular font-medium ${
                geoStorms > 0 ? "text-[var(--accent-red)]" : "text-[var(--text)]"
              }`}
            >
              {geoStorms}
            </div>
            <div className="text-[10px] text-[var(--text-faint)]">{t.dashboard.solar.active24h}</div>
          </div>

          {solarWind && (
            <>
              <div className="inset-well p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wind className="w-3 h-3 text-[var(--accent-cyan)]" />
                  <span className="text-[10px] font-mono text-[var(--text-faint)] uppercase tracking-wide">
                    {t.dashboard.solar.solarWind}
                  </span>
                </div>
                <div className="text-sm font-mono font-medium text-[var(--text)] tabular-nums">
                  {solarWind.speedKms} km/s
                </div>
                {solarWind.density !== null && (
                  <div className="text-[10px] font-mono text-[var(--text-faint)]">
                    {solarWind.density} p/cm³
                  </div>
                )}
              </div>

              <div className="inset-well p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="w-3 h-3 text-[var(--text-dim)]" />
                  <span className="text-[10px] font-mono text-[var(--text-faint)] uppercase tracking-wide">
                    {t.dashboard.solar.bzField}
                  </span>
                </div>
                <div
                  className={`text-sm font-mono font-medium tabular-nums ${
                    solarWind.bz !== null && solarWind.bz < -4
                      ? "text-[var(--accent-amber)]"
                      : "text-[var(--text)]"
                  }`}
                >
                  {solarWind.bz !== null ? `${solarWind.bz} nT` : "—"}
                </div>
                {solarWind.bt !== null && (
                  <div className="text-[10px] font-mono text-[var(--text-faint)]">
                    Bt {solarWind.bt} nT
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* SDO AIA 171A preview strip */}
        {data.sdoImageUrl && (
          <button
            type="button"
            onClick={() => setSunModalOpen(true)}
            className="w-full inset-well rounded-xl p-2 flex items-center gap-3 hover:border-[var(--border-strong)] transition-colors cursor-pointer text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.sdoImageUrl}
              alt={t.dashboard.solar.liveSun}
              className="w-11 h-11 rounded-lg object-cover bg-black shrink-0"
              loading="lazy"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-[var(--text)] truncate">
                {t.dashboard.solar.liveSun}
              </div>
              <div className="text-[10px] font-mono text-[var(--text-faint)]">
                NASA SDO · EUV 171Å
              </div>
            </div>
            <Maximize2 className="w-3.5 h-3.5 text-[var(--text-faint)] shrink-0 mr-1" />
          </button>
        )}

        <div className="text-[10px] text-[var(--text-faint)] text-center font-mono">
          {t.common.source}: {data.source} · Kp observed {data.observedAt.replace("T", " ")} UTC
        </div>
      </motion.div>

      {sunModalOpen && data.sdoImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ backgroundColor: "var(--modal-scrim)" }}
          onClick={closeModal}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.dashboard.solar.liveSun}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full glass-card rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-[var(--text)]">
                {t.dashboard.solar.liveSun}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                aria-label={t.common.close}
                className="w-8 h-8 rounded-lg bezel flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] cursor-pointer"
              >
                ✕
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.sdoImageUrl}
              alt={t.dashboard.solar.liveSun}
              className="w-full rounded-xl bg-black object-contain aspect-square"
            />
            <p className="text-xs font-mono text-[var(--text-faint)]">
              NASA Solar Dynamics Observatory (AIA 171Å extreme ultraviolet)
            </p>
          </div>
        </div>
      )}
    </>
  );
}
