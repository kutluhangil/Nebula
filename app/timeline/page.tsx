"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Star,
  Activity,
  Rocket,
  Clock,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fetchJson } from "@/lib/api-client";
import { useNow } from "@/hooks/use-now";

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
  const now = useNow();
  const earthquakes = useQuery<{
    features: Array<{
      id: string;
      properties: { mag: number; place: string; time: number };
    }>;
  }>({
    queryKey: ["earthquakes"],
    queryFn: () => fetchJson("/api/earthquakes"),
  });

  const apod = useQuery<{ title: string; date: string }>({
    queryKey: ["apod"],
    queryFn: () => fetchJson("/api/apod"),
  });

  const spacex = useQuery<{
    latest: { name: string; date_utc: string; success: boolean | null };
    upcoming: Array<{ id: string; name: string; date_utc: string }>;
  }>({
    queryKey: ["spacex"],
    queryFn: () => fetchJson("/api/spacex"),
  });

  const earthquakeData = earthquakes.data;
  const apodData = apod.data;
  const spacexData = spacex.data;

  const feeds = [earthquakes, apod, spacex];
  // Only when nothing could be read: one dead feed still leaves a timeline
  // worth showing, and the entries that did load stay on it.
  const feedsFailed = feeds.every((feed) => feed.isError);
  const retryFeeds = () => feeds.forEach((feed) => feed.refetch());

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

  // One group per calendar day, in the same order as the events themselves.
  const groups: { key: string; label: string; items: typeof events }[] = [];
  for (const event of events) {
    const key = format(event.time, "yyyy-MM-dd");
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.items.push(event);
    } else {
      groups.push({ key, label: format(event.time, "EEEE, MMM d"), items: [event] });
    }
  }

  return (
    <div className="min-h-screen w-full pt-28 pb-24 px-4 md:px-8 lg:px-10">
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

        {/* Timeline. Twenty-five identical rows read as one undifferentiated
            list, so events are grouped under the day they happened and the
            day's heading stays in view while its group scrolls. */}
        <div className="relative">
          {/* Line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--accent)] via-[var(--border)] to-transparent opacity-60" />

          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.key}>
                <div className="sticky top-20 z-20 mb-3 pl-12 py-1 flex items-center gap-3">
                  <span className="eyebrow-pill">{group.label}</span>
                  <span className="text-[var(--text-faint)] text-xs">
                    {group.items.length} event{group.items.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-3">
                  {group.items.map((event, i) => {
              const Icon = event.icon;
              const isUpcoming = now !== null && event.time.getTime() > now;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.03 }}
                  className="relative flex items-start gap-4 pl-12"
                >
                  {/* Icon */}
                  <div
                    className={`absolute left-3 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                      isUpcoming
                        ? "bg-[var(--accent-soft)] border border-[var(--accent)]"
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
                      isUpcoming ? "border-[var(--accent)]" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[var(--text)] text-sm font-medium truncate">
                            {event.title}
                          </span>
                          {isUpcoming && (
                            <span className="text-[10px] text-[var(--accent)] font-medium uppercase tracking-wide flex-shrink-0">
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
              </section>
            ))}
          </div>

          {events.length === 0 && (
            <div className="text-center py-20 text-[var(--text-faint)]">
              <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
              {/* Every feed failing used to read as a load that never finished. */}
              <p>
                {feedsFailed
                  ? "No feed could be reached, so there is nothing to place on the timeline."
                  : "Loading timeline events..."}
              </p>
              {feedsFailed && (
                <button
                  onClick={() => retryFeeds()}
                  className="mt-4 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)] text-xs font-medium hover:text-[var(--text)] transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
