"use client";

import { Quote } from "lucide-react";
import { SPACE_QUOTES, pickForDay } from "@/lib/sky-data";
import { useNow } from "@/hooks/use-now";
import { SkyCard } from "@/components/sky/sky-card";

export function SpaceQuoteCard() {
  const now = useNow();
  const quote = now === null ? null : pickForDay(SPACE_QUOTES, new Date(now));

  return (
    <SkyCard
      title="Space Quote"
      icon={Quote}
      kind="curated"
      // The context line is the attribution here: who said it, and where.
      source={quote ? `${quote.speaker} — ${quote.context}` : SPACE_QUOTES[0].context}
    >
      {quote === null ? (
        <div className="h-24 skeleton rounded-[var(--r-md)]" aria-busy="true" />
      ) : (
        <blockquote className="font-serif text-[var(--text)] text-xl leading-snug">
          “{quote.text}”
        </blockquote>
      )}
    </SkyCard>
  );
}
