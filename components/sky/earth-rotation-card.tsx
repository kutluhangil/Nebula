"use client";

import { Globe2, MapPin } from "lucide-react";
import { earthRotation, SIDEREAL_DAY_SECONDS } from "@/lib/astronomy";
import { useLocation } from "@/hooks/use-location";
import { useNow } from "@/hooks/use-now";
import { SkyCard } from "@/components/sky/sky-card";

/** 86164.0905 s as h/m/s, for the line that explains the sidereal day. */
function siderealDayLabel(): string {
  const hours = Math.floor(SIDEREAL_DAY_SECONDS / 3600);
  const minutes = Math.floor((SIDEREAL_DAY_SECONDS % 3600) / 60);
  const seconds = SIDEREAL_DAY_SECONDS % 60;
  return `${hours}h ${minutes}m ${seconds.toFixed(4)}s`;
}

export function EarthRotationCard() {
  const now = useNow();
  const { coords, status, request } = useLocation();

  return (
    <SkyCard
      title="Earth Rotation"
      icon={Globe2}
      kind="computed"
      source="WGS84 ellipsoid parameters and the IERS mean sidereal day"
    >
      {now === null ? (
        <div className="h-52 skeleton rounded-[var(--r-md)]" aria-busy="true" />
      ) : (
        <RotationReadout
          date={new Date(now)}
          latitude={coords?.lat ?? null}
          locating={status === "prompting"}
          canAsk={status === "idle"}
          onRequestLocation={request}
        />
      )}
    </SkyCard>
  );
}

function RotationReadout({
  date,
  latitude,
  locating,
  canAsk,
  onRequestLocation,
}: {
  date: Date;
  latitude: number | null;
  locating: boolean;
  canAsk: boolean;
  onRequestLocation: () => void;
}) {
  const { surfaceSpeedKmh, degreesSinceUtcMidnight } = earthRotation(
    date,
    latitude
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="display-2 text-[var(--text)] tabular">
            {Math.round(surfaceSpeedKmh).toLocaleString("en-US")}
          </span>
          <span className="text-[var(--text-dim)] text-sm">km/h</span>
        </div>
        <p className="text-[var(--text-dim)] text-sm mt-1.5">
          {latitude === null ? (
            <>Ground speed at the equator</>
          ) : (
            <>
              Ground speed at {Math.abs(latitude).toFixed(2)}°
              {latitude >= 0 ? "N" : "S"}
            </>
          )}
        </p>
      </div>

      {/* Without a latitude the card states the equatorial figure and says so.
          It never assumes a location the viewer has not offered. */}
      {latitude === null && (
        <div className="text-xs text-[var(--text-faint)]">
          {locating ? (
            "Locating…"
          ) : canAsk ? (
            <button
              onClick={onRequestLocation}
              className="inline-flex items-center gap-1.5 hover:text-[var(--text-dim)] transition-colors tap"
            >
              <MapPin className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
              <span className="underline underline-offset-2 decoration-dotted">
                Show the speed at my latitude
              </span>
            </button>
          ) : (
            "Location unavailable, so the equatorial figure is shown."
          )}
        </div>
      )}

      <dl className="grid grid-cols-1 gap-3">
        <Row label="Sidereal day" value={siderealDayLabel()} />
        <Row
          label="Turned since 00:00 UTC"
          value={`${degreesSinceUtcMidnight.toFixed(2)}°`}
        />
      </dl>

      <p className="text-[var(--text-faint)] text-xs leading-relaxed">
        One rotation against the stars takes about 3 minutes 56 seconds less
        than a solar day, because Earth also moves along its orbit.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="inset-well px-3.5 py-3 flex items-center justify-between gap-3">
      <dt className="eyebrow">{label}</dt>
      <dd className="text-[var(--text)] text-sm font-mono tabular">{value}</dd>
    </div>
  );
}
