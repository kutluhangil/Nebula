"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Star,
  Activity,
  Rocket,
  Zap,
  Satellite,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface TimelineEvent {
  id: string;
  type: "earthquake" | "launch" | "apod" | "solar" | "iss";
  title: string;
  subtitle: string;
  time: Date;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  severity?: "low" | "medium" | "high" | "extreme";
}

export default function TimelinePage() {
  const { data: earthquakeData } = useQuery<{
    features: Array<{
      id: string;
      properties: { mag: number; place: string; time: number };
    }>;
  }>({
    queryKey: ["earthquakes"],
    queryFn: () => fetch("/api/earthquakes").then((r) => r.json()),
  });

  const { data: apodData } = useQuery<{ title: string; date: string }>({
    queryKey: ["apod"],
    queryFn: () => fetch("/api/apod").then((r) => r.json()),
  });

  const { data: spacexData } = useQuery<{
    latest: { name: string; date_utc: string; success: boolean | null };
    upcoming: Array<{ id: string; name: string; date_utc: string }>;
  }>({
    queryKey: ["spacex"],
    queryFn: () => fetch("/api/spacex").then((r) => r.json()),
  });

  const events: TimelineEvent[] = [];

  // APOD
  if (apodData?.date) {
    events.push({
      id: "apod-today",
      type: "apod",
      title: apodData.title || "NASA Astronomy Picture of the Day",
      subtitle: "NASA APOD",
      time: new Date(apodData.date),
      color: "text-amber-400",
      icon: Star,
    });
  }

  // Earthquakes
  if (earthquakeData?.features) {
    earthquakeData.features.slice(0, 20).forEach((q) => {
      const mag = q.properties.mag;
      events.push({
        id: q.id,
        type: "earthquake",
        title: `M${mag.toFixed(1)} Earthquake`,
        subtitle: q.properties.place,
        time: new Date(q.properties.time),
        color:
          mag >= 6
            ? "text-red-400"
            : mag >= 5
            ? "text-orange-400"
            : "text-emerald-400",
        icon: Activity,
        severity:
          mag >= 7
            ? "extreme"
            : mag >= 6
            ? "high"
            : mag >= 5
            ? "medium"
            : "low",
      });
    });
  }

  // SpaceX latest
  if (spacexData?.latest) {
    events.push({
      id: "spacex-latest",
      type: "launch",
      title: spacexData.latest.name,
      subtitle: `SpaceX · ${spacexData.latest.success ? "Success" : spacexData.latest.success === false ? "Failed" : "Completed"}`,
      time: new Date(spacexData.latest.date_utc),
      color: "text-violet-400",
      icon: Rocket,
    });
  }

  // SpaceX upcoming
  if (spacexData?.upcoming) {
    spacexData.upcoming.slice(0, 3).forEach((l) => {
      events.push({
        id: `upcoming-${l.id}`,
        type: "launch",
        title: `Upcoming: ${l.name}`,
        subtitle: "SpaceX · Scheduled",
        time: new Date(l.date_utc),
        color: "text-violet-400",
        icon: Rocket,
      });
    });
  }

  // Sort all events by time (newest first)
  events.sort((a, b) => b.time.getTime() - a.time.getTime());

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1
            className="font-serif text-4xl md:text-5xl text-[var(--text)]"
           
          >
            Unified{" "}
            <span className="italic text-[var(--accent)]">Timeline</span>
          </h1>
          <p className="text-[var(--text-faint)] text-sm mt-1">
            All events — earthquakes, launches, astronomy — in chronological order
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--accent)] via-[var(--border)] to-transparent opacity-60" />

          <div className="space-y-3">
            {events.map((event, i) => {
              const Icon = event.icon;
              const isUpcoming = event.time > new Date();

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="relative flex items-start gap-4 pl-12"
                >
                  {/* Icon */}
                  <div
                    className={`absolute left-3 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                      isUpcoming
                        ? "bg-violet-500/20 border border-violet-500/40"
                        : "bg-[var(--bg)] border border-[var(--border)]"
                    }`}
                  >
                    <Icon
                      className={`w-2.5 h-2.5 ${event.color}`}
                    />
                  </div>

                  {/* Card */}
                  <div
                    className={`flex-1 glass-card p-3 ${
                      isUpcoming ? "border-violet-500/10 bg-violet-500/[0.02]" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[var(--text-dim)] text-sm font-medium truncate">
                            {event.title}
                          </span>
                          {isUpcoming && (
                            <span className="text-[10px] text-violet-400 font-medium uppercase tracking-wide flex-shrink-0">
                              Upcoming
                            </span>
                          )}
                        </div>
                        <p className="text-[var(--text-faint)] text-xs">{event.subtitle}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[var(--text-faint)] text-xs">
                          {formatDistanceToNow(event.time, { addSuffix: true })}
                        </div>
                        <div className="text-[var(--text-faint)] text-[10px] font-mono mt-0.5">
                          {format(event.time, "MMM d, HH:mm")} UTC
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {events.length === 0 && (
            <div className="text-center py-20 text-[var(--text-faint)]">
              <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>Loading timeline events...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
