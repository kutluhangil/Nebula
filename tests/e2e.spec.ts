import { test, expect, type Page } from "@playwright/test";

/**
 * End-to-end checks over the rendered app. These cover the two failure modes
 * this project actually shipped: cards rendering fabricated constants, and
 * cards crashing or rendering blank when a source returned an error.
 */

/** Fails a route so the UI's error path can be exercised deterministically. */
async function breakRoute(page: Page, path: string) {
  await page.route(`**${path}`, (route) =>
    route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({ error: "Simulated upstream failure" }),
    })
  );
}

test.describe("pages render", () => {
  for (const path of [
    "/",
    "/dashboard",
    "/earth",
    "/launches",
    "/timeline",
    "/space",
    "/favorites",
  ]) {
    test(`${path} loads without a client exception`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
      expect(pageErrors).toEqual([]);
    });
  }
});

test.describe("solar card", () => {
  test("shows live NOAA values with an observation time", async ({ page }) => {
    await page.goto("/dashboard");

    const caption = page.getByText(/Kp observed/);
    await expect(caption).toBeVisible();
    // The card used to render a hardcoded KP with no provenance at all.
    await expect(caption).toContainText("NOAA");
  });

  test("shows an error state with retry when NOAA fails", async ({ page }) => {
    await breakRoute(page, "/api/solar");
    await page.goto("/dashboard");

    await expect(
      page.getByText(/space weather is unavailable right now/i)
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
  });
});

test.describe("apod card", () => {
  test("renders an error state instead of a broken image", async ({ page }) => {
    await breakRoute(page, "/api/apod");
    await page.goto("/dashboard");

    await expect(
      page.getByText(/Astronomy Picture of the Day is unavailable/i)
    ).toBeVisible();

    // The pre-fix card passed an undefined src straight to next/image.
    const broken = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("img")).filter(
          (img) => img.complete && img.naturalWidth === 0
        ).length
    );
    expect(broken).toBe(0);
  });
});

test.describe("failure isolation", () => {
  test("one failing source does not blank the others", async ({ page }) => {
    await breakRoute(page, "/api/apod");
    await page.goto("/dashboard");

    await expect(
      page.getByText(/Astronomy Picture of the Day is unavailable/i)
    ).toBeVisible();
    // Solar still reports live data alongside the failed card.
    await expect(page.getByText(/Kp observed/)).toBeVisible();
  });
});

test.describe("earth layers", () => {
  test("layer toggles are exposed to assistive tech", async ({ page }) => {
    await page.goto("/earth");

    const wildfires = page.getByRole("button", { name: /wildfires/i });
    await expect(wildfires).toBeVisible();
    await expect(wildfires).toHaveAttribute("aria-pressed", "false");

    await wildfires.click();
    await expect(wildfires).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("footer", () => {
  test("has no dead links", async ({ page }) => {
    await page.goto("/");

    const hrefs = await page
      .locator("footer a")
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? "")
      );

    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.filter((href) => href === "#" || href === "")).toEqual([]);
  });
});

test.describe("modal accessibility", () => {
  test("earthquake detail traps focus, locks scroll and closes on Escape", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const quake = page
      .getByRole("button", { name: /magnitude .* earthquake near/i })
      .first();
    await quake.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // The page behind must not scroll while the dialog is open.
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe("hidden");

    // Focus must have moved into the dialog.
    const focusInside = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return Boolean(d && d.contains(document.activeElement));
    });
    expect(focusInside).toBe(true);

    // Tab repeatedly and confirm focus never leaves the dialog.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const stillInside = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"]');
        return Boolean(d && d.contains(document.activeElement));
      });
      expect(stillInside).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // Scroll lock must be released when the dialog closes.
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .not.toBe("hidden");
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("exposes a visible search control", async ({ page }) => {
    await page.goto("/dashboard");

    // Cmd+K is unreachable on a phone, so a tappable control must exist.
    const search = page.getByRole("button", { name: "Search" });
    await expect(search).toBeVisible();

    await search.click();
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });
});

test.describe("favorites", () => {
  test("rejects a malformed import with a specific reason", async ({ page }) => {
    await page.goto("/favorites");

    await page.setInputFiles('input[type="file"]', {
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from("{ not json"),
    });

    await expect(page.getByRole("status")).toContainText(/not valid JSON/i);
  });

  test("round-trips an exported file", async ({ page }) => {
    await page.goto("/favorites");

    // Import a known-good export, then confirm the item is listed.
    await page.setInputFiles('input[type="file"]', {
      name: "nebula-favorites.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          version: 1,
          exportedAt: new Date().toISOString(),
          favorites: [
            {
              id: "apod-test-1",
              type: "apod",
              title: "Imported Test Item",
              subtitle: "2026-01-01",
              date: "2026-01-01",
            },
          ],
        })
      ),
    });

    await expect(page.getByRole("status")).toContainText(/Imported 1 item/i);
    await expect(page.getByText("Imported Test Item")).toBeVisible();
  });
});

test.describe("source status", () => {
  test("footer reports live status rather than static markup", async ({ page }) => {
    await page.goto("/");

    // Fail one probe and confirm the footer actually reflects it.
    await page.route("**/api/health", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          checkedAt: new Date().toISOString(),
          overall: "down",
          sources: [
            {
              id: "nasa",
              label: "NASA Open APIs",
              href: "https://api.nasa.gov/",
              status: "down",
              latencyMs: 120,
              detail: "Simulated outage",
            },
          ],
        }),
      })
    );
    await page.reload();

    await expect(page.locator("footer").getByText("Down")).toBeVisible();
  });
});

/**
 * Regressions for the fabricated-constant and silent-failure class of bug.
 * Each of these passed review and shipped once; the assertions below are what
 * would have caught them.
 */

/** Serves a route a fixed payload so a value-dependent assertion is stable. */
async function stubRoute(page: Page, path: string, body: unknown) {
  await page.route(`**${path}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    })
  );
}

test.describe("iss tracker", () => {
  test("reports an error rather than placing the station at 0°,0°", async ({
    page,
  }) => {
    await breakRoute(page, "/api/iss");
    await page.goto("/dashboard");

    await expect(
      page.getByText(/ISS telemetry is unavailable right now/i)
    ).toBeVisible();
    // The card used to fall back to parseFloat(undefined || "0"), printing the
    // Gulf of Guinea as the station's live position.
    await expect(page.getByText("0.0000°")).toHaveCount(0);
  });

  test("speed comes from the feed, not a nominal constant", async ({ page }) => {
    await stubRoute(page, "/api/iss", {
      iss_position: { latitude: "12.5", longitude: "-40.25" },
      timestamp: Math.floor(Date.now() / 1000),
      altitude: 421.7,
      velocity: 27123,
      visibility: "daylight",
      footprint: 4551,
    });
    await page.goto("/dashboard");

    // The stats tile printed a hardcoded "27,600 km/h" regardless of the feed.
    // The value and its unit are separate elements, so assert on the tile.
    const speedTile = page
      .getByText("ISS speed", { exact: true })
      .locator("xpath=ancestor::div[1]/..");
    await expect(speedTile).toContainText("27,123");
    await expect(speedTile).toContainText("km/h");
    await expect(page.getByText("27,600")).toHaveCount(0);
  });
});

/** The Kp gauge's activity label — the sibling above its "Activity Level" caption. */
function kpActivityLabel(page: Page) {
  return page
    .getByText("Activity Level", { exact: true })
    .locator("xpath=preceding-sibling::div[1]");
}

test.describe("space weather labels", () => {
  test("Kp 4 is active, not a geomagnetic storm", async ({ page }) => {
    await stubRoute(page, "/api/solar", {
      kpIndex: 4,
      observedAt: "2026-01-01T00:00:00",
      auroraProbability: 12,
      auroraObservedAt: "2026-01-01T00:00:00",
      geoStorms: 0,
      solarFlares: 0,
      source: "NOAA Space Weather Prediction Center",
    });
    await page.goto("/dashboard");

    // NOAA's G scale starts at Kp 5. The label array was shifted one position,
    // so Kp 4 announced a "Minor Storm" on a merely active day.
    await expect(kpActivityLabel(page)).toHaveText("Active");
  });

  test("Kp 5 is the first storm level", async ({ page }) => {
    await stubRoute(page, "/api/solar", {
      kpIndex: 5,
      observedAt: "2026-01-01T00:00:00",
      auroraProbability: 30,
      auroraObservedAt: "2026-01-01T00:00:00",
      geoStorms: 1,
      solarFlares: 0,
      source: "NOAA Space Weather Prediction Center",
    });
    await page.goto("/dashboard");

    await expect(kpActivityLabel(page)).toHaveText("Minor Storm");
  });
});

test.describe("weather widget", () => {
  test("shows an error state instead of disappearing", async ({ page }) => {
    await breakRoute(page, "/api/weather");
    await page.goto("/dashboard");

    // The widget used to `return null`, vanishing from the grid with no reason.
    await expect(
      page.getByText(/Weather is unavailable right now/i)
    ).toBeVisible();
  });
});

test.describe("ai report", () => {
  test("waits for the real earthquake count before generating", async ({
    page,
  }) => {
    // Twenty tests in this file open the dashboard, and each load posts one
    // report. That is past the route's own 10-per-minute budget, so the
    // rejected calls came back as 429s the client retried — three requests
    // where this test counts one. The limiter buckets by client address, and
    // this test is not the one exercising it, so it takes a bucket of its own.
    await page.setExtraHTTPHeaders({ "x-forwarded-for": "203.0.113.8" });

    const counts: unknown[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/ai-report")) {
        counts.push(JSON.parse(request.postData() ?? "{}").earthquakeCount);
      }
    });

    await page.goto("/dashboard");
    await expect(page.getByText(/Auto-generated/)).toBeVisible();

    // It used to fire twice: once on a placeholder 0 while the feed was still
    // in flight, then again on the real count — a paid model call on a number
    // the page was about to replace.
    expect(counts).not.toContain(0);
    expect(counts.length).toBe(1);
  });
});

test.describe("stats bar", () => {
  test("does not claim zero hazardous asteroids while still loading", async ({
    page,
  }) => {
    await page.route("**/api/space", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      await route.continue();
    });
    await page.goto("/dashboard");

    const tile = page
      .getByText("Hazardous", { exact: true })
      .locator("xpath=ancestor::div[1]/..");
    // The "—" branch was dead code, so a pending feed rendered a confident 0.
    await expect(tile).toContainText("—");
  });
});

test.describe("space news", () => {
  test("reads through the app's own route, not the upstream directly", async ({
    page,
  }) => {
    const offOrigin: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("spaceflightnewsapi.net")) {
        offOrigin.push(request.url());
      }
    });

    await page.goto("/news");
    await expect(page.locator("article, a.glass-panel").first()).toBeVisible();

    // The grid used to fetch api.spaceflightnewsapi.net straight from the
    // browser, bypassing the timeout, error shape and health probe.
    expect(offOrigin).toEqual([]);
  });

  test("shows an error state with retry when the feed fails", async ({
    page,
  }) => {
    // The trailing wildcard matters: the grid requests /api/news?offset=0.
    await breakRoute(page, "/api/news*");
    await page.goto("/news");

    await expect(
      page.getByText(/Space news is unavailable right now/i)
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
  });
});

test.describe("space weather colours", () => {
  test("the gauge changes colour on NOAA's storm boundary, not one step early", async ({
    page,
  }) => {
    const readGaugeColour = async (kpIndex: number) => {
      await page.route("**/api/solar", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            kpIndex,
            observedAt: "2026-01-01T00:00:00",
            auroraProbability: 10,
            auroraObservedAt: "2026-01-01T00:00:00",
            geoStorms: 0,
            solarFlares: 0,
            source: "NOAA Space Weather Prediction Center",
          }),
        })
      );
      await page.goto("/dashboard");
      // Anchored to the gauge's own caption; a bare "4" matches elsewhere.
      const value = page
        .getByText("KP Index", { exact: true })
        .locator("xpath=preceding-sibling::div[1]");
      await expect(value).toHaveText(String(kpIndex));
      return value.evaluate((el) => getComputedStyle(el).color);
    };

    // Kp 4 is "Active" and Kp 5 is the first storm level, so the colour has to
    // change between them — it used to escalate a step early, at 3 and 4.
    const active = await readGaugeColour(4);
    const minorStorm = await readGaugeColour(5);
    expect(active).not.toBe(minorStorm);
  });
});

/**
 * The remaining cards and pages that rendered a confident empty state instead
 * of reporting their source had failed.
 */
test.describe("silent failure", () => {
  test("the launches page reports a dead feed instead of rendering bare", async ({
    page,
  }) => {
    await breakRoute(page, "/api/spacex");
    await page.goto("/launches");

    // Every section here is guarded on its own slice of the payload, so the
    // page used to render as a heading between the nav and the footer.
    await expect(
      page.getByText(/Launch data is unavailable right now/i)
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
  });

  test("the asteroid card does not report zero hazardous when NEO fails", async ({
    page,
  }) => {
    await breakRoute(page, "/api/space");
    await page.goto("/dashboard");

    const card = page
      .getByText("Near-Earth Objects")
      .locator("xpath=ancestor::div[contains(@class,'space-y-4')][1]");
    await expect(card).toContainText(
      /near-Earth object data is unavailable right now/i
    );
    // It used to summarise the empty list as a genuinely quiet day.
    await expect(card).not.toContainText("HAZARDOUS");
  });

  test("the spacex card reports a dead feed instead of an empty panel", async ({
    page,
  }) => {
    await breakRoute(page, "/api/spacex");
    await page.goto("/dashboard");

    await expect(
      page.getByText(/Launch data is unavailable right now/i).first()
    ).toBeVisible();
  });
});

test.describe("source attribution", () => {
  test("no page still credits a source the app stopped reading", async ({
    page,
  }) => {
    for (const path of ["/", "/dashboard", "/space", "/launches", "/news"]) {
      await page.goto(path);
      const body = await page.locator("body").innerText();
      // Open Notify was replaced by wheretheiss.at, and the r-spacex API this
      // app once used is deprecated and offline.
      expect(body, `${path} credits a retired source`).not.toMatch(
        /Open Notify|SpaceX API/
      );
    }
  });
});

test.describe("dead seismic feed", () => {
  test("the Earth page does not report zero events for the planet", async ({
    page,
  }) => {
    await breakRoute(page, "/api/earthquakes");
    await page.goto("/earth");

    await expect(
      page.getByText(/USGS seismic data is unavailable right now/i).first()
    ).toBeVisible();

    // The counters used to read 0 total, 0 major, 0 moderate, 0 tsunami — a
    // claim that the planet recorded nothing all week.
    const totals = page
      .getByText("Total events", { exact: true })
      .locator("xpath=following-sibling::div[1]");
    await expect(totals).toHaveText("—");
  });

  test("the quake list says the feed failed instead of showing nothing", async ({
    page,
  }) => {
    await breakRoute(page, "/api/earthquakes");
    await page.goto("/dashboard");

    const panel = page
      .getByText("Earthquake Monitor")
      .locator("xpath=ancestor::div[contains(@class,'space-y-4')][1]");
    await expect(panel).toContainText(/unavailable right now/i);
  });

  test("the briefing stops saying it is connecting", async ({ page }) => {
    await breakRoute(page, "/api/earthquakes");
    await page.goto("/dashboard");

    const briefing = page
      .getByText("Live briefing")
      .locator("xpath=ancestor::section[1]");
    await expect(briefing).toContainText("Seismic feed unavailable");
    await expect(briefing).not.toContainText("Seismic feed connecting");
  });
});

test.describe("timeline", () => {
  test("reports unreachable feeds rather than loading forever", async ({
    page,
  }) => {
    for (const path of ["/api/earthquakes", "/api/apod", "/api/spacex"]) {
      await breakRoute(page, path);
    }
    await page.goto("/timeline");

    await expect(page.getByText(/No feed could be reached/i)).toBeVisible();
    await expect(page.getByText(/Loading timeline events/i)).toHaveCount(0);
  });
});

test.describe("footer status", () => {
  test("says so when the status check itself cannot be reached", async ({
    page,
  }) => {
    await breakRoute(page, "/api/health");
    await page.goto("/");

    // The one component whose job is reporting outages used to go silent about
    // its own, leaving "System Status" as an empty heading.
    await expect(
      page.locator("footer").getByText(/Status checks could not be reached/i)
    ).toBeVisible();
  });
});

test.describe("runtime origin", () => {
  test("no page loads its own assets from a package CDN", async ({ page }) => {
    // Upstream media (NASA's APOD image, launch patches, Leaflet's map tiles)
    // is the data itself and legitimately off-origin. A package CDN serving
    // this app's own assets is not: it is an unmonitored dependency in the
    // critical path, which is what the globe's Earth textures used to be.
    const PACKAGE_CDNS = /unpkg\.com|jsdelivr\.net|cdnjs\.cloudflare\.com|esm\.sh|skypack\.dev/;
    const offending: string[] = [];
    page.on("request", (request) => {
      if (PACKAGE_CDNS.test(request.url())) offending.push(request.url());
    });

    for (const path of ["/", "/dashboard", "/earth", "/news"]) {
      await page.goto(path);
      await page.waitForTimeout(1500);
    }

    expect(offending).toEqual([]);
  });

  test("the globe draws from self-hosted textures", async ({ page }) => {
    const textures: number[] = [];
    page.on("response", (response) => {
      if (response.url().includes("/textures/")) textures.push(response.status());
    });

    await page.goto("/");
    await expect(page.locator("canvas").first()).toBeVisible();
    await page.waitForTimeout(3000);

    expect(textures.length).toBe(3);
    expect(textures.every((status) => status === 200)).toBe(true);
  });
});

test.describe("map attribution", () => {
  test("credits Esri and OpenStreetMap for the base layer", async ({
    page,
  }) => {
    await page.goto("/earth");

    // The base layer shipped with attributionControl disabled and an empty
    // attribution string, which both licences require.
    const attribution = page.locator(".leaflet-control-attribution");
    await expect(attribution).toBeVisible();
    await expect(attribution).toContainText("Esri");
    await expect(attribution).toContainText("OpenStreetMap");
  });

  test("the base layer serves real tiles instead of a key-required stamp", async ({
    page,
  }) => {
    // CARTO's dark basemap answers key-less requests with 200 and a tile that
    // reads "API KEY REQUIRED" across the whole image, so a status check alone
    // does not catch it. Assert the map reads from a provider that serves the
    // real cartography without a key.
    const tiles: { url: string; status: number }[] = [];
    page.on("response", (response) => {
      const url = response.url();
      if (/arcgisonline\.com|cartocdn\.com|tile\.openstreetmap\.org/.test(url)) {
        tiles.push({ url, status: response.status() });
      }
    });

    await page.goto("/earth");
    await page.waitForSelector(".leaflet-tile-loaded", { timeout: 30_000 });

    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.every((tile) => tile.status === 200)).toBe(true);
    expect(tiles.some((tile) => tile.url.includes("cartocdn.com"))).toBe(false);
  });
});

/**
 * Feed entries regularly point at images their publisher has removed. The card
 * rendered the alt text over an empty box, which reads as a broken page.
 */
test.describe("news imagery", () => {
  test("an article whose image 404s falls back to the placeholder", async ({
    page,
  }) => {
    const deadImage = "https://www.nasa.gov/removed-by-publisher.png";

    // The grid paginates, so the route carries an offset query string.
    await stubRoute(page, "/api/news*", {
      count: 1,
      nextOffset: null,
      results: [
        {
          id: 1,
          title: "Article with a dead image",
          url: "https://example.com/article",
          image_url: deadImage,
          news_site: "NASA",
          summary: "The publisher removed the artwork for this article.",
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          featured: false,
        },
      ],
    });
    await page.route(deadImage, (route) => route.fulfill({ status: 404 }));

    await page.goto("/news");
    await expect(
      page.getByRole("heading", { name: "Article with a dead image" })
    ).toBeVisible();

    // The <img> must be gone once it errors, otherwise the browser paints the
    // alt text across the card.
    await expect(
      page.getByRole("img", { name: "Article with a dead image" })
    ).toHaveCount(0);
  });
});

/**
 * Launch Library keeps a mission in its upcoming feed until a human confirms
 * the outcome, so upcoming[0] is regularly a launch that already flew. The
 * hero counted down to it and printed four zeros under "Next Launch".
 */
test.describe("next launch", () => {
  const launch = (id: string, offsetMs: number) => ({
    id,
    name: `Falcon 9 | ${id}`,
    date_utc: new Date(Date.now() + offsetMs).toISOString(),
    success: null,
    details: null,
    links: { patch: { small: null, large: null }, webcast: null, article: null },
    rocket: "Falcon 9",
  });

  test("skips a mission whose window already opened", async ({ page }) => {
    await stubRoute(page, "/api/spacex", {
      latest: null,
      upcoming: [launch("flown", -2 * 60 * 60 * 1000), launch("scheduled", 3 * 24 * 60 * 60 * 1000)],
    });

    await page.goto("/launches");

    await expect(
      page.getByRole("heading", { name: "Falcon 9 | scheduled" })
    ).toBeVisible();
    await expect(page.getByText("Next Launch", { exact: true })).toBeVisible();
    // The flown mission belongs in the list below, never in the countdown hero.
    await expect(
      page.getByRole("heading", { name: "Falcon 9 | flown" })
    ).toHaveCount(0);
  });

  test("says the window is open instead of counting down to zero", async ({
    page,
  }) => {
    await stubRoute(page, "/api/spacex", {
      latest: null,
      upcoming: [launch("flown", -2 * 60 * 60 * 1000)],
    });

    await page.goto("/launches");

    await expect(
      page.getByText("Launch window open", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("Next Launch", { exact: true })).toHaveCount(0);
    await expect(page.getByText("DAYS", { exact: true })).toHaveCount(0);
  });
});

/**
 * The CSS media query neutralises CSS transitions, but every entrance here is a
 * Framer Motion animation driven from JavaScript, which the query cannot reach.
 */
test.describe("reduced motion", () => {
  test("entrance animations drop their movement, not their content", async ({
    page,
  }) => {
    // Set on the page rather than through `test.use`: the project's device
    // preset pins the context options, so a describe-level override never
    // reaches the browser here.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
    ).toBe(true);

    const heading = page.getByRole("heading", {
      name: "Six live feeds, one interface.",
    });
    await heading.scrollIntoViewIfNeeded();

    const containerStyle = () =>
      heading.evaluate((el) => {
        const style = getComputedStyle(el.closest("div") as HTMLElement);
        return { opacity: Number(style.opacity), transform: style.transform };
      });

    // Wait for the entrance to start rather than to finish: the point is that
    // it never moves, and a settled element has no transform either way.
    await expect.poll(async () => (await containerStyle()).opacity).toBeGreaterThan(0);

    // Without MotionConfig the section slides in from translateY(24px) here.
    expect((await containerStyle()).transform).toBe("none");
    await expect(heading).toBeVisible();
  });
});

/**
 * A failed feed used to lead with the upstream provider's JSON body. The body
 * is worth keeping for diagnosis; it is not the headline.
 */
test.describe("failure surface", () => {
  test("states the failure in a sentence and keeps the raw body behind a disclosure", async ({
    page,
  }) => {
    await breakRoute(page, "/api/solar");
    await page.goto("/dashboard");

    await expect(
      page.getByText(/NOAA space weather is unavailable right now/i)
    ).toBeVisible();

    // The upstream text lives inside a collapsed <details>, so it is present in
    // the DOM for diagnosis and not rendered at the reader.
    const detail = page.getByText(/Simulated upstream failure/);
    await expect(detail).toHaveCount(1);
    await expect(detail).not.toBeVisible();

    await page.getByText("Technical detail", { exact: true }).first().click();
    await expect(detail).toBeVisible();
  });
});

/**
 * The favorites page carried none of the page rhythm the rest of the app uses:
 * with no top padding its heading rendered underneath the fixed navigation, and
 * with no `w-full` the layout centred it at the width of its widest child.
 */
test.describe("favorites", () => {
  const savedItem = (imageUrl?: string) => ({
    state: {
      favorites: [
        {
          id: "apod-2026-09-06",
          type: "apod",
          title: "Saved astronomy picture",
          subtitle: "2026-09-06",
          ...(imageUrl ? { imageUrl } : {}),
          date: "2026-09-06T00:00:00Z",
        },
      ],
    },
    version: 0,
  });

  const seed = (page: Page, imageUrl?: string) =>
    page.addInitScript((value) => {
      localStorage.setItem("nebula-favorites", value);
    }, JSON.stringify(savedItem(imageUrl)));

  test("the heading clears the fixed navigation", async ({ page }) => {
    // The navigation slides in on load; under reduced motion it renders at its
    // final position immediately, so the overlap can be measured directly.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await seed(page);
    await page.goto("/favorites");

    const heading = page.getByRole("heading", { name: /your favorites/i });
    await expect(heading).toBeVisible();

    const nav = page.getByRole("navigation").first();
    const navBox = await nav.boundingBox();
    const headingBox = await heading.boundingBox();
    expect(navBox).not.toBeNull();
    expect(headingBox).not.toBeNull();
    expect(headingBox!.y).toBeGreaterThan(navBox!.y + navBox!.height);
  });

  test("the page spans the viewport rather than shrinking to its content", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/favorites");

    const width = await page
      .locator("main > div")
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    expect(width).toBe(viewport!.width);
  });

  test("a saved item whose image 404s drops the broken frame", async ({
    page,
  }) => {
    const deadImage = "https://apod.nasa.gov/apod/image/removed.jpg";
    await seed(page, deadImage);
    await page.route(deadImage, (route) => route.fulfill({ status: 404 }));

    await page.goto("/favorites");
    await expect(
      page.getByRole("heading", { name: "Saved astronomy picture" })
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Saved astronomy picture" })
    ).toHaveCount(0);
  });
});

test.describe("dashboard stats bar", () => {
  test("prints measured average magnitude and ISS altitude", async ({
    page,
    request,
  }) => {
    // Both tiles read live feeds. An outage is not a regression in this repo,
    // so it is reported as a skip the way the contract suite does it.
    const quakes = await request.get("/api/earthquakes");
    const iss = await request.get("/api/iss");
    test.skip(
      quakes.status() !== 200 || iss.status() !== 200,
      "USGS or wheretheiss.at unavailable"
    );

    // The dashboard also posts to /api/ai-report, which caps itself at 10
    // calls a minute across the whole run. This test is about the stats bar,
    // so it does not spend that budget.
    await page.route("**/api/ai-report", (route) =>
      route.fulfill({ status: 200, json: { report: "Stubbed report." } })
    );

    await page.goto("/dashboard");

    const tile = (label: string) =>
      page.locator(".inset-well").filter({ hasText: label });

    // A magnitude with a decimal, not the "—" placeholder.
    await expect(tile("Avg mag · 7d")).toContainText(/\d\.\d/);

    // Measured altitude in km, three digits for any real ISS orbit.
    await expect(tile("ISS altitude")).toContainText(/\d{3}/);
    await expect(tile("ISS altitude")).toContainText("km");
  });
});

test.describe("sky almanac", () => {
  const CARDS = [
    "Moon Phase",
    "Earth Rotation",
    "Constellation of the Day",
    "Planet of the Day",
    "Mars Weather",
    "Astronomy Fact",
    "Space Quote",
  ];

  test("renders every widget with its provenance and its source", async ({
    page,
  }) => {
    await page.goto("/sky");

    for (const name of CARDS) {
      const card = page.getByRole("region", { name });
      await expect(card, `${name} card`).toBeVisible();

      // The badge says how the numbers were arrived at, and the footer names
      // the publication. A card that lost either would be presenting figures
      // with no way for a reader to check them.
      await expect(card.locator(".eyebrow").first()).toHaveText(
        /Computed|Curated|Archive/
      );
      const source = card.locator("p.eyebrow").last();
      await expect(source).not.toBeEmpty();
    }
  });

  test("the moon card computes a phase rather than a placeholder", async ({
    page,
  }) => {
    await page.goto("/sky");

    const card = page.getByRole("region", { name: "Moon Phase" });
    await expect(card).toContainText(
      /New Moon|Waxing Crescent|First Quarter|Waxing Gibbous|Full Moon|Waning Gibbous|Last Quarter|Waning Crescent/
    );
    await expect(card).toContainText(/\d+\.\d% illuminated/);
    await expect(card).toContainText(/\d,?\d{3},?\d* km/);
  });

  test("earth rotation names the equator until a latitude is given", async ({
    page,
  }) => {
    await page.goto("/sky");

    const card = page.getByRole("region", { name: "Earth Rotation" });
    // No geolocation was granted, so the card must say which latitude the
    // figure belongs to instead of implying it is the viewer's own.
    await expect(card).toContainText("Ground speed at the equator");
    await expect(card).toContainText("1,674");
  });

  test("mars weather is dated and labelled as an archive", async ({
    page,
    request,
  }) => {
    const mars = await request.get("/api/mars");
    test.skip(mars.status() !== 200, "NASA InSight unavailable");
    const { firstUtc } = await mars.json();
    const year = new Date(firstUtc).getUTCFullYear();

    await page.goto("/sky");
    const card = page.getByRole("region", { name: "Mars Weather" });

    // The regression this guards: a years-old reading rendered as current
    // conditions. The sol, its date and the mission's end all have to show.
    await expect(card.locator(".eyebrow").first()).toHaveText("Archive");
    await expect(card).toContainText(new RegExp(`Sol \\d+ · .*${year}`));
    await expect(card).toContainText(/mission ended on/i);
  });

  test("is reachable from the navigation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/dashboard");
    await page.getByRole("navigation").getByRole("link", { name: "Sky" }).click();
    await expect(page).toHaveURL(/\/sky$/);
  });
});
