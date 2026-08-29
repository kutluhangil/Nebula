import { NextResponse } from "next/server";

// Real source health for the footer's status list, which previously rendered
// "Operational" as static markup regardless of whether anything was actually
// reachable. Each entry probes this app's own route for that source, so the
// status reflects the path the UI really takes.
const PROBES = [
  { id: "nasa", label: "NASA Open APIs", path: "/api/apod", href: "https://api.nasa.gov/" },
  { id: "usgs", label: "USGS Earthquakes", path: "/api/earthquakes", href: "https://earthquake.usgs.gov/" },
  { id: "noaa", label: "NOAA Space Weather", path: "/api/solar", href: "https://www.swpc.noaa.gov/" },
  { id: "launch", label: "Launch Library 2", path: "/api/spacex", href: "https://thespacedevs.com/llapi" },
  { id: "eonet", label: "NASA EONET", path: "/api/events?category=wildfires", href: "https://eonet.gsfc.nasa.gov/" },
] as const;

const PROBE_TIMEOUT_MS = 8000;

type Status = "operational" | "degraded" | "down";

interface SourceHealth {
  id: string;
  label: string;
  href: string;
  status: Status;
  latencyMs: number | null;
  detail: string | null;
}

async function probe(
  entry: (typeof PROBES)[number],
  origin: string
): Promise<SourceHealth> {
  const startedAt = Date.now();

  try {
    const res = await fetch(`${origin}${entry.path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    const latencyMs = Date.now() - startedAt;

    if (res.ok) {
      return {
        id: entry.id,
        label: entry.label,
        href: entry.href,
        // A source that answers but crawls is not the same as a healthy one.
        status: latencyMs > 4000 ? "degraded" : "operational",
        latencyMs,
        detail: null,
      };
    }

    const body = await res.json().catch(() => ({}));
    return {
      id: entry.id,
      label: entry.label,
      href: entry.href,
      status: "down",
      latencyMs,
      detail:
        typeof body?.error === "string"
          ? body.error.slice(0, 160)
          : `HTTP ${res.status}`,
    };
  } catch (error) {
    return {
      id: entry.id,
      label: entry.label,
      href: entry.href,
      status: "down",
      latencyMs: Date.now() - startedAt,
      detail:
        error instanceof Error
          ? error.name === "TimeoutError"
            ? `No response within ${PROBE_TIMEOUT_MS / 1000}s`
            : error.message.slice(0, 160)
          : "Unreachable",
    };
  }
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const sources = await Promise.all(PROBES.map((entry) => probe(entry, origin)));

  const down = sources.filter((s) => s.status === "down").length;
  const degraded = sources.filter((s) => s.status === "degraded").length;

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      overall: down > 0 ? "down" : degraded > 0 ? "degraded" : "operational",
      sources,
    },
    // This is a live status read; a cached one would defeat its purpose.
    { headers: { "Cache-Control": "no-store" } }
  );
}
