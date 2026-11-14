"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, Shield } from "lucide-react";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { fetchJson } from "@/lib/api-client";
import { FeedError } from "@/components/ui/feed-state";
import { useLocale } from "@/lib/i18n";

interface Asteroid {
  id: string;
  name: string;
  is_potentially_hazardous_asteroid: boolean;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  close_approach_data: {
    relative_velocity: { kilometers_per_hour: string };
    miss_distance: { kilometers: string };
    close_approach_date: string;
  }[];
}

interface SpaceData {
  asteroids: Asteroid[];
}

const KM_PER_LUNAR_DISTANCE = 384_400;

export function AsteroidCard() {
  const { t } = useLocale();
  const { data, isLoading, isError, error, refetch } = useQuery<SpaceData>({
    queryKey: ["space"],
    queryFn: () => fetchJson("/api/space"),
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading) {
    return <div className="glass-panel h-64 skeleton" aria-busy="true" />;
  }

  if (isError || !data) {
    return (
      <div className="glass-panel h-64 flex items-center justify-center">
        <FeedError
          title={t.dashboard.asteroids.unavailable}
          error={error}
          icon={AlertTriangle}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const asteroids = data.asteroids || [];
  const hazardous = asteroids.filter((a) => a.is_potentially_hazardous_asteroid);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-4 h-full flex flex-col justify-between"
    >
      <div>
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="inset-well rounded-xl p-3 text-center">
            <div
              className={`text-2xl font-bold font-mono tabular-nums mb-0.5 ${
                hazardous.length > 0 ? "text-[var(--accent-amber)]" : "text-[var(--text)]"
              }`}
            >
              {hazardous.length}
            </div>
            <div className="text-[var(--text-faint)] text-[10px] font-mono uppercase tracking-wider">
              {t.dashboard.asteroids.hazardous}
            </div>
          </div>
          <div className="inset-well rounded-xl p-3 text-center">
            <div className="text-2xl font-bold font-mono tabular-nums text-[var(--text)] mb-0.5">
              {asteroids.length}
            </div>
            <div className="text-[var(--text-faint)] text-[10px] font-mono uppercase tracking-wider">
              {t.dashboard.asteroids.totalToday}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {asteroids.slice(0, 5).map((asteroid) => {
            const approach = asteroid.close_approach_data?.[0];
            const isHazardous = asteroid.is_potentially_hazardous_asteroid;
            const diameterAvg =
              (asteroid.estimated_diameter.kilometers.estimated_diameter_min +
                asteroid.estimated_diameter.kilometers.estimated_diameter_max) /
              2;
            const missKm = approach ? parseFloat(approach.miss_distance.kilometers) : 0;
            const lunarDistances = missKm / KM_PER_LUNAR_DISTANCE;

            return (
              <div
                key={asteroid.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isHazardous
                    ? "bg-[var(--surface-2)] border-[var(--accent-amber)]/35"
                    : "bg-[var(--surface)] border-[var(--border)]"
                }`}
              >
                <div className="flex-shrink-0">
                  {isHazardous ? (
                    <AlertTriangle className="w-4 h-4 text-[var(--accent-amber)]" />
                  ) : (
                    <Shield className="w-4 h-4 text-[var(--text-faint)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text)] text-xs font-medium truncate">
                    {asteroid.name.replace(/[()]/g, "")}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5 font-mono text-[10px] text-[var(--text-faint)]">
                    <span>⌀ {(diameterAvg * 1000).toFixed(0)}m</span>
                    {approach && (
                      <>
                        <span>·</span>
                        <span>{(missKm / 1_000_000).toFixed(2)}M km</span>
                        <span>·</span>
                        <span>
                          {lunarDistances.toFixed(1)} {t.dashboard.asteroids.lunarDist}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {approach && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-[10px] text-[var(--text-dim)] font-mono tabular-nums">
                      {parseFloat(
                        approach.relative_velocity.kilometers_per_hour
                      ).toFixed(0)}{" "}
                      km/h
                    </div>
                    <FavoriteButton
                      item={{
                        id: `asteroid-${asteroid.id}`,
                        type: "asteroid",
                        title: asteroid.name.replace(/[()]/g, ""),
                        subtitle: `⌀ ${(diameterAvg * 1000).toFixed(0)}m · ${lunarDistances.toFixed(1)} LD`,
                        date: approach.close_approach_date,
                        data: asteroid,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {asteroids.length === 0 && (
        <div className="text-center py-8 text-[var(--text-faint)] text-sm">
          {t.dashboard.asteroids.empty}
        </div>
      )}
    </motion.div>
  );
}
