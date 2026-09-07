"use client";

import { Lightbulb } from "lucide-react";
import { ASTRONOMY_FACTS, pickForDay } from "@/lib/sky-data";
import { useNow } from "@/hooks/use-now";
import { SkyCard } from "@/components/sky/sky-card";

export function AstronomyFactCard() {
  const now = useNow();
  const fact = now === null ? null : pickForDay(ASTRONOMY_FACTS, new Date(now));

  return (
    <SkyCard
      title="Astronomy Fact"
      icon={Lightbulb}
      kind="curated"
      source={fact?.source ?? ASTRONOMY_FACTS[0].source}
    >
      {fact === null ? (
        <div className="h-24 skeleton rounded-[var(--r-md)]" aria-busy="true" />
      ) : (
        <p className="text-[var(--text)] text-base leading-relaxed">
          {fact.text}
        </p>
      )}
    </SkyCard>
  );
}
