import { NextResponse } from "next/server";

// NASA EONET aggregates natural event feeds (wildfire incident reporting,
// volcanic activity, storm tracking) into one key-free API. It backs the
// wildfire, volcano and storm layers on the Earth page.
const EONET_URL = "https://eonet.gsfc.nasa.gov/api/v3/events";

// Only the categories the Earth page actually renders. Anything else is
// rejected rather than proxied blindly.
const CATEGORIES = {
  wildfires: "Wildfires",
  volcanoes: "Volcanoes",
  severeStorms: "Severe Storms",
} as const;

type Category = keyof typeof CATEGORIES;

interface EonetGeometry {
  date: string;
  type: string;
  coordinates: number[];
  magnitudeValue?: number | null;
  magnitudeUnit?: string | null;
}

interface EonetEvent {
  id: string;
  title: string;
  description: string | null;
  link: string;
  categories: { id: string; title: string }[];
  sources: { id: string; url: string }[];
  geometry: EonetGeometry[];
}

interface MappedEvent {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  lat: number;
  lon: number;
  date: string;
  magnitude: number | null;
  magnitudeUnit: string | null;
  sourceUrl: string | null;
}

/**
 * EONET tracks moving events (storms) as a series of points. The most recent
 * geometry is the current position, so that is what the map plots.
 */
function latestPoint(geometry: EonetGeometry[]): EonetGeometry | null {
  const points = geometry.filter(
    (g) => g.type === "Point" && Array.isArray(g.coordinates)
  );
  if (!points.length) return null;
  return points.reduce((latest, g) =>
    Date.parse(g.date) > Date.parse(latest.date) ? g : latest
  );
}

function mapEvent(event: EonetEvent, category: Category): MappedEvent | null {
  const point = latestPoint(event.geometry);
  if (!point) return null;

  const [lon, lat] = point.coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    category,
    lat,
    lon,
    date: point.date,
    magnitude: point.magnitudeValue ?? null,
    magnitudeUnit: point.magnitudeUnit ?? null,
    sourceUrl: event.sources?.[0]?.url ?? event.link ?? null,
  };
}

export async function GET(request: Request) {
  const requested =
    new URL(request.url).searchParams.get("category") ?? "wildfires";

  if (!(requested in CATEGORIES)) {
    return NextResponse.json(
      {
        error: `Invalid category "${requested}". Expected one of: ${Object.keys(
          CATEGORIES
        ).join(", ")}`,
      },
      { status: 400 }
    );
  }

  const category = requested as Category;

  try {
    const res = await fetch(
      `${EONET_URL}?category=${category}&status=open&limit=100`,
      { next: { revalidate: 1800 } }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `NASA EONET responded ${res.status}: ${body.slice(0, 200)}`
      );
    }

    const data = await res.json();
    const events = (data.events ?? []) as EonetEvent[];

    return NextResponse.json({
      category,
      categoryTitle: CATEGORIES[category],
      events: events
        .map((event) => mapEvent(event, category))
        .filter((event): event is MappedEvent => event !== null)
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
      source: "NASA EONET",
    });
  } catch (error) {
    console.error("EONET API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch natural events",
      },
      { status: 502 }
    );
  }
}
