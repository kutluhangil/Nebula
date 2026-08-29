import { NextResponse } from "next/server";

// wheretheiss.at reports measured altitude, velocity and eclipse state rather
// than the nominal figures this route used to hardcode. It also serves the
// current TLE, which /api/iss/passes propagates for pass prediction.
const ISS_URL = "https://api.wheretheiss.at/v1/satellites/25544";

interface WhereTheIss {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: string;
  footprint: number;
  timestamp: number;
}

export async function GET() {
  try {
    const res = await fetch(ISS_URL, { next: { revalidate: 5 } });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `wheretheiss.at responded ${res.status}: ${body.slice(0, 200)}`
      );
    }

    const d = (await res.json()) as WhereTheIss;

    if (!Number.isFinite(d.latitude) || !Number.isFinite(d.longitude)) {
      throw new Error("ISS response contained no usable position");
    }

    return NextResponse.json({
      // Kept as strings under iss_position for the shape the UI already reads.
      iss_position: {
        latitude: String(d.latitude),
        longitude: String(d.longitude),
      },
      timestamp: d.timestamp,
      altitude: Math.round(d.altitude * 10) / 10,
      velocity: Math.round(d.velocity),
      // "daylight" | "eclipsed" — whether the station is currently sunlit.
      visibility: d.visibility,
      // Radius in km of the patch of Earth with the ISS above the horizon.
      footprint: Math.round(d.footprint),
    });
  } catch (error) {
    console.error("ISS API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch ISS position",
      },
      { status: 502 }
    );
  }
}
