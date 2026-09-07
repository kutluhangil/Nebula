/**
 * Astronomical quantities the sky widgets display.
 *
 * Everything here is computed from the date (and, where it changes the answer,
 * the viewer's latitude). Nothing is fetched, cached or curated, so these
 * numbers are as current as the clock. The moon series comes from `suncalc`,
 * an implementation of the Meeus algorithms; the Earth figures come from
 * published constants named beside each one.
 */

import { getMoonIllumination, getMoonPosition } from "suncalc";

/** Mean length of one synodic month, in days (new moon to new moon). */
const SYNODIC_MONTH_DAYS = 29.530588853;

/** Mean sidereal day: one rotation relative to the stars. IERS, in seconds. */
export const SIDEREAL_DAY_SECONDS = 86164.0905;

/** WGS84 semi-major axis, in kilometres. */
const WGS84_EQUATORIAL_RADIUS_KM = 6378.137;

/** WGS84 first eccentricity squared. */
const WGS84_ECCENTRICITY_SQUARED = 0.00669437999014;

const MOON_PHASE_NAMES = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent",
] as const;

export type MoonPhaseName = (typeof MOON_PHASE_NAMES)[number];

export interface MoonPhase {
  /** 0 at new moon, 0.5 at full moon, wrapping back to 1 at the next new moon. */
  phase: number;
  /** Fraction of the visible disc that is lit, 0 to 1. */
  illumination: number;
  name: MoonPhaseName;
  /** Days elapsed since the last new moon. */
  ageDays: number;
  /** Geocentric distance to the Moon, in kilometres. */
  distanceKm: number;
  waxing: boolean;
}

/** Guards against a non-finite result reaching the UI as a rendered value. */
function assertFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} is not a finite number: ${value}`);
  }
  return value;
}

export function moonPhase(date: Date): MoonPhase {
  const { phase, fraction } = getMoonIllumination(date);

  // suncalc's `distance` is geocentric — it is read straight off the lunar
  // position series and never touched by the observer coordinates — so the
  // zeroes here do not stand in for a location the viewer has not given.
  const { distance } = getMoonPosition(date, 0, 0);

  const index = Math.round(phase * 8) % 8;

  return {
    phase: assertFinite(phase, "Moon phase"),
    illumination: assertFinite(fraction, "Moon illuminated fraction"),
    name: MOON_PHASE_NAMES[index],
    ageDays: assertFinite(phase * SYNODIC_MONTH_DAYS, "Moon age"),
    distanceKm: assertFinite(distance, "Moon distance"),
    waxing: phase < 0.5,
  };
}

export interface EarthRotation {
  /** The latitude the surface speed was computed for, or null for the equator. */
  latitude: number | null;
  /** Speed of the ground at that latitude, in km/h. */
  surfaceSpeedKmh: number;
  /** Speed of the ground at the equator, in km/h. */
  equatorialSpeedKmh: number;
  siderealDaySeconds: number;
  /** Rotation completed since 00:00 UTC, measured against the stars. */
  degreesSinceUtcMidnight: number;
}

/**
 * Ground speed carried by Earth's rotation.
 *
 * The distance from the rotation axis is the prime vertical radius scaled by
 * the cosine of the latitude, not the sphere's own radius: on WGS84 the two
 * differ by enough (~0.3%) that using the sphere would show a number the
 * geodesy does not support.
 */
export function earthRotation(date: Date, latitude: number | null): EarthRotation {
  const equatorialSpeedKmh =
    (2 * Math.PI * WGS84_EQUATORIAL_RADIUS_KM * 3600) / SIDEREAL_DAY_SECONDS;

  const effectiveLatitude = latitude ?? 0;
  if (Math.abs(effectiveLatitude) > 90) {
    throw new Error(
      `Latitude ${latitude} is outside the -90..90 range required to compute a surface speed`
    );
  }

  const radians = (effectiveLatitude * Math.PI) / 180;
  const primeVerticalRadiusKm =
    WGS84_EQUATORIAL_RADIUS_KM /
    Math.sqrt(1 - WGS84_ECCENTRICITY_SQUARED * Math.sin(radians) ** 2);
  const axisDistanceKm = primeVerticalRadiusKm * Math.cos(radians);
  const surfaceSpeedKmh =
    (2 * Math.PI * axisDistanceKm * 3600) / SIDEREAL_DAY_SECONDS;

  const secondsSinceUtcMidnight =
    date.getUTCHours() * 3600 +
    date.getUTCMinutes() * 60 +
    date.getUTCSeconds() +
    date.getUTCMilliseconds() / 1000;

  return {
    latitude,
    surfaceSpeedKmh: assertFinite(surfaceSpeedKmh, "Surface speed"),
    equatorialSpeedKmh: assertFinite(equatorialSpeedKmh, "Equatorial speed"),
    siderealDaySeconds: SIDEREAL_DAY_SECONDS,
    degreesSinceUtcMidnight: assertFinite(
      (secondsSinceUtcMidnight / SIDEREAL_DAY_SECONDS) * 360,
      "Rotation since UTC midnight"
    ),
  };
}

/** Coarse step for the phase search, well under half a synodic month. */
const PHASE_SEARCH_STEP_MS = 6 * 60 * 60 * 1000;

/** Bisection depth: 40 halvings of a 6-hour window land inside a millisecond. */
const PHASE_SEARCH_REFINEMENTS = 40;

/**
 * Signed distance from the moon's phase at `date` to `target`, wrapped into
 * [-0.5, 0.5) so the cycle's seam does not read as a jump.
 */
function phaseOffset(date: Date, target: number): number {
  const { phase } = getMoonIllumination(date);
  return ((((phase - target) % 1) + 1.5) % 1) - 0.5;
}

/**
 * The next time the moon reaches `targetPhase` (0 for new, 0.5 for full).
 *
 * The phase advances monotonically, so the instant is the point where the
 * offset crosses from negative to positive. Stepping six hours at a time finds
 * the crossing interval, then bisection narrows it; a closed-form solution
 * would need the full lunar theory this deliberately does not carry.
 */
export function nextMoonPhase(date: Date, targetPhase: number): Date {
  let low = date.getTime();
  let previousOffset = phaseOffset(new Date(low), targetPhase);

  // One synodic month plus a margin is enough to contain any crossing.
  const limit = low + 31 * 24 * 60 * 60 * 1000;

  for (let t = low + PHASE_SEARCH_STEP_MS; t <= limit; t += PHASE_SEARCH_STEP_MS) {
    const offset = phaseOffset(new Date(t), targetPhase);

    if (previousOffset < 0 && offset >= 0) {
      let high = t;
      for (let i = 0; i < PHASE_SEARCH_REFINEMENTS; i++) {
        const middle = (low + high) / 2;
        if (phaseOffset(new Date(middle), targetPhase) < 0) {
          low = middle;
        } else {
          high = middle;
        }
      }
      return new Date(high);
    }

    low = t;
    previousOffset = offset;
  }

  throw new Error(
    `No phase ${targetPhase} found within 31 days of ${date.toISOString()}`
  );
}
