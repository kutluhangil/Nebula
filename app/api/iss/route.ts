import { NextResponse } from "next/server";

// open-notify serves live ISS position over HTTP (its HTTPS endpoint is
// currently broken). This is a server-side fetch, so there is no mixed-content
// concern. Altitude and orbital velocity are the ISS's near-constant nominal
// figures — open-notify only reports position.
export async function GET() {
  try {
    const res = await fetch("http://api.open-notify.org/iss-now.json", {
      next: { revalidate: 5 },
    });
    if (!res.ok) {
      throw new Error(`open-notify request failed with status ${res.status}`);
    }
    const d = await res.json();

    return NextResponse.json({
      iss_position: d.iss_position,
      timestamp: d.timestamp,
      altitude: 408, // km — nominal orbital altitude
      velocity: 27600, // km/h — nominal orbital velocity
    });
  } catch (error) {
    console.error("ISS API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ISS position" },
      { status: 500 }
    );
  }
}
