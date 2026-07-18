import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${today}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error("NASA APOD fetch failed");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("APOD API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch APOD" },
      { status: 500 }
    );
  }
}
