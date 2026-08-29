import { NextResponse } from "next/server";

// Near-Earth objects from NASA NEO. Solar flares used to be read from NASA
// DONKI here, but that source is frequently unavailable and its failure took
// the (healthy) asteroid data down with it. Flares now come from NOAA SWPC via
// /api/solar, which is the same source the rest of the space weather panel uses.

interface Asteroid {
  id: string;
  name: string;
  is_potentially_hazardous_asteroid: boolean;
  estimated_diameter: {
    kilometers: { estimated_diameter_max: number };
  };
  close_approach_data: {
    relative_velocity: { kilometers_per_hour: string };
    miss_distance: { kilometers: string };
  }[];
}

export async function GET() {
  try {
    const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
    const today = new Date().toISOString().split("T")[0];

    const res = await fetch(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `NASA NEO responded ${res.status} using ${
          process.env.NASA_API_KEY ? "the configured NASA_API_KEY" : "DEMO_KEY"
        }: ${body.slice(0, 200)}`
      );
    }

    const neoData = await res.json();
    const asteroids = Object.values(
      neoData.near_earth_objects || {}
    ).flat() as Asteroid[];

    return NextResponse.json({
      // Hazardous objects first, then largest, so the card leads with the
      // events that matter. The previous comparator ignored its second
      // argument and so did not actually order the list.
      asteroids: [...asteroids]
        .sort((a, b) => {
          const hazard =
            Number(b.is_potentially_hazardous_asteroid) -
            Number(a.is_potentially_hazardous_asteroid);
          if (hazard !== 0) return hazard;
          return (
            b.estimated_diameter.kilometers.estimated_diameter_max -
            a.estimated_diameter.kilometers.estimated_diameter_max
          );
        })
        .slice(0, 10),
    });
  } catch (error) {
    console.error("Space data API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch space data",
      },
      { status: 502 }
    );
  }
}
