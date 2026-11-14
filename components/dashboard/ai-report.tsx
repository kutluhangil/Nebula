"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";
import { fetchJson } from "@/lib/api-client";
import { useLocale } from "@/lib/i18n";

interface AIReportProps {
  /** Undefined until the earthquake feed answers. */
  earthquakeCount: number | undefined;
}

export function AIReport({ earthquakeCount }: AIReportProps) {
  const { t, locale } = useLocale();

  const { data: solar } = useQuery<{ kpIndex?: number; solarFlares?: number }>({
    queryKey: ["solar"],
    queryFn: () => fetchJson("/api/solar"),
    staleTime: 1000 * 60 * 5,
  });

  const { data: spaceData } = useQuery<{
    asteroids?: { is_potentially_hazardous_asteroid: boolean }[];
  }>({
    queryKey: ["space"],
    queryFn: () => fetchJson("/api/space"),
    staleTime: 1000 * 60 * 60,
  });

  const { data: spacex } = useQuery<{ upcoming?: { name: string }[] }>({
    queryKey: ["spacex"],
    queryFn: () => fetchJson("/api/spacex"),
    staleTime: 1000 * 60 * 30,
  });

  const { data: iss } = useQuery<{
    iss_position?: { latitude: string; longitude: string };
  }>({
    queryKey: ["iss"],
    queryFn: () => fetchJson("/api/iss"),
    refetchInterval: 5000,
  });

  const hazardousAsteroids = spaceData?.asteroids
    ? spaceData.asteroids.filter((a) => a.is_potentially_hazardous_asteroid).length
    : undefined;
  const nextLaunchName = spacex?.upcoming?.[0]?.name;

  const { data, isLoading, isError } = useQuery<{ report: string }>({
    // Key only on earthquakeCount and locale so background feeds resolving later
    // do not trigger extra /api/ai-report synthesis calls.
    queryKey: ["ai-report", earthquakeCount, locale],
    queryFn: async () => {
      const res = await fetch("/api/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          earthquakeCount,
          kpIndex: solar?.kpIndex,
          solarFlares: solar?.solarFlares,
          hazardousAsteroids,
          nextLaunchName,
          issLat: iss?.iss_position?.latitude,
          issLon: iss?.iss_position?.longitude,
          locale,
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
    enabled: earthquakeCount !== undefined,
    staleTime: 1000 * 60 * 60 * 2,
  });

  const isGenerating = earthquakeCount === undefined || isLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-[var(--border)] rounded-xl bg-[var(--surface-1)]/80 p-6 h-full flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
            <span className="font-serif text-lg text-[var(--text)]">
              {t.dashboard.aiReport.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--text-faint)] text-[11px] font-mono">
            <RefreshCw className={`w-3 h-3 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? t.dashboard.aiReport.generating : t.dashboard.aiReport.ready}
          </div>
        </div>

        <p className="text-[var(--text-dim)] text-sm sm:text-[15px] leading-relaxed font-normal max-w-prose">
          {isGenerating
            ? t.dashboard.aiReport.waiting
            : isError
            ? t.dashboard.aiReport.error
            : data?.report}
        </p>
      </div>
    </motion.div>
  );
}
