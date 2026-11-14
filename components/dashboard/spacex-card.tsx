"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Rocket, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { fetchJson } from "@/lib/api-client";
import { FeedError } from "@/components/ui/feed-state";
import { Countdown } from "@/components/ui/countdown";
import { useNow } from "@/hooks/use-now";
import { useLocale } from "@/lib/i18n";

interface Launch {
  id: string;
  name: string;
  date_utc: string;
  success: boolean | null;
  details: string | null;
  links: { patch: { small: string | null } };
  rocket: string;
  launchpad: string;
  provider?: string;
}

interface SpaceXData {
  latest: Launch | null;
  upcoming: Launch[];
}

export function SpaceXCard() {
  const { t, dateLocale } = useLocale();
  const { data, isLoading, isError, error, refetch } = useQuery<SpaceXData>({
    queryKey: ["spacex"],
    queryFn: () => fetchJson("/api/spacex"),
    staleTime: 1000 * 60 * 30,
  });
  const now = useNow();

  if (isLoading) {
    return <div className="glass-panel h-72 skeleton" aria-busy="true" />;
  }

  if (isError || !data) {
    return (
      <div className="glass-panel h-72 flex items-center justify-center">
        <FeedError
          title={t.dashboard.spacex.unavailable}
          error={error}
          icon={Rocket}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const latest = data.latest;
  const upcoming = data.upcoming ?? [];
  const scheduled = upcoming.find((launch) =>
    now === null ? false : new Date(launch.date_utc).getTime() > now
  );
  const nextLaunch = scheduled ?? upcoming[0];
  const windowOpened =
    nextLaunch !== undefined &&
    now !== null &&
    new Date(nextLaunch.date_utc).getTime() <= now;
  const remainingLaunches = upcoming.filter(
    (launch) => launch.id !== nextLaunch?.id
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 space-y-4 h-full flex flex-col justify-between"
    >
      <div className="space-y-4">
        {/* Latest Launch */}
        {latest && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <span className="eyebrow !text-[10px]">
                  {t.dashboard.spacex.latest}
                </span>
              </div>
              <FavoriteButton
                item={{
                  id: `spacex-${latest.id}`,
                  type: "spacex",
                  title: latest.name,
                  subtitle: format(new Date(latest.date_utc), "MMM d, yyyy", {
                    locale: dateLocale,
                  }),
                  imageUrl: latest.links?.patch?.small || undefined,
                  date: latest.date_utc,
                  data: latest,
                }}
              />
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {latest.links?.patch?.small ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={latest.links.patch.small}
                    alt={latest.name}
                    className="w-9 h-9 object-cover"
                  />
                ) : (
                  <Rocket className="w-4 h-4 text-[var(--text-dim)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-[var(--text)] font-semibold text-sm truncate">
                    {latest.name}
                  </h4>
                  {latest.success === true && (
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--accent-green)] flex-shrink-0" />
                  )}
                  {latest.success === false && (
                    <XCircle className="w-3.5 h-3.5 text-[var(--accent-red)] flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-[var(--text-faint)] text-xs font-mono">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(latest.date_utc), "MMM d, yyyy", {
                    locale: dateLocale,
                  })}
                </div>
                {latest.details && (
                  <p className="text-[var(--text-dim)] text-xs mt-1.5 line-clamp-2 leading-relaxed">
                    {latest.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="section-divider" />

        {/* Next Launch */}
        {nextLaunch && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
                <span className="eyebrow !text-[10px]">
                  {t.dashboard.spacex.next}
                </span>
              </div>
              <span className="text-[var(--text-faint)] text-[11px] font-mono">
                {windowOpened
                  ? t.dashboard.spacex.windowOpen
                  : formatDistanceToNow(new Date(nextLaunch.date_utc), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
              </span>
            </div>

            <div className="inset-well p-3.5 space-y-2.5">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
                <span className="text-[var(--text)] font-medium text-sm truncate">
                  {nextLaunch.name}
                </span>
              </div>
              {windowOpened ? (
                <p className="text-xs text-[var(--text-faint)]">
                  {t.dashboard.spacex.windowNote}
                </p>
              ) : (
                <Countdown
                  targetDate={nextLaunch.date_utc}
                  labels={{
                    days: t.launches.days,
                    hrs: t.launches.hrs,
                    min: t.launches.min,
                    sec: t.launches.sec,
                    windowOpen: t.dashboard.spacex.windowOpen,
                  }}
                />
              )}
              <div className="flex items-center gap-1.5 text-[var(--text-faint)] text-xs font-mono">
                <Clock className="w-3 h-3" />
                {format(new Date(nextLaunch.date_utc), "MMM d, yyyy · HH:mm", {
                  locale: dateLocale,
                })}{" "}
                UTC
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming list */}
      {remainingLaunches.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
          {remainingLaunches.slice(0, 2).map((launch) => (
            <div
              key={launch.id}
              className="flex items-center justify-between py-1.5 text-xs gap-3"
            >
              <span className="text-[var(--text-dim)] truncate">{launch.name}</span>
              <span className="text-[var(--text-faint)] font-mono flex-shrink-0">
                {format(new Date(launch.date_utc), "MMM d", {
                  locale: dateLocale,
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
