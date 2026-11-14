"use client";

import { useQuery } from "@tanstack/react-query";
import { APODCard } from "@/components/dashboard/apod-card";
import { ISSTracker } from "@/components/dashboard/iss-tracker";
import { SpaceXCard } from "@/components/dashboard/spacex-card";
import { EarthquakeList } from "@/components/dashboard/earthquake-list";
import { AsteroidCard } from "@/components/dashboard/asteroid-card";
import { SolarCard } from "@/components/dashboard/solar-card";
import { CrewCard } from "@/components/dashboard/crew-card";
import { StatsBar } from "@/components/dashboard/stats-bar";
import { AIReport } from "@/components/dashboard/ai-report";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { LiveBriefing } from "@/components/dashboard/live-briefing";
import { WatchlistCard } from "@/components/dashboard/watchlist-card";
import { fetchJson } from "@/lib/api-client";
import { useLocale } from "@/lib/i18n";
import { EtchedBanner } from "@/components/ui/etched-banner";

export default function DashboardPage() {
  const { t, locale } = useLocale();

  const { data: earthquakeData } = useQuery({
    queryKey: ["earthquakes"],
    queryFn: () =>
      fetchJson<{
        features: {
          id: string;
          properties: { mag: number; place: string; tsunami: number };
        }[];
      }>("/api/earthquakes"),
    refetchInterval: 1000 * 60 * 10,
  });

  const totalQuakes = earthquakeData?.features?.length;
  const magnitudes = (earthquakeData?.features ?? [])
    .map((f) => f.properties.mag)
    .filter((mag) => Number.isFinite(mag));
  const averageMagnitude = magnitudes.length
    ? magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length
    : undefined;

  return (
    <div className="min-h-screen w-full pt-28 pb-24 px-4 md:px-8 lg:px-10 selection:bg-[var(--surface-hover)]">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Clean, Pure Observatory Header + Single Horizontal Telemetry Ledger */}
        <div className="space-y-4">
          <EtchedBanner
            preset="crimson"
            eyebrow={t.dashboard.pill}
            meta={t.dashboard.sources}
            titlePre={t.dashboard.titlePre}
            titleItalic={t.dashboard.titleItalic}
          />
          <StatsBar
            earthquakeCount={totalQuakes}
            averageMagnitude={averageMagnitude}
          />
          <LiveBriefing />
        </div>

        {/* Band 01 — Briefing & Watchlist */}
        <section className="space-y-5">
          <BandDivider
            index="01"
            label={locale === "tr" ? "GÜNLÜK ÖZET & UYARILAR" : "BRIEFING & WATCHLIST"}
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7">
              <AIReport earthquakeCount={totalQuakes} />
            </div>
            <div className="lg:col-span-5">
              <WatchlistCard earthquakes={earthquakeData?.features ?? []} />
            </div>
          </div>
        </section>

        {/* Band 02 — Orbit & Deep Space */}
        <section className="space-y-5">
          <BandDivider
            index="02"
            label={locale === "tr" ? "YÖRÜNGE, GÖKYÜZÜ & UZAY HAVASI" : "ORBIT, SKY & SPACE WEATHER"}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <APODCard />
            <ISSTracker />
            <SolarCard />
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="eyebrow">{t.dashboard.sections.asteroids}</span>
                <span className="eyebrow">NASA NeoWs</span>
              </div>
              <AsteroidCard />
            </div>
          </div>
        </section>

        {/* Band 03 — Launches, Crew & Atmosphere */}
        <section className="space-y-5">
          <BandDivider
            index="03"
            label={locale === "tr" ? "FIRLATMALAR, MÜRETTEBAT & ATMOSFER" : "LAUNCHES, CREW & ATMOSPHERE"}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <SpaceXCard />
            <WeatherWidget />
          </div>
          <div className="border border-[var(--border)] rounded-xl bg-[var(--surface-1)]/80 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
              <h2 className="font-serif text-lg text-[var(--text)]">
                {t.dashboard.sections.crew}
              </h2>
              <span className="eyebrow">{t.common.live}</span>
            </div>
            <CrewCard />
          </div>
        </section>

        {/* Band 04 — Seismic Dispatch */}
        <section>
          <div className="space-y-4">
            <BandDivider
              index="04"
              label={t.dashboard.sections.earthquakes}
              source="USGS · M4.0+ / 7D"
            />
            <EarthquakeList />
          </div>
        </section>
      </div>
    </div>
  );
}

function BandDivider({
  index,
  label,
  source,
}: {
  index: string;
  label: string;
  source?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] tracking-[0.22em] text-[var(--accent)]">
          {index}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text)]">
          {label}
        </span>
      </div>
      {source && (
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
          {source}
        </span>
      )}
    </div>
  );
}
