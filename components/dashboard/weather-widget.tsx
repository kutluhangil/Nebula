"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Cloud, Sun, Sunrise, Sunset, Droplets, Wind, Moon, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fetchJson } from "@/lib/api-client";
import { FeedError } from "@/components/ui/feed-state";
import { useLocation } from "@/hooks/use-location";

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    is_day: number;
    precipitation: number;
    wind_speed_10m: number;
  };
  daily: {
    sunrise: string[];
    sunset: string[];
  };
  locationLabel: string | null;
  isLocalLocation: boolean;
}

export function WeatherWidget() {
  const { coords, status, request } = useLocation();

  const { data, isLoading, isError, error, refetch } = useQuery<WeatherData>({
    queryKey: ["weather", coords?.lat ?? null, coords?.lon ?? null],
    queryFn: () =>
      fetchJson(
        coords
          ? `/api/weather?lat=${coords.lat}&lon=${coords.lon}`
          : "/api/weather"
      ),
    refetchInterval: 1000 * 60 * 30, // 30 mins
  });

  if (isLoading) {
    return <div className="glass-panel h-48 skeleton" aria-busy="true" />;
  }

  if (isError || !data) {
    return (
      <div className="glass-panel h-48 flex items-center justify-center">
        <FeedError
          title="Weather is unavailable right now."
          error={error}
          icon={Cloud}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { current, daily } = data;
  const isDay = current.is_day === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 relative overflow-hidden"
    >
      {/* Decorative only: pushed past the corner so it sits behind the panel's
          own padding instead of under the location control. */}
      <div
        className="absolute -top-8 -right-8 opacity-[0.05] pointer-events-none"
        aria-hidden="true"
      >
        {isDay ? (
          <Sun className="w-40 h-40" strokeWidth={0.75} />
        ) : (
          <Moon className="w-40 h-40" strokeWidth={0.75} />
        )}
      </div>

      <div className="relative z-10">
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-[var(--accent-cyan)]" strokeWidth={1.5} />
            <span className="text-[var(--text)] font-medium text-sm">
              {data.isLocalLocation ? "Local weather" : "Space Coast weather"}
            </span>
          </div>
          {/* The location control sits on its own line: at a third of the
              dashboard width it wrapped into the title and over the artwork. */}
          {data.isLocalLocation ? (
            <span className="text-[var(--text-faint)] text-xs">Your location</span>
          ) : status === "prompting" ? (
            <span className="text-[var(--text-faint)] text-xs">Locating…</span>
          ) : status === "denied" || status === "unavailable" ? (
            <span className="text-[var(--text-faint)] text-xs">
              {data.locationLabel}
            </span>
          ) : (
            <button
              onClick={request}
              className="inline-flex items-center gap-1.5 text-[var(--text-faint)] text-xs hover:text-[var(--text-dim)] transition-colors"
              aria-label="Use my location for weather"
            >
              <MapPin className="w-3 h-3" strokeWidth={1.5} />
              <span className="truncate">{data.locationLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="underline underline-offset-2 decoration-dotted">
                Use my location
              </span>
            </button>
          )}
        </div>

        <div className="flex items-end gap-3 mb-6">
          <div className="text-5xl font-light tracking-tighter text-[var(--text)]">
            {Math.round(current.temperature_2m)}°
          </div>
          <div className="pb-1 text-[var(--text-dim)]">C</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sunrise className="w-4 h-4 text-[var(--text-dim)]" />
              <div>
                <div className="text-[var(--text-faint)] text-[10px] uppercase tracking-wider">Sunrise</div>
                <div className="text-[var(--text)] text-sm font-mono">{format(new Date(daily.sunrise[0]), "HH:mm")}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sunset className="w-4 h-4 text-rose-400" />
              <div>
                <div className="text-[var(--text-faint)] text-[10px] uppercase tracking-wider">Sunset</div>
                <div className="text-[var(--text)] text-sm font-mono">{format(new Date(daily.sunset[0]), "HH:mm")}</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-teal-400" />
              <div>
                <div className="text-[var(--text-faint)] text-[10px] uppercase tracking-wider">Wind</div>
                <div className="text-[var(--text)] text-sm font-mono">{current.wind_speed_10m} km/h</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[var(--text-dim)]" />
              <div>
                <div className="text-[var(--text-faint)] text-[10px] uppercase tracking-wider">Humidity</div>
                <div className="text-[var(--text)] text-sm font-mono">{current.relative_humidity_2m}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
