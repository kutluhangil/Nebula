"use client";

import { Orbit } from "lucide-react";
import { PLANETS, pickForDay } from "@/lib/sky-data";
import { useNow } from "@/hooks/use-now";
import { SkyCard } from "@/components/sky/sky-card";

/** Years read better than five-digit day counts past Mars. */
function orbitalPeriod(days: number): string {
  if (days < 1000) return `${days.toLocaleString("en-US")} Earth days`;
  return `${(days / 365.25).toFixed(1)} Earth years`;
}

/** A solar day past Mercury runs to thousands of hours. */
function dayLength(hours: number): string {
  if (hours < 100) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} Earth days`;
}

export function PlanetCard() {
  const now = useNow();
  const planet = now === null ? null : pickForDay(PLANETS, new Date(now));

  return (
    <SkyCard
      title="Planet of the Day"
      icon={Orbit}
      kind="curated"
      source={planet?.source ?? PLANETS[0].source}
    >
      {planet === null ? (
        <div className="h-52 skeleton rounded-[var(--r-md)]" aria-busy="true" />
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <div className="display-3 text-[var(--text)]">{planet.name}</div>
            <div className="text-[var(--text-dim)] text-sm mt-1 tabular">
              {planet.distanceFromSunMillionKm.toLocaleString("en-US")} million km
              from the Sun
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <Cell
              label="Diameter"
              value={`${planet.diameterKm.toLocaleString("en-US")} km`}
            />
            <Cell label="Day" value={dayLength(planet.dayLengthHours)} />
            <Cell label="Year" value={orbitalPeriod(planet.yearLengthDays)} />
            <Cell label="Mean temp" value={`${planet.meanTemperatureC} °C`} />
            <Cell
              label="Mass"
              value={`${(planet.massKg / 1e24).toLocaleString("en-US")} × 10²⁴ kg`}
            />
            <Cell label="Moons" value={planet.moons.toLocaleString("en-US")} />
          </dl>
        </div>
      )}
    </SkyCard>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="inset-well px-3.5 py-3">
      <dt className="eyebrow">{label}</dt>
      <dd className="text-[var(--text)] text-sm font-mono mt-1.5 tabular">
        {value}
      </dd>
    </div>
  );
}
