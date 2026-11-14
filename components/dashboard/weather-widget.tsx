"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Cloud,
  Sun,
  Sunrise,
  Sunset,
  Droplets,
  Wind,
  Moon,
  MapPin,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { fetchJson } from "@/lib/api-client";
import { FeedError } from "@/components/ui/feed-state";
import { useLocation } from "@/hooks/use-location";
import { useLocale } from "@/lib/i18n";

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    is_day: number;
    precipitation: number;
    wind_speed_10m: number;
    cloud_cover?: number;
  };
  daily: {
    sunrise: string[];
    sunset: string[];
  };
  airQuality?: {
    european_aqi?: number;
    pm2_5?: number;
    uv_index?: number;
  } | null;
  locationLabel: string | null;
  isLocalLocation: boolean;
}

export function WeatherWidget() {
  const { t } = useLocale();
  const { coords, status, request } = useLocation();

  const { data, isLoading, isError, error, refetch } = useQuery<WeatherData>({
    queryKey: ["weather", coords?.lat ?? null, coords?.lon ?? null],
    queryFn: () =>
      fetchJson(
        coords
          ? `/api/weather?lat=${coords.lat}&lon=${coords.lon}`
          : "/api/weather"
      ),
    refetchInterval: 1000 * 60 * 30,
  });

  if (isLoading) {
    return <div className="glass-panel h-48 skeleton" aria-busy="true" />;
  }

  if (isError || !data) {
    return (
      <div className="glass-panel h-48 flex items-center justify-center">
        <FeedError
          title={t.dashboard.weather.unavailable}
          error={error}
          icon={Cloud}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { current, daily, airQuality } = data;
  const isDay = current.is_day === 1;
  const cloudCover =
    typeof current.cloud_cover === "number" ? Math.round(current.cloud_cover) : null;

  const observingStatus =
    cloudCover === null
      ? null
      : cloudCover <= 25
      ? { label: t.dashboard.weather.observingClear, color: "var(--accent-green)" }
      : cloudCover <= 65
      ? { label: t.dashboard.weather.observingPartial, color: "var(--accent-amber)" }
      : { label: t.dashboard.weather.observingOvercast, color: "var(--accent-red)" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 relative overflow-hidden"
    >
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
              {data.isLocalLocation
                ? t.dashboard.weather.localTitle
                : t.dashboard.weather.defaultTitle}
            </span>
          </div>
          {data.isLocalLocation ? (
            <span className="text-[var(--text-faint)] text-xs font-mono">
              {t.dashboard.weather.yourLocation}
            </span>
          ) : status === "prompting" ? (
            <span className="text-[var(--text-faint)] text-xs">
              {t.dashboard.weather.locating}
            </span>
          ) : status === "denied" || status === "unavailable" ? (
            <span className="text-[var(--text-faint)] text-xs">
              {data.locationLabel}
            </span>
          ) : (
            <button
              type="button"
              onClick={request}
              className="inline-flex items-center gap-1.5 text-[var(--text-faint)] text-xs hover:text-[var(--text-dim)] transition-colors cursor-pointer"
              aria-label={t.dashboard.weather.useLocation}
            >
              <MapPin className="w-3 h-3" strokeWidth={1.5} />
              <span className="truncate">{data.locationLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="underline underline-offset-2 decoration-dotted">
                {t.dashboard.weather.useLocation}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-end justify-between gap-3 mb-4">
          <div className="flex items-end gap-2">
            <div className="text-5xl font-light tracking-tighter text-[var(--text)] tabular-nums">
              {Math.round(current.temperature_2m)}°
            </div>
            <div className="pb-1 text-[var(--text-dim)]">C</div>
          </div>

          {observingStatus && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[10px] font-mono"
              style={{ color: observingStatus.color }}
            >
              <Eye className="w-3 h-3" />
              {observingStatus.label}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex items-center gap-2">
            <Sunrise className="w-4 h-4 text-[var(--accent-amber)]" />
            <div>
              <div className="text-[var(--text-faint)] text-[10px] font-mono uppercase tracking-wider">
                {t.dashboard.weather.sunrise}
              </div>
              <div className="text-[var(--text)] text-sm font-mono tabular-nums">
                {format(new Date(daily.sunrise[0]), "HH:mm")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sunset className="w-4 h-4 text-[var(--text-dim)]" />
            <div>
              <div className="text-[var(--text-faint)] text-[10px] font-mono uppercase tracking-wider">
                {t.dashboard.weather.sunset}
              </div>
              <div className="text-[var(--text)] text-sm font-mono tabular-nums">
                {format(new Date(daily.sunset[0]), "HH:mm")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-[var(--accent-cyan)]" />
            <div>
              <div className="text-[var(--text-faint)] text-[10px] font-mono uppercase tracking-wider">
                {t.dashboard.weather.wind}
              </div>
              <div className="text-[var(--text)] text-sm font-mono tabular-nums">
                {current.wind_speed_10m} km/h
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-[var(--accent)]" />
            <div>
              <div className="text-[var(--text-faint)] text-[10px] font-mono uppercase tracking-wider">
                {t.dashboard.weather.humidity}
              </div>
              <div className="text-[var(--text)] text-sm font-mono tabular-nums">
                {current.relative_humidity_2m}%
              </div>
            </div>
          </div>

          {cloudCover !== null && (
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[var(--text-dim)]" />
              <div>
                <div className="text-[var(--text-faint)] text-[10px] font-mono uppercase tracking-wider">
                  {t.dashboard.weather.cloudCover}
                </div>
                <div className="text-[var(--text)] text-sm font-mono tabular-nums">
                  {cloudCover}%
                </div>
              </div>
            </div>
          )}

          {airQuality && typeof airQuality.european_aqi === "number" && (
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-[var(--text-dim)]" />
              <div>
                <div className="text-[var(--text-faint)] text-[10px] font-mono uppercase tracking-wider">
                  {t.dashboard.weather.airQuality}
                </div>
                <div className="text-[var(--text)] text-sm font-mono tabular-nums">
                  AQI {Math.round(airQuality.european_aqi)}
                  {typeof airQuality.uv_index === "number"
                    ? ` · UV ${airQuality.uv_index.toFixed(0)}`
                    : ""}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
