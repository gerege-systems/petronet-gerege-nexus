import { defineConfig, devices } from "@playwright/test";

/**
 * The end-to-end suite: a real browser against the built app.
 *
 * It exists for the things jsdom cannot answer. Two of them are why it was
 * added at all: the console is served on its own hostname, and its frame is a
 * layout that must survive navigation between the routes under it — a rule
 * about routing, which is not a rule any single component can be asked about.
 *
 * The API is not started. Every answer is stubbed in the browser
 * (`page.route`), so this suite tests the frontend and says so; the API's own
 * behaviour is Go's to test, and a suite that needed both would be run by
 * nobody. `CONTROL_PLANE_HOST` is the same value the built-host smoke test uses.
 *
 * `next start` serves what `next build` produced, so a build has to exist:
 * `npm run test:e2e` makes one. CI already builds in the step before, and runs
 * `npx playwright test` directly rather than building twice.
 */
const PORT = 3210;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // On CI, one line per test to read in the log, and the HTML report beside it
  // so that a failure arrives with the trace of the run that produced it.
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    // A subdomain of localhost, which every browser resolves to the loopback
    // address without a hosts file. The console is only served here.
    baseURL: `http://admin.localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Production uses the same standalone server. Testing `next start` here
    // would exercise a deployment mode this image no longer ships.
    command:
      "mkdir -p .next/standalone/.next/static .next/standalone/public && " +
      "cp -R .next/static/. .next/standalone/.next/static/ && " +
      "cp -R public/. .next/standalone/public/ && " +
      "node .next/standalone/server.js",
    url: `http://nexus.localhost:${PORT}/login`,
    env: {
      CONTROL_PLANE_HOST: "admin.localhost",
      HOSTNAME: "0.0.0.0",
      PORT: String(PORT),
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
