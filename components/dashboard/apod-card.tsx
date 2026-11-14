"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Share2,
  Maximize2,
  ExternalLink,
  ImageOff,
  ChevronLeft,
  ChevronRight,
  Play,
  Check,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { fetchJson } from "@/lib/api-client";
import { FeedError } from "@/components/ui/feed-state";
import { useModal } from "@/hooks/use-modal";
import { useLocale } from "@/lib/i18n";

interface APODData {
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  thumbnail_url?: string;
  media_type: string;
  date: string;
  copyright?: string;
}

function shiftIsoDate(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d.toISOString().split("T")[0];
}

export function APODCard() {
  const { t } = useLocale();
  const [dayOffset, setDayOffset] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeFullscreen = useCallback(() => setFullscreen(false), []);
  const modalRef = useModal(fullscreen, closeFullscreen);

  const selectedDate = useMemo(() => shiftIsoDate(dayOffset), [dayOffset]);
  const endpoint = dayOffset === 0 ? "/api/apod" : `/api/apod?date=${selectedDate}`;

  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery<APODData>({
      queryKey: ["apod", dayOffset === 0 ? "today" : selectedDate],
      queryFn: () => fetchJson<APODData>(endpoint),
      staleTime: 1000 * 60 * 60,
    });

  const handleShare = async () => {
    if (!data?.url) return;
    if (navigator.share) {
      await navigator.share({ title: data.title, url: data.url });
    } else {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  if (isLoading) {
    return <div className="glass-panel h-80 skeleton" aria-busy="true" />;
  }

  if (isError || !data?.url) {
    return (
      <div className="glass-panel min-h-80 flex flex-col justify-center">
        <FeedError
          title={t.dashboard.apod.unavailable}
          error={error}
          detailFallback={t.dashboard.apod.detailFallback}
          icon={ImageOff}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
        {dayOffset > 0 && (
          <div className="pb-6 flex justify-center">
            <button
              type="button"
              onClick={() => setDayOffset(0)}
              className="btn-ghost !min-h-0 !px-3 !py-1.5 !text-xs cursor-pointer"
            >
              {t.dashboard.apod.today}
            </button>
          </div>
        )}
      </div>
    );
  }

  const isVideo = data.media_type === "video";
  const displayImage = isVideo ? data.thumbnail_url : data.url;
  const isYoutube =
    isVideo &&
    (data.url.includes("youtube.com/embed/") || data.url.includes("player.vimeo.com/"));

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel overflow-hidden flex flex-col"
      >
        {/* Plate navigation bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]/60">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-dim)]">
            <span>{data.date}</span>
            {dayOffset > 0 && (
              <button
                type="button"
                onClick={() => setDayOffset(0)}
                className="text-[10px] uppercase tracking-wider text-[var(--accent)] hover:underline cursor-pointer"
              >
                {t.dashboard.apod.today}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDayOffset((d) => Math.min(6, d + 1))}
              disabled={dayOffset >= 6 || isFetching}
              aria-label={t.dashboard.apod.prevDay}
              title={t.dashboard.apod.prevDay}
              className="w-7 h-7 rounded-md bezel flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-35 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDayOffset((d) => Math.max(0, d - 1))}
              disabled={dayOffset === 0 || isFetching}
              aria-label={t.dashboard.apod.nextDay}
              title={t.dashboard.apod.nextDay}
              className="w-7 h-7 rounded-md bezel flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-35 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Media frame */}
        <div className="relative h-56 md:h-72 overflow-hidden bg-[var(--surface-3)]">
          {isVideo && isYoutube ? (
            <iframe
              src={data.url}
              title={data.title}
              className="w-full h-full border-0"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : displayImage ? (
            <>
              <Image
                src={displayImage}
                alt={data.title}
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                unoptimized
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              {!isVideo && (
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFullscreen(true)}
                    className="w-8 h-8 rounded-lg bg-black/55 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white/85 hover:text-white transition-all cursor-pointer"
                    aria-label="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {isVideo && (
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 text-white text-[11px] font-mono border border-white/15"
                >
                  <Play className="w-3 h-3" />
                  {t.dashboard.apod.todayVideo}
                </a>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-serif text-lg leading-tight text-white mb-1">
                  {data.title}
                </h3>
                <p className="text-xs text-white/75 font-mono">
                  {data.date}
                  {data.copyright && ` · © ${data.copyright}`}
                </p>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3">
              <span className="eyebrow-pill">{t.dashboard.apod.todayVideo}</span>
              <h3 className="font-serif text-xl text-[var(--text)]">{data.title}</h3>
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost !min-h-0 !px-3.5 !py-2 !text-xs"
              >
                {t.dashboard.apod.watchExternal}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            {isVideo && isYoutube && (
              <h3 className="font-serif text-lg leading-tight text-[var(--text)] mb-1.5">
                {data.title}
              </h3>
            )}
            <p className="text-[var(--text-dim)] text-sm leading-relaxed line-clamp-3">
              {data.explanation}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4">
            {data?.date && (
              <FavoriteButton
                item={{
                  id: `apod-${data.date}`,
                  type: "apod",
                  title: data.title || "APOD",
                  subtitle: data.date,
                  imageUrl: displayImage || data.url,
                  date: data.date,
                  data,
                }}
              />
            )}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)] text-xs font-medium hover:text-[var(--text)] transition-all cursor-pointer"
              aria-label={t.common.share}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                  {t.common.copied}
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  {t.common.share}
                </>
              )}
            </button>
            <a
              href={data.hdurl || data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)] text-xs font-medium hover:text-[var(--text)] transition-all ml-auto"
            >
              {isVideo ? t.dashboard.apod.watchExternal : "HD"}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen modal */}
      {fullscreen && !isVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ backgroundColor: "var(--modal-scrim)" }}
          onClick={closeFullscreen}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={data.title}
            tabIndex={-1}
            className="relative max-w-5xl max-h-[90vh] w-full glass-card rounded-2xl p-3 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={data.hdurl || data.url}
              alt={data.title}
              width={1920}
              height={1080}
              className="rounded-xl object-contain max-h-[78vh] w-auto mx-auto"
              unoptimized
            />
            <div className="mt-3 flex items-center justify-between gap-4 px-1">
              <p className="font-serif text-base text-[var(--text)] truncate">
                {data.title}
              </p>
              <span className="font-mono text-xs text-[var(--text-faint)] shrink-0">
                {data.date}
              </span>
            </div>
            <button
              type="button"
              onClick={closeFullscreen}
              className="absolute top-5 right-5 w-8 h-8 rounded-lg bezel text-[var(--text-dim)] hover:text-[var(--text)] flex items-center justify-center cursor-pointer"
              aria-label={t.common.closeFullscreen}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
