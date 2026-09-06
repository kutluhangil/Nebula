import { NextResponse } from "next/server";
import { withTimeout, upstreamError } from "@/lib/upstream";

// Aerospace reporting from the Spaceflight News API. This was the one feed the
// browser fetched directly, which left it without the timeout, the standard
// error shape and the health probe every other source goes through.
const ARTICLES_URL = "https://api.spaceflightnewsapi.net/v4/articles/";

const PAGE_SIZE = 12;

// Upstream paginates with an absolute `next` URL. Handing that back to the
// client would make the caller responsible for an off-origin fetch, so the
// contract here is a plain offset and the route rebuilds the upstream URL.
const MAX_OFFSET = 10_000;

interface UpstreamArticle {
  id: number;
  title: string;
  url: string;
  image_url: string;
  news_site: string;
  summary: string;
  published_at: string;
  updated_at: string;
  featured: boolean;
}

interface UpstreamPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: UpstreamArticle[];
}

function parseOffset(value: string | null): number {
  if (value === null) return 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_OFFSET) {
    throw new Error(
      `Invalid offset "${value}": expected an integer between 0 and ${MAX_OFFSET}`
    );
  }
  return parsed;
}

export async function GET(request: Request) {
  let offset: number;
  try {
    offset = parseOffset(new URL(request.url).searchParams.get("offset"));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid offset" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${ARTICLES_URL}?limit=${PAGE_SIZE}&offset=${offset}`,
      withTimeout({ next: { revalidate: 300 } })
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Spaceflight News responded ${res.status}: ${body.slice(0, 200)}`
      );
    }

    const data = (await res.json()) as UpstreamPage;

    if (!Array.isArray(data.results)) {
      throw new Error("Spaceflight News response contained no results array");
    }

    return NextResponse.json({
      count: data.count,
      // An offset the caller passes straight back, rather than an upstream URL
      // it would have to fetch itself.
      nextOffset: data.next ? offset + PAGE_SIZE : null,
      results: data.results,
    });
  } catch (error) {
    console.error("Space news API error:", error);
    return NextResponse.json(
      { error: upstreamError("Spaceflight News", error) },
      { status: 502 }
    );
  }
}
