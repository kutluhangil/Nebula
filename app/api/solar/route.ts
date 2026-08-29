import { NextResponse } from "next/server";
import { withTimeout, upstreamError } from "@/lib/upstream";

// Real space weather from NOAA SWPC. These endpoints are public, key-free and
// CORS-restricted, which is why they are read server-side here rather than from
// the browser.
const KP_URL =
  "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";
const AURORA_URL =
  "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json";
const ALERTS_URL = "https://services.swpc.noaa.gov/products/alerts.json";
const XRAY_FLARES_URL =
  "https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json";

interface KpEntry {
  time_tag: string;
  Kp: number;
}

interface AuroraPayload {
  "Observation Time": string;
  coordinates: [number, number, number][];
}

interface AlertEntry {
  product_id: string;
  issue_datetime: string;
  message: string;
}

interface XrayFlare {
  max_class?: string | null;
  max_time?: string | null;
  begin_time?: string | null;
}

async function getJson<T>(url: string, revalidate: number): Promise<T> {
  const res = await fetch(url, withTimeout({ next: { revalidate } }));
  if (!res.ok) {
    throw new Error(`NOAA SWPC request to ${url} failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Latest planetary K index, rounded to the integer scale the gauge renders. */
function latestKp(entries: KpEntry[]): { kpIndex: number; observedAt: string } {
  const last = entries[entries.length - 1];
  if (!last) {
    throw new Error("NOAA planetary K index feed returned no entries");
  }
  return {
    kpIndex: Math.round(last.Kp),
    observedAt: last.time_tag,
  };
}

/**
 * OVATION reports aurora probability per lat/lon grid cell. The card shows a
 * single headline number, so we take the strongest probability currently
 * modelled anywhere on the globe.
 */
function peakAuroraProbability(payload: AuroraPayload): number {
  let peak = 0;
  for (const [, , probability] of payload.coordinates) {
    if (probability > peak) peak = probability;
  }
  return peak;
}

/** Geomagnetic storm alerts (G-scale) issued in the last 24 hours. */
function activeGeoStorms(alerts: AlertEntry[]): number {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return alerts.filter((alert) => {
    const issued = Date.parse(alert.issue_datetime.replace(" ", "T") + "Z");
    if (Number.isNaN(issued) || issued < dayAgo) return false;
    return /WARNING|ALERT/i.test(alert.message) && /\bG[1-5]\b/.test(alert.message);
  }).length;
}

/** X-ray flares (C class and above) whose peak falls on the current UTC day. */
function flaresToday(flares: XrayFlare[]): number {
  const today = new Date().toISOString().split("T")[0];
  return flares.filter((flare) => {
    const cls = flare.max_class;
    if (!cls || !/^[CMX]/i.test(cls)) return false;
    const peak = flare.max_time ?? flare.begin_time;
    return typeof peak === "string" && peak.startsWith(today);
  }).length;
}

export async function GET() {
  try {
    const [kpRaw, aurora, alerts, flares] = await Promise.all([
      // The K index feed is a header row followed by data rows.
      getJson<[string, string, string, string][]>(KP_URL, 300),
      getJson<AuroraPayload>(AURORA_URL, 300),
      getJson<AlertEntry[]>(ALERTS_URL, 300),
      getJson<XrayFlare[]>(XRAY_FLARES_URL, 300),
    ]);

    // The products endpoint serves either an array-of-arrays with a header row
    // or an array of objects depending on the product. Normalise both.
    const kpEntries: KpEntry[] = Array.isArray(kpRaw[0])
      ? (kpRaw as unknown as [string, string, string, string][])
          .slice(1)
          .map((row) => ({ time_tag: row[0], Kp: Number(row[1]) }))
          .filter((entry) => Number.isFinite(entry.Kp))
      : (kpRaw as unknown as KpEntry[]);

    const { kpIndex, observedAt } = latestKp(kpEntries);

    return NextResponse.json({
      kpIndex,
      observedAt,
      auroraProbability: peakAuroraProbability(aurora),
      auroraObservedAt: aurora["Observation Time"],
      geoStorms: activeGeoStorms(alerts),
      solarFlares: flaresToday(Array.isArray(flares) ? flares : [flares]),
      source: "NOAA Space Weather Prediction Center",
    });
  } catch (error) {
    console.error("Solar API error:", error);
    return NextResponse.json(
      {
        error: upstreamError("NOAA SWPC", error),
      },
      { status: 502 }
    );
  }
}
