"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Rocket,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { fetchJson } from "@/lib/api-client";
import { useNow } from "@/hooks/use-now";

interface Launch {
  id: string;
  name: string;
  date_utc: string;
  success: boolean | null;
  details: string | null;
  links: {
    patch: { small: string | null; large: string | null };
    webcast: string | null;
    article: string | null;
  };
  rocket: string;
}

interface SpaceXData {
  /** Null when the feed reports no previous launch. */
  latest: Launch | null;
  upcoming: Launch[];
}

function Countdown({ targetDate }: { targetDate: string }) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
      setParts({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [targetDate]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-2" aria-live="polite">
      {[
        { value: parts.d, label: "DAYS" },
        { value: parts.h, label: "HRS" },
        { value: parts.m, label: "MIN" },
        { value: parts.s, label: "SEC" },
      ].map(({ value, label }) => (
        <div key={label} className="text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-400 font-bold font-mono text-lg">
              {pad(value)}
            </span>
          </div>
          <div className="text-[9px] text-[var(--text-faint)] mt-1 tracking-widest">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LaunchesPage() {
  const { data, isLoading, isError, error, refetch } = useQuery<SpaceXData>({
    queryKey: ["spacex"],
    queryFn: () => fetchJson("/api/spacex"),
    staleTime: 1000 * 60 * 30,
  });

  // Launch Library keeps a mission in its upcoming feed until a human confirms
  // the outcome, so the first entry is regularly a launch whose window already
  // opened. Counting down to it renders four zeros under a "Next Launch"
  // badge, which claims a launch is imminent when it already flew.
  const now = useNow();
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
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1
            className="font-serif text-4xl md:text-5xl text-[var(--text)]"
           
          >
            SpaceX{" "}
            <span className="italic text-[var(--accent)]">Launches</span>
          </h1>
          <p className="text-[var(--text-faint)] text-sm mt-1">
            Real-time launch data · Launch Library 2
          </p>
        </motion.div>

        {isError && (
          <div className="glass-card p-8 flex flex-col items-center justify-center gap-3 text-center">
            <Rocket className="w-5 h-5 text-[var(--text-faint)]" />
            <p className="text-[var(--text-dim)] text-sm">
              Launch data is unavailable right now.
            </p>
            <p className="text-[var(--text-faint)] text-xs max-w-md">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)] text-xs font-medium hover:text-[var(--text)] transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Next launch hero */}
        {nextLaunch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6 border border-violet-500/10 bg-gradient-to-br from-violet-500/[0.05] to-blue-500/[0.03]"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="badge-live">
                <span>{windowOpened ? "Launch window open" : "Next Launch"}</span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                {nextLaunch.links?.patch?.large ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={nextLaunch.links.patch.large}
                    alt={nextLaunch.name}
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  <Rocket className="w-8 h-8 text-violet-400" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[var(--text)] mb-1">
                  {nextLaunch.name}
                </h2>
                <div className="flex items-center gap-2 text-[var(--text-faint)] text-sm mb-4">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(nextLaunch.date_utc), "PPP")} ·{" "}
                  {formatDistanceToNow(new Date(nextLaunch.date_utc), {
                    addSuffix: true,
                  })}
                </div>
                {windowOpened ? (
                  <p className="text-[var(--text-dim)] text-sm max-w-md">
                    The launch window has opened. Launch Library 2 has not
                    published an outcome for this mission yet.
                  </p>
                ) : (
                  <Countdown targetDate={nextLaunch.date_utc} />
                )}
              </div>
              {nextLaunch.links?.webcast && (
                <a
                  href={nextLaunch.links.webcast}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/15 transition-colors"
                >
                  Watch Live
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* Upcoming list */}
        {remainingLaunches.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[var(--text-dim)] font-semibold text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              Upcoming Missions
            </h2>
            <div className="space-y-2">
              {remainingLaunches.map((launch, i) => (
                <motion.div
                  key={launch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                    {launch.links?.patch?.small ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={launch.links.patch.small}
                        alt={launch.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <Rocket className="w-4 h-4 text-[var(--text-faint)]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[var(--text-dim)] font-medium text-sm">
                      {launch.name}
                    </p>
                    {launch.details && (
                      <p className="text-[var(--text-faint)] text-xs mt-0.5 line-clamp-1">
                        {launch.details}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[var(--text-faint)] text-xs">
                      {format(new Date(launch.date_utc), "MMM d, yyyy")}
                    </div>
                    <div className="text-[var(--text-faint)] text-xs">
                      {formatDistanceToNow(new Date(launch.date_utc), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Latest launch */}
        {data?.latest && (
          <div>
            <h2 className="text-[var(--text-dim)] font-semibold text-sm mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Most Recent Launch
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  {data.latest.links?.patch?.large ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.latest.links.patch.large}
                      alt={data.latest.name}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <Rocket className="w-6 h-6 text-[var(--text-faint)]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[var(--text)] font-bold text-base">
                      {data.latest.name}
                    </h3>
                    {data.latest.success ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs">
                        <CheckCircle className="w-3 h-3" /> Success
                      </span>
                    ) : data.latest.success === false ? (
                      <span className="flex items-center gap-1 text-red-400 text-xs">
                        <XCircle className="w-3 h-3" /> Failed
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[var(--text-faint)] text-xs mb-3">
                    {format(new Date(data.latest.date_utc), "PPP")}
                  </div>
                  {data.latest.details && (
                    <p className="text-[var(--text-faint)] text-sm leading-relaxed">
                      {data.latest.details}
                    </p>
                  )}
                  {data.latest.links?.webcast && (
                    <a
                      href={data.latest.links.webcast}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-xs text-violet-400 hover:text-violet-300"
                    >
                      Watch Recording
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            <div className="glass-card h-40 skeleton" />
            <div className="glass-card h-24 skeleton" />
            <div className="glass-card h-24 skeleton" />
          </div>
        )}
      </div>
    </div>
  );
}
