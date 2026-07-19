"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Satellite, Star, Globe, Zap, AlertTriangle, Rocket } from "lucide-react";
import { APODCard } from "@/components/dashboard/apod-card";
import { ISSTracker } from "@/components/dashboard/iss-tracker";
import { AsteroidCard } from "@/components/dashboard/asteroid-card";
import { SolarCard } from "@/components/dashboard/solar-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function SpacePage() {
  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1
            className="font-serif text-4xl md:text-5xl text-[var(--text)]"
           
          >
            Space{" "}
            <span className="italic text-[var(--accent)]">Observatory</span>
          </h1>
          <p className="text-[var(--text-faint)] text-sm mt-1">
            NASA · NOAA · Open Notify · Live space data
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <SectionLabel icon={Star} label="Astronomy Picture of the Day" color="text-amber-400" />
              <APODCard />
            </div>
            <div>
              <SectionLabel icon={AlertTriangle} label="Near-Earth Asteroids" color="text-orange-400" />
              <AsteroidCard />
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <SectionLabel icon={Satellite} label="ISS Live Position" color="text-blue-400" live />
              <ISSTracker />
            </div>
            <div>
              <SectionLabel icon={Zap} label="Solar Activity" color="text-yellow-400" live />
              <SolarCard />
            </div>
          </div>
        </div>

        {/* Link to launches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8"
        >
          <Link
            href="/launches"
            className="group flex items-center justify-between glass-card p-5 hover:border-violet-500/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <div className="text-[var(--text-dim)] font-semibold text-sm">SpaceX Launches</div>
                <div className="text-[var(--text-faint)] text-xs">Latest and upcoming missions</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[var(--text-dim)] group-hover:translate-x-1 transition-all" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  label,
  color,
  live = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  live?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-[var(--text-dim)] font-semibold text-sm">{label}</span>
      {live && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
    </div>
  );
}
