"use client";

import { useQuery } from "@tanstack/react-query";
import { Thermometer } from "lucide-react";
import { format } from "date-fns";
import { fetchJson } from "@/lib/api-client";
import { FeedError } from "@/components/ui/feed-state";
import { SkyCard } from "@/components/sky/sky-card";

interface Range {
  average: number;
  min: number;
  max: number;
}

interface MarsWeather {
  sol: number;
  firstUtc: string | null;
  lastUtc: string | null;
  season: string | null;
  northernSeason: string | null;
  temperatureC: Range | null;
  pressurePa: Range | null;
  windSpeedMs: Range | null;
  archival: true;
  missionEndedOn: string;
  source: string;
}

function utcDay(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : format(parsed, "d MMMM yyyy");
}

export function MarsWeatherCard() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery<MarsWeather>({
      queryKey: ["mars"],
      queryFn: () => fetchJson("/api/mars"),
      // The archive does not change; there is nothing to poll for.
      staleTime: Infinity,
    });

  const measuredOn = utcDay(data?.firstUtc ?? null);

  return (
    <SkyCard
      title="Mars Weather"
      icon={Thermometer}
      kind="archive"
      source={
        data
          ? `${data.source}. The lander fell silent and the mission ended on ${format(
              new Date(data.missionEndedOn),
              "d MMMM yyyy"
            )}; this feed has served the same final window ever since.`
          : "NASA InSight lander, Elysium Planitia — mission ended December 2022"
      }
    >
      {isLoading ? (
        <div className="h-52 skeleton rounded-[var(--r-md)]" aria-busy="true" />
      ) : isError || !data ? (
        <FeedError
          title="Mars weather is unavailable right now."
          error={error}
          icon={Thermometer}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* The reading is years old. The headline says which sol and which
              date before it says any number, so it cannot be mistaken for the
              weather on Mars today. */}
          <div>
            <div className="eyebrow">
              Sol {data.sol.toLocaleString("en-US")}
              {measuredOn ? ` · ${measuredOn}` : ""}
            </div>
            {data.temperatureC && (
              <div className="flex items-baseline gap-2 mt-2">
                <span className="display-2 text-[var(--text)] tabular">
                  {data.temperatureC.average.toFixed(1)}
                </span>
                <span className="text-[var(--text-dim)] text-sm">°C average</span>
              </div>
            )}
          </div>

          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.temperatureC && (
              <Cell
                label="Temperature"
                value={`${data.temperatureC.min.toFixed(1)} to ${data.temperatureC.max.toFixed(1)} °C`}
              />
            )}
            {data.pressurePa && (
              <Cell
                label="Pressure"
                value={`${data.pressurePa.average.toFixed(0)} Pa`}
              />
            )}
            {data.windSpeedMs && (
              <Cell
                label="Wind"
                value={`${data.windSpeedMs.average.toFixed(1)} m/s`}
              />
            )}
            {data.northernSeason && (
              <Cell
                label="Northern season"
                value={data.northernSeason}
                capitalize
              />
            )}
          </dl>
        </div>
      )}
    </SkyCard>
  );
}

/**
 * `capitalize` is opt-in: applied to the whole grid it rewrote units and
 * connectives, turning "-95.4 to -4.4 °C" into "To" and "m/s" into "M/S".
 */
function Cell({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="inset-well px-3.5 py-3">
      <dt className="eyebrow">{label}</dt>
      <dd
        className={`text-[var(--text)] text-sm font-mono mt-1.5 tabular ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
