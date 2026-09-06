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
    await expect(page.getByText("27,123 km/h").first()).toBeVisible();
    await expect(page.getByText("27,600 km/h")).toHaveCount(0);
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
      .getByText("Hazardous Asteroids")
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
      .getByText("Total Events")
      .locator("xpath=preceding-sibling::div[1]");
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
