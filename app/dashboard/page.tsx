"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Satellite,
  Zap,
  Activity,
  Rocket,
  Star,
  AlertTriangle,
  Thermometer,
} from "lucide-react";
import { APODCard } from "@/components/dashboard/apod-card";
import { ISSTracker } from "@/components/dashboard/iss-tracker";
import { SpaceXCard } from "@/components/dashboard/spacex-card";
import { EarthquakeList } from "@/components/dashboard/earthquake-list";
import { AsteroidCard } from "@/components/dashboard/asteroid-card";
import { SolarCard } from "@/components/dashboard/solar-card";
import { StatsBar } from "@/components/dashboard/stats-bar";
import { AIReport } from "@/components/dashboard/ai-report";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { LiveBriefing } from "@/components/dashboard/live-briefing";
import { WatchlistCard } from "@/components/dashboard/watchlist-card";
import { fetchJson } from "@/lib/api-client";

export default function DashboardPage() {
  const { data: earthquakeData } = useQuery({
    queryKey: ["earthquakes"],
    queryFn: () => fetchJson<{
      features: {
        id: string;
        properties: { mag: number; place: string; tsunami: number };
      }[];
    }>("/api/earthquakes"),
    refetchInterval: 1000 * 60 * 10,
  });

  // Left undefined until the feed answers. Flattening it to 0 here made the
  // AI report fire twice on every load — once on a count the page was about to
  // replace, which with an API key set is a paid call on a wrong number.
  const totalQuakes = earthquakeData?.features?.length;

  // Mean magnitude of the same M4.0+ / 7d feed the count comes from. USGS
  // leaves `mag` null on events it has not finished reviewing, so those are
  // dropped rather than averaged in as zero.
  const magnitudes = (earthquakeData?.features ?? [])
    .map((f) => f.properties.mag)
    .filter((mag) => Number.isFinite(mag));
  const averageMagnitude = magnitudes.length
    ? magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length
    : undefined;

  return (
    <div className="min-h-screen w-full pt-28 pb-24 px-4 md:px-8 lg:px-10 selection:bg-[var(--surface-hover)]">
      <div className="max-w-7xl mx-auto space-y-10 md:space-y-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="eyebrow-pill">
                <span className="live-dot" />
                Live feed
              </div>
              <span className="text-[var(--text-faint)] text-xs font-medium tracking-wide">
                NASA · USGS · NOAA
              </span>
            </div>
            <h1 className="display-1 text-[var(--text)]">
              Planet <span className="italic text-[var(--text-dim)]">Intelligence</span>
            </h1>
          </div>
          <StatsBar
            earthquakeCount={totalQuakes}
            averageMagnitude={averageMagnitude}
          />
        </motion.div>

        {/* What is happening now */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <LiveBriefing />
        </motion.div>

        {/* AI report + personal watchlist */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-2"
          >
            <AIReport earthquakeCount={totalQuakes} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <WatchlistCard earthquakes={earthquakeData?.features ?? []} />
          </motion.div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* APOD — large */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-2 space-y-4"
          >
            <SectionHeader
              icon={Star}
              title="Astronomy Picture of the Day"
              subtitle="NASA"
            />
            <APODCard />
          </motion.div>

          {/* ISS & Weather */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            <div className="space-y-4">
              <SectionHeader
                icon={Satellite}
                title="ISS Tracker"
                subtitle="Live"
                live
              />
              <ISSTracker />
            </div>
            <div className="space-y-4">
              <SectionHeader
                icon={Thermometer}
                title="Weather"
                subtitle="Local"
              />
              <WeatherWidget />
            </div>
          </motion.div>
        </div>

        {/* Second row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <SectionHeader
              icon={Rocket}
              title="SpaceX Launches"
              subtitle="Latest"
            />
            <SpaceXCard />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <SectionHeader
              icon={AlertTriangle}
              title="Near-Earth Objects"
              subtitle="NASA NEO"
            />
            <AsteroidCard />
          </motion.div>
        </div>

        {/* Third row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-2 space-y-4"
          >
            <SectionHeader
              icon={Activity}
              title="Earthquake Monitor"
              subtitle="USGS"
              live
            />
            <EarthquakeList />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <SectionHeader
              icon={Zap}
              title="Solar Activity"
              subtitle="NOAA SWPC"
              live
            />
            <SolarCard />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  live = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  live?: boolean;
}) {
  return (
    <div className="panel-head px-1">
      <span className="panel-title">
        <Icon className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.25} />
        {title}
      </span>
      <span className="flex items-center gap-2 eyebrow">
        {live && <span className="live-dot" />}
        {subtitle}
      </span>
    </div>
  );
}
