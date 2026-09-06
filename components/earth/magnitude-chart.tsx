"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  MAGNITUDE_BANDS,
  magnitudeColor,
  axisTick,
  axisLineProps,
  gridProps,
  cursorFill,
  axisLabel,
  ChartFrame,
  TooltipShell,
} from "@/lib/dataviz";

interface Quake {
  properties: { mag: number };
}

function TooltipBox({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { band: string } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <TooltipShell>
      <div className="font-mono text-xs text-[var(--text-dim)]">
        M{label}–{(Number(label) + 0.5).toFixed(1)} · {payload[0].payload.band}
      </div>
      <div className="tabular font-mono text-lg text-[var(--text)]">
        {payload[0].value}
        <span className="text-[var(--text-faint)] text-xs ml-1">events</span>
      </div>
    </TooltipShell>
  );
}

/** The band a magnitude falls in, for the tooltip's written label. */
function bandLabel(mag: number): string {
  const band = MAGNITUDE_BANDS.find((b) => mag >= b.min && mag < b.max);
  return band?.label ?? MAGNITUDE_BANDS[MAGNITUDE_BANDS.length - 1].label;
}

const BIN_WIDTH = 0.5;

export function MagnitudeChart({ earthquakes }: { earthquakes: Quake[] }) {
  // Four whole-magnitude bands turned every view into one tall bar beside
  // three empty ones — the shape of the distribution was invisible. Half-step
  // bins across the range actually recorded show where the events sit.
  const data = useMemo(() => {
    const mags = earthquakes.map((q) => q.properties.mag).filter(Number.isFinite);
    if (mags.length === 0) return [];

    const start = Math.floor(Math.min(...mags) / BIN_WIDTH) * BIN_WIDTH;
    const end = Math.floor(Math.max(...mags) / BIN_WIDTH) * BIN_WIDTH;
    const bins: { key: string; band: string; color: string; count: number }[] = [];

    for (let edge = start; edge <= end + 1e-9; edge += BIN_WIDTH) {
      const lower = Number(edge.toFixed(1));
      bins.push({
        key: lower.toFixed(1),
        band: bandLabel(lower),
        color: magnitudeColor(lower),
        count: mags.filter((m) => m >= lower && m < lower + BIN_WIDTH).length,
      });
    }
    return bins;
  }, [earthquakes]);

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <ChartFrame
      eyebrow="Magnitude distribution"
      caption={`${total} events over the last 7 days`}
    >
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 16, left: -12 }}>
            <CartesianGrid {...gridProps} />
            <XAxis
              dataKey="key"
              tick={axisTick}
              axisLine={axisLineProps}
              tickLine={false}
              interval="preserveStartEnd"
              label={{
                value: "MAGNITUDE",
                position: "insideBottom",
                offset: -2,
                style: axisLabel,
              }}
            />
            <YAxis
              allowDecimals={false}
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip cursor={cursorFill} content={<TooltipBox />} />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
              maxBarSize={64}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
