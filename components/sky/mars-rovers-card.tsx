"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Thermometer, Camera } from "lucide-react";
import { fetchJson } from "@/lib/api-client";
import { FeedError, FeedSkeleton } from "@/components/ui/feed-state";
import { useLocale } from "@/lib/i18n";

interface CuriosityPayload {
  sol: number | null;
  terrestrialDate: string | null;
  minTempC: number | null;
  maxTempC: number | null;
  pressurePa: number | null;
  atmoOpacity: string | null;
  uvIndex: string | null;
  sunrise: string | null;
  sunset: string | null;
  source: string;
}

interface PerseverancePhoto {
  sol: number | null;
  dateTakenUtc: string | null;
  instrument: string;
  title: string;
  imageUrl: string;
}

interface MarsCombinedPayload {
  curiosity?: CuriosityPayload | null;
  perseverancePhotos?: PerseverancePhoto[];
}

/** Live surface dispatches from Curiosity REMS and Perseverance raw cameras. */
export function MarsRoversCard() {
  const { t } = useLocale();
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const { data, isLoading, isError, error, refetch } = useQuery<MarsCombinedPayload>({
    queryKey: ["mars-weather"],
    queryFn: () => fetchJson<MarsCombinedPayload>("/api/mars"),
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading) return <FeedSkeleton rows={5} />;

  if (isError || !data) {
    return (
      <FeedError
        message="Mars rover telemetry is unavailable right now."
        detail={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
      />
    );
  }

  const curiosity = data.curiosity ?? null;
  const photos = (data.perseverancePhotos ?? []).filter(
    (p) => p.imageUrl && !failedImages[p.imageUrl]
  );

  return (
    <section
      aria-label={t.sky.marsLiveTitle}
      className="glass-card rounded-2xl p-6 space-y-5"
    >
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div>
          <span className="eyebrow text-[var(--accent-green)]">
            {t.sky.kinds.live}
          </span>
          <h3 className="font-serif text-2xl font-normal tracking-tight text-[var(--text)] mt-1">
            {t.sky.marsLiveTitle}
          </h3>
        </div>
        <span className="eyebrow-pill shrink-0">
          <Thermometer className="h-3 w-3 text-[var(--accent)]" aria-hidden="true" />
          NASA Mars 2020 · MSL
        </span>
      </div>

      {curiosity && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-dim)]">
            <span className="font-medium text-[var(--text)]">
              {t.sky.curiosityWeather}
            </span>
            <span className="font-mono text-[11px]">
              {curiosity.sol !== null ? `Sol ${curiosity.sol}` : ""}
              {curiosity.terrestrialDate ? ` · ${curiosity.terrestrialDate}` : ""}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="inset-well rounded-lg px-3 py-2">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-faint)]">
                High / Low
              </div>
              <div className="text-sm font-mono font-semibold text-[var(--text)] mt-0.5">
                {curiosity.maxTempC !== null ? `${curiosity.maxTempC}°C` : "—"} /{" "}
                {curiosity.minTempC !== null ? `${curiosity.minTempC}°C` : "—"}
              </div>
            </div>
            <div className="inset-well rounded-lg px-3 py-2">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-faint)]">
                Pressure
              </div>
              <div className="text-sm font-mono font-semibold text-[var(--text)] mt-0.5">
                {curiosity.pressurePa !== null ? `${curiosity.pressurePa} Pa` : "—"}
              </div>
            </div>
            <div className="inset-well rounded-lg px-3 py-2">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-faint)]">
                Opacity
              </div>
              <div className="text-sm font-mono font-semibold text-[var(--text)] mt-0.5">
                {curiosity.atmoOpacity ?? "—"}
              </div>
            </div>
            <div className="inset-well rounded-lg px-3 py-2">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-faint)]">
                UV / Daylight
              </div>
              <div className="text-sm font-mono font-semibold text-[var(--text)] mt-0.5 truncate">
                {curiosity.uvIndex ?? "—"}
                {curiosity.sunrise && curiosity.sunset
                  ? ` · ${curiosity.sunrise}–${curiosity.sunset}`
                  : ""}
              </div>
            </div>
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--text)] flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
              {t.sky.perseveranceCam}
            </span>
            <span className="font-mono text-[11px] text-[var(--text-faint)]">
              Jezero Crater
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {photos.map((photo, idx) => (
              <figure
                key={`${photo.imageUrl}-${idx}`}
                className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]"
              >
                <div className="aspect-square overflow-hidden bg-[var(--surface-3)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    loading="lazy"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [photo.imageUrl]: true }))
                    }
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="px-2 py-1.5 text-[10px] font-mono text-[var(--text-dim)] truncate">
                  {photo.sol !== null ? `Sol ${photo.sol} · ` : ""}
                  {photo.instrument}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
