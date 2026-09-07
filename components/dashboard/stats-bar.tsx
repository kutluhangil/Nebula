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
} from "lucide-react";
import { fetchJson } from "@/lib/api-client";

interface StatsBarProps {
  /** Undefined until the earthquake feed answers, so loading reads as "—". */
  earthquakeCount: number | undefined;
  /** Undefined while loading and on a feed with no reviewed magnitudes. */
  averageMagnitude: number | undefined;
}

interface Stat {
  icon: typeof Activity;
  /** Short enough to sit on one line at a quarter of the header width. */
  label: string;
  value: string | number;
  /** Rendered a step down from the value, so "27,527" carries the weight. */
  unit?: string;
  /** Set only when the number itself means something is elevated. */
  state?: "alert" | "warn";
}

export function StatsBar({
  earthquakeCount,
  averageMagnitude,
}: StatsBarProps) {
  const { data: spacex } = useQuery({
    queryKey: ["spacex"],
    queryFn: () => fetchJson<{ upcoming?: unknown[] }>("/api/spacex"),
    staleTime: 1000 * 60 * 30,
  });

  const { data: spaceData } = useQuery({
    queryKey: ["space"],
    queryFn: () => fetchJson<{ asteroids?: { is_potentially_hazardous_asteroid: boolean }[] }>("/api/space"),
    staleTime: 1000 * 60 * 60,
  });

  // The ISS reports its measured velocity; this tile used to print a fixed
  // nominal figure that stayed on screen even when the feed was down. The query
  // key matches the tracker's, so React Query serves both from one request.
  const { data: iss } = useQuery({
    queryKey: ["iss"],
    queryFn: () =>
      fetchJson<{ velocity?: number; altitude?: number }>("/api/iss"),
    refetchInterval: 5000,
  });

  const { data: solar } = useQuery({
    queryKey: ["solar"],
    queryFn: () =>
      fetchJson<{ kpIndex: number; auroraProbability: number }>("/api/solar"),
    staleTime: 1000 * 60 * 5,
  });

  const upcomingLaunches = spacex?.upcoming?.length || 0;
  const hazardousAsteroids = (spaceData?.asteroids || []).filter(
    (a: { is_potentially_hazardous_asteroid: boolean }) =>
      a.is_potentially_hazardous_asteroid
  ).length;

  const stats: Stat[] = [
    {
      icon: Activity,
      label: "Quakes · 7d",
      value: earthquakeCount ?? "—",
    },
    {
      icon: Waves,
      label: "Avg mag · 7d",
      // One decimal: the feed's own magnitudes carry no more precision.
      value: averageMagnitude !== undefined ? averageMagnitude.toFixed(1) : "—",
    },
    {
      icon: Satellite,
      label: "ISS speed",
      value: iss?.velocity ? Math.round(iss.velocity).toLocaleString() : "—",
      unit: iss?.velocity ? "km/h" : undefined,
    },
    {
      icon: Orbit,
      label: "ISS altitude",
      // Measured altitude above the ellipsoid, not the nominal 408 km.
      value: iss?.altitude ? Math.round(iss.altitude).toLocaleString() : "—",
      unit: iss?.altitude ? "km" : undefined,
    },
    {
      icon: Rocket,
      label: "Launches",
      value: upcomingLaunches || "—",
      unit: upcomingLaunches ? "upcoming" : undefined,
    },
    {
      icon: AlertTriangle,
      label: "Hazardous",
      value: spaceData ? hazardousAsteroids : "—",
      // A count above zero is the whole point of the tile; colour it only then.
      state: hazardousAsteroids > 0 ? "warn" : undefined,
    },
    {
      icon: Zap,
      label: "Kp index",
      value: solar ? solar.kpIndex : "—",
      // NOAA calls Kp 5 and above a geomagnetic storm.
      state: solar && solar.kpIndex >= 5 ? "alert" : undefined,
    },
    {
      icon: Globe,
      label: "Aurora",
      value: solar ? solar.auroraProbability : "—",
      unit: solar ? "%" : undefined,
    },
  ];

  const stateColor = {
    alert: "text-[var(--accent-red)]",
    warn: "text-[var(--accent-amber)]",
  } as const;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="inset-well px-3 py-2.5"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
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
                className={`font-mono tabular text-[1.0625rem] leading-none font-medium ${
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
