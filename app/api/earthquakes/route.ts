import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const res = await fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=4.0&starttime=${sevenDaysAgo}&orderby=magnitude&limit=100`,
      { next: { revalidate: 600 } }
    );

    if (!res.ok) throw new Error("USGS fetch failed");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Earthquakes API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch earthquakes" },
      { status: 500 }
    );
  }
}
