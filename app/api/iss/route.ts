import { NextResponse } from "next/server";
import * as satellite from "satellite.js";
import { withTimeout, upstreamError } from "@/lib/upstream";

// wheretheiss.at reports measured altitude, velocity and eclipse state rather
// than the nominal figures this route used to hardcode. It also serves the
// current TLE, which /api/iss/passes propagates for pass prediction and this
// route propagates to draw the 90-minute orbital ground track.
const ISS_URL = "https://api.wheretheiss.at/v1/satellites/25544";
const ISS_TLE_URL = "https://api.wheretheiss.at/v1/satellites/25544/tles";

interface WhereTheIss {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: string;
  footprint: number;
  timestamp: number;
}

interface TrackPoint {
  lat: number;
  lon: number;
}

async function computeGroundTrack(anchorMs: number): Promise<TrackPoint[]> {
  try {
    const res = await fetch(
      ISS_TLE_URL,
      withTimeout({ next: { revalidate: 1800 } })
    );
    if (!res.ok) return [];
    const tle = (await res.json()) as { line1?: string; line2?: string };
    if (!tle.line1 || !tle.line2) return [];
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const points: TrackPoint[] = [];
    for (let offsetMin = -45; offsetMin <= 45; offsetMin += 3) {
      const at = new Date(anchorMs + offsetMin * 60_000);
      const pv = satellite.propagate(satrec, at);
      if (!pv || !pv.position || typeof pv.position === "boolean") continue;
      const geo = satellite.eciToGeodetic(pv.position, satellite.gstime(at));
      const lat = Math.round(satellite.degreesLat(geo.latitude) * 100) / 100;
      const lon = Math.round(satellite.degreesLong(geo.longitude) * 100) / 100;
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        points.push({ lat, lon });
      }
    }
    return points;
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const [res, groundTrack] = await Promise.all([
      fetch(ISS_URL, withTimeout({ next: { revalidate: 5 } })),
      computeGroundTrack(Date.now()),
    ]);

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
      groundTrack,
    });
  } catch (error) {
    console.error("ISS API error:", error);
    return NextResponse.json(
      {
        error: upstreamError("wheretheiss.at", error),
      },
      { status: 502 }
    );
  }
}
