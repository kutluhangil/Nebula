"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fetchJson } from "@/lib/api-client";
import { useLocale } from "@/lib/i18n";
import EtchedAccretion from "@/components/ui/etched-accretion";
import {
  ObservatoryPlates,
  type PlateQuake,
  type TrackPoint,
} from "@/components/landing/observatory-plates";
import {
  ArrowUpRight,
  Globe,
  Satellite,
  Zap,
  Activity,
  Rocket,
  Radio,
  Newspaper,
  Compass,
} from "lucide-react";

const Globe3D = dynamic(() => import("@/components/earth/globe-3d"), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

interface LatestQuakePayload {
  features: PlateQuake[] &
    {
      id: string;
      properties: { mag: number; place: string; time: number };
      geometry: { coordinates: [number, number, number] };
    }[];
}

function LatestEvent() {
  const { t, dateLocale } = useLocale();
  const { data, isLoading, isError } = useQuery<LatestQuakePayload>({
    queryKey: ["earthquakes"],
    queryFn: () => fetchJson("/api/earthquakes"),
    staleTime: 1000 * 60 * 10,
  });

  const latest = data?.features?.[0];

  if (isLoading) {
    return (
      <span className="tracking-[0.2em] uppercase" aria-busy="true">
        {t.home.readingFeeds}
      </span>
    );
  }

  if (isError || !latest) return null;

  return (
    <Link
      href="/earth"
      className="flex items-center gap-2 transition-colors hover:text-[var(--accent)]"
    >
      <Activity className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
      <span className="tabular font-mono text-[var(--text)] tracking-widest">
        M{latest.properties.mag.toFixed(1)}
      </span>
      <span className="tracking-[0.14em] uppercase truncate max-w-[260px] sm:max-w-none">
        {latest.properties.place} ·{" "}
        {formatDistanceToNow(latest.properties.time, {
          addSuffix: true,
          locale: dateLocale,
        })}
      </span>
    </Link>
  );
}

function useUTC() {
  const [dt, setDt] = useState({ time: "--:--:--", date: "" });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setDt({
        time: now.toLocaleTimeString("en-US", {
          timeZone: "UTC",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        date: now.toLocaleDateString("en-US", {
          timeZone: "UTC",
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return dt;
}

const sources = ["NASA", "SpaceX", "USGS", "NOAA", "LL2"];

export default function HomePage() {
  const { t, locale } = useLocale();
  const utc = useUTC();

  const { data: quakes } = useQuery<LatestQuakePayload>({
    queryKey: ["earthquakes"],
    queryFn: () => fetchJson("/api/earthquakes"),
    staleTime: 1000 * 60 * 10,
  });
  const { data: solar } = useQuery<{
    kpIndex: number;
    sdoImageUrl?: string;
    solarWind?: { speedKms: number; bzGse: number | null } | null;
  }>({
    queryKey: ["solar"],
    queryFn: () => fetchJson("/api/solar"),
    staleTime: 1000 * 60 * 5,
  });
  const { data: crew } = useQuery<{ people: unknown[] }>({
    queryKey: ["astronauts"],
    queryFn: () => fetchJson("/api/astronauts"),
    staleTime: 1000 * 60 * 60,
  });
  const { data: launches } = useQuery<{ upcoming: unknown[] }>({
    queryKey: ["spacex"],
    queryFn: () => fetchJson("/api/spacex"),
    staleTime: 1000 * 60 * 30,
  });
  const { data: space } = useQuery<{ asteroids: unknown[] }>({
    queryKey: ["space"],
    queryFn: () => fetchJson("/api/space"),
    staleTime: 1000 * 60 * 60,
  });
  const { data: iss } = useQuery<{
    iss_position: { latitude: string; longitude: string };
    groundTrack?: TrackPoint[];
  }>({
    queryKey: ["iss"],
    queryFn: () => fetchJson("/api/iss"),
    refetchInterval: 15000,
  });

  const crewCount = Array.isArray(crew?.people) ? crew.people.length : undefined;
  const issLatNum = iss ? Number(iss.iss_position.latitude) : undefined;
  const issLonNum = iss ? Number(iss.iss_position.longitude) : undefined;

  const modules = [
    {
      numeral: "01",
      href: "/news",
      icon: Newspaper,
      title: t.home.modules.newsTitle,
      description: t.home.modules.newsDesc,
      metric: "SNAPI · v4",
    },
    {
      numeral: "02",
      href: "/dashboard",
      icon: Satellite,
      title: t.home.modules.issTitle,
      description: t.home.modules.issDesc,
      metric:
        crewCount !== undefined
          ? `${crewCount} ${t.home.liveMetricCrew}`
          : "LEO · 5s",
    },
    {
      numeral: "03",
      href: "/earth",
      icon: Activity,
      title: t.home.modules.earthTitle,
      description: t.home.modules.earthDesc,
      metric: quakes
        ? `${quakes.features.length} ${t.home.liveMetricQuakes}`
        : "USGS · EONET",
    },
    {
      numeral: "04",
      href: "/launches",
      icon: Rocket,
      title: t.home.modules.launchesTitle,
      description: t.home.modules.launchesDesc,
      metric: launches
        ? `${launches.upcoming.length} ${t.home.liveMetricUpcoming}`
        : "LL2",
    },
    {
      numeral: "05",
      href: "/sky",
      icon: Globe,
      title: t.home.modules.apodTitle,
      description: t.home.modules.apodDesc,
      metric: space
        ? `${space.asteroids.length} ${t.home.liveMetricNeos}`
        : "APOD · Mars",
    },
    {
      numeral: "06",
      href: "/space",
      icon: Zap,
      title: t.home.modules.solarTitle,
      description: t.home.modules.solarDesc,
      metric: solar ? `Kp ${solar.kpIndex} · ${t.home.liveMetricKp}` : "NOAA · SDO",
    },
  ];

  const deskCounters = [
    {
      href: "/earth",
      label: t.dashboard.stats.quakes,
      value: quakes ? String(quakes.features.length) : "—",
    },
    {
      href: "/space",
      label: t.dashboard.stats.kp,
      value: solar ? `Kp ${solar.kpIndex}` : "—",
    },
    {
      href: "/dashboard",
      label: t.dashboard.sections.crew,
      value: crewCount !== undefined ? String(crewCount) : "—",
    },
    {
      href: "/launches",
      label: t.dashboard.stats.launches,
      value: launches ? String(launches.upcoming.length) : "—",
    },
  ];

  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <div className="relative w-full">
      {/* ---------- Etched Accretion Hero (100svh) ---------- */}
      <EtchedAccretion height="100svh" preset="crimson">
        <div className="pointer-events-none mx-auto flex h-full max-w-7xl flex-col justify-end p-6 text-white sm:p-10 md:p-14">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-xl">
              <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-[#e9e4df]/55">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff3b47]" />
                {t.home.volumeLabel}
              </div>
              <h1 className="font-serif text-5xl font-light leading-[1.03] tracking-tight text-[#e9e4df] sm:text-7xl">
                {locale === "tr" ? (
                  <>
                    Ufuktan <span className="italic text-[#ff3b47]">hiçbir şey</span>
                    <br />
                    kaçamaz.
                  </>
                ) : (
                  <>
                    Nothing <span className="italic text-[#ff3b47]">escapes</span>
                    <br />
                    the horizon.
                  </>
                )}
              </h1>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.3em] text-white/45">
                {locale === "tr"
                  ? "kaydırmak için gezdir · beslemek için basılı tut"
                  : "move to drift · hold to feed it"}
              </p>
            </div>

            <div className="pointer-events-auto flex flex-col items-start gap-3 md:items-end">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-[#ff3b47] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#d3121f]"
                >
                  {t.home.openDashboard}
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.6} />
                </Link>
                <Link
                  href="/sky"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-5 py-2.5 text-sm font-medium text-[#e9e4df] backdrop-blur-md transition-colors hover:border-[#ff3b47]"
                >
                  <Compass className="h-4 w-4 text-[#ff3b47]" strokeWidth={1.6} />
                  {t.home.exploreSky}
                </Link>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
                {utc.time} UTC · {sources.join(" · ")}
              </div>
            </div>
          </div>
        </div>
      </EtchedAccretion>

      {/* ---------- Planetary Observatory Wire & 3D Sphere ---------- */}
      <section className="relative border-t border-[var(--border)] py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="eyebrow">{t.home.badge}</div>
            <h2 className="font-serif text-3xl sm:text-5xl text-[var(--text)] leading-[1.08]">
              {t.home.heroLine1}{" "}
              <span className="italic text-[var(--accent)]">
                {t.home.heroLine2}
              </span>
            </h2>
            <p className="text-[var(--text-dim)] text-base md:text-lg font-light leading-relaxed max-w-xl">
              {t.home.heroDesc}
            </p>

            {/* Broadsheet Telemetry Readout Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-y border-[var(--border)] divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
              {deskCounters.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="py-3.5 px-3 first:pl-0 hover:bg-[var(--surface-2)] transition-colors"
                >
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-faint)] mb-1 truncate">
                    {item.label}
                  </div>
                  <div className="font-serif text-2xl text-[var(--text)] tabular-nums">
                    {item.value}
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-[var(--text-faint)] pt-1">
              <LatestEvent />
              <span className="flex items-center gap-2 uppercase tracking-[0.18em]">
                <Radio className="w-3.5 h-3.5 text-[var(--accent)]" />
                {sources.join(" · ")}
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
            <div className="relative w-[330px] h-[330px] sm:w-[420px] sm:h-[420px] flex items-center justify-center">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-10 rounded-full opacity-35 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(79, 168, 255, 0.25) 0%, transparent 70%)",
                }}
              />
              <div className="w-full h-full relative z-10">
                <Globe3D />
              </div>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--text-faint)]">
              <span className="tabular text-[var(--accent-cyan)] whitespace-nowrap">
                {issLatNum !== undefined && issLonNum !== undefined
                  ? `ISS ${issLatNum.toFixed(1)}°, ${issLonNum.toFixed(1)}°`
                  : "51.6° INC"}
              </span>
              <span aria-hidden="true">·</span>
              <span>{t.home.globeCaption}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Interactive Etched Specimen Plates ---------- */}
      <ObservatoryPlates
        kpIndex={solar?.kpIndex}
        solarWindSpeed={solar?.solarWind?.speedKms}
        bzGse={solar?.solarWind?.bzGse ?? undefined}
        sdoImageUrl={solar?.sdoImageUrl}
        quakes={quakes?.features ?? []}
        issLat={issLatNum}
        issLon={issLonNum}
        groundTrack={iss?.groundTrack ?? []}
        asteroidCount={space?.asteroids?.length}
      />

      {/* ---------- Six Live Feeds Grid ---------- */}
      <section className="relative py-20 px-4 md:px-8 w-full max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease }}
          className="max-w-2xl mb-14 border-b border-[var(--border)] pb-8"
        >
          <div className="eyebrow mb-4">{t.home.modulesEyebrow}</div>
          <h2 className="font-serif text-4xl md:text-5xl text-[var(--text)] mb-4 leading-[1.1]">
            {t.home.modulesHeading}
          </h2>
          <p className="text-[var(--text-dim)] text-lg font-light leading-relaxed">
            {t.home.modulesSub}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease }}
                className="bezel group"
              >
                <Link
                  href={m.href}
                  className="bezel-core p-7 flex flex-col justify-between h-full transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="icon-tile w-10 h-10 rounded-xl inset-well flex items-center justify-center">
                          <Icon
                            className="w-4 h-4 text-[var(--accent)]"
                            strokeWidth={1.3}
                          />
                        </div>
                        <span className="font-mono text-[10px] tracking-[0.22em] text-[var(--text-faint)]">
                          № {m.numeral}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-faint)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-1">
                        {m.metric}
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl text-[var(--text)] mb-2.5 group-hover:text-[var(--accent)] transition-colors">
                      {m.title}
                    </h3>
                    <p className="text-[var(--text-dim)] leading-relaxed font-light text-[15px]">
                      {m.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ---------- Etched Closing Colophon ---------- */}
      <section className="relative py-20 px-4 md:px-8 w-full max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease }}
          className="relative border-t border-b border-[var(--border)] py-14 md:py-16 flex flex-col md:flex-row md:items-center justify-between gap-8"
        >
          <div className="max-w-xl">
            <div className="eyebrow mb-4 text-[var(--accent)]">{t.home.closingEyebrow}</div>
            <h2 className="display-2 text-[var(--text)] mb-4">
              {t.home.closingHeading}
            </h2>
            <p className="text-[var(--text-dim)] text-base md:text-lg font-light">
              {t.home.closingSub}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/dashboard" className="btn-primary group">
              {t.home.openDashboard}
              <span className="btn-disc">
                <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
              </span>
            </Link>
            <Link href="/timeline" className="btn-ghost">
              {t.nav.timeline}
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
