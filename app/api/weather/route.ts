import { NextResponse } from "next/server";
import { withTimeout, upstreamError } from "@/lib/upstream";

// Open-Meteo needs no API key. Coordinates come from the caller so the widget
// can show the viewer's own weather; without them it falls back to Cape
// Canaveral, which is labelled as such in the UI rather than passed off as
// local weather.
const DEFAULT_LOCATION = {
  lat: 28.5721,
  lon: -80.648,
  label: "Cape Canaveral",
};

function parseCoordinate(
  value: string | null,
  name: string,
  limit: number
): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || Math.abs(parsed) > limit) {
    throw new Error(
      `Invalid ${name} "${value}": expected a number between -${limit} and ${limit}`
    );
  }
  return parsed;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  let lat: number | null;
  let lon: number | null;
  try {
    lat = parseCoordinate(params.get("lat"), "lat", 90);
    lon = parseCoordinate(params.get("lon"), "lon", 180);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid coordinates" },
      { status: 400 }
    );
  }

  // Both or neither: a lone coordinate is a caller bug worth surfacing.
  if ((lat === null) !== (lon === null)) {
    return NextResponse.json(
      { error: "Provide both lat and lon, or neither" },
      { status: 400 }
    );
  }

  const isLocal = lat !== null && lon !== null;
  const latitude = isLocal ? lat : DEFAULT_LOCATION.lat;
  const longitude = isLocal ? lon : DEFAULT_LOCATION.lon;

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        "&current=temperature_2m,relative_humidity_2m,is_day,precipitation,wind_speed_10m" +
        "&daily=sunrise,sunset&timezone=auto",
      // A viewer-specific request must not be cached for everyone else.
      withTimeout(
        isLocal ? { cache: "no-store" } : { next: { revalidate: 3600 } }
      )
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Open-Meteo responded ${response.status}: ${body.slice(0, 200)}`
      );
    }

    const data = await response.json();

    return NextResponse.json({
      ...data,
      locationLabel: isLocal ? null : DEFAULT_LOCATION.label,
      isLocalLocation: isLocal,
    });
  } catch (error) {
    console.error("Weather API Error:", error);
    return NextResponse.json(
      {
        error: upstreamError("Open-Meteo", error),
      },
      { status: 502 }
    );
  }
}
