"use client";

import type { LucideIcon } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export type SkyCardKind = "computed" | "curated" | "archive";

interface SkyCardProps {
  title: string;
  icon: LucideIcon;
  kind: SkyCardKind;
  source: string;
  children: React.ReactNode;
  className?: string;
}

export function SkyCard({
  title,
  icon: Icon,
  kind,
  source,
  children,
  className = "",
}: SkyCardProps) {
  const { t } = useLocale();
  const kindLabel = t.sky.kinds[kind];

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
        <span className="eyebrow shrink-0">{kindLabel}</span>
      </div>

      <div className="flex-1 pt-5">{children}</div>

      <p className="eyebrow pt-5 mt-5 border-t border-[var(--border)] leading-relaxed normal-case tracking-[0.1em]">
        {source}
      </p>
    </section>
  );
}
