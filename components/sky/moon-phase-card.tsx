"use client";

import { Moon } from "lucide-react";
import { format } from "date-fns";
import { moonPhase, nextMoonPhase } from "@/lib/astronomy";
import { useNow } from "@/hooks/use-now";
import { SkyCard } from "@/components/sky/sky-card";

const DISC_RADIUS = 46;

/**
 * The lit part of the disc.
 *
 * The terminator is the projection of a circle onto the disc, so it is an
 * ellipse whose semi-minor axis shrinks to zero at the quarters and grows back
 * to the full radius at new and full moon. `illumination` gives that directly:
 * |2f - 1| is the ellipse width, and f > 0.5 flips the arc from crescent to
 * gibbous. The waning half is the same shape mirrored.
 */
function litPath(illumination: number, waxing: boolean): string {
  const r = DISC_RADIUS;
  const terminatorRadius = Math.abs(2 * illumination - 1) * r;
  const gibbous = illumination > 0.5 ? 1 : 0;
  const outerSweep = waxing ? 1 : 0;
  const terminatorSweep = waxing ? gibbous : 1 - gibbous;

  return [
    `M 0 ${-r}`,
    `A ${r} ${r} 0 0 ${outerSweep} 0 ${r}`,
    `A ${terminatorRadius} ${r} 0 0 ${terminatorSweep} 0 ${-r}`,
    "Z",
  ].join(" ");
}

export function MoonPhaseCard() {
  const now = useNow();

  return (
    <SkyCard
      title="Moon Phase"
      icon={Moon}
      kind="computed"
      source="Computed with suncalc, an implementation of Meeus' astronomical algorithms"
    >
      {now === null ? (
        // useNow is null until the client clock is known. Rendering a phase
        // before that would be a phase for a time the server guessed.
        <div className="h-52 skeleton rounded-[var(--r-md)]" aria-busy="true" />
      ) : (
        <MoonPhaseReadout date={new Date(now)} />
      )}
    </SkyCard>
  );
}

function MoonPhaseReadout({ date }: { date: Date }) {
  const { name, illumination, ageDays, distanceKm, waxing } = moonPhase(date);
  const illuminationPercent = illumination * 100;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-6">
        <svg
          viewBox="-52 -52 104 104"
          className="w-24 h-24 shrink-0"
          role="img"
          aria-label={`${name}, ${illuminationPercent.toFixed(0)} percent illuminated`}
        >
          <circle
            r={DISC_RADIUS}
            className="fill-[var(--surface-3)] stroke-[var(--border-strong)]"
            strokeWidth={1}
          />
          <path d={litPath(illumination, waxing)} className="fill-[var(--text)]" />
        </svg>

        <div className="min-w-0">
          <div className="display-3 text-[var(--text)]">{name}</div>
          <div className="text-[var(--text-dim)] text-sm mt-1 tabular">
            {illuminationPercent.toFixed(1)}% illuminated
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <Metric label="Age" value={`${ageDays.toFixed(1)} days`} />
        <Metric
          label="Distance"
          value={`${Math.round(distanceKm).toLocaleString("en-US")} km`}
        />
        {/* Dates only. The search is accurate to within about a quarter of an
            hour of the true syzygy, which is not a clock time worth printing. */}
        <Metric
          label="Next new moon"
          value={format(nextMoonPhase(date, 0), "d MMM yyyy")}
        />
        <Metric
          label="Next full moon"
          value={format(nextMoonPhase(date, 0.5), "d MMM yyyy")}
        />
      </dl>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="inset-well px-3.5 py-3">
      <dt className="eyebrow">{label}</dt>
      <dd className="text-[var(--text)] text-sm font-mono mt-1.5 tabular">
        {value}
      </dd>
    </div>
  );
}
