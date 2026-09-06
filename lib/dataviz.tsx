/**
 * Nebula's shared chart language.
 *
 * Every visualization in the app draws from this file so magnitude bars, the
 * seismic map, the Kp gauge and the depth scatter read as one instrument.
 * Recharts resolves CSS variables at render time, so axis/grid/tooltip config
 * references theme tokens directly and stays theme-aware with no extra JS.
 */
import type { ReactNode } from "react";

/* ---------------------------------------------------------------------------
   Severity ramp — a SEQUENTIAL scale (calm → critical), not a categorical
   palette, so its steps descend in lightness as severity rises and a reader
   ranks them without reading the legend.

   The previous ramp (emerald → amber → orange → red) put #f59e0b beside
   #f97316: ΔE 9.6 for normal vision and 6.2 under deuteranopia, so the
   "moderate" and "strong" bands were the same colour on the map legend. These
   steps measure ΔE 15.0 normal and 13.2 deutan at their closest pair.

   Two steps sit below 3:1 against their own surface — pale amber on the light
   theme, deep crimson on the dark one — which the palette check calls out as
   needing relief. Every surface that uses the ramp provides it: the map
   legend and the distribution bars carry written band names, the bars carry
   their value, the gauge carries the NOAA level, and the map also encodes
   magnitude as radius. Colour is never the only encoding here.
--------------------------------------------------------------------------- */
export const SEVERITY_RAMP = ["#ffd166", "#f2921d", "#e2483d", "#a51d3f"] as const;

/** Earthquake magnitude → severity colour (kept in sync with the map legend). */
export function magnitudeColor(mag: number): string {
  if (mag >= 7) return SEVERITY_RAMP[3];
  if (mag >= 6) return SEVERITY_RAMP[2];
  if (mag >= 5) return SEVERITY_RAMP[1];
  return SEVERITY_RAMP[0];
}

/**
 * Planetary K-index (0–9) → severity colour, on NOAA's own band boundaries so
 * the gauge's colour and its written label change at the same value: quiet and
 * unsettled below Kp 4, active at 4, a G1–G2 storm at 5–6, and G3 upward at 7.
 */
export function kpColor(kp: number): string {
  if (kp >= 7) return SEVERITY_RAMP[3];
  if (kp >= 5) return SEVERITY_RAMP[2];
  if (kp >= 4) return SEVERITY_RAMP[1];
  return SEVERITY_RAMP[0];
}

/** Ordinal magnitude bands used by the distribution chart + map legend. */
export const MAGNITUDE_BANDS = [
  { key: "M4–5", label: "Minor", min: 4, max: 5, color: SEVERITY_RAMP[0] },
  { key: "M5–6", label: "Moderate", min: 5, max: 6, color: SEVERITY_RAMP[1] },
  { key: "M6–7", label: "Strong", min: 6, max: 7, color: SEVERITY_RAMP[2] },
  { key: "M7+", label: "Major", min: 7, max: Infinity, color: SEVERITY_RAMP[3] },
] as const;

/* ---------------------------------------------------------------------------
   Neutral data hue — for non-severity measures (counts, cadence, trends).
--------------------------------------------------------------------------- */
export const CHART_ACCENT = "var(--accent)";
export const CHART_CYAN = "var(--accent-cyan)";

/* ---------------------------------------------------------------------------
   Recharts primitives — one axis/grid/cursor treatment everywhere.
--------------------------------------------------------------------------- */
export const axisTick = {
  fill: "var(--text-faint)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
} as const;

export const axisLineProps = { stroke: "var(--border)" } as const;

export const gridProps = {
  stroke: "var(--grid-line)",
  strokeDasharray: "2 5",
  vertical: false,
} as const;

export const cursorFill = { fill: "var(--surface-hover)" } as const;

/** Axis titles: named units, so a reader never has to infer what a scale is. */
export const axisLabel = {
  fill: "var(--text-faint)",
  fontSize: 10,
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.14em",
} as const;

/** Respects the user's reduced-motion preference for chart entrance tweens. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* ---------------------------------------------------------------------------
   Presentational shells — the shared tooltip box and the chart card frame.
--------------------------------------------------------------------------- */
export function TooltipShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elev)] px-3 py-2 shadow-[var(--panel-shadow)]">
      {children}
    </div>
  );
}

export function ChartFrame({
  eyebrow,
  caption,
  action,
  children,
}: {
  eyebrow: string;
  caption?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-baseline justify-between mb-4 gap-3">
        <div>
          <div className="eyebrow mb-1">{eyebrow}</div>
          {caption && (
            <div className="text-[var(--text-dim)] text-sm">{caption}</div>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
