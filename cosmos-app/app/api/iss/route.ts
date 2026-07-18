import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.open-notify.org/iss-now.json", {
      next: { revalidate: 5 },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("ISS API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ISS position" },
      { status: 500 }
    );
  }
}
