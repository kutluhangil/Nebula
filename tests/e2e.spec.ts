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
