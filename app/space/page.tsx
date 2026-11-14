"use client";

import { motion } from "framer-motion";
import { Satellite, Star, Zap, AlertTriangle, Rocket, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { APODCard } from "@/components/dashboard/apod-card";
import { ISSTracker } from "@/components/dashboard/iss-tracker";
import { AsteroidCard } from "@/components/dashboard/asteroid-card";
import { SolarCard } from "@/components/dashboard/solar-card";
import { CrewCard } from "@/components/dashboard/crew-card";
import { MarsRoversCard } from "@/components/sky/mars-rovers-card";
import { EtchedBanner } from "@/components/ui/etched-banner";
import { useLocale } from "@/lib/i18n";

export default function SpacePage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen w-full pt-28 pb-24 px-4 md:px-8 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <EtchedBanner
          preset="ember"
          eyebrow={t.common.liveMonitor}
          titlePre={t.space.titlePre}
          titleItalic={t.space.titleItalic}
          subtitle={t.space.subtitle}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <SectionLabel icon={Star} label={t.dashboard.sections.apod} />
              <APODCard />
            </div>
            <div>
              <SectionLabel icon={AlertTriangle} label={t.dashboard.sections.asteroids} />
              <AsteroidCard />
            </div>
            <div>
              <SectionLabel icon={Satellite} label={t.sky.marsLiveTitle} live />
              <MarsRoversCard />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <SectionLabel icon={Satellite} label={t.dashboard.sections.iss} live />
              <ISSTracker />
            </div>
            <div>
              <SectionLabel icon={Zap} label={t.dashboard.sections.solar} live />
              <SolarCard />
            </div>
            <div>
              <SectionLabel icon={Users} label={t.dashboard.sections.crew} live />
              <div className="glass-panel p-5">
                <CrewCard />
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Link
            href="/launches"
            className="group flex items-center justify-between glass-card p-5 hover:border-[var(--border-strong)] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="icon-tile w-10 h-10 rounded-xl flex items-center justify-center">
                <Rocket className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <div className="text-[var(--text)] font-medium text-sm">
                  {t.space.launchesLinkTitle}
                </div>
                <div className="text-[var(--text-faint)] text-xs">
                  {t.space.launchesLinkSub}
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  label,
  live = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  live?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-3 px-0.5">
      <Icon className="w-4 h-4 text-[var(--accent)]" />
      <span className="text-[var(--text)] font-semibold text-sm">{label}</span>
      {live && <span className="live-dot" />}
    </div>
  );
}
