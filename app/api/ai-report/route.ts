import { NextResponse } from "next/server";
import { withTimeout, upstreamError } from "@/lib/upstream";

// This route can spend money once OPENAI_API_KEY is set, so it caps how often a
// single caller may reach the model. The counter lives in instance memory: it
// is not a distributed limit and a scaled-out deployment enforces it per
// instance, which is enough to stop a single client from looping on the
// endpoint. Move this to a shared store if the route ever needs a hard cap.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  entry.count += 1;
  return {
    allowed: entry.count <= RATE_LIMIT,
    retryAfter: Math.ceil((entry.resetAt - now) / 1000),
  };
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || "unknown";
}

export async function POST(request: Request) {
  const { allowed, retryAfter } = rateLimit(clientKey(request));
  if (!allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded: at most ${RATE_LIMIT} reports per minute. Retry in ${retryAfter}s.`,
      },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const earthquakeCount = body?.earthquakeCount;

    // The count is interpolated into the model prompt, so it has to be a plain
    // number rather than caller-controlled text.
    if (
      typeof earthquakeCount !== "number" ||
      !Number.isFinite(earthquakeCount) ||
      earthquakeCount < 0 ||
      earthquakeCount > 10000
    ) {
      return NextResponse.json(
        {
          error: `Invalid earthquakeCount: expected a number between 0 and 10000, received ${JSON.stringify(
            earthquakeCount
          )}`,
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // Fallback if no API key is provided
    if (!apiKey || apiKey === "your_openai_api_key_here") {
      const date = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      });

      const quakeDesc =
        earthquakeCount > 30
          ? `${earthquakeCount} earthquakes magnitude 4.0+ were recorded in the past 7 days globally, indicating elevated seismic activity.`
          : earthquakeCount > 10
          ? `${earthquakeCount} earthquakes above magnitude 4.0 have been recorded this week, with tectonic activity remaining moderate.`
          : earthquakeCount > 0
          ? `Only ${earthquakeCount} notable earthquakes recorded this week — seismic activity is relatively calm.`
          : "Seismic monitoring services are currently updating. Check back shortly for earthquake data.";

      return NextResponse.json({
        report: `Planet Intelligence Report — ${date}. ${quakeDesc} The International Space Station continues its orbit at a nominal 408km altitude, completing roughly 15.5 orbits per day at 27,600 km/h. Live solar weather is tracked separately on the Space Weather panel. Monitoring all Earth and space systems in real-time.`,
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      ...withTimeout(),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are NEBULA, a highly advanced Planet Intelligence AI. You generate concise, professional, and slightly futuristic daily planet reports. Keep the report to exactly 2-3 sentences. Focus on planetary status, recent data, and scientific tone.",
          },
          {
            role: "user",
            content: `Generate a daily planet report. We have recorded ${earthquakeCount} notable earthquakes recently. Mention orbital systems (like ISS) and general Earth metrics. Make it sound like a system briefing.`,
          },
        ],
        temperature: 0.5,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `OpenAI API responded ${response.status}: ${detail.slice(0, 200)}`
      );
    }

    const data = await response.json();
    const report = data.choices[0]?.message?.content?.trim();

    if (!report) {
      throw new Error("OpenAI API returned an empty report");
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("AI Report Error:", error);
    return NextResponse.json(
      {
        error: upstreamError("OpenAI", error),
      },
      { status: 502 }
    );
  }
}
