import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
    const today = new Date().toISOString().split("T")[0];

    const [neoRes, solarRes] = await Promise.all([
      fetch(
        `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${apiKey}`,
        { next: { revalidate: 3600 } }
      ),
      fetch(
        `https://api.nasa.gov/DONKI/FLR?startDate=${today}&endDate=${today}&api_key=${apiKey}`,
        { next: { revalidate: 1800 } }
      ),
    ]);

    const neoData = await neoRes.json();
    const solarData = await solarRes.json();

    const asteroids = Object.values(
      neoData.near_earth_objects || {}
    ).flat() as {
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
    }[];

    return NextResponse.json({
      asteroids: asteroids
        .sort((a) => (a.is_potentially_hazardous_asteroid ? -1 : 1))
        .slice(0, 10),
      solarFlares: solarData || [],
    });
  } catch (error) {
    console.error("Space data API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch space data" },
      { status: 500 }
    );
  }
}
