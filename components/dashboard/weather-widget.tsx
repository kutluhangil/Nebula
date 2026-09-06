"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Cloud, Sun, Sunrise, Sunset, Droplets, Wind, Moon, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fetchJson } from "@/lib/api-client";
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
      <div className="glass-panel p-5 h-48 flex flex-col items-center justify-center gap-3 text-center">
        <Cloud className="w-5 h-5 text-[var(--text-faint)]" />
        <p className="text-[var(--text-dim)] text-sm">
          Weather is unavailable right now.
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

  const { current, daily } = data;
  const isDay = current.is_day === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-6 opacity-10">
        {isDay ? <Sun className="w-32 h-32" /> : <Moon className="w-32 h-32" />}
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="w-4 h-4 text-sky-400" />
          <span className="text-[var(--text-dim)] font-semibold text-sm">
            {data.isLocalLocation ? "Local Weather" : "Space Coast Weather"}
          </span>
          {data.isLocalLocation ? (
            <span className="text-[var(--text-faint)] text-xs ml-auto">Your location</span>
          ) : status === "prompting" ? (
            <span className="text-[var(--text-faint)] text-xs ml-auto">Locating…</span>
          ) : status === "denied" || status === "unavailable" ? (
            <span className="text-[var(--text-faint)] text-xs ml-auto">
              {data.locationLabel}
            </span>
          ) : (
            <button
              onClick={request}
              className="flex items-center gap-1 ml-auto text-[var(--text-faint)] text-xs hover:text-[var(--text-dim)] transition-colors"
              aria-label="Use my location for weather"
            >
              <MapPin className="w-3 h-3" />
              {data.locationLabel} · Use my location
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
