import { NextResponse } from "next/server";
import { withTimeout, upstreamError } from "@/lib/upstream";

export async function GET() {
  const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";

  try {
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${today}`,
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
