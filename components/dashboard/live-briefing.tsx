"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowUpRight, Radio, Rocket, Satellite } from "lucide-react";

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

function timeLabel(updatedAt: number) {
  if (!updatedAt) return "Connecting";
  const seconds = Math.max(0, Math.floor((Date.now() - updatedAt) / 1000));
  return seconds < 60 ? "Just updated" : `${Math.floor(seconds / 60)}m ago`;
}

export function LiveBriefing() {
  const earthquakes = useQuery<{ features: Earthquake[] }>({
    queryKey: ["earthquakes"],
    queryFn: () => fetch("/api/earthquakes").then((r) => r.json()),
    refetchInterval: 1000 * 60 * 10,
  });
  const iss = useQuery<IssData>({
    queryKey: ["iss"],
    queryFn: () => fetch("/api/iss").then((r) => r.json()),
    refetchInterval: 5000,
  });
  const launches = useQuery<{ upcoming: Launch[] }>({
    queryKey: ["spacex"],
    queryFn: () => fetch("/api/spacex").then((r) => r.json()),
    staleTime: 1000 * 60 * 30,
  });

  const quakeList = earthquakes.data?.features ?? [];
  const largest = quakeList[0];
  const majorCount = quakeList.filter((quake) => quake.properties.mag >= 6).length;
  const nextLaunch = launches.data?.upcoming?.[0];
  const lat = Number(iss.data?.iss_position.latitude);
  const lon = Number(iss.data?.iss_position.longitude);

  return (
    <section className="glass-panel overflow-hidden" aria-label="Live situation briefing">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="live-dot" />
          <div>
            <p className="eyebrow !text-[10px]">Live briefing</p>
            <p className="mt-0.5 text-sm text-[var(--text-dim)]">A calm read on the feeds reporting in now.</p>
          </div>
        </div>
        <Link href="/earth" className="btn-ghost !min-h-0 !px-3 !py-2 !text-xs">
          Open Earth monitor <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid divide-y divide-[var(--border)] md:grid-cols-3 md:divide-x md:divide-y-0">
        <BriefItem
          icon={Activity}
          source="USGS · M4+ / 7 days"
          updated={timeLabel(earthquakes.dataUpdatedAt)}
          title={largest ? `${quakeList.length} events, ${majorCount} major` : "Seismic feed connecting"}
          detail={largest ? `Largest: M${largest.properties.mag.toFixed(1)} · ${largest.properties.place}` : "Waiting for the latest verified events."}
        />
        <BriefItem
          icon={Satellite}
          source="Open Notify · 5 sec"
          updated={timeLabel(iss.dataUpdatedAt)}
          title={Number.isFinite(lat) ? `ISS over ${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? "N" : "S"}` : "ISS position connecting"}
          detail={Number.isFinite(lon) ? `${Math.abs(lon).toFixed(1)}° ${lon >= 0 ? "E" : "W"} · orbital telemetry is live` : "Waiting for orbital telemetry."}
        />
        <BriefItem
          icon={Rocket}
          source="Launch Library 2 · SpaceX"
          updated={timeLabel(launches.dataUpdatedAt)}
          title={nextLaunch ? nextLaunch.name : "Launch manifest connecting"}
          detail={nextLaunch ? `Next launch ${new Date(nextLaunch.date_utc).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : "Waiting for the upcoming manifest."}
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
        <span className="shrink-0 text-[10px] text-[var(--text-faint)]">{updated}</span>
      </div>
      <p className="truncate text-sm font-medium text-[var(--text)]">{title}</p>
      <p className="mt-1 truncate text-xs text-[var(--text-faint)]">{detail}</p>
    </div>
  );
}
