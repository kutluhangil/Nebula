import { test, expect, type APIResponse } from "@playwright/test";

/**
 * Contract tests for the internal API routes.
 *
 * These hit the live upstream sources on purpose: the bugs this suite exists to
 * catch were contract drift (a route promising a field the UI reads) and
 * silent error swallowing, neither of which a mocked upstream would surface.
 * A source being down is reported as a skip rather than a failure, so an
 * outage at NASA does not read as a regression in this repo.
 */

/** Upstream is unreachable, not a contract violation — report and skip. */
async function skipIfUpstreamDown(response: APIResponse, name: string) {
  if (response.status() === 502) {
    const body = await response.json();
    test.skip(true, `${name} upstream unavailable: ${body.error}`);
  }
}

test.describe("earthquakes", () => {
  test("defaults to chronological order", async ({ request }) => {
    const response = await request.get("/api/earthquakes");
    await skipIfUpstreamDown(response, "USGS");
    expect(response.status()).toBe(200);

    const body = await response.json();
    const times = body.features.map(
      (f: { properties: { time: number } }) => f.properties.time
    );
    expect(times.length).toBeGreaterThan(0);

    // Most recent first. This is the bug the UI copy promised but the route
    // did not deliver while it ordered by magnitude.
    const sorted = [...times].sort((a: number, b: number) => b - a);
    expect(times).toEqual(sorted);
  });

  test("orders by magnitude when asked", async ({ request }) => {
    const response = await request.get("/api/earthquakes?orderby=magnitude");
    await skipIfUpstreamDown(response, "USGS");
    expect(response.status()).toBe(200);

    const body = await response.json();
    const mags = body.features.map(
      (f: { properties: { mag: number } }) => f.properties.mag
    );
    const sorted = [...mags].sort((a: number, b: number) => b - a);
    expect(mags).toEqual(sorted);
  });

  test("rejects an unknown ordering", async ({ request }) => {
    const response = await request.get("/api/earthquakes?orderby=sideways");
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toContain("Invalid orderby");
  });
});

test.describe("solar", () => {
  test("returns live NOAA readings, not fixed values", async ({ request }) => {
    const response = await request.get("/api/solar");
    await skipIfUpstreamDown(response, "NOAA SWPC");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.kpIndex).toBeGreaterThanOrEqual(0);
    expect(body.kpIndex).toBeLessThanOrEqual(9);
    expect(body.auroraProbability).toBeGreaterThanOrEqual(0);
    expect(body.auroraProbability).toBeLessThanOrEqual(100);
    expect(body.geoStorms).toBeGreaterThanOrEqual(0);
    expect(body.source).toContain("NOAA");

    // A real observation carries a timestamp; the hardcoded values did not.
    expect(Date.parse(body.observedAt)).not.toBeNaN();
  });
});

test.describe("launches", () => {
  test("emits every link field the launches page reads", async ({ request }) => {
    const response = await request.get("/api/spacex");
    await skipIfUpstreamDown(response, "Launch Library 2");
    expect(response.status()).toBe(200);

    const body = await response.json();
    const launches = [body.latest, ...body.upcoming].filter(Boolean);
    expect(launches.length).toBeGreaterThan(0);

    for (const launch of launches) {
      // The page reads all four; the route used to emit only patch.small,
      // so "Watch Live" could never render.
      expect(launch.links).toHaveProperty("patch.small");
      expect(launch.links).toHaveProperty("patch.large");
      expect(launch.links).toHaveProperty("webcast");
      expect(launch.links).toHaveProperty("article");
      expect(Date.parse(launch.date_utc)).not.toBeNaN();
    }
  });
});

test.describe("iss", () => {
  test("reports measured telemetry", async ({ request }) => {
    const response = await request.get("/api/iss");
    await skipIfUpstreamDown(response, "wheretheiss.at");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Math.abs(Number(body.iss_position.latitude))).toBeLessThanOrEqual(90);
    expect(Math.abs(Number(body.iss_position.longitude))).toBeLessThanOrEqual(180);
    // Measured altitude varies; the nominal 408 constant never did.
    expect(body.altitude).toBeGreaterThan(300);
    expect(body.altitude).toBeLessThan(500);
    expect(body.velocity).toBeGreaterThan(20000);
    expect(["daylight", "eclipsed", "visible"]).toContain(body.visibility);
  });

  test("predicts passes for an observer", async ({ request }) => {
    const response = await request.get("/api/iss/passes?lat=41.01&lon=28.98");
    await skipIfUpstreamDown(response, "ISS TLE");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.passes)).toBe(true);

    for (const pass of body.passes) {
      expect(pass.peakElevation).toBeGreaterThanOrEqual(10);
      expect(pass.peakElevation).toBeLessThanOrEqual(90);
      expect(pass.durationSeconds).toBeGreaterThan(0);
      expect(Date.parse(pass.start)).toBeLessThan(Date.parse(pass.end));
    }
  });

  test("rejects coordinates outside the globe", async ({ request }) => {
    const response = await request.get("/api/iss/passes?lat=999&lon=0");
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toContain("Invalid lat");
  });

  test("requires coordinates", async ({ request }) => {
    const response = await request.get("/api/iss/passes");
    expect(response.status()).toBe(400);
  });
});

test.describe("natural events", () => {
  for (const category of ["wildfires", "volcanoes", "severeStorms"]) {
    test(`returns mapped ${category}`, async ({ request }) => {
      const response = await request.get(`/api/events?category=${category}`);
      await skipIfUpstreamDown(response, "NASA EONET");
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.category).toBe(category);

      for (const event of body.events) {
        // Every event must be plottable, which is the whole point of the layer.
        expect(Math.abs(event.lat)).toBeLessThanOrEqual(90);
        expect(Math.abs(event.lon)).toBeLessThanOrEqual(180);
        expect(Date.parse(event.date)).not.toBeNaN();
      }
    });
  }

  test("rejects an unknown category", async ({ request }) => {
    const response = await request.get("/api/events?category=aliens");
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toContain("Invalid category");
  });
});

test.describe("weather", () => {
  test("labels the fallback location when none is given", async ({ request }) => {
    const response = await request.get("/api/weather");
    await skipIfUpstreamDown(response, "Open-Meteo");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.isLocalLocation).toBe(false);
    expect(body.locationLabel).toBe("Cape Canaveral");
  });

  test("uses supplied coordinates", async ({ request }) => {
    const response = await request.get("/api/weather?lat=41.01&lon=28.98");
    await skipIfUpstreamDown(response, "Open-Meteo");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.isLocalLocation).toBe(true);
    expect(body.timezone).toBe("Europe/Istanbul");
  });

  test("rejects a half-specified location", async ({ request }) => {
    const response = await request.get("/api/weather?lat=41.01");
    expect(response.status()).toBe(400);
  });
});

test.describe("ai report", () => {
  test("rejects a non-numeric earthquake count", async ({ request }) => {
    const response = await request.post("/api/ai-report", {
      data: { earthquakeCount: "not a number" },
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toContain("Invalid earthquakeCount");
  });
});
