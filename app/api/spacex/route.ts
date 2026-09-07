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

/**
 * Launch Library throttles anonymous callers per IP. Its 429 carries both a
 * `retry-after` header and a body saying when the window reopens; dropping
 * them turned a quota problem into an unexplained "failed: 429".
 */
async function assertOk(res: Response, label: string): Promise<void> {
  if (res.ok) return;

  const body = await res.text().catch(() => "");
  const retryAfter = res.headers.get("retry-after");

  throw new Error(
    `Launch Library ${label} responded ${res.status}${
      retryAfter ? ` (retry after ${retryAfter}s)` : ""
    }: ${body.slice(0, 200)}`
  );
}

/** How many past launches the success record is computed over. */
const HISTORY_WINDOW = 20;

interface LaunchRecord {
  /** How many launches the counts below were taken from. */
  sampled: number;
  success: number;
  failure: number;
  /** Launches whose outcome Launch Library has not classified either way. */
  unresolved: number;
  earliestUtc: string | null;
  latestUtc: string | null;
}

/**
 * The success record over the launches this response already carries.
 *
 * The window is reported alongside the counts because "N of M" is the only
 * honest form: this is the last {@link HISTORY_WINDOW} SpaceX launches, not
 * the programme's lifetime record, and a bare percentage would imply the
 * latter. Partial failures and unclassified statuses are counted separately
 * rather than folded into either column.
 */
function buildRecord(launches: LL2Launch[]): LaunchRecord {
  let success = 0;
  let failure = 0;
  let unresolved = 0;

  for (const launch of launches) {
    const abbrev = launch.status?.abbrev;
    if (abbrev === "Success") success += 1;
    else if (abbrev === "Failure") failure += 1;
    else unresolved += 1;
  }

  const times = launches
    .map((launch) => launch.net)
    .filter((net): net is string => Boolean(net) && !Number.isNaN(Date.parse(net)))
    .sort();

  return {
    sampled: launches.length,
    success,
    failure,
    unresolved,
    earliestUtc: times[0] ?? null,
    latestUtc: times[times.length - 1] ?? null,
  };
}

export async function GET() {
  try {
    const base = "https://ll.thespacedevs.com/2.2.0/launch";
    const [prevRes, upRes] = await Promise.all([
      // Twenty rather than one: the success record below is computed from this
      // same response, so the history costs no extra upstream request against
      // Launch Library's per-IP quota.
      fetch(`${base}/previous/?limit=${HISTORY_WINDOW}&lsp__id=121&mode=detailed`, withTimeout({ next: { revalidate: 3600 } })),
      fetch(`${base}/upcoming/?limit=6&lsp__id=121&mode=detailed`, withTimeout({ next: { revalidate: 3600 } })),
    ]);

    await assertOk(prevRes, "previous");
    await assertOk(upRes, "upcoming");

    const prev = await prevRes.json();
    const up = await upRes.json();

    const previous: LL2Launch[] = prev.results ?? [];
    const latest: MappedLaunch | null = previous[0]
      ? mapLaunch(previous[0], false)
      : null;
    const upcoming: MappedLaunch[] = (up.results ?? []).map((l: LL2Launch) =>
      mapLaunch(l, true)
    );

    return NextResponse.json({
      latest,
      // The launches the record was computed from, so the summary can be
      // checked against the rows it summarises rather than trusted.
      previous: previous.map((l) => mapLaunch(l, false)),
      upcoming,
      record: buildRecord(previous),
    });
  } catch (error) {
    console.error("SpaceX API error:", error);
    return NextResponse.json(
      { error: upstreamError("Launch Library 2", error) },
      { status: 502 }
    );
  }
}
