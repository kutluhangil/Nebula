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

    const kpIndex =
      typeof body?.kpIndex === "number" && Number.isFinite(body.kpIndex)
        ? Math.max(0, Math.min(9, Math.round(body.kpIndex)))
        : null;
    const solarFlares =
      typeof body?.solarFlares === "number" && Number.isFinite(body.solarFlares)
        ? Math.max(0, Math.min(500, Math.round(body.solarFlares)))
        : null;
    const hazardousAsteroids =
      typeof body?.hazardousAsteroids === "number" && Number.isFinite(body.hazardousAsteroids)
        ? Math.max(0, Math.min(500, Math.round(body.hazardousAsteroids)))
        : null;
    const nextLaunchName =
      typeof body?.nextLaunchName === "string" && body.nextLaunchName.trim().length > 0
        ? body.nextLaunchName.trim().slice(0, 120)
        : null;
    const issLat =
      typeof body?.issLat === "string" && /^-?\d+(\.\d+)?$/.test(body.issLat)
        ? Number(body.issLat).toFixed(1)
        : null;
    const issLon =
      typeof body?.issLon === "string" && /^-?\d+(\.\d+)?$/.test(body.issLon)
        ? Number(body.issLon).toFixed(1)
        : null;
    const locale = body?.locale === "tr" ? "tr" : "en";

    const apiKey = process.env.OPENAI_API_KEY;

    // Fallback if no API key is provided
    if (!apiKey || apiKey === "your_openai_api_key_here") {
      const date = new Date().toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      });

      if (locale === "tr") {
        const quakeDesc =
          earthquakeCount > 30
            ? `Son 7 günde küresel ölçekte M4.0+ ${earthquakeCount} deprem kaydedildi; tektonik aktivite yüksek seyrediyor.`
            : earthquakeCount > 10
            ? `Bu hafta M4.0 üzeri ${earthquakeCount} deprem kaydedildi; sismik aktivite orta düzeyde.`
            : earthquakeCount > 0
            ? `Bu hafta yalnızca ${earthquakeCount} kayda değer deprem ölçüldü — sismik aktivite görece sakin.`
            : "Sismik izleme servisleri güncelleniyor.";

        const spaceParts: string[] = [];
        if (kpIndex !== null) {
          spaceParts.push(
            `Jeomanyetik aktivite Kp ${kpIndex} düzeyinde${solarFlares !== null ? `, bugün ${solarFlares} güneş parlaması gözlendi` : ""}`
          );
        }
        if (hazardousAsteroids !== null) {
          spaceParts.push(`${hazardousAsteroids} potansiyel tehlikeli asteroit yakını takip ediliyor`);
        }
        if (issLat !== null && issLon !== null) {
          spaceParts.push(`ISS şu anda ${issLat}°, ${issLon}° koordinatları üzerinde`);
        }
        if (nextLaunchName) {
          spaceParts.push(`sıradaki fırlatma: ${nextLaunchName}`);
        }

        const spaceLine =
          spaceParts.length > 0
            ? `${spaceParts.join("; ")}.`
            : "Uluslararası Uzay İstasyonu telemetrisi ve uzay havası panelleri anlık olarak izleniyor.";

        return NextResponse.json({
          report: `Gezegen İstihbarat Özeti — ${date}. ${quakeDesc} ${spaceLine}`,
        });
      }

      const quakeDesc =
        earthquakeCount > 30
          ? `${earthquakeCount} earthquakes magnitude 4.0+ were recorded in the past 7 days globally, indicating elevated seismic activity.`
          : earthquakeCount > 10
          ? `${earthquakeCount} earthquakes above magnitude 4.0 have been recorded this week, with tectonic activity remaining moderate.`
          : earthquakeCount > 0
          ? `Only ${earthquakeCount} notable earthquakes recorded this week — seismic activity is relatively calm.`
          : "Seismic monitoring services are currently updating. Check back shortly for earthquake data.";

      const spaceParts: string[] = [];
      if (kpIndex !== null) {
        spaceParts.push(
          `geomagnetic Kp stands at ${kpIndex}${solarFlares !== null ? ` with ${solarFlares} solar flare${solarFlares === 1 ? "" : "s"} today` : ""}`
        );
      }
      if (hazardousAsteroids !== null) {
        spaceParts.push(`${hazardousAsteroids} potentially hazardous NEO${hazardousAsteroids === 1 ? "" : "s"} tracked in the window`);
      }
      if (issLat !== null && issLon !== null) {
        spaceParts.push(`ISS ground position is ${issLat}°, ${issLon}°`);
      }
      if (nextLaunchName) {
        spaceParts.push(`next queued launch is ${nextLaunchName}`);
      }

      const spaceSentence =
        spaceParts.length > 0
          ? `Across space telemetry, ${spaceParts.join("; ")}.`
          : "International Space Station telemetry is reported live on the ISS Tracker panel, and solar weather is tracked separately on the Space Weather panel.";

      // Never invent nominal ISS altitude or velocity here.
      return NextResponse.json({
        report: `Planet Intelligence Report — ${date}. ${quakeDesc} ${spaceSentence}`,
      });
    }

    const facts: string[] = [`${earthquakeCount} notable earthquakes (M4.0+) in the last 7 days`];
    if (kpIndex !== null) facts.push(`geomagnetic Kp index ${kpIndex}`);
    if (solarFlares !== null) facts.push(`${solarFlares} C/M/X-class solar flares today`);
    if (hazardousAsteroids !== null) facts.push(`${hazardousAsteroids} potentially hazardous NEOs`);
    if (issLat !== null && issLon !== null) facts.push(`ISS coordinates ${issLat}°, ${issLon}°`);
    if (nextLaunchName) facts.push(`next launch ${nextLaunchName}`);

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
              `You are NEBULA, an editorial planet-intelligence science desk. Write in ${locale === "tr" ? "Turkish" : "English"}. Keep the briefing to 2-3 concise sentences in a measured, scientific journal tone. Use ONLY the numbers explicitly given to you; never state any unprovided altitude, velocity, orbit count, or statistic.`,
          },
          {
            role: "user",
            content: `Write a daily planetary briefing from these live measurements only: ${facts.join("; ")}.`,
          },
        ],
        temperature: 0.4,
        max_tokens: 180,
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
