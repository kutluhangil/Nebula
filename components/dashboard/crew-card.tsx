"use client";

import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { fetchJson } from "@/lib/api-client";
import { FeedError, FeedSkeleton } from "@/components/ui/feed-state";
import { useLocale } from "@/lib/i18n";

interface CrewMember {
  id: number;
  name: string;
  country: string | null;
  agency: string | null;
  position: string | null;
  spacecraft: string | null;
  daysInSpace: number | null;
  iss: boolean;
}

interface AstronautsPayload {
  count: number;
  issExpedition: number | null;
  people: CrewMember[];
  source: string;
}

/** Humans currently in orbit, grouped across ISS and other orbital stations. */
export function CrewCard() {
  const { t } = useLocale();
  const { data, isLoading, isError, error, refetch } = useQuery<AstronautsPayload>({
    queryKey: ["astronauts"],
    queryFn: () => fetchJson<AstronautsPayload>("/api/astronauts"),
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading) return <FeedSkeleton rows={5} />;

  if (isError || !data) {
    return (
      <FeedError
        message={t.dashboard.crew.unavailable}
        detail={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
      />
    );
  }

  const issCrew = data.people.filter((p) => p.iss);
  const otherCrew = data.people.filter((p) => !p.iss);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div>
          <p className="eyebrow">{t.dashboard.crew.inOrbit}</p>
          <div className="flex items-baseline gap-2.5 mt-1">
            <span className="font-serif text-4xl font-normal tracking-tight tabular-nums text-[var(--text)]">
              {data.count}
            </span>
            {data.issExpedition && (
              <span className="text-[11px] font-mono text-[var(--text-dim)]">
                {t.dashboard.crew.expedition} {data.issExpedition}
              </span>
            )}
          </div>
        </div>
        <span className="eyebrow-pill">
          <Users className="h-3 w-3 text-[var(--accent)]" aria-hidden="true" />
          {issCrew.length} {t.dashboard.crew.iss}
          {otherCrew.length > 0 ? ` · ${otherCrew.length} ${t.dashboard.crew.otherCraft}` : ""}
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {data.people.slice(0, 12).map((person) => (
          <div
            key={person.id}
            className="inset-well rounded-lg px-3 py-2 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--text)] truncate">
                {person.name}
              </div>
              <div className="text-[11px] text-[var(--text-dim)] truncate">
                {[person.agency, person.position, person.spacecraft]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
            <div className="shrink-0 text-right font-mono">
              {person.daysInSpace !== null && (
                <div className="text-xs font-semibold tabular-nums text-[var(--accent)]">
                  {person.daysInSpace}{t.dashboard.crew.days}
                </div>
              )}
              {person.country && (
                <div className="text-[10px] text-[var(--text-faint)] uppercase">
                  {person.country}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-[var(--text-faint)] pt-1 border-t border-[var(--border)]">
        {t.common.source}: {data.source}
      </p>
    </div>
  );
}
