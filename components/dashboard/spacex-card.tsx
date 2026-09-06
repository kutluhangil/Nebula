"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Rocket, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useState, useEffect } from "react";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { fetchJson } from "@/lib/api-client";
import { useNow } from "@/hooks/use-now";

interface Launch {
  id: string;
  name: string;
  date_utc: string;
  success: boolean | null;
  details: string | null;
  links: { patch: { small: string | null } };
  rocket: string;
  launchpad: string;
}

interface SpaceXData {
  latest: Launch;
  upcoming: Launch[];
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Launched!");
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${d}d ${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div
      className="text-[var(--text-dim)] font-mono text-sm font-semibold"
      aria-live="polite"
    >
      {timeLeft}
    </div>
  );
}

export function SpaceXCard() {
  const { data, isLoading, isError, error, refetch } = useQuery<SpaceXData>({
    queryKey: ["spacex"],
    queryFn: () => fetchJson("/api/spacex"),
    staleTime: 1000 * 60 * 30,
  });
  const now = useNow();

  if (isLoading) {
    return <div className="glass-panel h-72 skeleton" aria-busy="true" />;
  }

  // Every section below is guarded on its own slice of the payload, so without
  // one the card used to render as an empty panel with no explanation.
  if (isError || !data) {
    return (
      <div className="glass-panel p-5 h-72 flex flex-col items-center justify-center gap-3 text-center">
        <Rocket className="w-5 h-5 text-[var(--text-faint)]" />
        <p className="text-[var(--text-dim)] text-sm">
          Launch data is unavailable right now.
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

  const latest = data?.latest;
  // Launch Library keeps a mission in its upcoming feed until a human confirms
  // the outcome, so the first entry is regularly a launch that already flew.
  // Prefer the first genuinely future mission and say so when none is left.
  const upcoming = data?.upcoming ?? [];
  const scheduled = upcoming.find((launch) =>
    now === null ? false : new Date(launch.date_utc).getTime() > now,
  );
  // Before the clock ticks, the feed's own order is the only ordering there is.
  const nextLaunch = scheduled ?? upcoming[0];
  const windowOpened =
    nextLaunch !== undefined &&
    now !== null &&
    new Date(nextLaunch.date_utc).getTime() <= now;
  const remainingLaunches = upcoming.filter(
    (launch) => launch.id !== nextLaunch?.id,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 space-y-4"
    >
      {/* Latest Launch */}
      {latest && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-xs text-[var(--text-faint)] uppercase tracking-widest">Latest Launch</span>
            </div>
            <FavoriteButton 
              item={{
                id: `spacex-${latest.id}`,
                type: 'spacex',
                title: latest.name,
                subtitle: format(new Date(latest.date_utc), "MMM d, yyyy"),
                imageUrl: latest.links?.patch?.small || undefined,
                date: latest.date_utc,
                data: latest
              }}
            />
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
              {latest.links?.patch?.small ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={latest.links.patch.small}
                  alt={latest.name}
                  className="w-8 h-8 object-contain"
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
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--text-dim)] flex-shrink-0" />
                )}
                {latest.success === false && (
                  <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 text-[var(--text-faint)] text-xs">
                <Calendar className="w-3 h-3" />
                {format(new Date(latest.date_utc), "MMM d, yyyy")}
              </div>
              {latest.details && (
                <p className="text-[var(--text-faint)] text-xs mt-1 line-clamp-2">
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
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-[var(--text-faint)] uppercase tracking-widest">
                {windowOpened ? "Launch window open" : "Next Launch"}
              </span>
            </div>
            <FavoriteButton 
              item={{
                id: `spacex-${nextLaunch.id}`,
                type: 'spacex',
                title: nextLaunch.name,
                subtitle: format(new Date(nextLaunch.date_utc), "MMM d, yyyy"),
                imageUrl: nextLaunch.links?.patch?.small || undefined,
                date: nextLaunch.date_utc,
                data: nextLaunch
              }}
            />
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
              {nextLaunch.links?.patch?.small ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={nextLaunch.links.patch.small}
                  alt={nextLaunch.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <Rocket className="w-4 h-4 text-[var(--text-dim)]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[var(--text)] font-semibold text-sm mb-1">
                {nextLaunch.name}
              </h4>
              <div className="flex items-center gap-1 text-[var(--text-faint)] text-xs mb-2">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(nextLaunch.date_utc), {
                  addSuffix: true,
                })}
              </div>
              {windowOpened ? (
                <p className="text-[var(--text-dim)] text-xs">
                  Window open · outcome not published yet
                </p>
              ) : (
                <CountdownTimer targetDate={nextLaunch.date_utc} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming list */}
      {remainingLaunches.length > 0 && (
        <>
          <div className="section-divider" />
          <div className="space-y-1">
            {remainingLaunches.slice(0, 3).map((launch) => (
              <div
                key={launch.id}
                className="flex items-center justify-between py-1.5 text-xs"
              >
                <span className="text-[var(--text-faint)] truncate flex-1">
                  {launch.name}
                </span>
                <span className="text-[var(--text-faint)] ml-2 flex-shrink-0">
                  {format(new Date(launch.date_utc), "MMM d")}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
