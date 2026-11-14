import { NextResponse } from "next/server";
import { withTimeout, upstreamError } from "@/lib/upstream";

const MIN_APOD_DATE = "1995-06-16";

export async function GET(request: Request) {
  const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";

  try {
    const today = new Date().toISOString().split("T")[0];
    const requested = new URL(request.url).searchParams.get("date");
    let targetDate = today;

    if (requested !== null) {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(requested) ||
        requested > today ||
        requested < MIN_APOD_DATE
      ) {
        return NextResponse.json(
          { error: `Invalid APOD date: expected YYYY-MM-DD between ${MIN_APOD_DATE} and ${today}` },
          { status: 400 }
        );
      }
      targetDate = requested;
    }

    const res = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${targetDate}&thumbs=true`,
      withTimeout({ next: { revalidate: 3600 } })
    );

    if (!res.ok) {
      // DEMO_KEY is rate limited to 30 requests/hour/IP, which surfaces as 429.
      // Naming the key in use makes the difference obvious in logs.
      const body = await res.text().catch(() => "");
      throw new Error(
        `NASA APOD responded ${res.status} using ${
          process.env.NASA_API_KEY ? "the configured NASA_API_KEY" : "DEMO_KEY"
        }: ${body.slice(0, 200)}`
      );
    }

    const data = await res.json();

    if (!data?.url) {
      throw new Error("NASA APOD response contained no image url");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("APOD API error:", error);
    return NextResponse.json(
      {
        error: upstreamError("NASA APOD", error),
      },
      { status: 502 }
    );
  }
}
