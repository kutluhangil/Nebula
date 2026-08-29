import { NextResponse } from "next/server";

// USGS accepts `time` (most recent first) and `magnitude` (largest first).
// These are genuinely different feeds: the dashboard list and the timeline are
// chronological, while "strongest events" views want magnitude order. Callers
// pick explicitly and the default is chronological, matching the UI copy.
const ORDER_BY = { time: "time", magnitude: "magnitude" } as const;
type OrderBy = keyof typeof ORDER_BY;

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("orderby") ?? "time";

  if (!(requested in ORDER_BY)) {
    return NextResponse.json(
      {
        error: `Invalid orderby "${requested}". Expected one of: ${Object.keys(
          ORDER_BY
        ).join(", ")}`,
      },
      { status: 400 }
    );
  }

  const orderby = ORDER_BY[requested as OrderBy];

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const res = await fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=4.0&starttime=${sevenDaysAgo}&orderby=${orderby}&limit=100`,
      { next: { revalidate: 600 } }
    );

    if (!res.ok) {
      throw new Error(`USGS request failed with status ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Earthquakes API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch earthquakes",
      },
      { status: 502 }
    );
  }
}
