import { NextResponse } from "next/server";
import * as satellite from "satellite.js";

// Next visible ISS passes for an observer, propagated from the live TLE with
// SGP4. A pass counts as *visible* only when the station is above the horizon,
// sunlit, and the observer is in darkness — the same three conditions any
// sighting guide uses. Passes that clear the horizon but fail the lighting
// tests are reported too, flagged as not visible.
const TLE_URL = "https://api.wheretheiss.at/v1/satellites/25544/tles";

const STEP_SECONDS = 30;
const SEARCH_HOURS = 48;
const MIN_PEAK_ELEVATION_DEG = 10;
// The sun this far below the horizon leaves the sky dark enough to see the
// station. This is the standard civil/nautical twilight boundary used for
// sighting predictions.
const OBSERVER_DARK_SUN_ELEVATION_DEG = -6;

interface Sample {
  date: Date;
  elevation: number;
  azimuth: number;
  sunlit: boolean;
  observerDark: boolean;
}

interface Pass {
  start: string;
  peak: string;
  end: string;
  durationSeconds: number;
  peakElevation: number;
  startAzimuth: number;
  endAzimuth: number;
  visible: boolean;
}

const degrees = (radians: number) => (radians * 180) / Math.PI;

/**
 * Solar elevation at the observer, from the sun's ECI position. Used to decide
 * whether the observer's sky is dark.
 */
function sunElevationDeg(
  date: Date,
  observerGd: satellite.GeodeticLocation
): number {
  const gmst = satellite.gstime(date);
  const sunEci = sunPositionEci(date);
  const look = satellite.ecfToLookAngles(
    observerGd,
    satellite.eciToEcf(sunEci, gmst)
  );
  return degrees(look.elevation);
}

/**
 * Low-precision solar position in ECI kilometres. Accurate to well under a
 * degree, which is far finer than the twilight threshold this feeds.
 */
function sunPositionEci(date: Date): satellite.EciVec3<number> {
  const julian = date.getTime() / 86400000 + 2440587.5;
  const n = julian - 2451545.0;
  const meanLongitude = ((280.46 + 0.9856474 * n) % 360) * (Math.PI / 180);
  const meanAnomaly = ((357.528 + 0.9856003 * n) % 360) * (Math.PI / 180);
  const eclipticLongitude =
    meanLongitude +
    (1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) *
      (Math.PI / 180);
  const obliquity = 23.439 * (Math.PI / 180);
  const distanceKm = 149597870.7;

  return {
    x: distanceKm * Math.cos(eclipticLongitude),
    y: distanceKm * Math.sin(eclipticLongitude) * Math.cos(obliquity),
    z: distanceKm * Math.sin(eclipticLongitude) * Math.sin(obliquity),
  };
}

/**
 * Whether the station itself is in sunlight: it is sunlit unless it sits
 * inside Earth's shadow cylinder on the anti-solar side.
 */
function isSatelliteSunlit(
  satEci: satellite.EciVec3<number>,
  sunEci: satellite.EciVec3<number>
): boolean {
  const earthRadiusKm = 6378.137;
  const sunMagnitude = Math.hypot(sunEci.x, sunEci.y, sunEci.z);
  const sunUnit = {
    x: sunEci.x / sunMagnitude,
    y: sunEci.y / sunMagnitude,
    z: sunEci.z / sunMagnitude,
  };

  const alongSun =
    satEci.x * sunUnit.x + satEci.y * sunUnit.y + satEci.z * sunUnit.z;

  // On the sunward side of Earth the station is always lit.
  if (alongSun > 0) return true;

  // Otherwise it is lit only if it lies outside the shadow cylinder.
  const perpendicular = Math.hypot(
    satEci.x - alongSun * sunUnit.x,
    satEci.y - alongSun * sunUnit.y,
    satEci.z - alongSun * sunUnit.z
  );
  return perpendicular > earthRadiusKm;
}

function parseCoordinate(
  value: string | null,
  name: string,
  limit: number
): number {
  if (value === null) {
    throw new Error(`Missing required query parameter "${name}"`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || Math.abs(parsed) > limit) {
    throw new Error(
      `Invalid ${name} "${value}": expected a number between -${limit} and ${limit}`
    );
  }
  return parsed;
}

/** Walks the samples and closes off a pass each time the ISS sets. */
function collectPasses(samples: Sample[]): Pass[] {
  const passes: Pass[] = [];
  let current: Sample[] = [];

  const close = () => {
    if (!current.length) return;
    const peak = current.reduce((a, b) => (b.elevation > a.elevation ? b : a));
    if (peak.elevation >= MIN_PEAK_ELEVATION_DEG) {
      const first = current[0];
      const last = current[current.length - 1];
      passes.push({
        start: first.date.toISOString(),
        peak: peak.date.toISOString(),
        end: last.date.toISOString(),
        durationSeconds: Math.round(
          (last.date.getTime() - first.date.getTime()) / 1000
        ),
        peakElevation: Math.round(peak.elevation),
        startAzimuth: Math.round(first.azimuth),
        endAzimuth: Math.round(last.azimuth),
        // A pass is only worth going outside for if the station is lit while
        // the observer's sky is dark, at the moment it is highest.
        visible: peak.sunlit && peak.observerDark,
      });
    }
    current = [];
  };

  for (const sample of samples) {
    if (sample.elevation > 0) current.push(sample);
    else close();
  }
  close();

  return passes;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  let lat: number;
  let lon: number;
  try {
    lat = parseCoordinate(params.get("lat"), "lat", 90);
    lon = parseCoordinate(params.get("lon"), "lon", 180);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid coordinates" },
      { status: 400 }
    );
  }

  try {
    // The TLE is refreshed a few times a day upstream; an hour of caching keeps
    // predictions current without refetching per request.
    const res = await fetch(TLE_URL, { next: { revalidate: 3600 } });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `ISS TLE request responded ${res.status}: ${body.slice(0, 200)}`
      );
    }

    const tle = await res.json();
    if (!tle?.line1 || !tle?.line2) {
      throw new Error("ISS TLE response was missing line1/line2");
    }

    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const observerGd: satellite.GeodeticLocation = {
      latitude: satellite.degreesToRadians(lat),
      longitude: satellite.degreesToRadians(lon),
      height: 0,
    };

    const samples: Sample[] = [];
    const start = Date.now();
    const steps = (SEARCH_HOURS * 3600) / STEP_SECONDS;

    for (let i = 0; i < steps; i++) {
      const date = new Date(start + i * STEP_SECONDS * 1000);
      const propagated = satellite.propagate(satrec, date);
      if (!propagated?.position) continue;

      const gmst = satellite.gstime(date);
      const look = satellite.ecfToLookAngles(
        observerGd,
        satellite.eciToEcf(propagated.position, gmst)
      );

      const elevation = degrees(look.elevation);
      // Lighting only matters while the station is up; skip the trigonometry
      // for the long stretches when it is below the horizon.
      if (elevation <= 0) {
        samples.push({
          date,
          elevation,
          azimuth: degrees(look.azimuth),
          sunlit: false,
          observerDark: false,
        });
        continue;
      }

      samples.push({
        date,
        elevation,
        azimuth: degrees(look.azimuth),
        sunlit: isSatelliteSunlit(propagated.position, sunPositionEci(date)),
        observerDark:
          sunElevationDeg(date, observerGd) < OBSERVER_DARK_SUN_ELEVATION_DEG,
      });
    }

    const passes = collectPasses(samples);

    return NextResponse.json({
      observer: { lat, lon },
      tleTimestamp: tle.tle_timestamp ?? null,
      searchHours: SEARCH_HOURS,
      passes: passes.slice(0, 10),
      nextVisible: passes.find((pass) => pass.visible) ?? null,
    });
  } catch (error) {
    console.error("ISS passes API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to compute ISS passes",
      },
      { status: 502 }
    );
  }
}
