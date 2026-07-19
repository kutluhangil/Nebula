"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Quake {
  properties: { mag: number };
}

// Ordinal severity bands — colors match the seismic map legend so the two
// visualizations read as one scale.
const BANDS = [
  { key: "M4–5", min: 4, max: 5, color: "#10b981" },
  { key: "M5–6", min: 5, max: 6, color: "#f59e0b" },
  { key: "M6–7", min: 6, max: 7, color: "#f97316" },
  { key: "M7+", min: 7, max: Infinity, color: "#ef4444" },
];

function TooltipBox({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elev)] px-3 py-2 shadow-[var(--panel-shadow)]">
      <div className="font-mono text-xs text-[var(--text-dim)]">
        Magnitude {label}
      </div>
      <div className="font-mono text-lg text-[var(--text)]">
        {payload[0].value}
        <span className="text-[var(--text-faint)] text-xs ml-1">events</span>
      </div>
    </div>
  );
}

export function MagnitudeChart({ earthquakes }: { earthquakes: Quake[] }) {
  const data = useMemo(
    () =>
      BANDS.map((b) => ({
        key: b.key,
        color: b.color,
        count: earthquakes.filter(
          (q) => q.properties.mag >= b.min && q.properties.mag < b.max
        ).length,
      })),
    [earthquakes]
  );

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="glass-card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="eyebrow mb-1">Magnitude distribution</div>
          <div className="text-[var(--text-dim)] text-sm">
            {total} events over the last 7 days
          </div>
        </div>
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="key"
              tick={{ fill: "var(--text-faint)", fontSize: 12, fontFamily: "var(--font-mono)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--text-faint)", fontSize: 11, fontFamily: "var(--font-mono)" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ fill: "var(--surface-hover)" }}
              content={<TooltipBox />}
            />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reduce}
              maxBarSize={64}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
