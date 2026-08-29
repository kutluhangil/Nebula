/**
 * Canonical origin for metadata, sitemap and Open Graph URLs.
 *
 * Vercel exposes the deployment host but not a scheme, and preview deploys get
 * a different host each time, so an explicit NEXT_PUBLIC_SITE_URL wins when it
 * is set.
 */
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "NEBULA";

export const SITE_DESCRIPTION =
  "Live telemetry from Earth and space — astronomy, launches, earthquakes and solar weather, read from the sources that measure them.";

/** Every indexable route, used by the sitemap. */
export const ROUTES = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/dashboard", changeFrequency: "hourly", priority: 0.9 },
  { path: "/earth", changeFrequency: "hourly", priority: 0.8 },
  { path: "/launches", changeFrequency: "daily", priority: 0.8 },
  { path: "/timeline", changeFrequency: "hourly", priority: 0.7 },
  { path: "/space", changeFrequency: "daily", priority: 0.7 },
  { path: "/news", changeFrequency: "hourly", priority: 0.7 },
] as const;
