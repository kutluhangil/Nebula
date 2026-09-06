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
