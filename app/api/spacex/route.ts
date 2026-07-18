import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [latestRes, upcomingRes] = await Promise.all([
      fetch("https://api.spacexdata.com/v5/launches/latest", {
        next: { revalidate: 3600 },
      }),
      fetch("https://api.spacexdata.com/v5/launches/upcoming", {
        next: { revalidate: 3600 },
      }),
    ]);

    const latest = await latestRes.json();
    const upcoming = await upcomingRes.json();

    // Sort upcoming by date
    const sortedUpcoming = upcoming
      .filter((l: { date_utc: string }) => l.date_utc)
      .sort(
        (a: { date_utc: string }, b: { date_utc: string }) =>
          new Date(a.date_utc).getTime() - new Date(b.date_utc).getTime()
      )
      .slice(0, 5);

    return NextResponse.json({ latest, upcoming: sortedUpcoming });
  } catch (error) {
    console.error("SpaceX API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SpaceX data" },
      { status: 500 }
    );
  }
}
