import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  // The suite hits live upstream APIs, so a failure is worth one retry before
  // it is reported — but never more, or a real regression hides behind retries.
  retries: process.env.CI ? 1 : 0,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // "github" annotates failures inline on the PR; the HTML report is what the
  // workflow uploads as an artifact, so CI needs both.
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
