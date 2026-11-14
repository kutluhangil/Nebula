"use client";

import { useState } from "react";
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
import { fetchJson } from "@/lib/api-client";
import { FeedError } from "@/components/ui/feed-state";
import { Countdown } from "@/components/ui/countdown";
import { useNow } from "@/hooks/use-now";
import { useLocale } from "@/lib/i18n";
import { EtchedBanner } from "@/components/ui/etched-banner";

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
  provider?: string;
}

interface LaunchRecord {
  sampled: number;
  success: number;
  failure: number;
  unresolved: number;
  earliestUtc: string | null;
  latestUtc: string | null;
}

interface SpaceXData {
  latest: Launch | null;
  upcoming: Launch[];
  record: LaunchRecord;
}

function SuccessRecord({ record }: { record: LaunchRecord }) {
  const { t, locale } = useLocale();
  if (!record.sampled) return null;

  const utcDay = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const range =
    record.earliestUtc && record.latestUtc
      ? `${utcDay(record.earliestUtc)} — ${utcDay(record.latestUtc)}`
      : null;

  return (
    <div className="mb-8 inset-well px-4 py-3.5 rounded-xl">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="eyebrow !text-[9px]">{t.launches.successRecord}</span>
        {range && (
          <span className="text-[11px] font-mono text-[var(--text-faint)]">{range}</span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <span className="font-mono tabular text-2xl leading-none font-medium text-[var(--text)]">
          {record.success}
          <span className="text-[var(--text-faint)]"> / {record.sampled}</span>
        </span>
        <span className="text-xs text-[var(--text-dim)]">
          {t.launches.succeededSuffix} {record.sampled} {t.launches.launchesWord}
        </span>
        {record.failure > 0 && (
          <span className="text-xs text-[var(--accent-red)] font-mono">
            {record.failure} {t.launches.failedWord}
          </span>
        )}
        {record.unresolved > 0 && (
          <span className="text-xs text-[var(--text-faint)]">
            {record.unresolved} {t.launches.unclassified}
          </span>
        )}
      </div>
    </div>
  );
}

export default function LaunchesPage() {
  const { t, dateLocale } = useLocale();
  const [scope, setScope] = useState<"spacex" | "all">("spacex");

  const { data, isLoading, isError, error, refetch } = useQuery<SpaceXData>({
    queryKey: ["spacex", scope],
    queryFn: () =>
      fetchJson(scope === "all" ? "/api/spacex?scope=all" : "/api/spacex"),
    staleTime: 1000 * 60 * 30,
  });

  const now = useNow();
  const upcoming = data?.upcoming ?? [];
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
    <div className="min-h-screen w-full pt-28 pb-24 px-4 md:px-8 lg:px-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <EtchedBanner
          preset="ember"
          eyebrow={t.nav.launches}
          titlePre={t.launches.titlePre}
          titleItalic={t.launches.titleItalic}
          subtitle={t.launches.subtitle}
          rightSlot={
            <div
              data-theme="dark"
              className="inline-flex rounded-xl bezel p-1 gap-1"
              role="group"
              aria-label="Launch agency scope"
            >
              <button
                type="button"
                onClick={() => setScope("spacex")}
                aria-pressed={scope === "spacex"}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  scope === "spacex"
                    ? "bg-[var(--accent)] text-white font-medium"
                    : "text-[var(--text-dim)] hover:text-[var(--text)]"
                }`}
              >
                {t.launches.scopeSpacex}
              </button>
              <button
                type="button"
                onClick={() => setScope("all")}
                aria-pressed={scope === "all"}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  scope === "all"
                    ? "bg-[var(--accent)] text-white font-medium"
                    : "text-[var(--text-dim)] hover:text-[var(--text)]"
                }`}
              >
                {t.launches.scopeAll}
              </button>
            </div>
          }
        />

        {data?.record && <SuccessRecord record={data.record} />}

        {isError && (
          <div className="glass-card flex items-center justify-center mb-6">
            <FeedError
              title={t.dashboard.spacex.unavailable}
              error={error}
              icon={Rocket}
              onRetry={() => refetch()}
            />
          </div>
        )}

        {/* Next launch hero */}
        {nextLaunch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-8 border-l-2"
            style={{ borderLeftColor: "var(--accent)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="eyebrow-pill">
                <span className="live-dot" />
                <span>
                  {windowOpened ? t.launches.windowOpen : t.launches.nextLaunch}
                </span>
              </div>
              {nextLaunch.provider && (
                <span className="font-mono text-xs text-[var(--text-faint)]">
                  {nextLaunch.provider}
                </span>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {nextLaunch.links?.patch?.large ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={nextLaunch.links.patch.large}
                    alt={nextLaunch.name}
                    className="w-18 h-18 object-cover"
                  />
                ) : (
                  <Rocket className="w-8 h-8 text-[var(--accent)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-2xl text-[var(--text)] mb-1">
                  {nextLaunch.name}
                </h2>
                <div className="flex items-center gap-2 text-[var(--text-faint)] text-sm font-mono mb-4">
                  <Calendar className="w-4 h-4 shrink-0" />
                  {format(new Date(nextLaunch.date_utc), "PPP", {
                    locale: dateLocale,
                  })}{" "}
                  ·{" "}
                  {formatDistanceToNow(new Date(nextLaunch.date_utc), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </div>
                {windowOpened ? (
                  <p className="text-[var(--text-dim)] text-sm max-w-md">
                    {t.launches.windowOpenMsg}
                  </p>
                ) : (
                  <Countdown
                    targetDate={nextLaunch.date_utc}
                    variant="hero"
                    labels={{
                      days: t.launches.days,
                      hrs: t.launches.hrs,
                      min: t.launches.min,
                      sec: t.launches.sec,
                      windowOpen: t.launches.windowOpen,
                    }}
                  />
                )}
              </div>
              {nextLaunch.links?.webcast && (
                <a
                  href={nextLaunch.links.webcast}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary !px-4 !py-2.5 !min-h-0 !text-xs shrink-0"
                >
                  {t.launches.watchLive}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* Upcoming missions */}
        {remainingLaunches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[var(--text)] font-semibold text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--accent)]" />
              {t.launches.upcoming}
            </h2>
            <div className="space-y-3">
              {remainingLaunches.map((launch, i) => (
                <motion.div
                  key={launch.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {launch.links?.patch?.small ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={launch.links.patch.small}
                        alt={launch.name}
                        className="w-9 h-9 object-cover"
                      />
                    ) : (
                      <Rocket className="w-4 h-4 text-[var(--text-faint)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[var(--text)] font-medium text-sm truncate">
                      {launch.name}
                    </div>
                    <div className="text-[var(--text-faint)] text-xs font-mono">
                      {[launch.provider, launch.rocket].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[var(--text)] font-mono text-sm">
                      {format(new Date(launch.date_utc), "MMM d, yyyy", {
                        locale: dateLocale,
                      })}
                    </div>
                    <div className="text-[var(--text-faint)] text-xs font-mono">
                      {formatDistanceToNow(new Date(launch.date_utc), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Most recent launch */}
        {data?.latest && (
          <div>
            <h2 className="text-[var(--text)] font-semibold text-sm mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[var(--accent-green)]" />
              {t.launches.mostRecent}
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {data.latest.links?.patch?.large ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.latest.links.patch.large}
                      alt={data.latest.name}
                      className="w-13 h-13 object-cover"
                    />
                  ) : (
                    <Rocket className="w-6 h-6 text-[var(--text-faint)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-[var(--text)] font-bold text-base">
                      {data.latest.name}
                    </h3>
                    {data.latest.provider && (
                      <span className="text-[11px] font-mono text-[var(--text-faint)]">
                        · {data.latest.provider}
                      </span>
                    )}
                    {data.latest.success ? (
                      <span className="flex items-center gap-1 text-[var(--accent-green)] text-xs font-mono">
                        <CheckCircle className="w-3 h-3" /> {t.launches.success}
                      </span>
                    ) : data.latest.success === false ? (
                      <span className="flex items-center gap-1 text-[var(--accent-red)] text-xs font-mono">
                        <XCircle className="w-3 h-3" /> {t.launches.failed}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[var(--text-faint)] text-xs font-mono mb-3">
                    {format(new Date(data.latest.date_utc), "PPP", {
                      locale: dateLocale,
                    })}
                  </div>
                  {data.latest.details && (
                    <p className="text-[var(--text-dim)] text-sm leading-relaxed">
                      {data.latest.details}
                    </p>
                  )}
                  {data.latest.links?.webcast && (
                    <a
                      href={data.latest.links.webcast}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-xs text-[var(--accent)] hover:underline"
                    >
                      {t.launches.watchRecording}
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
