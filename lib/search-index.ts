import { PLANETS } from "@/lib/sky-data";

/**
 * The entity groups universal search covers, and the feed each one is built
 * from. A group exists here only if the app already holds real records for it;
 * nothing is invented to fill a category the specification names.
 */
export type SearchGroup =
  | "Missions"
  | "Rockets"
  | "Planets"
  | "Astronauts"
  | "Asteroids"
  | "Earthquakes";

export interface SearchEntry {
  id: string;
  group: SearchGroup;
  label: string;
  /** The measured detail under the label. Never a decoration — always a fact from the feed. */
  detail: string;
  /** Extra terms cmdk matches against, beyond the label and detail. */
  keywords: string;
  href: string;
  /** True when the destination leaves the app, so the UI can say so before it opens. */
  external?: boolean;
}

export interface LaunchRecord {
  id: string;
  name: string;
  date_utc: string;
  rocket: string;
  launchpad: string;
}

export interface AsteroidRecord {
  id: string;
  name: string;
  is_potentially_hazardous_asteroid: boolean;
  estimated_diameter: { kilometers: { estimated_diameter_max: number } };
  close_approach_data: { miss_distance: { kilometers: string } }[];
}

export interface EarthquakeRecord {
  id: string;
  properties: { mag: number; place: string; time: number };
}

export interface AstronautRecord {
  id: string;
  name: string;
  country: string | null;
  agency: string | null;
  position: string | null;
  spacecraft: string | null;
  daysInSpace: number | null;
  url: string | null;
}

const utcDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const km = (value: number) => `${Math.round(value).toLocaleString("en-US")} km`;

export function buildLaunchEntries(launches: LaunchRecord[]): SearchEntry[] {
  return launches.map((launch) => ({
    id: `mission-${launch.id}`,
    group: "Missions",
    label: launch.name,
    detail: [utcDate(launch.date_utc), launch.rocket, launch.launchpad]
      .filter(Boolean)
      .join(" · "),
    // Deliberately generic: naming a specific rocket here would make every
    // mission match a search for that rocket.
    keywords: "launch mission spacex",
    href: "/launches",
  }));
}

/**
 * Rockets are derived from the launches the app holds rather than fetched
 * separately, so the count under each name is a fact about this feed and says
 * so. Launch Library throttles anonymous callers hard; a second query for a
 * list the app already implies would spend that quota for nothing.
 */
export function buildRocketEntries(launches: LaunchRecord[]): SearchEntry[] {
  const counts = new Map<string, number>();
  for (const launch of launches) {
    if (!launch.rocket) continue;
    counts.set(launch.rocket, (counts.get(launch.rocket) ?? 0) + 1);
  }

  return [...counts.entries()].map(([rocket, count]) => ({
    id: `rocket-${rocket}`,
    group: "Rockets",
    label: rocket,
    detail: `${count} of ${launches.length} launches on the current board`,
    keywords: "rocket vehicle booster spacex",
    href: "/launches",
  }));
}

export function buildPlanetEntries(): SearchEntry[] {
  return PLANETS.map((planet) => ({
    id: `planet-${planet.name}`,
    group: "Planets",
    label: planet.name,
    detail: `${km(planet.diameterKm)} across · ${planet.moons} ${
      planet.moons === 1 ? "moon" : "moons"
    } · ${planet.yearLengthDays} day year`,
    keywords: "planet solar system nasa fact sheet",
    href: "/sky",
  }));
}

export function buildAstronautEntries(people: AstronautRecord[]): SearchEntry[] {
  return people.map((person) => ({
    id: `astronaut-${person.id}`,
    group: "Astronauts" as const,
    label: person.name,
    detail: [
      person.agency,
      person.spacecraft,
      person.daysInSpace === null ? null : `${person.daysInSpace} days in space`,
    ]
      .filter(Boolean)
      .join(" · "),
    keywords: `astronaut crew ${person.country ?? ""} ${person.position ?? ""}`,
    // The app has no astronaut page, so the destination is the reference the
    // roster itself points at. Entries without one are dropped rather than
    // linked somewhere they do not belong.
    href: person.url ?? "",
    external: true,
  })).filter((entry) => entry.href !== "");
}

export function buildAsteroidEntries(asteroids: AsteroidRecord[]): SearchEntry[] {
  return asteroids.map((asteroid) => {
    const missKm = Number(
      asteroid.close_approach_data[0]?.miss_distance.kilometers
    );
    const diameterKm =
      asteroid.estimated_diameter.kilometers.estimated_diameter_max;

    return {
      id: `asteroid-${asteroid.id}`,
      group: "Asteroids" as const,
      label: asteroid.name,
      detail: [
        `up to ${diameterKm < 1 ? `${Math.round(diameterKm * 1000)} m` : km(diameterKm)} across`,
        Number.isFinite(missKm) ? `misses by ${km(missKm)}` : null,
        asteroid.is_potentially_hazardous_asteroid ? "flagged hazardous" : null,
      ]
        .filter(Boolean)
        .join(" · "),
      // "hazardous" stays out: it belongs to the flagged objects' detail, and
      // repeating it here would match every asteroid on the board.
      keywords: "asteroid neo near earth object nasa",
      href: "/space",
    };
  });
}

export function buildEarthquakeEntries(
  quakes: EarthquakeRecord[]
): SearchEntry[] {
  return quakes.map((quake) => ({
    id: `quake-${quake.id}`,
    group: "Earthquakes",
    label: quake.properties.place || "Unnamed event",
    detail: `M${quake.properties.mag?.toFixed(1) ?? "—"} · ${utcDate(
      new Date(quake.properties.time).toISOString()
    )}`,
    keywords: "earthquake quake seismic usgs magnitude",
    href: "/earth",
  }));
}
