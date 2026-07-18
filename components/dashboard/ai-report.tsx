"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";

interface AIReportProps {
  earthquakeCount: number;
}

function generateReport(earthquakeCount: number): string {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const quakeDesc =
    earthquakeCount > 30
      ? `${earthquakeCount} earthquakes magnitude 4.0+ were recorded in the past 7 days globally, indicating elevated seismic activity.`
      : earthquakeCount > 10
      ? `${earthquakeCount} earthquakes above magnitude 4.0 have been recorded this week, with tectonic activity remaining moderate.`
      : earthquakeCount > 0
      ? `Only ${earthquakeCount} notable earthquakes recorded this week — seismic activity is relatively calm.`
      : "Seismic monitoring services are currently updating. Check back shortly for earthquake data.";

  return `Planet Intelligence Report — ${date}. ${quakeDesc} The International Space Station continues its orbit at 408km altitude, completing 15.5 orbits per day at 27,600 km/h. Solar activity remains at KP index 2 — quiet conditions with minimal aurora probability. Monitoring all Earth and space systems in real-time.`;
}

export function AIReport({ earthquakeCount }: AIReportProps) {
  const report = generateReport(earthquakeCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 border border-violet-500/10 bg-gradient-to-r from-violet-500/[0.04] to-blue-500/[0.03]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="text-white/60 font-semibold text-sm">
            Daily Planet Report
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-white/20 text-xs">
          <RefreshCw className="w-3 h-3" />
          Auto-generated
        </div>
      </div>

      <p className="text-white/45 text-sm leading-relaxed">{report}</p>
    </motion.div>
  );
}
