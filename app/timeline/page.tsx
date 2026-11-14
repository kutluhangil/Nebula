"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, Activity, Rocket, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fetchJson } from "@/lib/api-client";
import { useNow } from "@/hooks/use-now";
import { useLocale } from "@/lib/i18n";
import { EtchedBanner } from "@/components/ui/etched-banner";

type EventFilter = "all" | "earthquake" | "launch" | "apod";

interface TimelineEvent {
  id: string;
  type: "earthquake" | "launch" | "apod";
  title: string;
  subtitle: string;
  time: Date;
  toneColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function TimelinePage() {
  const { t, dateLocale } = useLocale();
  const [filter, setFilter] = useState<EventFilter>("all");
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
    latest: { name: string; date_utc: string; success: boolean | null } | null;
    upcoming: Array<{ id: string; name: string; date_utc: string }>;
  }>({
    queryKey: ["spacex"],
    queryFn: () => fetchJson("/api/spacex"),
  });

  const feeds = [earthquakes, apod, spacex];
  const feedsFailed = feeds.every((feed) => feed.isError);
  const retryFeeds = () => feeds.forEach((feed) => feed.refetch());

  const events: TimelineEvent[] = [];

  if (apod.data?.date) {
    events.push({
      id: "apod-today",
      type: "apod",
      title: apod.data.title || "NASA Astronomy Picture of the Day",
      subtitle: "NASA APOD",
      time: new Date(apod.data.date),
      toneColor: "var(--accent-amber)",
      icon: Star,
    });
  }

  if (earthquakes.data?.features) {
    earthquakes.data.features.slice(0, 20).forEach((q) => {
      const mag = q.properties.mag;
      events.push({
        id: q.id,
        type: "earthquake",
        title: `M${mag.toFixed(1)}`,
        subtitle: q.properties.place,
        time: new Date(q.properties.time),
        toneColor:
          mag >= 6
            ? "var(--accent-red)"
            : mag >= 5
            ? "var(--accent-amber)"
            : "var(--accent-green)",
        icon: Activity,
      });
    });
  }

  if (spacex.data?.latest) {
    events.push({
      id: "spacex-latest",
      type: "launch",
      title: spacex.data.latest.name,
      subtitle: `SpaceX · ${
        spacex.data.latest.success
          ? t.launches.success
          : spacex.data.latest.success === false
          ? t.launches.failed
          : "Completed"
      }`,
      time: new Date(spacex.data.latest.date_utc),
      toneColor: "var(--accent)",
      icon: Rocket,
    });
  }

  if (spacex.data?.upcoming) {
    spacex.data.upcoming.slice(0, 3).forEach((l) => {
      events.push({
        id: `upcoming-${l.id}`,
        type: "launch",
        title: `${t.common.upcoming}: ${l.name}`,
        subtitle: "SpaceX",
        time: new Date(l.date_utc),
        toneColor: "var(--accent)",
        icon: Rocket,
      });
    });
  }

  const filteredEvents = events
    .filter((e) => filter === "all" || e.type === filter)
    .sort((a, b) => b.time.getTime() - a.time.getTime());

  const groups: { key: string; label: string; items: TimelineEvent[] }[] = [];
  for (const event of filteredEvents) {
    const key = format(event.time, "yyyy-MM-dd");
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.items.push(event);
    } else {
      groups.push({
        key,
        label: format(event.time, "EEEE, MMM d", { locale: dateLocale }),
        items: [event],
      });
    }
  }

  const filterButtons: { key: EventFilter; label: string }[] = [
    { key: "all", label: t.timeline.filters.all },
    { key: "earthquake", label: t.timeline.filters.earthquake },
    { key: "launch", label: t.timeline.filters.launch },
    { key: "apod", label: t.timeline.filters.apod },
  ];

  return (
    <div className="min-h-screen w-full pt-28 pb-24 px-4 md:px-8 lg:px-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <EtchedBanner
          preset="crimson"
          eyebrow={t.nav.timeline}
          titlePre={t.timeline.titlePre}
          titleItalic={t.timeline.titleItalic}
          subtitle={t.timeline.subtitle}
          rightSlot={
            <div
              data-theme="dark"
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label="Filter timeline category"
            >
              {filterButtons.map((btn) => (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => setFilter(btn.key)}
                  aria-pressed={filter === btn.key}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                    filter === btn.key
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                      : "border-[var(--border)] bg-black/40 text-[var(--text-dim)] hover:text-[var(--text)]"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          }
        />

        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--accent)] via-[var(--border)] to-transparent opacity-60" />

          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.key}>
                <div className="sticky top-20 z-20 mb-3 pl-12 py-1 flex items-center gap-3">
                  <span className="eyebrow-pill">{group.label}</span>
                  <span className="text-[var(--text-faint)] text-xs font-mono">
                    {group.items.length}{" "}
                    {group.items.length === 1
                      ? t.timeline.eventSingular
                      : t.timeline.eventPlural}
                  </span>
                </div>

                <div className="space-y-3">
                  {group.items.map((event, i) => {
                    const Icon = event.icon;
                    const isUpcoming = now !== null && event.time.getTime() > now;

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i, 8) * 0.03 }}
                        className="relative flex items-start gap-4 pl-12"
                      >
                        <div
                          className={`absolute left-3 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                            isUpcoming
                              ? "bg-[var(--accent-soft)] border border-[var(--accent)]"
                              : "bg-[var(--bg)] border border-[var(--border-strong)]"
                          }`}
                          style={{ color: event.toneColor }}
                        >
                          <Icon className="w-2.5 h-2.5" />
                        </div>

                        <div
                          className={`flex-1 glass-card p-3.5 ${
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
                                  <span className="text-[10px] font-mono text-[var(--accent)] font-medium uppercase tracking-wide flex-shrink-0">
                                    {t.common.upcoming}
                                  </span>
                                )}
                              </div>
                              <p className="text-[var(--text-faint)] text-xs truncate">
                                {event.subtitle}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-[var(--text-dim)] text-xs font-mono">
                                {formatDistanceToNow(event.time, {
                                  addSuffix: true,
                                  locale: dateLocale,
                                })}
                              </div>
                              <div className="text-[var(--text-faint)] text-[10px] font-mono mt-0.5">
                                {format(event.time, "MMM d, HH:mm", {
                                  locale: dateLocale,
                                })}{" "}
                                UTC
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

          {filteredEvents.length === 0 && (
            <div className="text-center py-20 text-[var(--text-faint)]">
              <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>{feedsFailed ? t.timeline.allDead : t.timeline.loading}</p>
              {feedsFailed && (
                <button
                  type="button"
                  onClick={() => retryFeeds()}
                  className="mt-4 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)] text-xs font-medium hover:text-[var(--text)] transition-colors cursor-pointer"
                >
                  {t.common.retry}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
