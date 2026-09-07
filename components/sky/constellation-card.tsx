"use client";

import { Sparkles } from "lucide-react";
import { CONSTELLATIONS, pickForDay } from "@/lib/sky-data";
import { useNow } from "@/hooks/use-now";
import { SkyCard } from "@/components/sky/sky-card";

export function ConstellationCard() {
  const now = useNow();
  const constellation = now === null ? null : pickForDay(CONSTELLATIONS, new Date(now));

  return (
    <SkyCard
      title="Constellation of the Day"
      icon={Sparkles}
      kind="curated"
      source={constellation?.source ?? CONSTELLATIONS[0].source}
    >
      {constellation === null ? (
        <div className="h-52 skeleton rounded-[var(--r-md)]" aria-busy="true" />
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <div className="display-3 text-[var(--text)]">
              {constellation.name}
            </div>
            <div className="text-[var(--text-dim)] text-sm mt-1 italic">
              {constellation.genitive} · {constellation.abbreviation}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <Cell
              label="Brightest star"
              value={`${constellation.brightestStar} (mag ${constellation.brightestStarMagnitude.toFixed(2)})`}
            />
            <Cell
              label="Area"
              value={`${constellation.areaSquareDegrees.toLocaleString("en-US")} sq°`}
            />
            <Cell label="Best seen" value={constellation.bestViewedMonth} />
            <Cell label="Sky" value={constellation.hemisphere} capitalize />
            <Cell
              label="Notable object"
              value={constellation.notableObject}
              className="col-span-2"
            />
          </dl>
        </div>
      )}
    </SkyCard>
  );
}

/**
 * `capitalize` is opt-in per cell. Applying it to the whole grid turned units
 * and sentence fragments into title case — "494.18 Sq°", "mag" as "Mag" — so
 * only the values that are genuinely lowercase prose ask for it.
 */
function Cell({
  label,
  value,
  capitalize = false,
  className = "",
}: {
  label: string;
  value: string;
  capitalize?: boolean;
  className?: string;
}) {
  return (
    <div className={`inset-well px-3.5 py-3 ${className}`}>
      <dt className="eyebrow">{label}</dt>
      <dd
        className={`text-[var(--text)] text-sm mt-1.5 ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
