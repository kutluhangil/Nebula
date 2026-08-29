import { NextResponse } from "next/server";
import { withTimeout, upstreamError } from "@/lib/upstream";

// The r-spacex API (api.spacexdata.com) is deprecated and offline. The Launch
// Library 2 API (thespacedevs) is the reliable, key-free replacement. We filter
// by launch service provider id 121 (SpaceX) and map results to the shape the
// UI already consumes.

interface LL2Url {
  priority?: number;
  url: string;
}

interface LL2Launch {
  id: string;
  name: string;
  net: string;
  status?: { abbrev?: string };
  mission?: { description?: string | null } | null;
  image?: string | null;
  rocket?: { configuration?: { name?: string } };
  pad?: { name?: string };
  vidURLs?: LL2Url[] | null;
  infoURLs?: LL2Url[] | null;
}

interface MappedLaunch {
  id: string;
  name: string;
  date_utc: string;
  success: boolean | null;
  details: string | null;
  links: {
    patch: { small: string | null; large: string | null };
    webcast: string | null;
    article: string | null;
  };
  rocket: string;
  launchpad: string;
}

/** LL2 returns several URLs per launch, ranked by a `priority` field. */
function topUrl(urls: LL2Url[] | null | undefined): string | null {
  if (!urls?.length) return null;
  const ranked = [...urls].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );
  return ranked[0]?.url ?? null;
}

function mapLaunch(l: LL2Launch, upcoming: boolean): MappedLaunch {
  const abbrev = l.status?.abbrev;
  return {
    id: l.id,
    name: l.name,
    date_utc: l.net,
    success: upcoming
      ? null
      : abbrev === "Success"
      ? true
      : abbrev === "Failure"
      ? false
      : null,
    details: l.mission?.description ?? null,
    // LL2 serves a single mission image; the UI renders it at two sizes.
    links: {
      patch: { small: l.image ?? null, large: l.image ?? null },
      webcast: topUrl(l.vidURLs),
      article: topUrl(l.infoURLs),
    },
    rocket: l.rocket?.configuration?.name ?? "Falcon 9",
    launchpad: l.pad?.name ?? "",
  };
}

export async function GET() {
  try {
    const base = "https://ll.thespacedevs.com/2.2.0/launch";
    const [prevRes, upRes] = await Promise.all([
      fetch(`${base}/previous/?limit=1&lsp__id=121&mode=detailed`, withTimeout({ next: { revalidate: 3600 } })),
      fetch(`${base}/upcoming/?limit=6&lsp__id=121&mode=detailed`, withTimeout({ next: { revalidate: 3600 } })),
    ]);

    if (!prevRes.ok) {
      throw new Error(`Launch Library previous failed: ${prevRes.status}`);
    }
    if (!upRes.ok) {
      throw new Error(`Launch Library upcoming failed: ${upRes.status}`);
    }

    const prev = await prevRes.json();
    const up = await upRes.json();

    const latest: MappedLaunch | null = prev.results?.[0]
      ? mapLaunch(prev.results[0], false)
      : null;
    const upcoming: MappedLaunch[] = (up.results ?? []).map((l: LL2Launch) =>
      mapLaunch(l, true)
    );

    return NextResponse.json({ latest, upcoming });
  } catch (error) {
    console.error("SpaceX API error:", error);
    return NextResponse.json(
      { error: upstreamError("Launch Library 2", error) },
      { status: 502 }
    );
  }
}
