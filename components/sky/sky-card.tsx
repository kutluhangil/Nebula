"use client";

import type { LucideIcon } from "lucide-react";

/**
 * How a card's numbers were arrived at. Every sky card declares one, because
 * the page mixes three kinds of value and a reader cannot otherwise tell a
 * live computation from a curated record or a closed archive.
 */
export type SkyCardKind = "computed" | "curated" | "archive";

const KIND_LABEL: Record<SkyCardKind, string> = {
  computed: "Computed",
  curated: "Curated",
  archive: "Archive",
};

interface SkyCardProps {
  title: string;
  icon: LucideIcon;
  kind: SkyCardKind;
  /** The publication the content came from. Required on curated and archive cards. */
  source: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * The shared frame for every widget on the sky page: title row, provenance
 * badge, content, attribution. The attribution is part of the frame rather
 * than each card's own markup so it cannot be forgotten on one of them.
 */
export function SkyCard({
  title,
  icon: Icon,
  kind,
  source,
  children,
  className = "",
}: SkyCardProps) {
  return (
    <section
      className={`glass-panel p-5 flex flex-col h-full ${className}`}
      aria-label={title}
    >
      <div className="panel-head px-0.5">
        <span className="panel-title">
          <Icon
            className="w-4 h-4 text-[var(--accent)]"
            strokeWidth={1.25}
            aria-hidden="true"
          />
          {title}
        </span>
        <span className="eyebrow shrink-0">{KIND_LABEL[kind]}</span>
      </div>

      <div className="flex-1 pt-5">{children}</div>

      <p className="eyebrow pt-5 mt-5 border-t border-[var(--border)] leading-relaxed normal-case tracking-[0.1em]">
        {source}
      </p>
    </section>
  );
}
