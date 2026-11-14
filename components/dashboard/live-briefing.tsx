"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowUpRight, Radio, Rocket, Satellite } from "lucide-react";
import { fetchJson } from "@/lib/api-client";
import { useLocale } from "@/lib/i18n";
import { useNow } from "@/hooks/use-now";

interface Earthquake {
  id: string;
  properties: { mag: number; place: string };
}

interface Launch {
  name: string;
  date_utc: string;
}

interface IssData {
  iss_position: { latitude: string; longitude: string };
}

export function LiveBriefing() {
  const { t, locale } = useLocale();
  const now = useNow();
  const timeLabel = (updatedAt: number, failed: boolean) => {
    if (failed) return t.dashboard.briefing.unavailable;
    if (!updatedAt || now === null) return t.dashboard.briefing.connecting;
    const seconds = Math.max(0, Math.floor((now - updatedAt) / 1000));
    return seconds < 60
      ? t.dashboard.briefing.justUpdated
      : `${Math.floor(seconds / 60)}m`;
  };

  const earthquakes = useQuery<{ features: Earthquake[] }>({
    queryKey: ["earthquakes"],
    queryFn: () => fetchJson("/api/earthquakes"),
    refetchInterval: 1000 * 60 * 10,
  });
  const iss = useQuery<IssData>({
    queryKey: ["iss"],
    queryFn: () => fetchJson("/api/iss"),
    refetchInterval: 5000,
  });
  const launches = useQuery<{ upcoming: Launch[] }>({
    queryKey: ["spacex"],
    queryFn: () => fetchJson("/api/spacex"),
    staleTime: 1000 * 60 * 30,
  });

  const quakeList = earthquakes.data?.features ?? [];
  const largest = quakeList.reduce<(typeof quakeList)[number] | undefined>(
    (max, quake) =>
      !max || quake.properties.mag > max.properties.mag ? quake : max,
    undefined
  );
  const majorCount = quakeList.filter((quake) => quake.properties.mag >= 6).length;
  const nextLaunch = launches.data?.upcoming?.[0];
  const lat = Number(iss.data?.iss_position.latitude);
  const lon = Number(iss.data?.iss_position.longitude);

  return (
    <section
      className="border border-[var(--border)] rounded-xl bg-[var(--surface-1)]/65 overflow-hidden"
      aria-label={t.dashboard.briefing.eyebrow}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <p className="eyebrow !text-[10px]">{t.dashboard.briefing.eyebrow}</p>
        </div>
        <Link
          href="/earth"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors inline-flex items-center gap-1"
        >
          {t.dashboard.briefing.openEarth} <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid divide-y divide-[var(--border)] md:grid-cols-3 md:divide-x md:divide-y-0">
        <BriefItem
          icon={Activity}
          source="USGS · M4+ / 7d"
          updated={timeLabel(earthquakes.dataUpdatedAt, earthquakes.isError)}
          title={
            earthquakes.isError
              ? t.dashboard.briefing.seismicUnavailable
              : largest
              ? `${quakeList.length} ${t.dashboard.briefing.eventsWord}, ${majorCount} ${t.dashboard.briefing.majorWord}`
              : t.dashboard.briefing.seismicConnecting
          }
          detail={
            earthquakes.isError
              ? t.dashboard.briefing.seismicUnavailableDetail
              : largest
              ? `${t.dashboard.briefing.largestPrefix}: M${largest.properties.mag.toFixed(1)} · ${largest.properties.place}`
              : t.dashboard.briefing.seismicWaiting
          }
        />
        <BriefItem
          icon={Satellite}
          source="wheretheiss.at · 5s"
          updated={timeLabel(iss.dataUpdatedAt, iss.isError)}
          title={
            iss.isError
              ? t.dashboard.briefing.issUnavailable
              : Number.isFinite(lat)
              ? `${t.dashboard.briefing.issOver} ${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? "N" : "S"}`
              : t.dashboard.briefing.issConnecting
          }
          detail={
            iss.isError
              ? t.dashboard.briefing.issUnavailableDetail
              : Number.isFinite(lon)
              ? `${Math.abs(lon).toFixed(1)}° ${lon >= 0 ? "E" : "W"} · ${t.dashboard.briefing.orbitalLive}`
              : t.dashboard.briefing.issWaiting
          }
        />
        <BriefItem
          icon={Rocket}
          source="Launch Library 2 · SpaceX"
          updated={timeLabel(launches.dataUpdatedAt, launches.isError)}
          title={
            launches.isError
              ? t.dashboard.briefing.launchUnavailable
              : nextLaunch
              ? nextLaunch.name
              : t.dashboard.briefing.launchConnecting
          }
          detail={
            launches.isError
              ? t.dashboard.briefing.launchUnavailableDetail
              : nextLaunch
              ? `${t.dashboard.briefing.nextLaunchPrefix} ${new Date(nextLaunch.date_utc).toLocaleDateString(
                  locale === "tr" ? "tr-TR" : "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                )}`
              : t.dashboard.briefing.launchWaiting
          }
        />
      </div>
    </section>
  );
}

function BriefItem({
  icon: Icon,
  source,
  updated,
  title,
  detail,
}: {
  icon: typeof Radio;
  source: string;
  updated: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="min-w-0 px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-faint)]">
          <Icon className="h-3.5 w-3.5 text-[var(--accent)]" /> {source}
        </span>
        <span className="shrink-0 text-[10px] font-mono text-[var(--text-faint)]">
          {updated}
        </span>
      </div>
      <p className="truncate text-sm font-medium text-[var(--text)]">{title}</p>
      <p className="mt-1 truncate text-xs text-[var(--text-faint)]">{detail}</p>
    </div>
  );
}
