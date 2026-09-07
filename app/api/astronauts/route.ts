import { NextResponse } from "next/server";
import { withTimeout, upstreamError } from "@/lib/upstream";

/**
 * People currently in space.
 *
 * NASA and the space agencies publish no machine-readable crew roster, so this
 * is a third-party mirror and the UI says so. The obvious alternative,
 * `api.open-notify.org/astros.json`, answers 200 but its roster has been frozen
 * since 2024 — it still lists Expedition 71 — which is the same defect the Mars
 * card exists to avoid, so it is not used.
 */
const CREW_URL =
  "https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json";

export const SOURCE = "corquaid/international-space-station-APIs (community mirror)";

interface UpstreamPerson {
  id: number;
  name: string;
  country?: string;
  agency?: string;
  position?: string;
  spacecraft?: string;
  /** Launch time, epoch seconds. */
  launched?: number;
  iss?: boolean;
  url?: string;
}

interface UpstreamPayload {
  number?: number;
  iss_expedition?: number;
  people?: UpstreamPerson[];
}

/**
 * Days since launch, computed here rather than read from the mirror's own
 * `days_in_space`: that field is only as fresh as the mirror's last rebuild,
 * and the launch timestamp is the fact it is derived from.
 */
function daysInSpace(launchedSeconds: number | undefined): number | null {
  if (!launchedSeconds || !Number.isFinite(launchedSeconds)) return null;
  const elapsed = Date.now() - launchedSeconds * 1000;
  if (elapsed < 0) return null;
  return Math.floor(elapsed / 86_400_000);
}

export async function GET() {
  try {
    const res = await fetch(CREW_URL, withTimeout({ next: { revalidate: 3600 } }));

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Crew roster responded ${res.status}: ${body.slice(0, 200)}`
      );
    }

    const data = (await res.json()) as UpstreamPayload;

    if (!Array.isArray(data.people) || data.people.length === 0) {
      throw new Error("Crew roster contained no people");
    }

    return NextResponse.json({
      expedition: data.iss_expedition ?? null,
      people: data.people.map((person) => ({
        id: String(person.id),
        name: person.name,
        country: person.country ?? null,
        agency: person.agency ?? null,
        position: person.position ?? null,
        spacecraft: person.spacecraft ?? null,
        onIss: Boolean(person.iss),
        launchedUtc: person.launched
          ? new Date(person.launched * 1000).toISOString()
          : null,
        daysInSpace: daysInSpace(person.launched),
        url: person.url ?? null,
      })),
      source: SOURCE,
    });
  } catch (error) {
    console.error("Astronauts API error:", error);
    return NextResponse.json(
      { error: upstreamError("Crew roster", error) },
      { status: 502 }
    );
  }
}
