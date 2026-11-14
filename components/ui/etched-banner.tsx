"use client";

import dynamic from "next/dynamic";
import type { AccretionPreset } from "@/components/ui/etched-accretion";

const EtchedAccretion = dynamic(() => import("@/components/ui/etched-accretion"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#030307]" />,
});

interface EtchedBannerProps {
  preset?: AccretionPreset;
  eyebrow: string;
  meta?: string;
  titlePre: string;
  titleItalic: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

const PRESET_ACCENT: Record<AccretionPreset, string> = {
  crimson: "#ff3b47",
  ember: "#ff8c38",
  glacier: "#639bff",
  ash: "#d4d4d8",
  orchid: "#df6be0",
};

/**
 * Framed WebGL2 engraved horizon masthead shared across inner observatory pages,
 * echoing the landing EtchedAccretion aesthetic with guaranteed dark-ground contrast.
 */
export function EtchedBanner({
  preset = "crimson",
  eyebrow,
  meta,
  titlePre,
  titleItalic,
  subtitle,
  rightSlot,
}: EtchedBannerProps) {
  const italicColor = PRESET_ACCENT[preset];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[var(--border-strong)] bg-[#030307] shadow-[var(--panel-shadow)]">
      <div className="relative min-h-[210px] md:min-h-[236px]">
        <EtchedAccretion
          height="100%"
          preset={preset}
          renderScale={0.75}
          params={{
            center: [0.82, 0.52],
            holeSize: 0.095,
            diskRadius: 1.55,
            exposure: 1.05,
            vignette: 0.65,
          }}
          className="!absolute inset-0"
        />
        {/* Left legibility veil so serif typography always reads cleanly */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(3,3,7,0.92) 0%, rgba(3,3,7,0.72) 48%, rgba(3,3,7,0.22) 100%)",
          }}
        />
        <div className="relative z-10 p-6 md:p-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-black/50 font-mono text-[10px] tracking-[0.22em] uppercase text-[#e9e4df]">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: italicColor }}
                />
                {eyebrow}
              </span>
              {meta && (
                <span className="font-mono text-[11px] tracking-wider text-white/55">
                  {meta}
                </span>
              )}
            </div>
            <h1 className="display-1 text-[#e9e4df]">
              {titlePre}{" "}
              <span className="italic" style={{ color: italicColor }}>
                {titleItalic}
              </span>
            </h1>
            {subtitle && (
              <p className="mt-3 text-sm md:text-base text-white/70 font-light leading-relaxed max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
          {rightSlot && <div className="shrink-0 relative z-10">{rightSlot}</div>}
        </div>
      </div>
    </div>
  );
}
