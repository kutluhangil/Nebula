import { NextResponse } from "next/server";
import { withTimeout, upstreamError } from "@/lib/upstream";

/**
 * The current precipitation radar frame.
 *
 * RainViewer publishes an index of frames whose paths rotate every ten
 * minutes, so a tile url cannot be hardcoded in the map — it has to be read
 * first. The index is fetched here rather than from the browser for the same
 * reason NOAA is: this app reads its upstreams server-side, so one CORS policy
 * change cannot blank a layer.
 */
const INDEX_URL = "https://api.rainviewer.com/public/weather-maps.json";

export const SOURCE = "RainViewer";

interface RadarFrame {
  time: number;
  path: string;
}

interface RadarIndex {
  host?: string;
  radar?: { past?: RadarFrame[]; nowcast?: RadarFrame[] };
}

export async function GET() {
  try {
    const res = await fetch(INDEX_URL, withTimeout({ next: { revalidate: 300 } }));

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `RainViewer index responded ${res.status}: ${body.slice(0, 200)}`
      );
    }

    const index = (await res.json()) as RadarIndex;
    const past = index.radar?.past ?? [];
    const latest = past[past.length - 1];

    if (!index.host || !latest?.path) {
      throw new Error("RainViewer index carried no radar frame");
    }

    return NextResponse.json({
      // The map appends /{size}/{z}/{x}/{y}/{scheme}/{options}.png to this.
      tileBase: `${index.host}${latest.path}`,
      observedAt: new Date(latest.time * 1000).toISOString(),
      source: SOURCE,
    });
  } catch (error) {
    console.error("Radar API error:", error);
    return NextResponse.json(
      { error: upstreamError("RainViewer", error) },
      { status: 502 }
    );
  }
}
