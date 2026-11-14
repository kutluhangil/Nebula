"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  Satellite,
  Rocket,
  AlertTriangle,
  Zap,
  Globe,
  Waves,
  Orbit,
  Sparkles,
} from "lucide-react";
import { fetchJson } from "@/lib/api-client";
import { useLocale } from "@/lib/i18n";

interface StatsBarProps {
  earthquakeCount: number | undefined;
  averageMagnitude: number | undefined;
}

interface Stat {
  icon: typeof Activity;
  label: string;
  value: string | number;
  unit?: string;
  state?: "alert" | "warn";
}

export function StatsBar({
  earthquakeCount,
  averageMagnitude,
}: StatsBarProps) {
  const { t } = useLocale();

  const { data: spacex } = useQuery({
    queryKey: ["spacex"],
    queryFn: () => fetchJson<{ upcoming?: unknown[] }>("/api/spacex"),
    staleTime: 1000 * 60 * 30,
  });

  const { data: spaceData } = useQuery({
    queryKey: ["space"],
    queryFn: () =>
      fetchJson<{ asteroids?: { is_potentially_hazardous_asteroid: boolean }[] }>(
        "/api/space"
      ),
    staleTime: 1000 * 60 * 60,
  });

  const { data: iss } = useQuery({
    queryKey: ["iss"],
    queryFn: () => fetchJson<{ velocity?: number; altitude?: number }>("/api/iss"),
    refetchInterval: 5000,
  });

  const { data: solar } = useQuery({
    queryKey: ["solar"],
    queryFn: () =>
      fetchJson<{
        kpIndex: number;
        auroraProbability: number;
        geoStorms: number;
      }>("/api/solar"),
    staleTime: 1000 * 60 * 5,
  });

  const upcomingLaunches = spacex?.upcoming?.length || 0;
  const hazardousAsteroids = (spaceData?.asteroids || []).filter(
    (a) => a.is_potentially_hazardous_asteroid
  ).length;

  const stats: Stat[] = [
    {
      icon: Activity,
      label: t.dashboard.stats.quakes,
      value: earthquakeCount ?? "—",
    },
    {
      icon: Waves,
      label: t.dashboard.stats.avgMag,
      value: averageMagnitude !== undefined ? averageMagnitude.toFixed(1) : "—",
    },
    {
      icon: Satellite,
      label: t.dashboard.stats.issSpeed,
      value: iss?.velocity ? Math.round(iss.velocity).toLocaleString() : "—",
      unit: iss?.velocity ? "km/h" : undefined,
    },
    {
      icon: Orbit,
      label: t.dashboard.stats.issAlt,
      value: iss?.altitude ? Math.round(iss.altitude).toLocaleString() : "—",
      unit: iss?.altitude ? "km" : undefined,
    },
    {
      icon: Rocket,
      label: t.dashboard.stats.launches,
      value: upcomingLaunches || "—",
      unit: upcomingLaunches ? t.dashboard.stats.upcomingUnit : undefined,
    },
    {
      icon: AlertTriangle,
      label: t.dashboard.stats.hazardous,
      value: spaceData ? hazardousAsteroids : "—",
      state: hazardousAsteroids > 0 ? "warn" : undefined,
    },
    {
      icon: Zap,
      label: t.dashboard.stats.kp,
      value: solar ? solar.kpIndex : "—",
      state: solar && solar.kpIndex >= 5 ? "alert" : undefined,
    },
    {
      icon: Globe,
      label: t.dashboard.stats.aurora,
      value: solar ? solar.auroraProbability : "—",
      unit: solar ? "%" : undefined,
    },
    {
      icon: Sparkles,
      label: t.dashboard.stats.storms,
      value: solar ? solar.geoStorms : "—",
      unit: solar ? "24h" : undefined,
      state: solar && solar.geoStorms > 0 ? "alert" : undefined,
    },
  ];

  const stateColor = {
    alert: "text-[var(--accent-red)]",
    warn: "text-[var(--accent-amber)]",
  } as const;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 divide-y sm:divide-y lg:divide-y-0 sm:divide-x divide-[var(--border)] border border-[var(--border)] rounded-xl bg-[var(--surface-1)]/80 overflow-hidden">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.025, ease: [0.16, 1, 0.3, 1] }}
            className="inset-well !border-0 !rounded-none !bg-transparent px-4 py-3.5 hover:!bg-[var(--surface-2)]/60 transition-colors"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Icon
                className="w-3 h-3 text-[var(--text-faint)] flex-shrink-0"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span className="eyebrow !text-[9px] !tracking-[0.16em] truncate">
                {stat.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`font-mono tabular text-[1.125rem] leading-none font-medium ${
                  stat.state ? stateColor[stat.state] : "text-[var(--text)]"
                }`}
              >
                {stat.value}
              </span>
              {stat.unit && (
                <span className="text-[10px] text-[var(--text-faint)] font-mono">
                  {stat.unit}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
