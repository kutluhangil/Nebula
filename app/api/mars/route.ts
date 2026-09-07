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

export async function GET() {
  const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";

  try {
    const res = await fetch(
      `https://api.nasa.gov/insight_weather/?api_key=${apiKey}&feedtype=json&ver=1.0`,
      // The archive does not change, so a long revalidate keeps this off the
      // NASA hourly quota that the live routes share.
      withTimeout({ next: { revalidate: 86400 } })
    );

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
