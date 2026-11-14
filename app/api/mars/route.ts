import { NextResponse } from "next/server";
import { withTimeout, upstreamError } from "@/lib/upstream";

/**
 * Mars surface weather from the InSight lander.
 *
 * This feed is archival, not live. InSight's mission ended in December 2022
 * and the endpoint has served the same final window ever since — the most
 * recent sol it returns is from October 2020. The route says so in its own
 * payload (`archival`, `missionEndedOn`) so the card cannot present these
 * readings as current conditions. The only other public Mars weather source,
 * the third-party MAAS2 mirror of Curiosity's REMS data, is frozen at
 * February 2023 and is no better.
 */

const MISSION_ENDED_ON = "2022-12-21";

interface SolMeasurement {
  av: number;
  mn: number;
  mx: number;
  ct: number;
}

interface SolReport {
  AT?: SolMeasurement;
  PRE?: SolMeasurement;
  HWS?: SolMeasurement;
  First_UTC?: string;
  Last_UTC?: string;
  Season?: string;
  Northern_season?: string;
  Southern_season?: string;
}

interface InsightPayload {
  sol_keys?: string[];
  [sol: string]: SolReport | string[] | undefined;
}

interface MslSol {
  sol?: string;
  terrestrial_date?: string;
  min_temp?: string;
  max_temp?: string;
  pressure?: string;
  atmo_opacity?: string;
  sunrise?: string;
  sunset?: string;
  local_uv_irradiance_index?: string;
}

interface Mars2020Image {
  sol?: number;
  date_taken_utc?: string;
  title?: string;
  camera?: { instrument?: string };
  image_files?: { medium?: string; small?: string };
}

function parseNum(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function fetchCuriosityWeather() {
  try {
    const res = await fetch(
      "https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json",
      withTimeout({ next: { revalidate: 3600 } })
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { soles?: MslSol[] };
    const latest = data.soles?.find(
      (s) => parseNum(s.min_temp) !== null || parseNum(s.max_temp) !== null || parseNum(s.pressure) !== null
    ) ?? data.soles?.[0];
    if (!latest) return null;
    return {
      sol: parseNum(latest.sol),
      terrestrialDate: latest.terrestrial_date ?? null,
      minTempC: parseNum(latest.min_temp),
      maxTempC: parseNum(latest.max_temp),
      pressurePa: parseNum(latest.pressure),
      atmoOpacity: latest.atmo_opacity ?? null,
      uvIndex: latest.local_uv_irradiance_index ?? null,
      sunrise: latest.sunrise ?? null,
      sunset: latest.sunset ?? null,
      source: "NASA Curiosity (REMS), Gale Crater",
    };
  } catch {
    return null;
  }
}

async function fetchPerseverancePhotos() {
  try {
    const res = await fetch(
      "https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&num=6",
      withTimeout({ next: { revalidate: 3600 } })
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { images?: Mars2020Image[] };
    return (data.images ?? [])
      .filter((img) => Boolean(img.image_files?.medium || img.image_files?.small))
      .slice(0, 4)
      .map((img) => ({
        sol: typeof img.sol === "number" ? img.sol : null,
        dateTakenUtc: img.date_taken_utc ?? null,
        instrument: img.camera?.instrument ?? "Perseverance Cam",
        title: img.title ?? "Jezero Crater raw frame",
        imageUrl: img.image_files?.medium ?? img.image_files?.small ?? "",
      }));
  } catch {
    return [];
  }
}

export async function GET() {
  const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";

  try {
    const [insightRes, curiosity, perseverancePhotos] = await Promise.all([
      fetch(
        `https://api.nasa.gov/insight_weather/?api_key=${apiKey}&feedtype=json&ver=1.0`,
        // The archive does not change, so a long revalidate keeps this off the
        // NASA hourly quota that the live routes share.
        withTimeout({ next: { revalidate: 86400 } })
      ),
      fetchCuriosityWeather(),
      fetchPerseverancePhotos(),
    ]);
    const res = insightRes;

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `NASA InSight responded ${res.status} using ${
          process.env.NASA_API_KEY ? "the configured NASA_API_KEY" : "DEMO_KEY"
        }: ${body.slice(0, 200)}`
      );
    }

    const data = (await res.json()) as InsightPayload;
    const solKeys = data.sol_keys;

    if (!Array.isArray(solKeys) || !solKeys.length) {
      throw new Error("NASA InSight response contained no sol_keys");
    }

    // Not every sol in the window carries a full instrument set. Walk back from
    // the newest until one reports air temperature, rather than rendering a
    // card of blanks.
    const sol = [...solKeys]
      .reverse()
      .find((key) => (data[key] as SolReport | undefined)?.AT);

    if (!sol) {
      throw new Error(
        `NASA InSight returned sols ${solKeys.join(", ")} but none carried an air temperature reading`
      );
    }

    const report = data[sol] as SolReport;

    return NextResponse.json({
      sol: Number(sol),
      firstUtc: report.First_UTC ?? null,
      lastUtc: report.Last_UTC ?? null,
      season: report.Season ?? null,
      northernSeason: report.Northern_season ?? null,
      temperatureC: report.AT
        ? { average: report.AT.av, min: report.AT.mn, max: report.AT.mx }
        : null,
      pressurePa: report.PRE
        ? { average: report.PRE.av, min: report.PRE.mn, max: report.PRE.mx }
        : null,
      windSpeedMs: report.HWS
        ? { average: report.HWS.av, min: report.HWS.mn, max: report.HWS.mx }
        : null,
      archival: true,
      missionEndedOn: MISSION_ENDED_ON,
      source: "NASA InSight lander, Elysium Planitia",
      curiosity,
      perseverancePhotos,
    });
  } catch (error) {
    console.error("Mars API error:", error);
    return NextResponse.json(
      {
        error: upstreamError("NASA InSight", error),
      },
      { status: 502 }
    );
  }
}
